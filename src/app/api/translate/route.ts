import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { text } = await request.json();
    if (!text) return NextResponse.json({ error: 'No text' }, { status: 400 });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'API key not configured' }, { status: 500 });

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: `Translate the following classic literature text into natural, high-quality Japanese. Keep the tone appropriate for the author's style. Only return the translated Japanese text without any comments:\n\n${text}` }]
        }]
      })
    });

    const data = await res.json();
    const translated = data.candidates?.[0]?.content?.parts?.[0]?.text || "Translation failed.";
    
    return NextResponse.json({ translatedText: translated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
