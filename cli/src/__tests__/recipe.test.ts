import { describe, it, expect } from "vitest";
import {
  RECIPE_VERSION,
  encodeRecipe,
  decodeRecipe,
  sanitizeRecipe,
  recipeCommand,
  projectNameFrom,
  recipeSummary,
  type Recipe,
} from "../recipe.js";

const FULL: Recipe = {
  layout: "desktop",
  scheme: "sorbet",
  colorMode: "light",
  colorModeToggle: true,
  texture: "grain",
  fontSans: "Instrument Sans",
  fontMono: "IBM Plex Mono",
  plugins: ["portfolio", "about", "contact-wizard"],
  identity: {
    authorName: "Ana Souza",
    siteName: "Ana Souza Design",
    siteUrl: "https://anasouza.com.br",
    siteDescription: "Designer de produto e ilustradora.",
    authorEmail: "ana@anasouza.com.br",
    twitterHandle: "anasouza",
    lang: "pt-BR",
  },
};

describe("encodeRecipe / decodeRecipe", () => {
  it("ida e volta preservam tudo", () => {
    const { recipe, warnings } = decodeRecipe(encodeRecipe(FULL));
    expect(recipe).toEqual(FULL);
    expect(warnings).toEqual([]);
  });

  it("o código só tem caracteres seguros em qualquer terminal (sem aspas, espaços ou acentos)", () => {
    expect(encodeRecipe(FULL)).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("acentos e emojis sobrevivem à codificação", () => {
    const r: Recipe = { identity: { authorName: "João Ção 🎨", siteDescription: "Fotógrafa — retratos" } };
    expect(decodeRecipe(encodeRecipe(r)).recipe).toEqual(r);
  });

  it.each(["a", "ab", "abc", "~~~???>>>", "ÿÿÿ"])("ida e volta com %j (base64 com +, / e =)", (name) => {
    const r: Recipe = { identity: { authorName: name } };
    const code = encodeRecipe(r);
    expect(code).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(decodeRecipe(code).recipe).toEqual(r);
  });

  it("identidade vazia não entra no código", () => {
    const json = JSON.parse(Buffer.from(encodeRecipe({ identity: {} }), "base64url").toString("utf-8"));
    expect(json).toEqual({ v: RECIPE_VERSION });
  });

  it("bytes que não são UTF-8 válido contam como receita inválida", () => {
    const bad = Buffer.concat([Buffer.from('{"l":"'), Buffer.from([0xff, 0xfe]), Buffer.from('"}')]).toString("base64url");
    expect(() => decodeRecipe(bad)).toThrow(/receita/i);
  });

  it("versão que não é número não gera aviso", () => {
    const code = Buffer.from(JSON.stringify({ v: "9", l: "zine" })).toString("base64url");
    expect(decodeRecipe(code).warnings).toEqual([]);
  });

  it("receita parcial continua parcial (o CLI pergunta o resto)", () => {
    const r: Recipe = { layout: "zine" };
    expect(decodeRecipe(encodeRecipe(r)).recipe).toEqual(r);
  });

  it("usa chaves curtas: a receita completa cabe em menos de 450 caracteres", () => {
    expect(encodeRecipe(FULL).length).toBeLessThan(450);
  });

  it("grava a versão atual", () => {
    const json = JSON.parse(Buffer.from(encodeRecipe({}), "base64url").toString("utf-8"));
    expect(json.v).toBe(RECIPE_VERSION);
  });

  it.each(["", "!!!", "bm9wZQ", Buffer.from("[1,2]").toString("base64url"), Buffer.from("null").toString("base64url")])(
    "código inválido %j lança erro amigável",
    (code) => {
      expect(() => decodeRecipe(code)).toThrow(/receita/i);
    }
  );

  it("versão mais nova que o CLI avisa para usar o @latest, mas aproveita o que entende", () => {
    const code = Buffer.from(JSON.stringify({ v: RECIPE_VERSION + 1, l: "zine" })).toString("base64url");
    const { recipe, warnings } = decodeRecipe(code);
    expect(recipe.layout).toBe("zine");
    expect(warnings.join(" ")).toMatch(/@latest/);
  });

  it("aceita o código com espaços ou quebras de linha coladas junto", () => {
    expect(decodeRecipe(`  ${encodeRecipe({ layout: "zine" })}\n`).recipe).toEqual({ layout: "zine" });
  });
});

describe("sanitizeRecipe", () => {
  it("descarta com aviso o que o CLI não conhece", () => {
    const { recipe, warnings } = sanitizeRecipe({
      layout: "nao-existe",
      scheme: "nao-existe",
      colorMode: "roxo",
      texture: "veludo",
      fontSans: "Comic Sans",
      fontMono: "Courier",
      plugins: ["blog", "nao-existe"],
    });
    expect(recipe).toEqual({ plugins: ["blog"] });
    expect(warnings).toEqual([
      'Layout "nao-existe" não existe nesta versão; vou perguntar.',
      'Esquema de cores "nao-existe" não existe nesta versão; vou perguntar.',
      'Modo de cor "roxo" não existe nesta versão; vou perguntar.',
      'Textura "veludo" não existe nesta versão; vou perguntar.',
      'Fonte "Comic Sans" não existe nesta versão; vou perguntar.',
      'Fonte mono "Courier" não existe nesta versão; vou perguntar.',
      'Plugin "nao-existe" não existe nesta versão; ficou de fora.',
    ]);
  });

  it("aceita fonte mono vazia (layout sem mono)", () => {
    expect(sanitizeRecipe({ fontMono: "" }).recipe).toEqual({ fontMono: "" });
  });

  it("normaliza a identidade: URL sem https, e-mail e @ do X", () => {
    const { recipe } = sanitizeRecipe({
      identity: { siteUrl: "anasouza.com.br/", authorEmail: " Ana@AnaSouza.com.br ", twitterHandle: "@anasouza", authorName: "  Ana  " },
    });
    expect(recipe.identity).toEqual({
      siteUrl: "https://anasouza.com.br",
      authorEmail: "ana@anasouza.com.br",
      twitterHandle: "anasouza",
      authorName: "Ana",
    });
  });

  it("URL, e-mail e idioma inválidos saem com aviso (serão perguntados)", () => {
    const { recipe, warnings } = sanitizeRecipe({ identity: { siteUrl: "ana", authorEmail: "ana", lang: "fr-FR", authorName: "Ana" } });
    expect(recipe.identity).toEqual({ authorName: "Ana" });
    expect(warnings).toEqual([
      'Endereço "ana" não parece válido; vou perguntar.',
      'E-mail "ana" não parece válido; vou perguntar.',
      'Idioma "fr-FR" não é suportado; vou usar pt-BR.',
    ]);
  });

  it("idiomas suportados passam e identidade sem idioma não gera aviso", () => {
    expect(sanitizeRecipe({ identity: { lang: "en-US" } })).toEqual({ recipe: { identity: { lang: "en-US" } }, warnings: [] });
    expect(sanitizeRecipe({ identity: { authorName: "Ana" } }).warnings).toEqual([]);
  });

  it("endereço e e-mail só com espaços são ignorados sem aviso", () => {
    expect(sanitizeRecipe({ identity: { siteUrl: "   ", authorEmail: "  " } })).toEqual({ recipe: {}, warnings: [] });
  });

  it("ignora tipos errados sem quebrar", () => {
    const { recipe } = sanitizeRecipe({ layout: 3, colorModeToggle: "sim", plugins: "blog", identity: "x" } as never);
    expect(recipe).toEqual({});
  });

  it("plugins vazios valem (site sem plugins)", () => {
    expect(sanitizeRecipe({ plugins: [] }).recipe).toEqual({ plugins: [] });
  });

  it("campos de identidade vazios são ignorados", () => {
    expect(sanitizeRecipe({ identity: { authorName: "  ", siteName: "" } }).recipe).toEqual({});
  });
});

describe("projectNameFrom", () => {
  it.each([
    ["Ana Souza Design", "ana-souza-design"],
    ["  João & Cia.  ", "joao-cia"],
    ["Ateliê Ção!!", "atelie-cao"],
    ["", "meu-portfolio"],
    ["!!!", "meu-portfolio"],
    ["--Ana--", "ana"],
  ])("%j → %j", (input, expected) => {
    expect(projectNameFrom(input)).toBe(expected);
  });

  it("o resultado sempre passa na validação de nome do create", () => {
    expect(projectNameFrom("Ana Souza Design")).toMatch(/^[a-z0-9-]+$/);
  });
});

describe("recipeCommand", () => {
  it("monta o comando com o @latest, a pasta e a receita", () => {
    expect(recipeCommand("ana", { layout: "zine" })).toBe(`npx create-rubrica@latest ana --receita ${encodeRecipe({ layout: "zine" })}`);
  });
});

describe("recipeSummary", () => {
  it("descreve em português o que veio na receita", () => {
    expect(recipeSummary(FULL)).toEqual([
      "Layout: Desktop Retrô",
      "Cores: Sorbet, modo claro, com botão para alternar",
      "Textura: Grão de filme",
      "Fontes: Instrument Sans e IBM Plex Mono",
      "Plugins: Portfólio, Sobre, Contato",
      "Nome: Ana Souza",
      "Site: Ana Souza Design — https://anasouza.com.br",
      "E-mail: ana@anasouza.com.br",
    ]);
  });

  it("receita parcial só lista o que tem", () => {
    expect(recipeSummary({ layout: "zine" })).toEqual(["Layout: Zine"]);
    expect(recipeSummary({ colorModeToggle: true })).toEqual(["Cores: com botão para alternar"]);
  });

  it("modo escuro sem botão, automático, sem textura, sem mono e sem plugins", () => {
    expect(recipeSummary({ scheme: "neon", colorMode: "dark", colorModeToggle: false })).toEqual(["Cores: Neon, modo escuro, sem botão para alternar"]);
    expect(recipeSummary({ colorMode: "system" })).toEqual(["Cores: modo automático"]);
    expect(recipeSummary({ texture: "none", fontSans: "Archivo", fontMono: "", plugins: [] })).toEqual([
      "Textura: Nenhuma",
      "Fontes: Archivo",
      "Plugins: nenhum",
    ]);
  });
});
