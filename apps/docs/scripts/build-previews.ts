/**
 * Gera os previews do combinador: um build do site de demonstração (apps/demo) para cada
 * tipo de site (pessoal e empresa) e cada tema da v2. O site mostra esses builds em
 * iframes, então o que aparece é literalmente o site de cada tema, com os dados de exemplo.
 *
 * Saída (não versionada): apps/docs/public/previews/<tema>/ (pessoal) e
 * apps/docs/public/previews/empresa/<tema>/, cada um com o seu preview-bridge.js.
 *
 * Roda da raiz do monorepo (precisa das dependências instaladas):
 *   pnpm --filter rubrica-site previews [-- --only zine,poster] [--tipo empresa]
 */
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { SCHEMES, SCHEME_TOKENS } from "@rubrica/core";
import { PORTED_THEMES } from "../../../packages/create-rubrica/src/themes.ts";
import { themeAliases } from "../../../packages/theme-tester/src/build.ts";
import { fontWeights } from "@rubrica/core";
import { MONO_FAMILIES, SANS_FAMILIES } from "../../../packages/create-rubrica/src/themes.ts";
import { SITE_KINDS, previewBase, type SiteKind } from "../src/lib/previews.ts";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../../..");
const DEMO = join(ROOT, "apps", "demo");
const OUT = join(ROOT, "apps", "docs", "public", "previews");
function argList(flag: string): Set<string> | null {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? new Set(process.argv[i + 1]!.split(",")) : null;
}
const only = argList("--only");
const kinds = argList("--tipo");

// Ponte com os esquemas do núcleo e os pesos das fontes embutidos.
const tokens = SCHEME_TOKENS as Record<string, string>;
const mapMode = (m: Record<string, string | undefined>) =>
  Object.fromEntries(Object.entries(tokens).filter(([role]) => m[role] !== undefined).map(([role, token]) => [token, m[role]]));
const schemes = Object.fromEntries(SCHEMES.map((s) => [s.id, { light: mapMode(s.light as never), dark: mapMode(s.dark as never) }]));
const fonts = Object.fromEntries([...SANS_FAMILIES, ...MONO_FAMILIES].map((f) => [f, fontWeights(f)]));
const bridgeSource = readFileSync(join(HERE, "preview-bridge.js"), "utf-8")
  .replace("var SCHEMES = __SCHEMES__;", `var SCHEMES = ${JSON.stringify(schemes)};`)
  .replace("var FONTS = __FONTS__;", `var FONTS = ${JSON.stringify(fonts)};`);
if (bridgeSource.includes("= __")) throw new Error("preview-bridge.js: marcador não substituído");

function astroBin(): string {
  const dir = dirname(createRequire(join(DEMO, "package.json")).resolve("astro/package.json"));
  return existsSync(join(dir, "bin", "astro.mjs")) ? join(dir, "bin", "astro.mjs") : join(dir, "bin", "astro.js");
}

function build(kind: SiteKind, theme: string, out: string): Promise<void> {
  return themeAliases(ROOT, `@rubrica/theme-${theme}`).then(
    (aliases) =>
      new Promise<void>((done, fail) => {
        const child = spawn(process.execPath, [astroBin(), "build", "--base", previewBase(kind, theme), "--outDir", out], {
          cwd: DEMO,
          env: {
            ...process.env,
            SITE: kind,
            THEME: `@rubrica/theme-${theme}`,
            ASTRO_TELEMETRY_DISABLED: "1",
            ...(aliases.length && { RUBRICA_THEME_ALIAS: JSON.stringify(aliases) }),
          },
        });
        let log = "";
        child.stdout.on("data", (c) => (log += c));
        child.stderr.on("data", (c) => (log += c));
        child.on("close", (code) => (code === 0 ? done() : fail(new Error(`build de ${kind}/${theme} falhou:\n${log.split("\n").slice(-25).join("\n")}`))));
      }),
  );
}

/** Todo .html, .css e .xml do build. */
function walk(dir: string, found: string[] = []): string[] {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, found);
    else if (/\.(html|css)$/.test(e.name)) found.push(p);
  }
  return found;
}

/**
 * O site do tema foi feito para a raiz do domínio: os caminhos que começam com "/" (links,
 * imagens, o script de modo) precisam do prefixo do preview. Também marca a página como
 * noindex e põe a ponte antes de qualquer outro script.
 */
function adapt(prefix: string, out: string): void {
  rmSync(join(out, "admin"), { recursive: true, force: true });
  // O rss.xml fica: o rodapé de alguns temas (ex.: garden) linka o feed.
  for (const f of ["robots.txt", "sitemap.xml", "manifest.webmanifest"]) rmSync(join(out, f), { force: true });
  writeFileSync(join(out, "preview-bridge.js"), bridgeSource.replace('var PREFIX = "__PREFIX__";', `var PREFIX = ${JSON.stringify(prefix)};`));
  for (const file of walk(out)) {
    let text = readFileSync(file, "utf-8");
    if (file.endsWith(".html")) {
      text = text
        .replace(/\b(href|src|poster|action)="\/(?!\/|previews\/)/g, `$1="${prefix}/`)
        .replace(/\bsrcset="([^"]+)"/g, (_, v: string) => `srcset="${v.replace(/(^|,\s*)\/(?!\/|previews\/)/g, `$1${prefix}/`)}"`)
        .replace(/<link rel="(?:sitemap|alternate)"[^>]*>/g, (tag) => (/application\/rss\+xml|sitemap/.test(tag) ? "" : tag))
        .replace("<head>", `<head><script src="${prefix}/preview-bridge.js"></script><meta name="robots" content="noindex">`);
    } else {
      text = text.replace(/url\((['"]?)\/(?!\/|previews\/)/g, `url($1${prefix}/`);
    }
    writeFileSync(file, text);
  }
}

/**
 * Apaga de _astro/ o que nenhuma página publicada carrega (o painel /admin sai do preview,
 * mas os scripts dele ficam lá). Segue as referências a partir dos HTML: um arquivo fica
 * se o nome dele aparece numa página ou num arquivo que já ficou. Quase metade do peso de
 * cada preview era o painel.
 */
function prune(out: string): void {
  const dir = join(out, "_astro");
  if (!existsSync(dir)) return;
  const assets = readdirSync(dir, { withFileTypes: true }).filter((e) => e.isFile()).map((e) => e.name);
  const kept = new Set<string>();
  const queue = walk(out)
    .filter((f) => !f.startsWith(dir))
    .map((f) => readFileSync(f, "utf-8"));
  while (queue.length) {
    const text = queue.pop()!;
    for (const name of assets) {
      if (kept.has(name) || !text.includes(name)) continue;
      kept.add(name);
      queue.push(readFileSync(join(dir, name), "utf-8"));
    }
  }
  for (const name of assets) if (!kept.has(name)) rmSync(join(dir, name));
}

mkdirSync(OUT, { recursive: true });
for (const kind of SITE_KINDS) {
  if (kinds && !kinds.has(kind)) continue;
  for (const theme of PORTED_THEMES) {
    if (only && !only.has(theme)) continue;
    const started = Date.now();
    const prefix = previewBase(kind, theme);
    const out = join(OUT, prefix.replace(/^\/previews\//, ""));
    rmSync(out, { recursive: true, force: true });
    await build(kind, theme, out);
    if (!existsSync(join(out, "index.html"))) throw new Error(`build de ${kind}/${theme} sem index.html`);
    adapt(prefix, out);
    prune(out);
    console.log(`preview ${kind}/${theme} pronto em ${Math.round((Date.now() - started) / 1000)}s`);
  }
}
