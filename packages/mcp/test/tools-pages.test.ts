// @vitest-environment edge-runtime
import { beforeEach, describe, expect, it } from "vitest";
import { BACKEND, resolveProject } from "../src/tools/shared";
import { RubricaError, type RubricaClient } from "../src/client";
import { call, runtimeFor, seedSettings, setup, type RuntimeExtras, type T } from "./backend";

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

  it("blocos novos: endereço de vídeo e de incorporação validados no block_add e no block_update_fields", async () => {
    const { runtime, client } = await runtimeFor(t, "content-editor");
    const video = { id: "v1", type: "video", fields: { url: "https://youtu.be/M7lc1UVf-VE", title: { "pt-BR": "Vídeo" } } };
    await call(runtime, "pages_create", { path: "/sobre", title: { "pt-BR": "Sobre" }, blocks: [video], dryRun: false });
    const bad = await call(runtime, "block_update_fields", { page: "/sobre", blockId: "v1", fields: { url: "https://example.com/v.mp4" }, dryRun: false });
    expect(bad.isError).toBe(true);
    expect(bad.body.problems).toEqual([expect.objectContaining({ blockId: "v1", path: "url", message: expect.stringContaining("YouTube ou do Vimeo") })]);
    const writes = client.writes().length;
    const embed = await call(runtime, "block_add", {
      page: "/sobre",
      block: { type: "incorporacao", fields: { url: "<iframe src='https://evil.example'></iframe>", frameTitle: { "pt-BR": "Agenda" } } },
      dryRun: false,
    });
    expect(embed.isError).toBe(true);
    expect(JSON.stringify(embed.body.problems)).toContain("Calendly");
    expect(client.writes()).toHaveLength(writes);
    const ok = await call(runtime, "block_add", {
      page: "/sobre",
      block: { type: "linha-do-tempo", fields: { items: [{ date: { "pt-BR": "2020" }, title: { "pt-BR": "Início" } }] } },
      dryRun: false,
    });
    expect(ok.isError).toBe(false);
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

/** Backend de mentira para os blocos de um case: o demo ainda não tem as funções de projeto. */
function fakeProjects(initial: unknown[] = []) {
  const project = { _id: "proj1", slug: "marca-x", title: { "pt-BR": "Marca X" }, published: false, blocks: initial as { id: string; type: string; visible: boolean; fields: Record<string, unknown> }[] };
  const writes: { path: string; args: Record<string, unknown> }[] = [];
  const validated: unknown[] = [];
  const intercept: RuntimeExtras["intercept"] = (_type, path, args) => {
    if (path === "rubrica/projects:get") return Promise.resolve(args.id === project._id ? project : null);
    if (path === "rubrica/projects:list") return Promise.resolve([project]);
    if (path === BACKEND.validateProjectBlocks) {
      validated.push(args);
      return Promise.resolve({ blockErrors: [] });
    }
    if (!path.startsWith("rubrica/collections:")) return undefined;
    writes.push({ path, args });
    const b = project.blocks;
    if (path === BACKEND.upsertProjectBlock) {
      const block = args.block as (typeof b)[number];
      const at = b.findIndex((x) => x.id === block.id);
      if (at >= 0) b[at] = block;
      else b.splice((args.index as number | undefined) ?? b.length, 0, block);
    } else if (path === BACKEND.reorderProjectBlocks) project.blocks = (args.blockIds as string[]).map((id) => b.find((x) => x.id === id)!);
    else if (path === BACKEND.setProjectBlockVisible) b.find((x) => x.id === args.blockId)!.visible = args.visible as boolean;
    else if (path === BACKEND.removeProjectBlock) project.blocks = b.filter((x) => x.id !== args.blockId);
    return Promise.resolve(null);
  };
  return { project, writes, validated, intercept };
}

describe("blocos de um case pelo MCP", () => {
  let t: T;
  beforeEach(async () => {
    t = setup();
    await seedSettings(t, { plugins: { portfolio: true } });
  });
  const texto2 = { id: "c1", type: "texto", fields: { body: { "pt-BR": "<h2>Contexto</h2><p>x</p>" } } };

  it("block_add, block_move, block_set_visible e block_remove com project (slug)", async () => {
    const fake = fakeProjects([texto2]);
    const { runtime, client } = await runtimeFor(t, "content-editor", {}, { intercept: fake.intercept });
    const add = await call(runtime, "block_add", { project: "marca-x", block: { id: "p1", type: "texto", fields: { body: { "pt-BR": 5 } } }, index: 0, dryRun: false });
    // campo inválido: a validação local recusa antes de qualquer gravação
    expect(add.isError).toBe(true);
    expect(client.writes()).toEqual([]);

    const ok = { id: "t2", type: "texto", fields: { body: { "pt-BR": "<p>y</p>" } } };
    const prev = await call(runtime, "block_add", { project: "marca-x", block: ok, index: 0 });
    expect(prev.body).toMatchObject({ applied: false, dryRun: true });
    expect(prev.body.summary).toContain("o case marca-x");
    expect(client.writes()).toEqual([]);
    await call(runtime, "block_add", { project: "marca-x", block: ok, index: 0, dryRun: false });
    expect(fake.writes[0]).toMatchObject({ path: BACKEND.upsertProjectBlock, args: { projectId: "proj1", index: 0 } });
    expect(fake.project.blocks.map((b) => b.id)).toEqual(["t2", "c1"]);

    const move = await call(runtime, "block_move", { project: "proj1", blockId: "c1", toIndex: 0 });
    expect(move.body.order).toEqual({ before: ["t2", "c1"], after: ["c1", "t2"] });
    expect(move.body.warnings).toBeUndefined();
    await call(runtime, "block_move", { project: "marca-x", blockId: "c1", toIndex: 0, dryRun: false });
    expect(fake.project.blocks.map((b) => b.id)).toEqual(["c1", "t2"]);

    await call(runtime, "block_set_visible", { project: "marca-x", blockId: "t2", visible: false, dryRun: false });
    expect(fake.project.blocks[1]!.visible).toBe(false);

    const upd = await call(runtime, "block_update_fields", { project: "marca-x", blockId: "c1", fields: { body: { en: "<p>x</p>" } }, dryRun: false });
    expect(upd.body.applied).toBe(true);
    expect(fake.project.blocks[0]!.fields.body).toEqual({ "pt-BR": "<h2>Contexto</h2><p>x</p>", en: "<p>x</p>" });

    const rm = await call(runtime, "block_remove", { project: "marca-x", blockId: "t2" });
    expect(rm.body.removed.id).toBe("t2");
    await call(runtime, "block_remove", { project: "marca-x", blockId: "t2", dryRun: false });
    expect(fake.project.blocks.map((b) => b.id)).toEqual(["c1"]);
    expect(fake.writes.at(-1)).toMatchObject({ path: BACKEND.removeProjectBlock, args: { projectId: "proj1", blockId: "t2" } });
  });

  it("recusa hero, contato e cases no case, com mensagem clara, sem gravar", async () => {
    const fake = fakeProjects();
    const { runtime, client } = await runtimeFor(t, "content-editor", {}, { intercept: fake.intercept });
    const r = await call(runtime, "block_add", { project: "marca-x", block: { type: "hero", fields: { title: { "pt-BR": "Oi" } } }, dryRun: false });
    expect(r.isError).toBe(true);
    expect(r.body.error).toContain("só vale em páginas");
    expect(client.writes()).toEqual([]);
    expect(fake.writes).toEqual([]);
    const c = await call(runtime, "block_add", { project: "marca-x", block: { type: "cases", fields: {}, source: { collection: "projects" } } });
    expect(c.isError).toBe(true);
    // na página o hero continua valendo
    await call(runtime, "pages_create", { path: "/x", title: { "pt-BR": "X" }, blocks: [hero], dryRun: false });
    expect((await call(runtime, "block_add", { page: "/x", block: { type: "texto", fields: { body: { "pt-BR": "<p>a</p>" } } } })).isError).toBe(false);
  });

  it("não avisa de hero/h1 no case", async () => {
    const fake = fakeProjects([{ id: "h", type: "hero", visible: true, fields: { title: { "pt-BR": "x" } } }, texto2]);
    const { runtime } = await runtimeFor(t, "content-editor", {}, { intercept: fake.intercept });
    const move = await call(runtime, "block_move", { project: "marca-x", blockId: "c1", toIndex: 0 });
    expect(move.body.warnings).toBeUndefined();
    const rm = await call(runtime, "block_remove", { project: "marca-x", blockId: "h" });
    expect(rm.body.warnings).toBeUndefined();
  });

  it("exige page ou project, não os dois, e recusa projeto inexistente", async () => {
    const fake = fakeProjects();
    const { runtime } = await runtimeFor(t, "content-editor", {}, { intercept: fake.intercept });
    const block = { type: "texto", fields: { body: { "pt-BR": "<p>a</p>" } } };
    expect((await call(runtime, "block_add", { block })).body.error).toContain("`page`");
    expect((await call(runtime, "block_add", { block, page: "/", project: "marca-x" })).body.error).toContain("OU");
    const r = await call(runtime, "block_add", { block, project: "nada" });
    expect(r.isError).toBe(true);
    expect(r.body.error).toContain("Projeto não encontrado");
  });

  it("bloco com regras do backend consulta a validação de projeto, não a de página", async () => {
    const fake = fakeProjects();
    const { runtime } = await runtimeFor(t, "content-editor", {}, { intercept: fake.intercept });
    await runtime.refresh();
    // texto não tem regras do backend: nenhuma consulta de validação
    await call(runtime, "block_add", { project: "marca-x", block: { type: "texto", fields: { body: { "pt-BR": "<p>a</p>" } } } });
    expect(fake.validated).toEqual([]);
  });
});

describe("resolveProject e resolvePage: id, slug e lixeira", () => {
  const invalidId = new RubricaError('Value does not match validator.\nPath: .id\nValue: "marca-x"\nValidator: v.id("projects")', "validation");
  const clientWith = (get: () => Promise<unknown>, list: unknown[]) =>
    ({
      query: (path: string, args?: Record<string, unknown>) => {
        if (path === "rubrica/projects:get") return get();
        if (path === "rubrica/projects:list") return Promise.resolve(args?.includeDeleted ? list : list.filter((p) => !(p as { deletedAt?: number }).deletedAt));
        throw new Error(path);
      },
    }) as unknown as RubricaClient;

  it("só o erro de id inválido cai para o slug; outros erros sobem", async () => {
    const active = { _id: "p1", slug: "marca-x", title: {} };
    expect((await resolveProject(clientWith(() => Promise.reject(invalidId), [active]), "marca-x"))._id).toBe("p1");
    const forbidden = new RubricaError("Sem permissão para ler o id pedido", "forbidden");
    await expect(resolveProject(clientWith(() => Promise.reject(forbidden), [active]), "marca-x")).rejects.toBe(forbidden);
    const server = new RubricaError("Falhou ao ler o ID", "server");
    await expect(resolveProject(clientWith(() => Promise.reject(server), [active]), "marca-x")).rejects.toBe(server);
  });

  it("pelo slug: o ativo vence o da lixeira; só na lixeira, volta apagado (e o alvo recusa)", async () => {
    const trashed = { _id: "p0", slug: "marca-x", title: {}, deletedAt: 1 };
    const active = { _id: "p1", slug: "marca-x", title: {} };
    expect((await resolveProject(clientWith(() => Promise.reject(invalidId), [trashed, active]), "marca-x"))._id).toBe("p1");
    const onlyTrash = await resolveProject(clientWith(() => Promise.reject(invalidId), [trashed]), "marca-x");
    expect(onlyTrash).toMatchObject({ _id: "p0", deletedAt: 1 });
  });

  it("no backend de verdade, um id inválido de página vira 'não encontrada'", async () => {
    const t = setup();
    await seedSettings(t);
    const { runtime } = await runtimeFor(t, "content-editor");
    const r = await call(runtime, "pages_get", { page: "nao-e-um-id" });
    expect(r.isError).toBe(true);
    expect(r.body.error).toContain("Página não encontrada");
  });
});
