import { describe, it, expect } from "vitest";
import { unflattenTranslations, serializeTranslations, validateEnv } from "../../scripts/export-i18n";

describe("unflattenTranslations", () => {
  it("converte chave simples em objeto aninhado", () => {
    const result = unflattenTranslations([{ key: "home.greeting", value: "Olá" }]);
    expect(result).toEqual({ home: { greeting: "Olá" } });
  });

  it("agrupa múltiplas chaves do mesmo nível", () => {
    const result = unflattenTranslations([
      { key: "home.greeting", value: "Olá" },
      { key: "home.title", value: "Título" },
    ]);
    expect(result).toEqual({ home: { greeting: "Olá", title: "Título" } });
  });

  it("suporta chaves com 3 ou mais níveis de aninhamento", () => {
    const result = unflattenTranslations([
      { key: "home.about.text", value: "Sobre" },
    ]);
    expect(result).toEqual({ home: { about: { text: "Sobre" } } });
  });

  it("retorna objeto vazio quando array de entrada é vazio", () => {
    expect(unflattenTranslations([])).toEqual({});
  });

  it("entradas de locales diferentes ficam em namespaces separados", () => {
    const result = unflattenTranslations([
      { key: "common.close", value: "Fechar" },
      { key: "navigation.home", value: "Início" },
    ]);
    expect(result).toEqual({
      common: { close: "Fechar" },
      navigation: { home: "Início" },
    });
  });
});

describe("serializeTranslations", () => {
  it("gera export const com o nome da variável fornecido", () => {
    const obj = { home: { greeting: "Olá" } };
    const output = serializeTranslations(obj, "ptBR");
    expect(output).toContain("export const ptBR =");
  });

  it("termina com ponto-e-vírgula e newline", () => {
    const obj = { common: { close: "Fechar" } };
    const output = serializeTranslations(obj, "ptBR");
    expect(output.trimEnd()).toMatch(/;$/);
  });

  it("valores de string são envolvidos em aspas duplas", () => {
    const obj = { home: { greeting: "Olá" } };
    const output = serializeTranslations(obj, "ptBR");
    expect(output).toContain('"Olá"');
  });

  it("chaves são escritas sem aspas quando válidas como identificadores JS", () => {
    const obj = { home: { greeting: "Olá" } };
    const output = serializeTranslations(obj, "ptBR");
    expect(output).toMatch(/home:/);
    expect(output).toMatch(/greeting:/);
  });

  it("produz saída compatível com o formato atual de pt-BR.ts (export const ptBR)", () => {
    const obj = { common: { close: "Fechar" } };
    const output = serializeTranslations(obj, "ptBR");
    expect(output).toMatch(/^export const ptBR = \{/);
  });

  it("produz saída que, quando avaliada, resulta no objeto original", () => {
    const obj = { common: { close: "Fechar", save: "Salvar" }, nav: { home: "Início" } };
    const output = serializeTranslations(obj, "ptBR");
    // Extrai o objeto literal da string e avalia
    const match = output.match(/export const ptBR = ([\s\S]+);/);
    expect(match).not.toBeNull();
    // eslint-disable-next-line no-eval
    const evaluated = eval(`(${match![1]})`);
    expect(evaluated).toEqual(obj);
  });
});

describe("validateEnv", () => {
  it("retorna a URL quando CONVEX_URL está definida", () => {
    const url = validateEnv({ CONVEX_URL: "https://example.convex.cloud" });
    expect(url).toBe("https://example.convex.cloud");
  });

  it("aceita VITE_CONVEX_URL como fallback quando CONVEX_URL está ausente", () => {
    const url = validateEnv({ VITE_CONVEX_URL: "https://vite.convex.cloud" });
    expect(url).toBe("https://vite.convex.cloud");
  });

  it("lança erro com mensagem clara quando nenhuma variável está definida", () => {
    expect(() => validateEnv({})).toThrow(/CONVEX_URL/);
  });

  it("prefere CONVEX_URL sobre VITE_CONVEX_URL quando ambas existem", () => {
    const url = validateEnv({
      CONVEX_URL: "https://primary.convex.cloud",
      VITE_CONVEX_URL: "https://fallback.convex.cloud",
    });
    expect(url).toBe("https://primary.convex.cloud");
  });
});
