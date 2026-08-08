import * as nodeFsPromises from "node:fs/promises";

export interface FsModule {
  readFile: (path: string, encoding: string) => Promise<string>;
  writeFile: (path: string, data: string) => Promise<void>;
  mkdir: (path: string, options: { recursive: boolean }) => Promise<void>;
}

function fontToGoogleSlug(font: string): string {
  return font.replace(/ /g, "+");
}

function buildFontLink(font: string): string {
  const slug = fontToGoogleSlug(font);
  return `<link\n      href="https://fonts.googleapis.com/css2?family=${slug}:wght@300;400;500;600;700&display=swap"\n      rel="stylesheet"\n    />`;
}

export async function applyFont(
  options: { fontSans: string; fontMono: string },
  paths: { css: string; html: string },
  fsModule: FsModule = nodeFsPromises as unknown as FsModule
): Promise<void> {
  const { fontSans, fontMono } = options;

  let css = await fsModule.readFile(paths.css, "utf-8");
  css = css.replace(
    /(--font-sans:\s*")[^"]*(")/,
    `$1${fontSans}$2`
  );
  css = css.replace(
    /(--font-mono:\s*")[^"]*(")/,
    `$1${fontMono}$2`
  );
  await fsModule.writeFile(paths.css, css);

  let html = await fsModule.readFile(paths.html, "utf-8");
  const newLink = buildFontLink(fontSans);
  // Replace existing Google Fonts link (multi-line) with new one
  html = html.replace(
    /<link\s[^>]*fonts\.googleapis\.com\/css2[^>]*(?:\s*\/>|>[^<]*<\/link>)/s,
    newLink
  );
  await fsModule.writeFile(paths.html, html);
}
