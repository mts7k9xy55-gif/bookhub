'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Loader2, ArrowLeft, BookOpen, Book, Globe, Coins } from 'lucide-react';

import Editor from '@/components/Editor';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';

export default function Home() {
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [draftId, setDraftId] = useState<number | null>(null);
  const [localContent, setLocalContent] = useState<string>('');
  const [isReadMode, setIsReadMode] = useState(true);
  const [language, setLanguage] = useState<'en' | 'ja'>('en');

  const drafts = useLiveQuery(() => 
    db.drafts.orderBy('updatedAt').reverse().toArray()
  );

  useEffect(() => {
    if (drafts === undefined) return;

    if (draftId === null) {
      const activeDraft = drafts.find(d => !d.isCommitted);
      if (activeDraft) {
        setDraftId(activeDraft.id!);
        setLocalContent(activeDraft.content);
      } else {
        db.drafts.add({
          title: 'Untitled',
          content: '',
          updatedAt: new Date(),
          isCommitted: false
        }).then(id => setDraftId(id ?? null));
      }
    }
  }, [drafts, draftId]);

  const handleUpdate = useCallback((newContent: string) => {
    setLocalContent(newContent);
    if (!draftId) return;
    setSaveStatus('saving');
    db.drafts.update(draftId, {
      content: newContent,
      updatedAt: new Date()
    }).then(() => {
      setTimeout(() => setSaveStatus('saved'), 500);
    }).catch(() => setSaveStatus('error'));
  }, [draftId]);

  const activeDraft = drafts?.find(d => d.id === draftId);

  // --- Progressive Loading & Translation Logic ---
  const [displayChunks, setDisplayChunks] = useState<string[]>([]);
  const [translatedChunks, setTranslatedChunks] = useState<string[]>([]);
  const [allParagraphs, setAllParagraphs] = useState<string[]>([]);
  const [chunkIndex, setChunkIndex] = useState(0);
  const [isTranslating, setIsTranslating] = useState(false);
  const CHUNK_SIZE = 30;

  useEffect(() => {
    if (activeDraft?.content) {
      const parts = activeDraft.content.match(/<(p|h1|h2|h3|blockquote)[^>]*>([\s\S]*?)<\/\1>/gi) || [activeDraft.content];
      setAllParagraphs(parts);
      setDisplayChunks([parts.slice(0, CHUNK_SIZE).join('')]);
      setTranslatedChunks([]);
      setChunkIndex(1);
      setLanguage('en');
    }
  }, [activeDraft?.content]);

  const translateChunk = async (html: string) => {
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: html })
      });
      const data = await res.json();
      return data.translatedText;
    } catch (e) {
      return "Translation failed.";
    }
  };

  // 言語設定を永続化
  useEffect(() => {
    const savedLang = localStorage.getItem('bookhub-language') as 'en' | 'ja';
    if (savedLang) setLanguage(savedLang);
  }, []);

  const handleLanguageSwitch = async (lang: 'en' | 'ja') => {
    setLanguage(lang);
    localStorage.setItem('bookhub-language', lang);
    if (lang === 'ja' && translatedChunks.length === 0) {
      if (activeDraft?.translatedContent) {
        setTranslatedChunks([activeDraft.translatedContent]);
        return;
      }
      setIsTranslating(true);
      const firstChunkTranslated = await translateChunk(displayChunks[0]);
      setTranslatedChunks([firstChunkTranslated]);
      if (draftId) await db.drafts.update(draftId, { translatedContent: firstChunkTranslated });
      setIsTranslating(false);
    }
  };

  // --- Background Pre-translation (Buffering) ---
  useEffect(() => {
    const bufferNext = async () => {
      // 日本語モードかつ、まだ翻訳していない続きがある場合
      if (language === 'ja' && chunkIndex * CHUNK_SIZE < allParagraphs.length && !isTranslating) {
        const nextChunk = allParagraphs.slice(chunkIndex * CHUNK_SIZE, (chunkIndex + 1) * CHUNK_SIZE).join('');
        
        setIsTranslating(true);
        const nextTranslated = await translateChunk(nextChunk);
        
        setDisplayChunks(prev => [...prev, nextChunk]);
        setTranslatedChunks(prev => [...prev, nextTranslated]);
        setChunkIndex(prev => prev + 1);

        if (draftId && activeDraft) {
            const currentFullJa = (activeDraft.translatedContent || "") + nextTranslated;
            await db.drafts.update(draftId, { translatedContent: currentFullJa });
        }
        setIsTranslating(false);
      }
    };

    // ユーザーが底に近づく前に、少しずつ裏で翻訳を進める
    const timer = setTimeout(bufferNext, 1000); 
    return () => clearTimeout(timer);
  }, [language, chunkIndex, allParagraphs, isTranslating, draftId, activeDraft]);

  const loadMore = useCallback(() => {
      // スクロール読み込みはバッファリング useEffect が兼任する
  }, []);

  // スクロール監視
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 1000) {
        loadMore();
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadMore]);

  return (
    <main lang={language} className={`min-h-screen transition-colors duration-1000 font-sans selection:bg-gray-200 flex flex-col items-start justify-start ${isReadMode ? 'bg-[#FDFBF7]' : 'bg-[#FFFFFF]'}`}>
      
      <header className="w-full max-w-4xl flex justify-between items-center px-8 sm:px-20 py-10 transition-opacity duration-700 opacity-40 hover:opacity-100 focus-within:opacity-100">
        <div className="flex items-center gap-6">
            <Link href="/hub" className="p-2 -ml-2 rounded-full hover:bg-black/5 transition-colors" title="Discovery (Hub)">
                <Search strokeWidth={1.5} size={20} />
            </Link>
            <div className="h-4 w-[1px] bg-black/10"></div>
            <div className="flex items-center bg-black/5 rounded-full p-1">
                <button 
                    onClick={() => handleLanguageSwitch('en')}
                    className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase transition-all ${language === 'en' ? 'bg-white text-black shadow-sm' : 'text-black/40'}`}
                >En</button>
                <button 
                    onClick={() => handleLanguageSwitch('ja')}
                    className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase transition-all ${language === 'ja' ? 'bg-white text-black shadow-sm' : 'text-black/40'}`}
                >Jp</button>
            </div>
            {isTranslating && <Loader2 size={12} className="animate-spin opacity-40" />}
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsReadMode(!isReadMode)} 
            className={`flex items-center justify-center px-6 py-2.5 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase transition-all shadow-sm ${isReadMode ? 'bg-black text-white hover:scale-105' : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'}`}
            title={isReadMode ? "Fork this text" : "Return to Reading"}
          >
            {isReadMode ? <RefreshCw strokeWidth={2} size={14} className="mr-2.5" /> : <BookOpen strokeWidth={2} size={14} className="mr-2.5" />}
            {isReadMode ? 'Fork' : 'Read'}
          </button>
        </div>
      </header>

      <article lang={language} className={`w-full max-w-4xl px-8 sm:px-20 mt-8 mb-40 text-left ${language === 'ja' ? 'font-serif tracking-normal' : 'font-serif tracking-wide'}`}>
        {draftId === null ? (
          <div className="flex justify-start text-gray-300 mt-20 ml-20"><Loader2 className="animate-spin" /></div>
        ) : (
          <div className={`transition-all duration-700 ${isReadMode ? 'text-[22px] leading-[2.2] text-[#1a1a1a] antialiased' : 'text-[18px] leading-[2.2] text-[#2c2c2c]'}`}>
            {isReadMode ? (
              /* Static HTML rendering in chunks for stable translation and performance */
              <div className="prose prose-stone prose-lg max-w-none flex flex-col gap-0 [&_p]:mb-8 [&_h1]:mb-12 [&_h1]:mt-24 [&_h2]:mt-20 [&_h2]:mb-8 [&_blockquote]:border-l-2 [&_blockquote]:pl-8 [&_blockquote]:italic [&_blockquote]:opacity-60">
                {(language === 'ja' ? translatedChunks : displayChunks).map((chunk, i) => (
                  <div 
                    key={i} 
                    className="book-chunk"
                    dangerouslySetInnerHTML={{ __html: chunk }} 
                  />
                ))}
              </div>
            ) : (

              <Editor initialContent={activeDraft?.content || ''} onUpdate={handleUpdate} editable={true} />
            )}
          </div>
        )}
      </article>

    </main>
  );
}
