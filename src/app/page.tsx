'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Loader2, ArrowLeft, Check, BookOpen, PenLine } from 'lucide-react';

import Editor from '@/components/Editor';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';

export default function Home() {
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [draftId, setDraftId] = useState<number | null>(null);
  const [localContent, setLocalContent] = useState<string>('');
  const [isReadMode, setIsReadMode] = useState(true); // Default to read mode

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

  return (
    <main className={`min-h-screen transition-colors duration-700 font-sans selection:bg-gray-200 flex flex-col items-center justify-start ${isReadMode ? 'bg-[#FCFAF7]' : 'bg-[#FAFAFA]'}`}>
      
      <header className="w-full max-w-3xl flex justify-between items-center px-6 py-10 transition-opacity duration-700 opacity-20 hover:opacity-100 focus-within:opacity-100">
        <Link href="/hub" className="p-2 -ml-2 rounded-full hover:bg-black/5 transition-colors">
          <ArrowLeft strokeWidth={1.5} size={20} />
        </Link>

        <div className="flex items-center gap-6 text-gray-400">
          <span className="text-[10px] tracking-widest uppercase font-medium flex items-center gap-1 min-w-[60px] justify-end">
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
          
          <button 
            onClick={() => setIsReadMode(!isReadMode)} 
            className="flex items-center gap-2 p-2 rounded-full hover:text-black hover:bg-black/5 transition-all"
            title={isReadMode ? "Switch to Write Mode" : "Switch to Read Mode"}
          >
            {isReadMode ? <PenLine strokeWidth={1.5} size={20} /> : <BookOpen strokeWidth={1.5} size={20} />}
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
