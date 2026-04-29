import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(request: Request) {
  const { text, apiKey, targetLang = 'Japanese' } = await request.json();

  if (!text || text.trim() === "") return NextResponse.json({ error: 'No text provided' }, { status: 400 });
  if (!apiKey) return NextResponse.json({ error: 'API key is required' }, { status: 401 });

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // Use gemini-1.5-flash as a highly reliable fallback for all accounts
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.1,
        topP: 0.95,
      }
    });

    const prompt = `You are a world-class literary translator. Translate the following text into ${targetLang}, mimicking an intellectual, concise, and highly refined literary style.

【Constraints】
1. Translate ONLY the input text and output absolutely nothing else.
2. Do NOT include any conversational filler, introductions, or explanations (e.g., "Here is the translation").
3. Use a natural, highly refined, and slightly formal literary tone appropriate for classic literature in ${targetLang}.
4. Handle specialized terms and proper nouns elegantly based on context.
5. You MUST strictly preserve all HTML tags (<h1>, <p>, <em>, <blockquote>, etc.) exactly as they are without breaking the structure or removing them.

【Input Text】
${text}

【Translation】`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const translatedText = response.text().trim();

    return NextResponse.json({ translatedText });
  } catch (error: any) {
    console.error("Translation Error:", error);
    return NextResponse.json({ error: 'Translation failed', message: error.message }, { status: 500 });
  }
}
