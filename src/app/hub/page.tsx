'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Languages, Loader2, Key, BookOpen, Book, Upload, RefreshCw } from 'lucide-react';
import { db } from '@/lib/db';
import { useRouter } from 'next/navigation';

const STANDARD_EBOOKS = [
  { id: 'alice', slug: 'lewis-carroll/alices-adventures-in-wonderland', title: "Alice's Adventures in Bookhub", author: 'Lewis Carroll' },
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
  return `linear-gradient(135deg, hsl(${hue1}, 10%, 40%), hsl(${hue2}, 15%, 20%))`;
};

function BookCard({ book, onOpen, isTranslating }: { book: any, onOpen: (book: any, translate: boolean) => void, isTranslating: boolean }) {
  const gradient = getGradient(book.title);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex flex-col group cursor-pointer relative h-full" onClick={() => onOpen(book, false)}>
      <div 
        className="aspect-[2/3] w-full rounded-sm shadow-md group-hover:shadow-2xl transition-all duration-700 relative overflow-hidden flex flex-col p-6 border border-white/5 group-hover:-translate-y-2"
        style={{ background: gradient }}
      >
        <div className="flex-1 flex flex-col items-center justify-center text-center relative z-10 space-y-4">
          <p className="text-[8px] font-medium tracking-[0.3em] uppercase text-white/50">{book.author}</p>
          <h3 className="text-sm md:text-base font-serif italic text-white/90 leading-snug line-clamp-4 drop-shadow-sm">{book.title}</h3>
        </div>

        <div className="absolute inset-0 bg-black/80 backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center space-x-6 z-30">
          <button 
            onClick={(e) => { e.stopPropagation(); onOpen(book, false); }} 
            disabled={isTranslating} 
            title="Open Native"
            className="p-4 rounded-full text-white/70 hover:text-white hover:bg-white/10 active:scale-95 transition-all disabled:opacity-50"
          >
            <Book strokeWidth={1.5} size={22} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onOpen(book, true); }} 
            disabled={isTranslating} 
            title="Translate via Gemini 3.0"
            className="p-4 rounded-full text-white/70 hover:text-white hover:bg-white/10 active:scale-95 transition-all disabled:opacity-50"
          >
            <Languages strokeWidth={1.5} size={22} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function Hub() {
  const router = useRouter();
  const [isTranslating, setIsTranslating] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const [randomBooks, setRandomBooks] = useState<any[]>([]);
  const [isShuffling, setIsShuffling] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const shuffleBooks = () => {
    setIsShuffling(true);
    setTimeout(() => {
      const shuffled = [...STANDARD_EBOOKS].sort(() => 0.5 - Math.random());
      setRandomBooks(shuffled.slice(0, 12));
      setIsShuffling(false);
    }, 400); // Give time for exit animation
  };

  useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) { setApiKey(savedKey); setHasKey(true); }
    shuffleBooks();
  }, []);

  const handleSaveKey = () => {
    if (apiKey.trim()) { localStorage.setItem('gemini_api_key', apiKey); setHasKey(true); }
  };

  const handleLocalImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsTranslating('Importing Local Book...');
    try {
      const text = await file.text();
      // Split into basic paragraphs for the editor
      const paragraphs = text.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 0);
      const finalHtml = paragraphs.map(p => `<p>${p.replace(/\n/g, ' ')}</p>`).join('');
      
      const title = file.name.replace(/\.[^/.]+$/, ""); // remove extension

      await db.drafts.add({ 
        title: title, 
        author: 'Local File', 
        content: `<h1>${title}</h1>` + finalHtml,
        updatedAt: new Date(), 
        isCommitted: false 
      });
      router.push('/');
    } catch (error) {
      alert("Failed to read file.");
    } finally {
      setIsTranslating(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const translateChunk = async (text: string, currentKey: string, targetLang: string) => {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, apiKey: currentKey, targetLang })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || data.error || 'Translation failed');
    return data.translatedText;
  };

  const handleOpen = async (book: any, translate: boolean = false) => {
    const currentKey = localStorage.getItem('gemini_api_key');
    setIsTranslating(book.title);
    try {
      const fetchRes = await fetch('/api/fetch-book', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: book.title, author: book.author }) 
      });
      const { content: rawContent } = await fetchRes.json();
      let finalContent = rawContent;
      
      if (translate) {
        if (!currentKey) throw new Error('API Key Required for translation via Gemini');
        
        let userLangName = 'Japanese';
        try {
          const userLocale = navigator.language || 'ja-JP';
          userLangName = new Intl.DisplayNames(['en'], { type: 'language' }).of(userLocale) || 'Japanese';
        } catch (e) {}

        setIsTranslating(`Gemini 3.0 Translating to ${userLangName}...`);
        
        // Extract preview HTML to keep it fast
        let previewHtml = rawContent;
        if (previewHtml.length > 3000) {
            const cutIndex = previewHtml.indexOf('</p>', 2500);
            previewHtml = previewHtml.substring(0, cutIndex !== -1 ? cutIndex + 4 : 3000);
        }
        
        const translated = await translateChunk(previewHtml, currentKey, userLangName);
        finalContent = translated + '\n\n<br/><p style="text-align: center; opacity: 0.5;"><em>(Translation Preview Ended)</em></p>';
      }
      
      await db.drafts.add({ 
        title: book.title, 
        author: book.author, 
        content: finalContent, 
        updatedAt: new Date(), 
        isCommitted: false 
      });
      router.push('/');
    } catch (e: any) { 
      alert(`Error: ${e.message}`); 
    } finally { 
      setIsTranslating(null); 
    }
  };

  return (
    <main className="min-h-screen bg-[#FAFAFA] p-8 sm:p-16 text-[#1a1a1a] font-sans selection:bg-gray-200 flex flex-col items-center">
      <div className="w-full max-w-5xl">
        <header className="flex justify-between items-center mb-24 opacity-30 hover:opacity-100 transition-opacity duration-500">
          <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-black/5 transition-colors" title="Back to Editor">
            <ArrowLeft strokeWidth={1.5} size={20} />
          </Link>
          
          <div className="flex items-center gap-6">
            {!hasKey && (
              <div className="flex items-center border-b border-black/10 pb-1">
                <input type="password" placeholder="Key" className="bg-transparent text-[10px] focus:outline-none w-16 tracking-widest text-center" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
                <button onClick={handleSaveKey} className="ml-2 hover:text-black transition-colors"><Key size={12} /></button>
              </div>
            )}
            
            {/* Local Import Button */}
            <button 
              onClick={() => fileInputRef.current?.click()} 
              className="flex items-center gap-2 p-2 rounded-full hover:bg-black/5 transition-colors"
              title="Import Local Text File (.txt, .md)"
            >
              <Upload strokeWidth={1.5} size={20} />
            </button>
            <input 
              type="file" 
              accept=".txt,.md" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleLocalImport} 
            />

            {/* The River Mechanism: Cycle the displayed books */}
            <button 
              onClick={() => {
                const shuffled = [...STANDARD_EBOOKS].sort(() => 0.5 - Math.random());
                setRandomBooks(shuffled.slice(0, 12));
              }} 
              className="flex items-center gap-2 p-2 rounded-full hover:bg-black/5 transition-all"
              title="Flow (Show different texts)"
            >
              <RefreshCw strokeWidth={1.5} size={20} />
            </button>
          </div>
        </header>

        {isTranslating && (
          <div className="fixed inset-0 z-50 bg-[#FAFAFA]/90 backdrop-blur-md flex flex-col items-center justify-center">
            <Loader2 className="animate-spin mb-8 opacity-30" size={24} />
            <p className="font-serif italic text-xl text-black/60">{isTranslating}</p>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-8 gap-y-16 pb-20">
          <AnimatePresence mode="popLayout">
            {!isShuffling && randomBooks.map((book) => (
              <BookCard key={book.id + book.slug} book={book} onOpen={handleOpen} isTranslating={!!isTranslating} />
            ))}
          </AnimatePresence>
        </div>

      </div>
    </main>
  );
}
