/**
 * Prévia do que mudaria: diferenças campo a campo (por idioma, nos textos
 * traduzíveis) e avisos sobre o conteúdo resultante.
 */

export type ChangeOp = "add" | "change" | "remove";

export interface Change {
  /** Caminho do campo: `fields.title.en`, `items.2.label`. */
  path: string;
  op: ChangeOp;
  /** Idioma, quando a mudança é num texto traduzível. */
  locale?: string;
  before?: unknown;
  after?: unknown;
}

const REGION_LOCALE = /^[a-z]{2,3}-[A-Za-z0-9]{2,8}$/;
const MAX_SHOWN = 600;

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function same(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/** Texto longo (HTML de post) é cortado na prévia; o valor inteiro continua no backend. */
export function shorten(value: unknown): unknown {
  if (typeof value === "string" && value.length > MAX_SHOWN) {
    return `${value.slice(0, MAX_SHOWN)}… [+${value.length - MAX_SHOWN} caracteres]`;
  }
  return value;
}

function shortenDeep(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(shortenDeep);
  if (isPlainObject(value)) return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, shortenDeep(v)]));
  return shorten(value);
}

export function diffValues(before: unknown, after: unknown, locales: readonly string[] = [], path = ""): Change[] {
  if (same(before, after)) return [];
  const isLocale = (key: string) => locales.includes(key) || REGION_LOCALE.test(key);
  const key = path.split(".").pop() ?? "";

  if (isPlainObject(before) && isPlainObject(after)) {
    const out: Change[] = [];
    for (const k of new Set([...Object.keys(before), ...Object.keys(after)])) {
      out.push(...diffValues(before[k], after[k], locales, path ? `${path}.${k}` : k));
    }
    return out;
  }
  if (Array.isArray(before) && Array.isArray(after) && [...before, ...after].every(isPlainObject)) {
    const out: Change[] = [];
    for (let i = 0; i < Math.max(before.length, after.length); i++) out.push(...diffValues(before[i], after[i], locales, `${path}.${i}`));
    return out;
  }
  const op: ChangeOp = before === undefined ? "add" : after === undefined ? "remove" : "change";
  const change: Change = { path, op };
  if (before !== undefined) change.before = shortenDeep(before);
  if (after !== undefined) change.after = shortenDeep(after);
  if (typeof (after ?? before) === "string" && isLocale(key)) change.locale = key;
  return [change];
}

// ── Avisos sobre o conteúdo resultante ──────────────────────────────────────

/** Objeto que parece um texto por idioma: só strings, chaves de idioma. */
export function isLocalizedText(value: unknown, locales: readonly string[]): value is Record<string, string> {
  if (!isPlainObject(value)) return false;
  const entries = Object.entries(value);
  if (entries.length === 0) return false;
  return entries.every(([k, v]) => typeof v === "string" && (locales.includes(k) || REGION_LOCALE.test(k)));
}

/**
 * Textos traduzíveis preenchidos em alguns idiomas do site e vazios em outros
 * (decisão 28: sem tradução, o conteúdo não aparece no idioma).
 */
export function localeGaps(value: unknown, siteLocales: readonly string[], path = ""): string[] {
  if (siteLocales.length < 2) return [];
  if (isLocalizedText(value, siteLocales)) {
    const filled = (l: string) => (value[l] ?? "").trim().length > 0;
    const have = siteLocales.filter(filled);
    const missing = siteLocales.filter((l) => !filled(l));
    if (have.length > 0 && missing.length > 0) {
      return [`${path || "texto"}: sem texto em ${missing.join(", ")}. Nesse idioma o campo fica vazio e o conteúdo sem tradução não aparece.`];
    }
    return [];
  }
  if (Array.isArray(value)) return value.flatMap((v, i) => localeGaps(v, siteLocales, `${path}.${i}`));
  if (isPlainObject(value)) {
    return Object.entries(value).flatMap(([k, v]) => localeGaps(v, siteLocales, path ? `${path}.${k}` : k));
  }
  return [];
}

/** `<h1>` dentro de texto rico: o h1 da página é do hero. */
export function headingWarnings(value: unknown, path = ""): string[] {
  if (typeof value === "string") return /<h1[\s>]/i.test(value) ? [`${path}: contém <h1>. O h1 da página é do hero; use h2 ou h3 no corpo.`] : [];
  if (Array.isArray(value)) return value.flatMap((v, i) => headingWarnings(v, `${path}.${i}`));
  if (isPlainObject(value)) return Object.entries(value).flatMap(([k, v]) => headingWarnings(v, path ? `${path}.${k}` : k));
  return [];
}

export function contentWarnings(value: unknown, siteLocales: readonly string[], path = ""): string[] {
  return [...localeGaps(value, siteLocales, path), ...headingWarnings(value, path)];
}

// ── Mesclagem ───────────────────────────────────────────────────────────────

/**
 * Aplica `patch` sobre `base`. Um texto traduzível é mesclado por idioma (mandar só
 * `{en: "..."}` não apaga o `pt-BR`); o resto (listas, números, imagens) é trocado.
 * Com `replaceLocales`, o texto traduzível também é trocado inteiro.
 */
export function mergeFields(
  base: Record<string, unknown>,
  patch: Record<string, unknown>,
  locales: readonly string[],
  replaceLocales = false,
): Record<string, unknown> {
  const out = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    const current = out[key];
    if (!replaceLocales && isLocalizedText(value, locales) && isLocalizedText(current, locales)) out[key] = { ...current, ...value };
    else out[key] = value;
  }
  return out;
}
