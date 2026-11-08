/** Rotas do site a partir do sitemap.xml (mais /404). */
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export interface SitemapEntry {
  /** Caminho (sem origem), ex.: "/en/blog". */
  path: string;
  alternates: { hreflang: string; path: string }[];
}

const attr = (tag: string, name: string) => new RegExp(`${name}="([^"]*)"`).exec(tag)?.[1];
const toPath = (loc: string) => {
  try {
    const { pathname } = new URL(loc);
    return pathname.length > 1 ? pathname.replace(/\/+$/, "") : "/";
  } catch {
    return loc;
  }
};

export function parseSitemap(xml: string): SitemapEntry[] {
  const entries: SitemapEntry[] = [];
  for (const block of xml.match(/<url>[\s\S]*?<\/url>/g) ?? []) {
    const loc = /<loc>([^<]+)<\/loc>/.exec(block)?.[1];
    if (!loc) continue;
    const alternates = (block.match(/<xhtml:link\b[^>]*>/g) ?? []).flatMap((tag) => {
      const hreflang = attr(tag, "hreflang");
      const href = attr(tag, "href");
      return hreflang && href ? [{ hreflang, path: toPath(href) }] : [];
    });
    entries.push({ path: toPath(loc.trim()), alternates });
  }
  return entries;
}

export async function readSitemap(dist: string): Promise<SitemapEntry[]> {
  return parseSitemap(await readFile(join(dist, "sitemap.xml"), "utf8"));
}

/**
 * Idioma esperado por prefixo de URL, tirado dos `hreflang` do sitemap:
 * "" -> idioma principal; "en" -> en.
 */
export function localeByPrefix(entries: SitemapEntry[]): Map<string, string> {
  const map = new Map<string, string>();
  const home = entries.find((e) => e.path === "/");
  for (const alt of home?.alternates ?? []) {
    const prefix = alt.path === "/" ? "" : alt.path.split("/")[1]!;
    map.set(prefix, alt.hreflang);
  }
  return map;
}

export function expectedLang(path: string, prefixes: Map<string, string>): string | undefined {
  const first = path.split("/")[1] ?? "";
  if (first && prefixes.has(first)) return prefixes.get(first);
  return prefixes.get("");
}
