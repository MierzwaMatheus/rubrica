/**
 * Tema desktop: o layout "Desktop Retrô" da v1. O site é um sistema operacional de 1998:
 * barra de menu no topo, ícones na área de trabalho e cada bloco é uma janela, com barra
 * de título listrada, caixa de fechar decorativa e sombra dura.
 *
 * Todos os blocos do catálogo têm componente próprio (na v1 cada seção virava um
 * programa diferente: Leia-me, Números.app, pasta, Finder, caixa de entrada, Notas,
 * Ajuda, Painel de Controle…). Um bloco que o núcleo acrescente depois cai no padrão do
 * núcleo, e o CSS do tema o enquadra numa janela genérica.
 */
import { CORE_RECIPES, defineTheme, type Recipe, type RecipePage } from "@rubrica/core";
import fonts from "./fonts.json";
import { CtaBlock, HeroBlock, ListaItensBlock, NumerosBlock, TextoBlock } from "./blocks/basic";
import { CasesBlock, DepoimentosBlock, FaqBlock, GaleriaBlock, PostsRecentesBlock, ServicosBlock } from "./blocks/collections";
import { ContatoBlock, EquipeBlock, LocalizacaoBlock, LogosClientesBlock, PrecosBlock } from "./blocks/company";
import { CurriculoBlock } from "./blocks/resume";
import { DesktopShell } from "./shell";
import { DesktopCase, DesktopNotFound, DesktopPost } from "./templates";
import { DESKTOP_TEXTS } from "./texts";

export { DesktopShell } from "./shell";
export { Window, Cluster } from "./window";

const tr = (ptBR: string, en: string, es: string) => ({ "pt-BR": ptBR, en, es });

/**
 * Home pessoal na ordem da v1: Leia-me, Números.app, cases, Sobre.txt, o que eu faço,
 * a caixa de entrada, a caixa de diálogo "Novo projeto?" e, no fim, o contato (na v1 o
 * contato abria o assistente num modal; aqui ele é a última janela, alvo dos botões).
 */
const home: RecipePage = {
  path: "/",
  title: tr("Início", "Home", "Inicio"),
  blocks: [
    {
      type: "hero",
      fields: {
        eyebrow: tr("Seu cargo ou área", "Your role or field", "Tu cargo o área"),
        title: tr("Uma frase que diz o que você faz e para quem", "One sentence on what you do and for whom", "Una frase sobre qué haces y para quién"),
        subtitle: tr("Um parágrafo curto sobre você e o tipo de trabalho que procura.", "A short paragraph about you and the kind of work you look for.", "Un párrafo corto sobre ti y el tipo de trabajo que buscas."),
        primaryCta: { label: tr("Ver cases", "See cases", "Ver casos"), href: "#cases" },
        secondaryCta: { label: tr("Falar comigo", "Get in touch", "Hablemos"), href: "#contato" },
        showAvailability: true,
      },
    },
    {
      type: "numeros",
      fields: {
        items: [
          { value: "8+", label: tr("anos de experiência", "years of experience", "años de experiencia") },
          { value: "40", label: tr("projetos entregues", "projects delivered", "proyectos entregados") },
          { value: "15", label: tr("clientes atendidos", "clients served", "clientes atendidos") },
          { value: "98%", label: tr("clientes que voltam", "returning clients", "clientes que vuelven") },
        ],
      },
    },
    { type: "cases", fields: { anchor: "cases", title: tr("Cases em destaque", "Featured work", "Proyectos destacados"), cta: { label: tr("Ver todos", "See all", "Ver todos"), href: "/portfolio" } } },
    {
      type: "texto",
      fields: {
        title: tr("Sobre", "About", "Sobre mí"),
        body: tr("<p>Conte em poucas linhas quem você é, como trabalha e o que te move.</p>", "<p>Say in a few lines who you are, how you work and what drives you.</p>", "<p>Cuenta en pocas líneas quién eres, cómo trabajas y qué te mueve.</p>"),
      },
    },
    { type: "servicos", fields: { title: tr("O que eu faço", "What I do", "Lo que hago") } },
    { type: "depoimentos", fields: { title: tr("Depoimentos", "Testimonials", "Testimonios"), allowSubmission: true } },
    {
      type: "cta",
      fields: {
        title: tr("Vamos conversar?", "Shall we talk?", "¿Hablamos?"),
        body: tr("Conte o contexto e eu respondo com os próximos passos.", "Tell me the context and I'll reply with next steps.", "Cuéntame el contexto y respondo con los próximos pasos."),
        primary: { label: tr("Tenho um projeto", "I have a project", "Tengo un proyecto"), href: "#contato" },
        secondary: { label: tr("Tenho uma vaga", "I have a role", "Tengo una vacante"), href: "#contato" },
      },
    },
    { type: "contato", fields: { anchor: "contato", title: tr("Contato", "Contact", "Contacto"), mode: "wizard", showChannels: true } },
  ],
};

/**
 * Sobre na ordem da v1: as Preferências do Sistema (como eu trabalho) abrem a página,
 * depois o Sobre.txt, o Pessoal.txt, as Fotos e a Ajuda. Os textos são os do núcleo.
 */
const coreSobre = CORE_RECIPES.pessoal.find((p) => p.path === "/sobre");
const sobre: RecipePage | undefined = coreSobre && {
  ...coreSobre,
  blocks: [...coreSobre.blocks.filter((b) => b.type === "lista-itens"), ...coreSobre.blocks.filter((b) => b.type !== "lista-itens")],
};

const pessoal: Recipe = [home, ...(sobre ? [sobre] : []), ...CORE_RECIPES.pessoal.filter((p) => p.path !== "/" && p.path !== "/sobre")];

export default defineTheme({
  id: "desktop",
  label: "Desktop Retrô",
  description: "Cada seção é uma janela sobre a área de trabalho, com barra de menu e ícones: nostalgia e brincadeira.",
  contract: "^1",
  scheme: "sorbet",
  colorMode: "light",
  fonts,
  tokens: {
    "dk-shadow-offset": { label: "Sombra das janelas", kind: "length", default: "5px" },
    "dk-dot-gap": { label: "Espaço do pontilhado da área de trabalho", kind: "length", default: "14px" },
  },
  Shell: DesktopShell,
  blocks: {
    hero: HeroBlock,
    texto: TextoBlock,
    numeros: NumerosBlock,
    "lista-itens": ListaItensBlock,
    cta: CtaBlock,
    cases: CasesBlock,
    "posts-recentes": PostsRecentesBlock,
    depoimentos: DepoimentosBlock,
    faq: FaqBlock,
    servicos: ServicosBlock,
    galeria: GaleriaBlock,
    contato: ContatoBlock,
    precos: PrecosBlock,
    equipe: EquipeBlock,
    localizacao: LocalizacaoBlock,
    "logos-clientes": LogosClientesBlock,
    curriculo: CurriculoBlock,
  },
  templates: { post: DesktopPost, case: DesktopCase, notFound: DesktopNotFound },
  variants: {
    cases: [
      { value: "grade", label: "Ícones" },
      { value: "lista", label: "Lista" },
    ],
  },
  recipes: { pessoal },
  texts: DESKTOP_TEXTS,
});
