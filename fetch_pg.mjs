import fs from 'fs';

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

async function run() {
  for (const book of STANDARD_EBOOKS) {
    try {
      const res = await fetch(`https://gutendex.com/books?search=${encodeURIComponent(book.title + ' ' + book.author)}`);
      const data = await res.json();
      const pgId = data.results[0]?.id;
      book.pgId = pgId;
      console.log(`Title: ${book.title} -> pgId: ${pgId}`);
    } catch (e) {
      console.log(`Failed for ${book.title}`);
    }
  }
  fs.writeFileSync('books_with_pg.json', JSON.stringify(STANDARD_EBOOKS, null, 2));
}
run();