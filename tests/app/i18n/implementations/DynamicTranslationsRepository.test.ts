import { describe, it, expect } from "vitest";
import { buildNestedFromRecords, DynamicTranslationsRepository } from "@/i18n/implementations/DynamicTranslationsRepository";

type SiteTextRecord = { key: string; ptBR: string; enUS?: string };

describe("buildNestedFromRecords", () => {
  it("transforma registros planos em objeto aninhado para pt-BR", () => {
    const records: SiteTextRecord[] = [
      { key: "home.greeting", ptBR: "Olá", enUS: "Hello" },
      { key: "home.subtitle", ptBR: "Bem-vindo", enUS: "Welcome" },
    ];
    const result = buildNestedFromRecords(records, "pt-BR");
    expect(result).toEqual({ home: { greeting: "Olá", subtitle: "Bem-vindo" } });
  });

  it("transforma registros planos em objeto aninhado para en-US", () => {
    const records: SiteTextRecord[] = [
      { key: "home.greeting", ptBR: "Olá", enUS: "Hello" },
    ];
    const result = buildNestedFromRecords(records, "en-US");
    expect(result).toEqual({ home: { greeting: "Hello" } });
  });

  it("usa ptBR como fallback quando enUS está ausente", () => {
    const records: SiteTextRecord[] = [
      { key: "home.title", ptBR: "Início" },
    ];
    const result = buildNestedFromRecords(records, "en-US");
    expect(result).toEqual({ home: { title: "Início" } });
  });

  it("suporta chaves com múltiplos segmentos (3+ níveis)", () => {
    const records: SiteTextRecord[] = [
      { key: "common.form.submit", ptBR: "Enviar", enUS: "Submit" },
    ];
    const result = buildNestedFromRecords(records, "pt-BR");
    expect(result).toEqual({ common: { form: { submit: "Enviar" } } });
  });

  it("retorna objeto vazio quando não há registros", () => {
    expect(buildNestedFromRecords([], "pt-BR")).toEqual({});
  });
});

describe("DynamicTranslationsRepository", () => {
  it("getStaticTranslation retorna valor dinâmico via dot-notation para pt-BR", () => {
    const records: SiteTextRecord[] = [
      { key: "home.greeting", ptBR: "Olá", enUS: "Hello" },
    ];
    const repo = new DynamicTranslationsRepository(records);
    expect(repo.getStaticTranslation("home.greeting", "pt-BR")).toBe("Olá");
  });

  it("getStaticTranslation retorna valor dinâmico para en-US", () => {
    const records: SiteTextRecord[] = [
      { key: "home.greeting", ptBR: "Olá", enUS: "Hello" },
    ];
    const repo = new DynamicTranslationsRepository(records);
    expect(repo.getStaticTranslation("home.greeting", "en-US")).toBe("Hello");
  });

  it("getStaticTranslation usa ptBR como fallback quando enUS ausente", () => {
    const records: SiteTextRecord[] = [
      { key: "home.title", ptBR: "Início" },
    ];
    const repo = new DynamicTranslationsRepository(records);
    expect(repo.getStaticTranslation("home.title", "en-US")).toBe("Início");
  });

  it("getStaticTranslation retorna undefined para chave inexistente", () => {
    const repo = new DynamicTranslationsRepository([]);
    expect(repo.getStaticTranslation("non.existent", "pt-BR")).toBeUndefined();
  });

  it("getStaticTranslation retorna undefined quando valor é objeto (não string)", () => {
    const records: SiteTextRecord[] = [
      { key: "home.title", ptBR: "Início", enUS: "Home" },
    ];
    const repo = new DynamicTranslationsRepository(records);
    expect(repo.getStaticTranslation("home", "pt-BR")).toBeUndefined();
  });

  it("getStaticValue retorna objeto aninhado intermediário", () => {
    const records: SiteTextRecord[] = [
      { key: "home.title", ptBR: "Início", enUS: "Home" },
      { key: "home.greeting", ptBR: "Olá", enUS: "Hello" },
    ];
    const repo = new DynamicTranslationsRepository(records);
    const value = repo.getStaticValue("home", "pt-BR");
    expect(value).toEqual({ title: "Início", greeting: "Olá" });
  });

  it("getAllStaticTranslations retorna o objeto aninhado completo como Record", () => {
    const records: SiteTextRecord[] = [
      { key: "common.loading", ptBR: "Carregando...", enUS: "Loading..." },
    ];
    const repo = new DynamicTranslationsRepository(records);
    const all = repo.getAllStaticTranslations("pt-BR");
    expect((all as any).common.loading).toBe("Carregando...");
  });
});
