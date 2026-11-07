// @vitest-environment node
import { describe, it, expect } from "vitest";
import { fontFileUrls, googleFontUrls, inlineLocalFonts, localFontName, localizeFontCss, preloadFont } from "../../scripts/lib/fonts";

const html = `<head>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&amp;display=swap"
      rel="stylesheet"
    />
  </head>`;

const css = `/* latin-ext */
@font-face { font-family: 'Inter'; font-weight: 400; src: url(https://fonts.gstatic.com/s/inter/v1/ext.woff2) format('woff2'); unicode-range: U+0100-02BA; }
/* latin */
@font-face { font-family: 'Inter'; font-weight: 700; src: url(https://fonts.gstatic.com/s/inter/v1/b.woff2) format('woff2'); unicode-range: U+0000-00FF, U+0131; }
/* latin */
@font-face { font-family: 'Inter'; font-weight: 400; src: url(https://fonts.gstatic.com/s/inter/v1/r.woff2) format('woff2'); unicode-range: U+0000-00FF, U+0131; }`;

describe("fontes locais", () => {
  it("acha o link do Google Fonts (em várias linhas, com &amp;)", () => {
    expect(googleFontUrls(html)).toEqual(["https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap"]);
  });

  it("troca as URLs do gstatic por /fonts/<hash>", () => {
    expect(fontFileUrls(css)).toHaveLength(3);
    const local = localizeFontCss(css);
    expect(local).not.toContain("gstatic");
    expect(local).toContain(`url(/fonts/${localFontName("https://fonts.gstatic.com/s/inter/v1/r.woff2")})`);
    expect(localFontName("https://fonts.gstatic.com/s/inter/v1/r.woff2")).toMatch(/^[0-9a-f]{16}\.woff2$/);
  });

  it("pré-carrega a fonte latina de peso 400", () => {
    const local = localizeFontCss(css);
    expect(preloadFont(local)).toBe(`/fonts/${localFontName("https://fonts.gstatic.com/s/inter/v1/r.woff2")}`);
  });

  it("troca o link e os preconnects pelo CSS embutido e o preload", () => {
    const out = inlineLocalFonts(html, localizeFontCss(css));
    expect(out).not.toContain("googleapis");
    expect(out).not.toContain("gstatic");
    expect(out).toContain('<link rel="preload" href="/fonts/');
    expect(out).toContain("<style data-fonts>");
  });

  it("sem CSS local (o download falhou), o HTML fica como estava", () => {
    expect(inlineLocalFonts(html, "")).toBe(html);
  });
});
