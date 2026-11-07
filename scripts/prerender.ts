/**
 * Pré-renderização: gera um HTML completo (conteúdo + <head> da página) para cada rota
 * pública, nos dois idiomas, depois do `vite build`. No navegador, o React assume esse
 * HTML e o site volta a ser SPA (o layout não recarrega entre páginas).
 *
 * Requer os dois builds:
 *   vite build                                              → dist/
 *   vite build --ssr src/entry-server.tsx --outDir dist-server
 *
 * Rotas que não estão aqui (painel, login, propostas, checkout) recebem dist/app.html,
 * a casca vazia da SPA (ver vercel.json).
 */
// Datas formatadas no build saem no fuso de quem mais visita (evita diferença na hidratação).
process.env.TZ = process.env.PRERENDER_TZ || "America/Sao_Paulo";
// React em modo produção (sem avisos de desenvolvimento e mais rápido).
process.env.NODE_ENV = "production";

import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join, normalize, resolve } from "path";
import { pathToFileURL } from "url";
import { listPublicRoutes } from "./lib/publicRoutes";
import { localizedPath, type Locale } from "../src/i18n/localePath";
import { PRERENDER_STATE_ID } from "../src/ssr/constants";
import type { RenderResult } from "../src/entry-server";

const ROOT = resolve(import.meta.dirname, "..");
const DIST = process.env.PRERENDER_DIST ? resolve(process.env.PRERENDER_DIST) : join(ROOT, "dist");
const SERVER_ENTRY = join(ROOT, "dist-server", "entry-server.js");
const LOCALES: Locale[] = ["pt-BR", "en-US"];

/** No build, `fetch("/data/x.json")` lê o arquivo de dist/ em vez de ir à rede. */
function serveDistFromFetch() {
  const realFetch = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    if (!url.startsWith("/")) return realFetch(input, init);
    const file = normalize(join(DIST, decodeURIComponent(url.split("?")[0])));
    if (!file.startsWith(DIST) || !existsSync(file)) return new Response("Not found", { status: 404 });
    return new Response(readFileSync(file), {
      status: 200,
      headers: { "content-type": file.endsWith(".json") ? "application/json" : "application/octet-stream" },
    });
  }) as typeof fetch;
}

/** Tags do <head> do index.html que a página substitui pelas suas (via Helmet). */
const PAGE_HEAD_TAGS = [
  /\s*<title>[\s\S]*?<\/title>/g,
  /\s*<meta\s+name="(description|robots|keywords)"[^>]*\/?>/g,
  /\s*<meta\s+property="(og|twitter):[^"]*"[^>]*\/?>/g,
  /\s*<link\s+rel="canonical"[^>]*\/?>/g,
];

function stripPageHead(template: string): string {
  const headEnd = template.indexOf("</head>");
  let head = template.slice(0, headEnd);
  for (const re of PAGE_HEAD_TAGS) head = head.replace(re, "");
  return head + template.slice(headEnd);
}

/** JSON seguro dentro de <script>: sem "</script>" nem "<!--". */
function safeJson(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

function composePage(template: string, result: RenderResult, locale: Locale): string {
  const h = result.helmet;
  const headTags = h
    ? [h.title, h.meta, h.link, h.script].map((part) => part.toString()).filter(Boolean).join("\n    ")
    : "";
  const stateTag = `<script id="${PRERENDER_STATE_ID}" type="application/json">${safeJson(result.state)}</script>`;

  return template
    .replace(/<html([^>]*)\slang="[^"]*"/, `<html$1 lang="${locale}"`)
    .replace("</head>", `    ${headTags}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root">${result.html}</div>\n    ${stateTag}`);
}

/** Modo de cor e alternância gravados pelo CLI no <html> do index.html. */
function readAppearance(template: string) {
  const html = template.match(/<html\b[^>]*>/)?.[0] ?? "";
  const attr = (name: string) => html.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];
  const mode = attr("data-color-mode");
  return {
    colorMode: mode === "light" || mode === "system" ? mode : ("dark" as const),
    colorToggle: attr("data-color-toggle") === "true",
  };
}

function outputFile(urlPath: string): string {
  return urlPath === "/" ? join(DIST, "index.html") : join(DIST, urlPath.slice(1), "index.html");
}

async function main() {
  const templatePath = join(DIST, "index.html");
  if (!existsSync(templatePath) || !existsSync(SERVER_ENTRY)) {
    throw new Error("Rode `vite build` e `vite build --ssr src/entry-server.tsx --outDir dist-server` antes.");
  }

  // Casca da SPA para as rotas do app (antes de index.html virar a home).
  copyFileSync(templatePath, join(DIST, "app.html"));
  // Endereço que não existe: a Vercel serve o 404.html com status 404 (antes, a casca da SPA
  // respondia 200 e o buscador podia indexar uma página vazia). O app desenha o "não encontrado".
  writeFileSync(
    join(DIST, "404.html"),
    readFileSync(templatePath, "utf-8").replace("</head>", '    <meta name="robots" content="noindex" />\n  </head>'),
  );
  const template = stripPageHead(readFileSync(templatePath, "utf-8"));
  const appearance = readAppearance(template);

  serveDistFromFetch();
  const { render } = (await import(pathToFileURL(SERVER_ENTRY).href)) as {
    render: (url: string, appearance: ReturnType<typeof readAppearance>) => Promise<RenderResult>;
  };

  const routes = listPublicRoutes(join(DIST, "data"));
  const failures: string[] = [];
  let written = 0;

  for (const route of routes) {
    for (const locale of LOCALES) {
      const urlPath = localizedPath(route.path, locale);
      try {
        const result = await render(urlPath, appearance);
        const file = outputFile(urlPath);
        mkdirSync(dirname(file), { recursive: true });
        writeFileSync(file, composePage(template, result, locale), "utf-8");
        written++;
      } catch (error) {
        failures.push(urlPath);
        // Sem a página pronta, o endereço recebe a casca da SPA: continua funcionando (sem SEO)
        // em vez de cair no 404.
        const file = outputFile(urlPath);
        mkdirSync(dirname(file), { recursive: true });
        copyFileSync(join(DIST, "app.html"), file);
        console.error(`[prerender] falhou em ${urlPath}:`, error);
      }
    }
  }

  console.log(`[prerender] ${written} páginas geradas (${routes.length} rotas × ${LOCALES.length} idiomas)`);
  if (failures.length > 0) {
    // Página que falhou recebe a casca da SPA no próprio endereço: funciona, sem o SEO.
    // Só derruba o build se nada foi gerado, para não travar a publicação por uma página.
    console.warn(`[prerender] ${failures.length} páginas ficaram sem pré-renderização: ${failures.join(", ")}`);
    if (written === 0) throw new Error("[prerender] nenhuma página foi gerada");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
