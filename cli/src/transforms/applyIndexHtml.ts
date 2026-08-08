import * as nodeFsPromises from "node:fs/promises";

export interface FsModule {
  readFile: (path: string, encoding: string) => Promise<string>;
  writeFile: (path: string, data: string) => Promise<void>;
  mkdir: (path: string, options: { recursive: boolean }) => Promise<void>;
}

export interface IndexHtmlData {
  fontFamily: string;
  themeColor: string;
  siteName: string;
  siteUrl: string;
  twitterHandle: string;
  authorName: string;
}

function fontToGoogleSlug(font: string): string {
  return font.replace(/ /g, "+");
}

export async function applyIndexHtml(
  data: IndexHtmlData,
  htmlPath: string,
  fsModule: FsModule = nodeFsPromises as unknown as FsModule
): Promise<void> {
  let html = await fsModule.readFile(htmlPath, "utf-8");

  // Replace Google Fonts link
  const slug = fontToGoogleSlug(data.fontFamily);
  html = html.replace(
    /<link\s[^>]*fonts\.googleapis\.com\/css2[^>]*(?:\s*\/>|>[^<]*<\/link>)/s,
    `<link\n      href="https://fonts.googleapis.com/css2?family=${slug}:wght@300;400;500;600;700&display=swap"\n      rel="stylesheet"\n    />`
  );

  // theme-color
  html = html.replace(
    /(<meta\s+name="theme-color"\s+content=")[^"]*(")/,
    `$1${data.themeColor}$2`
  );

  // og:title
  html = html.replace(
    /(<meta\s+property="og:title"\s+content=")[^"]*(")/,
    `$1${data.siteName}$2`
  );

  // twitter:title
  html = html.replace(
    /(<meta\s+property="twitter:title"\s+content=")[^"]*(")/,
    `$1${data.siteName}$2`
  );

  // og:url
  html = html.replace(
    /(<meta\s+property="og:url"\s+content=")[^"]*(")/,
    `$1${data.siteUrl}$2`
  );

  // twitter:url
  html = html.replace(
    /(<meta\s+property="twitter:url"\s+content=")[^"]*(")/,
    `$1${data.siteUrl}$2`
  );

  // twitter:creator
  const handle = data.twitterHandle.startsWith("@")
    ? data.twitterHandle
    : `@${data.twitterHandle}`;
  html = html.replace(
    /(<meta\s+property="twitter:creator"\s+content=")[^"]*(")/,
    `$1${handle}$2`
  );

  // author
  html = html.replace(
    /(<meta\s+name="author"\s+content=")[^"]*(")/,
    `$1${data.authorName}$2`
  );

  await fsModule.writeFile(htmlPath, html);
}
