import { describe, expect, it } from "vitest";
import { field } from "../../src/blocks/fields";
import { allTags, filterItems, itemMissingLocales, matchesSearch, moveId, planCreate, planUpdate, readingMinutes, suggestSlug } from "../../src/admin/collections/model";

describe("planUpdate", () => {
  const keys = ["title", "excerpt", "cover", "tags"];
  const saved = { title: { "pt-BR": "A" }, excerpt: { "pt-BR": "Resumo" }, cover: { url: "/a.png" } };

  it("só leva o que mudou", () => {
    const plan = planUpdate(saved, { ...saved, title: { "pt-BR": "A", en: "A" } }, keys, ["title"]);
    expect(plan.patch).toEqual({ title: { "pt-BR": "A", en: "A" } });
    expect(plan.unset).toEqual([]);
  });

  it("campo opcional esvaziado vai para unset; o obrigatório nunca", () => {
    const plan = planUpdate(saved, { title: { "pt-BR": "A" } }, keys, ["title"]);
    expect(plan.unset.sort()).toEqual(["cover", "excerpt"]);
    expect(planUpdate(saved, {}, keys, ["title"]).unset).not.toContain("title");
  });

  it("sem mudança, plano vazio", () => {
    expect(planUpdate(saved, structuredClone(saved), keys)).toEqual({ patch: {}, unset: [] });
  });

  it("criação leva só o preenchido", () => {
    expect(planCreate({ title: { "pt-BR": "A" }, cover: undefined, tags: [] }, keys)).toEqual({ title: { "pt-BR": "A" }, tags: [] });
  });
});

describe("lista", () => {
  const items = [
    { _id: "1", published: true, tags: ["design"], t: "Olá, mundo" },
    { _id: "2", published: false, tags: ["código"], t: "Rascunho" },
    { _id: "3", published: true, deletedAt: 1, tags: [], t: "Apagado" },
  ];
  const label = (i: { t: string }) => i.t;
  const base = { search: "", status: "all" as const, tag: "" };

  it("filtra por estado (a lixeira só no filtro dela)", () => {
    expect(filterItems(items, base, label).map((i) => i._id)).toEqual(["1", "2"]);
    expect(filterItems(items, { ...base, status: "published" }, label).map((i) => i._id)).toEqual(["1"]);
    expect(filterItems(items, { ...base, status: "draft" }, label).map((i) => i._id)).toEqual(["2"]);
    expect(filterItems(items, { ...base, status: "trash" }, label).map((i) => i._id)).toEqual(["3"]);
  });

  it("busca sem acento e por etiqueta", () => {
    expect(filterItems(items, { ...base, search: "ola mundo" }, label).map((i) => i._id)).toEqual(["1"]);
    expect(filterItems(items, { ...base, search: "codigo" }, label).map((i) => i._id)).toEqual(["2"]);
    expect(filterItems(items, { ...base, tag: "design" }, label).map((i) => i._id)).toEqual(["1"]);
    expect(matchesSearch("Café com leite", "cafe")).toBe(true);
    expect(matchesSearch("Café", "chá")).toBe(false);
  });

  it("etiquetas ignoram a lixeira", () => {
    expect(allTags(items)).toEqual(["código", "design"]);
  });

  it("move o item uma posição, sem sair da lista", () => {
    expect(moveId(["a", "b", "c"], "b", -1)).toEqual(["b", "a", "c"]);
    expect(moveId(["a", "b", "c"], "c", 1)).toEqual(["a", "b", "c"]);
    expect(moveId(["a", "b", "c"], "x", 1)).toEqual(["a", "b", "c"]);
  });
});

describe("textos", () => {
  it("sugere o slug do título no idioma principal", () => {
    expect(suggestSlug({ "pt-BR": "Olá, Mundo!", en: "Hello" }, "pt-BR")).toBe("ola-mundo");
    expect(suggestSlug({ en: "Hello World" }, "pt-BR")).toBe("hello-world");
    expect(suggestSlug(undefined, "pt-BR")).toBe("");
  });

  it("acha os idiomas sem tradução num item", () => {
    const fields = { title: field.text({ label: "T" }), body: field.richText({ label: "B" }) };
    expect(itemMissingLocales(fields, { title: { "pt-BR": "a", en: "a" }, body: { "pt-BR": "<p>x</p>" } }, ["pt-BR", "en"])).toEqual(["en"]);
    expect(itemMissingLocales(fields, { title: { "pt-BR": "a", en: "a" } }, ["pt-BR", "en"])).toEqual([]);
  });

  it("estima a leitura", () => {
    expect(readingMinutes("<p>curto</p>")).toBe(1);
    expect(readingMinutes(`<p>${"palavra ".repeat(600)}</p>`)).toBe(3);
  });
});
