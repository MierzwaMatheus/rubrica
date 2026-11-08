// @vitest-environment edge-runtime
import { beforeEach, describe, expect, it } from "vitest";
import { api, as, seedSettings, setup, type T } from "./_setup";

const hero = (id = "h1") => ({ id, type: "hero", visible: true, fields: { title: { "pt-BR": "Olá", en: "Hi" } } });
const texto = (id = "t1", body = "<p>Texto</p>") => ({ id, type: "texto", visible: true, fields: { body: { "pt-BR": body } } });

describe("páginas e blocos", () => {
  let t: T;
  let editor: Awaited<ReturnType<typeof as>>;
  beforeEach(async () => {
    t = setup();
    await seedSettings(t);
    editor = await as(t, "content-editor");
  });

  it("cria página validando os blocos e sanitizando o richText", async () => {
    const id = await editor.mutation(api.rubrica.pages.create, {
      path: "/sobre",
      title: { "pt-BR": "Sobre", en: "About", es: "  " },
      blocks: [hero(), texto("t1", '<p onclick="x()">Oi</p><script>alert(1)</script>')],
    });
    const page = await editor.query(api.rubrica.pages.get, { id });
    expect(page?.title).toEqual({ "pt-BR": "Sobre", en: "About" });
    expect(page?.blocks[1]?.fields.body).toEqual({ "pt-BR": "<p>Oi</p>" });
    expect(page?.published).toBe(false);
  });

  it("recusa bloco de tipo desconhecido", async () => {
    await expect(
      editor.mutation(api.rubrica.pages.create, { path: "/x", title: { "pt-BR": "X" }, blocks: [{ id: "a", type: "carrossel", visible: true, fields: {} }] }),
    ).rejects.toThrow(/tipo de bloco desconhecido: "carrossel"/);
  });

  it("recusa bloco de outro tipo de site", async () => {
    await expect(
      editor.mutation(api.rubrica.pages.create, {
        path: "/precos",
        title: { "pt-BR": "Preços" },
        blocks: [{ id: "p", type: "precos", visible: true, fields: {}, source: { collection: "plans" } }],
      }),
    ).rejects.toThrow(/só de sites do tipo empresa/);
  });

  it("recusa bloco de plugin desligado", async () => {
    const root = await as(t, "root");
    const page = await editor.mutation(api.rubrica.pages.create, { path: "/novidades", title: { "pt-BR": "Novidades" }, blocks: [hero()] });
    const posts = { id: "p", type: "posts-recentes", visible: true, fields: {}, source: { collection: "posts" as const, limit: 3 } };
    await editor.mutation(api.rubrica.pages.upsertBlock, { id: page, block: posts });
    await root.mutation(api.rubrica.settings.setPlugin, { id: "blog", enabled: false });
    await expect(editor.mutation(api.rubrica.pages.upsertBlock, { id: page, block: { ...posts, id: "p2" } })).rejects.toThrow(/precisa do plugin "blog"/);
  });

  it("recusa campos inválidos", async () => {
    await expect(
      editor.mutation(api.rubrica.pages.create, { path: "/y", title: { "pt-BR": "Y" }, blocks: [{ id: "h", type: "hero", visible: true, fields: { title: "sem idioma" } }] }),
    ).rejects.toThrow(/bloco 1 \(h\) title/);
  });

  it("caminho único, válido e não reservado", async () => {
    await editor.mutation(api.rubrica.pages.create, { path: "/sobre", title: { "pt-BR": "Sobre" } });
    await expect(editor.mutation(api.rubrica.pages.create, { path: "/sobre", title: { "pt-BR": "Outra" } })).rejects.toThrow(/Já existe/);
    await editor.mutation(api.rubrica.pages.create, { path: "/blog", title: { "pt-BR": "Blog" } });
    await expect(editor.mutation(api.rubrica.pages.create, { path: "/blog/post", title: { "pt-BR": "B" } })).rejects.toThrow(/reservado/);
    await expect(editor.mutation(api.rubrica.pages.create, { path: "/en", title: { "pt-BR": "B" } })).rejects.toThrow(/reservado/);
    await expect(editor.mutation(api.rubrica.pages.create, { path: "/Sobre Nós", title: { "pt-BR": "B" } })).rejects.toThrow(/inválido/);
    await expect(editor.mutation(api.rubrica.pages.create, { path: "/z", title: { "pt-BR": " " } })).rejects.toThrow(/pelo menos um idioma/);
  });

  it("reordena e oculta blocos", async () => {
    const id = await editor.mutation(api.rubrica.pages.create, { path: "/", title: { "pt-BR": "Início" }, blocks: [hero(), texto()] });
    await editor.mutation(api.rubrica.pages.reorderBlocks, { id, blockIds: ["t1", "h1"] });
    await editor.mutation(api.rubrica.pages.setBlockVisible, { id, blockId: "h1", visible: false });
    const page = await editor.query(api.rubrica.pages.get, { id });
    expect(page?.blocks.map((b) => `${b.id}:${b.visible}`)).toEqual(["t1:true", "h1:false"]);
    await expect(editor.mutation(api.rubrica.pages.reorderBlocks, { id, blockIds: ["t1"] })).rejects.toThrow(/todos os blocos/);
    await expect(editor.mutation(api.rubrica.pages.reorderBlocks, { id, blockIds: ["t1", "t1"] })).rejects.toThrow(/todos os blocos/);
    await editor.mutation(api.rubrica.pages.removeBlock, { id, blockId: "t1" });
    expect((await editor.query(api.rubrica.pages.get, { id }))?.blocks.map((b) => b.id)).toEqual(["h1"]);
  });

  it("página do sistema não vai para a lixeira nem muda de caminho", async () => {
    const root = await as(t, "root");
    await expect(editor.mutation(api.rubrica.pages.create, { path: "/", title: { "pt-BR": "Início" }, system: true })).rejects.toThrow(/root/);
    const id = await root.mutation(api.rubrica.pages.create, { path: "/", title: { "pt-BR": "Início" }, system: true });
    await expect(editor.mutation(api.rubrica.pages.remove, { id })).rejects.toThrow(/não apagadas/);
    await expect(editor.mutation(api.rubrica.pages.update, { id, path: "/inicio" })).rejects.toThrow(/não muda/);
    await editor.mutation(api.rubrica.pages.update, { id, title: { "pt-BR": "Home" }, blocks: [hero()] });
    expect((await editor.query(api.rubrica.pages.get, { id }))?.title).toEqual({ "pt-BR": "Home" });
  });

  it("lixeira libera o caminho; restaurar confere conflito", async () => {
    const root = await as(t, "root");
    const a = await editor.mutation(api.rubrica.pages.create, { path: "/a", title: { "pt-BR": "A" } });
    await editor.mutation(api.rubrica.pages.remove, { id: a });
    expect(await editor.query(api.rubrica.pages.list, {})).toHaveLength(0);
    await editor.mutation(api.rubrica.pages.create, { path: "/a", title: { "pt-BR": "Nova A" } });
    await expect(root.mutation(api.rubrica.pages.restore, { id: a })).rejects.toThrow(/Já existe/);
  });

  it("registra a auditoria", async () => {
    const root = await as(t, "root");
    const id = await editor.mutation(api.rubrica.pages.create, { path: "/c", title: { "pt-BR": "Contato" } });
    await editor.mutation(api.rubrica.pages.publish, { id });
    const events = (await root.query(api.rubrica.audit.recent, {})).map((e) => `${e.eventType}:${e.targetType}:${e.actorEmail === null ? "?" : "ok"}`);
    expect(events).toEqual(expect.arrayContaining(["admin.create:page:ok", "admin.publish:page:ok"]));
  });
});
