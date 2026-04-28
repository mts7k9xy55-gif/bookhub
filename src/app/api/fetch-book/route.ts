import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { slug } = await request.json();
  if (!slug) return NextResponse.json({ error: 'No slug provided' }, { status: 400 });

  try {
    const url = `https://standardebooks.org/ebooks/${slug}/text/single-page`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch');
    const html = await response.text();

    // Standard Ebooksの本文は必ず <section data-number="..."> や 
    // id="chapter-x", id="introduction" などのタグ内にあります。
    // それ以前の法的文書、タイトルページ、目次などはすべて「ノイズ」として切り捨てます。

    let storyContent = "";
    
    // 物語の開始点として妥当なパターンを順に探す
    const startPatterns = [
      /<section[^>]+id=["']chapter-i?1?["'][^>]*>/i,
      /<section[^>]+id=["']introduction["'][^>]*>/i,
      /<section[^>]+id=["']preface["'][^>]*>/i,
      /<section[^>]+data-number=["']1["'][^>]*>/i,
      /<h1>/i // 最悪、最初の大見出し
    ];

    let startIndex = -1;
    for (const pattern of startPatterns) {
      startIndex = html.search(pattern);
      if (startIndex !== -1) break;
    }

    if (startIndex !== -1) {
      // 開始点が見つかったら、そこから後ろだけを取り出す
      let rawStory = html.substring(startIndex);
      
      // 終了点（colophon, uncopyright, などの後書きセクション）を探して切り捨てる
      const endPatterns = [
        /<section[^>]+id=["']colophon["'][^>]*>/i,
        /<section[^>]+id=["']uncopyright["'][^>]*>/i,
        /<\/body>/i
      ];
      
      let endIndex = -1;
      for (const pattern of endPatterns) {
        endIndex = rawStory.search(pattern);
        if (endIndex !== -1) break;
      }
      
      if (endIndex !== -1) {
        rawStory = rawStory.substring(0, endIndex);
      }

      // HTMLのクリーンアップ（読書に最低限必要なタグのみ残す）
      storyContent = rawStory
        .replace(/<nav[\s\S]*?<\/nav>/gi, '')   // 残存ナビ削除
        .replace(/<aside[\s\S]*?<\/aside>/gi, '') // 注釈などを一旦削除して没入感優先
        .replace(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi, '<h1>$1</h1>') // 見出しを統一
        .replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, '<p>$1</p>')
        .replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, '<blockquote>$1</blockquote>')
        .replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '<em>$1</em>')
        .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '<strong>$1</strong>')
        .replace(/<[^>]+>/g, (tag) => {
          return /<\/?(h1|p|blockquote|em|strong|br)[\s>]/i.test(tag) ? tag : '';
        })
        .replace(/\n\s*\n+/g, '\n\n')
        .trim();
    } else {
      throw new Error("Could not identify the start of the story.");
    }

    return NextResponse.json({ content: storyContent });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
