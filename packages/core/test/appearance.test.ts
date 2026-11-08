import { describe, expect, it } from "vitest";
import { appearanceHead } from "../src/theme/appearance";
import { planFonts } from "../src/theme/fonts";

const base = { colorMode: "dark", colorToggle: false } as const;

describe("aparência no head", () => {
  it("sem esquema, fonte nem tokens não emite nada", () => {
    expect(appearanceHead({ appearance: base }, {})).toMatchObject({ css: "", scheme: undefined });
  });

  it("usa o esquema do tema quando o site não escolhe, e o do site quando escolhe", () => {
    expect(appearanceHead({ appearance: base }, { scheme: "neon" }).scheme).toBe("neon");
    expect(appearanceHead({ appearance: { ...base, scheme: "riso" } }, { scheme: "neon" }).scheme).toBe("riso");
  });

  it("esquema desconhecido é ignorado", () => {
    expect(appearanceHead({ appearance: { ...base, scheme: "nao-existe" } }, {}).scheme).toBeUndefined();
  });

  it("tokens do painel vêm depois do esquema e com mais especificidade", () => {
    const { css } = appearanceHead({ appearance: { ...base, tokens: { "rb-accent": "#ff0000" } } }, { scheme: "neon" });
    expect(css.indexOf(":root[data-scheme]")).toBeLessThan(css.indexOf("--rb-accent:#ff0000"));
    expect(css).toContain(":root[data-theme-id][data-color-mode][lang]{--rb-accent:#ff0000}");
  });

  it("descarta tokens com nome ou valor perigoso", () => {
    const { css } = appearanceHead({ appearance: { ...base, tokens: { "a b": "1", "rb-x": "red;}body{display:none", "rb-ok": "#fff" } } }, {});
    expect(css).toBe(":root[data-theme-id][data-color-mode][lang]{--rb-ok:#fff}");
  });

  it("aponta o token de fonte para a variável carregada", () => {
    const { css, fonts } = appearanceHead({ appearance: { ...base, fontSans: "Inter" } }, { fonts: { mono: "Fira Code" } });
    expect(css).toContain("--rb-font-sans:var(--rbf-sans)");
    expect(css).toContain("--rb-font-mono:var(--rbf-mono)");
    expect(fonts.fonts.map((f) => f.name)).toEqual(["Inter", "Fira Code"]);
  });
});

describe("planFonts", () => {
  it("o site vence o tema e a mesma família não é baixada duas vezes", () => {
    const plan = planFonts({ fontSans: "Chakra Petch" }, { sans: "Inter", mono: "Chakra Petch" });
    expect(plan.fonts).toHaveLength(1);
    expect(plan.fonts[0]).toMatchObject({ name: "Chakra Petch", weights: [300, 400, 500, 600, 700] });
    expect(plan.assign).toEqual({ "--rb-font-sans": "--rbf-sans", "--rb-font-mono": "--rbf-sans" });
  });

  it("família desconhecida usa 400 e 700; nome com caracteres perigosos é ignorado", () => {
    expect(planFonts({ fontSans: "Minha Fonte" }, undefined).fonts[0]?.weights).toEqual([400, 700]);
    expect(planFonts({ fontSans: 'x"}body{' }, undefined).fonts).toEqual([]);
  });
});
