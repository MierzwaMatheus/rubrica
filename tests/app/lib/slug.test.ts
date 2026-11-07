import { describe, it, expect } from "vitest";
import { slugify, isValidSlug } from "@/lib/slug";

describe("slugify", () => {
  it("tira acentos, pontuação e espaços", () => {
    expect(slugify("Olá, Mundo! Ação & Reação")).toBe("ola-mundo-acao-reacao");
  });

  it("junta hífens repetidos e tira os das pontas", () => {
    expect(slugify("  --Design   system--  ")).toBe("design-system");
  });

  it("sempre gera um slug válido (ou vazio)", () => {
    for (const text of ["Título com Ç e ñ", "_começa com sublinhado", "123 números", "!!!"]) {
      const slug = slugify(text);
      expect(slug === "" || isValidSlug(slug)).toBe(true);
    }
  });

  it("limita o tamanho a 120 caracteres", () => {
    expect(slugify("a ".repeat(200)).length).toBeLessThanOrEqual(120);
  });
});

describe("isValidSlug", () => {
  it("aceita minúsculas, números, hífen e sublinhado", () => {
    expect(isValidSlug("meu-post_2")).toBe(true);
  });

  it("recusa maiúsculas, espaços, barras e vazio", () => {
    expect(isValidSlug("Meu-Post")).toBe(false);
    expect(isValidSlug("meu post")).toBe(false);
    expect(isValidSlug("../fora")).toBe(false);
    expect(isValidSlug("")).toBe(false);
    expect(isValidSlug("-comeca-com-hifen")).toBe(false);
  });
});
