/**
 * Fotografa páginas de um preview (scripts/preview-layout.ts) em Chromium headless,
 * sem depender de navegador compartilhado: cada execução abre e fecha o próprio.
 *
 * Uso:
 *   node scripts/shot-layout.mjs --port 4311 --out /tmp/shots/zine
 *     [--pages /,/sobre,/curriculo,/portfolio,/blog] [--modes light,dark]
 *     [--widths 1440,390] [--texture paper] [--locale pt-BR]
 *
 * Gera <out>/<página>-<modo>-<largura>.png (página inteira) e imprime, para cada foto,
 * avisos de rolagem horizontal e de erros no console da página.
 *
 * Precisa de playwright-core (procura em node_modules, depois em /tmp/rubrica-tools) e de
 * um Chromium (padrão: o do cache do Playwright; ou CHROME_PATH).
 */
import { mkdirSync, readdirSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";

const args = process.argv.slice(2);
const arg = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : d;
};

const port = arg("port", "4300");
const out = arg("out", `/tmp/rubrica-shots/${port}`);
const pages = arg("pages", "/,/sobre,/curriculo,/portfolio,/blog").split(",");
const modes = arg("modes", "light,dark").split(",");
const widths = arg("widths", "1440,390").split(",").map(Number);
const texture = arg("texture");
const locale = arg("locale", "pt-BR");

function loadPlaywright() {
  for (const base of [process.cwd(), "/tmp/rubrica-tools"]) {
    try {
      return createRequire(join(base, "package.json"))("playwright-core");
    } catch {}
  }
  throw new Error("playwright-core não encontrado. Rode: mkdir -p /tmp/rubrica-tools && cd /tmp/rubrica-tools && npm i playwright-core");
}

function chromePath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const cache = join(homedir(), ".cache", "ms-playwright");
  const dirs = existsSync(cache) ? readdirSync(cache).filter((d) => d.startsWith("chromium_headless_shell-")).sort() : [];
  if (!dirs.length) throw new Error("Chromium não encontrado; defina CHROME_PATH");
  return join(cache, dirs.at(-1), "chrome-headless-shell-linux64", "chrome-headless-shell");
}

const { chromium } = loadPlaywright();
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: chromePath() });

for (const mode of modes) {
  for (const width of widths) {
    const context = await browser.newContext({ viewport: { width, height: width < 600 ? 844 : 900 }, deviceScaleFactor: 1 });
    await context.addInitScript(
      ([m, l]) => {
        localStorage.setItem("rubrica-color-mode", m);
        localStorage.setItem("locale", l);
      },
      [mode, locale]
    );
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(String(e)));
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    for (const path of pages) {
      errors.length = 0;
      await page.goto(`http://127.0.0.1:${port}${path}`, { waitUntil: "networkidle" });
      if (texture) await page.evaluate((t) => document.documentElement.setAttribute("data-texture", t), texture);
      await page.waitForTimeout(600);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      const name = (path === "/" ? "home" : path.replace(/^\//, "").replace(/\//g, "_")) + `-${mode}-${width}.png`;
      await page.screenshot({ path: join(out, name), fullPage: true });
      const notes = [];
      if (overflow > 1) notes.push(`ROLAGEM HORIZONTAL de ${overflow}px`);
      // Ruído do preview: o Convex fictício e arquivos opcionais de public/data.
      const real = errors.filter((e) => !/favicon|vercel|umami|convex|Failed to load resource/i.test(e));
      if (real.length) notes.push(`erros no console: ${real.slice(0, 3).join(" | ")}`);
      console.log(`${join(out, name)}${notes.length ? "  ⚠ " + notes.join("; ") : ""}`);
    }
    await context.close();
  }
}
await browser.close();
