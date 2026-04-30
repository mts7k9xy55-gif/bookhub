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

        // Smart Detection: Try to find where the actual book starts (skipping long intros)
        // Look for typical book starting markers
        const startMarkers = [
            /BOOK\s+[IVXLC]+/i,
            /CHAPTER\s+[0-9IVXLC]+/i,
            /PERSONS OF THE DIALOGUE/i
        ];

        let bestIndex = -1;
        for (const marker of startMarkers) {
            const match = content.match(marker);
            if (match && match.index !== undefined) {
                // We want the first one, but let's be careful not to pick a TOC entry
                // Usually TOC entries are inside <a> or <table>. Actual headings are <h2>/<h3>.
                if (bestIndex === -1 || match.index < bestIndex) {
                    bestIndex = match.index;
                }
            }
        }

        if (bestIndex !== -1 && bestIndex > 5000) { // If it's a deep start
            const before = content.substring(0, bestIndex);
            const after = content.substring(bestIndex);
            content = before + 
                '<div style="background:#000; color:#fff; padding: 2px 10px; display:inline-block; font-size:10px; font-weight:bold; letter-spacing:0.2em; margin: 40px 0;">START OF SOURCE</div>' + 
                after;
        }

        // To prevent Tiptap editor from freezing and keep the UI lightning fast, 
        // we only load the first chunk (approx 120k chars now since it's structured).
        const MAX_LENGTH = 120000;
        if (content.length > MAX_LENGTH) {
            const safeCut = content.indexOf('</p>', MAX_LENGTH);
            if (safeCut !== -1) {
                content = content.substring(0, safeCut + 4) + '\n\n<hr style="margin-top:4em; margin-bottom:2em; border-top: 1px solid #eee;"/><p style="text-align:center; opacity:0.4; font-size: 0.8em; letter-spacing: 0.1em; text-transform: uppercase;">The River Continues...<br/>(Deep Focus Mode: Only the first section is loaded to protect your attention)</p>';
            }
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

    // To prevent Tiptap editor from freezing, limit to max 200 paragraphs
    const MAX_PARAGRAPHS = 200;
    let paragraphs = cleanText
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(p => p.length > 0);
      
    const isTruncated = paragraphs.length > MAX_PARAGRAPHS;
    paragraphs = paragraphs.slice(0, MAX_PARAGRAPHS);

    let finalHtml = `<h1>${title}</h1><p><em>By ${author}</em></p>` + paragraphs.map(p => `<p>${p.replace(/\n/g, ' ')}</p>`).join('');

    if (isTruncated) {
       finalHtml += '\n\n<hr style="margin-top:4em; margin-bottom:2em; border-top: 1px solid #eee;"/><p style="text-align:center; opacity:0.4; font-size: 0.8em; letter-spacing: 0.1em; text-transform: uppercase;">The River Continues...<br/>(Deep Focus Mode: Only the first section is loaded to protect your attention)</p>';
    }

    return NextResponse.json({ content: finalHtml });

  } catch (error: any) {
    console.error("Fetch book error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
