import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

export async function generateRoast(code: string, language: string) {
  const prompt = `You are a brutally honest code reviewer. Analyze this ${language} code and provide:
1. A funny, sarcastic roast pointing out the mistakes (2-3 paragraphs)
2. A clean, corrected solution with explanations

Code:
\`\`\`${language}
${code}
\`\`\`

Respond in EXACTLY this JSON format (no extra text, no markdown wrapping):
{"roast": "your roast here", "solution": "the corrected code here"}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();
  const cleaned = text.replace(/^```json\n?/, '').replace(/\n?```$/, '');

  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error(`Failed to parse AI response: ${cleaned.slice(0, 200)}`);
  }
}
