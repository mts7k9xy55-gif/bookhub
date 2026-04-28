'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Globe, Share2, HardDrive, Cpu, Languages, ArrowRight, Check } from 'lucide-react';
import { Draft, db } from '@/lib/db';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface ForgePanelProps {
  isOpen: boolean;
  onClose: () => void;
  draft: Draft | null;
}

export default function ForgePanel({ isOpen, onClose, draft }: ForgePanelProps) {
  const [isDeploying, setIsDeploying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [translatedDrafts, setTranslatedDrafts] = useState<{[key: string]: string}>({});
  const [status, setStatus] = useState<'idle' | 'processing' | 'done'>('idle');
  const [license, setLicense] = useState<'private' | 'commons'>('private');

  const stripHtml = (html: string) => {
    if (typeof window === 'undefined') return html;
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
  };

  const handleForge = async () => {
    if (!draft) return;
    const apiKey = localStorage.getItem('gemini_api_key');
    if (!apiKey) {
      alert('先にMuseパネルでAPIキーをセットしてください。');
      return;
    }

    setIsDeploying(true);
    setStatus('processing');
    setProgress(10);

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite-preview' });
      const text = stripHtml(draft.content);

      // テクノロジーに翻訳を押し付ける
      const languages = ['English', 'Chinese', 'Spanish'];
      const results: {[key: string]: string} = {};

      for (let i = 0; i < languages.length; i++) {
        const lang = languages[i];
        setProgress(20 + (i * 20));
        
        const prompt = `以下の原稿を${lang}に翻訳してください。格調高く、文芸的な表現を心がけてください。出力は翻訳後の本文のみとしてください。\n\n${text}`;
        const result = await model.generateContent(prompt);
        const response = await result.response;
        results[lang] = response.text();
      }

      setTranslatedDrafts(results);
      setProgress(100);
      setStatus('done');
      
      // データベースにもメタデータを更新（雑事の完了）
      if (draft.id) {
        await db.drafts.update(draft.id, {
          targetLanguages: languages,
          arweaveHash: 'pending_' + Math.random().toString(36).substring(7),
          license: license
        });
      }
    } catch (error) {
      console.error(error);
      alert('雑事の代行中にエラーが発生しました。');
      setStatus('idle');
    } finally {
      setTimeout(() => setIsDeploying(false), 1000);
    }
  };

  if (!draft) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-24 right-8 w-80 bg-white/90 backdrop-blur-2xl border border-gray-200 shadow-2xl rounded-3xl z-40 overflow-hidden"
        >
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-sm font-semibold text-black mb-1">Forge & Deploy</h2>
                <p className="text-[10px] text-gray-400 uppercase tracking-widest">テクノロジーに雑事を任せる</p>
              </div>
              <button onClick={onClose} className="p-1 text-gray-400 hover:text-black transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              {/* 自動翻訳セクション */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Languages size={14} className="text-gray-400" />
                    <span className="text-xs font-medium text-gray-700">自動多言語展開</span>
                  </div>
                  {status === 'processing' && <Cpu size={12} className="text-black animate-spin" />}
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {['English', 'Chinese', 'Spanish'].map(lang => (
                    <div key={lang} className="flex items-center justify-between px-3 py-2 bg-white border border-gray-100 rounded-xl">
                      <span className="text-[10px] text-gray-600 font-medium">{lang}</span>
                      {translatedDrafts[lang] ? (
                        <div className="flex items-center space-x-2">
                           <span className="text-[8px] text-gray-400 truncate max-w-[100px] italic">
                             "{translatedDrafts[lang].substring(0, 20)}..."
                           </span>
                           <Check size={12} className="text-green-500" />
                        </div>
                      ) : status === 'processing' ? (
                        <div className="w-2 h-2 bg-gray-200 rounded-full animate-pulse" />
                      ) : (
                        <span className="text-[8px] text-gray-300">待機中</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Arweave永続化セクション */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                <div className="flex items-center space-x-3 mb-3">
                  <HardDrive size={14} className="text-gray-400" />
                  <span className="text-xs font-medium text-gray-700">永続的自己保有 (Arweave)</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-gray-400">Estimated Cost</span>
                    <span className="text-black font-medium">0.00042 AR</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-gray-400">Content ID</span>
                    <span className="text-gray-600 font-mono truncate ml-4">
                      {draft.arweaveHash ? draft.arweaveHash : '---'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 共有財と私有財の選択 */}
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100">
                <div className="flex items-center space-x-3 mb-3">
                  <Share2 size={14} className="text-gray-400" />
                  <span className="text-xs font-medium text-gray-700">権利と系譜の選択</span>
                </div>
                <div className="flex flex-col space-y-2">
                  <button 
                    onClick={() => setLicense('private')}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-[10px] transition-all border ${license === 'private' ? 'bg-black text-white border-black' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}
                  >
                    <span>私有 (Private)</span>
                    {license === 'private' && <Check size={12} />}
                  </button>
                  <button 
                    onClick={() => setLicense('commons')}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-[10px] transition-all border ${license === 'commons' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}
                  >
                    <span>共有財プールへ放流 (Commons)</span>
                    {license === 'commons' && <Check size={12} />}
                  </button>
                </div>
              </div>

              {/* 実行ボタン */}
              <button 
                onClick={handleForge}
                disabled={isDeploying}
                className="w-full group relative flex items-center justify-center space-x-2 py-3 bg-black text-white text-xs font-medium rounded-2xl hover:bg-gray-800 transition-all overflow-hidden"
              >
                {isDeploying ? (
                  <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                    <div className="h-full bg-white/10 absolute left-0" style={{ width: `${progress}%` }} />
                    <span className="relative z-10 flex items-center">
                      <Cpu size={14} className="animate-pulse mr-2" />
                      雑事処理中... {progress}%
                    </span>
                  </div>
                ) : (
                  <>
                    <span>Bookhubへ放出</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
