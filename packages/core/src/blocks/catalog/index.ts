/**
 * Catálogo de blocos do lançamento (RFC v2, decisão 22): um por seção da v1, mais
 * os da linha empresa. Os campos daqui SÃO o contrato de blocos (versão em
 * `CONTRACT_VERSION`): acrescentar bloco ou campo opcional é minor; mudar ou remover
 * campo é major e precisa de migração de dados (decisão 30).
 */
import { defineBlock } from "../define";
import { field } from "../fields";

const heading = field.text({ label: "Título", maxLength: 140 });
const intro = field.text({ label: "Texto de apoio", multiline: true, maxLength: 400 });
const anchor = field.text({
  label: "Âncora",
  localized: false,
  help: "Identificador para links na página (#contato). Opcional.",
  maxLength: 40,
});

export const hero = defineBlock({
  type: "hero",
  label: "Hero",
  description: "Primeira dobra: título principal, apoio, botões e imagem. Leva o h1 quando é o primeiro bloco da página.",
  category: "comum",
  fields: {
    eyebrow: field.text({ label: "Sobretítulo", maxLength: 80 }),
    title: field.text({ label: "Título", required: true, maxLength: 160 }),
    subtitle: field.text({ label: "Subtítulo", multiline: true, maxLength: 400 }),
    primaryCta: field.link({ label: "Botão principal" }),
    secondaryCta: field.link({ label: "Botão secundário" }),
    image: field.image({ label: "Imagem" }),
    tags: field.list({ label: "Etiquetas", itemLabel: "Etiqueta", max: 8, of: { label: field.text({ label: "Texto", required: true, maxLength: 40 }) } }),
    showAvailability: field.boolean({ label: "Mostrar disponibilidade", default: false }),
  },
});

export const texto = defineBlock({
  type: "texto",
  label: "Texto",
  description: "Título e texto livre, com imagem opcional ao lado.",
  category: "comum",
  fields: {
    anchor,
    title: heading,
    body: field.richText({ label: "Texto", required: true }),
    image: field.image({ label: "Imagem" }),
    imagePosition: field.select({
      label: "Posição da imagem",
      options: [
        { value: "start", label: "Antes do texto" },
        { value: "end", label: "Depois do texto" },
      ],
      default: "end",
    }),
  },
});

export const numeros = defineBlock({
  type: "numeros",
  label: "Números",
  description: "Números em destaque (anos de experiência, clientes, projetos).",
  category: "comum",
  fields: {
    anchor,
    title: heading,
    intro,
    items: field.list({
      label: "Números",
      itemLabel: "Número",
      required: true,
      min: 1,
      max: 8,
      of: {
        value: field.text({ label: "Valor", localized: false, required: true, maxLength: 16, help: "Ex.: 10+, 98%, R$ 2 mi" }),
        label: field.text({ label: "Rótulo", required: true, maxLength: 60 }),
        description: field.text({ label: "Detalhe", maxLength: 140 }),
      },
    }),
  },
});

export const listaItens = defineBlock({
  type: "lista-itens",
  label: "Lista de itens",
  description: "Itens com título e texto: princípios de trabalho, valores, diferenciais, etapas.",
  category: "comum",
  fields: {
    anchor,
    title: heading,
    intro,
    numbered: field.boolean({ label: "Numerar itens", default: false }),
    items: field.list({
      label: "Itens",
      itemLabel: "Item",
      required: true,
      min: 1,
      max: 12,
      of: {
        icon: field.text({ label: "Ícone", localized: false, help: "Nome de um ícone do Lucide (ex.: rocket).", maxLength: 40 }),
        title: field.text({ label: "Título", required: true, maxLength: 100 }),
        body: field.text({ label: "Texto", multiline: true, maxLength: 500 }),
      },
    }),
  },
});

export const cases = defineBlock({
  type: "cases",
  label: "Cases",
  description: "Projetos ou cases da coleção, com link para a página de cada um. Mostra os destaques; sem nenhum, os primeiros da lista. Sem projetos, o bloco some.",
  category: "comum",
  plugin: "portfolio",
  source: { collections: ["projects"], default: { collection: "projects", featured: true, limit: 3, sort: "order" } },
  fields: {
    anchor,
    title: heading,
    intro,
    cta: field.link({ label: "Link para ver todos" }),
  },
});

export const servicos = defineBlock({
  type: "servicos",
  label: "Serviços",
  description: "Serviços da coleção.",
  category: "comum",
  source: { collections: ["services"], default: { collection: "services", sort: "order" } },
  fields: {
    anchor,
    title: heading,
    intro,
    cta: field.link({ label: "Botão" }),
  },
});

export const depoimentos = defineBlock({
  type: "depoimentos",
  label: "Depoimentos",
  description: "Depoimentos aprovados da coleção, com convite opcional para enviar um novo. Mostra os destaques; sem nenhum, os primeiros da lista. Sem depoimentos, o bloco some.",
  category: "comum",
  plugin: "testimonials",
  interactive: true,
  islandWhen: (f, plugins) => f.allowSubmission === true && plugins.has("testimonials-intake"),
  source: { collections: ["testimonials"], default: { collection: "testimonials", featured: true, limit: 6, sort: "order" } },
  fields: {
    anchor,
    title: heading,
    intro,
    allowSubmission: field.boolean({
      label: "Convidar a enviar depoimento",
      default: false,
      help: "Mostra o botão do assistente de depoimento (precisa do plugin testimonials-intake).",
    }),
  },
});

export const faq = defineBlock({
  type: "faq",
  label: "Perguntas frequentes",
  description: "Perguntas e respostas da coleção. Gera JSON-LD FAQPage.",
  category: "comum",
  source: { collections: ["faq"], default: { collection: "faq", sort: "order" } },
  fields: {
    anchor,
    title: heading,
    intro,
  },
});

export const postsRecentes = defineBlock({
  type: "posts-recentes",
  label: "Posts",
  description: "Posts do blog. Com quantidade vazia, lista todos (página do blog).",
  category: "comum",
  plugin: "blog",
  source: { collections: ["posts"], default: { collection: "posts", limit: 3, sort: "recent" } },
  fields: {
    anchor,
    title: heading,
    intro,
    cta: field.link({ label: "Link para o blog" }),
    showTagFilter: field.boolean({ label: "Filtro por etiqueta", default: false }),
  },
});

export const cta = defineBlock({
  type: "cta",
  label: "Chamada",
  description: "Fechamento com um ou dois caminhos (ex.: \"tenho um projeto\" e \"tenho uma vaga\").",
  category: "comum",
  fields: {
    anchor,
    title: field.text({ label: "Título", required: true, maxLength: 140 }),
    body: intro,
    primary: field.link({ label: "Botão principal", required: true }),
    secondary: field.link({ label: "Botão secundário" }),
  },
});

export const contato = defineBlock({
  type: "contato",
  label: "Contato",
  description: "Formulário ou assistente de contato, com os canais (e-mail, WhatsApp, redes).",
  category: "comum",
  interactive: true,
  islandWhen: (f, plugins) => f.mode !== "channels" && plugins.has("contact-wizard"),
  fields: {
    anchor,
    title: heading,
    intro,
    mode: field.select({
      label: "Formato",
      options: [
        { value: "wizard", label: "Assistente em etapas" },
        { value: "form", label: "Formulário simples" },
        { value: "channels", label: "Só os canais, sem formulário" },
      ],
      default: "wizard",
    }),
    showChannels: field.boolean({ label: "Mostrar canais de contato", default: true }),
  },
});

export const galeria = defineBlock({
  type: "galeria",
  label: "Galeria",
  description: "Imagens com título e descrição: dia a dia, bastidores, espaço da empresa.",
  category: "comum",
  source: { collections: ["routine"], default: { collection: "routine", sort: "order" } },
  fields: {
    anchor,
    title: heading,
    intro,
  },
});

export const curriculo = defineBlock({
  type: "curriculo",
  label: "Currículo",
  description: "Experiência, formação e competências da coleção, com download em PDF.",
  category: "pessoal",
  plugin: "resume",
  interactive: true,
  islandWhen: (f) => f.showDownload !== false,
  source: { collections: ["resume"], default: { collection: "resume", sort: "order" } },
  fields: {
    anchor,
    title: heading,
    intro,
    showDownload: field.boolean({ label: "Botão de baixar PDF", default: true }),
  },
});

export const precos = defineBlock({
  type: "precos",
  label: "Preços",
  description: "Planos da coleção lado a lado, com destaque e botão de cada um.",
  category: "empresa",
  source: { collections: ["plans"], default: { collection: "plans", sort: "order" } },
  fields: {
    anchor,
    title: heading,
    intro,
    note: field.text({ label: "Observação", multiline: true, maxLength: 300, help: "Ex.: valores sem impostos." }),
  },
});

export const equipe = defineBlock({
  type: "equipe",
  label: "Equipe",
  description: "Pessoas da coleção, com foto, cargo e redes.",
  category: "empresa",
  source: { collections: ["team"], default: { collection: "team", sort: "order" } },
  fields: {
    anchor,
    title: heading,
    intro,
  },
});

export const localizacao = defineBlock({
  type: "localizacao",
  label: "Localização",
  description: "Endereço, horário e mapa a partir dos dados da empresa.",
  category: "empresa",
  fields: {
    anchor,
    title: heading,
    intro,
    showMap: field.boolean({ label: "Mostrar mapa", default: true }),
    showHours: field.boolean({ label: "Mostrar horário", default: true }),
  },
});

export const logosClientes = defineBlock({
  type: "logos-clientes",
  label: "Logos de clientes",
  description: "Faixa de logos de clientes ou parceiros.",
  category: "empresa",
  fields: {
    anchor,
    title: heading,
    logos: field.list({
      label: "Logos",
      itemLabel: "Logo",
      required: true,
      min: 1,
      max: 24,
      of: {
        name: field.text({ label: "Nome", localized: false, required: true, maxLength: 80 }),
        image: field.image({ label: "Logo", required: true }),
        href: field.text({ label: "Link", localized: false, maxLength: 300 }),
      },
    }),
  },
});

export const CORE_BLOCKS = [
  hero,
  texto,
  numeros,
  listaItens,
  cases,
  servicos,
  depoimentos,
  faq,
  postsRecentes,
  cta,
  contato,
  galeria,
  curriculo,
  precos,
  equipe,
  localizacao,
  logosClientes,
] as const;

export type CoreBlock = (typeof CORE_BLOCKS)[number];
export type CoreBlockType = CoreBlock["type"];
