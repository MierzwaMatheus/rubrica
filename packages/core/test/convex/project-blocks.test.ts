// @vitest-environment edge-runtime
import { beforeEach, describe, expect, it } from "vitest";
import { api, as, internal, seedSettings, setup, type T } from "./_setup";
import { RUBRICA_DATA_MIGRATIONS } from "../../src/convex";

const texto = (id = "t1", body = "<p>Texto</p>") => ({ id, type: "texto", visible: true, fields: { body: { "pt-BR": body } } });
const hero = { id: "h", type: "hero", visible: true, fields: { title: { "pt-BR": "Olá" } } };
/* eslint-disable @typescript-eslint/no-explicit-any */
type P = any; // o `get` genérico das coleções devolve o documento sem tipo
const project = (extra: Record<string, unknown> = {}) => ({ title: { "pt-BR": "Case" }, ...extra });

describe("corpo do case em blocos", () => {
  let t: T;
  let editor: Awaited<ReturnType<typeof as>>;
  beforeEach(async () => {
    t = setup();
    await seedSettings(t);
    editor = await as(t, "content-editor");
  });

  it("grava projeto com blocos válidos e sanitiza o richText", async () => {
    const id = await editor.mutation(api.rubrica.projects.create, project({ blocks: [texto("t1", '<p>Oi</p><iframe src="x"></iframe>')] }));
    const doc = (await editor.query(api.rubrica.projects.get, { id })) as P;
    expect(doc?.blocks?.[0]?.fields.body).toEqual({ "pt-BR": "<p>Oi</p>" });
  });

  it("recusa hero dentro do case, na criação e na edição", async () => {
    await expect(editor.mutation(api.rubrica.projects.create, project({ blocks: [hero] }))).rejects.toThrow(/hero não vale dentro de um case/);
    const id = await editor.mutation(api.rubrica.projects.create, project());
    await expect(editor.mutation(api.rubrica.projects.update, { id, patch: { blocks: [hero] } })).rejects.toThrow(/hero/);
  });

  it("brand: normaliza hex e recusa contraste baixo", async () => {
    const ok = { light: { background: "#FFFFFF", foreground: "#111111", accent: "#7A1F2B" } };
    const id = await editor.mutation(api.rubrica.projects.create, project({ brand: ok }));
    expect(((await editor.query(api.rubrica.projects.get, { id })) as P)?.brand?.light).toEqual({ background: "#ffffff", foreground: "#111111", accent: "#7a1f2b" });
    const bad = { light: { background: "#ffffff", foreground: "#eeeeee", accent: "#7a1f2b" } };
    await expect(editor.mutation(api.rubrica.projects.create, project({ brand: bad }))).rejects.toThrow(/Cores do cliente inválidas: modo claro, texto sobre o fundo/);
  });

  it("mutations finas de blocos", async () => {
    const projectId = (await editor.mutation(api.rubrica.projects.create, project({ blocks: [texto("a")] }))) as never;
    await editor.mutation(api.rubrica.collections.upsertProjectBlock, { projectId, block: texto("b") });
    await editor.mutation(api.rubrica.collections.reorderProjectBlocks, { projectId, blockIds: ["b", "a"] });
    await editor.mutation(api.rubrica.collections.setProjectBlockVisible, { projectId, blockId: "a", visible: false });
    let doc = (await editor.query(api.rubrica.projects.get, { id: projectId })) as P;
    expect(doc?.blocks?.map((b: P) => [b.id, b.visible])).toEqual([["b", true], ["a", false]]);
    await expect(editor.mutation(api.rubrica.collections.reorderProjectBlocks, { projectId, blockIds: ["a"] })).rejects.toThrow(/todos os blocos/);
    await expect(editor.mutation(api.rubrica.collections.upsertProjectBlock, { projectId, block: hero })).rejects.toThrow(/hero/);
    await editor.mutation(api.rubrica.collections.removeProjectBlock, { projectId, blockId: "a" });
    doc = (await editor.query(api.rubrica.projects.get, { id: projectId })) as P;
    expect(doc?.blocks?.map((b: P) => b.id)).toEqual(["b"]);
    await expect(editor.mutation(api.rubrica.collections.removeProjectBlock, { projectId, blockId: "zz" })).rejects.toThrow(/não encontrado/);
  });

  it("papel sem conteúdo é recusado", async () => {
    const projectId = (await editor.mutation(api.rubrica.projects.create, project())) as never;
    const blog = await as(t, "blog-editor");
    await expect(blog.mutation(api.rubrica.collections.upsertProjectBlock, { projectId, block: texto() })).rejects.toThrow();
    await expect(blog.query(api.rubrica.panel.validateProjectBlocks, { blocks: [texto()] })).rejects.toThrow();
  });

  it("validateProjectBlocks usa o contexto case", async () => {
    const r = await editor.query(api.rubrica.panel.validateProjectBlocks, { blocks: [hero, texto()] });
    expect(r.blockErrors).toHaveLength(1);
    expect(r.blockErrors[0]).toMatchObject({ blockId: "h", path: "type" });
  });

  it("a migração converte content e sections em blocks e é idempotente", async () => {
    await t.run(async (ctx) => {
      await ctx.db.insert("projects", { title: { "pt-BR": "Velho" }, slug: "velho", order: 0, published: true, createdAt: 1, content: { "pt-BR": "<p>Texto</p>" }, sections: [{ title: { "pt-BR": "Etapa" }, body: { "pt-BR": "<p>x</p>" } }] } as never);
      await ctx.db.insert("projects", { title: { "pt-BR": "Novo" }, slug: "novo", order: 1, published: true, createdAt: 1 } as never);
    });
    expect(await t.mutation(internal.rubrica.collections.migrateSectionsToBlocks, {})).toEqual({ migrated: 1 });
    const docs = await t.run((ctx) => ctx.db.query("projects").collect());
    const old = docs.find((d) => d.slug === "velho")!;
    expect(old.blocks?.map((b: P) => b.id)).toEqual(["conteudo", "secao-1"]);
    expect(old.sections).toBeUndefined();
    expect(old.content).toBeUndefined();
    expect(await t.mutation(internal.rubrica.collections.migrateSectionsToBlocks, {})).toEqual({ migrated: 0 });
  });

  it("está declarada para o update do CLI", () => {
    expect(RUBRICA_DATA_MIGRATIONS).toContainEqual(expect.objectContaining({ id: "projects-sections-to-blocks", fn: "rubrica/collections:migrateSectionsToBlocks" }));
  });
});
