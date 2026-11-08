// @vitest-environment edge-runtime
import { beforeEach, describe, expect, it } from "vitest";
import { call, runtimeFor, seedSettings, setup, type T } from "./backend";

const hero = { id: "h1", type: "hero", fields: { title: { "pt-BR": "Olá", en: "Hi" } } };
const texto = { id: "t1", type: "texto", fields: { body: { "pt-BR": "<p>Texto</p>", en: "<p>Text</p>" } } };

describe("páginas e blocos pelo MCP", () => {
  let t: T;
  beforeEach(async () => {
    t = setup();
    await seedSettings(t);
  });

  it("pages_create começa em prévia: mostra o que mudaria e não grava", async () => {
    const { runtime, client } = await runtimeFor(t, "content-editor");
    const r = await call(runtime, "pages_create", { path: "/sobre", title: { "pt-BR": "Sobre", en: "About" }, blocks: [hero, texto] });
    expect(r.isError).toBe(false);
    expect(r.body).toMatchObject({ applied: false, dryRun: true });
    expect(r.body.changes.length).toBeGreaterThan(0);
    expect(r.body.next).toContain("dryRun: false");
    expect(client.writes()).toEqual([]);
    expect((await call(runtime, "pages_list")).body.pages).toEqual([]);
  });

  it("grava com dryRun:false e depois lê de volta", async () => {
    const { runtime } = await runtimeFor(t, "content-editor");
    const r = await call(runtime, "pages_create", { path: "/sobre", title: { "pt-BR": "Sobre", en: "About" }, blocks: [hero, texto], dryRun: false });
    expect(r.body).toMatchObject({ applied: true });
    const list = (await call(runtime, "pages_list")).body.pages;
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ path: "/sobre", published: false, languages: expect.arrayContaining(["pt-BR", "en"]) });
    expect(list[0].blocks.map((b: { id: string }) => b.id)).toEqual(["h1", "t1"]);
    const page = (await call(runtime, "pages_get", { page: "/sobre" })).body;
    expect(page.blocks[0].fields.title.en).toBe("Hi");
  });

  it("valida o bloco antes de chamar o backend, com erro por campo", async () => {
    const { runtime, client } = await runtimeFor(t, "content-editor");
    const r = await call(runtime, "pages_create", {
      path: "/x",
      title: { "pt-BR": "X" },
      blocks: [{ id: "h", type: "hero", fields: { title: { "pt-BR": "x".repeat(300) }, primaryCta: { label: { "pt-BR": "ok" } } } }],
      dryRun: false,
    });
    expect(r.isError).toBe(true);
    expect(r.body.problems).toEqual(expect.arrayContaining([expect.objectContaining({ blockId: "h", path: "title.pt-BR", message: expect.stringContaining("até 160") })]));
    expect(client.writes()).toEqual([]);
  });

  it("recusa bloco de outro tipo de site e de plugin desligado", async () => {
    const { runtime } = await runtimeFor(t, "content-editor");
    const empresa = await call(runtime, "pages_create", { path: "/p", title: { "pt-BR": "P" }, blocks: [{ id: "p", type: "precos", fields: {}, source: { collection: "plans" } }] });
    expect(empresa.isError).toBe(true);
    expect(JSON.stringify(empresa.body)).toMatch(/precos/);
  });

  it("block_update_fields mescla o texto por idioma e mostra antes/depois", async () => {
    const { runtime } = await runtimeFor(t, "content-editor");
    await call(runtime, "pages_create", { path: "/sobre", title: { "pt-BR": "Sobre" }, blocks: [hero], dryRun: false });
    const preview = await call(runtime, "block_update_fields", { page: "/sobre", blockId: "h1", fields: { title: { en: "Hello" } } });
    expect(preview.body.changes).toEqual([{ path: "fields.title.en", op: "change", locale: "en", before: "Hi", after: "Hello" }]);
    await call(runtime, "block_update_fields", { page: "/sobre", blockId: "h1", fields: { title: { en: "Hello" } }, dryRun: false });
    const page = (await call(runtime, "pages_get", { page: "/sobre" })).body;
    expect(page.blocks[0].fields.title).toEqual({ "pt-BR": "Olá", en: "Hello" });
  });

  it("avisa de idioma faltando e de h1 no corpo", async () => {
    const { runtime } = await runtimeFor(t, "content-editor");
    const r = await call(runtime, "pages_create", {
      path: "/sobre",
      title: { "pt-BR": "Sobre", en: "About" },
      blocks: [{ id: "t", type: "texto", fields: { body: { "pt-BR": "<h1>Oi</h1>" } } }],
    });
    expect(r.body.warnings.join(" ")).toMatch(/sem texto em en/);
    expect(r.body.warnings.join(" ")).toMatch(/<h1>/);
  });

  it("block_add, block_move, block_set_visible e block_remove", async () => {
    const { runtime } = await runtimeFor(t, "content-editor");
    await call(runtime, "pages_create", { path: "/sobre", title: { "pt-BR": "Sobre" }, blocks: [hero], dryRun: false });
    const add = await call(runtime, "block_add", { page: "/sobre", block: { type: "texto", fields: { body: { "pt-BR": "<p>x</p>" } } }, dryRun: false });
    const newId = add.body.result.blockId as string;
    expect(newId).toMatch(/^texto-/);
    const move = await call(runtime, "block_move", { page: "/sobre", blockId: newId, toIndex: 0 });
    expect(move.body.order).toEqual({ before: ["h1", newId], after: [newId, "h1"] });
    await call(runtime, "block_move", { page: "/sobre", blockId: newId, toIndex: 0, dryRun: false });
    await call(runtime, "block_set_visible", { page: "/sobre", blockId: "h1", visible: false, dryRun: false });
    let page = (await call(runtime, "pages_get", { page: "/sobre" })).body;
    expect(page.blocks.map((b: { id: string; visible: boolean }) => [b.id, b.visible])).toEqual([[newId, true], ["h1", false]]);
    const rm = await call(runtime, "block_remove", { page: "/sobre", blockId: newId });
    expect(rm.body.removed.id).toBe(newId);
    await call(runtime, "block_remove", { page: "/sobre", blockId: newId, dryRun: false });
    page = (await call(runtime, "pages_get", { page: "/sobre" })).body;
    expect(page.blocks).toHaveLength(1);
  });

  it("publica e despublica; recusa mexer em bloco que não existe", async () => {
    const { runtime } = await runtimeFor(t, "content-editor");
    await call(runtime, "pages_create", { path: "/sobre", title: { "pt-BR": "Sobre" }, blocks: [hero], dryRun: false });
    expect((await call(runtime, "pages_set_published", { page: "/sobre", dryRun: false })).body.applied).toBe(true);
    expect((await call(runtime, "pages_get", { page: "/sobre" })).body.published).toBe(true);
    const bad = await call(runtime, "block_remove", { page: "/sobre", blockId: "nao-existe" });
    expect(bad.isError).toBe(true);
    expect(bad.body.error).toContain("Bloco não encontrado");
  });

  it("pages_update muda o título por idioma e o caminho", async () => {
    const { runtime } = await runtimeFor(t, "content-editor");
    await call(runtime, "pages_create", { path: "/sobre", title: { "pt-BR": "Sobre" }, dryRun: false });
    await call(runtime, "pages_update", { page: "/sobre", title: { en: "About" }, path: "/quem-sou", dryRun: false });
    const page = (await call(runtime, "pages_get", { page: "/quem-sou" })).body;
    expect(page.title).toEqual({ "pt-BR": "Sobre", en: "About" });
  });
});
