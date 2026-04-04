import OpenAI from 'openai';

// ─── Types ──────────────────────────────────────────────────────────
export interface RoastResult {
  roast: string;
  solution: string;
  spaghettiScore: number;
}

// ─── Config ─────────────────────────────────────────────────────────
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5-coder:3b';
const BASE_TIMEOUT = 60_000; // 60 seconds per attempt
const MAX_RETRIES = 3;

// ─── Helpers ────────────────────────────────────────────────────────
function getOpenAIClient(timeoutMs: number): OpenAI {
  return new OpenAI({
    apiKey: 'ollama',
    baseURL: `${OLLAMA_URL}/v1`,
    timeout: timeoutMs,
  });
}

const FALLBACK_ROASTS: Record<string, string> = {
  mild: 'This {lang} code is quite safe, like a well-worn pair of slippers. There\'s room for improvement, but nothing to worry about.',
  medium: 'Oh wow, this {lang} code is... something. I\'ve seen better logic in a coin flip. The variable naming suggests a random number generator wrote this at 3 AM.',
  hot: 'This {lang} code should come with a health warning. I\'ve seen cleaner spaghetti at a college dorm. If bad code was a superpower, you\'d be unstoppable.',
};

const FALLBACK_SOLUTION = '// Refactored version\n// TODO: Make sure Ollama is running: ollama serve\n// Then pull the model: ollama pull qwen2.5-coder:3b\n\nfunction improved() {\n  // Clean, readable, actually works\n  return true;\n}';

function makeFallback(language: string, spiciness: string): RoastResult {
  const baseScores: Record<string, number> = { mild: 40, medium: 65, hot: 90 };
  const score = (baseScores[spiciness] || 65) + Math.floor(Math.random() * 10 - 5);
  return {
    roast: (FALLBACK_ROASTS[spiciness] || FALLBACK_ROASTS.medium).replace('{lang}', language),
    solution: FALLBACK_SOLUTION,
    spaghettiScore: Math.max(0, Math.min(100, score)),
  };
}

function parseRoastResponse(content: string): RoastResult {
  const cleaned = content.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
  const parsed = JSON.parse(cleaned) as Partial<RoastResult>;

  if (!parsed.roast || !parsed.solution || typeof parsed.spaghettiScore !== 'number') {
    throw new Error('Invalid response structure from AI');
  }

  return {
    roast: String(parsed.roast),
    solution: String(parsed.solution),
    spaghettiScore: Math.max(0, Math.min(100, parsed.spaghettiScore)),
  };
}

// ─── Main Function ──────────────────────────────────────────────────
export async function generateRoast(code: string, language: string, spiciness: string = 'medium'): Promise<RoastResult> {
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

Respond in EXACTLY this JSON format (no extra text, no markdown wrapping):
{"spaghettiScore": 75, "roast": "your roast here", "solution": "the corrected code here"}`;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const openai = getOpenAIClient(BASE_TIMEOUT * attempt);
      const response = await openai.chat.completions.create({
        model: OLLAMA_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('Empty response from AI');

      // Parse failures are immediate (no retry wait)
      return parseRoastResponse(content);
    } catch (err: any) {
      const isLastAttempt = attempt === MAX_RETRIES;
      const isParseError = err.message.includes('JSON') || err.message.includes('Invalid response');

      if (isLastAttempt) {
        console.warn(`Ollama failed after ${MAX_RETRIES} attempts, using fallback:`, err.message);
        return makeFallback(language, spiciness);
      }

      // Don't waste time retrying on parse errors
      if (isParseError) {
        console.warn('AI returned unparseable response, using fallback');
        return makeFallback(language, spiciness);
      }

      console.warn(`Ollama attempt ${attempt}/${MAX_RETRIES} failed, retrying in ${3 * attempt}s... (${err.message})`);
      await new Promise((r) => setTimeout(r, 3000 * attempt));
    }
  }

  // Should never reach here
  return makeFallback(language, spiciness);
}
