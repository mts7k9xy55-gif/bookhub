'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { X, Send, Key } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface MusePanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentContent: string;
}

export default function MusePanel({ isOpen, onClose, currentContent }: MusePanelProps) {
  const [apiKey, setApiKey] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const [messages, setMessages] = useState<{role: 'user'|'model', text: string}[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [modelType, setModelType] = useState<'flash' | 'pro'>('flash');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dragControls = useDragControls();

  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) {
      setApiKey(savedKey);
      setHasKey(true);
    }
  }, []);

  const handleSaveKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('gemini_api_key', apiKey);
      setHasKey(true);
    }
  };

  const handleClearKey = () => {
    localStorage.removeItem('gemini_api_key');
    setApiKey('');
    setHasKey(false);
  };

  const stripHtml = (html: string) => {
    if (typeof window === 'undefined') return html;
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
  };

  const handleSend = async () => {
    if (!input.trim() || !hasKey) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const modelName = modelType === 'flash' ? 'gemini-3.1-flash-lite-preview' : 'gemini-3.1-pro-preview';
      const model = genAI.getGenerativeModel({ model: modelName });
      
      const plainTextContent = stripHtml(currentContent);
      const systemPrompt = `あなたは「Muse」という名の知的コンシェルジュであり、執筆者のバディです。ユーザーが今書いている原稿の内容は以下です。これを踏まえて、深く、美しく、ミニマルな助言を行ってください。\n\n【現在の原稿内容】\n${plainTextContent}\n\n`;
      
      const history = messages.map(m => `${m.role === 'user' ? 'User' : 'Muse'}: ${m.text}`).join('\n');
      const prompt = `${systemPrompt}\n${history}\nUser: ${userMessage}\nMuse:`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      setMessages(prev => [...prev, { role: 'model', text }]);
    } catch (error: any) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: `Museとの通信に失敗しました。APIキーが間違っているか、通信エラーです。(${error.message})` }]);
      if (error.message.includes('API key')) {
         handleClearKey();
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          drag
          dragControls={dragControls}
          dragListener={false}
          dragMomentum={false}
          initial={{ y: 50, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 50, opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          style={{ resize: 'both', overflow: 'hidden' }}
          className="fixed top-24 right-8 min-w-[320px] min-h-[400px] w-[24rem] h-[36rem] bg-[#fafafa]/95 backdrop-blur-xl border border-gray-200 shadow-2xl rounded-2xl z-50 flex flex-col"
        >
          <div 
            onPointerDown={(e) => dragControls.start(e)}
            className="flex justify-between items-center p-4 border-b border-gray-100 cursor-grab active:cursor-grabbing bg-white/50"
          >
            <h2 className="font-medium text-gray-800 flex items-center space-x-2 pointer-events-none">
              <span className="text-xl">✨</span>
              <span className="flex flex-col">
                <span>Muse</span>
                <div className="flex items-center space-x-1 mt-1 pointer-events-auto">
                  <button 
                    onClick={() => setModelType('flash')}
                    className={`px-1.5 py-0.5 text-[8px] rounded-md transition-all ${modelType === 'flash' ? 'bg-black text-white' : 'bg-gray-100 text-gray-400 hover:text-black'}`}
                  >
                    FLASH
                  </button>
                  <button 
                    onClick={() => setModelType('pro')}
                    className={`px-1.5 py-0.5 text-[8px] rounded-md transition-all ${modelType === 'pro' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-400 hover:text-blue-600'}`}
                  >
                    PRO
                  </button>
                </div>
              </span>
            </h2>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-black rounded-full hover:bg-gray-100 transition-colors">
              <X size={18} />
            </button>
          </div>

          {!hasKey ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center overflow-y-auto">
              <Key size={32} className="text-gray-300 mb-4" />
              <h3 className="text-sm font-medium text-gray-600 mb-2">知性の鍵をセットする</h3>
              <p className="text-xs text-gray-400 mb-6 leading-relaxed">
                あなたの Gemini APIキー を入力して、Museを目覚めさせてください。<br/>
                キーはあなたのブラウザにのみ安全に保存されます。
              </p>
              <input
                type="password"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full text-sm px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-gray-400 mb-4 bg-white"
              />
              <button
                onClick={handleSaveKey}
                className="px-6 py-2.5 bg-black text-white text-xs font-medium rounded-full hover:bg-gray-800 transition-colors"
              >
                連携する
              </button>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.length === 0 && (
                  <div className="text-center text-xs text-gray-400 mt-10 leading-relaxed">
                    私はMuse。<br/>あなたの原稿を全て理解しています。<br/><br/>続きの展開、比喩の相談など、<br/>何でもどうぞ。
                  </div>
                )}
                {messages.map((msg, i) => (
                  <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[90%] rounded-[1.25rem] px-5 py-4 text-[13px] leading-[1.8] tracking-wide ${
                      msg.role === 'user' 
                        ? 'bg-black text-white' 
                        : 'bg-white border border-gray-100 text-gray-800 shadow-sm'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex items-start">
                    <div className="bg-gray-100 text-gray-500 rounded-2xl px-4 py-3 text-sm flex space-x-1">
                      <span className="animate-bounce">.</span><span className="animate-bounce" style={{animationDelay: '0.1s'}}>.</span><span className="animate-bounce" style={{animationDelay: '0.2s'}}>.</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-4 border-t border-gray-100 bg-white/50">
                <div className="relative">
                  <textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder="Museに相談する..."
                    className="w-full pl-4 pr-12 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:border-gray-400 text-sm resize-none"
                    rows={1}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-black disabled:opacity-50 transition-colors"
                  >
                    <Send size={16} />
                  </button>
                </div>
                <div className="flex justify-end mt-2">
                   <button onClick={handleClearKey} className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors">
                     鍵を解除
                   </button>
                </div>
              </div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
