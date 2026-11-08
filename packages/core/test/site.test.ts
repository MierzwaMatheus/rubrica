import { describe, expect, it } from "vitest";
import { fileURLToPath } from "node:url";
import { fixtureSource } from "../src/data/source";
import { buildSite } from "../src/render/site";
import { CORE_BLOCKS } from "../src/blocks/catalog";
import { CORE_PLUGINS } from "../src/plugins/registry";
import { defineTheme } from "../src/theme/contract";
import { DefaultShell } from "../src/components";
import { buildHead } from "../src/seo/head";
import { sitemapXml } from "../src/seo/sitemap";
import { rssFeeds } from "../src/seo/rss";

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

const empresaFixtures = fileURLToPath(new URL("../../../apps/demo/fixtures/empresa", import.meta.url));

describe("caminho do detalhe dos cases por tipo de site", () => {
  it("empresa: detalhe em /cases; pessoal continua em /portfolio", async () => {
    const empresa = buildSite({ snapshot: await fixtureSource(empresaFixtures).load(), theme, blocks: CORE_BLOCKS, plugins: CORE_PLUGINS });
    const caseUrls = empresa.routes.filter((r) => r.type === "case").map((r) => r.url);
    expect(caseUrls.length).toBeGreaterThan(0);
    expect(caseUrls.every((u) => /^(\/en|\/es)?\/cases\/[^/]+$/.test(u))).toBe(true);
    expect(empresa.paths.projects).toBe("/cases");
    expect((await site()).paths.projects).toBe("/portfolio");
  });

  it("settings.paths vence o padrão do tipo", async () => {
    const snapshot = await fixtureSource(empresaFixtures).load();
    snapshot.site.paths = { projects: "/portfolio" };
    const empresa = buildSite({ snapshot, theme, blocks: CORE_BLOCKS, plugins: CORE_PLUGINS });
    expect(empresa.routes.filter((r) => r.type === "case").every((r) => r.url.includes("/portfolio/"))).toBe(true);
  });

  it("hreflang e canonical do case seguem o novo caminho", async () => {
    const empresa = buildSite({ snapshot: await fixtureSource(empresaFixtures).load(), theme, blocks: CORE_BLOCKS, plugins: CORE_PLUGINS });
    const r = empresa.routes.find((x) => x.type === "case" && x.alternates.length > 1)!;
    const tags = buildHead(r, empresa.settings, empresa.context(r.locale, r.url, r.alternates));
    expect(tags.find((t) => t.attrs?.rel === "canonical")?.attrs?.href).toContain("/cases/");
    expect(tags.filter((t) => t.attrs?.hreflang).every((t) => String(t.attrs!.href).includes("/cases/"))).toBe(true);
  });
});

async function empresaSnapshot() {
  return fixtureSource(empresaFixtures).load();
}
const build = (snapshot: Awaited<ReturnType<typeof empresaSnapshot>>) => buildSite({ snapshot, theme, blocks: CORE_BLOCKS, plugins: CORE_PLUGINS });
const withPlugins = (snapshot: Awaited<ReturnType<typeof empresaSnapshot>>, off: string[]) => ({
  ...snapshot,
  site: { ...snapshot.site, plugins: { ...snapshot.site.plugins, ...Object.fromEntries(off.map((p) => [p, false])) } },
});

describe("plugin desligado", () => {
  it("blog desligado: sem página /blog, sem posts, sem item de menu, sitemap e feed coerentes", async () => {
    const on = build(await empresaSnapshot());
    expect(on.routes.some((r) => r.url === "/blog")).toBe(true);
    const off = build(withPlugins(await empresaSnapshot(), ["blog"]));
    const urls = off.routes.map((r) => r.url);
    expect(urls).not.toContain("/blog");
    expect(urls.some((u) => u.includes("/blog"))).toBe(false);
    expect(off.context("pt-BR", "/").site.navigation.map((n) => n.href)).not.toContain("/blog");
    expect(on.context("pt-BR", "/").site.navigation.map((n) => n.href)).toContain("/blog");
    expect(sitemapXml("https://x.test", off.routes)).not.toContain("/blog");
    expect(rssFeeds(off)).toEqual([]);
  });

  it("menu em outro idioma também perde o item", async () => {
    const off = build(withPlugins(await empresaSnapshot(), ["blog"]));
    expect(off.context("en", "/en").site.navigation.map((n) => n.href)).not.toContain("/en/blog");
  });

  it("preços desligado: a listagem some mesmo com o FAQ sobrando, e o menu também", async () => {
    const off = build(withPlugins(await empresaSnapshot(), ["pricing"]));
    expect(off.routes.some((r) => r.url === "/precos")).toBe(false);
    expect(off.context("pt-BR", "/").site.navigation.map((n) => n.href)).not.toContain("/precos");
  });

  it("portfólio desligado: some a listagem em /cases (base configurada) e o detalhe", async () => {
    const off = build(withPlugins(await empresaSnapshot(), ["portfolio"]));
    expect(off.routes.some((r) => r.url === "/cases" || r.type === "case")).toBe(false);
    expect(off.context("pt-BR", "/").site.navigation.map((n) => n.href)).not.toContain("/cases");
  });

  it("página com vários blocos: só o bloco do plugin desligado some", async () => {
    const off = build(withPlugins(await empresaSnapshot(), ["team"]));
    const page = off.routes.find((r) => r.type === "page" && r.url === "/quem-somos");
    expect(page?.type === "page" && page.page.blocks.map((b) => b.type)).toEqual(["texto", "linha-do-tempo", "numeros", "lista-itens", "video"]);
    expect(page?.type === "page" && page.page.blocks.map((b) => b.index)).toEqual([0, 1, 2, 3, 4]);
  });

  it("bloco de cases na home some com o portfólio desligado", async () => {
    const off = build(withPlugins(await empresaSnapshot(), ["portfolio", "testimonials"]));
    const home = off.routes.find((r) => r.type === "page" && r.url === "/");
    const types = home?.type === "page" ? home.page.blocks.map((b) => b.type) : [];
    expect(types).not.toContain("cases");
    expect(types).not.toContain("depoimentos");
    expect(types).toContain("servicos");
  });

  it("a home nunca some por causa de plugin", async () => {
    const off = build(withPlugins(await empresaSnapshot(), ["blog", "portfolio", "testimonials", "pricing", "team"]));
    expect(off.routes.some((r) => r.url === "/")).toBe(true);
  });
});

describe("blocos de coleção sem itens", () => {
  it("destaques ausentes: cai para os primeiros da lista, até o limite", async () => {
    const snapshot = await empresaSnapshot();
    snapshot.collections.projects = snapshot.collections.projects.map((p) => ({ ...p, featured: false }));
    const home = build(snapshot).routes.find((r) => r.type === "page" && r.url === "/");
    const cases = home?.type === "page" ? home.page.blocks.find((b) => b.type === "cases") : undefined;
    expect(cases?.items.length).toBe(Math.min(3, snapshot.collections.projects.length));
  });

  it("com destaques, só eles", async () => {
    const snapshot = await empresaSnapshot();
    snapshot.collections.projects = snapshot.collections.projects.map((p, i) => ({ ...p, featured: i === 0 }));
    const home = build(snapshot).routes.find((r) => r.type === "page" && r.url === "/");
    const cases = home?.type === "page" ? home.page.blocks.find((b) => b.type === "cases") : undefined;
    expect(cases?.items.length).toBe(1);
  });

  it("sem itens, o bloco some da página que tem outros blocos (sem título solto)", async () => {
    const snapshot = await empresaSnapshot();
    snapshot.collections.testimonials = [];
    snapshot.collections.projects = [];
    const home = build(snapshot).routes.find((r) => r.type === "page" && r.url === "/");
    const types = home?.type === "page" ? home.page.blocks.map((b) => b.type) : [];
    expect(types).not.toContain("depoimentos");
    expect(types).not.toContain("cases");
    expect(types).toContain("hero");
  });

  it("página só com a listagem vazia continua com o bloco (vazio padrão do tema)", async () => {
    const snapshot = await empresaSnapshot();
    snapshot.collections.projects = [];
    const page = build(snapshot).routes.find((r) => r.type === "page" && r.url === "/cases");
    expect(page?.type === "page" && page.page.blocks.map((b) => b.type)).toEqual(["cases"]);
  });

  it("convite de depoimento (ilha ativa) segura o bloco mesmo sem depoimentos", async () => {
    const snapshot = await empresaSnapshot();
    snapshot.collections.testimonials = [];
    snapshot.site.plugins["testimonials-intake"] = true;
    const home = snapshot.pages.find((p) => p.path === "/")!;
    home.blocks.find((b) => b.type === "depoimentos")!.fields.allowSubmission = true;
    const r = build(snapshot).routes.find((x) => x.type === "page" && x.url === "/");
    expect(r?.type === "page" && r.page.blocks.some((b) => b.type === "depoimentos")).toBe(true);
  });
});
