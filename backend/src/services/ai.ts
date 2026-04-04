import { GoogleGenerativeAI } from '@google/generative-ai';

const model = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY).getGenerativeModel({ model: 'gemini-2.0-flash' })
  : null;

export async function generateRoast(code: string, language: string) {
  // Fallback when no API key is set (for testing/development)
  if (!model) {
    return {
      roast: `Oh wow, this ${language} code is... something. I've seen better logic in a coin flip. The variable naming suggests a random number generator wrote this at 3 AM. But hey, at least it exists — unlike my motivation on Monday mornings.`,
      solution: `// Refactored version\n// TODO: Add your GEMINI_API_KEY to .env for real AI analysis\n\nfunction improved() {\n  // Clean, readable, actually works\n  return true;\n}`,
    };
  }

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
