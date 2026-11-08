/**
 * Fotografa o topo da home de cada tema a partir dos builds de preview
 * (public/previews, gerados por build-previews.ts), com a aparência que o pacote do tema
 * declara, e grava as miniaturas da galeria em public/img/layouts/<tema>.jpg.
 *
 * Rode depois de `pnpm previews`, com o site servido em algum endereço:
 *   pnpm build && pnpm preview --port 4800 &
 *   node scripts/shot-thumbnails.mjs --base http://127.0.0.1:4800
 *
 * Usa playwright-core (de node_modules ou de /tmp/rubrica-tools) e o Chromium do cache do
 * Playwright.
 */
import { readFileSync, readdirSync, existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join, dirname } from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const SITE = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const base = args[args.indexOf("--base") + 1] ?? "http://127.0.0.1:4800";

function loadPlaywright() {
  for (const dir of [SITE, join(SITE, "..", "..", "packages", "theme-tester"), "/tmp/rubrica-tools"]) {
    for (const name of ["playwright-core", "playwright"]) {
      try {
        return createRequire(join(dir, "package.json"))(name);
      } catch {}
    }
  }
  throw new Error("playwright não encontrado (pnpm install na raiz do monorepo)");
}
function chromePath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const cache = join(homedir(), ".cache", "ms-playwright");
  const dirs = existsSync(cache) ? readdirSync(cache).filter((d) => d.startsWith("chromium_headless_shell-")).sort() : [];
  return join(cache, dirs.at(-1), "chrome-headless-shell-linux64", "chrome-headless-shell");
}

// Aparência de cada tema, lida de THEME_PACKAGE_DEFAULTS (packages/create-rubrica/src/themes.ts).
const registry = readFileSync(join(SITE, "..", "..", "packages", "create-rubrica", "src", "themes.ts"), "utf-8");
const layouts = [...registry.matchAll(/^  ([a-z]+): \{ scheme: "([^"]+)", mode: "([^"]+)", fontSans: "([^"]+)"(?:, fontMono: "([^"]+)")? \},$/gm)].map(
  ([, id, scheme, mode, sans, mono]) => ({ id, scheme, mode, sans, mono: mono ?? "IBM Plex Mono" })
);
if (layouts.length !== 14) throw new Error(`esperava 14 temas em themes.ts, achei ${layouts.length}`);

const { chromium } = loadPlaywright();
const out = join(SITE, "public", "img", "layouts");
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: chromePath() });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
for (const l of layouts) {
  const q = new URLSearchParams({ mode: l.mode === "dark" ? "dark" : "light", scheme: l.scheme, sans: l.sans, mono: l.mono });
  await page.goto(`${base}/previews/${l.id}/?${q}`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(800);
  await page.screenshot({ path: join(out, `${l.id}.jpg`), type: "jpeg", quality: 78 });
  console.log(`${l.id}.jpg`);
}
await browser.close();
