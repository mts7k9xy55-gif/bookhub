'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Bookmark, ArrowLeft } from 'lucide-react';
import { Draft } from '@/lib/db';
import { format } from 'date-fns';
import { useState } from 'react';
import { diffWords } from 'diff';

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  commits: Draft[];
  currentContent: string;
  onRestore: (content: string) => void;
}

export default function HistoryPanel({ isOpen, onClose, commits, currentContent, onRestore }: HistoryPanelProps) {
  const [selectedCommit, setSelectedCommit] = useState<Draft | null>(null);

  // HTMLタグを除去して純粋なテキストで差分を見るための簡易関数
  const stripHtml = (html: string) => {
    if (typeof window === 'undefined') return html;
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
  };

  const currentText = stripHtml(currentContent);

  const renderDiff = (oldText: string, newText: string) => {
    const diff = diffWords(oldText, newText);
    return (
      <div className="whitespace-pre-wrap text-sm leading-loose">
        {diff.map((part, index) => {
          const color = part.added ? 'bg-green-100 text-green-800 px-1 rounded-sm' :
                        part.removed ? 'bg-red-100 text-red-800 px-1 rounded-sm line-through' :
                        'text-gray-600';
          return <span key={index} className={color}>{part.value}</span>;
        })}
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '-100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '-100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed top-0 left-0 w-full sm:w-96 h-full bg-[#fafafa]/95 backdrop-blur-xl border-r border-gray-200 shadow-2xl z-50 flex flex-col"
        >
          <div className="flex justify-between items-center p-6 border-b border-gray-100">
            <h2 className="font-medium text-gray-800 flex items-center space-x-2">
              <Bookmark size={18} className="text-gray-400" />
              <span>Snapshots</span>
            </h2>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-black rounded-full hover:bg-gray-100 transition-colors">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {!selectedCommit ? (
              <div className="space-y-4">
                {commits.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center mt-10 leading-relaxed">
                    まだスナップショットはありません。<br/>執筆の節目で、右上のボタンから保存しましょう。
                  </p>
                ) : (
                  commits.map(commit => (
                    <button
                      key={commit.id}
                      onClick={() => setSelectedCommit(commit)}
                      className="w-full text-left p-4 rounded-2xl bg-white border border-gray-100 hover:border-gray-300 hover:shadow-sm transition-all group"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium text-gray-800 group-hover:text-black">
                          {commit.title || 'Snapshot'}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {format(commit.updatedAt, 'MM/dd HH:mm')}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 line-clamp-2">
                        {stripHtml(commit.content) || '白紙'}
                      </p>
                    </button>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <button 
                  onClick={() => setSelectedCommit(null)}
                  className="flex items-center space-x-2 text-xs text-gray-500 hover:text-black transition-colors"
                >
                  <ArrowLeft size={14} />
                  <span>一覧に戻る</span>
                </button>
                
                <div>
                  <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-4">
                    過去との差分
                  </h3>
                  <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-inner">
                    {renderDiff(stripHtml(selectedCommit.content), currentText)}
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-100">
                  <button 
                    onClick={() => {
                      if (selectedCommit) {
                        onRestore(selectedCommit.content);
                        onClose();
                        setSelectedCommit(null);
                      }
                    }}
                    className="w-full py-2.5 bg-black text-white hover:bg-gray-800 text-xs font-medium rounded-full transition-colors"
                  >
                    この状態を復元する
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}