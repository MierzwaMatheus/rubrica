import { describe, expect, it } from "vitest";
import { fileURLToPath } from "node:url";
import { fixtureSource } from "../../src/data/source";
import { buildSite } from "../../src/render/site";
import { CORE_BLOCKS } from "../../src/blocks/catalog";
import { CORE_PLUGINS } from "../../src/plugins/registry";
import { defineTheme } from "../../src/theme/contract";
import { DefaultShell } from "../../src/components";
import { resolvePreview } from "../../src/admin/preview/resolve";
import type { PageRecord } from "../../src/content/types";

const theme = defineTheme({ id: "teste", label: "Teste", contract: "^1", tokens: {}, Shell: DefaultShell, variants: { cases: [{ value: "grade", label: "Grade" }, { value: "lista", label: "Lista" }] } });
const fixtures = fileURLToPath(new URL("../../../../apps/demo/fixtures/pessoal", import.meta.url));
const base = { theme, blocks: CORE_BLOCKS, plugins: CORE_PLUGINS };

describe("prévia: rascunho resolvido como no site", () => {
  it("a página publicada sai igual à do build, em cada idioma", async () => {
    const snapshot = await fixtureSource(fixtures).load();
    const built = buildSite({ snapshot, ...base });
    for (const page of snapshot.pages.filter((p) => p.published)) {
      for (const route of built.routes.filter((r) => r.type === "page" && r.page.id === page.id)) {
        const preview = resolvePreview({ snapshot, page, locale: route.locale, ...base });
        expect(preview.ok, `${page.path} ${route.locale}`).toBe(true);
        if (!preview.ok || route.type !== "page") continue;
        expect(preview.page).toEqual(route.page);
        expect(preview.url).toBe(route.url);
        const ctx = built.context(route.locale, route.url, route.alternates);
        expect(preview.ctx.site).toEqual(ctx.site);
        expect(preview.ctx.alternates).toEqual(ctx.alternates);
        expect(preview.ctx.t("nav.menu")).toBe(ctx.t("nav.menu"));
      }
    }
  });

  it("mostra rascunho não publicado e as mudanças ainda não salvas", async () => {
    const snapshot = await fixtureSource(fixtures).load();
    const home = snapshot.pages.find((p) => p.path === "/")!;
    const draft: PageRecord = structuredClone({ ...home, published: false });
    (draft.blocks[0]!.fields.title as Record<string, string>)["pt-BR"] = "Título novo, sem salvar";
    draft.blocks[1]!.visible = false;
    const preview = resolvePreview({ snapshot, page: draft, locale: "pt-BR", ...base });
    if (!preview.ok) throw new Error(preview.message);
    expect(preview.page.blocks[0]?.fields.title).toBe("Título novo, sem salvar");
    expect(preview.page.blocks.map((b) => b.id)).not.toContain(home.blocks[1]!.id);
  });

  it("variação desconhecida cai na padrão do tema; fonte da coleção vale", async () => {
    const snapshot = await fixtureSource(fixtures).load();
    const page: PageRecord = {
      id: "nova",
      path: "/nova",
      title: { "pt-BR": "Nova" },
      published: false,
      updatedAt: 0,
      blocks: [{ id: "c", type: "cases", variant: "carrossel", visible: true, fields: {}, source: { collection: "projects", limit: 1, sort: "order" } }],
    };
    const preview = resolvePreview({ snapshot, page, locale: "pt-BR", ...base });
    if (!preview.ok) throw new Error(preview.message);
    expect(preview.page.blocks[0]?.variant).toBe("grade");
    expect(preview.page.blocks[0]?.items).toHaveLength(1);
    expect(preview.page.needsHiddenH1).toBe(true);
  });

  it("página sem título no idioma não existe nele (decisão 28)", async () => {
    const snapshot = await fixtureSource(fixtures).load();
    const page: PageRecord = { id: "x", path: "/x", title: { "pt-BR": "Só português" }, published: true, updatedAt: 0, blocks: [] };
    expect(resolvePreview({ snapshot, page, locale: "en", ...base })).toMatchObject({ ok: false, reason: "untranslated" });
  });

  it("caminho que colide com outra rota vira erro, não exceção", async () => {
    const snapshot = await fixtureSource(fixtures).load();
    const post = snapshot.collections.posts[0]!;
    const page: PageRecord = { id: "x", path: `/blog/${post.slug}`, title: { "pt-BR": "Colide" }, published: true, updatedAt: 0, blocks: [] };
    expect(resolvePreview({ snapshot, page, locale: "pt-BR", ...base })).toMatchObject({ ok: false, reason: "error" });
  });
});
