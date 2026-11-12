import { describe, expect, it } from "vitest";
import { field } from "../../src/blocks/fields";
import { allTags, filterItems, groupItems, groupValue, itemMissingLocales, matchesSearch, moveId, moveIdWithin, pickTab, planCreate, planUpdate, readingMinutes, suggestSlug, tabCounts } from "../../src/admin/collections/model";

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

describe("abas da lista", () => {
  const items = [
    { _id: "e1", kind: "experience" },
    { _id: "s1", kind: "skill", group: { "pt-BR": "Front-end" } },
    { _id: "e2", kind: "experience" },
    { _id: "s2", kind: "skill", group: { "pt-BR": "IA" } },
    { _id: "s3", kind: "skill", group: { "pt-BR": "Front-end" } },
    { _id: "e3", kind: "experience", deletedAt: 1 },
    { _id: "s4", kind: "skill" },
  ];
  const ids = items.map((i) => i._id);
  const kindOf = (id: string) => items.find((i) => i._id === id)?.kind;

  it("conta os itens de cada aba sem a lixeira", () => {
    expect(tabCounts(items, "kind", ["experience", "skill", "language"])).toEqual({ experience: 2, skill: 4, language: 0 });
  });

  it("escolhe a aba do endereço só se ela existe", () => {
    expect(pickTab(["experience", "skill"], "skill")).toBe("skill");
    expect(pickTab(["experience", "skill"], "outra")).toBe("experience");
    expect(pickTab(["experience", "skill"], null)).toBe("experience");
  });

  it("move dentro do tipo trocando com o vizinho do mesmo tipo e mantém os outros no lugar", () => {
    const same = (id: string) => kindOf(id) === "skill";
    expect(moveIdWithin(ids, "s2", -1, same)).toEqual(["e1", "s2", "e2", "s1", "s3", "e3", "s4"]);
    expect(moveIdWithin(ids, "s1", 1, same)).toEqual(["e1", "s2", "e2", "s1", "s3", "e3", "s4"]);
    // Primeiro e último do tipo não saem do lugar.
    expect(moveIdWithin(ids, "s1", -1, same)).toEqual(ids);
    expect(moveIdWithin(ids, "s4", 1, same)).toEqual(ids);
  });

  it("agrupa pelo campo na ordem de aparição, com o valor no idioma principal", () => {
    const skills = items.filter((i) => i.kind === "skill");
    expect(groupItems(skills, "group", "pt-BR").map((g) => [g.group, g.items.map((i) => i._id)])).toEqual([
      ["Front-end", ["s1", "s3"]],
      ["IA", ["s2"]],
      ["", ["s4"]],
    ]);
    expect(groupValue({ group: { en: "AI" } }, "group", "pt-BR")).toBe("AI");
    expect(groupValue({ group: " Ferramentas " }, "group", "pt-BR")).toBe("Ferramentas");
  });
});
