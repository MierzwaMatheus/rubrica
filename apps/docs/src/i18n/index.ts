import { pt, type Dict } from "./pt";
import { en } from "./en";
import type { Lang } from "./routes";

export * from "./routes";
export type { Dict };

const DICTS: Record<Lang, Dict> = { pt, en };

export function useDict(lang: Lang): Dict {
  return DICTS[lang];
}

/** Troca {chave} pelos valores: fill("Home do layout {name}", { name: "Zine" }). */
export function fill(text: string, values: Record<string, string>): string {
  return text.replace(/\{(\w+)\}/g, (m, k: string) => values[k] ?? m);
}
