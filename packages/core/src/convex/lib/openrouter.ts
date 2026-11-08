/**
 * Tradução pelo OpenRouter (port de `convex/translation.ts` da v1, decisão 32): lista de
 * modelos em ordem, novas tentativas nos erros passageiros (429, 503) e troca de modelo
 * nos outros. HTML preservado: a resposta precisa ter as mesmas tags, na mesma ordem,
 * senão vale como falha e o próximo modelo tenta. Arquivo puro (recebe `fetch`).
 */
import type { FetchFn } from "./destinations";

export const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

/** Modelos padrão, do primeiro ao último recurso. `OPENROUTER_MODELS` (vírgulas) troca a lista. */
export const DEFAULT_MODELS = ["google/gemini-2.0-flash-001", "google/gemini-2.5-flash-lite", "openai/gpt-4o-mini", "anthropic/claude-haiku-4.5"];

export const MAX_RETRIES_PER_MODEL = 2;
export const RETRY_DELAY_MS = 1000;
const TRANSIENT = new Set([429, 503]);

export function modelsFrom(env: Record<string, string | undefined>): string[] {
  const custom = (env.OPENROUTER_MODELS ?? "")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
  return custom.length ? custom : DEFAULT_MODELS;
}

export function languageName(code: string): string {
  try {
    const name = new Intl.DisplayNames(["en"], { type: "language" }).of(code);
    return name && name !== code ? `${name} (${code})` : code;
  } catch {
    return code;
  }
}

export function systemPrompt(from: string, to: string): string {
  return `You are a professional, native-level translator and editor.

Translate the user's text from ${languageName(from)} to ${languageName(to)} so that it reads naturally and professionally to a native speaker of the target language.

- Preserve meaning, intent, tone and level of formality.
- Do not translate literally when it would sound unnatural; prefer idiomatic phrasing and standard terminology.
- Keep proper names, brand names, URLs, e-mail addresses and code as they are.

HTML (absolute requirements):
- If the text contains HTML, keep the HTML structure exactly: do not add, remove, reorder or rename tags or attributes.
- Translate only the visible text between the tags.
- Keep line breaks and spacing.

Output only the translated text, with no explanations, quotes or alternatives.`;
}

/** Sequência de tags (abertura e fechamento, sem atributos), para conferir o HTML. */
export function tagSequence(html: string): string[] {
  return [...html.matchAll(/<\/?([a-zA-Z][a-zA-Z0-9-]*)\b[^>]*>/g)].map((m) => (m[0].startsWith("</") ? `/${m[1]!.toLowerCase()}` : m[1]!.toLowerCase()));
}

export function hasHtml(text: string): boolean {
  return /<\/?[a-zA-Z][^>]*>/.test(text);
}

class ModelError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
  }
}

async function callModel(text: string, model: string, from: string, to: string, apiKey: string, fetchFn: FetchFn, referer?: string): Promise<string> {
  const res = await fetchFn(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...(referer ? { "HTTP-Referer": referer } : {}),
      "X-Title": "Rubrica",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt(from, to) },
        { role: "user", content: text },
      ],
      temperature: 0.3,
    }),
  });
  if (!res.ok) throw new ModelError(`${model}: HTTP ${res.status}`, res.status);
  const data = (await res.json().catch(() => null)) as { choices?: { message?: { content?: string } }[] } | null;
  const out = data?.choices?.[0]?.message?.content?.trim();
  if (!out) throw new ModelError(`${model}: resposta vazia`);
  if (hasHtml(text) || hasHtml(out)) {
    if (tagSequence(out).join(",") !== tagSequence(text).join(",")) throw new ModelError(`${model}: mudou o HTML`);
  }
  return out;
}

export interface TranslateOptions {
  from: string;
  to: string;
  apiKey: string;
  models?: string[];
  fetchFn?: FetchFn;
  retryDelayMs?: number;
  /** URL do site, enviada ao OpenRouter como `HTTP-Referer`. */
  referer?: string;
}

/** Traduz um texto. Lança se todos os modelos falharem (com o último erro). */
export async function translateText(text: string, opts: TranslateOptions): Promise<string> {
  if (!text.trim()) return text;
  const fetchFn = opts.fetchFn ?? fetch;
  const delay = opts.retryDelayMs ?? RETRY_DELAY_MS;
  let lastError = "nenhum modelo configurado";
  for (const model of opts.models ?? DEFAULT_MODELS) {
    for (let attempt = 1; attempt <= MAX_RETRIES_PER_MODEL; attempt++) {
      try {
        return await callModel(text, model, opts.from, opts.to, opts.apiKey, fetchFn, opts.referer);
      } catch (e) {
        lastError = (e as Error).message;
        const status = (e as ModelError).status;
        if (status !== undefined && TRANSIENT.has(status) && attempt < MAX_RETRIES_PER_MODEL) {
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
        break;
      }
    }
  }
  throw new Error(`Tradução falhou: ${lastError}`);
}

/** Traduz vários textos, no máximo `concurrency` de cada vez. Falha vira `{ error }`. */
export async function translateMany(texts: string[], opts: TranslateOptions, concurrency = 4): Promise<({ text: string } | { error: string })[]> {
  const out: ({ text: string } | { error: string })[] = new Array(texts.length);
  let next = 0;
  async function worker() {
    while (next < texts.length) {
      const i = next++;
      try {
        out[i] = { text: await translateText(texts[i]!, opts) };
      } catch (e) {
        out[i] = { error: (e as Error).message };
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, texts.length) }, worker));
  return out;
}
