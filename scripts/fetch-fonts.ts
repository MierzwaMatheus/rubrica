/**
 * Baixa as fontes do Google Fonts citadas no index.html para public/fonts e escreve
 * public/fonts/fonts.css com os endereços locais (ver scripts/lib/fonts.ts). Cache entre
 * builds em node_modules/.cache/rubrica-fonts. Falhou: apaga o fonts.css, e o site continua
 * usando o link do Google.
 *
 * Run: pnpm tsx scripts/fetch-fonts.ts
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { FONTS_CSS, FONTS_DIR, fontFileUrls, googleFontUrls, localFontName, localizeFontCss } from "./lib/fonts";
import { inParallel, withRetry } from "./lib/media";

const ROOT = join(import.meta.dirname, "..");
const OUT = join(ROOT, "public", FONTS_DIR);
const CACHE = join(ROOT, "node_modules", ".cache", "rubrica-fonts");
/** O Google entrega woff2 (e os subconjuntos por idioma) só para navegadores modernos. */
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

async function get(url: string): Promise<Response> {
  return withRetry(async () => {
    const res = await fetch(url, { headers: { "user-agent": USER_AGENT }, signal: AbortSignal.timeout(30_000) });
    if (!res.ok) throw new Error(`HTTP ${res.status} em ${url}`);
    return res;
  });
}

async function main() {
  const urls = googleFontUrls(readFileSync(join(ROOT, "index.html"), "utf-8"));
  rmSync(OUT, { recursive: true, force: true });
  if (urls.length === 0) return console.log("✓ fontes: nenhuma do Google Fonts no index.html");

  mkdirSync(OUT, { recursive: true });
  mkdirSync(CACHE, { recursive: true });
  const css = (await Promise.all(urls.map(async (u) => (await get(u)).text()))).join("\n");
  const files = fontFileUrls(css);
  let cached = 0;
  await inParallel(files, 6, async (url) => {
    const name = localFontName(url);
    const inCache = join(CACHE, name);
    if (existsSync(inCache)) cached++;
    else {
      const data = new Uint8Array(await (await get(url)).arrayBuffer());
      writeFileSync(`${inCache}.tmp`, data);
      copyFileSync(`${inCache}.tmp`, inCache);
      rmSync(`${inCache}.tmp`, { force: true });
    }
    copyFileSync(inCache, join(OUT, name));
  });
  writeFileSync(join(OUT, FONTS_CSS), localizeFontCss(css));
  console.log(`✓ fontes: ${files.length} arquivo(s), ${cached} já em cache → public/${FONTS_DIR}`);
}

main().catch((error) => {
  // Sem as fontes locais, o index.html continua com o link do Google: não derruba o build.
  rmSync(OUT, { recursive: true, force: true });
  console.warn("Aviso: não baixou as fontes, o site usa o Google Fonts:", error instanceof Error ? error.message : error);
});
