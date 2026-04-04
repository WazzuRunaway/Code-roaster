import OpenAI from 'openai';

function getOpenAIClient(): OpenAI {
  const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
  return new OpenAI({
    apiKey: 'ollama',
    baseURL: `${ollamaUrl}/v1`,
  });
}

const mockScores: Record<string, number> = { mild: 40, medium: 65, hot: 90 };

function makeFallback(code: string, language: string, spiciness: string) {
  return {
    roast: `Oh wow, this ${language} code is... something. I've seen better logic in a coin flip. The variable naming suggests a random number generator wrote this at 3 AM. But hey, at least it exists — unlike my motivation on Monday mornings.`,
    solution: `// Refactored version\n// TODO: Start Ollama and run: ollama pull qwen2.5-coder:3b\n\nfunction improved() {\n  // Clean, readable, actually works\n  return true;\n}`,
    spaghettiScore: mockScores[spiciness] || 65,
  };
}

export async function generateRoast(code: string, language: string, spiciness: string = 'medium') {
  const model = process.env.OLLAMA_MODEL || 'qwen2.5-coder:3b';
  const toneMap: Record<string, string> = {
    mild: 'gentle and constructive, like a helpful mentor',
    medium: 'balanced with light sarcasm and humor',
    hot: 'brutally honest, savage, and hilarious',
  };
  const tone = toneMap[spiciness] || toneMap.medium;

  const prompt = `You are a code reviewer with a ${tone} tone. Analyze this ${language} code:

1. First, rate how bad the code is from 0 to 100 (spaghetti score, where 100 is maximum spaghetti chaos)
2. Then, provide a funny roast (${tone}) pointing out the mistakes. Keep it to 2-3 short paragraphs.
3. Finally, give a clean, corrected solution with brief explanations (1-2 sentences).

Code:
\`\`\`${language}
${code}
\`\`\`

Respond in EXACTLY this JSON format (no extra text, no markdown wrapping). Escape all newlines in strings:
{"spaghettiScore": 75, "roast": "your roast here", "solution": "the corrected code here"}`;

  // Try up to 3 times with increasing timeouts
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const openai = getOpenAIClient();
      const response = await openai.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
        timeout: 120000 * attempt, // 2min, 4min, 6min
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('Empty response from AI');

      const cleaned = content.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
      return JSON.parse(cleaned);
    } catch (err: any) {
      // If this was the last attempt, return fallback instead of throwing
      if (attempt === 3) {
        console.warn(`Ollama failed after ${attempt} attempts, using fallback:`, err.message);
        return makeFallback(code, language, spiciness);
      }
      console.warn(`Ollama attempt ${attempt} failed, retrying... (${err.message})`);
      // Wait before retry (Ollama may still be loading the model)
      await new Promise((r) => setTimeout(r, 3000 * attempt));
    }
  }

  // Should never reach here, but just in case
  return makeFallback(code, language, spiciness);
}
