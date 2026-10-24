import { describe, it, expect } from "vitest";
import { SCHEMES, ROLE_VARS, getScheme, schemeCss, SCHEME_START, SCHEME_END, contrast, type SchemeRole } from "../themes/schemes.js";

const ROLES = Object.keys(ROLE_VARS) as SchemeRole[];

/** Contraste WCAG 2 entre duas cores #RRGGBB (implementação própria, independente do código testado). */
function wcagContrast(a: string, b: string): number {
  const lum = (hex: string) => {
    const [r, g, bl] = [1, 3, 5].map((i) => {
      const c = parseInt(hex.slice(i, i + 2), 16) / 255;
      return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe("esquemas de cores (SCHEMES)", () => {
  it("tem os 15 esquemas, com ids únicos", () => {
    expect(SCHEMES.map((s) => s.id)).toEqual([
      "neon", "editorial-cream", "paper-noir", "midnight-blue", "solar-warm", "riso", "cianotipia",
      "tropicalia", "azulejo", "sumi", "fosforo", "crepusculo", "concreto", "sorbet", "alto-contraste",
    ]);
    expect(new Set(SCHEMES.map((s) => s.id)).size).toBe(SCHEMES.length);
  });

  it("os 11 papéis mapeiam para as variáveis CSS do contrato", () => {
    expect(Object.values(ROLE_VARS)).toEqual([
      "--bg", "--surface", "--subtle", "--text", "--text-muted", "--line",
      "--primary", "--on-primary", "--accent", "--on-accent", "--accent-2",
    ]);
  });

  for (const scheme of SCHEMES) {
    describe(scheme.id, () => {
      it("tem label, hint e os 11 papéis em #RRGGBB nos modos claro e escuro", () => {
        expect(scheme.label).toBeTruthy();
        expect(scheme.hint).toBeTruthy();
        for (const mode of ["light", "dark"] as const) {
          expect(Object.keys(scheme[mode]).sort(), mode).toEqual([...ROLES].sort());
          for (const role of ROLES) {
            expect(scheme[mode][role], `${mode}.${role}`).toMatch(/^#[0-9a-fA-F]{6}$/);
          }
        }
      });

      it("texto sobre o fundo tem contraste ≥ 4.5 nos dois modos", () => {
        for (const mode of ["light", "dark"] as const) {
          const c = wcagContrast(scheme[mode].text, scheme[mode].bg);
          expect(c, `${mode}: ${scheme[mode].text} sobre ${scheme[mode].bg}`).toBeGreaterThanOrEqual(4.5);
        }
      });
    });
  }

  it("getScheme acha pelo id e devolve undefined para id inexistente", () => {
    expect(getScheme("riso")?.id).toBe("riso");
    expect(getScheme("x")).toBeUndefined();
  });

  it("schemeCss fica entre os marcadores, com :root (claro) antes de .dark (escuro)", () => {
    const css = schemeCss(getScheme("neon")!);
    expect(css.startsWith(SCHEME_START)).toBe(true);
    expect(css.endsWith(SCHEME_END)).toBe(true);
    expect(css.indexOf(":root {")).toBeLessThan(css.indexOf(".dark {"));
    expect(css.match(/--bg:/g)).toHaveLength(2);
  });
});

describe("SCHEMES — primária visível sobre o fundo", () => {
  // Botões, links e blocos na primária precisam se destacar do fundo (WCAG 1.4.11: 3:1).
  for (const scheme of SCHEMES) {
    for (const mode of ["light", "dark"] as const) {
      it(`${scheme.id} (${mode}): primária × fundo ≥ 3`, () => {
        expect(contrast(scheme[mode].primary, scheme[mode].bg)).toBeGreaterThanOrEqual(3);
      });
    }
  }
});
