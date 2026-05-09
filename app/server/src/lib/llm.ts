// Thin LLM client. OpenRouter primary; falls back to OpenAI/Anthropic if keys exist.
// Two surfaces:
//   chat(messages, opts)        — text/JSON completion
//   embed(texts)                — embedding vectors (always via OpenAI text-embedding-3-small over OpenRouter or direct)

interface ChatMessage { role: 'system' | 'user' | 'assistant'; content: string }
interface ChatOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  responseFormat?: 'text' | 'json_object';
  tier?: 'fast' | 'smart';
}

interface Provider {
  name: string;
  baseUrl: string;
  apiKey: string | undefined;
  fastModel: string;
  smartModel: string;
}

const PROVIDERS: Provider[] = [
  {
    name: 'openrouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
    fastModel: 'openai/gpt-4o-mini',
    smartModel: 'anthropic/claude-sonnet-4.5',
  },
  {
    name: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    apiKey: process.env.OPENAI_API_KEY,
    fastModel: 'gpt-4o-mini',
    smartModel: 'gpt-4o',
  },
];

function pick(): Provider {
  for (const p of PROVIDERS) if (p.apiKey) return p;
  throw new Error('No LLM key in env (set OPENROUTER_API_KEY or OPENAI_API_KEY).');
}

export async function chat(messages: ChatMessage[], opts: ChatOptions = {}): Promise<string> {
  const provider = pick();
  const model = opts.model ?? (opts.tier === 'smart' ? provider.smartModel : provider.fastModel);
  const body: Record<string, unknown> = {
    model,
    messages,
    temperature: opts.temperature ?? 0.4,
    max_tokens: opts.maxTokens ?? 1024,
  };
  if (opts.responseFormat === 'json_object') body.response_format = { type: 'json_object' };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${provider.apiKey}`,
  };
  if (provider.name === 'openrouter') {
    headers['HTTP-Referer'] = 'https://nucleus.kokomo.quest';
    headers['X-Title'] = 'Nucleus Connections Hub';
  }

  const res = await fetch(`${provider.baseUrl}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${provider.name} chat failed ${res.status}: ${text.slice(0, 500)}`);
  }
  const json = (await res.json()) as { choices: { message: { content: string } }[] };
  return json.choices?.[0]?.message?.content ?? '';
}

export async function chatJSON<T>(messages: ChatMessage[], opts: ChatOptions = {}): Promise<T> {
  const text = await chat(messages, { ...opts, responseFormat: 'json_object' });
  return JSON.parse(stripCodeFence(text)) as T;
}

function stripCodeFence(s: string): string {
  const trimmed = s.trim();
  // Models occasionally wrap JSON in ```json ... ``` despite response_format=json_object
  const fence = /^```(?:json)?\s*([\s\S]*?)\s*```$/m;
  const m = trimmed.match(fence);
  return m ? m[1] : trimmed;
}

// Embeddings: always OpenAI text-embedding-3-small (1536d) — supported by OpenRouter and OpenAI.
export async function embed(inputs: string[]): Promise<number[][]> {
  const provider = pick();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${provider.apiKey}`,
  };
  if (provider.name === 'openrouter') {
    headers['HTTP-Referer'] = 'https://nucleus.kokomo.quest';
    headers['X-Title'] = 'Nucleus Connections Hub';
  }
  const res = await fetch(`${provider.baseUrl}/embeddings`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ model: 'openai/text-embedding-3-small', input: inputs }),
  });
  if (!res.ok) {
    // OpenRouter currently routes embeddings via a slightly different path for some providers;
    // fall back to OpenAI direct if a key is present.
    const text = await res.text();
    if (process.env.OPENAI_API_KEY) {
      const r2 = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        body: JSON.stringify({ model: 'text-embedding-3-small', input: inputs }),
      });
      if (!r2.ok) throw new Error(`embeddings failed ${r2.status}: ${await r2.text()}`);
      const j2 = (await r2.json()) as { data: { embedding: number[] }[] };
      return j2.data.map((d) => d.embedding);
    }
    throw new Error(`embeddings failed ${res.status}: ${text.slice(0, 500)}`);
  }
  const json = (await res.json()) as { data: { embedding: number[] }[] };
  return json.data.map((d) => d.embedding);
}

export function cosine(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}
