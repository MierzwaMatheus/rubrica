/**
 * Gera os previews do combinador: um build do site de demonstração (apps/demo) para cada
 * tema da v2, com o `astro build --base /previews/<tema>`. O site mostra esses builds em
 * iframes, então o que aparece é literalmente o site de cada tema, com os dados de exemplo.
 *
 * Saída (não versionada): apps/docs/public/previews/<tema>/ e preview-bridge.js.
 *
 * Roda da raiz do monorepo (precisa das dependências instaladas):
 *   pnpm --filter rubrica-site previews [-- --only zine,poster]
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

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "../../..");
const DEMO = join(ROOT, "apps", "demo");
const OUT = join(ROOT, "apps", "docs", "public", "previews");
const only = (() => {
  const i = process.argv.indexOf("--only");
  return i >= 0 ? new Set(process.argv[i + 1]!.split(",")) : null;
})();

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

function build(theme: string, out: string): Promise<void> {
  return themeAliases(ROOT, `@rubrica/theme-${theme}`).then(
    (aliases) =>
      new Promise<void>((done, fail) => {
        const child = spawn(process.execPath, [astroBin(), "build", "--base", `/previews/${theme}`, "--outDir", out], {
          cwd: DEMO,
          env: {
            ...process.env,
            SITE: "pessoal",
            THEME: `@rubrica/theme-${theme}`,
            ASTRO_TELEMETRY_DISABLED: "1",
            ...(aliases.length && { RUBRICA_THEME_ALIAS: JSON.stringify(aliases) }),
          },
        });
        let log = "";
        child.stdout.on("data", (c) => (log += c));
        child.stderr.on("data", (c) => (log += c));
        child.on("close", (code) => (code === 0 ? done() : fail(new Error(`build de ${theme} falhou:\n${log.split("\n").slice(-25).join("\n")}`))));
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
function adapt(theme: string, out: string): void {
  const prefix = `/previews/${theme}`;
  rmSync(join(out, "admin"), { recursive: true, force: true });
  // O rss.xml fica: o rodapé de alguns temas (ex.: garden) linka o feed.
  for (const f of ["robots.txt", "sitemap.xml", "manifest.webmanifest"]) rmSync(join(out, f), { force: true });
  writeFileSync(join(out, "preview-bridge.js"), bridgeSource.replace("__PREFIX__", prefix));
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

mkdirSync(OUT, { recursive: true });
for (const theme of PORTED_THEMES) {
  if (only && !only.has(theme)) continue;
  const started = Date.now();
  const out = join(OUT, theme);
  rmSync(out, { recursive: true, force: true });
  await build(theme, out);
  if (!existsSync(join(out, "index.html"))) throw new Error(`build de ${theme} sem index.html`);
  adapt(theme, out);
  console.log(`preview ${theme} pronto em ${Math.round((Date.now() - started) / 1000)}s`);
}
