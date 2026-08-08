import { v } from 'convex/values';
import { action, internalAction } from './_generated/server';
import { internal, api } from './_generated/api';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

const MODELS = [
  'google/gemini-2.0-flash-001',
  'google/gemini-2.5-flash-lite',
  'openai/gpt-4o-mini',
  'anthropic/claude-haiku-4.5',
];

const MAX_RETRIES_PER_MODEL = 2;
const RETRY_DELAY_MS = 1000;

// Erros transientes que justificam retry no mesmo modelo
const TRANSIENT_STATUSES = new Set([429, 503]);

const SYSTEM_PROMPT = `
You are a professional, native-level English technical translator and editor.

Your task is to translate text from Portuguese to English with the goal of producing output that sounds natural, fluent, and professional to a native English speaker, especially in corporate and technical contexts.

CRITICAL INSTRUCTIONS:
- Preserve the original meaning, intent, seniority, and professional impact of the text
- Do NOT translate literally if a literal translation would sound unnatural or non-idiomatic in English
- Prefer native English phrasing, terminology, and sentence structure over word-for-word translation
- You MAY adjust wording, verb choices, and sentence flow to achieve native-level clarity and professionalism
- Maintain the same level of formality and tone as the original text
- Avoid constructions that sound like direct translations from Portuguese or other Romance languages
- Prefer standard English technical terminology (e.g. "staging environment" instead of "homologation environment")

HTML HANDLING (ABSOLUTE REQUIREMENTS):
- If the text contains HTML tags, you MUST preserve the HTML structure EXACTLY as it is
- Do NOT modify, remove, add, or reorder any HTML tags
- Do NOT translate HTML tag names or attributes
- Translate ONLY the visible text content inside the tags
- Maintain all line breaks, spacing, indentation, and formatting exactly as provided
- The HTML structure must remain IDENTICAL to the original

OUTPUT RULES:
- Return ONLY the translated text
- Do not include explanations, comments, or alternatives
- Do not add or remove content
`;

async function callModel(text: string, model: string, apiKey: string): Promise<string | null> {
  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://portfolio.com',
      'X-Title': 'Portfolio Translation',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: text },
      ],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(`Translation error [${model}] status=${response.status}:`, body);
    // Sinaliza erro transiente vs permanente via exceção tipada
    const err = new Error(`HTTP ${response.status}`) as Error & { status: number };
    err.status = response.status;
    throw err;
  }

  const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  return data?.choices?.[0]?.message?.content?.trim() ?? null;
}

async function callWithRetry(text: string, apiKey: string): Promise<string> {
  for (const model of MODELS) {
    let attempt = 0;
    while (attempt < MAX_RETRIES_PER_MODEL) {
      try {
        const result = await callModel(text, model, apiKey);
        if (result !== null) return result;
        break; // resposta vazia — tenta próximo modelo
      } catch (err: unknown) {
        const status = (err as { status?: number }).status;
        const isTransient = status !== undefined && TRANSIENT_STATUSES.has(status);

        if (isTransient && attempt < MAX_RETRIES_PER_MODEL - 1) {
          attempt++;
          await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
          continue;
        }
        // Erro permanente ou esgotou retries → próximo modelo
        break;
      }
      attempt++;
    }
  }
  // Todos os modelos falharam — retorna original
  return text;
}

export async function runTranslateBatch(
  texts: string[],
  apiKey: string,
): Promise<{ translatedTexts: string[] }> {
  const translatedTexts = await Promise.all(
    texts.map((text) => {
      if (!text || text.trim() === '') return Promise.resolve('');
      return callWithRetry(text, apiKey);
    }),
  );
  return { translatedTexts };
}

export const translateBatch = action({
  args: {
    texts: v.array(v.string()),
    source: v.optional(v.string()),
    target: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<{ translatedTexts: string[] }> => {
    const actorData = await ctx.runQuery(internal.auth.requireAuthQuery, {});
    const roleDoc = await ctx.runQuery(internal.auth.getUserRoleQuery, { userId: actorData.userId });
    const allowedRoles = ['root', 'admin', 'content-editor', 'blog-editor'];
    if (!roleDoc || !allowedRoles.includes(roleDoc.role)) throw new Error('Forbidden');

    const i18nEnabled = await ctx.runQuery(api.plugins.checkPlugin, { pluginId: 'i18n' });
    if (!i18nEnabled) return { translatedTexts: args.texts };

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error('OPENROUTER_API_KEY not configured');

    return runTranslateBatch(args.texts, apiKey);
  },
});

export const translateBatchInternal = internalAction({
  args: {
    texts: v.array(v.string()),
    source: v.optional(v.string()),
    target: v.optional(v.string()),
  },
  handler: async (_ctx, args): Promise<{ translatedTexts: string[] }> => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error('OPENROUTER_API_KEY not configured');

    return runTranslateBatch(args.texts, apiKey);
  },
});
