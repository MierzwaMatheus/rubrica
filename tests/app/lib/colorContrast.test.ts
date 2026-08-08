import { describe, it, expect } from "vitest";
import { relativeLuminance, contrastRatio, wcagLevel } from "@/lib/colorContrast";

describe("relativeLuminance", () => {
  it("retorna 1 para branco (#ffffff)", () => {
    expect(relativeLuminance("#ffffff")).toBeCloseTo(1, 4);
  });

  it("retorna 0 para preto (#000000)", () => {
    expect(relativeLuminance("#000000")).toBeCloseTo(0, 4);
  });

  it("retorna valor intermediário para cor cinza", () => {
    const l = relativeLuminance("#808080");
    expect(l).toBeGreaterThan(0);
    expect(l).toBeLessThan(1);
  });
});

describe("contrastRatio", () => {
  it("retorna 21 para preto vs branco", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 0);
  });

  it("retorna 1 para cor vs ela mesma", () => {
    expect(contrastRatio("#6366f1", "#6366f1")).toBeCloseTo(1, 4);
  });

  it("é simétrico (ordem dos parâmetros não importa)", () => {
    const r1 = contrastRatio("#000000", "#6366f1");
    const r2 = contrastRatio("#6366f1", "#000000");
    expect(r1).toBeCloseTo(r2, 4);
  });

  it("retorna valor ≥ 1 para qualquer par de cores", () => {
    expect(contrastRatio("#ff0000", "#00ff00")).toBeGreaterThanOrEqual(1);
  });
});

describe("wcagLevel", () => {
  it("retorna 'AAA' para ratio ≥ 7", () => {
    expect(wcagLevel(7)).toBe("AAA");
    expect(wcagLevel(21)).toBe("AAA");
  });

  it("retorna 'AA' para ratio entre 4.5 e 7", () => {
    expect(wcagLevel(4.5)).toBe("AA");
    expect(wcagLevel(6.9)).toBe("AA");
  });

  it("retorna 'fail' para ratio < 4.5", () => {
    expect(wcagLevel(1)).toBe("fail");
    expect(wcagLevel(4.4)).toBe("fail");
  });
});
