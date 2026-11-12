import { describe, expect, it } from "vitest";
import { CORE_RECIPES, defaultUiText, validateBlock, type Recipe } from "@rubrica/core";
import { CORE_BLOCKS } from "@rubrica/core/blocks";
import { convertV1, loc, mediaFolderPath, parsePeriod, sameInBoth, slugify, toHtml, v1FullTitle, v1Navigation, V1_TEXTS, UI_TEXT_MAP } from "../src/migrate/convert";
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

  it("títulos de SEO como a v1 mostrava", () => {
    expect(v1FullTitle({ "pt-BR": "Sobre Mim", en: "About Me" }, "Matheus Mierzwa")).toEqual({ "pt-BR": "Sobre Mim | Matheus Mierzwa", en: "About Me | Matheus Mierzwa" });
    expect(v1FullTitle({ "pt-BR": "Matheus Mierzwa | Lead" }, "Matheus Mierzwa")).toEqual({ "pt-BR": "Matheus Mierzwa | Lead" });
    expect(v1FullTitle({ "pt-BR": "Blog" }, undefined)).toEqual({ "pt-BR": "Blog" });
    expect(sameInBoth({ "pt-BR": "Matheus Mierzwa | Lead" })).toEqual({ "pt-BR": "Matheus Mierzwa | Lead", en: "Matheus Mierzwa | Lead" });
  });

  it("períodos do currículo", () => {
    expect(parsePeriod("jan/2020 – atual")).toEqual({ start: "2020-01", ok: true });
    expect(parsePeriod("2014 - 2018")).toEqual({ start: "2014", end: "2018", ok: true });
    // Formatos de um portfólio real (mmlo): mês e ano com hífen, anos colados.
    expect(parsePeriod("Jan-2025 - atual")).toEqual({ start: "2025-01", ok: true });
    expect(parsePeriod("Nov-2024 - Jan-2025")).toEqual({ start: "2024-11", end: "2025-01", ok: true });
    expect(parsePeriod("2022 - Nov-2024")).toEqual({ start: "2022", end: "2024-11", ok: true });
    expect(parsePeriod("2015-2017")).toEqual({ start: "2015", end: "2017", ok: true });
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
    expect(titles).toEqual(["Antes", "O Problema", "A Solução", "Os Resultados", "Depoimento"]);
    const sections = app!.sections as { body: Record<string, string> }[];
    expect(sections[1]!.body).toEqual({ "pt-BR": "<p>Muitas faltas.</p>", en: "<p>Many no-shows.</p>" });
    expect(sections[0]!.body).toEqual({ "pt-BR": "<p>Agenda em papel.</p>" });
    expect(sections[4]!.body.en).toContain("It changed the clinic.");
    // Números do case num campo próprio, com o ícone da v1 e o inglês pela posição (sem par, só pt).
    expect(app!.metrics).toEqual([
      { value: "−40%", label: { "pt-BR": "faltas", en: "no-shows" }, icon: "TrendingDown" },
      { value: "12", label: { "pt-BR": "clínicas" } },
    ]);
    expect(app!.cover).toMatchObject({ storageId: IDS.storage[1] });
    expect((app!.gallery as unknown[]).length).toBe(2);
    expect(app!.links).toEqual([
      { label: { "pt-BR": "Demo ao Vivo", en: "Live Demo" }, href: "https://app.exemplo.dev" },
      { label: { "pt-BR": "Código", en: "Code" }, href: "https://github.com/exemplo/app" },
    ]);
    expect(app!.tags).toEqual(["ux", "mobile"]);
    expect(app!.category).toEqual({ "pt-BR": "Produto", en: "Product" });
    expect(marca!.slug).toBe("identidade-visual");
    expect(marca!.featured).toBeUndefined();
    expect(marca!.cover).toEqual({ url: "https://imagens.exemplo.dev/marca.png" });
    expect(marca!.category).toEqual({ "pt-BR": "Marca" });
    expect(r.report.warnings.join(" ")).toMatch(/Identidade visual.*não tinha slug/);
  });

  it("serviços, depoimentos, FAQ e dia a dia", () => {
    expect(r.tables.services![0]).toMatchObject({ title: { "pt-BR": "Design de produto", en: "Product design" }, order: 0, published: true });
    expect(r.tables.testimonials![0]).toMatchObject({ quote: { "pt-BR": "Excelente trabalho.", en: "Excellent work." }, author: "Carlos", featured: true, tags: ["Produto"], avatar: { url: "https://imagens.exemplo.dev/carlos.png" } });
    expect(r.tables.testimonials![1]!.featured).toBeUndefined();
    expect(r.tables.faq![0]).toMatchObject({ question: { "pt-BR": "Trabalha remoto?", en: "Do you work remotely?" }, answer: { "pt-BR": "Sim.", en: "Yes." }, order: 0 });
    // O tamanho no mosaico da v1 (spanSize) vira o span do item; 1x1 é o padrão e não vai.
    expect(r.tables.routine![0]).toMatchObject({ title: { "pt-BR": "Café e rascunhos", en: "Coffee and sketches" }, image: { storageId: IDS.storage[1] }, span: "2x1" });
    expect(r.tables.routine![1]).not.toHaveProperty("span");
    expect(r.report.warnings.join(" ")).not.toMatch(/tamanho de cada foto/);
  });

  it("currículo: tipos da v1 → da v2, períodos e o que não deu para entender", () => {
    const items = r.tables.resumeItems!;
    expect(items.map((i) => i.kind)).toEqual(["experience", "experience", "education", "skill", "soft-skill", "certification", "language", "volunteer", "experience"]);
    expect(items[0]).toMatchObject({ title: { "pt-BR": "Designer líder", en: "Lead designer" }, organization: "Clínica X", start: "2020-01" });
    expect(items[0]!.end).toBeUndefined();
    expect(items[1]!.start).toBeUndefined();
    expect(items[2]).toMatchObject({ organization: "Universidade Z", start: "2014", end: "2018" });
    expect(items[3]).toMatchObject({ title: { "pt-BR": "Figma" }, description: { "pt-BR": "Avançado" }, group: { "pt-BR": "Ferramentas" }, tags: ["Ferramentas"] });
    expect(items[4]).toMatchObject({ title: { "pt-BR": "Comunicação", en: "Communication" } });
    expect(items[4]!.tags).toBeUndefined();
    expect(items[6]).toMatchObject({ title: { "pt-BR": "Inglês", en: "English" }, description: { "pt-BR": "Fluente" } });
    expect(items[7]).toMatchObject({ title: { "pt-BR": "Mentoria em ONG" } });
    expect(items[7]!.tags).toBeUndefined();
    expect(items[8]!.deletedAt).toBeDefined();
    expect(r.report.warnings.join(" ")).toMatch(/verão de 2019/);
  });

  it("mídia: pasta da v1 (sem barra) vira o caminho normalizado da v2", () => {
    expect(mediaFolderPath("portfolio/toca")).toBe("/portfolio/toca");
    expect(mediaFolderPath("sobre_mim")).toBe("/sobre_mim");
    expect(mediaFolderPath("/blog/")).toBe("/blog");
    expect(mediaFolderPath("fotos & vídeos/2026.1")).toBe("/fotos - vídeos/2026-1");
    expect(mediaFolderPath("a/b/c/d/e/f/g")).toBe("/a/b/c/d/e/f");
    expect(mediaFolderPath(undefined)).toBe("/");
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
      appearance: { colorMode: "dark", colorToggle: false, scheme: "neon", tokens: { "rb-accent": "#ff3366" }, fontSans: "Chakra Petch", fontMono: "JetBrains Mono", texture: "none" },
      twitterHandle: "brunalima",
      ogImage: { url: "https://imagens.exemplo.dev/og.png" },
    });
  });

  it("mantém os caminhos da v1 (/blog e /portfolio) explícitos", () => {
    expect(settings.paths).toEqual({ posts: "/blog", projects: "/portfolio" });
  });

  it("textura da v1 vai para a aparência; desconhecida fica de fora", () => {
    const withTexture = (texture: string) => convertV1({ tables: v1Export().tables, v1: { ...V1_RUBRICA_JSON, texture }, theme: "poster", recipe: CORE_RECIPES.pessoal, now: NOW }).tables.siteSettings![0]!.appearance as Record<string, unknown>;
    expect(withTexture("grain").texture).toBe("grain");
    expect(withTexture("lava")).not.toHaveProperty("texture");
  });

  it("foto da pessoa com URL do storage da v1 aponta para o arquivo importado; telefone vai para a sidebar", () => {
    const { tables } = v1Export();
    tables.contactInfo = [{ ...tables.contactInfo![0]!, avatarStorageId: undefined, avatarUrl: "https://velho-123.convex.cloud/api/storage/8003b0d9-bb6a-4759-beb6-caf538ade1f7", phone: "+55 11 98823-2537", showPhone: true }];
    const storage = [{ _id: "kg2foto", internalId: "8003b0d9-bb6a-4759-beb6-caf538ade1f7" }];
    const person = convertV1({ tables, storage, v1: V1_RUBRICA_JSON, theme: "cyberpunk", recipe: CORE_RECIPES.pessoal, now: NOW }).tables.siteSettings![0]!.person as Record<string, unknown>;
    expect(person.photo).toEqual({ url: "", storageId: "kg2foto" });
    expect(person.whatsapp).toBe("+55 11 98823-2537");
    // Sem o arquivo no export, a URL antiga fica (melhor que nada).
    const semArquivo = convertV1({ tables, v1: V1_RUBRICA_JSON, theme: "cyberpunk", recipe: CORE_RECIPES.pessoal, now: NOW }).tables.siteSettings![0]!.person as Record<string, unknown>;
    expect((semArquivo.photo as { url: string }).url).toContain("/api/storage/");
  });

  it("menu na ordem da sidebar da v1, sem as páginas que não estavam nele", () => {
    const items = ["/", "/sobre", "/curriculo", "/portfolio", "/blog", "/depoimentos"].map((href) => ({ href, label: { "pt-BR": href } }));
    expect(v1Navigation(items).map((n) => n.href)).toEqual(["/", "/curriculo", "/portfolio", "/sobre", "/blog"]);
    const nav = run().tables.siteSettings![0]!.navigation as { href: string }[];
    expect(nav.map((n) => n.href)).not.toContain("/depoimentos");
  });

  it("o selo do hero é o home.greeting da v1 (whoami), não o cargo", () => {
    const home = (run().tables.pages as { path: string; blocks: { type: string; fields: Record<string, unknown> }[] }[]).find((p) => p.path === "/")!;
    expect(home.blocks.find((b) => b.type === "hero")!.fields.eyebrow).toEqual({ "pt-BR": "whoami", en: "whoami" });
  });

  it("pessoa e redes do contactInfo", () => {
    expect(settings.person).toEqual({ name: "Bruna Lima", jobTitle: { "pt-BR": "Designer de produto", en: "Product designer" }, email: "contato@brunalima.design", photo: { url: "", storageId: IDS.storage[1] } });
    expect(settings.social).toEqual([{ network: "github", url: "https://github.com/brunalima" }, { network: "linkedin", url: "https://linkedin.com/in/brunalima" }]);
  });

  it("WhatsApp do contactInfo (com Mostrar ligado) vira o WhatsApp do site, sem botão flutuante", () => {
    const withPhone = (phone: string, showPhone = true) => {
      const tables = v1Export().tables;
      tables.contactInfo = [{ ...tables.contactInfo![0]!, phone, showPhone }];
      const r = convertV1({ tables, v1: V1_RUBRICA_JSON, theme: "cyberpunk", recipe: CORE_RECIPES.pessoal, now: NOW });
      return { whatsapp: r.tables.siteSettings![0]!.whatsapp, warnings: r.report.warnings };
    };
    expect(settings.whatsapp).toBeUndefined(); // o fixture esconde o telefone
    expect(withPhone("+55 11 90000-0000").whatsapp).toEqual({ number: "5511900000000", floating: false });
    const national = withPhone("(11) 90000-0000");
    expect(national.whatsapp).toEqual({ number: "5511900000000", floating: false });
    expect(national.warnings.join(" ")).toContain("sem DDI");
    const bad = withPhone("ramal 12");
    expect(bad.whatsapp).toBeUndefined();
    expect(bad.warnings.join(" ")).toContain("ficou de fora");
    expect(withPhone("+55 11 90000-0000", false).whatsapp).toBeUndefined();
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
    // Ordem da sidebar da v1; depoimentos não estava no menu.
    expect(settings.navigation.map((n: { href: string }) => n.href)).toEqual(["/", "/curriculo", "/portfolio", "/sobre", "/blog"]);
    expect(settings.navigation[3].label).toEqual({ "pt-BR": "Sobre Mim", en: V1_TEXTS["navigation.about"]!.en });
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
    expect(home.seo).toEqual({ title: { "pt-BR": "Bruna Lima · Designer de produto", en: "Bruna Lima · Designer de produto" } });
    const hero = block(home, "hero").fields;
    expect(hero.title).toEqual({ "pt-BR": "Desenho produtos que as pessoas entendem.", en: "I design products people understand." });
    // O selo é o home.greeting da v1; o cargo fica na pessoa.
    expect(hero.eyebrow).toEqual({ "pt-BR": "whoami", en: "whoami" });
    expect(hero.subtitle).toEqual({ "pt-BR": V1_TEXTS["home.hero.description"]!.pt, en: V1_TEXTS["home.hero.description"]!.en });
    expect(hero.tags).toEqual([{ label: { "pt-BR": "Figma" } }, { label: { "pt-BR": "Pesquisa" } }]);
    expect(hero.showAvailability).toBe(true);
    expect(hero.primaryCta).toEqual({ label: { "pt-BR": "Ver cases", en: V1_TEXTS["home.hero.ctaCases"]!.en }, href: "#cases" });
    expect(block(home, "cases").fields).toMatchObject({ anchor: "cases", title: { "pt-BR": "Cases em destaque", en: "Featured cases" } });
    expect(block(home, "numeros").fields.items).toEqual([{ value: "10+", label: { "pt-BR": "anos", en: "years" } }, { value: "60", label: { "pt-BR": "projetos" } }]);
    expect(block(home, "texto").fields.body).toEqual({ "pt-BR": "<p>Sou designer há dez anos.</p><p>Gosto de problemas difíceis.</p>", en: "<p>I have been a designer for ten years.</p><p>I like hard problems.</p>" });
    expect(block(home, "cta").fields.title).toEqual({ "pt-BR": V1_TEXTS["home.cta.title"]!.pt, en: V1_TEXTS["home.cta.title"]!.en });
    expect(block(home, "contato").fields).toMatchObject({ anchor: "contato", mode: "wizard" });
    // "Ver todos os depoimentos" da v1 vira o link do bloco, para a página de depoimentos.
    expect(block(home, "depoimentos").fields.cta).toEqual({ label: { "pt-BR": V1_TEXTS["testimonials.viewAll"]!.pt, en: V1_TEXTS["testimonials.viewAll"]!.en }, href: "/depoimentos" });
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

  it("currículo da receita do núcleo: título e apoio no bloco do currículo", () => {
    const cv = byPath(r, "/curriculo");
    expect(cv.blocks.map((b: { type: string }) => b.type)).toEqual(["curriculo"]);
    expect(block(cv, "curriculo").fields).toMatchObject({ title: { "pt-BR": V1_TEXTS["resume.title"]!.pt }, showDownload: true });
  });

  it("currículo com cabeçalho (receita do padrao/cyberpunk): título, resumo com números em negrito, números e o currículo sem título", () => {
    const recipe: Recipe = [
      {
        path: "/curriculo",
        title: { "pt-BR": "Currículo" },
        blocks: [
          { type: "hero", variant: "pagina", fields: { title: { "pt-BR": "Exemplo" } } },
          { type: "texto", fields: { body: { "pt-BR": "<p>Exemplo</p>" } } },
          { type: "numeros", fields: { items: [{ value: "1", label: { "pt-BR": "x" } }] } },
          { type: "curriculo", fields: { showDownload: true } },
        ],
      },
    ];
    const tables = v1Export().tables;
    tables.homeContent = tables.homeContent!.map((h) =>
      h.key === "about_text" ? { ...h, value: { ptBR: "Em 4 meses, entreguei 50 skills para 8 áreas em 2026 & cia.\n\nOutro parágrafo.", enUS: "In 4 months I shipped 50 skills.\n\nMore." } } : h,
    );
    const cv = convertV1({ tables, v1: V1_RUBRICA_JSON, theme: "cyberpunk", recipe, now: NOW }).tables.pages!.find((p) => p.path === "/curriculo")!;
    expect(cv.blocks.map((b: { type: string }) => b.type)).toEqual(["hero", "texto", "numeros", "curriculo"]);
    expect(block(cv, "hero")).toMatchObject({ variant: "pagina", fields: { title: { "pt-BR": V1_TEXTS["resume.title"]!.pt, en: V1_TEXTS["resume.title"]!.en }, subtitle: { "pt-BR": V1_TEXTS["resume.subtitle"]!.pt } } });
    // Só o 1º parágrafo; números com unidade em negrito (o ano solto não), texto escapado.
    expect(block(cv, "texto").fields.body).toEqual({
      "pt-BR": "<p>Em <strong>4 meses</strong>, entreguei <strong>50 skills</strong> para <strong>8 áreas</strong> em 2026 &amp; cia.</p>",
      en: "<p>In <strong>4 months</strong> I shipped <strong>50 skills</strong>.</p>",
    });
    expect(block(cv, "texto").fields.title).toBeUndefined();
    expect(block(cv, "numeros").fields.items).toEqual([{ value: "10+", label: { "pt-BR": "anos", en: "years" } }, { value: "60", label: { "pt-BR": "projetos" } }]);
    expect(block(cv, "curriculo").fields).toEqual({ showDownload: true });
  });

  it("variação e bloco escondido vêm da receita do tema (contato só na janela, texto pessoal, depoimentos por categoria)", () => {
    const recipe: Recipe = [
      { path: "/", title: { "pt-BR": "Início" }, blocks: [{ type: "hero" }, { type: "contato", visible: false }] },
      { path: "/sobre", title: { "pt-BR": "Sobre" }, blocks: [{ type: "texto" }, { type: "texto", variant: "pessoal" }] },
      { path: "/depoimentos", title: { "pt-BR": "Depoimentos" }, blocks: [{ type: "hero", variant: "pagina" }, { type: "depoimentos", variant: "categorias" }] },
    ];
    const res = run(recipe);
    const home = byPath(res, "/");
    expect(home.blocks.map((b: { type: string; visible: boolean }) => [b.type, b.visible])).toEqual([["hero", true], ["contato", false]]);
    expect(byPath(res, "/sobre").blocks.map((b: { variant?: string }) => b.variant)).toEqual([undefined, "pessoal"]);
    expect(byPath(res, "/depoimentos").blocks[1]).toMatchObject({ type: "depoimentos", variant: "categorias" });
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

  it("depoimentos da home: destacados (showOnHome); sem nenhum marcado, todos, como na v1", () => {
    // O export tem um "mostrar na home": o bloco fica com a fonte padrão (só destacados).
    expect(block(byPath(run(), "/"), "depoimentos").source).toBeUndefined();
    const tables = v1Export().tables;
    tables.testimonials = tables.testimonials!.map((d) => ({ ...d, showOnHome: false }));
    const r = convertV1({ tables, v1: V1_RUBRICA_JSON, theme: "cyberpunk", recipe: CORE_RECIPES.pessoal, now: NOW });
    const source = block(byPath(r, "/"), "depoimentos").source as Record<string, unknown>;
    expect(source).toMatchObject({ collection: "testimonials" });
    expect(source.featured).toBeUndefined();
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
    expect(r.tables.uiTexts!.filter((t) => !/^(form\.|contactForm\.)/.test(String(t.key)))).toEqual([
      { key: "hero.available", value: { "pt-BR": "Aceitando projetos", en: "Taking projects" }, updatedAt: NOW },
      { key: "common.readMore", value: { "pt-BR": "Continuar lendo", en: "Keep reading" }, updatedAt: NOW },
      // Rótulos do currículo da v1 que diferem do padrão da v2 vêm mesmo sem personalização.
      ...[
        ["resume.experience", "Experiência Profissional", "Professional Experience"],
        ["resume.education", "Formação Acadêmica", "Academic Education"],
        ["resume.skill", "Habilidades", "Skills"],
        ["resume.soft-skill", "Soft Skills", "Soft Skills"],
        ["resume.certification", "Cursos e Certificações", "Courses and Certifications"],
        ["resume.volunteer", "Voluntariado", "Volunteer Work"],
        ["resume.download", "Baixar CV (PDF)", "Download CV (PDF)"],
        ["resume.showOlder", "ver experiências anteriores ({count})", "show earlier experience ({count})"],
        ["resume.hideOlder", "ocultar experiências anteriores", "hide earlier experience"],
        ["sidebar.talk", "Fale comigo", "Contact me"],
        ["testimonialForm.open", "Deixar meu depoimento", "Leave my testimonial"],
        ["case.gallery", "Screenshots", "Screenshots"],
        ["blog.filter", "Filtrar por tags", "Filter by tags"],
        ["case.metrics", "Resultados em Números", "Results by the Numbers"],
        ["notFound.home", "voltar ao início", "back to home"],
        ["blog.featured", "Em Destaque", "Featured"],
        ["blog.back", "Voltar para o Blog", "Back to Blog"],
      ].map(([key, pt, en]) => ({ key, value: { "pt-BR": pt, en }, updatedAt: NOW })),
    ]);
    expect(r.report.texts.unmapped).toEqual([{ key: "notFound.lines.0", pt: "> nada aqui" }]);
    expect(r.report.texts.sectionKeys).toBe(3);
  });

  it("assistente de contato da v1: janela com os quatro fluxos e os textos dele em uiTexts", () => {
    const contato = block(byPath(r, "/"), "contato");
    expect(contato.fields).toMatchObject({
      anchor: "contato",
      presentation: "dialog",
      mode: "wizard",
      eyebrow: { "pt-BR": "portfolio / contato", en: "portfolio / contato" },
      title: { "pt-BR": V1_TEXTS["contactWizard.title"]!.pt, en: V1_TEXTS["contactWizard.title"]!.en },
      intro: { "pt-BR": V1_TEXTS["contactWizard.subtitle"]!.pt, en: V1_TEXTS["contactWizard.subtitle"]!.en },
    });
    const flows = contato.fields.flows;
    expect(flows.map((f: { id: string; emoji: string }) => `${f.emoji} ${f.id}`)).toEqual(["💼 project", "🧑‍💼 job", "🤝 networking", "💬 feedback"]);
    const [project, job] = flows;
    expect(project.label).toEqual({ "pt-BR": "Tenho um projeto", en: "I have a project" });
    expect(project.steps.map((st: { kind: string; key?: string }) => `${st.kind}:${st.key ?? ""}`)).toEqual(["choice:projectType", "choice:timeline", "choice:budget", "textarea:description", "contact:"]);
    expect(project.steps[0].options["pt-BR"].split("\n")).toEqual(["Web App / SaaS", "Mobile", "Landing Page", "Sistema Interno", "Consultoria Técnica", "Outro"]);
    expect(project.steps[0].options.en.split("\n")).toHaveLength(6);
    expect(project.steps[4]).toEqual({ kind: "contact", title: { "pt-BR": "Seus dados de contato", en: "Your contact details" }, askPhone: true, askLinkedin: true });
    expect(job.steps[3]).toMatchObject({ kind: "text", key: "jobCompany,jobRole", placeholder: { "pt-BR": "Nome da empresa\nTítulo do cargo" } });
    // O bloco passa na validação do catálogo.
    expect(validateBlock(CORE_BLOCKS.find((b) => b.type === "contato")!, { fields: contato.fields })).toEqual([]);
    const ui = Object.fromEntries(r.tables.uiTexts!.map((t) => [t.key, t.value]));
    expect(ui["form.step"]).toEqual({ "pt-BR": "Passo {current} de {total}", en: "Step {current} of {total}" });
    expect(ui["form.next"]).toEqual({ "pt-BR": "Próximo", en: "Next" });
    expect(ui["contactForm.summary"]).toEqual({ "pt-BR": "Revise e envie", en: "Review and send" });
    expect(ui["contactForm.close"]).toEqual({ "pt-BR": "Fechar", en: V1_TEXTS["common.close"]!.en });
  });

  it("assistente desligado: o contato fica só com os canais, sem textos do assistente", () => {
    const input = v1Export();
    input.tables.homeContent = [...(input.tables.homeContent ?? []), { _id: "hc-off", key: "contact_wizard_enabled", value: false }];
    const off = convertV1({ tables: input.tables, v1: V1_RUBRICA_JSON, theme: "cyberpunk", recipe: CORE_RECIPES.pessoal, now: NOW });
    expect(block(byPath(off, "/"), "contato").fields).toMatchObject({ mode: "channels" });
    expect(block(byPath(off, "/"), "contato").fields.presentation).toBeUndefined();
    expect(off.tables.uiTexts!.map((t) => t.key)).not.toContain("form.step");
  });

  it("o blog da v1 vem com destaques, busca e filtro por etiquetas", () => {
    const blog = r.tables.pages!.find((p) => p.path === "/blog")!;
    const posts = (blog.blocks as { type: string; fields: Record<string, unknown> }[]).find((b) => b.type === "posts-recentes")!;
    expect(posts.fields).toMatchObject({ showTagFilter: true, showSearch: true, showFeatured: true });
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

describe("blocos das páginas", () => {
  it("todo bloco tem fields (o schema exige, mesmo vazio)", () => {
    for (const page of run().tables.pages as { blocks: { fields?: unknown }[] }[]) for (const b of page.blocks) expect(b.fields).toBeDefined();
  });
});

describe("textos do portfólio e do case da v1", () => {
  it("cada chave da v1 aponta para um texto que o núcleo conhece", () => {
    for (const v2 of Object.values(UI_TEXT_MAP)) expect(defaultUiText(v2, "pt-BR"), v2).toBeDefined();
  });

  it("personalizados na v1 vão para as chaves do case", () => {
    const { tables } = v1Export();
    tables.siteTexts = [
      ...(tables.siteTexts ?? []),
      { _id: "st-cta", key: "portfolio.ctaTitle", page: "portfolio", ptBR: "Bora fazer algo assim?", enUS: "Want something like this?" },
      { _id: "st-det", key: "portfolio.details", page: "portfolio", ptBR: "$ ls detalhes", enUS: "$ ls details" },
    ];
    const out = convertV1({ tables, v1: V1_RUBRICA_JSON, theme: "cyberpunk", recipe: CORE_RECIPES.pessoal, now: NOW }).tables.uiTexts!;
    expect(out.find((t) => t.key === "case.ctaTitle")?.value).toEqual({ "pt-BR": "Bora fazer algo assim?", en: "Want something like this?" });
    expect(out.find((t) => t.key === "case.details")?.value).toEqual({ "pt-BR": "$ ls detalhes", en: "$ ls details" });
  });
});
