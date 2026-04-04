import OpenAI from 'openai';

const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
const ollamaModel = process.env.OLLAMA_MODEL || 'qwen2.5-coder:3b';

// Ollama uses OpenAI-compatible API when running
const openai = process.env.OLLAMA_URL
  ? new OpenAI({
      apiKey: 'ollama', // Ollama doesn't require a real API key
      baseURL: `${ollamaUrl}/v1`,
    })
  : null;

export async function generateRoast(code: string, language: string, spiciness: string = 'medium') {
  // Fallback when Ollama is not running
  if (!openai) {
    const mockScores: Record<string, number> = { mild: 40, medium: 65, hot: 90 };
    return {
      roast: `Oh wow, this ${language} code is... something. I've seen better logic in a coin flip. The variable naming suggests a random number generator wrote this at 3 AM. But hey, at least it exists — unlike my motivation on Monday mornings.`,
      solution: `// Refactored version\n// TODO: Start Ollama and run: ollama pull qwen2.5-coder:3b\n\nfunction improved() {\n  // Clean, readable, actually works\n  return true;\n}`,
      spaghettiScore: mockScores[spiciness] || 65,
    };
  }

  const toneMap: Record<string, string> = {
    mild: 'gentle and constructive, like a helpful mentor',
    medium: 'balanced with light sarcasm and humor',
    hot: 'brutally honest, savage, and hilarious',
  };
  const tone = toneMap[spiciness] || toneMap.medium;

  const prompt = `You are a code reviewer with a ${tone} tone. Analyze this ${language} code:

1. First, rate how bad the code is from 0 to 100 (spaghetti score, where 100 is maximum spaghetti chaos)
2. Then, provide a funny roast (${tone}) pointing out the mistakes
3. Finally, give a clean, corrected solution with brief explanations

Code:
\`\`\`${language}
${code}
\`\`\`

Respond in EXACTLY this JSON format (no extra text, no markdown wrapping):
{"spaghettiScore": 75, "roast": "your roast here", "solution": "the corrected code here"}`;

  const response = await openai.chat.completions.create({
    model: ollamaModel,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.8,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('Empty response from AI');

  const cleaned = content.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error(`Failed to parse AI response: ${cleaned.slice(0, 200)}`);
  }
}
