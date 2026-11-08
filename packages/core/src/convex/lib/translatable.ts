/**
 * Campos traduzíveis de um documento (página, post, item de coleção): todo mapa
 * idioma → texto (decisão 26), em qualquer nível (título, SEO, campos dos blocos,
 * seções do case, `alt` das imagens). Arquivo puro.
 */
import { isLocaleCode } from "./text";

export type Path = (string | number)[];

export interface TranslatableField {
  path: Path;
  source: string;
  /** Tradução que já existe no idioma de destino. */
  current?: string;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** `{ "pt-BR": "…", en: "…" }`: só chaves de idioma e só textos. */
export function isLocalizedMap(value: unknown): value is Record<string, string> {
  if (!isPlainObject(value)) return false;
  const entries = Object.entries(value);
  return entries.length > 0 && entries.every(([k, v]) => isLocaleCode(k) && typeof v === "string");
}

export function pathToString(path: Path): string {
  return path.join(".");
}

/** Campos de controle que nunca são traduzidos. */
const SKIP = new Set(["_id", "_creationTime", "slug", "path", "createdAt", "createdBy", "updatedAt", "updatedBy", "deletedAt", "deletedBy", "authorId", "published", "publishedAt", "order", "tags"]);

/**
 * Campos com texto no idioma de origem. Sem `overwrite`, só os que ainda não têm o
 * idioma de destino.
 */
export function collectTranslatable(doc: Record<string, unknown>, from: string, to: string, overwrite = false): TranslatableField[] {
  const out: TranslatableField[] = [];
  const walk = (value: unknown, path: Path) => {
    if (isLocalizedMap(value)) {
      const source = value[from];
      if (source?.trim() && (overwrite || !value[to]?.trim())) out.push({ path, source, ...(value[to]?.trim() ? { current: value[to] } : {}) });
      return;
    }
    if (Array.isArray(value)) value.forEach((item, i) => walk(item, [...path, i]));
    else if (isPlainObject(value)) for (const [k, v] of Object.entries(value)) walk(v, [...path, k]);
  };
  for (const [key, value] of Object.entries(doc)) if (!SKIP.has(key)) walk(value, [key]);
  return out;
}

export function parsePath(path: string): Path {
  return path.split(".").map((s) => (/^\d+$/.test(s) ? Number(s) : s));
}

/**
 * Grava as traduções no documento (cópia) e devolve só os campos de primeiro nível
 * que mudaram, prontos para o `patch`. Caminho que não é mais um mapa de idioma com
 * o texto de origem é ignorado (o documento mudou desde a tradução).
 */
export function applyTranslations(doc: Record<string, unknown>, items: { path: Path; value: string }[], to: string): { patch: Record<string, unknown>; applied: string[] } {
  const patch: Record<string, unknown> = {};
  const applied: string[] = [];
  for (const { path, value } of items) {
    const [top] = path;
    if (typeof top !== "string" || SKIP.has(top) || !(top in doc)) continue;
    if (!(top in patch)) patch[top] = JSON.parse(JSON.stringify(doc[top]));
    let parent: unknown = patch;
    for (const key of path.slice(0, -1)) parent = (parent as Record<string | number, unknown> | undefined)?.[key];
    const last = path[path.length - 1]!;
    const map = (parent as Record<string | number, unknown> | undefined)?.[last];
    if (!isLocalizedMap(map)) continue;
    (parent as Record<string | number, unknown>)[last] = { ...map, [to]: value };
    applied.push(pathToString(path));
  }
  for (const key of Object.keys(patch)) if (!applied.some((p) => p === key || p.startsWith(`${key}.`))) delete patch[key];
  return { patch, applied };
}
