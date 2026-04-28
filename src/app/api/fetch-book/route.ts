import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, author } = body;
    
    if (!title || !author) {
      return NextResponse.json({ error: 'Missing title or author' }, { status: 400 });
    }

    // 1. Search Gutendex
    const query = encodeURIComponent(`${title} ${author}`);
    const searchRes = await fetch(`https://gutendex.com/books?search=${query}`);
    
    if (!searchRes.ok) {
      throw new Error('Failed to search Gutenberg catalog.');
    }
    
    const searchData = await searchRes.json();
    const book = searchData.results[0];
    
    if (!book) {
      throw new Error('Book not found in public domain catalog.');
    }

    // 2. Find the plain text URL
    // Try to find UTF-8 text first, fallback to US-ASCII, then just generic text
    let textUrl = book.formats['text/plain; charset=utf-8'] || 
                  book.formats['text/plain; charset=us-ascii'] || 
                  book.formats['text/plain'];

    // 3. Fallback URL construction if the formats object is missing it
    if (!textUrl) {
       textUrl = `https://www.gutenberg.org/cache/epub/${book.id}/pg${book.id}.txt`;
    }

    // 4. Fetch the actual text
    const textRes = await fetch(textUrl);
    if (!textRes.ok) {
       throw new Error('Failed to fetch the book text.');
    }
    
    let rawText = await textRes.text();

    // 5. Clean up Project Gutenberg boilerplate (approximate)
    const startMarkers = [
      "*** START OF THE PROJECT GUTENBERG EBOOK",
      "*** START OF THIS PROJECT GUTENBERG EBOOK",
      "***START OF THE PROJECT GUTENBERG EBOOK"
    ];
    const endMarkers = [
      "*** END OF THE PROJECT GUTENBERG EBOOK",
      "*** END OF THIS PROJECT GUTENBERG EBOOK",
      "***END OF THE PROJECT GUTENBERG EBOOK"
    ];

    let startIndex = 0;
    for (const marker of startMarkers) {
      const idx = rawText.indexOf(marker);
      if (idx !== -1) {
        // Move past the marker and its newline
        const lineEnd = rawText.indexOf('\n', idx);
        startIndex = lineEnd !== -1 ? lineEnd : idx + marker.length;
        break;
      }
    }

    let endIndex = rawText.length;
    for (const marker of endMarkers) {
      const idx = rawText.indexOf(marker);
      if (idx !== -1) {
        endIndex = idx;
        break;
      }
    }

    let cleanText = rawText.substring(startIndex, endIndex).trim();

    // 6. Convert raw plain text to simple HTML paragraphs for the TipTap Editor
    // Replace multiple newlines with paragraph boundaries
    const paragraphs = cleanText
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(p => p.length > 0)
      .map(p => `<p>${p.replace(/\n/g, ' ')}</p>`);
      
    // Put an H1 title at the top
    const finalHtml = `<h1>${title}</h1><p><em>By ${author}</em></p>` + paragraphs.join('');

    return NextResponse.json({ content: finalHtml });

  } catch (error: any) {
    console.error("Fetch book error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
