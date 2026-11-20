/** Case com a cara do cliente: contraste, cores prontas e o CSS com escopo. */
import { describe, expect, it } from "vitest";
import { accentForeground, brandCss, resolveBrand, validateBrand } from "../src/theme/brand";
import { contrastRatio } from "../src/theme/schemes";
import { isSafeFamily } from "../src/theme/fonts";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
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

  it("nome da família: a mesma regra do build (isSafeFamily)", () => {
    for (const name of ["Source Serif 4", "Big Shoulders Display", "Noto Sans JP", "Font.Name-x_y", "Fonte; }", "a\"b", "", " ", "x".repeat(65)]) {
      const ok = validateBrand({ light, fontDisplay: name }).length === 0;
      expect(ok, name).toBe(isSafeFamily(name));
    }
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
      // Sem a fonte do cliente, volta para a de destaque do tema (não para a do texto).
      expect(rule).toContain("--rb-font-display:var(--rbf-brand, var(--rb-font-display-theme))");
    }
    expect(brandCss(resolveBrand({ light })!)).not.toContain("--rb-font-display");
  });

  it("texto secundário, superfície e linhas derivados das cores do cliente, com contraste", () => {
    const token = (rule: string, name: string) => rule.match(new RegExp(`${name}:(#[0-9a-f]{6})`))![1]!;
    for (const [rule, bg] of [[rules[0]!, "#121212"], [rules[1]!, "#ffffff"]] as const) {
      const muted = token(rule, "--rb-muted");
      expect(contrastRatio(muted, bg)).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(muted, token(rule, "--rb-surface"))).toBeGreaterThanOrEqual(4.5);
      expect(muted).not.toBe(token(rule, "--rb-fg"));
    }
    expect(rules[0]).toContain("color-scheme:dark");
    expect(rules[1]).toContain("color-scheme:light");
    // No limite (texto com 4.5:1 exato), o secundário é o próprio texto.
    const tight = brandCss(resolveBrand({ light: { background: "#ffffff", foreground: "#767676", accent: "#767676" } })!);
    expect(tight).toContain("--rb-muted:#767676");
  });

  it("sucesso, erro e a terceira cor legíveis no fundo do cliente, perto do tom original", () => {
    const token = (rule: string, name: string) => rule.match(new RegExp(`${name}:(#[0-9a-f]{6})`))![1]!;
    // Marca clara num site escuro: o escuro repete o claro, e os tons do tema escuro (claros) sumiriam.
    const pale = brandCss(resolveBrand({ light: { background: "#fbf7ef", foreground: "#1c1a17", accent: "#7a1f2b" } })!).split("\n");
    // Marca escura: os tons partem dos do fundo escuro.
    const deep = brandCss(resolveBrand({ light, dark: { background: "#0b2a1f", foreground: "#f2f2f2", accent: "#e8a0aa" } })!).split("\n");
    for (const [rule, bg] of [[pale[0]!, "#fbf7ef"], [pale[1]!, "#fbf7ef"], [deep[0]!, "#0b2a1f"], [deep[1]!, "#ffffff"]] as const) {
      const surface = token(rule, "--rb-surface");
      for (const name of ["--rb-success", "--rb-danger", "--rb-accent-3"]) {
        const tone = token(rule, name);
        expect(contrastRatio(tone, bg), `${name} ${bg}`).toBeGreaterThanOrEqual(4.5);
        expect(contrastRatio(tone, surface), `${name} ${bg}`).toBeGreaterThanOrEqual(4.5);
      }
    }
    // Quando o tom original já passa, ele fica como está.
    expect(pale[0]).toContain("--rb-success:#0a6b3a");
    expect(pale[0]).toContain("--rb-danger:#b42318");
    expect(deep[0]).toContain("--rb-success:#7ee2a8");
  });

  it("nada sai do escopo do case", () => {
    expect(css).not.toMatch(/:root\{|:root\[data-scheme\]\{/);
  });
});

describe("case.css", () => {
  const css = readFileSync(fileURLToPath(new URL("../src/styles/case.css", import.meta.url)), "utf-8");

  it("a fonte do cliente nos títulos não pega o nome da família do bloco tipografia", () => {
    const rule = css.split("\n").find((l) => l.includes("[data-rb-brand-font]") && l.includes("font-family"));
    expect(rule).toBeDefined();
    expect(rule).toContain(":not(.rb-type__family)");
  });

  it("guarda a fonte de destaque do tema no :root, a reserva do brandCss", () => {
    expect(css).toMatch(/:root \{ --rb-font-display-theme: var\(--rb-font-display\); \}/);
  });
});
