/** Prévia do painel: fontes de conteúdo pelo Google Fonts e o carrossel do case. */
import { describe, expect, it } from "vitest";
import { googleFontHref, previewContentFonts } from "../../src/admin/preview/fonts";
import { caseCarouselFor } from "../../src/islands/case-carousel";

describe("googleFontHref", () => {
  it("família de um peso só (desconhecida) vai sem eixo: não pede peso que não existe", () => {
    expect(googleFontHref("Bebas Neue")).toBe("https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap");
    expect(googleFontHref("DM Serif Display", [400, 700])).toBe("https://fonts.googleapis.com/css2?family=DM+Serif+Display&display=swap");
  });

  it("família conhecida: os pesos dela, ou os pedidos que ela tem", () => {
    expect(googleFontHref("Space Mono")).toBe("https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap");
    expect(googleFontHref("Fraunces", [300, 450, 800])).toBe("https://fonts.googleapis.com/css2?family=Fraunces:wght@300;800&display=swap");
    expect(googleFontHref("Space Mono", [300])).toContain("wght@400;700");
  });
});

describe("previewContentFonts", () => {
  const tipografia = (fonts: { family: string; weights?: string }[]) => ({ type: "tipografia", fields: { fonts } });

  it("famílias dos blocos tipografia e a fonte do cliente: variável e um link por família", () => {
    const r = previewContentFonts([tipografia([{ family: "Fraunces", weights: "300, 800" }, { family: "Bebas Neue" }]), { type: "texto", fields: {} }], "Big Shoulders Display");
    expect(r.css).toBe(
      ':root{--rbf-f-fraunces:"Fraunces",ui-serif,serif;--rbf-f-bebas-neue:"Bebas Neue",system-ui,sans-serif;--rbf-f-big-shoulders-display:"Big Shoulders Display",system-ui,sans-serif}',
    );
    expect(r.hrefs).toEqual([
      "https://fonts.googleapis.com/css2?family=Fraunces:wght@300;800&display=swap",
      "https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap",
      "https://fonts.googleapis.com/css2?family=Big+Shoulders+Display&display=swap",
    ]);
  });

  it("a mesma família em dois usos vira um link só, com os pesos somados; nome inválido fica de fora", () => {
    const r = previewContentFonts([tipografia([{ family: "Fraunces", weights: "300" }, { family: 'x"}' }]), tipografia([{ family: "Fraunces", weights: "700" }])], "Fraunces");
    expect(r.hrefs).toEqual(["https://fonts.googleapis.com/css2?family=Fraunces:wght@300;700&display=swap"]);
    expect(r.css).not.toContain("x");
  });

  it("sem família: nada", () => {
    expect(previewContentFonts([])).toEqual({ css: "", hrefs: [] });
  });
});

describe("caseCarouselFor", () => {
  const img = (src: string) => ({ src, alt: "" });
  const project = { title: "Marca X", cover: img("/capa.png"), gallery: [img("/1.png")] };
  const ctx = { t: (k: string) => `t:${k}` };

  it("tema com carrossel e projeto com imagens: capa e galeria, com os textos da ilha", () => {
    const props = caseCarouselFor({ caseCarousel: true }, project, ctx)!;
    expect(props.images.map((i) => i.src)).toEqual(["/capa.png", "/1.png"]);
    expect(props.title).toBe("Marca X");
    expect(Object.keys(props.texts).length).toBeGreaterThan(0);
    expect(Object.keys(props.texts).every((k) => k.startsWith("gallery.") || k.startsWith("case.gallery"))).toBe(true);
  });

  it("tema sem carrossel ou projeto sem imagens: nada", () => {
    expect(caseCarouselFor({}, project, ctx)).toBeUndefined();
    expect(caseCarouselFor({ caseCarousel: true }, { title: "x", gallery: [] }, ctx)).toBeUndefined();
  });
});
