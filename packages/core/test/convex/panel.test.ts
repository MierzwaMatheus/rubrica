// @vitest-environment edge-runtime
import { beforeEach, describe, expect, it } from "vitest";
import { countImageRefs, replaceImageRefs } from "../../src/convex/panel";
import { api, as, seedSettings, setup, type T } from "./_setup";

describe("painel: validar página sem gravar", () => {
  let t: T;
  let editor: Awaited<ReturnType<typeof as>>;
  beforeEach(async () => {
    t = setup();
    await seedSettings(t);
    editor = await as(t, "content-editor");
  });

  it("devolve os erros por bloco e campo, sem lançar", async () => {
    const result = await editor.query(api.rubrica.panel.validatePage, {
      blocks: [
        { id: "h", type: "hero", visible: true, fields: { title: { "pt-BR": "x".repeat(200) } } },
        { id: "c", type: "cta", visible: true, fields: {} },
        { id: "z", type: "carrossel", visible: true, fields: {} },
      ],
    });
    expect(result.blockErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ index: 0, blockId: "h", path: "title.pt-BR" }),
        expect.objectContaining({ index: 1, blockId: "c", path: "title", message: "Título: obrigatório" }),
        expect.objectContaining({ index: 1, blockId: "c", path: "primary" }),
        expect.objectContaining({ index: 2, path: "type" }),
      ]),
    );
  });

  it("confere título e caminho (reservado, ocupado, o da própria página vale)", async () => {
    const id = await editor.mutation(api.rubrica.pages.create, { path: "/sobre", title: { "pt-BR": "Sobre" } });
    const own = await editor.query(api.rubrica.panel.validatePage, { blocks: [], path: "/sobre", pageId: id, title: { "pt-BR": "Sobre" } });
    expect(own).toEqual({ blockErrors: [] });
    const taken = await editor.query(api.rubrica.panel.validatePage, { blocks: [], path: "/sobre" });
    expect(taken.pathError).toMatch(/Já existe uma página/);
    const reserved = await editor.query(api.rubrica.panel.validatePage, { blocks: [], path: "/en", title: { "pt-BR": " " } });
    expect(reserved.pathError).toMatch(/reservado/);
    expect(reserved.titleError).toMatch(/pelo menos um idioma/);
  });

  it("exige o papel de páginas", async () => {
    const blog = await as(t, "blog-editor");
    await expect(blog.query(api.rubrica.panel.validatePage, { blocks: [] })).rejects.toThrow(/Sem permissão/);
  });
});

describe("painel: uso e substituição de imagens", () => {
  let t: T;
  beforeEach(async () => {
    t = setup();
    await seedSettings(t);
  });

  const store = (type = "image/png") => t.run((ctx) => ctx.storage.store(new Blob(["img"], { type })));

  it("conta e troca referências em qualquer profundidade, mantendo o alt", () => {
    const value = { a: { url: "u", storageId: "s1", alt: { "pt-BR": "x" }, width: 1 }, list: [{ image: { url: "u", storageId: "s1" } }, { url: "o", storageId: "s2" }] };
    expect(countImageRefs(value, "s1")).toBe(2);
    const out = replaceImageRefs(value, "s1", { storageId: "s3", url: "n", width: 10, height: 5 });
    expect(out.a).toEqual({ url: "n", storageId: "s3", alt: { "pt-BR": "x" }, width: 10, height: 5 });
    expect(out.list[1]).toEqual({ url: "o", storageId: "s2" });
    expect(countImageRefs(out, "s1")).toBe(0);
  });

  it("lista onde a imagem é usada e substitui o arquivo em todo o conteúdo", async () => {
    const root = await as(t, "root");
    const oldId = await store();
    const { id: mediaId } = await root.mutation(api.rubrica.media.save, { storageId: oldId, name: "capa.png", width: 100, height: 50 });
    const image = { url: "https://velho", storageId: oldId, alt: { "pt-BR": "Capa" } };
    const pageId = await root.mutation(api.rubrica.pages.create, {
      path: "/",
      title: { "pt-BR": "Início" },
      blocks: [{ id: "h", type: "hero", visible: true, fields: { title: { "pt-BR": "Oi" }, image } }],
    });
    const postId = await root.mutation(api.rubrica.posts.create, { title: { "pt-BR": "P" }, content: { "pt-BR": "x" }, cover: image });
    await root.mutation(api.rubrica.settings.update, { patch: { ogImage: image } });

    const usage = await root.query(api.rubrica.panel.mediaUsage, { id: mediaId });
    expect(usage.map((u) => u.type).sort()).toEqual(["page", "posts", "siteSettings"]);

    const newId = await store("image/webp");
    const result = await root.mutation(api.rubrica.panel.replaceMedia, { id: mediaId, storageId: newId, width: 300, height: 200 });
    expect(result.updated).toBe(3);
    const url = await t.run((ctx) => ctx.storage.getUrl(newId));
    const page = await root.query(api.rubrica.pages.get, { id: pageId });
    expect(page?.blocks[0]?.fields.image).toEqual({ url, storageId: newId, alt: { "pt-BR": "Capa" }, width: 300, height: 200 });
    expect((await root.query(api.rubrica.posts.get, { id: postId }))?.cover).toMatchObject({ storageId: newId });
    expect((await root.query(api.rubrica.settings.get, {}))?.ogImage).toMatchObject({ storageId: newId });
    const media = await root.query(api.rubrica.media.get, { id: mediaId });
    expect(media).toMatchObject({ storageId: newId, width: 300, height: 200, contentType: "image/webp" });
    expect(await t.run((ctx) => ctx.storage.getUrl(oldId))).toBeNull();
  });

  it("recusa arquivo que não é imagem", async () => {
    const root = await as(t, "root");
    const { id } = await root.mutation(api.rubrica.media.save, { storageId: await store(), name: "a.png" });
    const pdf = await store("application/pdf");
    await expect(root.mutation(api.rubrica.panel.replaceMedia, { id, storageId: pdf })).rejects.toThrow(/Envie uma imagem/);
  });

  it("exige o papel de mídia", async () => {
    const root = await as(t, "root");
    const { id } = await root.mutation(api.rubrica.media.save, { storageId: await store(), name: "a.png" });
    const sales = await as(t, "comercial");
    await expect(sales.query(api.rubrica.panel.mediaUsage, { id })).rejects.toThrow(/Sem permissão/);
  });
});
