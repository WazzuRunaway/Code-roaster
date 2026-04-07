import OpenAI from 'openai';

// ─── Types ──────────────────────────────────────────────────────────
export interface RoastResult {
  roast: string;
  solution: string;
  spaghettiScore: number;
}

// ─── Config ─────────────────────────────────────────────────────────
const LLM_URL = process.env.LLM_URL || '';
const LLM_MODEL = process.env.LLM_MODEL || '';
const LLM_API_KEY = process.env.LLM_API_KEY || '';

// Auto-detect provider
const PROVIDER = LLM_URL
  ? 'custom'
  : LLM_API_KEY.startsWith('sk-or-')
    ? 'openrouter'
    : LLM_API_KEY.startsWith('gsk_')
      ? 'groq'
      : LLM_API_KEY.startsWith('sk-')
        ? 'openai'
        : LLM_API_KEY.startsWith('AIza')
          ? 'gemini'
          : LLM_API_KEY
            ? 'generic'
            : 'offline';

const BASE_TIMEOUT = 60_000;
const MAX_RETRIES = 3;

// ─── OpenRouter Free Model Discovery ────────────────────────────────
const OPENROUTER_MODELS_URL = 'https://openrouter.ai/api/v1/models';

const FREE_MODEL_PRIORITY = [
  'google/gemma-3-27b-it:free',
  'openrouter/free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'minimax/minimax-m2.5:free',
  'stepfun/step-3.5-flash:free',
  'liquid/lfm-2.5-1.2b-instruct:free',
];

let _discoveredModel: string | null = null;
let _discoveryPromise: Promise<string> | null = null;

async function discoverFreeModel(): Promise<string> {
  if (_discoveredModel) return _discoveredModel;
  if (_discoveryPromise) return _discoveryPromise;

  _discoveryPromise = (async () => {
    try {
      console.log('🔍 Discovering free OpenRouter models...');
      const res = await fetch(OPENROUTER_MODELS_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json() as { data: Array<{
        id: string;
        context_length: number;
        pricing: { prompt: string; completion: string };
      }> };

      const availableIds = new Set((data.data || []).map((m: { id: string }) => m.id));
      const freeModels = (data.data || [])
        .filter((m) => m.pricing.prompt === '0' && m.pricing.completion === '0')
        .map((m) => m.id);

      console.log(`✅ Found ${freeModels.length} free models`);

      // Try priority list first (known-working models)
      for (const modelId of FREE_MODEL_PRIORITY) {
        if (availableIds.has(modelId) && freeModels.includes(modelId)) {
          console.log(`✅ Using priority model: ${modelId}`);
          _discoveredModel = modelId;
          return modelId;
        }
      }

      // Fall back to largest context window
      const sorted = (data.data || [])
        .filter((m) => m.pricing.prompt === '0' && m.pricing.completion === '0')
        .sort((a, b) => (b.context_length || 0) - (a.context_length || 0));

      if (sorted.length > 0) {
        const best = sorted[0];
        console.log(`✅ Using largest context model: ${best.id} (ctx: ${best.context_length})`);
        _discoveredModel = best.id;
        return best.id;
      }

      throw new Error('No free models found');
    } catch (err: any) {
      console.warn(`⚠️  Model discovery failed: ${err.message}. Using hardcoded fallback.`);
      _discoveredModel = 'google/gemma-3-27b-it:free';
      return _discoveredModel;
    }
  })();

  return _discoveryPromise;
}

// ─── Helpers ────────────────────────────────────────────────────────
async function getOpenAIClient(timeoutMs: number): Promise<{ client: OpenAI; model: string } | null> {
  switch (PROVIDER) {
    case 'openrouter': {
      const model = LLM_MODEL || await discoverFreeModel();
      return {
        client: new OpenAI({ apiKey: LLM_API_KEY, baseURL: 'https://openrouter.ai/api/v1', timeout: timeoutMs }),
        model,
      };
    }
    case 'openai':
      return {
        client: new OpenAI({ apiKey: LLM_API_KEY, timeout: timeoutMs }),
        model: LLM_MODEL || 'gpt-4o-mini',
      };
    case 'groq':
      return {
        client: new OpenAI({ apiKey: LLM_API_KEY, baseURL: 'https://api.groq.com/openai/v1', timeout: timeoutMs }),
        model: LLM_MODEL || 'llama-3.3-70b-versatile',
      };
    case 'gemini':
      return {
        client: new OpenAI({ apiKey: LLM_API_KEY, baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/', timeout: timeoutMs }),
        model: LLM_MODEL || 'gemini-2.0-flash',
      };
    case 'custom':
      return {
        client: new OpenAI({ apiKey: LLM_API_KEY || 'ollama', baseURL: `${LLM_URL}/v1`, timeout: timeoutMs }),
        model: LLM_MODEL || 'qwen2.5-coder:3b',
      };
    default:
      return null;
  }
}

// ─── Fallback ───────────────────────────────────────────────────────
const FALLBACK_ROASTS: Record<string, string> = {
  mild: 'This {lang} code is quite safe, like a well-worn pair of slippers. There\'s room for improvement, but nothing to worry about.',
  medium: 'Oh wow, this {lang} code is... something. I\'ve seen better logic in a coin flip. The variable naming suggests a random number generator wrote this at 3 AM.',
  hot: 'This {lang} code should come with a health warning. I\'ve seen cleaner spaghetti at a college dorm. If bad code was a superpower, you\'d be unstoppable.',
};

const FALLBACK_SOLUTION = '// Refactored version\n// TODO: Configure LLM_API_KEY in .env for real AI\n\nfunction improved() {\n  // Clean, readable, actually works\n  return true;\n}';

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
      const clientConfig = await getOpenAIClient(BASE_TIMEOUT * attempt);
      if (!clientConfig) {
        console.warn(`LLM provider: ${PROVIDER} — no valid API key, using fallback`);
        return makeFallback(language, spiciness);
      }

      const { client, model } = clientConfig;
      const response = await client.chat.completions.create({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('Empty response from AI');

      return parseRoastResponse(content);
    } catch (err: any) {
      const isLastAttempt = attempt === MAX_RETRIES;
      const isParseError = err.message.includes('JSON') || err.message.includes('Invalid response');

      if (isLastAttempt) {
        console.warn(`LLM failed after ${MAX_RETRIES} attempts (${PROVIDER}), using fallback:`, err.message);
        return makeFallback(language, spiciness);
      }

      if (isParseError) {
        console.warn('AI returned unparseable response, using fallback');
        return makeFallback(language, spiciness);
      }

      console.warn(`LLM attempt ${attempt}/${MAX_RETRIES} failed, retrying in ${3 * attempt}s... (${err.message})`);
      await new Promise((r) => setTimeout(r, 3000 * attempt));
    }
  }

  return makeFallback(language, spiciness);
}
