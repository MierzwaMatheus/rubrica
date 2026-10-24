import { describe, it, expect } from "vitest";
import { googleFontsHref, fontLinkTag, SANS_FONTS, MONO_FONTS } from "../themes/fonts.js";

describe("googleFontsHref", () => {
  it("junta a fonte principal e a mono em um link, cada uma com os próprios pesos", () => {
    expect(googleFontsHref(["Chakra Petch", "JetBrains Mono"])).toBe(
      "https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500;600;700&display=swap"
    );
  });

  it("usa os pesos que a família tem de fato (Space Mono só 400 e 700)", () => {
    expect(googleFontsHref(["Instrument Sans", "Space Mono"])).toBe(
      "https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap"
    );
  });

  it("não repete a família quando principal e mono são a mesma", () => {
    const href = googleFontsHref(["JetBrains Mono", "JetBrains Mono"]);
    expect(href.match(/family=/g)).toHaveLength(1);
  });

  it("sem fonte mono (layout swiss), carrega só a principal", () => {
    expect(googleFontsHref(["Archivo", ""])).toBe(
      "https://fonts.googleapis.com/css2?family=Archivo:wght@300;400;500;600;700;800&display=swap"
    );
  });

  it("família desconhecida cai nos pesos 400 e 700", () => {
    expect(googleFontsHref(["Fonte Qualquer"])).toContain("family=Fonte+Qualquer:wght@400;700&");
  });

  it("fontLinkTag embrulha o href em um <link rel=stylesheet>", () => {
    const tag = fontLinkTag(["Inter", "Fira Code"]);
    expect(tag).toContain(`href="${googleFontsHref(["Inter", "Fira Code"])}"`);
    expect(tag).toContain('rel="stylesheet"');
  });

  it("não há famílias repetidas em cada lista e os pesos estão em ordem crescente", () => {
    for (const list of [SANS_FONTS, MONO_FONTS]) {
      expect(new Set(list.map((f) => f.family)).size).toBe(list.length);
    }
    for (const f of [...SANS_FONTS, ...MONO_FONTS]) {
      expect([...f.weights].sort((a, b) => a - b), f.family).toEqual(f.weights);
    }
  });
});
