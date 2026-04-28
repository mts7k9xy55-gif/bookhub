'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Loader2, ArrowLeft, BookOpen, Book, Globe } from 'lucide-react';

import Editor from '@/components/Editor';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';

export default function Home() {
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [draftId, setDraftId] = useState<number | null>(null);
  const [localContent, setLocalContent] = useState<string>('');
  const [isReadMode, setIsReadMode] = useState(true);

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

  const handlePublish = useCallback(async () => {
    if (!draftId || !localContent) return;
    const arweaveHash = `ar://${Math.random().toString(36).substring(2, 15)}`;
    await db.drafts.update(draftId, { 
      isCommitted: true, 
      content: localContent, 
      updatedAt: new Date(),
      arweaveHash: arweaveHash,
      license: 'commons'
    });
    alert(`【Bookhub Protocol】\n\nThis text has been cast into the commons.\nHash: ${arweaveHash}`);
    setIsReadMode(true);
    // Create a new empty draft for the next session
    const newId = await db.drafts.add({
      title: 'A New Journey',
      content: '',
      updatedAt: new Date(),
      isCommitted: false
    });
    setDraftId(newId ?? null);
    setLocalContent('');
  }, [draftId, localContent]);

  const activeDraft = drafts?.find(d => d.id === draftId);

  return (
    <main className={`min-h-screen transition-colors duration-700 font-sans selection:bg-gray-200 flex flex-col items-center justify-start ${isReadMode ? 'bg-[#FCFAF7]' : 'bg-[#FAFAFA]'}`}>
      
      <header className="w-full max-w-3xl flex justify-between items-center px-6 py-10 transition-opacity duration-700 opacity-30 hover:opacity-100 focus-within:opacity-100">
        <Link href="/hub" className="p-2 -ml-2 rounded-full hover:bg-black/5 transition-colors" title="Back to Hub">
          <ArrowLeft strokeWidth={1.5} size={20} />
        </Link>

        <div className="flex items-center gap-4 text-gray-400">
          {!isReadMode && (
            <button 
              onClick={handlePublish}
              className="flex items-center justify-center p-2 rounded-full hover:text-black hover:bg-black/5 transition-all"
              title="Cast to the Commons"
            >
              <Globe strokeWidth={1.5} size={18} />
            </button>
          )}

          <button 
            onClick={() => setIsReadMode(!isReadMode)} 
            className={`flex items-center justify-center px-5 py-2.5 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase transition-all ${isReadMode ? 'bg-black text-white hover:bg-black/80 shadow-md hover:scale-105 active:scale-95' : 'bg-transparent text-gray-500 border border-black/10 hover:border-black/30 hover:text-black active:scale-95'}`}
            title={isReadMode ? "Switch to Write Mode" : "Switch to Read Mode"}
          >
            {isReadMode ? <Book strokeWidth={2} size={14} className="mr-2.5" /> : <BookOpen strokeWidth={2} size={14} className="mr-2.5" />}
            {isReadMode ? 'Write' : 'Read'}
          </button>
        </div>
      </header>

      <article className="w-full max-w-2xl px-6 mt-8 mb-40">
        {draftId === null ? (
          <div className="flex justify-center text-gray-300 mt-20"><Loader2 className="animate-spin" /></div>
        ) : (
          <div className={`transition-all duration-700 ${isReadMode ? 'font-serif text-[21px] leading-[2.1] text-[#1a1a1a] opacity-90' : 'text-[18px] leading-[2.2] text-[#2c2c2c]'}`}>
            <Editor initialContent={activeDraft?.content || ''} onUpdate={handleUpdate} editable={!isReadMode} />
          </div>
        )}
      </article>

    </main>
  );
}
