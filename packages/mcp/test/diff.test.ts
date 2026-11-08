import { describe, expect, it } from "vitest";
import { contentWarnings, diffValues, headingWarnings, localeGaps, mergeFields, shorten } from "../src/diff";

const L = ["pt-BR", "en"];

describe("diff", () => {
  it("mostra antes e depois por idioma", () => {
    const changes = diffValues({ title: { "pt-BR": "Olá", en: "Hi" } }, { title: { "pt-BR": "Oi", en: "Hi", es: "Hola" } }, [...L, "es"]);
    expect(changes).toEqual([
      { path: "title.pt-BR", op: "change", locale: "pt-BR", before: "Olá", after: "Oi" },
      { path: "title.es", op: "add", locale: "es", after: "Hola" },
    ]);
  });

  it("não acusa mudança quando é igual e entra em listas de objetos", () => {
    expect(diffValues({ a: 1 }, { a: 1 })).toEqual([]);
    const c = diffValues({ items: [{ v: "1" }, { v: "2" }] }, { items: [{ v: "1" }, { v: "3" }, { v: "4" }] });
    expect(c.map((x) => [x.path, x.op])).toEqual([["items.1.v", "change"], ["items.2", "add"]]);
  });

  it("remove campos e corta texto longo", () => {
    expect(diffValues({ a: "x" }, {})).toEqual([{ path: "a", op: "remove", before: "x" }]);
    const long = "z".repeat(1000);
    expect(String(shorten(long))).toContain("[+400 caracteres]");
    const [c] = diffValues({ a: "" }, { a: long });
    expect(String(c!.after).length).toBeLessThan(700);
  });

  it("não trata chave de campo parecida com idioma como idioma", () => {
    const [c] = diffValues({ id: "a" }, { id: "b" }, L);
    expect(c!.locale).toBeUndefined();
  });
});

describe("avisos de conteúdo", () => {
  it("acusa texto preenchido só em alguns idiomas do site", () => {
    expect(localeGaps({ title: { "pt-BR": "Oi" } }, L)).toEqual([expect.stringContaining("title: sem texto em en")]);
    expect(localeGaps({ title: { "pt-BR": "Oi", en: "Hi" } }, L)).toEqual([]);
    expect(localeGaps({ title: { "pt-BR": "Oi" } }, ["pt-BR"])).toEqual([]);
    expect(localeGaps({ items: [{ label: { en: "x" } }] }, L)[0]).toContain("items.0.label");
  });

  it("acusa h1 no corpo", () => {
    expect(headingWarnings({ body: { "pt-BR": "<h1>x</h1>" } })).toHaveLength(1);
    expect(contentWarnings({ body: { "pt-BR": "<h2>x</h2>", en: "<h2>y</h2>" } }, L)).toEqual([]);
  });
});

describe("mesclagem", () => {
  it("mescla texto por idioma e troca o resto", () => {
    const base = { title: { "pt-BR": "Oi", en: "Hi" }, items: [1, 2] };
    expect(mergeFields(base, { title: { en: "Hello" }, items: [3] }, L)).toEqual({ title: { "pt-BR": "Oi", en: "Hello" }, items: [3] });
    expect(mergeFields(base, { title: { en: "Hello" } }, L, true).title).toEqual({ en: "Hello" });
  });
});
