/** Campos dos itens de coleção que os temas recebem (contrato aditivo da v2.0). */
import { describe, expect, it } from "vitest";
import { queryCollection, resolveItem, resolvePost, resolveProject } from "../src/render/collections";
import type { RawPost, RawProject, RawResumeItem, RawRoutineItem, RawTestimonial } from "../src/content/types";
import type { ResolveOptions } from "../src/render/resolve";

const opts = (locale: string): ResolveOptions => ({ locale, locales: { locales: ["pt-BR", "en"], default: "pt-BR" } });

describe("itens de coleção", () => {
  it("projeto: categoria no idioma, sem mexer nas etiquetas; sem tradução, sem categoria", () => {
    const raw: RawProject = { id: "p", slug: "p", title: { "pt-BR": "Case", en: "Case" }, category: { "pt-BR": "Produto" }, tags: ["fintech"] };
    expect(resolveProject(raw, opts("pt-BR"))).toMatchObject({ category: "Produto", tags: ["fintech"] });
    expect(resolveProject(raw, opts("en"))?.category).toBeUndefined();
    expect("category" in resolveProject({ ...raw, category: undefined }, opts("pt-BR"))!).toBe(false);
  });

  it("post: destaque exposto (falso quando ausente)", () => {
    const raw: RawPost = { id: "a", slug: "a", title: { "pt-BR": "A" }, content: { "pt-BR": "<p>a</p>" }, publishedAt: 0 };
    expect(resolvePost(raw, opts("pt-BR"))?.featured).toBe(false);
    expect(resolvePost({ ...raw, featured: true }, opts("pt-BR"))?.featured).toBe(true);
  });

  it("currículo: grupo no idioma", () => {
    const raw: RawResumeItem = { id: "r", kind: "skill", title: { "pt-BR": "Figma", en: "Figma" }, group: { "pt-BR": "Ferramentas", en: "Tools" } };
    expect(resolveItem("resume", raw, opts("en"))?.group).toBe("Tools");
    expect(resolveItem("resume", { ...raw, group: undefined }, opts("pt-BR"))).not.toHaveProperty("group");
  });

  it("dia a dia: tamanho no mosaico só quando o item define", () => {
    const raw: RawRoutineItem = { id: "d", title: { "pt-BR": "Café" }, span: "2x1" };
    expect(resolveItem("routine", raw, opts("pt-BR"))?.span).toBe("2x1");
    expect(resolveItem("routine", { ...raw, span: undefined }, opts("pt-BR"))).not.toHaveProperty("span");
  });

  it("depoimento: etiquetas (a categoria) só quando há", () => {
    const raw: RawTestimonial = { id: "t", quote: { "pt-BR": "Ótimo" }, author: "Ana", tags: ["Clientes"] };
    expect(resolveItem("testimonials", raw, opts("pt-BR"))?.tags).toEqual(["Clientes"]);
    expect(resolveItem("testimonials", { ...raw, tags: [] }, opts("pt-BR"))).not.toHaveProperty("tags");
  });

  it("consulta com destaques: só eles; sem nenhum, a lista na ordem do bloco, até o limite", () => {
    const mk = (id: string, order: number, featured?: boolean): RawProject => ({ id, slug: id, title: { "pt-BR": id }, order, featured });
    const items = [mk("c", 3), mk("a", 1), mk("b", 2), mk("d", 4)];
    const q = { collection: "projects", featured: true, limit: 3, sort: "order" } as const;
    expect(queryCollection(q, items, opts("pt-BR")).map((i) => i.id)).toEqual(["a", "b", "c"]);
    expect(queryCollection(q, [...items, mk("z", 9, true)], opts("pt-BR")).map((i) => i.id)).toEqual(["z"]);
  });
});
