import { describe, expect, it } from "vitest";
import { fileURLToPath } from "node:url";
import { fixtureSource } from "../src/data/source";
import { buildSite } from "../src/render/site";
import { CORE_BLOCKS } from "../src/blocks/catalog";
import { CORE_PLUGINS } from "../src/plugins/registry";
import { defineTheme } from "../src/theme/contract";
import { DefaultShell } from "../src/components";
import { buildHead } from "../src/seo/head";

const theme = defineTheme({ id: "teste", label: "Teste", contract: "^1", tokens: {}, Shell: DefaultShell, variants: { cases: [{ value: "grade", label: "Grade" }] } });
const fixtures = fileURLToPath(new URL("../../../apps/demo/fixtures/pessoal", import.meta.url));

async function site() {
  return buildSite({ snapshot: await fixtureSource(fixtures).load(), theme, blocks: CORE_BLOCKS, plugins: CORE_PLUGINS });
}

describe("montagem do site", () => {
  it("gera cada página só nos idiomas traduzidos", async () => {
    const urls = (await site()).routes.map((r) => r.url).sort();
    expect(urls).toContain("/novidades");
    expect(urls).not.toContain("/en/novidades");
    expect(urls).toContain("/blog/so-portugues");
    expect(urls).not.toContain("/en/blog/so-portugues");
    expect(urls).toContain("/en/portfolio/app-banco");
  });

  it("hero no topo leva o h1; sem hero, h1 oculto", async () => {
    const s = await site();
    const home = s.routes.find((r) => r.url === "/" && r.type === "page");
    const sobre = s.routes.find((r) => r.url === "/sobre" && r.type === "page");
    if (home?.type !== "page" || sobre?.type !== "page") throw new Error("rotas ausentes");
    expect(home.page.needsHiddenH1).toBe(false);
    expect(home.page.blocks[0]?.headingLevel).toBe(1);
    expect(home.page.blocks.slice(1).every((b) => b.headingLevel === 2)).toBe(true);
    expect(sobre.page.needsHiddenH1).toBe(true);
    // Cada bloco sabe quantos blocos visíveis a página tem.
    expect(home.page.blocks.every((b) => b.total === home.page.blocks.length)).toBe(true);
  });

  it("blocos ocultos somem e listas em inglês não mostram itens só em português", async () => {
    const s = await site();
    const home = s.routes.find((r) => r.url === "/en");
    if (home?.type !== "page") throw new Error("rota ausente");
    expect(home.page.blocks.map((b) => b.type)).not.toContain("texto");
    const posts = home.page.blocks.find((b) => b.type === "posts-recentes")!;
    expect((posts.items as { slug: string }[]).map((p) => p.slug)).toEqual(["pesquisa-com-usuarios"]);
    expect(home.page.blocks.find((b) => b.type === "cases")?.variant).toBe("grade");
  });

  it("<head> com canonical, hreflang só dos idiomas existentes e x-default", async () => {
    const s = await site();
    const post = s.routes.find((r) => r.url === "/blog/so-portugues")!;
    const tags = buildHead(post, s.settings, s.context(post.locale, post.url, post.alternates));
    expect(tags.filter((t) => t.attrs?.hreflang)).toEqual([]);
    expect(tags.find((t) => t.attrs?.rel === "canonical")?.attrs?.href).toBe("https://demo.userubrica.dev/blog/so-portugues");
    const en = s.routes.find((r) => r.url === "/en/blog/pesquisa-com-usuarios")!;
    const enTags = buildHead(en, s.settings, s.context(en.locale, en.url, en.alternates));
    expect(enTags.filter((t) => t.attrs?.hreflang).map((t) => t.attrs!.hreflang)).toEqual(["pt-BR", "en", "x-default"]);
  });

  it("<head> das páginas do app (proposta, checkout): título, noindex e sem canonical nem hreflang", async () => {
    const s = await site();
    const tags = buildHead({ type: "app", url: "/_rubrica/app/en/proposta", locale: "en", title: "Proposal" }, s.settings, s.context("en", "/en/proposta/:slug", []));
    expect(tags.find((t) => t.tag === "title")?.content).toMatch(/^Proposal \| /);
    expect(tags.find((t) => t.attrs?.name === "robots")?.attrs?.content).toBe("noindex, nofollow");
    expect(tags.filter((t) => t.attrs?.rel === "canonical" || t.attrs?.hreflang)).toEqual([]);
    expect(tags.find((t) => t.attrs?.property === "og:url")?.attrs?.content).toBe("https://demo.userubrica.dev/en");
  });

  it("feed RSS e disponibilidade chegam ao contexto", async () => {
    const s = await site();
    expect(s.context("pt-BR", "/").feeds).toEqual({ rss: "/rss.xml" });
    expect(s.context("en", "/en").feeds).toEqual({ rss: "/en/rss.xml" });
    // A home da demo pessoal mostra a disponibilidade no hero.
    expect(s.context("pt-BR", "/").site.availability).toBe(true);
    const snapshot = await fixtureSource(fixtures).load();
    const noBlog = buildSite({ snapshot: { ...snapshot, site: { ...snapshot.site, plugins: { ...snapshot.site.plugins, blog: false } }, pages: snapshot.pages.filter((p) => p.path !== "/") }, theme, blocks: CORE_BLOCKS, plugins: CORE_PLUGINS });
    expect(noBlog.context("pt-BR", "/sobre").feeds).toEqual({});
    expect(noBlog.context("pt-BR", "/sobre").site.availability).toBe(false);
  });

  it("resumo leve das coleções para a casca, no idioma", async () => {
    const s = await site();
    const pt = s.collections("pt-BR");
    expect(pt.projects.map((p) => p.url)).toContain("/portfolio/app-banco");
    expect(Object.keys(pt.projects[0]!).sort()).toEqual(expect.arrayContaining(["id", "title", "url", "tags", "featured"]));
    expect(pt.projects[0]).not.toHaveProperty("sections");
    expect(pt.posts.map((p) => p.url)).toContain("/blog/so-portugues");
    expect(s.collections("en").posts.map((p) => p.url)).not.toContain("/en/blog/so-portugues");
    expect(s.collections("pt-BR")).toBe(pt);
  });

  it("textos de interface caem no idioma do núcleo", async () => {
    const s = await site();
    expect(s.context("en", "/en").t("blog.readingTime", { minutes: 3 })).toBe("3 min read");
    expect(s.context("pt-BR", "/").t("nav.menu")).toBe("Menu");
  });

  it("telefone e WhatsApp do dono chegam à casca (ctx.site.person)", async () => {
    const snapshot = await fixtureSource(fixtures).load();
    snapshot.site.person = { name: "Ana", phone: "+55 11 90000-0000", whatsapp: "+5511900000000" };
    const built = await buildSite({ snapshot, theme, blocks: CORE_BLOCKS, plugins: CORE_PLUGINS });
    expect(built.context("pt-BR", "/", []).site.person).toMatchObject({ phone: "+55 11 90000-0000", whatsapp: "+5511900000000" });
  });

  it("logo do site chega ao contexto com o nome como alt quando falta", async () => {
    const snapshot = await fixtureSource(fixtures).load();
    snapshot.site.logo = { url: "/logo.svg", dark: { url: "/logo-dark.svg", alt: { en: "Ana" } } };
    const s = buildSite({ snapshot, theme, blocks: CORE_BLOCKS, plugins: CORE_PLUGINS });
    const logo = s.context("en", "/en").site.logo;
    expect(logo).toMatchObject({ src: "/logo.svg", alt: "Ana Souza", dark: { src: "/logo-dark.svg", alt: "Ana" } });
  });

  it("textos do tema ficam entre os do site e os do núcleo", async () => {
    const snapshot = await fixtureSource(fixtures).load();
    const themed = { ...theme, texts: { "teste.ola": { pt: "Olá do tema", en: "Hi from theme" }, "nav.menu": { pt: "Navegar" } } };
    const s = buildSite({ snapshot, theme: themed, blocks: CORE_BLOCKS, plugins: CORE_PLUGINS });
    expect(s.context("en", "/en").t("teste.ola")).toBe("Hi from theme");
    expect(s.context("pt-BR", "/").t("nav.menu")).toBe("Navegar");
    expect(s.context("en", "/en").t("nav.menu")).toBe("Menu");
  });
});
