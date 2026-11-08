// @vitest-environment edge-runtime
/** Catálogo real do projeto (blocos próprios), variações do tema, receitas e orientação. */
import { beforeEach, describe, expect, it } from "vitest";
import { defineBlock, field, serializeBlock, type BlockDefinition } from "@rubrica/core";
import { CORE_BLOCKS } from "@rubrica/core/blocks";
import { RubricaError } from "../src/client";
import type { ThemeInfo } from "../src/theme";
import { call, runtimeFor, seedSettings, setup, type RuntimeExtras, type T } from "./backend";

const selos = defineBlock({
  type: "selos",
  label: "Selos e certificações",
  description: "Selos, prêmios e certificações.",
  guidance: { use: "Mostrar certificações que dão confiança.", avoid: "Para logos de clientes, logos-clientes.", pairsWith: ["logos-clientes"] },
  category: "comum",
  fields: {
    title: field.text({ label: "Título", maxLength: 40 }),
    items: field.list({ label: "Selos", required: true, min: 1, of: { name: field.text({ label: "Nome", required: true, maxLength: 80 }) } }),
  },
  validate: (f) => ((f.items as unknown[]).length > 3 ? [{ path: "items", message: "Selos: no máximo 3 nesta versão" }] : []),
});

/** Backend do projeto com o bloco `selos` (o demo só tem os do núcleo). */
const projectBackend: RuntimeExtras["intercept"] = (_type, path, args) => {
  if (path === "rubrica/pages:blockCatalog") {
    return Promise.resolve({
      contract: "1.2.0",
      blocks: [...(CORE_BLOCKS as readonly BlockDefinition[]).map((b) => ({ ...serializeBlock(b), origin: "nucleo" })), { ...serializeBlock(selos), origin: "projeto" }],
    });
  }
  if (path === "rubrica/panel:validatePage") {
    const blocks = args.blocks as { id: string; type: string; fields: { items?: unknown[] } }[];
    const errors = blocks.flatMap((b, index) => (b.type === "selos" && (b.fields.items?.length ?? 0) > 3 ? [{ index, blockId: b.id, path: "items", message: "Selos: no máximo 3 nesta versão" }] : []));
    return Promise.resolve({ blockErrors: errors });
  }
  return undefined;
};

const oldBackend: RuntimeExtras["intercept"] = (_type, path) =>
  path === "rubrica/pages:blockCatalog" ? Promise.reject(new RubricaError("Could not find public function for 'rubrica/pages:blockCatalog'", "missing-function")) : undefined;

const PADRAO: ThemeInfo = {
  package: "@rubrica/theme-padrao",
  id: "padrao",
  label: "Padrão",
  source: "tema",
  variants: { cases: [{ value: "grade", label: "Grade" }, { value: "lista", label: "Lista" }] },
  overridden: ["hero", "servicos", "depoimentos"],
  recipes: {},
};

const selo = (n: number) => ({ id: "s1", type: "selos", fields: { items: Array.from({ length: n }, (_, i) => ({ name: { "pt-BR": `Selo ${i}` } })) } });

describe("catálogo do backend do projeto", () => {
  let t: T;
  beforeEach(async () => {
    t = setup();
    await seedSettings(t);
  });

  it("o catálogo real do demo vem do backend, com a orientação de cada bloco", async () => {
    const { runtime } = await runtimeFor(t, "content-editor");
    const cat = (await call(runtime, "blocks_catalog")).body;
    expect(cat.catalog).toBe("backend");
    const hero = cat.blocks.find((b: { type: string }) => b.type === "hero");
    expect(hero).toMatchObject({ origin: "nucleo", guidance: { use: expect.any(String), avoid: expect.any(String), pairsWith: expect.any(Array) } });
  });

  it("bloco próprio do projeto aparece no catálogo, nos recursos e no schema das ferramentas", async () => {
    const { runtime } = await runtimeFor(t, "content-editor", {}, { intercept: projectBackend });
    const cat = (await call(runtime, "blocks_catalog")).body;
    expect(cat.blocks.find((b: { type: string }) => b.type === "selos")).toMatchObject({ origin: "projeto", label: "Selos e certificações", guidance: { use: expect.any(String) } });
    const one = (await call(runtime, "blocks_catalog", { type: "selos" })).body;
    expect(one.fields.properties.items.type).toBe("array");
    expect(one.note).toContain("regras próprias");

    const tools = await runtime.listTools();
    const items = (tools.find((x) => x.name === "pages_create")!.inputSchema as any).properties.blocks.items.anyOf as { title?: string }[];
    expect(items.map((s) => s.title)).toContain("selos");
    // Com o catálogo real, não sobra o bloco genérico.
    expect(items.every((s) => s.title)).toBe(true);
  });

  it("valida o bloco próprio localmente (campos) e no backend (regras próprias), sem gravar", async () => {
    const { runtime, client } = await runtimeFor(t, "content-editor", {}, { intercept: projectBackend });
    await call(runtime, "pages_create", { path: "/x", title: { "pt-BR": "X" }, dryRun: false });

    const tooLong = await call(runtime, "block_add", { page: "/x", block: { type: "selos", fields: { title: { "pt-BR": "x".repeat(50) }, items: [{ name: { "pt-BR": "A" } }] } } });
    expect(tooLong.isError).toBe(true);
    expect(tooLong.body.problems[0]).toMatchObject({ path: "title.pt-BR" });

    const rule = await call(runtime, "block_add", { page: "/x", block: selo(4) });
    expect(rule.isError).toBe(true);
    expect(rule.body.error).toContain("no máximo 3");
    expect(client.calls.some((c) => c.path === "rubrica/panel:validatePage")).toBe(true);

    const ok = await call(runtime, "block_add", { page: "/x", block: selo(2) });
    expect(ok.body).toMatchObject({ applied: false });
    expect(client.writes().filter((w) => w.path === "rubrica/pages:upsertBlock")).toEqual([]);
  });

  it("tipo fora do catálogo do backend é recusado com a lista de tipos", async () => {
    const { runtime } = await runtimeFor(t, "content-editor", {}, { intercept: projectBackend });
    await call(runtime, "pages_create", { path: "/x", title: { "pt-BR": "X" }, dryRun: false });
    const r = await call(runtime, "block_add", { page: "/x", block: { type: "carrossel", fields: {} } });
    expect(r.isError).toBe(true);
    expect(r.body.error).toContain('tipo de bloco desconhecido: "carrossel"');
    expect(r.body.error).toContain("selos");
  });

  it("backend antigo (sem blockCatalog): catálogo do núcleo, bloco genérico no schema e aviso no whoami", async () => {
    const { runtime } = await runtimeFor(t, "content-editor", {}, { intercept: oldBackend });
    const cat = (await call(runtime, "blocks_catalog")).body;
    expect(cat.catalog).toBe("nucleo");
    expect(cat.catalogNote).toContain("núcleo");
    const tools = await runtime.listTools();
    const items = (tools.find((x) => x.name === "block_add")!.inputSchema as any).properties.block.anyOf as { title?: string }[];
    expect(items.some((s) => !s.title)).toBe(true);
    const who = (await call(runtime, "whoami")).body;
    expect(who.blockCatalog).toBe("nucleo");
    expect(who.notes.join(" ")).toContain("catálogo de blocos");
  });
});

describe("variações do tema", () => {
  let t: T;
  beforeEach(async () => {
    t = setup();
    await seedSettings(t, { plugins: { portfolio: true } });
  });

  it("o catálogo mostra as variações por bloco e o schema traz o enum", async () => {
    const { runtime } = await runtimeFor(t, "content-editor", {}, { theme: PADRAO });
    const cat = (await call(runtime, "blocks_catalog")).body;
    expect(cat.theme).toMatchObject({ id: "padrao", source: "tema" });
    const cases = cat.blocks.find((b: { type: string }) => b.type === "cases");
    expect(cases.variants).toEqual([{ value: "grade", label: "Grade", default: true }, { value: "lista", label: "Lista" }]);
    // Linha do tempo herda as do componente padrão do núcleo; o hero do tema não tem nenhuma.
    expect(cat.blocks.find((b: { type: string }) => b.type === "linha-do-tempo").variants.map((v: { value: string }) => v.value)).toEqual(["vertical", "horizontal"]);
    expect(cat.blocks.find((b: { type: string }) => b.type === "hero").variants).toBeUndefined();

    const tools = await runtime.listTools();
    const anyOf = (tools.find((x) => x.name === "block_add")!.inputSchema as any).properties.block.anyOf as { title: string; properties: { variant: { enum?: string[] } } }[];
    expect(anyOf.find((s) => s.title === "cases")!.properties.variant.enum).toEqual(["grade", "lista"]);
  });

  it("variação válida passa; inválida é recusada com as válidas; bloco sem variações também", async () => {
    const { runtime } = await runtimeFor(t, "content-editor", {}, { theme: PADRAO });
    const cases = (variant: string) => ({ type: "cases", variant, fields: {}, source: { collection: "projects" } });
    expect((await call(runtime, "pages_create", { path: "/p", title: { "pt-BR": "P" }, blocks: [cases("lista")] })).isError).toBe(false);

    const bad = await call(runtime, "pages_create", { path: "/p", title: { "pt-BR": "P" }, blocks: [cases("mosaico")] });
    expect(bad.isError).toBe(true);
    expect(bad.body.error).toContain('a variação "mosaico" não existe no tema Padrão para o bloco cases');
    expect(bad.body.error).toContain("grade (Grade, padrão), lista (Lista)");
    expect(bad.body.problems[0]).toMatchObject({ path: "variant" });

    const none = await call(runtime, "pages_create", { path: "/p", title: { "pt-BR": "P" }, blocks: [{ type: "texto", variant: "larga", fields: {} }] });
    expect(none.body.error).toContain("não tem variações no tema Padrão");
  });

  it("block_update_fields confere a variação e aceita \"\" para voltar à padrão", async () => {
    const { runtime } = await runtimeFor(t, "content-editor", {}, { theme: PADRAO });
    await call(runtime, "pages_create", { path: "/p", title: { "pt-BR": "P" }, blocks: [{ id: "c1", type: "cases", variant: "lista", fields: {}, source: { collection: "projects" } }], dryRun: false });
    expect((await call(runtime, "block_update_fields", { page: "/p", blockId: "c1", variant: "mosaico" })).body.error).toContain("Válidas: grade");
    const reset = await call(runtime, "block_update_fields", { page: "/p", blockId: "c1", variant: "" });
    expect(reset.isError).toBe(false);
    expect(reset.body.changes[0]).toMatchObject({ path: "variant", before: "lista" });
  });

  it("sem ler o tema, a variação desconhecida vira aviso (o site cai na padrão)", async () => {
    const { runtime } = await runtimeFor(t, "content-editor");
    const r = await call(runtime, "pages_create", { path: "/p", title: { "pt-BR": "P" }, blocks: [{ type: "cases", variant: "mosaico", fields: {}, source: { collection: "projects" } }] });
    expect(r.isError).toBe(false);
    expect(r.body.warnings.join(" ")).toContain('"mosaico" não existe');
  });
});

describe("receitas", () => {
  let t: T;
  beforeEach(async () => {
    t = setup();
  });

  it("receita do tipo do site, com a ordem dos blocos de cada página", async () => {
    await seedSettings(t, { kind: "empresa" });
    const { runtime } = await runtimeFor(t, "content-editor", {}, { theme: PADRAO });
    const r = (await call(runtime, "page_recipes")).body;
    expect(r).toMatchObject({ kind: "empresa", from: "nucleo" });
    const quem = r.pages.find((p: { path: string }) => p.path === "/quem-somos");
    expect(quem.blocks.map((b: { type: string }) => b.type)).toEqual(["texto", "linha-do-tempo", "numeros", "lista-itens", "equipe"]);
    expect(quem.blocks[0].exampleFields).toBeUndefined();
  });

  it("uma página pelo título traz os campos de exemplo só nos idiomas do site", async () => {
    await seedSettings(t, { kind: "empresa" });
    const { runtime } = await runtimeFor(t, "content-editor");
    const r = (await call(runtime, "page_recipes", { page: "Quem somos" })).body;
    expect(r.pages).toHaveLength(1);
    expect(r.pages[0].title).toEqual({ "pt-BR": "Quem somos", en: "About us" });
    expect(r.pages[0].blocks[0].exampleFields.title).toEqual({ "pt-BR": "Quem somos", en: "About us" });
    expect(r.note).toContain("exemplo");
    const none = (await call(runtime, "page_recipes", { page: "/nao-existe" })).body;
    expect(none.problem).toContain("/quem-somos");
  });

  it("vale a receita do tema quando ele declara, e marca bloco de plugin desligado", async () => {
    await seedSettings(t, { kind: "pessoal", plugins: { portfolio: false } });
    const theme: ThemeInfo = { ...PADRAO, recipes: { pessoal: [{ path: "/", title: { "pt-BR": "Início" }, blocks: [{ type: "hero" }, { type: "cases", variant: "lista" }] }] } };
    const { runtime } = await runtimeFor(t, "content-editor", {}, { theme });
    const r = (await call(runtime, "page_recipes")).body;
    expect(r.from).toBe("tema");
    expect(r.pages[0].blocks).toEqual([
      { type: "hero", label: "Hero", available: true },
      { type: "cases", label: "Cases", variant: "lista", available: false, note: 'precisa do plugin "portfolio" ligado' },
    ]);
  });

  it("sem login pede o tipo do site", async () => {
    const { runtime } = await runtimeFor(t, null);
    expect((await call(runtime, "page_recipes")).body.error).toContain("kind");
    expect((await call(runtime, "page_recipes", { kind: "pessoal" })).body.pages.length).toBeGreaterThan(3);
  });
});
