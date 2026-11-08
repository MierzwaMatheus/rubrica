import { describe, expect, it } from "vitest";
import { CORE_RECIPES, validateBlock, type Recipe } from "@rubrica/core";
import { CORE_BLOCKS } from "@rubrica/core/blocks";
import { convertV1, loc, parsePeriod, slugify, toHtml, V1_TEXTS } from "../src/migrate/convert";
import { IDS, PRINCIPIOS, V1_RUBRICA_JSON, v1Export } from "./fixtures/v1-export";

const NOW = 1_800_000_000_000;
const run = (recipe: Recipe = CORE_RECIPES.pessoal) => convertV1({ tables: v1Export().tables, v1: V1_RUBRICA_JSON, theme: "cyberpunk", recipe, now: NOW });
const byPath = (r: ReturnType<typeof run>, path: string) => r.tables.pages!.find((p) => p.path === path)!;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const block = (page: any, type: string, n = 0): { fields: Record<string, any>; source?: unknown } => page.blocks.filter((b: { type: string }) => b.type === type)[n];

describe("ajudantes", () => {
  it("ptBR/enUS → mapa por idioma, sem vazios", () => {
    expect(loc("Olá", { ptBR: "Olá", enUS: "Hi" })).toEqual({ "pt-BR": "Olá", en: "Hi" });
    expect(loc(undefined, { ptBR: "Só pt" })).toEqual({ "pt-BR": "Só pt" });
    expect(loc("", { enUS: "  " })).toEqual({});
  });

  it("períodos do currículo", () => {
    expect(parsePeriod("jan/2020 – atual")).toEqual({ start: "2020-01", ok: true });
    expect(parsePeriod("2014 - 2018")).toEqual({ start: "2014", end: "2018", ok: true });
    expect(parsePeriod("03/2016 - 12/2017")).toEqual({ start: "2016-03", end: "2017-12", ok: true });
    expect(parsePeriod("Mar 2019 - Present")).toEqual({ start: "2019-03", ok: true });
    expect(parsePeriod("setembro de 2021 a dezembro de 2022")).toEqual({ start: "2021-09", end: "2022-12", ok: true });
    expect(parsePeriod("verão de 2019").ok).toBe(false);
  });

  it("texto puro vira parágrafos; HTML fica como está", () => {
    expect(toHtml("Um.\n\nDois <b>\nlinha")).toBe("<p>Um.</p><p>Dois &lt;b&gt;<br>linha</p>");
    expect(toHtml("<p>Já é HTML</p>")).toBe("<p>Já é HTML</p>");
    expect(slugify("Identidade Visual: Padaria!")).toBe("identidade-visual-padaria");
  });
});

describe("tabelas 1:1", () => {
  const r = run();

  it("usuários, contas e papéis passam com os mesmos ids; sessões saem", () => {
    expect(r.tables.users!.map((u) => u._id)).toEqual([IDS.ana, IDS.editor]);
    expect(r.tables.authAccounts).toHaveLength(1);
    expect(r.tables.userRoles!.map((u) => u.role)).toEqual(["root", "blog-editor"]);
    expect(r.tables.authSessions).toBeUndefined();
    expect(r.report.dropped.find((d) => d.table === "authSessions")?.reason).toMatch(/entra de novo/);
    expect(r.sources.users).toBe("users");
    expect(r.sources.faq).toBe("aboutFaq");
  });

  it("posts: traduções, capa da biblioteca, SEO, rascunho e lixeira", () => {
    const [post, draft, deleted] = r.tables.posts!;
    expect(post).toMatchObject({
      slug: "como-desenho-sistemas",
      title: { "pt-BR": "Como desenho sistemas", en: "How I design systems" },
      excerpt: { "pt-BR": "Um método em cinco passos", en: "A five-step method" },
      content: { "pt-BR": "<p>Texto do post.</p>", en: "<p>Post body.</p>" },
      cover: { url: "https://exemplo-123.convex.cloud/api/storage/capa", storageId: IDS.storage[0], alt: { "pt-BR": "Imagem capa-post" }, width: 1200, height: 630 },
      seo: { title: { "pt-BR": "Sistemas de design na prática" } },
      tags: ["design", "processo"],
      featured: true,
      published: true,
      authorId: IDS.ana,
    });
    expect(post!.readTime).toBeUndefined();
    expect(post!.status).toBeUndefined();
    expect(draft!.published).toBe(false);
    expect(deleted!.deletedAt).toBeDefined();
  });

  it("projetos: case em seções, métricas, depoimento, links, categoria e destaque", () => {
    const [app, marca] = r.tables.projects!;
    expect(app!.featured).toBe(true);
    expect(app!.summary).toEqual({ "pt-BR": "Redesenho do fluxo de agendamento.", en: "Booking flow redesign." });
    expect(app!.content).toEqual({ "pt-BR": "<p>Primeiro parágrafo.</p><p>Segundo parágrafo.</p>" });
    expect(app!.role).toEqual({ "pt-BR": "Designer líder", en: "Lead designer" });
    const titles = (app!.sections as { title: Record<string, string> }[]).map((s) => s.title["pt-BR"]);
    expect(titles).toEqual(["Antes", "O Problema", "A Solução", "Os Resultados", "Resultados em Números", "Depoimento"]);
    const sections = app!.sections as { body: Record<string, string> }[];
    expect(sections[1]!.body).toEqual({ "pt-BR": "<p>Muitas faltas.</p>", en: "<p>Many no-shows.</p>" });
    expect(sections[0]!.body).toEqual({ "pt-BR": "<p>Agenda em papel.</p>" });
    expect(sections[4]!.body["pt-BR"]).toBe("<ul><li><strong>−40%</strong> faltas</li></ul>");
    expect(sections[5]!.body.en).toContain("It changed the clinic.");
    expect(app!.cover).toMatchObject({ storageId: IDS.storage[1] });
    expect((app!.gallery as unknown[]).length).toBe(2);
    expect(app!.links).toEqual([
      { label: { "pt-BR": "Demo ao Vivo", en: "Live Demo" }, href: "https://app.exemplo.dev" },
      { label: { "pt-BR": "Código", en: "Code" }, href: "https://github.com/exemplo/app" },
    ]);
    expect(app!.tags).toEqual(["Produto", "ux", "mobile"]);
    expect(marca!.slug).toBe("identidade-visual");
    expect(marca!.featured).toBeUndefined();
    expect(marca!.cover).toEqual({ url: "https://imagens.exemplo.dev/marca.png" });
    expect(r.report.warnings.join(" ")).toMatch(/Identidade visual.*não tinha slug/);
  });

  it("serviços, depoimentos, FAQ e dia a dia", () => {
    expect(r.tables.services![0]).toMatchObject({ title: { "pt-BR": "Design de produto", en: "Product design" }, order: 0, published: true });
    expect(r.tables.testimonials![0]).toMatchObject({ quote: { "pt-BR": "Excelente trabalho.", en: "Excellent work." }, author: "Carlos", featured: true, tags: ["Produto"], avatar: { url: "https://imagens.exemplo.dev/carlos.png" } });
    expect(r.tables.testimonials![1]!.featured).toBeUndefined();
    expect(r.tables.faq![0]).toMatchObject({ question: { "pt-BR": "Trabalha remoto?", en: "Do you work remotely?" }, answer: { "pt-BR": "Sim.", en: "Yes." }, order: 0 });
    expect(r.tables.routine![0]).toMatchObject({ title: { "pt-BR": "Café e rascunhos", en: "Coffee and sketches" }, image: { storageId: IDS.storage[1] } });
    expect(r.report.warnings.join(" ")).toMatch(/tamanho de cada foto/);
  });

  it("currículo: tipos da v1 → da v2, períodos e o que não deu para entender", () => {
    const items = r.tables.resumeItems!;
    expect(items.map((i) => i.kind)).toEqual(["experience", "experience", "education", "skill", "skill", "certification", "language", "experience", "experience"]);
    expect(items[0]).toMatchObject({ title: { "pt-BR": "Designer líder", en: "Lead designer" }, organization: "Clínica X", start: "2020-01" });
    expect(items[0]!.end).toBeUndefined();
    expect(items[1]!.start).toBeUndefined();
    expect(items[2]).toMatchObject({ organization: "Universidade Z", start: "2014", end: "2018" });
    expect(items[3]).toMatchObject({ title: { "pt-BR": "Figma" }, description: { "pt-BR": "Avançado" }, tags: ["Ferramentas"] });
    expect(items[4]).toMatchObject({ title: { "pt-BR": "Comunicação", en: "Communication" }, tags: ["soft-skill"] });
    expect(items[6]).toMatchObject({ title: { "pt-BR": "Inglês", en: "English" }, description: { "pt-BR": "Fluente" } });
    expect(items[7]).toMatchObject({ title: { "pt-BR": "Mentoria em ONG" }, tags: ["voluntariado"] });
    expect(items[8]!.deletedAt).toBeDefined();
    expect(r.report.warnings.join(" ")).toMatch(/verão de 2019/);
  });

  it("mídia: pasta pelo caminho e storageId mantido", () => {
    expect(r.tables.media![0]).toMatchObject({ _id: IDS.capa, storageId: IDS.storage[0], name: "capa-post", folder: "/blog", alt: { "pt-BR": "Imagem capa-post" }, size: 3, contentType: "image/png" });
    expect(r.tables.media![1]!.folder).toBe("/");
  });
});

describe("configurações do site", () => {
  const settings = run().tables.siteSettings![0]!;

  it("identidade, idiomas com /en, tema e aparência", () => {
    expect(settings).toMatchObject({
      kind: "pessoal",
      name: { "pt-BR": "Bruna Lima" },
      description: { "pt-BR": "Designer de produto em São Paulo." },
      url: "https://brunalima.design",
      locales: { locales: ["pt-BR", "en"], default: "pt-BR" },
      theme: "cyberpunk",
      appearance: { colorMode: "dark", colorToggle: false, scheme: "neon", tokens: { "rb-accent": "#ff3366" }, fontSans: "Chakra Petch", fontMono: "JetBrains Mono" },
      twitterHandle: "brunalima",
      ogImage: { url: "https://imagens.exemplo.dev/og.png" },
    });
  });

  it("pessoa e redes do contactInfo", () => {
    expect(settings.person).toEqual({ name: "Bruna Lima", jobTitle: { "pt-BR": "Designer de produto", en: "Product designer" }, email: "contato@brunalima.design", photo: { url: "", storageId: IDS.storage[1] } });
    expect(settings.social).toEqual([{ network: "linkedin", url: "https://linkedin.com/in/brunalima" }, { network: "github", url: "https://github.com/brunalima" }]);
  });

  it("plugins com os nomes da v2: i18n → translation, playground sai", () => {
    expect(settings.plugins).toMatchObject({ translation: false, payments: false, blog: true, portfolio: true, "testimonials-intake": true });
    expect(settings.plugins.playground).toBeUndefined();
    expect(settings.plugins.i18n).toBeUndefined();
    const report = run().report.plugins;
    expect(report.find((p) => p.v1 === "playground")).toEqual({ v1: "playground", v2: null, enabled: true });
    expect(report.find((p) => p.v1 === "i18n")).toEqual({ v1: "i18n", v2: "translation", enabled: false });
  });

  it("menu a partir das páginas fixas, com os rótulos da v1", () => {
    expect(settings.navigation.map((n: { href: string }) => n.href)).toEqual(["/", "/sobre", "/curriculo", "/portfolio", "/blog", "/depoimentos"]);
    expect(settings.navigation[1].label).toEqual({ "pt-BR": "Sobre Mim", en: V1_TEXTS["navigation.about"]!.en });
  });
});

describe("páginas pela receita, preenchidas com a v1", () => {
  const r = run();

  it("todo bloco gerado vale no contrato de blocos do núcleo", () => {
    for (const page of r.tables.pages!) {
      for (const b of page.blocks) {
        const def = CORE_BLOCKS.find((d) => d.type === b.type)!;
        expect(validateBlock(def, b), `${page.path} ${b.type}`).toEqual([]);
      }
    }
  });

  it("home: hero com o texto personalizado, números, cases, sobre e chamada", () => {
    const home = byPath(r, "/");
    expect(home.title).toEqual({ "pt-BR": "Início", en: V1_TEXTS["navigation.home"]!.en });
    expect(home.seo).toEqual({ title: { "pt-BR": "Bruna Lima · Designer de produto" } });
    const hero = block(home, "hero").fields;
    expect(hero.title).toEqual({ "pt-BR": "Desenho produtos que as pessoas entendem.", en: "I design products people understand." });
    expect(hero.eyebrow).toEqual({ "pt-BR": "Designer de produto", en: "Product designer" });
    expect(hero.subtitle).toEqual({ "pt-BR": V1_TEXTS["home.hero.description"]!.pt, en: V1_TEXTS["home.hero.description"]!.en });
    expect(hero.tags).toEqual([{ label: { "pt-BR": "Figma" } }, { label: { "pt-BR": "Pesquisa" } }]);
    expect(hero.showAvailability).toBe(true);
    expect(hero.primaryCta).toEqual({ label: { "pt-BR": "Ver cases", en: V1_TEXTS["home.hero.ctaCases"]!.en }, href: "#cases" });
    expect(block(home, "cases").fields).toMatchObject({ anchor: "cases", title: { "pt-BR": "Cases em destaque", en: "Featured cases" } });
    expect(block(home, "numeros").fields.items).toEqual([{ value: "10+", label: { "pt-BR": "anos", en: "years" } }, { value: "60", label: { "pt-BR": "projetos" } }]);
    expect(block(home, "texto").fields.body).toEqual({ "pt-BR": "<p>Sou designer há dez anos.</p><p>Gosto de problemas difíceis.</p>", en: "<p>I have been a designer for ten years.</p><p>I like hard problems.</p>" });
    expect(block(home, "cta").fields.title).toEqual({ "pt-BR": V1_TEXTS["home.cta.title"]!.pt, en: V1_TEXTS["home.cta.title"]!.en });
    expect(block(home, "contato").fields).toMatchObject({ anchor: "contato", mode: "wizard" });
    // nenhum texto de exemplo da receita sobrou
    expect(JSON.stringify(home)).not.toContain("Uma frase que diz o que você faz");
    expect(JSON.stringify(home)).not.toContain('"es"');
  });

  it("sobre: texto profissional, princípios, fora do trabalho, galeria e FAQ", () => {
    const sobre = byPath(r, "/sobre");
    expect(sobre.blocks.map((b: { type: string }) => b.type)).toEqual(["texto", "lista-itens", "texto", "galeria", "faq"]);
    expect(block(sobre, "lista-itens").fields.items).toEqual([
      { title: { "pt-BR": "Ouvir primeiro", en: "Listen first" }, body: { "pt-BR": PRINCIPIOS[0]!.description, en: "I understand the problem before designing." } },
      { title: { "pt-BR": "Testar cedo" }, body: { "pt-BR": "Protótipos na mão de quem usa." } },
    ]);
    expect(block(sobre, "texto", 1).fields.body).toEqual({ "pt-BR": "<p>Fora do trabalho, pedalo.</p>", en: "<p>Outside work, I ride bikes.</p>" });
    expect(sobre.blocks.map((b: { id: string }) => b.id)).toEqual(["texto", "lista-itens", "texto-2", "galeria", "faq"]);
  });

  it("páginas de coleção com título e apoio da v1; privacidade vem da receita", () => {
    expect(block(byPath(r, "/portfolio"), "cases").fields).toEqual({ title: { "pt-BR": "Portfólio", en: V1_TEXTS["portfolio.title"]!.en }, intro: { "pt-BR": V1_TEXTS["portfolio.subtitle"]!.pt, en: V1_TEXTS["portfolio.subtitle"]!.en } });
    expect(byPath(r, "/portfolio").blocks[0].source).toEqual({ collection: "projects", sort: "order" });
    expect(block(byPath(r, "/depoimentos"), "depoimentos").fields.allowSubmission).toBe(true);
    const priv = byPath(r, "/privacidade");
    expect(Object.keys(priv.title)).toEqual(["pt-BR", "en"]);
    expect(r.report.pages.find((p) => p.path === "/privacidade")?.blocks).toEqual(["texto"]);
  });

  it("receita de um tema sem algum bloco: o conteúdo dele fica no relatório como fora", () => {
    const recipe: Recipe = [{ path: "/", title: { "pt-BR": "Início" }, blocks: [{ type: "hero" }, { type: "logos-clientes" }, { type: "galeria" }] }];
    const res = run(recipe);
    const home = res.report.pages[0]!;
    expect(home.blocks).toEqual(["hero"]);
    expect(home.dropped).toEqual([
      { type: "logos-clientes", reason: "bloco da linha empresa" },
      { type: "galeria", reason: "a v1 não tinha esta seção nesta página" },
    ]);
  });

  it("bloco sem conteúdo na v1 sai em vez de ficar vazio", () => {
    const tables = v1Export().tables;
    tables.homeContent = tables.homeContent!.filter((h) => h.key !== "home_metrics" && h.key !== "about_text");
    const res = convertV1({ tables, v1: V1_RUBRICA_JSON, theme: "cyberpunk", recipe: CORE_RECIPES.pessoal, now: NOW });
    const home = res.report.pages.find((p) => p.path === "/")!;
    expect(home.dropped.map((d) => d.type)).toEqual(["texto", "numeros"]);
  });
});

describe("textos e o resto", () => {
  const r = run();

  it("textos de interface personalizados → uiTexts; de seção → blocos; sem destino → relatório", () => {
    expect(r.tables.uiTexts).toEqual([
      { key: "hero.available", value: { "pt-BR": "Aceitando projetos", en: "Taking projects" }, updatedAt: NOW },
      { key: "common.readMore", value: { "pt-BR": "Continuar lendo", en: "Keep reading" }, updatedAt: NOW },
    ]);
    expect(r.report.texts.unmapped).toEqual([{ key: "notFound.lines.0", pt: "> nada aqui" }]);
    expect(r.report.texts.sectionKeys).toBe(3);
  });

  it("o que não tem destino vai à parte; descartadas e próprias no relatório", () => {
    // Negócio convertido (migrate.business.test.ts): sobra o depoimento em vídeo e a versão ilegível.
    expect(Object.keys(r.pending).sort()).toEqual(["proposalVersions", "testimonialSubmissions"]);
    expect(r.report.pending.map((p) => [p.table, p.count])).toEqual([["testimonialSubmissions", 1], ["proposalVersions", 1]]);
    expect(r.report.dropped.map((d) => d.table)).toEqual(expect.arrayContaining(["authSessions", "deployStatus", "rateLimitAttempts", "homeContent", "siteTexts"]));
    expect(r.report.unknownTables).toEqual([{ table: "newsletter", count: 1 }]);
    expect(r.report.warnings.join(" ")).toMatch(/newsletter/);
  });

  it("é determinística e não muda a entrada", () => {
    const input = v1Export();
    const copy = JSON.parse(JSON.stringify(input.tables));
    const a = convertV1({ tables: input.tables, v1: V1_RUBRICA_JSON, theme: "cyberpunk", recipe: CORE_RECIPES.pessoal, now: NOW });
    const b = convertV1({ tables: input.tables, v1: V1_RUBRICA_JSON, theme: "cyberpunk", recipe: CORE_RECIPES.pessoal, now: NOW });
    expect(a).toEqual(b);
    expect(input.tables).toEqual(copy);
  });
});
