// @vitest-environment edge-runtime
import { beforeEach, describe, expect, it } from "vitest";
import { call, runtimeFor, seedSettings, setup, type T } from "./backend";

// PNG 2x3 mínimo (cabeçalho válido); o conteúdo de pixels não importa para o teste.
const PNG = Uint8Array.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52, 0, 0, 0, 2, 0, 0, 0, 3, 8, 6, 0, 0, 0, 0, 0, 0, 0,
]);

describe("coleções pelo MCP", () => {
  let t: T;
  beforeEach(async () => {
    t = setup();
    await seedSettings(t);
  });

  it("posts_create nasce como rascunho, com prévia primeiro", async () => {
    const { runtime, client } = await runtimeFor(t, "blog-editor");
    const body = { title: { "pt-BR": "Meu post", en: "My post" }, content: { "pt-BR": "<p>Oi</p>", en: "<p>Hi</p>" } };
    const preview = await call(runtime, "posts_create", body);
    expect(preview.body).toMatchObject({ applied: false, dryRun: true });
    expect(client.writes()).toEqual([]);
    const done = await call(runtime, "posts_create", { ...body, dryRun: false });
    expect(done.body.applied).toBe(true);
    const list = (await call(runtime, "posts_list")).body;
    expect(list.items[0]).toMatchObject({ label: "Meu post", slug: "meu-post", published: false });
  });

  it("serviços também nascem como rascunho (o backend publicaria)", async () => {
    const { runtime } = await runtimeFor(t, "content-editor");
    await call(runtime, "services_create", { title: { "pt-BR": "Design" }, dryRun: false });
    expect((await call(runtime, "services_list")).body.items[0].published).toBe(false);
  });

  it("valida campos: obrigatório, desconhecido, tipo, idioma fora do site", async () => {
    const { runtime, client } = await runtimeFor(t, "blog-editor");
    const r = await call(runtime, "posts_create", { title: { "pt-BR": "x", fr: "y" }, content: { "pt-BR": "  " }, lixo: 1, dryRun: false });
    expect(r.isError).toBe(true);
    const paths = r.body.problems.map((p: { path: string }) => p.path);
    expect(paths).toEqual(expect.arrayContaining(["", "title"]));
    expect(client.writes()).toEqual([]);
    const empty = await call(runtime, "posts_create", { title: { "pt-BR": "x" }, content: { "pt-BR": "  " }, dryRun: false });
    expect(empty.body.problems).toEqual([{ path: "content", message: "preencha em pelo menos um idioma" }]);
  });

  it("posts_update mescla por idioma e mostra só o que muda; unset apaga opcionais", async () => {
    const { runtime } = await runtimeFor(t, "blog-editor");
    const { body } = await call(runtime, "posts_create", { title: { "pt-BR": "Oi" }, content: { "pt-BR": "<p>a</p>" }, excerpt: { "pt-BR": "resumo" }, dryRun: false });
    const id = body.result.id as string;
    const preview = await call(runtime, "posts_update", { id, patch: { title: { en: "Hi" } } });
    expect(preview.body.changes).toEqual([{ path: "title.en", op: "add", locale: "en", after: "Hi" }]);
    await call(runtime, "posts_update", { id, patch: { title: { en: "Hi" } }, unset: ["excerpt"], dryRun: false });
    const post = (await call(runtime, "posts_get", { id })).body;
    expect(post.title).toEqual({ "pt-BR": "Oi", en: "Hi" });
    expect(post.excerpt).toBeUndefined();
    const nope = await call(runtime, "posts_update", { id, unset: ["title"], dryRun: false });
    expect(nope.body.problems[0].message).toContain("obrigatório");
  });

  it("publica, despublica e acha por slug", async () => {
    const { runtime } = await runtimeFor(t, "blog-editor");
    const { body } = await call(runtime, "posts_create", { title: { "pt-BR": "Oi" }, content: { "pt-BR": "<p>a</p>" }, slug: "ola", dryRun: false });
    const id = body.result.id as string;
    expect((await call(runtime, "posts_get", { slug: "ola" })).body._id).toBe(id);
    await call(runtime, "posts_publish", { id, dryRun: false });
    expect((await call(runtime, "posts_list", { published: true })).body.items).toHaveLength(1);
    await call(runtime, "posts_publish", { id, published: false, dryRun: false });
    expect((await call(runtime, "posts_list", { published: true })).body.items).toHaveLength(0);
  });

  it("collection_remove manda para a lixeira e collection_reorder valida os ids", async () => {
    const { runtime } = await runtimeFor(t, "content-editor");
    const a = (await call(runtime, "faq_create", { question: { "pt-BR": "A?" }, answer: { "pt-BR": "a" }, dryRun: false })).body.result.id;
    const b = (await call(runtime, "faq_create", { question: { "pt-BR": "B?" }, answer: { "pt-BR": "b" }, dryRun: false })).body.result.id;
    await call(runtime, "collection_reorder", { collection: "faq", ids: [b, a], dryRun: false });
    expect((await call(runtime, "faq_list")).body.items.map((i: { id: string }) => i.id)).toEqual([b, a]);
    expect((await call(runtime, "collection_reorder", { collection: "faq", ids: ["xx"] })).isError).toBe(true);
    await call(runtime, "collection_remove", { collection: "faq", id: a, dryRun: false });
    expect((await call(runtime, "faq_list")).body.items.map((i: { id: string }) => i.id)).toEqual([b]);
    expect((await call(runtime, "faq_list", { includeDeleted: true })).body.items).toHaveLength(2);
  });
});

describe("textos de interface", () => {
  let t: T;
  beforeEach(async () => {
    t = setup();
    await seedSettings(t);
  });

  it("lista padrão + personalizados, mescla e volta ao padrão", async () => {
    const { runtime } = await runtimeFor(t, "content-editor");
    const list = (await call(runtime, "texts_list", { limit: 500 })).body;
    expect(list.total).toBeGreaterThan(10);
    const key = list.texts[0].key as string;
    const original = list.texts[0].effective;
    const preview = await call(runtime, "texts_set", { key, value: { "pt-BR": "Novo texto" } });
    expect(preview.body.changes[0]).toMatchObject({ locale: "pt-BR", after: "Novo texto" });
    await call(runtime, "texts_set", { key, value: { "pt-BR": "Novo texto" }, dryRun: false });
    const after = (await call(runtime, "texts_list", { prefix: key })).body.texts.find((x: { key: string }) => x.key === key);
    expect(after.custom).toMatchObject({ "pt-BR": "Novo texto" });
    expect(after.effective.en ?? original.en).toBe(original.en);
    await call(runtime, "texts_reset", { key, dryRun: false });
    expect((await call(runtime, "texts_list", { customOnly: true })).body.total).toBe(0);
  });
});

describe("mídia", () => {
  let t: T;
  beforeEach(async () => {
    t = setup();
    await seedSettings(t);
  });

  it("sobe uma imagem local: prévia com tipo e dimensões, depois grava e devolve o objeto image", async () => {
    const { mkdtempSync, writeFileSync } = await import("node:fs");
    const { tmpdir } = await import("node:os");
    const { join } = await import("node:path");
    const dir = mkdtempSync(join(tmpdir(), "rubrica-mcp-img-"));
    const file = join(dir, "capa.png");
    writeFileSync(file, PNG);
    const { runtime } = await runtimeFor(t, "blog-editor");
    const preview = await call(runtime, "media_upload", { path: file, folder: "/blog", alt: { "pt-BR": "Capa" } });
    expect(preview.body).toMatchObject({ applied: false, contentType: "image/png", width: 2, height: 3 });
    const done = await call(runtime, "media_upload", { path: file, folder: "/blog", alt: { "pt-BR": "Capa" }, dryRun: false });
    expect(done.body.applied).toBe(true);
    expect(done.body.result.image).toMatchObject({ storageId: expect.any(String), alt: { "pt-BR": "Capa" }, width: 2, height: 3 });
    const list = (await call(runtime, "media_list", { folder: "/blog" })).body;
    expect(list.images[0]).toMatchObject({ name: "capa.png", folder: "/blog" });
  });

  it("recusa arquivo que não é a imagem que a extensão diz, e extensão estranha", async () => {
    const { mkdtempSync, writeFileSync } = await import("node:fs");
    const { tmpdir } = await import("node:os");
    const { join } = await import("node:path");
    const dir = mkdtempSync(join(tmpdir(), "rubrica-mcp-img-"));
    writeFileSync(join(dir, "falso.png"), "isto não é um png");
    writeFileSync(join(dir, "nota.txt"), "x");
    const { runtime } = await runtimeFor(t, "blog-editor");
    expect((await call(runtime, "media_upload", { path: join(dir, "falso.png") })).body.error).toContain("não é PNG");
    expect((await call(runtime, "media_upload", { path: join(dir, "nota.txt") })).body.error).toContain("Extensão não aceita");
    expect((await call(runtime, "media_upload", { path: join(dir, "nao-existe.png") })).body.error).toContain("Não consegui ler");
  });
});

describe("site_publish", () => {
  it("a prévia avisa que falta o deploy hook, como o painel", async () => {
    const t = setup();
    await seedSettings(t);
    const { runtime, client } = await runtimeFor(t, "root");
    const preview = await call(runtime, "site_publish", {});
    expect(preview.body).toMatchObject({ applied: false, dryRun: true });
    expect(preview.body.warnings.join(" ")).toMatch(/Publicação não configurada.*deploy hook/);
    expect(client.writes()).toEqual([]);
  });
});
