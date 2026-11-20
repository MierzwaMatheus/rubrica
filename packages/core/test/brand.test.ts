/** Case com a cara do cliente: contraste, cores prontas e o CSS com escopo. */
import { describe, expect, it } from "vitest";
import { accentForeground, brandCss, resolveBrand, validateBrand } from "../src/theme/brand";
import { contrastRatio } from "../src/theme/schemes";
import type { CaseBrand } from "../src/content/types";

const light = { background: "#FFFFFF", foreground: "#1A1A1A", accent: "#7A1F2B" };
const dark = { background: "#121212", foreground: "#F2F2F2", accent: "#E8A0AA" };

describe("validateBrand", () => {
  it("marca com contraste nos dois modos: sem problemas", () => {
    expect(validateBrand({ light, dark })).toEqual([]);
    expect(validateBrand({ light, fontDisplay: "Big Shoulders Display" })).toEqual([]);
  });

  it("texto abaixo de 4.5:1 e destaque abaixo de 3:1, por modo", () => {
    const issues = validateBrand({ light: { ...light, foreground: "#999999" }, dark: { ...dark, accent: "#333333" } });
    expect(issues.map((i) => [i.mode, i.path])).toEqual([
      ["light", "foreground"],
      ["dark", "accent"],
    ]);
    expect(issues[0]!.message).toMatch(/4\.5:1/);
  });

  it("cor fora do formato e fonte com caracteres estranhos", () => {
    expect(validateBrand({ light: { ...light, accent: "vermelho" } }).map((i) => i.path)).toEqual(["accent"]);
    expect(validateBrand({ light, fontDisplay: "Fonte; }" }).map((i) => i.path)).toEqual(["fontDisplay"]);
  });

  it("sem cores do modo claro, é obrigatório", () => {
    expect(validateBrand({} as CaseBrand).map((i) => i.path)).toEqual(["light"]);
  });
});

describe("accentForeground", () => {
  it("branco ou preto, o de maior contraste sobre o destaque", () => {
    expect(accentForeground("#7a1f2b")).toBe("#ffffff");
    expect(accentForeground("#f5d90a")).toBe("#000000");
    for (const accent of ["#7a1f2b", "#f5d90a", "#3366ff", "#888888"]) {
      const other = accentForeground(accent) === "#ffffff" ? "#000000" : "#ffffff";
      expect(contrastRatio(accent, accentForeground(accent))).toBeGreaterThanOrEqual(contrastRatio(accent, other));
    }
  });
});

describe("resolveBrand", () => {
  it("cores em minúsculas, texto do destaque calculado; sem escuro, o escuro repete o claro", () => {
    const r = resolveBrand({ light })!;
    expect(r.light).toEqual({ background: "#ffffff", foreground: "#1a1a1a", accent: "#7a1f2b", accentForeground: "#ffffff" });
    expect(r.dark).toEqual(r.light);
    expect(r.fontDisplay).toBeUndefined();
  });

  it("desligada, ausente ou inválida: nada (o case usa o tema)", () => {
    expect(resolveBrand(undefined)).toBeUndefined();
    expect(resolveBrand({ light, enabled: false })).toBeUndefined();
    expect(resolveBrand({ light: { ...light, foreground: "#eeeeee" } })).toBeUndefined();
  });

  it("fonte de título aparada", () => {
    expect(resolveBrand({ light, dark, fontDisplay: "  Fraunces " })?.fontDisplay).toBe("Fraunces");
  });
});

describe("brandCss", () => {
  const css = brandCss(resolveBrand({ light, dark, fontDisplay: "Big Shoulders Display" })!);
  const rules = css.split("\n");

  it("escuro por padrão, claro com data-color-mode=light e no system com prefers-color-scheme: light", () => {
    expect(rules).toHaveLength(3);
    expect(rules[0]).toMatch(/^:root \[data-rb-brand\],:root\[data-scheme\] \[data-rb-brand\]\{/);
    expect(rules[0]).toContain("--rb-bg:#121212");
    expect(rules[0]).toContain("--rb-accent-fg:#000000");
    expect(rules[1]).toContain(':root[data-color-mode="light"] [data-rb-brand]');
    expect(rules[1]).toContain("--rb-bg:#ffffff");
    expect(rules[1]).toContain("--rb-accent-fg:#ffffff");
    expect(rules[2]).toMatch(/^@media \(prefers-color-scheme:light\)\{:root\[data-color-mode="system"\] \[data-rb-brand\]/);
    expect(rules[2]).toContain("--rb-fg:#1a1a1a");
  });

  it("fonte do cliente: --rbf-brand aponta para a variável da família; reserva na fonte do texto", () => {
    for (const rule of rules) {
      expect(rule).toContain("--rbf-brand:var(--rbf-f-big-shoulders-display)");
      expect(rule).toContain("--rb-font-display:var(--rbf-brand, var(--rb-font-sans))");
    }
    expect(brandCss(resolveBrand({ light })!)).not.toContain("--rb-font-display");
  });

  it("nada sai do escopo do case", () => {
    expect(css).not.toMatch(/:root\{|:root\[data-scheme\]\{/);
  });
});
