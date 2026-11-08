// @vitest-environment edge-runtime
import { beforeEach, describe, expect, it } from "vitest";
import pagesFixture from "../../../../apps/demo/fixtures/pessoal/pages.json";
import siteFixture from "../../../../apps/demo/fixtures/pessoal/site.json";
import textsFixture from "../../../../apps/demo/fixtures/pessoal/texts.json";
import postsFixture from "../../../../apps/demo/fixtures/pessoal/collections/posts.json";
import projectsFixture from "../../../../apps/demo/fixtures/pessoal/collections/projects.json";
import { buildSite } from "../../src/render/site";
import { CORE_BLOCKS } from "../../src/blocks/catalog";
import { CORE_PLUGINS } from "../../src/plugins/registry";
import { defineTheme } from "../../src/theme/contract";
import { DefaultShell } from "../../src/components";
import { emptyCollections, type SiteSnapshot } from "../../src/data/source";
import type { PageRecord, RawPost, RawProject, SiteSettings, UiTexts } from "../../src/content/types";
import { api, as, internal, seedSettings, setup, type T } from "./_setup";

const theme = defineTheme({ id: "teste", label: "Teste", contract: "^1", tokens: {}, Shell: DefaultShell });

/** Grava os fixtures da demo direto no banco (como o `migrar`/`setup` fariam). */
async function seedFixtures(t: T) {
  await t.mutation(internal.rubrica.settings.init, { settings: siteFixture as never });
  await t.run(async (ctx) => {
    const now = Date.now();
    for (const { id, ...page } of pagesFixture as PageRecord[]) {
      void id;
      await ctx.db.insert("pages", { ...page, createdAt: now } as never);
    }
    for (const { id, ...post } of postsFixture as RawPost[]) {
      void id;
      await ctx.db.insert("posts", { ...post, published: true, createdAt: now } as never);
    }
    for (const { id, ...project } of projectsFixture as unknown as RawProject[]) {
      void id;
      await ctx.db.insert("projects", { ...project, published: true, createdAt: now } as never);
    }
    for (const [key, value] of Object.entries(textsFixture as UiTexts)) {
      await ctx.db.insert("uiTexts", { key, value: value as Record<string, string>, updatedAt: now });
    }
  });
}

const fixtureSnapshot = (): SiteSnapshot => ({
  site: siteFixture as unknown as SiteSettings,
  pages: pagesFixture as PageRecord[],
  texts: textsFixture as UiTexts,
  collections: { ...emptyCollections(), posts: postsFixture as RawPost[], projects: projectsFixture as unknown as RawProject[] },
});

const routes = (snapshot: SiteSnapshot) =>
  buildSite({ snapshot, theme, blocks: CORE_BLOCKS, plugins: CORE_PLUGINS })
    .routes.map((r) => `${r.type} ${r.url}`)
    .sort();

describe("snapshot do build", () => {
  let t: T;
  beforeEach(() => {
    t = setup();
  });

  it("sem configuração, falha com mensagem clara", async () => {
    await expect(t.query(api.rubrica.site.snapshot, {})).rejects.toThrow(/ainda não foi configurado/);
  });

  it("os fixtures da demo, gravados no Convex, geram o mesmo site", async () => {
    await seedFixtures(t);
    const snapshot = await t.query(api.rubrica.site.snapshot, {});
    expect(snapshot.site).toEqual(siteFixture);
    expect(snapshot.texts).toEqual(textsFixture);
    expect(snapshot.pages.map((p) => p.path)).toEqual(fixtureSnapshot().pages.map((p) => p.path).sort());
    expect(Object.keys(snapshot.collections).sort()).toEqual(Object.keys(emptyCollections()).sort());
    const strip = ({ id, ...rest }: { id: string }) => (void id, rest);
    expect(snapshot.collections.posts.map(strip)).toEqual([...(postsFixture as RawPost[])].sort((a, b) => b.publishedAt - a.publishedAt).map(strip));
    expect(routes(snapshot)).toEqual(routes(fixtureSnapshot()));
  });

  it("só o publicado: sem rascunho, lixeira nem bloco oculto", async () => {
    await seedSettings(t);
    const editor = await as(t, "admin");
    const hero = { id: "h", type: "hero", visible: true, fields: { title: { "pt-BR": "Oi" } } };
    const hidden = { id: "x", type: "texto", visible: false, fields: { body: { "pt-BR": "<p>rascunho</p>" } } };
    const home = await editor.mutation(api.rubrica.pages.create, { path: "/", title: { "pt-BR": "Início" }, blocks: [hero, hidden], published: true });
    await editor.mutation(api.rubrica.pages.create, { path: "/rascunho", title: { "pt-BR": "Rascunho" } });
    const gone = await editor.mutation(api.rubrica.pages.create, { path: "/apagada", title: { "pt-BR": "Apagada" }, published: true });
    await editor.mutation(api.rubrica.pages.remove, { id: gone });

    const live = await editor.mutation(api.rubrica.posts.create, { title: { "pt-BR": "No ar" }, content: { "pt-BR": "<p>a</p>" } });
    await editor.mutation(api.rubrica.posts.publish, { id: live });
    await editor.mutation(api.rubrica.posts.create, { title: { "pt-BR": "Rascunho" }, content: { "pt-BR": "<p>b</p>" } });
    const trashed = await editor.mutation(api.rubrica.posts.create, { title: { "pt-BR": "Lixeira" }, content: { "pt-BR": "<p>c</p>" } });
    await editor.mutation(api.rubrica.posts.publish, { id: trashed });
    await editor.mutation(api.rubrica.posts.remove, { id: trashed });

    await editor.mutation(api.rubrica.services.create, { title: { "pt-BR": "Visível" } });
    await editor.mutation(api.rubrica.services.create, { title: { "pt-BR": "Oculto" }, published: false });

    const snap = await t.query(api.rubrica.site.snapshot, {});
    expect(snap.pages.map((p) => p.path)).toEqual(["/"]);
    expect(snap.pages[0]).toMatchObject({ id: home, published: true, title: { "pt-BR": "Início" } });
    expect(snap.pages[0]!.blocks.map((b) => b.id)).toEqual(["h"]);
    expect(snap.collections.posts.map((p) => p.slug)).toEqual(["no-ar"]);
    expect(snap.collections.services.map((s) => s.title)).toEqual([{ "pt-BR": "Visível" }]);

    // Só os campos do conteúdo: nada de controle interno.
    const post = snap.collections.posts[0]!;
    expect(post.id).toBe(live);
    expect(Object.keys(post).sort()).toEqual(["content", "id", "order", "publishedAt", "slug", "title", "updatedAt"]);
  });

  it("coleção de plugin desligado chega vazia", async () => {
    await seedSettings(t);
    const root = await as(t, "root");
    const id = await root.mutation(api.rubrica.posts.create, { title: { "pt-BR": "P" }, content: { "pt-BR": "x" } });
    await root.mutation(api.rubrica.posts.publish, { id });
    await root.mutation(api.rubrica.settings.setPlugin, { id: "blog", enabled: false });
    expect((await t.query(api.rubrica.site.snapshot, {})).collections.posts).toEqual([]);
  });

  it("refaz a URL das imagens do storage e completa as dimensões pela biblioteca", async () => {
    await seedSettings(t);
    const root = await as(t, "root");
    const storageId = await t.run((ctx) => ctx.storage.store(new Blob(["png"], { type: "image/png" })));
    await root.mutation(api.rubrica.media.save, { storageId, name: "capa.png", width: 1200, height: 630, alt: { "pt-BR": "Capa" } });
    const cover = { url: "https://antigo.convex.cloud/api/storage/velho", storageId, alt: { "pt-BR": "Capa" } };
    const id = await root.mutation(api.rubrica.posts.create, { title: { "pt-BR": "Com capa" }, content: { "pt-BR": "x" }, cover });
    await root.mutation(api.rubrica.posts.publish, { id });
    await root.mutation(api.rubrica.pages.create, {
      path: "/",
      title: { "pt-BR": "Início" },
      published: true,
      blocks: [{ id: "h", type: "hero", visible: true, fields: { title: { "pt-BR": "Oi" }, image: cover } }],
    });
    const external = { url: "https://images.exemplo.dev/foto.jpg", width: 10, height: 10 };
    await root.mutation(api.rubrica.services.create, { title: { "pt-BR": "S" } });
    await root.mutation(api.rubrica.settings.update, { patch: { ogImage: external } });

    const snap = await t.query(api.rubrica.site.snapshot, {});
    const current = await t.run((ctx) => ctx.storage.getUrl(storageId));
    expect(current).toBeTruthy();
    expect(snap.collections.posts[0]!.cover).toEqual({ url: current, storageId, alt: { "pt-BR": "Capa" }, width: 1200, height: 630 });
    expect(snap.pages[0]!.blocks[0]!.fields.image).toMatchObject({ url: current, width: 1200, height: 630 });
    expect(snap.site.ogImage).toEqual(external);
  });
});
