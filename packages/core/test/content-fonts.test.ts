/** Fontes de conteúdo: a fonte do cliente no case e as famílias dos blocos `tipografia`. */
import { describe, expect, it } from "vitest";
import { fontVarFor, parseWeights, planContentFonts, planFonts, routeFontVars } from "../src/theme/fonts";
import type { BlockInstance } from "../src/content/types";

const tipografia = (fonts: Record<string, unknown>[], visible = true): BlockInstance => ({ id: "t", type: "tipografia", visible, fields: { fonts } });
const light = { background: "#ffffff", foreground: "#111111", accent: "#7a1f2b" };

describe("fontVarFor", () => {
  it("uma variável por família, sem acento nem espaço, fora das variáveis do tema", () => {
    expect(fontVarFor("Big Shoulders Display")).toBe("--rbf-f-big-shoulders-display");
    expect(fontVarFor(" Fraunces ")).toBe("--rbf-f-fraunces");
    expect(fontVarFor("Sans")).not.toBe("--rbf-sans");
    expect(fontVarFor("Ação Grotesk")).toBe("--rbf-f-acao-grotesk");
  });
});

describe("parseWeights", () => {
  it("lê os pesos do texto livre, só de 100 a 900", () => {
    expect(parseWeights("400, 700")).toEqual([400, 700]);
    expect(parseWeights("700 300 300")).toEqual([300, 700]);
    expect(parseWeights("negrito, 450, 1000")).toEqual([]);
    expect(parseWeights(undefined)).toEqual([]);
  });
});

describe("planContentFonts", () => {
  it("junta a fonte do cliente e as dos blocos tipografia, sem repetir família, somando pesos", () => {
    const { fonts, warnings } = planContentFonts({
      pages: [{ blocks: [tipografia([{ family: "Big Shoulders Display", weights: "800" }])] }],
      projects: [
        { brand: { light, fontDisplay: "Big Shoulders Display" } },
        { blocks: [tipografia([{ family: "Fraunces", weights: "300, 650" }, { family: "Big Shoulders Display", weights: "400" }])] },
      ],
    });
    expect(warnings).toEqual([]);
    expect(fonts.map((f) => [f.name, f.cssVariable, f.weights])).toEqual([
      // Padrão da família desconhecida (400 e 700, pelo uso da marca) mais os pedidos.
      ["Big Shoulders Display", "--rbf-f-big-shoulders-display", [400, 700, 800]],
      ["Fraunces", "--rbf-f-fraunces", [300]],
    ]);
    expect(fonts[1]!.fallbacks).toEqual(["ui-serif", "serif"]);
  });

  it("peso que a família conhecida não tem sai com aviso; nenhum válido, os da família", () => {
    const { fonts, warnings } = planContentFonts({ pages: [{ blocks: [tipografia([{ family: "Space Mono", weights: "300, 900" }])] }], projects: [] });
    expect(fonts[0]!.weights).toEqual([400, 700]);
    expect(warnings[0]).toMatch(/Space Mono.*300, 900/);
  });

  it("nome inválido é ignorado com aviso; bloco invisível e marca desligada não pedem fonte", () => {
    const { fonts, warnings } = planContentFonts({
      pages: [{ blocks: [tipografia([{ family: "x</style>" }]), tipografia([{ family: "Inter" }], false)] }],
      projects: [{ brand: { light, enabled: false, fontDisplay: "Fraunces" } }],
    });
    expect(fonts).toEqual([]);
    expect(warnings).toHaveLength(1);
  });
});

describe("routeFontVars", () => {
  it("só as variáveis que a página usa e que o build planejou", () => {
    const plan = { ...planFonts(undefined, { sans: "Inter" }), content: planContentFonts({ pages: [], projects: [{ brand: { light, fontDisplay: "Fraunces" } }, { blocks: [tipografia([{ family: "Caveat" }])] }] }).fonts };
    expect(routeFontVars(plan, [{ type: "tipografia", fields: { fonts: [{ family: "Caveat" }, { family: "Nao Planejada" }] } }], "Fraunces")).toEqual(["--rbf-f-caveat", "--rbf-f-fraunces"]);
    expect(routeFontVars(plan, [{ type: "texto", fields: {} }])).toEqual([]);
    expect(routeFontVars(planFonts(undefined, undefined), [], "Fraunces")).toEqual([]);
  });
});
