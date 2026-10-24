import { describe, it, expect, vi } from "vitest";

// As funções testadas são puras; os repositórios só existem para os hooks do arquivo.
vi.mock("@/repositories/instances", () => ({ resumeRepository: {} }));
import {
  MONOGRAPH_CSS,
  bookOrder,
  folios,
  formatLongDate,
  itemText,
  joinAsSentence,
  projectFolios,
  readingMinutes,
  toRoman,
} from "../../../templates/layouts/monograph/MonographShared";
import type { Project } from "@/repositories/interfaces/PortfolioRepository";

// Monografia: numerais, fólios e a ordem do livro saem só dos dados existentes.

const project = (id: number, over: Partial<Project> = {}): Project => ({
  id,
  title: `Projeto ${id}`,
  description: "",
  long_description: "",
  tags: [],
  images: [],
  demo_link: "",
  github_link: "",
  ...over,
});

describe("monograph — numerais romanos", () => {
  it.each([
    [1, "I"],
    [4, "IV"],
    [9, "IX"],
    [14, "XIV"],
    [40, "XL"],
    [2026, "MMXXVI"],
  ])("%i → %s", (n, roman) => {
    expect(toRoman(n)).toBe(roman);
  });

  it("zero ou negativo vira string vazia", () => {
    expect(toRoman(0)).toBe("");
    expect(toRoman(-3)).toBe("");
  });
});

describe("monograph — fólios do sumário", () => {
  it("cada item começa depois das páginas do anterior (mínimo 2 por item)", () => {
    expect(folios([0, 0, 0])).toEqual([3, 5, 7]);
    expect(folios([1600, 0], 1)).toEqual([1, 5]);
  });

  it("lista vazia não tem fólios", () => {
    expect(folios([])).toEqual([]);
  });
});

describe("monograph — ordem do livro", () => {
  const projects = [
    project(1, { category: "Produto" }),
    project(2, { category: "Design system" }),
    project(3),
    project(4, { category: "Produto" }),
  ];

  it("agrupa por categoria (na ordem em que aparecem) e deixa os sem categoria no fim", () => {
    expect(bookOrder(projects).map((p) => p.id)).toEqual([1, 4, 2, 3]);
  });

  it("numera e pagina na ordem do livro", () => {
    const book = projectFolios(projects);
    expect(book.get(4)).toEqual({ n: 2, page: 5 });
    expect(book.get(3)).toEqual({ n: 4, page: 9 });
  });
});

describe("monograph — textos", () => {
  it("tempo de leitura ignora HTML e nunca é zero", () => {
    expect(readingMinutes("")).toBe(1);
    expect(readingMinutes(`<p>${"palavra ".repeat(401)}</p>`)).toBe(3);
  });

  it("junta itens como numa frase", () => {
    expect(joinAsSentence([], "e")).toBe("");
    expect(joinAsSentence(["React"], "e")).toBe("React");
    expect(joinAsSentence(["React", "CSS", "Figma"], "e")).toBe("React, CSS e Figma");
  });

  it("lê itens simples do currículo como string ou objeto", () => {
    expect(itemText("Comunicação")).toBe("Comunicação");
    expect(itemText({ text: "Curso" })).toBe("Curso");
    expect(itemText({ name: "Inglês", level: "Avançado" })).toBe("Inglês");
    expect(itemText(null)).toBe("");
  });

  it("data inválida não quebra a página", () => {
    expect(formatLongDate("não é data", "pt-BR")).toBe("");
    expect(formatLongDate(undefined, "pt-BR")).toBe("");
  });
});

describe("monograph — folha de estilo", () => {
  it("respeita quem pede menos movimento", () => {
    expect(MONOGRAPH_CSS).toMatch(/prefers-reduced-motion: reduce/);
  });

  it("vira uma coluna no celular", () => {
    expect(MONOGRAPH_CSS).toMatch(/@media \(max-width: 719px\)[\s\S]*\.mn-s \{ grid-template-columns: minmax\(0, 1fr\)/);
  });
});
