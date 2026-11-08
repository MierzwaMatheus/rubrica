/**
 * Export fictício de um site da v1 (1.13.1), no formato do `npx convex export`: as
 * tabelas do schema da v1 com dados inventados (a "Bruna Lima", designer). Cobre os
 * casos que a conversão precisa tratar: traduções, imagens da biblioteca e só por URL,
 * case completo, períodos de currículo variados, plugins ligados e desligados, textos
 * personalizados (de seção, de interface e sem destino), tabelas pendentes, descartadas
 * e uma tabela própria do projeto.
 */
import type { Snapshot } from "../../src/migrate/snapshot";

const T0 = 1_700_000_000_000;
let n = 0;
const id = (table: string) => `${table.slice(0, 3)}${String(++n).padStart(4, "0")}xyzexemplo`;
const doc = (table: string, fields: Record<string, unknown>) => ({ _id: id(table), _creationTime: T0 + n, ...fields });

const ana = doc("users", { email: "bruna@exemplo.dev", name: "Bruna Lima" });
const editor = doc("users", { email: "edu@exemplo.dev", name: "Edu" });
const storage = [doc("_storage", { sha256: "a", size: 3, contentType: "image/png" }), doc("_storage", { sha256: "b", size: 3, contentType: "image/png" }), doc("_storage", { sha256: "c", size: 3, contentType: "image/jpeg" })];
const folder = doc("imageFolders", { name: "blog", path: "/blog", createdAt: T0 });
const img = (i: number, name: string, extra: Record<string, unknown> = {}) =>
  doc("imageMetadata", { storageId: storage[i]!._id, displayName: name, altText: `Imagem ${name}`, width: 1200, height: 630, fileSize: 3, mimeType: "image/png", createdAt: T0, createdBy: ana._id, ...extra });
const capa = img(0, "capa-post", { folderId: folder._id });
const projetoA = img(1, "projeto-a");
const projetoB = img(2, "projeto-b");

export const V1_RUBRICA_JSON = {
  version: "1.13.1",
  layout: "cyberpunk",
  theme: "neon",
  fontSans: "Chakra Petch",
  fontMono: "JetBrains Mono",
  colorMode: "dark" as const,
  colorModeToggle: false,
  texture: "none",
  plugins: {},
  identity: { siteName: "Bruna Lima", siteUrl: "https://brunalima.design", siteDescription: "Designer de produto", authorName: "Bruna Lima", authorEmail: "", twitterHandle: "brunalima", lang: "pt-BR" },
};

export const PRINCIPIOS = [
  { title: "Ouvir primeiro", description: "Entendo o problema antes de desenhar.", titleTranslations: { ptBR: "Ouvir primeiro", enUS: "Listen first" }, descriptionTranslations: { ptBR: "Entendo o problema antes de desenhar.", enUS: "I understand the problem before designing." } },
  { title: "Testar cedo", description: "Protótipos na mão de quem usa.", titleTranslations: { ptBR: "Testar cedo" } },
];

export function v1Export(): Snapshot {
  const tables: Snapshot["tables"] = {
    users: [ana, editor],
    authAccounts: [doc("authAccounts", { userId: ana._id, provider: "password", providerAccountId: "bruna@exemplo.dev", secret: "hash-ficticio" })],
    authSessions: [doc("authSessions", { userId: ana._id, expirationTime: T0 })],
    userRoles: [doc("userRoles", { userId: ana._id, role: "root", createdAt: T0 }), doc("userRoles", { userId: editor._id, role: "blog-editor", createdAt: T0, createdBy: ana._id })],
    imageFolders: [folder],
    imageMetadata: [capa, projetoA, projetoB],
    posts: [
      doc("posts", {
        title: "Como desenho sistemas",
        titleTranslations: { ptBR: "Como desenho sistemas", enUS: "How I design systems" },
        subtitle: "Um método em cinco passos",
        subtitleTranslations: { ptBR: "Um método em cinco passos", enUS: "A five-step method" },
        slug: "como-desenho-sistemas",
        content: "<p>Texto do post.</p>",
        contentTranslations: { ptBR: "<p>Texto do post.</p>", enUS: "<p>Post body.</p>" },
        imageId: capa._id,
        imageUrl: "https://exemplo-123.convex.cloud/api/storage/capa",
        seoTitle: "Sistemas de design na prática",
        tags: ["design", "processo"],
        featured: true,
        status: "published",
        readTime: "5 min",
        publishedAt: T0 + 10,
        createdAt: T0,
        authorId: ana._id,
      }),
      doc("posts", { title: "Rascunho", slug: "rascunho", content: "<p>...</p>", tags: [], featured: false, status: "draft", createdAt: T0 }),
      doc("posts", { title: "Apagado", slug: "apagado", content: "<p>x</p>", tags: [], featured: false, status: "published", publishedAt: T0, createdAt: T0, deletedAt: T0 + 5, deletedBy: ana._id }),
    ],
    projects: [
      doc("projects", {
        title: "App de agendamento",
        titleTranslations: { ptBR: "App de agendamento", enUS: "Booking app" },
        description: "Redesenho do fluxo de agendamento.",
        descriptionTranslations: { ptBR: "Redesenho do fluxo de agendamento.", enUS: "Booking flow redesign." },
        longDescription: "Primeiro parágrafo.\n\nSegundo parágrafo.",
        tags: ["ux", "mobile"],
        imageIds: [projetoA._id, projetoB._id],
        externalImageUrls: ["https://imagens.exemplo.dev/extra.png"],
        demoLink: "https://app.exemplo.dev",
        githubLink: "https://github.com/exemplo/app",
        slug: "app-de-agendamento",
        category: "Produto",
        caseStudy: {
          problem: "Muitas faltas.",
          solution: "Lembretes e reagendamento fácil.",
          results: "Menos faltas.",
          role: "Designer líder",
          context: "Agenda em papel.",
          metrics: [{ label: "faltas", value: "−40%" }],
          testimonial: { text: "Mudou a clínica.", author: "Dra. Paula", role: "Diretora" },
        },
        caseStudyTranslations: {
          enUS: { problem: "Many no-shows.", solution: "Reminders and easy rescheduling.", results: "Fewer no-shows.", role: "Lead designer", metrics: [{ label: "no-shows", value: "−40%" }], testimonial: { text: "It changed the clinic.", role: "Director" } },
        },
        orderIndex: 0,
        createdAt: T0,
      }),
      doc("projects", { title: "Identidade visual", description: "Marca para uma padaria.", tags: ["marca"], imageIds: [], externalImageUrls: ["https://imagens.exemplo.dev/marca.png"], category: "Marca", orderIndex: 1, createdAt: T0 }),
    ],
    services: [
      doc("services", { title: "Design de produto", titleTranslations: { ptBR: "Design de produto", enUS: "Product design" }, description: "Do problema ao protótipo.", orderIndex: 0, createdAt: T0 }),
      doc("services", { title: "Pesquisa", description: "Entrevistas e testes.", orderIndex: 1, createdAt: T0 }),
    ],
    testimonials: [
      doc("testimonials", { name: "Carlos", role: "CTO", roleTranslations: { ptBR: "CTO", enUS: "CTO" }, text: "Excelente trabalho.", textTranslations: { ptBR: "Excelente trabalho.", enUS: "Excellent work." }, imageUrl: "https://imagens.exemplo.dev/carlos.png", orderIndex: 0, showOnHome: true, category: "Produto", createdAt: T0 }),
      doc("testimonials", { name: "Joana", role: "PM", text: "Muito cuidadosa.", orderIndex: 1, createdAt: T0 }),
    ],
    homeContent: [
      doc("homeContent", { key: "about_text", value: { ptBR: "Sou designer há dez anos.\n\nGosto de problemas difíceis.", enUS: "I have been a designer for ten years.\n\nI like hard problems." }, createdAt: T0 }),
      doc("homeContent", { key: "availability_status", value: { available: true, label: { ptBR: "Aceitando projetos", enUS: "Taking projects" } }, createdAt: T0 }),
      doc("homeContent", { key: "hero_tags", value: [{ label: "Figma", color: "#f00" }, { label: "Pesquisa", color: "#0f0" }], createdAt: T0 }),
      doc("homeContent", { key: "home_metrics", value: [{ value: "10+", label: "anos", labelTranslations: { ptBR: "anos", enUS: "years" } }, { value: "60", label: "projetos" }], createdAt: T0 }),
      doc("homeContent", { key: "work_principles", value: PRINCIPIOS, createdAt: T0 }),
      doc("homeContent", { key: "contact_wizard_enabled", value: true, createdAt: T0 }),
      doc("homeContent", { key: "plugin:playground:enabled", value: true, createdAt: T0 }),
      doc("homeContent", { key: "plugin:i18n:enabled", value: false, createdAt: T0 }),
      doc("homeContent", { key: "plugin:payments:enabled", value: false, createdAt: T0 }),
    ],
    aboutDailyRoutine: [
      doc("aboutDailyRoutine", { imageId: projetoA._id, description: "Café e rascunhos", descriptionTranslations: { ptBR: "Café e rascunhos", enUS: "Coffee and sketches" }, spanSize: "2x1", displayOrder: 0, createdAt: T0 }),
      doc("aboutDailyRoutine", { imageUrl: "https://imagens.exemplo.dev/bike.png", description: "Bicicleta", spanSize: "1x1", displayOrder: 1, createdAt: T0 }),
    ],
    aboutFaq: [
      doc("aboutFaq", { question: "Trabalha remoto?", questionTranslations: { ptBR: "Trabalha remoto?", enUS: "Do you work remotely?" }, answer: "Sim.", answerTranslations: { ptBR: "Sim.", enUS: "Yes." }, displayOrder: 0, createdAt: T0 }),
      doc("aboutFaq", { question: "Faz freela?", answer: "Às vezes.", displayOrder: 1, createdAt: T0 }),
    ],
    contactInfo: [
      doc("contactInfo", {
        name: "Bruna Lima",
        role: "Designer de produto",
        roleTranslations: { ptBR: "Designer de produto", enUS: "Product designer" },
        email: "contato@brunalima.design",
        showEmail: true,
        phone: "+55 11 90000-0000",
        showPhone: false,
        showBirthDate: false,
        location: "São Paulo",
        showLocation: true,
        avatarStorageId: storage[1]!._id,
        linkedinUrl: "https://linkedin.com/in/brunalima",
        githubUrl: "https://github.com/brunalima",
        proposalIntro: "Olá!",
        createdAt: T0,
      }),
    ],
    siteConfig: [
      doc("siteConfig", { key: "site_name", value: "Bruna Lima", createdAt: T0 }),
      doc("siteConfig", { key: "site_url", value: "https://brunalima.design/", createdAt: T0 }),
      doc("siteConfig", { key: "site_description", value: "Designer de produto em São Paulo.", createdAt: T0 }),
      doc("siteConfig", { key: "seo_home_title", value: "Bruna Lima · Designer de produto", createdAt: T0 }),
      doc("siteConfig", { key: "twitter_handle", value: "brunalima", createdAt: T0 }),
      doc("siteConfig", { key: "og_image_url", value: "https://imagens.exemplo.dev/og.png", createdAt: T0 }),
      // primária mudada no painel (o neon usa outra)
      doc("siteConfig", { key: "theme_primary", value: "#ff3366", createdAt: T0 }),
      doc("siteConfig", { key: "keywords", value: "design, produto", createdAt: T0 }),
    ],
    siteTexts: [
      doc("siteTexts", { key: "home.hero.headline", page: "home", ptBR: "Desenho produtos que as pessoas entendem.", enUS: "I design products people understand." }),
      doc("siteTexts", { key: "home.cases.title", page: "home", ptBR: " Cases em destaque ", enUS: " Featured cases " }),
      doc("siteTexts", { key: "blog.readMore", page: "blog", ptBR: "Continuar lendo", enUS: "Keep reading" }),
      doc("siteTexts", { key: "notFound.lines.0", page: "notFound", ptBR: "> nada aqui", enUS: "> nothing here" }),
      doc("siteTexts", { key: "about.aboutMe.text", page: "about", ptBR: "Fora do trabalho, pedalo.", enUS: "Outside work, I ride bikes." }),
      doc("siteTexts", { key: "admin.home.saveSuccess", page: "admin", ptBR: "Feito!", enUS: "Done!" }),
    ],
    resumeItems: [
      doc("resumeItems", { type: "experience", content: { role: "Designer líder", period: "jan/2020 – atual", company: "Clínica X", description: "Liderança de design." }, contentTranslations: { enUS: { role: "Lead designer", description: "Design leadership." } }, orderIndex: 0, createdAt: T0 }),
      doc("resumeItems", { type: "experience", content: { role: "Designer", period: "verão de 2019", company: "Agência Y", description: "Projetos variados." }, orderIndex: 1, createdAt: T0 }),
      doc("resumeItems", { type: "education", content: { degree: "Design", period: "2014 - 2018", description: "Bacharelado.", institution: "Universidade Z" }, orderIndex: 2, createdAt: T0 }),
      doc("resumeItems", { type: "skill", content: { name: "Figma", level: "Avançado", group: "Ferramentas" }, orderIndex: 3, createdAt: T0 }),
      doc("resumeItems", { type: "soft_skill", content: { text: "Comunicação" }, contentTranslations: { ptBR: "Comunicação", enUS: "Communication" }, orderIndex: 4, createdAt: T0 }),
      doc("resumeItems", { type: "course", content: { text: "Pesquisa com usuários" }, orderIndex: 5, createdAt: T0 }),
      doc("resumeItems", { type: "language", content: { name: "Inglês", level: "Fluente" }, contentTranslations: { ptBR: "Inglês", enUS: "English" }, orderIndex: 6, createdAt: T0 }),
      doc("resumeItems", { type: "volunteer", content: { text: "Mentoria em ONG" }, orderIndex: 7, createdAt: T0 }),
      doc("resumeItems", { type: "experience", content: { role: "Estágio", period: "03/2016 - 12/2017", company: "Estúdio W", description: "" }, orderIndex: 8, createdAt: T0, deletedAt: T0 + 1 }),
    ],
    proposals: [doc("proposals", { userId: ana._id, clientName: "Padaria", slug: "padaria", title: "Proposta", objective: "Marca", scope: [], timeline: [], deliveryDate: "2026-01-01", investmentValue: 1000, paymentMethods: [], conditions: [], rescissionPolicy: "", version: 1, isAccepted: false, expiresAt: T0, createdAt: T0 })],
    contactRequests: [doc("contactRequests", { type: "project", status: "new", answers: {}, contactInfo: { name: "Fulano", email: "fulano@exemplo.dev" }, createdAt: T0, updatedAt: T0 })],
    deployStatus: [doc("deployStatus", { pendingChanges: false, updatedAt: T0 })],
    rateLimitAttempts: [doc("rateLimitAttempts", { key: "k", identifier: "i", type: "login", attemptCount: 1, firstAttemptAt: T0, lastAttemptAt: T0, expiresAt: T0 })],
    auditLog: [doc("auditLog", { eventType: "admin.update", actorType: "user", actorId: ana._id, success: true, createdAt: T0, expiresAt: T0 + 1 })],
    newsletter: [doc("newsletter", { email: "leitor@exemplo.dev" })],
  };
  const names = Object.keys(tables);
  const tableNumbers: Record<string, number> = Object.fromEntries(names.map((name, i) => [name, 10001 + i]));
  tableNumbers._storage = 10500;
  return {
    tables,
    tableNumbers,
    storage: {
      "_storage/documents.jsonl": new TextEncoder().encode(storage.map((s) => JSON.stringify(s)).join("\n") + "\n"),
      ...Object.fromEntries(storage.map((s, i) => [`_storage/${s._id}`, new Uint8Array([1, 2, i])])),
    },
  };
}

export const IDS = { ana: ana._id, editor: editor._id, capa: capa._id, storage: storage.map((s) => s._id) };
