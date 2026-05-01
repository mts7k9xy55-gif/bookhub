'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2, Book, Search, X, RefreshCw, Trash2, RotateCcw, BookOpen } from 'lucide-react';
import { db } from '@/lib/db';
import { useRouter } from 'next/navigation';
import { useLiveQuery } from 'dexie-react-hooks';

const STANDARD_EBOOKS = [
  { id: 'schopenhauer-pessimism', slug: 'arthur-schopenhauer/studies-in-pessimism', title: 'Studies in Pessimism', author: 'Arthur Schopenhauer' },
  { id: 'nietzsche-zarathustra', slug: 'friedrich-nietzsche/thus-spake-zarathustra', title: 'Thus Spake Zarathustra', author: 'Friedrich Nietzsche' },
  { id: 'aurelius-meditations', slug: 'marcus-aurelius/meditations', title: 'Meditations', author: 'Marcus Aurelius' },
  { id: 'nietzsche-beyond-good-evil', slug: 'friedrich-nietzsche/beyond-good-and-evil', title: 'Beyond Good and Evil', author: 'Friedrich Nietzsche' },
  { id: 'plato-republic', slug: 'plato/the-republic', title: 'The Republic', author: 'Plato' },
  { id: 'dostoevsky-crime-punishment', slug: 'fyodor-dostoevsky/crime-and-punishment', title: 'Crime and Punishment', author: 'Fyodor Dostoevsky' },
  { id: 'dostoevsky-brothers-karamazov', slug: 'fyodor-dostoevsky/the-brothers-karamazov', title: 'The Brothers Karamazov', author: 'Fyodor Dostoevsky' },
  { id: 'kafka-metamorphosis', slug: 'franz-kafka/the-metamorphosis', title: 'The Metamorphosis', author: 'Franz Kafka' },
  { id: 'fitzgerald-gatsby', slug: 'f-scott-fitzgerald/the-great-gatsby', title: 'The Great Gatsby', author: 'F. Scott Fitzgerald' },
  { id: 'melville-moby-dick', slug: 'herman-melville/moby-dick', title: 'Moby-Dick', author: 'Herman Melville' },
  { id: 'tolstoy-war-peace', slug: 'leo-tolstoy/war-and-peace', title: 'War and Peace', author: 'Leo Tolstoy' },
  { id: 'machiavelli-prince', slug: 'niccolo-machiavelli/the-prince', title: 'The Prince', author: 'Niccolò Machiavelli' },
  { id: 'sun-tzu-war', slug: 'sun-tzu/the-art-of-war', title: 'The Art of War', author: 'Sun Tzu' },
  { id: 'thoreau-walden', slug: 'henry-david-thoreau/walden', title: 'Walden', author: 'Henry David Thoreau' },
  { id: 'spinoza-ethics', slug: 'benedict-de-spinoza/ethics', title: 'Ethics', author: 'Baruch Spinoza' },
  { id: 'kant-pure-reason', slug: 'immanuel-kant/the-critique-of-pure-reason', title: 'Critique of Pure Reason', author: 'Immanuel Kant' },
  { id: 'descartes-method', slug: 'rene-descartes/discourse-on-the-method', title: 'Discourse on the Method', author: 'René Descartes' },
  { id: 'austen-pride-prejudice', slug: 'jane-austen/pride-and-prejudice', title: 'Pride and Prejudice', author: 'Jane Austen' },
  { id: 'bronte-wuthering-heights', slug: 'emily-bronte/wuthering-heights', title: 'Wuthering Heights', author: 'Emily Brontë' },
  { id: 'dickens-two-cities', slug: 'charles-dickens/a-tale-of-two-cities', title: 'A Tale of Two Cities', author: 'Charles Dickens' },
  { id: 'homer-iliad', slug: 'homer/the-iliad', title: 'The Iliad', author: 'Homer' },
  { id: 'homer-odyssey', slug: 'homer/the-odyssey', title: 'The Odyssey', author: 'Homer' },
  { id: 'marx-manifesto', slug: 'karl-marx/the-communist-manifesto', title: 'The Communist Manifesto', author: 'Karl Marx' },
  { id: 'mill-liberty', slug: 'john-stuart-mill/on-liberty', title: 'On Liberty', author: 'John Stuart Mill' },
  { id: 'joyce-ulysses', slug: 'james-joyce/ulysses', title: 'Ulysses', author: 'James Joyce' },
  { id: 'wilde-dorian-gray', slug: 'oscar-wilde/the-picture-of-dorian-gray', title: 'The Picture of Dorian Gray', author: 'Oscar Wilde' },
  { id: 'verne-twenty-thousand-leagues', slug: 'jules-verne/twenty-thousand-leagues-under-the-sea', title: '20,000 Leagues Under the Sea', author: 'Jules Verne' },
  { id: 'stevenson-treasure-island', slug: 'robert-louis-stevenson/treasure-island', title: 'Treasure Island', author: 'Robert Louis Stevenson' },
  { id: 'kipling-jungle-book', slug: 'rudyard-kipling/the-jungle-book', title: 'The Jungle Book', author: 'Rudyard Kipling' },
  { id: 'dante-inferno', slug: 'dante-alighieri/the-divine-comedy/inferno', title: 'The Divine Comedy: Inferno', author: 'Dante Alighieri' },
  { id: 'goethe-faust', slug: 'johann-wolfgang-von-goethe/faust', title: 'Faust', author: 'J. W. von Goethe' },
  { id: 'orwell-1984', slug: 'george-orwell/1984', title: '1984', author: 'George Orwell' },
  { id: 'huxley-brave-new-world', slug: 'aldous-huxley/brave-new-world', title: 'Brave New World', author: 'Aldous Huxley' },
  { id: 'hemingway-sun-rises', slug: 'ernest-hemingway/the-sun-also-rises', title: 'The Sun Also Rises', author: 'Ernest Hemingway' },
  { id: 'kafka-trial', slug: 'franz-kafka/the-trial', title: 'The Trial', author: 'Franz Kafka' },
  { id: 'hume-human-understanding', slug: 'david-hume/an-enquiry-concerning-human-understanding', title: 'Human Understanding', author: 'David Hume' },
  { id: 'aristotle-ethics', slug: 'aristotle/the-nicomachean-ethics', title: 'The Nicomachean Ethics', author: 'Aristotle' },
  { id: 'seneca-letters', slug: 'lucius-annaeus-seneca/letters-from-a-stoic', title: 'Letters from a Stoic', author: 'Seneca' },
  { id: 'epictetus-enchiridion', slug: 'epictetus/the-enchiridion', title: 'The Enchiridion', author: 'Epictetus' },
  { id: 'haiku-basho', slug: 'matsuo-basho/haiku', title: 'Haiku', author: 'Matsuo Basho' },
  { id: 'tzu-tao', slug: 'lao-tzu/tao-te-ching', title: 'Tao Te Ching', author: 'Lao Tzu' },
  { id: 'smith-wealth', slug: 'adam-smith/the-wealth-of-nations', title: 'The Wealth of Nations', author: 'Adam Smith' },
  { id: 'rousseau-social', slug: 'jean-jacques-rousseau/the-social-contract', title: 'The Social Contract', author: 'Jean-Jacques Rousseau' }
];

const getGradient = (title: string) => {
  const hash = Array.from(title).reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
  const hue = Math.abs(hash % 360);
  return `linear-gradient(135deg, hsl(${hue}, 10%, 40%), hsl(${hue + 40}, 15%, 20%))`;
};

function BookCard({ book, onOpen, onHide, isOpening }: { book: any, onOpen: (book: any) => void, onHide: (id: string, title: string, author: string) => void, isOpening: boolean }) {
  const gradient = getGradient(book.title);
  return (
    <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="group relative aspect-[3/4] cursor-pointer overflow-hidden border border-black/5 rounded-sm" onClick={() => onOpen(book)}>
      <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-105" style={{ background: gradient }} />
      <div className="relative z-10 flex h-full flex-col items-center justify-center p-4 text-center">
        <p className="mb-1 text-[7px] font-medium tracking-[0.2em] uppercase text-white/30">{book.author}</p>
        <h3 className="font-serif text-[11px] italic leading-tight text-white/80 line-clamp-3">{book.title}</h3>
      </div>
      <div className="absolute inset-0 z-20 bg-black/70 opacity-0 transition-opacity duration-300 group-hover:opacity-100 flex items-center justify-center gap-4">
        <button onClick={(e) => { e.stopPropagation(); onOpen(book); }} disabled={isOpening} className="p-3 rounded-full hover:bg-white/10 text-white/80 active:scale-90 transition-all">
          <Book size={20} strokeWidth={1} />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onHide(book.id, book.title, book.author); }} disabled={isOpening} className="p-3 rounded-full hover:bg-white/10 text-white/30 hover:text-red-400 active:scale-90 transition-all">
          <Trash2 size={18} strokeWidth={1} />
        </button>
      </div>
    </motion.div>
  );
}

export default function Hub() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [randomBooks, setRandomBooks] = useState<any[]>([]);
  const [remoteResults, setRemoteResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpening, setIsOpening] = useState<string | null>(null);
  const [showTrash, setShowTrash] = useState(false);

  const hiddenBooks = useLiveQuery(() => db.hiddenBooks.toArray()) || [];

  const shuffle = useCallback(() => {
    const hiddenIds = new Set(hiddenBooks.map(h => h.bookId));
    const available = STANDARD_EBOOKS.filter(b => !hiddenIds.has(b.id));
    const shuffled = [...available].sort(() => 0.5 - Math.random());
    setRandomBooks(shuffled.slice(0, 48));
    setSearchQuery('');
    setRemoteResults([]);
  }, [hiddenBooks]);

  useEffect(() => {
    if (randomBooks.length === 0) shuffle();
  }, [randomBooks.length, shuffle]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length > 2) {
        setIsSearching(true);
        try {
          const res = await fetch(`https://gutendex.com/books?search=${encodeURIComponent(searchQuery)}`);
          const data = await res.json();
          setRemoteResults(data.results.map((b: any) => ({
            id: `pg-${b.id}`,
            title: b.title,
            author: b.authors[0]?.name || 'Unknown',
            slug: `pg/${b.id}`
          })));
        } catch (e) {
          console.error(e);
        } finally {
          setIsSearching(false);
        }
      } else {
        setRemoteResults([]);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleOpen = async (book: any) => {
    setIsOpening(book.title);
    try {
      // 既存の翻訳があればそのまま開くように、Draftの存在確認
      const existingDraft = await db.drafts.where('title').equals(book.title).first();
      if (!existingDraft) {
        const res = await fetch('/api/fetch-book', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title: book.title, author: book.author, slug: book.slug })
        });
        const { content } = await res.json();
        await db.drafts.add({ 
            title: book.title, 
            author: book.author, 
            content, 
            updatedAt: new Date(), 
            isCommitted: false,
            slug: book.slug
        });
      }
      router.push('/');
    } catch (e) {
      alert("Failed to open book.");
    } finally {
      setIsOpening(null);
    }
  };

  const handleHide = async (id: string, title: string, author: string) => {
    await db.hiddenBooks.add({ bookId: id, title, author });
    setRandomBooks(prev => prev.filter(b => b.id !== id));
  };

  const handleRestore = async (id: number) => {
    await db.hiddenBooks.delete(id);
    shuffle(); // プールを再生成
  };

  const filteredLocal = randomBooks.filter(b => 
    b.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    b.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-[#FAFAFA] text-[#1a1a1a] selection:bg-gray-200">
      <div className="mx-auto max-w-7xl px-4 py-12">
        
        <header className="mb-16 flex flex-col md:flex-row items-center justify-between gap-6 opacity-40 hover:opacity-100 transition-all duration-500">
          <div className="flex items-center gap-4">
            <button onClick={shuffle} className="p-2 hover:bg-black/5 rounded-full transition-all" title="Shuffle Pool">
                <RefreshCw size={18} strokeWidth={1.5} className={isSearching ? 'animate-spin' : ''} />
            </button>
            <div className="h-4 w-[1px] bg-black/10"></div>
            <Link href="/" className="flex items-center gap-2 p-2 hover:bg-black/5 rounded-full transition-colors" title="My Studio">
                <BookOpen size={18} strokeWidth={1.5} />
            </Link>
          </div>
          
          <div className="relative flex-1 max-w-lg w-full group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20 group-focus-within:text-black/40" size={16} />
            <input 
              type="text"
              placeholder="Filter pool or search SE/PG..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border border-black/5 bg-white py-2.5 pl-10 pr-10 outline-none focus:border-black/10 transition-all font-serif italic text-base shadow-sm"
            />
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => setShowTrash(!showTrash)} className={`p-2 rounded-full transition-all ${hiddenBooks.length > 0 ? 'text-red-400 opacity-100' : 'opacity-20'}`} title="Trash Box">
                <Trash2 size={18} strokeWidth={1.5} />
            </button>
          </div>
        </header>

        {/* Dense Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
          <AnimatePresence mode="popLayout">
            {(searchQuery ? [...filteredLocal, ...remoteResults] : randomBooks).map((book) => (
              <BookCard key={book.id} book={book} onOpen={handleOpen} onHide={handleHide} isOpening={!!isOpening} />
            ))}
          </AnimatePresence>
        </div>

        {/* Trash Box Modal */}
        <AnimatePresence>
            {showTrash && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-white/95 backdrop-blur-xl p-8 overflow-y-auto">
                    <div className="max-w-4xl mx-auto">
                        <header className="flex justify-between items-center mb-12">
                            <h2 className="text-[10px] font-bold tracking-[0.4em] uppercase opacity-30">Trash Box (Hidden Pool)</h2>
                            <button onClick={() => setShowTrash(false)} className="p-2 hover:bg-black/5 rounded-full"><X size={20} className="opacity-20" /></button>
                        </header>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {hiddenBooks.map(book => (
                                <div key={book.id} className="flex items-center justify-between p-4 bg-[#FAFAFA] border border-black/5">
                                    <div className="flex flex-col gap-1 overflow-hidden">
                                        <p className="font-serif italic text-xs truncate">{book.title}</p>
                                        <p className="text-[8px] opacity-30 uppercase">{book.author}</p>
                                    </div>
                                    <button onClick={() => handleRestore(book.id!)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-full transition-colors">
                                        <RotateCcw size={16} />
                                    </button>
                                </div>
                            ))}
                            {hiddenBooks.length === 0 && <p className="col-span-full text-center opacity-30 italic text-sm">Trash is empty.</p>}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {isOpening && (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/90 backdrop-blur-md">
                <Loader2 className="mb-4 animate-spin text-black/20" size={32} />
                <p className="font-serif italic text-black/40">Opening "{isOpening}"</p>
            </div>
        )}
      </div>
    </main>
  );
}
