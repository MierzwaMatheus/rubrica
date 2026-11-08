/** Monta um site estático mínimo em disco para testar o testador. */
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

export const ORIGIN = "https://exemplo.test";

export interface PageSpec {
  path: string;
  /** Corpo do <body>. */
  body: string;
  head?: string;
  lang?: string;
  /** Substitui o <head> inteiro (além do charset/viewport). */
  rawHead?: string;
  /** hreflang declarados no sitemap: [idioma, caminho]. */
  alt?: [string, string][];
}

const html = (p: PageSpec) => `<!doctype html>
<html lang="${p.lang ?? "pt-BR"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
${p.rawHead ?? `<title>Página ${p.path}</title><meta name="description" content="Descrição de ${p.path}"><link rel="canonical" href="${ORIGIN}${p.path === "/" ? "/" : p.path}">`}
${p.head ?? ""}</head><body>${p.body}</body></html>`;

export const goodBody = (title = "Título") => `<main><h1>${title}</h1><p>Texto de exemplo com contraste suficiente.</p><img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" alt="Pixel decorativo"></main>`;

export async function makeSite(pages: PageSpec[], extra: Record<string, string> = {}): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "rubrica-tester-"));
  const write = async (rel: string, content: string) => {
    await mkdir(dirname(join(dir, rel)), { recursive: true });
    await writeFile(join(dir, rel), content);
  };
  for (const p of pages) await write(p.path === "/" ? "index.html" : `${p.path.slice(1)}/index.html`, html(p));
  const urls = pages.map((p) => `<url><loc>${ORIGIN}${p.path}</loc>${(p.alt ?? []).map(([l, h]) => `<xhtml:link rel="alternate" hreflang="${l}" href="${ORIGIN}${h}"/>`).join("")}</url>`).join("");
  await write("sitemap.xml", `<?xml version="1.0"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls}</urlset>`);
  await write("404.html", html({ path: "/404", body: goodBody("Não encontrada"), rawHead: "<title>404</title><meta name=\"description\" content=\"404\">" }));
  for (const [rel, content] of Object.entries(extra)) await write(rel, content);
  return dir;
}
