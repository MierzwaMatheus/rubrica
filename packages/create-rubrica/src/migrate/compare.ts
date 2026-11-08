/**
 * Conferência da migração (passo 5): título, h1 e texto das páginas principais na v1
 * e na v2. A v1 pode vir do site no ar (URL) ou de uma pasta `dist/`; a v2, do `dist/`
 * do build do projeto migrado.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const MAIN_PAGES = ["/", "/sobre", "/portfolio", "/curriculo", "/blog", "/depoimentos", "/en", "/en/sobre"];

export interface PageSummary {
  title: string;
  h1: string[];
  /** Texto visível, sem scripts, estilos e marcação. */
  text: string;
}

const decode = (s: string) =>
  s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)));
const clean = (s: string) => decode(s.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();

export function summarize(html: string): PageSummary {
  const body = html.replace(/<(script|style|noscript|template)[\s\S]*?<\/\1>/gi, " ");
  const title = clean(/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? "");
  const h1 = [...body.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => clean(m[1]!)).filter(Boolean);
  const main = /<main[\s\S]*?<\/main>/i.exec(body)?.[0] ?? /<body[\s\S]*<\/body>/i.exec(body)?.[0] ?? body;
  return { title, h1, text: clean(main) };
}

const words = (text: string) => new Set(text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").split(/[^a-z0-9%+]+/).filter((w) => w.length > 2));

/** Parecença do texto (0 a 1): quanto do vocabulário da v1 aparece na v2. */
export function textCoverage(v1: string, v2: string): number {
  const a = words(v1);
  if (a.size === 0) return 1;
  const b = words(v2);
  let hit = 0;
  for (const w of a) if (b.has(w)) hit++;
  return hit / a.size;
}

export interface PageComparison {
  path: string;
  v1?: PageSummary;
  v2?: PageSummary;
  titleSame: boolean;
  h1Same: boolean;
  coverage: number;
  missing?: "v1" | "v2";
}

export function comparePage(path: string, v1Html: string | null, v2Html: string | null): PageComparison {
  if (v1Html === null || v2Html === null) return { path, titleSame: false, h1Same: false, coverage: 0, missing: v1Html === null ? "v1" : "v2" };
  const a = summarize(v1Html);
  const b = summarize(v2Html);
  const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
  return { path, v1: a, v2: b, titleSame: norm(a.title) === norm(b.title), h1Same: norm(a.h1.join(" | ")) === norm(b.h1.join(" | ")), coverage: textCoverage(a.text, b.text) };
}

/** HTML de uma página num `dist/` (formato diretório: /sobre → sobre/index.html). */
export function readDistPage(dist: string, path: string): string | null {
  const clean = path.replace(/^\/+|\/+$/g, "");
  for (const candidate of [join(dist, clean, "index.html"), join(dist, `${clean || "index"}.html`)]) if (existsSync(candidate)) return readFileSync(candidate, "utf-8");
  return null;
}

export async function fetchPage(base: string, path: string, fetchFn: typeof fetch = fetch): Promise<string | null> {
  try {
    const res = await fetchFn(`${base.replace(/\/+$/, "")}${path}`, { headers: { "User-Agent": "rubrica-migrar" } });
    return res.ok ? await res.text() : null;
  } catch {
    return null;
  }
}

export function formatComparison(results: PageComparison[]): string {
  return results
    .map((r) => {
      if (r.missing) return `${r.path}: não existe na ${r.missing}`;
      const pct = Math.round(r.coverage * 100);
      const flags = [r.titleSame ? "título igual" : `título: "${r.v1!.title}" → "${r.v2!.title}"`, r.h1Same ? "h1 igual" : `h1: "${r.v1!.h1.join(" | ")}" → "${r.v2!.h1.join(" | ")}"`, `${pct}% do texto da v1 aparece na v2`];
      return `${r.path}: ${flags.join("; ")}`;
    })
    .join("\n");
}
