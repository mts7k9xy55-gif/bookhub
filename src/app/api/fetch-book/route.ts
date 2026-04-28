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

    // 2. Prioritize HTML formats for beautiful structured content (with images and headings)
    const htmlUrl = book.formats['text/html'] || book.formats['text/html; charset=utf-8'];

    if (htmlUrl) {
      const htmlRes = await fetch(htmlUrl);
      if (!htmlRes.ok) throw new Error('Failed to fetch the HTML book.');
      
      let htmlText = await htmlRes.text();

      // Extract the body content
      const bodyMatch = htmlText.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (bodyMatch) {
        let content = bodyMatch[1];

        // Remove Project Gutenberg headers and footers using common IDs/classes
        content = content.replace(/<section[^>]*id="pg-header"[^>]*>[\s\S]*?<\/section>/ig, '');
        content = content.replace(/<section[^>]*id="pg-footer"[^>]*>[\s\S]*?<\/section>/ig, '');
        content = content.replace(/<div[^>]*id="pg-header"[^>]*>[\s\S]*?<\/div>/ig, '');
        content = content.replace(/<div[^>]*id="pg-footer"[^>]*>[\s\S]*?<\/div>/ig, '');
        
        // Remove any residual boilerplate based on common text patterns just in case
        const startMarkerIndex = content.indexOf('*** START OF THE PROJECT GUTENBERG EBOOK');
        if (startMarkerIndex !== -1) {
          const endOfLine = content.indexOf('***', startMarkerIndex + 3);
          if (endOfLine !== -1) {
            content = content.substring(endOfLine + 3);
          }
        }
        
        const endMarkerIndex = content.indexOf('*** END OF THE PROJECT GUTENBERG EBOOK');
        if (endMarkerIndex !== -1) {
          content = content.substring(0, endMarkerIndex);
        }

        // Fix relative image links so they load directly from Gutenberg
        // HTML URL is usually something like https://www.gutenberg.org/ebooks/1228.html.images 
        // which internally refers to files at https://www.gutenberg.org/files/{id}/{id}-h/
        // We'll replace src="images/..." or src="foo.jpg" with absolute URLs
        const baseUrl = htmlUrl.substring(0, htmlUrl.lastIndexOf('/') + 1);
        const fileBaseUrl = `https://www.gutenberg.org/files/${book.id}/${book.id}-h/`;
        
        content = content.replace(/src=["'](?!https?:\/\/)([^"']+)["']/gi, (match, path) => {
          // If it starts with a slash, use domain root, otherwise use fileBaseUrl
          if (path.startsWith('/')) {
            return `src="https://www.gutenberg.org${path}"`;
          }
          return `src="${fileBaseUrl}${path}"`;
        });

        // Strip inline styles from HTML to let Bookhub's minimalist CSS take over
        content = content.replace(/style=["'][^"']*["']/gi, '');

        // Add our own simple title if it doesn't have one right at the top
        if (!content.match(/^\s*<h1/i)) {
          content = `<h1>${title}</h1><p><em>By ${author}</em></p>` + content;
        }

        return NextResponse.json({ content });
      }
    }

    // 3. Fallback to plain text if HTML is not available
    let textUrl = book.formats['text/plain; charset=utf-8'] || 
                  book.formats['text/plain; charset=us-ascii'] || 
                  book.formats['text/plain'] ||
                  `https://www.gutenberg.org/cache/epub/${book.id}/pg${book.id}.txt`;

    const textRes = await fetch(textUrl);
    if (!textRes.ok) {
       throw new Error('Failed to fetch the book text.');
    }
    
    let rawText = await textRes.text();

    const startMarkers = [
      "*** START OF THE PROJECT GUTENBERG EBOOK",
      "*** START OF THIS PROJECT GUTENBERG EBOOK"
    ];
    const endMarkers = [
      "*** END OF THE PROJECT GUTENBERG EBOOK",
      "*** END OF THIS PROJECT GUTENBERG EBOOK"
    ];

    let startIndex = 0;
    for (const marker of startMarkers) {
      const idx = rawText.indexOf(marker);
      if (idx !== -1) {
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

    const paragraphs = cleanText
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(p => p.length > 0)
      .map(p => `<p>${p.replace(/\n/g, ' ')}</p>`);
      
    const finalHtml = `<h1>${title}</h1><p><em>By ${author}</em></p>` + paragraphs.join('');

    return NextResponse.json({ content: finalHtml });

  } catch (error: any) {
    console.error("Fetch book error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
