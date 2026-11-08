import { describe, expect, it } from "vitest";
import { fontFallbacks, fontPreloads, planFonts } from "../src/theme/fonts";

describe("pré-carregamento de fontes", () => {
  it("pré-carrega o texto (400) e a fonte de destaque do tema no peso de título", () => {
    const plan = planFonts(undefined, { sans: "Bricolage Grotesque", mono: "IBM Plex Mono", display: "Caveat" });
    const preloads = fontPreloads(plan);
    // Fontes variáveis: o Astro registra o arquivo no primeiro peso (Bricolage 300, Caveat 400).
    expect([...preloads.values()]).toEqual([["400", "300"], ["700", "400"]]);
    expect(preloads.size).toBe(2);
  });

  it("sem fonte de destaque, só o texto", () => {
    expect([...fontPreloads(planFonts(undefined, { sans: "Inter" })).values()]).toEqual([["400", String(planFonts(undefined, { sans: "Inter" }).fonts[0]!.weights[0])].filter((w, i, a) => a.indexOf(w) === i)]);
  });

  it("letra à mão tem reserva cursiva", () => {
    expect(fontFallbacks("Caveat")).toEqual(["cursive"]);
  });
});
