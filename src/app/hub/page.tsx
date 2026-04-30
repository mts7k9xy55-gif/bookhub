'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2, Book, Search, X, RefreshCw, EyeOff } from 'lucide-react';
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

function BookCard({ book, onOpen, onHide, isOpening }: { book: any, onOpen: (book: any) => void, onHide: (id: string) => void, isOpening: boolean }) {
  const gradient = getGradient(book.title);
  return (
    <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="group relative aspect-[2/3] cursor-pointer overflow-hidden border border-black/5" onClick={() => onOpen(book)}>
      <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-105" style={{ background: gradient }} />
      <div className="relative z-10 flex h-full flex-col items-center justify-center p-6 text-center">
        <p className="mb-2 text-[8px] font-medium tracking-[0.3em] uppercase text-white/40">{book.author}</p>
        <h3 className="font-serif text-sm italic leading-snug text-white/90 line-clamp-3">{book.title}</h3>
      </div>
      <div className="absolute inset-0 z-20 bg-black/60 opacity-0 transition-opacity duration-500 group-hover:opacity-100 flex items-center justify-center gap-8">
        <button onClick={(e) => { e.stopPropagation(); onOpen(book); }} disabled={isOpening} className="p-4 rounded-full hover:bg-white/10 text-white/80 active:scale-90 transition-all">
          <Book size={28} strokeWidth={1} />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onHide(book.id); }} disabled={isOpening} className="p-4 rounded-full hover:bg-white/10 text-white/30 hover:text-red-400 active:scale-90 transition-all">
          <EyeOff size={24} strokeWidth={1} />
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
    if (randomBooks.length === 0) {
      shuffle();
    }
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
      await db.drafts.where('title').equals(book.title).delete();
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
        isCommitted: false 
      });
      router.push('/');
    } catch (e) {
      alert("Failed to open book.");
    } finally {
      setIsOpening(null);
    }
  };

  const handleHide = async (id: string) => {
    await db.hiddenBooks.add({ bookId: id });
    setRandomBooks(prev => prev.filter(b => b.id !== id));
  };

  const filteredLocal = randomBooks.filter(b => 
    b.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    b.author.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-[#FAFAFA] text-[#1a1a1a] selection:bg-gray-200">
      <div className="mx-auto max-w-6xl px-6 py-16">
        
        <header className="mb-20 flex flex-col md:flex-row items-center justify-between gap-8 opacity-40 hover:opacity-100 transition-opacity duration-500">
          <Link href="/" className="p-2 hover:bg-black/5 rounded-full transition-colors">
            <ArrowLeft size={20} strokeWidth={1.5} />
          </Link>
          
          <div className="relative flex-1 max-w-md w-full group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black/20 group-focus-within:text-black/40" size={18} />
            <input 
              type="text"
              placeholder="Search or filter classics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border border-black/5 bg-white py-3 pl-12 pr-10 outline-none focus:border-black/10 transition-all font-serif italic"
            />
            {isSearching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-black/10" size={16} />}
          </div>

          <button onClick={shuffle} className="p-2 hover:bg-black/5 rounded-full transition-all">
            <RefreshCw size={20} strokeWidth={1.5} />
          </button>
        </header>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          <AnimatePresence mode="popLayout">
            {(searchQuery ? [...filteredLocal, ...remoteResults] : randomBooks).map((book) => (
              <BookCard key={book.id} book={book} onOpen={handleOpen} onHide={handleHide} isOpening={!!isOpening} />
            ))}
          </AnimatePresence>
        </div>

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
