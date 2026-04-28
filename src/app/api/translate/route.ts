import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: Request) {
  const { text, targetLang, apiKey } = await request.json();

  if (!text) return NextResponse.json({ error: 'No text provided' }, { status: 400 });
  if (!apiKey) return NextResponse.json({ error: 'API key is required' }, { status: 401 });

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.1, // 翻訳の安定性のために低めに設定
        topP: 0.95,
      }
    });

    const prompt = `あなたは世界最高峰の翻訳家です。アイザック・アシモフやロバート・ハインラインのような、知的で簡潔、かつ叙情的なSF小説の文体を再現して翻訳してください。

【制約事項】
1. 入力されたテキストのみを翻訳し、結果だけを出力してください。
2. 「はい、翻訳しました」「以下が翻訳です」などの前置きや解説は一切不要です。
3. 自然で格調高い日本語（硬めの文体）を使用してください。
4. 専門用語や固有名詞は、文脈から判断して適切に処理してください。

【入力テキスト】
${text}

【翻訳結果】`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const translatedText = response.text().trim();

    return NextResponse.json({ translatedText });
  } catch (error: any) {
    console.error("Translation Error:", error);
    return NextResponse.json({ error: 'Translation failed', message: error.message }, { status: 500 });
  }
}
