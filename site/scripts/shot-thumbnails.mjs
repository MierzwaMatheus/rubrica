/**
 * Fotografa o topo da home de cada layout a partir dos builds de preview
 * (site/public/previews), com a aparência recomendada do layout, e grava as miniaturas da
 * galeria em site/public/img/layouts/<layout>.jpg.
 *
 * Rode depois do build dos previews, com o site servido em algum endereço:
 *   node site/scripts/shot-thumbnails.mjs --base http://127.0.0.1:4800
 *
 * Usa playwright-core (de node_modules ou de /tmp/rubrica-tools) e o Chromium do cache do
 * Playwright, como scripts/shot-layout.mjs.
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
  for (const dir of [SITE, join(SITE, ".."), "/tmp/rubrica-tools"]) {
    try {
      return createRequire(join(dir, "package.json"))("playwright-core");
    } catch {}
  }
  throw new Error("playwright-core não encontrado (npm i playwright-core em /tmp/rubrica-tools)");
}
function chromePath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const cache = join(homedir(), ".cache", "ms-playwright");
  const dirs = existsSync(cache) ? readdirSync(cache).filter((d) => d.startsWith("chromium_headless_shell-")).sort() : [];
  return join(cache, dirs.at(-1), "chrome-headless-shell-linux64", "chrome-headless-shell");
}

// Recomendações de cada layout, lidas do registro do CLI sem precisar de TypeScript.
const registry = readFileSync(join(SITE, "..", "cli", "src", "layouts.ts"), "utf-8");
const layouts = [...registry.matchAll(/id: "([a-z]+)",[\s\S]*?fonts: \{ sans: \["([^"]+)"[\s\S]*?mono: "([^"]*)" \},\s*recommended: \{ scheme: "([^"]+)", mode: "([^"]+)", texture: "([^"]+)" \}/g)].map(
  ([, id, sans, mono, scheme, mode, texture]) => ({ id, sans, mono, scheme, mode, texture })
);

const { chromium } = loadPlaywright();
const out = join(SITE, "public", "img", "layouts");
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: chromePath() });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
for (const l of layouts) {
  const q = new URLSearchParams({ page: "/", mode: l.mode === "dark" ? "dark" : "light", toggle: "1", scheme: l.scheme, sans: l.sans, mono: l.mono || "IBM Plex Mono", texture: l.texture });
  await page.goto(`${base}/previews/${l.id}/index.html?${q}`, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(800);
  await page.screenshot({ path: join(out, `${l.id}.jpg`), type: "jpeg", quality: 78 });
  console.log(`${l.id}.jpg`);
}
await browser.close();
