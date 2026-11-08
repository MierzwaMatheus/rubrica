import { describe, expect, it } from "vitest";
import { fontFallbacks, fontPreloads, planFonts } from "../src/theme/fonts";

describe("pré-carregamento de fontes", () => {
  it("pré-carrega o texto (400) e a fonte de destaque do tema no peso de título", () => {
    const plan = planFonts(undefined, { sans: "Bricolage Grotesque", mono: "IBM Plex Mono", display: "Caveat" });
    const preloads = fontPreloads(plan);
    expect([...preloads.values()]).toEqual(["400", "700"]);
    expect(preloads.size).toBe(2);
  });

  it("sem fonte de destaque, só o texto", () => {
    expect([...fontPreloads(planFonts(undefined, { sans: "Inter" })).values()]).toEqual(["400"]);
  });

  it("letra à mão tem reserva cursiva", () => {
    expect(fontFallbacks("Caveat")).toEqual(["cursive"]);
  });
});
