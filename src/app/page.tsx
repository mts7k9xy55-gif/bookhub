'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Cloud, Loader2, Sparkles, Bookmark, Cpu, ArrowLeft, Check, Maximize } from 'lucide-react';

import Editor from '@/components/Editor';
import MusePanel from '@/components/MusePanel';
import HistoryPanel from '@/components/HistoryPanel';
import ForgePanel from '@/components/ForgePanel';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';

export default function Home() {
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [draftId, setDraftId] = useState<number | null>(null);
  const [localContent, setLocalContent] = useState<string>('');

  const [isMuseOpen, setIsMuseOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isForgeOpen, setIsForgeOpen] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);

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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFocusMode) {
        setIsFocusMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocusMode]);

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

  const handleRestore = useCallback((content: string) => {
    handleUpdate(content);
  }, [handleUpdate]);

  const handlePublish = useCallback(async () => {
    if (!draftId || !localContent) return;
    setSaveStatus('saving');
    const arweaveHash = `ar://${Math.random().toString(36).substring(2, 15)}`;
    await db.drafts.update(draftId, { 
      isCommitted: true, 
      content: localContent, 
      updatedAt: new Date(),
      arweaveHash,
      license: 'commons'
    });
    alert(`【Bookhub Protocol】\n\nこの本は世界へ放流されました。\nHash: ${arweaveHash}`);
    const newId = await db.drafts.add({
      title: 'A New Journey',
      content: '',
      updatedAt: new Date(),
      isCommitted: false
    });
    setDraftId(newId ?? null);
    setLocalContent('');
    setTimeout(() => setSaveStatus('saved'), 500);
  }, [draftId, localContent]);

  const activeDraft = drafts?.find(d => d.id === draftId);

  return (
    <main className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-start text-gray-800 font-sans selection:bg-gray-200">
      
      {/* 最小限で邪魔にならないヘッダー */}
      <header className={`w-full max-w-3xl flex justify-between items-center px-6 py-10 transition-all duration-700 ${isFocusMode ? 'opacity-0 pointer-events-none -translate-y-4' : 'opacity-40 hover:opacity-100 focus-within:opacity-100'}`}>
        <Link href="/hub" className="text-gray-400 hover:text-gray-800 transition-colors flex items-center gap-2 text-sm font-medium tracking-wide">
          <ArrowLeft size={18} />
        </Link>

        <div className="flex items-center gap-6 text-gray-400">
          <span className="text-xs tracking-wider uppercase font-medium flex items-center gap-1 min-w-[60px] justify-end">
            {saveStatus === 'saving' ? (
              <span className="animate-pulse">Saving...</span>
            ) : saveStatus === 'saved' ? (
              <>
                <Check size={12} />
                <span>Saved</span>
              </>
            ) : (
              <span className="text-red-400">Error</span>
            )}
          </span>
          <button onClick={() => setIsFocusMode(true)} title="Focus Mode (Press Esc to exit)" className="hover:text-gray-800 transition-colors"><Maximize size={18} /></button>
          <button onClick={() => setIsForgeOpen(!isForgeOpen)} title="Forge" className="hover:text-gray-800 transition-colors"><Cpu size={18} /></button>
          <button onClick={() => setIsHistoryOpen(true)} title="History" className="hover:text-gray-800 transition-colors"><Bookmark size={18} /></button>
          <button onClick={() => setIsMuseOpen(!isMuseOpen)} title="Muse" className="hover:text-gray-800 transition-colors"><Sparkles size={18} /></button>
          <button onClick={handlePublish} title="Publish" className="hover:text-gray-800 transition-colors"><Cloud size={18} /></button>
        </div>
      </header>

      {/* エディタ本体（シンプルで集中できる） */}
      <article className={`w-full max-w-2xl px-6 mt-16 mb-40 transition-transform duration-700 ${isFocusMode ? '-translate-y-12' : ''}`}>
        {draftId === null ? (
          <div className="flex justify-center text-gray-300 mt-20"><Loader2 className="animate-spin" /></div>
        ) : (
          <div className="text-[18px] leading-[2.2] text-[#2c2c2c]">
            <Editor initialContent={activeDraft?.content || ''} onUpdate={handleUpdate} />
          </div>
        )}
      </article>

      <MusePanel isOpen={isMuseOpen} onClose={() => setIsMuseOpen(false)} currentContent={localContent} />
      <HistoryPanel isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} commits={drafts?.filter(d => d.isCommitted) || []} currentContent={localContent} onRestore={handleRestore} />
      <ForgePanel isOpen={isForgeOpen} onClose={() => setIsForgeOpen(false)} draft={activeDraft || null} />
    </main>
  );
}
