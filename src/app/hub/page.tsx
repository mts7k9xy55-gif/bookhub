'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, GitFork, Search, Languages, Upload, Loader2, Key, Globe, Star, Sparkles, BookOpen } from 'lucide-react';
import { db } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { useRouter } from 'next/navigation';

const STANDARD_EBOOKS = [
  { id: 'alice', slug: 'lewis-carroll/alices-adventures-in-wonderland', title: "Alice's Adventures in Wonderland", author: 'Lewis Carroll' },
  { id: 'gatsby', slug: 'f-scott-fitzgerald/the-great-gatsby', title: 'The Great Gatsby', author: 'F. Scott Fitzgerald' },
  { id: 'metamorphosis', slug: 'franz-kafka/the-metamorphosis', title: 'The Metamorphosis', author: 'Franz Kafka' },
  { id: 'origin-of-species', slug: 'charles-darwin/on-the-origin-of-species', title: 'On the Origin of Species', author: 'Charles Darwin' },
  { id: 'frankenstein', slug: 'mary-shelley/frankenstein', title: 'Frankenstein', author: 'Mary Shelley' },
  { id: 'pride-and-prejudice', slug: 'jane-austen/pride-and-prejudice', title: 'Pride and Prejudice', author: 'Jane Austen' },
  { id: 'dracula', slug: 'bram-stoker/dracula', title: 'Dracula', author: 'Bram Stoker' },
  { id: 'time-machine', slug: 'h-g-wells/the-time-machine', title: 'The Time Machine', author: 'H. G. Wells' },
  { id: 'ulysses', slug: 'james-joyce/ulysses', title: 'Ulysses', author: 'James Joyce' },
  { id: 'war-and-peace', slug: 'leo-tolstoy/war-and-peace', title: 'War and Peace', author: 'Leo Tolstoy' },
  { id: 'moby-dick', slug: 'herman-melville/moby-dick', title: 'Moby-Dick', author: 'Herman Melville' },
  { id: 'beyond-good-and-evil', slug: 'friedrich-nietzsche/beyond-good-and-evil', title: 'Beyond Good and Evil', author: 'Friedrich Nietzsche' },
  { id: 'meditations', slug: 'marcus-aurelius/meditations', title: 'Meditations', author: 'Marcus Aurelius' },
  { id: 'republic', slug: 'plato/the-republic', title: 'The Republic', author: 'Plato' },
  { id: 'iliad', slug: 'homer/the-iliad', title: 'The Iliad', author: 'Homer' },
  { id: 'odyssey', slug: 'homer/the-odyssey', title: 'The Odyssey', author: 'Homer' },
  { id: 'inferno', slug: 'dante-alighieri/the-divine-comedy/inferno', title: 'The Divine Comedy: Inferno', author: 'Dante Alighieri' },
  { id: 'walden', slug: 'henry-david-thoreau/walden', title: 'Walden', author: 'Henry David Thoreau' },
  { id: 'leaves-of-grass', slug: 'walt-whitman/leaves-of-grass', title: 'Leaves of Grass', author: 'Walt Whitman' },
  { id: 'picture-of-dorian-gray', slug: 'oscar-wilde/the-picture-of-dorian-gray', title: 'The Picture of Dorian Gray', author: 'Oscar Wilde' },
  { id: 'crime-and-punishment', slug: 'fyodor-dostoevsky/crime-and-punishment', title: 'Crime and Punishment', author: 'Fyodor Dostoevsky' },
  { id: 'brothers-karamazov', slug: 'fyodor-dostoevsky/the-brothers-karamazov', title: 'The Brothers Karamazov', author: 'Fyodor Dostoevsky' },
  { id: 'don-quixote', slug: 'miguel-de-cervantes-saavedra/don-quixote', title: 'Don Quixote', author: 'Miguel de Cervantes' },
  { id: 'les-miserables', slug: 'victor-hugo/les-miserables', title: 'Les Misérables', author: 'Victor Hugo' },
  { id: 'anna-karenina', slug: 'leo-tolstoy/anna-karenina', title: 'Anna Karenina', author: 'Leo Tolstoy' },
  { id: 'emma', slug: 'jane-austen/emma', title: 'Emma', author: 'Jane Austen' },
  { id: 'wuthering-heights', slug: 'emily-bronte/wuthering-heights', title: 'Wuthering Heights', author: 'Emily Brontë' },
  { id: 'jane-eyre', slug: 'charlotte-bronte/jane-eyre', title: 'Jane Eyre', author: 'Charlotte Brontë' },
  { id: 'dubliners', slug: 'james-joyce/dubliners', title: 'Dubliners', author: 'James Joyce' },
  { id: 'heart-of-darkness', slug: 'joseph-conrad/heart-of-darkness', title: 'Heart of Darkness', author: 'Joseph Conrad' },
  { id: 'treasure-island', slug: 'robert-louis-stevenson/treasure-island', title: 'Treasure Island', author: 'Robert Louis Stevenson' },
  { id: 'kidnapped', slug: 'robert-louis-stevenson/kidnapped', title: 'Kidnapped', author: 'Robert Louis Stevenson' },
  { id: 'strange-case-of-dr-jekyll', slug: 'robert-louis-stevenson/the-strange-case-of-dr-jekyll-and-mr-hyde', title: 'Dr. Jekyll and Mr. Hyde', author: 'Robert Louis Stevenson' },
  { id: 'adventures-of-huckleberry-finn', slug: 'mark-twain/the-adventures-of-huckleberry-finn', title: 'Huckleberry Finn', author: 'Mark Twain' },
  { id: 'tom-sawyer', slug: 'mark-twain/the-adventures-of-tom-sawyer', title: 'Tom Sawyer', author: 'Mark Twain' },
  { id: 'kim', slug: 'rudyard-kipling/kim', title: 'Kim', author: 'Rudyard Kipling' },
  { id: 'jungle-book', slug: 'rudyard-kipling/the-jungle-book', title: 'The Jungle Book', author: 'Rudyard Kipling' },
  { id: 'portrait-of-the-artist', slug: 'james-joyce/a-portrait-of-the-artist-as-a-young-man', title: 'A Portrait of the Artist', author: 'James Joyce' },
  { id: 'sun-also-rises', slug: 'ernest-hemingway/the-sun-also-rises', title: 'The Sun Also Rises', author: 'Ernest Hemingway' },
  { id: 'tender-is-the-night', slug: 'f-scott-fitzgerald/tender-is-the-night', title: 'Tender Is the Night', author: 'F. Scott Fitzgerald' },
  { id: 'this-side-of-paradise', slug: 'f-scott-fitzgerald/this-side-of-paradise', title: 'This Side of Paradise', author: 'F. Scott Fitzgerald' },
  { id: 'beautiful-and-damned', slug: 'f-scott-fitzgerald/the-beautiful-and-damned', title: 'The Beautiful and Damned', author: 'F. Scott Fitzgerald' },
  { id: 'tales-of-the-jazz-age', slug: 'f-scott-fitzgerald/tales-of-the-jazz-age', title: 'Tales of the Jazz Age', author: 'F. Scott Fitzgerald' }
];

const getGradient = (title: string) => {
  const hash = Array.from(title).reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
  const hue1 = Math.abs(hash % 360);
  const hue2 = (hue1 + 40 + Math.abs((hash >> 8) % 60)) % 360;
  return `linear-gradient(135deg, hsl(${hue1}, 20%, 30%), hsl(${hue2}, 30%, 15%))`;
};

function BookCard({ book, onFork, isTranslating, isCommunity = false }: { book: any, onFork: (book: any, translate: boolean) => void, isTranslating: boolean, isCommunity?: boolean }) {
  const gradient = getGradient(book.title);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex flex-col group cursor-pointer relative h-full">
      <div 
        className="aspect-[2/3] w-full rounded-md shadow-md group-hover:shadow-xl transition-all duration-500 relative overflow-hidden flex flex-col p-5 border border-white/10 group-hover:-translate-y-1"
        style={{ background: gradient }}
      >
        {isCommunity && (
          <div className="absolute top-3 left-3 z-20 flex space-x-1">
             <div className="bg-blue-500/80 backdrop-blur-sm text-white p-1 rounded-full"><Globe size={10} /></div>
             <div className="bg-amber-400/80 backdrop-blur-sm text-black p-1 rounded-full"><Sparkles size={10} /></div>
          </div>
        )}
        
        {/* Beautiful CSS Book Cover */}
        <div className="flex-1 flex flex-col items-center justify-between text-center relative z-10 py-2 border border-white/10 rounded-sm">
          <p className="text-[9px] font-medium tracking-[0.2em] uppercase text-white/70 px-2 line-clamp-2">{book.author}</p>
          <h3 className="text-sm md:text-base font-serif italic text-white/90 leading-snug px-3 line-clamp-4 shadow-black drop-shadow-sm">{book.title}</h3>
          <div className="w-6 h-[1px] bg-white/30" />
        </div>

        {/* Hover Actions Overlay */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center space-y-3 z-30">
          <button 
            onClick={(e) => { e.stopPropagation(); onFork(book, true); }} 
            disabled={isTranslating} 
            className="text-[10px] font-bold tracking-widest uppercase bg-white text-black px-6 py-2.5 rounded-full hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 flex items-center space-x-2"
          >
            <Languages size={14} />
            <span>{isCommunity ? 'Read' : 'Translate'}</span>
          </button>
          {!isCommunity && (
            <button 
              onClick={(e) => { e.stopPropagation(); onFork(book, false); }} 
              disabled={isTranslating} 
              className="text-[10px] font-bold tracking-widest uppercase border border-white text-white px-6 py-2.5 rounded-full hover:bg-white/10 active:scale-95 transition-all disabled:opacity-50 flex items-center space-x-2"
            >
              <GitFork size={14} />
              <span>Fork</span>
            </button>
          )}
        </div>
      </div>
      
      {/* Optional sub-label for clean layout without messy heights */}
      <div className="mt-4 flex flex-col items-center text-center opacity-0 group-hover:opacity-100 transition-opacity duration-500 absolute -bottom-8 left-0 right-0">
        <span className="text-[10px] font-medium text-gray-400 tracking-wider">Bookhub Archive</span>
      </div>
    </motion.div>
  );
}

export default function Hub() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'classics' | 'community'>('classics');
  const [isTranslating, setIsTranslating] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [apiKey, setApiKey] = useState('');
  const [hasKey, setHasKey] = useState(false);

  const communityBooks = useLiveQuery(() => db.drafts.where('isCommitted').equals(1).toArray()) || [];

  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) { setApiKey(savedKey); setHasKey(true); }
  }, []);

  const handleSaveKey = () => {
    if (apiKey.trim()) { localStorage.setItem('gemini_api_key', apiKey); setHasKey(true); }
  };

  const translateChunk = async (text: string, currentKey: string) => {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, apiKey: currentKey })
    });
    if (!response.ok) throw new Error('Translation failed');
    const data = await response.json();
    return data.translatedText;
  };

  const handleFork = async (book: any, translate: boolean = false) => {
    const currentKey = localStorage.getItem('gemini_api_key');
    setIsTranslating(book.title);
    try {
      if (book.content) {
        await db.drafts.add({ ...book, id: undefined, isCommitted: false, updatedAt: new Date() });
      } else {
        const fetchRes = await fetch('/api/fetch-book', { method: 'POST', body: JSON.stringify({ slug: book.slug }) });
        const { content: rawContent } = await fetchRes.json();
        let finalContent = rawContent;
        if (translate) {
          if (!currentKey) throw new Error('API Key Required');
          const paragraphs = rawContent.split(/<\/p>/i);
          let translated = "";
          for (let i = 0; i < Math.min(paragraphs.length, 10); i++) {
             const res = await translateChunk(paragraphs[i], currentKey);
             translated += res;
             setUploadProgress(Math.round(((i + 1) / 10) * 100));
          }
          finalContent = translated;
        }
        await db.drafts.add({ title: book.title + (translate ? ' (JP)' : ''), author: book.author, content: finalContent, updatedAt: new Date(), isCommitted: false });
      }
      router.push('/');
    } catch (e: any) { alert(`Error: ${e.message}`); }
    finally { setIsTranslating(null); }
  };

  return (
    <main className="min-h-screen bg-[#FAFAFA] p-8 sm:p-16 text-[#1a1a1a] font-sans selection:bg-gray-200">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col mb-16 space-y-12">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center space-x-2 text-[11px] font-bold tracking-widest uppercase opacity-40 hover:opacity-100 transition-opacity"><ArrowLeft size={16} /><span>Studio</span></Link>
            <div className="flex items-center space-x-6">
              {!hasKey && (
                <div className="flex items-center border-b border-black/10 pb-1">
                  <input type="password" placeholder="Gemini API Key" className="bg-transparent text-[10px] focus:outline-none w-32 tracking-widest" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
                  <button onClick={handleSaveKey} className="ml-2 opacity-30 hover:opacity-100"><Key size={12} /></button>
                </div>
              )}
              <div className="text-[10px] font-bold tracking-widest uppercase opacity-30 flex items-center gap-1"><Globe size={12}/><span>Protocol v0.1</span></div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-end justify-between gap-8 border-b border-black/5 pb-10">
            <div className="space-y-6">
              <h1 className="text-4xl sm:text-5xl font-serif tracking-tight text-[#1a1a1a] flex items-center gap-4">
                <BookOpen size={36} className="opacity-20" />
                The Hub
              </h1>
              <div className="flex items-center space-x-8">
                <button onClick={() => setActiveTab('classics')} className={`text-[11px] font-bold tracking-widest uppercase transition-all ${activeTab === 'classics' ? 'opacity-100 border-b-2 border-black pb-1' : 'opacity-30 hover:opacity-60'}`}>Archive</button>
                <button onClick={() => setActiveTab('community')} className={`text-[11px] font-bold tracking-widest uppercase transition-all ${activeTab === 'community' ? 'opacity-100 border-b-2 border-blue-600 text-blue-600 pb-1' : 'opacity-30 hover:opacity-60'}`}>Community Hub</button>
              </div>
            </div>
            <div className="w-full sm:w-72 bg-white px-4 py-2.5 rounded-full border border-black/5 shadow-sm flex items-center focus-within:border-black/20 focus-within:shadow-md transition-all">
              <Search className="opacity-30 mr-3" size={16} />
              <input type="text" placeholder="Search the protocol..." className="bg-transparent w-full focus:outline-none text-sm font-medium" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
          </div>
        </header>

        {isTranslating && (
          <div className="fixed inset-0 z-50 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
            <Loader2 className="animate-spin mb-4 opacity-50" size={32} />
            <p className="font-serif italic text-lg">{isTranslating}</p>
            <p className="text-[10px] font-bold tracking-widest uppercase mt-4 opacity-40">Translating...</p>
          </div>
        )}

        <AnimatePresence mode="wait">
          {activeTab === 'classics' ? (
            <motion.section key="classics" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="pb-20">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-8 gap-y-12">
                {STANDARD_EBOOKS.filter(b => b.title.toLowerCase().includes(searchQuery.toLowerCase()) || b.author.toLowerCase().includes(searchQuery.toLowerCase())).map((book) => (
                  <BookCard key={book.id + book.slug} book={book} onFork={handleFork} isTranslating={!!isTranslating} />
                ))}
              </div>
            </motion.section>
          ) : (
            <motion.section key="community" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="pb-20">
              {communityBooks.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center space-y-4 opacity-30">
                   <Globe size={48} className="opacity-50" />
                   <p className="text-[11px] font-bold tracking-widest uppercase text-center leading-relaxed">No Public Editions Yet<br/>Be the first to orchestrate the commons</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-8 gap-y-12">
                  {communityBooks.map((book: any) => (
                    <BookCard key={book.id} book={book} onFork={handleFork} isTranslating={!!isTranslating} isCommunity={true} />
                  ))}
                </div>
              )}
            </motion.section>
          )}
        </AnimatePresence>

      </div>
    </main>
  );
}
