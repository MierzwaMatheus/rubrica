import { describe, expect, it, vi } from "vitest";
import { fileURLToPath } from "node:url";
import { CORE_BLOCKS } from "../../src/blocks/catalog";
import { blockAllowedIn } from "../../src/blocks/define";
import type { BlockInstance, CaseBrand, RawProject } from "../../src/content/types";
import { fixtureSource } from "../../src/data/source";
import { COLLECTION_CONFIGS } from "../../src/admin/collections/config";
import { brandProblems, cleanBrand, defaultBrand, issuesAt, modeReport } from "../../src/admin/collections/brand";
import { availableBlocks, blockUnavailableReason, validateCaseBlocks } from "../../src/admin/editor/model";
import { planUpdate } from "../../src/admin/collections/model";
import { resolveCasePreview } from "../../src/admin/preview/resolve";
import { defineTheme } from "../../src/theme/contract";
import { DefaultShell } from "../../src/components";
import { CORE_PLUGINS } from "../../src/plugins/registry";
import { docToForm } from "../../src/admin/collections/CollectionEditor";

// O módulo do painel lê o tema do projeto por um módulo virtual do Astro: aqui não existe.
vi.mock("../../src/admin/panel", () => ({ usePanel: () => ({}), localeName: (l: string) => l }));

const projects = COLLECTION_CONFIGS.projects;
const t = (s: string) => ({ "pt-BR": s });
const texto = (id: string, body = "Corpo"): BlockInstance => ({ id, type: "texto", visible: true, fields: { body: t(body) } });
const brand: CaseBrand = { enabled: true, light: { background: "#ffffff", foreground: "#111111", accent: "#7a1f2b" }, fontDisplay: "Playfair Display" };

describe("projeto: documento ↔ formulário com blocos e cara do cliente", () => {
  it("o formulário não tem mais a lista de seções nem o texto do case", () => {
    expect(Object.keys(projects.fields)).not.toContain("sections");
    expect(Object.keys(projects.fields)).not.toContain("content");
    expect(projects.docKeys).toEqual(expect.arrayContaining(["blocks", "brand", "content", "sections"]));
  });

  it("projeto com blocks e brand: ida e volta sem perder nada", () => {
    const doc = { _id: "p1", slug: "x", title: t("Case"), blocks: [texto("a")], brand };
    const form = docToForm(projects, doc as never);
    expect(form.blocks).toEqual(doc.blocks);
    expect(form.brand).toEqual(brand);
    const back = projects.fromForm!(form);
    expect(back.blocks).toEqual(doc.blocks);
    expect(back.brand).toEqual(brand);
  });

  it("projeto no formato antigo abre com os blocos convertidos e mantém os campos antigos", () => {
    const doc = { _id: "p1", slug: "x", title: t("Case"), content: t("<p>Texto</p>"), sections: [{ title: t("Contexto"), body: t("<p>Por quê</p>") }] };
    const form = docToForm(projects, doc as never);
    const blocks = form.blocks as BlockInstance[];
    expect(blocks.map((b) => b.id)).toEqual(["conteudo", "secao-1"]);
    expect(blocks.every((b) => b.type === "texto")).toBe(true);
    expect(form.sections).toEqual(doc.sections);
    expect(form.content).toEqual(doc.content);
  });

  it("abrir um projeto antigo e salvar sem mexer no corpo não grava nada", () => {
    const doc = { _id: "p1", slug: "x", title: t("Case"), content: t("<p>Texto</p>") };
    const form = docToForm(projects, doc as never);
    const plan = planUpdate(projects.fromForm!(form), projects.fromForm!(form), projects.docKeys, projects.required);
    expect(plan.patch).toEqual({});
    expect(plan.unset).toEqual([]);
  });

  it("mexer no corpo de um projeto antigo grava `blocks` e deixa `content` e `sections` como estão", () => {
    const doc = { _id: "p1", slug: "x", title: t("Case"), content: t("<p>Texto</p>") };
    const base = docToForm(projects, doc as never);
    const edited = { ...base, blocks: [...(base.blocks as BlockInstance[]), texto("novo")] };
    const plan = planUpdate(projects.fromForm!(base), projects.fromForm!(edited), projects.docKeys, projects.required);
    expect(Object.keys(plan.patch)).toEqual(["blocks"]);
    expect((plan.patch.blocks as BlockInstance[]).map((b) => b.id)).toEqual(["conteudo", "novo"]);
    expect(plan.unset).toEqual([]);
  });

  it("tirar todos os blocos grava lista vazia; tirar a marca vai para unset", () => {
    const doc = { _id: "p1", slug: "x", title: t("Case"), blocks: [texto("a")], brand };
    const base = docToForm(projects, doc as never);
    const { brand: _b, ...noBrand } = base;
    void _b;
    const plan = planUpdate(projects.fromForm!(base), projects.fromForm!({ ...noBrand, blocks: [] }), projects.docKeys, projects.required);
    expect(plan.patch).toEqual({ blocks: [] });
    expect(plan.unset).toEqual(["brand"]);
  });

  it("a marca guardada sai sem `dark` vazio e com a fonte aparada", () => {
    expect(cleanBrand({ ...brand, fontDisplay: "  Syne " })?.fontDisplay).toBe("Syne");
    expect(cleanBrand({ ...brand, fontDisplay: "  " })).not.toHaveProperty("fontDisplay");
    expect(cleanBrand(undefined)).toBeUndefined();
  });
});

describe("catálogo do case", () => {
  it("só mostra blocos que aceitam o contexto case", () => {
    const inCase = availableBlocks(CORE_BLOCKS, "empresa", new Set(["blog", "portfolio", "contact-wizard"]), "case").map((b) => b.type);
    for (const type of ["hero", "contato", "cases"]) expect(inCase).not.toContain(type);
    for (const type of ["texto", "video", "paleta", "tipografia", "antes-depois", "variacoes-marca", "imagens"]) expect(inCase).toContain(type);
    const inPage = availableBlocks(CORE_BLOCKS, "empresa", new Set(["blog", "portfolio", "contact-wizard"])).map((b) => b.type);
    for (const type of ["hero", "cases"]) expect(inPage).toContain(type);
    expect(inCase.every((type) => blockAllowedIn(CORE_BLOCKS.find((b) => b.type === type)!, "case"))).toBe(true);
  });

  it("explica por que um bloco de página não cabe no case", () => {
    const hero = CORE_BLOCKS.find((b) => b.type === "hero")!;
    expect(blockUnavailableReason(hero, "pessoal", new Set(), "case")).toMatch(/só existe em páginas/);
    expect(blockUnavailableReason(hero, "pessoal", new Set(), "page")).toBeUndefined();
  });

  it("valida o corpo: bloco de página, tipo desconhecido e campo inválido", () => {
    const errors = validateCaseBlocks(
      [
        { id: "h", type: "hero", visible: true, fields: {} },
        { id: "x", type: "nao-existe", visible: true, fields: {} },
        { id: "p", type: "paleta", visible: true, fields: { colors: [{ name: t("Vinho"), hex: "vinho" }] } },
        texto("ok"),
      ],
      CORE_BLOCKS,
    );
    expect(errors.map((e) => e.blockId)).toEqual(expect.arrayContaining(["h", "x", "p"]));
    expect(errors.some((e) => e.blockId === "ok")).toBe(false);
    expect(errors.find((e) => e.blockId === "h")?.index).toBe(0);
  });
});

describe("cara do cliente: contraste e problemas", () => {
  it("marca inicial já passa", () => {
    expect(brandProblems(defaultBrand())).toEqual([]);
    const report = modeReport("light", defaultBrand().light);
    expect(report.textOk && report.accentOk).toBe(true);
  });

  it("contraste baixo vira problema com a mensagem do núcleo, por modo e campo", () => {
    const bad: CaseBrand = { enabled: true, light: { background: "#ffffff", foreground: "#bbbbbb", accent: "#eeeeee" }, dark: { background: "#000000", foreground: "#ffffff", accent: "#111111" } };
    const problems = brandProblems(bad);
    expect(issuesAt(problems, "light", "foreground")[0]?.message).toMatch(/texto sobre o fundo com contraste/);
    expect(issuesAt(problems, "light", "accent")[0]?.message).toMatch(/destaque sobre o fundo/);
    expect(issuesAt(problems, "dark", "accent")).toHaveLength(1);
    expect(issuesAt(problems, "dark", "foreground")).toHaveLength(0);
    const report = modeReport("light", bad.light);
    expect(report.textOk).toBe(false);
    expect(report.text).toBeCloseTo(1.9, 0);
  });

  it("desligada não bloqueia o salvar; fonte inválida bloqueia", () => {
    expect(brandProblems({ enabled: false, light: { background: "#fff000", foreground: "#fffff0", accent: "#fff111" } })).toEqual([]);
    expect(issuesAt(brandProblems({ ...brand, fontDisplay: "Fonte; inválida" }), "light", "fontDisplay")).toHaveLength(1);
  });
});

describe("prévia do case", () => {
  const theme = defineTheme({ id: "teste", label: "Teste", contract: "^1", tokens: {}, Shell: DefaultShell });
  const fixtures = fileURLToPath(new URL("../../../../apps/demo/fixtures/pessoal", import.meta.url));
  const base = { theme, blocks: CORE_BLOCKS, plugins: CORE_PLUGINS };

  async function draft(extra: Partial<RawProject>): Promise<{ snapshot: Awaited<ReturnType<ReturnType<typeof fixtureSource>["load"]>>; project: RawProject }> {
    const snapshot = await fixtureSource(fixtures).load();
    const project = { ...snapshot.collections.projects[0]!, ...extra } as RawProject;
    return { snapshot, project };
  }

  it("mostra os blocos do rascunho (sem salvar), em h2, sem blocos de página", async () => {
    const { snapshot, project } = await draft({
      blocks: [texto("a", "Primeiro"), { id: "h", type: "hero", visible: true, fields: {} }, { ...texto("b", "Escondido"), visible: false }, texto("c", "Último")],
    });
    const preview = resolveCasePreview({ snapshot, project, locale: "pt-BR", ...base });
    if (!preview.ok) throw new Error(preview.message);
    expect(preview.blocks.map((b) => b.id)).toEqual(["a", "c"]);
    expect(preview.blocks.every((b) => b.headingLevel === 2)).toBe(true);
    expect(preview.project.id).toBe(project.id);
  });

  it("devolve a marca resolvida só quando ligada e válida", async () => {
    const on = await draft({ blocks: [], brand });
    const ok = resolveCasePreview({ snapshot: on.snapshot, project: on.project, locale: "pt-BR", ...base });
    if (!ok.ok) throw new Error(ok.message);
    expect(ok.brand?.light.accent).toBe("#7a1f2b");
    expect(ok.brand?.fontDisplay).toBe("Playfair Display");
    const off = await draft({ blocks: [], brand: { ...brand, enabled: false } });
    const none = resolveCasePreview({ snapshot: off.snapshot, project: off.project, locale: "pt-BR", ...base });
    if (!none.ok) throw new Error(none.message);
    expect(none.brand).toBeUndefined();
  });

  it("projeto novo (ainda não existe no snapshot) e idioma sem título", async () => {
    const { snapshot } = await draft({});
    const novo = { id: "novo", slug: "case-novo", title: t("Case novo"), blocks: [texto("a")] } as RawProject;
    const preview = resolveCasePreview({ snapshot, project: novo, locale: "pt-BR", ...base });
    if (!preview.ok) throw new Error(preview.message);
    expect(preview.project.title).toBe("Case novo");
    const en = resolveCasePreview({ snapshot, project: novo, locale: "en", ...base });
    expect(en.ok).toBe(false);
    if (!en.ok) expect(en.reason).toBe("untranslated");
  });
});
