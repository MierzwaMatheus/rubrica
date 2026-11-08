/**
 * Verificações puras: recebem fatos coletados da página e devolvem resultados.
 * Ficam separadas do Playwright para serem testadas sem navegador.
 */
import type { CheckResult } from "./types.ts";

export interface HeadFacts {
  h1Count: number;
  title: string;
  description: string | null;
  canonical: string | null;
  robots: string | null;
  htmlLang: string | null;
  alternates: { hreflang: string; path: string }[];
}

export interface ScriptFact {
  src: string | null;
  type: string | null;
}

const pass = (id: CheckResult["id"], message: string): CheckResult => ({ id, ok: true, message });
const fail = (id: CheckResult["id"], message: string, details?: string[]): CheckResult => ({ id, ok: false, message, ...(details && { details }) });

export const isNoindex = (facts: HeadFacts) => /\bnoindex\b/i.test(facts.robots ?? "");

export function checkH1(facts: HeadFacts): CheckResult {
  return facts.h1Count === 1 ? pass("h1", "um <h1>") : fail("h1", `esperado exatamente um <h1>, encontrados ${facts.h1Count}`);
}

export function checkTitle(facts: HeadFacts): CheckResult {
  return facts.title.trim() ? pass("title", "<title> presente") : fail("title", "<title> ausente ou vazio");
}

export function checkDescription(facts: HeadFacts): CheckResult {
  return facts.description?.trim() ? pass("description", "meta description presente") : fail("description", "meta description ausente ou vazia");
}

export function checkCanonical(facts: HeadFacts, path: string, is404: boolean): CheckResult {
  if (is404 || isNoindex(facts)) {
    return pass("canonical", is404 ? "404 dispensa canonical" : "noindex dispensa canonical");
  }
  if (!facts.canonical) return fail("canonical", "link canonical ausente");
  let canonicalPath: string;
  try {
    const { pathname } = new URL(facts.canonical, "http://x");
    canonicalPath = pathname.length > 1 ? pathname.replace(/\/+$/, "") : "/";
  } catch {
    return fail("canonical", `canonical inválido: ${facts.canonical}`);
  }
  return canonicalPath === path ? pass("canonical", "canonical aponta para a própria página") : fail("canonical", `canonical aponta para ${canonicalPath}, esperado ${path}`);
}

export function checkLang(facts: HeadFacts, expected: string | undefined): CheckResult {
  if (!facts.htmlLang) return fail("lang", "<html> sem atributo lang");
  if (!expected) return pass("lang", `lang="${facts.htmlLang}" (sem idioma esperado no sitemap)`);
  return facts.htmlLang.toLowerCase() === expected.toLowerCase()
    ? pass("lang", `lang="${facts.htmlLang}"`)
    : fail("lang", `lang="${facts.htmlLang}", mas a URL é do idioma ${expected}`);
}

/**
 * hreflang recíproco: cada alternativa declarada existe e aponta de volta.
 * `all` mapeia caminho -> alternativas declaradas na própria página.
 */
export function checkHreflang(path: string, facts: HeadFacts, all: Map<string, HeadFacts["alternates"]>): CheckResult {
  const alts = facts.alternates;
  if (alts.length === 0) return pass("hreflang", "sem versões em outros idiomas");
  const problems: string[] = [];
  if (!alts.some((a) => a.path === path)) problems.push(`falta a referência à própria página (${path})`);
  for (const alt of alts) {
    if (alt.path === path) continue;
    const back = all.get(alt.path);
    if (!back) problems.push(`${alt.hreflang} -> ${alt.path}: página não existe no sitemap`);
    else if (!back.some((b) => b.path === path)) problems.push(`${alt.hreflang} -> ${alt.path}: não aponta de volta para ${path}`);
  }
  return problems.length ? fail("hreflang", "hreflang não recíproco", problems) : pass("hreflang", `hreflang recíproco (${alts.length} versões)`);
}

export const COLOR_MODE_SCRIPT = "/_rubrica/color-mode.js";

const pathOf = (src: string) => {
  try {
    return new URL(src, "http://x").pathname;
  } catch {
    return src;
  }
};

/**
 * JavaScript por página. Sem ilha: só `/_rubrica/color-mode.js` e JSON-LD.
 * Com ilha: soma gzip abaixo do limite.
 */
export function checkJs(args: {
  islands: number;
  scripts: ScriptFact[];
  requested: { url: string; gzipBytes: number }[];
  limitKb: number;
}): CheckResult {
  const total = args.requested.reduce((n, f) => n + f.gzipBytes, 0);
  const kb = (total / 1024).toFixed(1);
  const problems: string[] = [];
  if (args.islands === 0) {
    for (const s of args.scripts) {
      if (s.src === null && /ld\+json/i.test(s.type ?? "")) continue;
      if (s.src !== null && pathOf(s.src) === COLOR_MODE_SCRIPT) continue;
      problems.push(s.src ? `<script src="${s.src}">` : `<script> inline${s.type ? ` (type="${s.type}")` : ""}`);
    }
    for (const f of args.requested) {
      if (pathOf(f.url) !== COLOR_MODE_SCRIPT) problems.push(`requisição de JavaScript: ${f.url}`);
    }
    return problems.length
      ? fail("js", "página sem ilha carrega JavaScript além de color-mode.js e JSON-LD", [...new Set(problems)])
      : pass("js", `sem ilha, só color-mode.js (${kb} KB gzip)`);
  }
  if (total > args.limitKb * 1024) {
    const biggest = [...args.requested].sort((a, b) => b.gzipBytes - a.gzipBytes).slice(0, 5);
    return fail(
      "js",
      `${kb} KB de JavaScript (gzip) acima do limite de ${args.limitKb} KB`,
      biggest.map((f) => `${(f.gzipBytes / 1024).toFixed(1)} KB ${f.url}`),
    );
  }
  return pass("js", `${args.islands} ilha(s), ${kb} KB de JavaScript (gzip), limite ${args.limitKb} KB`);
}
