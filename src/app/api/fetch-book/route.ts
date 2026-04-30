import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, author, slug } = body;
    
    if (!title) {
      return NextResponse.json({ error: 'Missing title' }, { status: 400 });
    }

    // 1. Try Standard Ebooks (SE) first for high-quality typography
    if (slug && !slug.startsWith('pg/')) {
      const seUrl = `https://standardebooks.org/ebooks/${slug}/text/single-page`;
      const seRes = await fetch(seUrl);
      if (seRes.ok) {
        let htmlText = await seRes.text();
        if (htmlText) {
            // Extract the whole <main> or content area, preserving more structure
            const contentMatch = htmlText.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
            if (contentMatch) {
                let content = contentMatch[1];
                // Remove interactive/navigation elements but KEEP structural ones (section, h2, etc.)
                content = content.replace(/<nav[^>]*>[\s\S]*?<\/nav>/ig, '');
                content = content.replace(/<footer[^>]*>[\s\S]*?<\/footer>/ig, '');
                content = content.replace(/<aside[^>]*>[\s\S]*?<\/aside>/ig, '');
                // Standard Ebooks uses beautiful typography classes; let's keep the tags clean but keep the semantic structure
                return NextResponse.json({ content });
            }
        }
      }
    }

    // 2. Fallback to Project Gutenberg via Gutendex
    const query = encodeURIComponent(`${title} ${author || ''}`);
    const searchRes = await fetch(`https://gutendex.com/books?search=${query}`);
    const searchData = await searchRes.json();
    const book = searchData.results[0];
    
    if (!book) {
      throw new Error('Book not found.');
    }

    const htmlUrl = book.formats['text/html'] || book.formats['text/html; charset=utf-8'];
    if (htmlUrl) {
      const htmlRes = await fetch(htmlUrl);
      const htmlText = await htmlRes.text();
      const bodyMatch = htmlText.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (bodyMatch) {
        let content = bodyMatch[1];
        // Clean up PG boilerplate
        content = content.replace(/<section[^>]*id="pg-header"[^>]*>[\s\S]*?<\/section>/ig, '');
        content = content.replace(/<section[^>]*id="pg-footer"[^>]*>[\s\S]*?<\/section>/ig, '');
        return NextResponse.json({ content });
      }
    }

    // Fallback to plain text
    let textUrl = book.formats['text/plain; charset=utf-8'] || `https://www.gutenberg.org/cache/epub/${book.id}/pg${book.id}.txt`;
    const textRes = await fetch(textUrl);
    const rawText = await textRes.text();
    const cleanText = rawText.split('*** START')[1]?.split('*** END')[0] || rawText;
    const finalHtml = `<h1>${title}</h1>` + cleanText.split(/\n\s*\n/).map(p => `<p>${p.trim()}</p>`).join('');

    return NextResponse.json({ content: finalHtml });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
