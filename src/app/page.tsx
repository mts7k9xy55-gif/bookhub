'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Loader2, ArrowLeft, BookOpen, Book, Globe, Wallet, Coins } from 'lucide-react';

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
    alert(`【Serengethi Protocol】\n\nThis text has been cast into the infinite plains (Commons).\nHash: ${arweaveHash}`);
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

  // --- Web3 Mock State ---
  const [walletConnected, setWalletConnected] = useState(false);
  const [balance, setBalance] = useState(0);
  const [isTipping, setIsTipping] = useState(false);

  const handleConnectWallet = () => {
    setWalletConnected(true);
    setBalance(1000); // Minter gives starting tokens
  };

  const handleTip = () => {
    if (!walletConnected) {
      alert("Please connect your wallet first.");
      return;
    }
    if (balance < 10) {
      alert("Insufficient balance.");
      return;
    }

    setIsTipping(true);
    setTimeout(() => {
      setBalance(prev => prev - 10);
      setIsTipping(false);
      alert(`[ Serengethi Verified ]\n\nSent: 10 Tokens\nProtocol Fee: 0.1 Tokens\nAuthor Received: 9.9 Tokens\n\n"When proving trust becomes cheaper than fiat currency, the middleman vanishes."`);
    }, 1500);
  };

  const activeDraft = drafts?.find(d => d.id === draftId);

  return (
    <main className={`min-h-screen transition-colors duration-700 font-sans selection:bg-gray-200 flex flex-col items-center justify-start ${isReadMode ? 'bg-[#FCFAF7]' : 'bg-[#FAFAFA]'}`}>

      <header className="w-full max-w-3xl flex justify-between items-center px-6 py-10 transition-opacity duration-700 opacity-40 hover:opacity-100 focus-within:opacity-100">
        <Link href="/hub" className="p-2 -ml-2 rounded-full hover:bg-black/5 transition-colors" title="Back to Hub">
          <ArrowLeft strokeWidth={1.5} size={20} />
        </Link>

        <div className="flex items-center gap-4 text-gray-400">

          {/* Wonderland Economy UI */}
          <div className="flex items-center mr-4">
            {!walletConnected ? (
              <button 
                onClick={handleConnectWallet}
                className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-black/10 text-[10px] font-bold tracking-widest uppercase hover:border-black hover:text-black transition-all"
              >
                Connect Wallet
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold tracking-widest text-black/60 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                  {balance} SGT
                </span>
                {isReadMode && (
                  <button 
                    onClick={handleTip}
                    disabled={isTipping}
                    className="px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-700 text-[10px] font-bold tracking-widest uppercase hover:bg-amber-500/20 transition-all flex items-center gap-1"
                  >
                    {isTipping ? <Loader2 size={12} className="animate-spin" /> : 'Tip Author'}
                  </button>
                )}
              </div>
            )}
          </div>

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
