import { describe, it, expect } from "vitest";
import { parseCreateArgs } from "../args.js";
import { encodeRecipe } from "../recipe.js";

describe("parseCreateArgs", () => {
  it("só o nome: sem receita", () => {
    expect(parseCreateArgs(["meu-portfolio"])).toEqual({ projectName: "meu-portfolio", recipe: {}, warnings: [] });
  });

  it("lê a receita depois do nome, com espaço ou com =", () => {
    const code = encodeRecipe({ layout: "zine", plugins: ["blog"] });
    expect(parseCreateArgs(["ana", "--receita", code]).recipe).toEqual({ layout: "zine", plugins: ["blog"] });
    expect(parseCreateArgs(["ana", `--receita=${code}`]).recipe).toEqual({ layout: "zine", plugins: ["blog"] });
    expect(parseCreateArgs(["--receita", code, "ana"]).projectName).toBe("ana");
  });

  it("receita inválida lança o erro amigável", () => {
    expect(() => parseCreateArgs(["ana", "--receita", "xx!"])).toThrow(/receita/i);
  });

  it("repassa os avisos da receita", () => {
    const code = encodeRecipe({ layout: "nao-existe" } as never);
    expect(parseCreateArgs(["ana", "--receita", code]).warnings[0]).toMatch(/nao-existe/);
  });

  it("opções legíveis em português", () => {
    const { recipe, warnings } = parseCreateArgs([
      "ana",
      "--layout", "zine",
      "--esquema", "riso",
      "--modo", "escuro",
      "--textura", "papel",
      "--fonte", "bricolage-grotesque",
      "--mono", "IBM Plex Mono",
      "--sem-alternancia",
      "--plugins", "blog,portfolio",
    ]);
    expect(warnings).toEqual([]);
    expect(recipe).toEqual({
      layout: "zine",
      scheme: "riso",
      colorMode: "dark",
      texture: "paper",
      fontSans: "Bricolage Grotesque",
      fontMono: "IBM Plex Mono",
      colorModeToggle: false,
      plugins: ["blog", "portfolio"],
    });
  });

  it.each([
    ["claro", "light"],
    ["escuro", "dark"],
    ["automatico", "system"],
    ["automático", "system"],
    ["light", "light"],
    ["system", "system"],
  ])("--modo %s → %s", (input, mode) => {
    expect(parseCreateArgs(["ana", "--modo", input]).recipe.colorMode).toBe(mode);
  });

  it.each([
    ["nenhuma", "none"],
    ["grao", "grain"],
    ["grão", "grain"],
    ["papel", "paper"],
    ["scanlines", "scanlines"],
    ["grain", "grain"],
  ])("--textura %s → %s", (input, texture) => {
    expect(parseCreateArgs(["ana", "--textura", input]).recipe.texture).toBe(texture);
  });

  it("--alternancia liga o botão de modo", () => {
    expect(parseCreateArgs(["ana", "--alternancia"]).recipe.colorModeToggle).toBe(true);
  });

  it("--plugins tolera espaços e vírgulas sobrando", () => {
    expect(parseCreateArgs(["ana", "--plugins", "blog, portfolio,,"])).toMatchObject({ recipe: { plugins: ["blog", "portfolio"] }, warnings: [] });
  });

  it("--plugins aceita o nome de um pacote", () => {
    expect(parseCreateArgs(["ana", "--plugins", "simple"]).recipe.plugins).toEqual(["contact-wizard", "portfolio", "resume", "about"]);
  });

  it("--plugins nenhum desliga todos", () => {
    expect(parseCreateArgs(["ana", "--plugins", "nenhum"])).toMatchObject({ recipe: { plugins: [] }, warnings: [] });
  });

  it("opções legíveis valem por cima da receita", () => {
    const code = encodeRecipe({ layout: "zine", scheme: "riso" });
    expect(parseCreateArgs(["ana", "--receita", code, "--esquema", "sumi"]).recipe).toEqual({ layout: "zine", scheme: "sumi" });
  });

  it("valores inválidos e opções desconhecidas viram avisos", () => {
    const { recipe, warnings } = parseCreateArgs(["ana", "--layout", "xpto", "--modo", "roxo", "--fonte", "Comic Sans", "--cor", "azul"]);
    expect(recipe).toEqual({});
    expect(warnings).toHaveLength(4);
    expect(warnings[3]).toMatch(/--cor/);
  });

  it("opção sem valor vira aviso", () => {
    const { recipe, warnings } = parseCreateArgs(["ana", "--layout"]);
    expect(recipe).toEqual({});
    expect(warnings[0]).toMatch(/--layout/);
  });

  it("opção seguida de outra opção não consome a outra", () => {
    const { recipe, warnings } = parseCreateArgs(["ana", "--layout", "--alternancia"]);
    expect(recipe).toEqual({ colorModeToggle: true });
    expect(warnings[0]).toMatch(/--layout/);
  });

  it("sem nome, projectName fica undefined", () => {
    expect(parseCreateArgs(["--layout", "zine"]).projectName).toBeUndefined();
  });
});
