/**
 * Catálogo de blocos do lançamento (RFC v2, decisão 22): um por seção da v1, mais
 * os da linha empresa. Os campos daqui SÃO o contrato de blocos (versão em
 * `CONTRACT_VERSION`): acrescentar bloco ou campo opcional é minor; mudar ou remover
 * campo é major e precisa de migração de dados (decisão 30).
 */
import { defineBlock } from "../define";
import { field } from "../fields";
import { EMBED_PROVIDERS, parseEmbedUrl, parseVideoUrl } from "../media";

/** Domínios que os blocos põem em iframe (a CSP do CLI lê daqui) e o parse dos endereços. */
export { BLOCK_FRAME_SOURCES, EMBED_PROVIDERS, parseEmbedUrl, parseVideoUrl } from "../media";

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
  guidance: {
    use: "Abertura da página: o primeiro bloco, com a promessa principal (leva o h1), um apoio curto e um ou dois botões. Um por página.",
    avoid: "Fora do topo ou repetido na página. Para um chamado no meio ou no fim, use cta; para explicar com parágrafos, texto.",
    pairsWith: ["numeros", "logos-clientes", "cases", "servicos"],
  },
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
  guidance: {
    use: "Explicar com parágrafos: história, sobre, abordagem, uma política. Aceita uma imagem ao lado.",
    avoid: "Para itens paralelos (valores, etapas, diferenciais), use lista-itens; para marcos com data, linha-do-tempo; para números, numeros. Nunca ponha h1 no corpo.",
    pairsWith: ["numeros", "lista-itens", "galeria", "cta"],
  },
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
  guidance: {
    use: "Três ou quatro números concretos que dão prova rápida (anos, clientes, projetos), logo depois do hero ou de um texto.",
    avoid: "Sem números reais que a pessoa confirmou (não invente). Muitos números diluem o destaque: até quatro é o ideal.",
    pairsWith: ["hero", "texto", "depoimentos"],
  },
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
  guidance: {
    use: "Itens paralelos com título e texto curto: princípios, valores, diferenciais, etapas de um processo (numerados).",
    avoid: "Para marcos com data, use linha-do-tempo; para serviços com página própria, servicos; para perguntas e respostas, faq.",
    pairsWith: ["texto", "numeros", "cta"],
  },
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
  guidance: {
    use: "Mostrar trabalhos feitos (coleção de projetos): os destaques na home, a lista inteira na página de portfólio ou de cases.",
    avoid: "Sem projetos cadastrados o bloco some: crie os projetos antes. Para só mostrar marcas atendidas, logos-clientes.",
    pairsWith: ["depoimentos", "logos-clientes", "cta"],
  },
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
  guidance: {
    use: "Listar o que é oferecido (coleção de serviços): um resumo na home, a lista completa na página de serviços.",
    avoid: "Para preços, use precos ou comparativo-planos; para o jeito de trabalhar em etapas, lista-itens ou linha-do-tempo.",
    pairsWith: ["faq", "depoimentos", "cta"],
  },
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
  guidance: {
    use: "Prova social com os depoimentos aprovados da coleção, perto de uma decisão (antes do cta ou do contato).",
    avoid: "Nunca escreva depoimentos: só os que a pessoa recebeu. Sem nenhum aprovado, o bloco some.",
    pairsWith: ["cases", "logos-clientes", "cta"],
  },
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
  guidance: {
    use: "Responder dúvidas e objeções recorrentes (coleção de FAQ) em páginas de serviços, preços ou contato. Gera dados estruturados de FAQ.",
    avoid: "Para conteúdo explicativo contínuo, use texto. Evite o mesmo FAQ inteiro em várias páginas.",
    pairsWith: ["servicos", "precos", "cta"],
  },
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
  guidance: {
    use: "Posts do blog: alguns na home, todos (quantidade vazia) na página do blog.",
    avoid: "Sem o plugin blog ou sem posts publicados, não aparece. Para um aviso fixo, use texto ou a faixa de aviso do site.",
    pairsWith: ["texto", "cta"],
  },
  category: "comum",
  plugin: "blog",
  // A busca é uma ilha que só filtra os cartões já no HTML (sem ela, a lista inteira aparece).
  interactive: true,
  enhances: true,
  islandOptIn: true,
  islandWhen: (f) => f.showSearch === true,
  source: { collections: ["posts"], default: { collection: "posts", limit: 3, sort: "recent" } },
  fields: {
    anchor,
    title: heading,
    intro,
    cta: field.link({ label: "Link para o blog" }),
    showTagFilter: field.boolean({ label: "Filtro por etiqueta", default: false }),
    showSearch: field.boolean({ label: "Busca por texto", default: false, help: "Campo que filtra os posts pelo título, resumo e etiquetas (página do blog)." }),
    showFeatured: field.boolean({
      label: "Destaques no topo",
      default: false,
      help: "Os posts marcados como destaque num carrossel acima da lista, nos temas que o desenham (página do blog).",
    }),
  },
});

export const cta = defineBlock({
  type: "cta",
  label: "Chamada",
  description: "Fechamento com um ou dois caminhos (ex.: \"tenho um projeto\" e \"tenho uma vaga\").",
  guidance: {
    use: "Fechar uma página ou seção com uma ação clara (um ou dois botões): conversar, pedir proposta, ver planos. Um link whatsapp: abre a conversa.",
    avoid: "No topo (lá vai o hero) ou vários seguidos. Logo antes de um bloco contato, costuma sobrar.",
    pairsWith: ["depoimentos", "servicos", "contato"],
  },
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
  guidance: {
    use: "Receber pedidos de contato (formulário ou assistente) e mostrar os canais: no fim da home ou na página de contato.",
    avoid: "Mais de um por página. Para só um botão que leva ao contato, use cta.",
    pairsWith: ["localizacao", "faq", "cta"],
  },
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
  guidance: {
    use: "Fotos com título e descrição (coleção de rotina): dia a dia, bastidores, o espaço da empresa.",
    avoid: "Para logos, use logos-clientes; para as pessoas da equipe, equipe; para uma imagem só, texto com imagem.",
    pairsWith: ["texto", "equipe"],
  },
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
  guidance: {
    use: "O currículo completo (experiência, formação, competências) com PDF, em sites pessoais; costuma ficar sozinho na página de currículo.",
    avoid: "Na home: lá, prefira texto e numeros com um botão para o currículo.",
    pairsWith: ["texto", "cta"],
  },
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
  guidance: {
    use: "Planos lado a lado em cartões (coleção de planos), na página de preços.",
    avoid: "Para comparar recurso por recurso, use comparativo-planos (pode vir depois dos cartões). Não invente preços.",
    pairsWith: ["comparativo-planos", "faq", "cta"],
  },
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
  guidance: {
    use: "Apresentar as pessoas da empresa (coleção de equipe), em geral na página Quem somos.",
    avoid: "Para uma pessoa só, use texto com imagem; para clientes, logos-clientes ou depoimentos.",
    pairsWith: ["texto", "linha-do-tempo", "numeros"],
  },
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
  guidance: {
    use: "Endereço, horário e mapa da empresa (dos dados da empresa), na página de contato.",
    avoid: "Sem endereço ou atendimento presencial. Para o mapa ou a agenda de outro serviço, use incorporacao.",
    pairsWith: ["contato", "faq"],
  },
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
  guidance: {
    use: "Faixa de logos de clientes ou parceiros como prova social rápida, logo depois do hero ou perto dos cases.",
    avoid: "Sem autorização para usar as marcas. Para resultados contados, use cases ou depoimentos.",
    pairsWith: ["hero", "cases", "depoimentos"],
  },
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

const embedLabels = EMBED_PROVIDERS.map((p) => p.label).join(", ");

export const video = defineBlock({
  type: "video",
  label: "Vídeo",
  description: "Vídeo do YouTube ou do Vimeo. Carrega leve: miniatura e botão de play, e o player só depois do clique.",
  guidance: {
    use: "Um vídeo do YouTube ou do Vimeo (apresentação, demonstração, palestra), que carrega leve: miniatura e player só no clique.",
    avoid: "Para agenda, mapa ou formulário de outro serviço, use incorporacao. A informação principal não deve estar só no vídeo: repita o essencial em texto.",
    pairsWith: ["texto", "cta"],
  },
  category: "comum",
  interactive: true,
  enhances: true,
  islandWhen: (f) => parseVideoUrl(f.url) !== undefined,
  fields: {
    anchor,
    title: heading,
    intro,
    url: field.text({
      label: "Endereço do vídeo",
      localized: false,
      required: true,
      maxLength: 300,
      help: "Link do YouTube (youtube.com/watch?v=…, youtu.be/…, /shorts/…) ou do Vimeo (vimeo.com/123456789).",
    }),
    caption: field.text({
      label: "Legenda",
      maxLength: 200,
      help: "Aparece abaixo do vídeo e dá nome ao botão de play e ao player para leitores de tela. Sem ela, vale o título.",
    }),
    poster: field.image({
      label: "Miniatura própria",
      help: "Opcional no YouTube (sem ela, usa a miniatura do vídeo). No Vimeo, sem imagem aparece só o botão de play.",
    }),
    aspect: field.select({
      label: "Proporção",
      options: [
        { value: "16:9", label: "16:9 (paisagem)" },
        { value: "4:3", label: "4:3" },
        { value: "1:1", label: "1:1 (quadrado)" },
        { value: "9:16", label: "9:16 (vertical, Shorts e Reels)" },
      ],
      default: "16:9",
    }),
  },
  validate: (f) => (parseVideoUrl(f.url) ? [] : [{ path: "url", message: "Endereço do vídeo: use um link do YouTube ou do Vimeo" }]),
  // Cheia com miniatura própria, curta com a do YouTube, Vimeo com e sem imagem.
  sample: (_mode, i) => (i < 2 ? { url: "https://www.youtube.com/watch?v=M7lc1UVf-VE" } : { url: "https://vimeo.com/76979871", ...(i === 3 ? { poster: undefined } : {}) }),
});

export const incorporacao = defineBlock({
  type: "incorporacao",
  label: "Incorporação",
  description: `Agenda, formulário, mapa ou player de outro serviço, por endereço, só dos provedores permitidos (${embedLabels}).`,
  guidance: {
    use: "Agenda, formulário, mapa ou player de um provedor permitido (ex.: Calendly, Google Maps), pelo endereço de incorporação.",
    avoid: "Para vídeo do YouTube ou do Vimeo, use video (mais leve); para receber contatos no site, contato. Provedor fora da lista é recusado.",
    pairsWith: ["texto", "contato", "cta"],
  },
  category: "comum",
  fields: {
    anchor,
    title: heading,
    intro,
    url: field.text({
      label: "Endereço da incorporação",
      localized: false,
      required: true,
      maxLength: 2000,
      help: `O link do "incorporar" (embed) do serviço: o endereço do src, não o código HTML. Provedores aceitos: ${embedLabels}.`,
    }),
    frameTitle: field.text({
      label: "Título acessível",
      required: true,
      maxLength: 120,
      help: "Descreve o conteúdo para leitores de tela (ex.: \"Agenda para marcar uma conversa\").",
    }),
    height: field.number({ label: "Altura (px)", integer: true, min: 150, max: 2000, help: "Opcional. Sem ela, vale a altura padrão do provedor." }),
    showLink: field.boolean({ label: "Link para abrir em nova aba", default: true, help: "Mostra, abaixo, um link para abrir o serviço fora do site." }),
  },
  validate: (f) =>
    parseEmbedUrl(f.url) ? [] : [{ path: "url", message: `Endereço da incorporação: use um link de incorporação de ${embedLabels}` }],
  sample: (mode) => ({
    url: mode === "curto" ? "https://www.google.com/maps/embed?pb=!1m18!1m12" : "https://calendly.com/exemplo/30min",
    ...(mode === "cheio" ? { height: 700 } : {}),
  }),
});

export const linhaDoTempo = defineBlock({
  type: "linha-do-tempo",
  label: "Linha do tempo",
  description: "Marcos em ordem: história da empresa, trajetória, etapas de um projeto.",
  guidance: {
    use: "Marcos em ordem, com data: a história da empresa, uma trajetória, as etapas de um projeto ou de um processo com prazos.",
    avoid: "Para itens sem ordem nem data (valores, diferenciais), use lista-itens; para o currículo inteiro, curriculo.",
    pairsWith: ["texto", "equipe", "numeros"],
  },
  category: "comum",
  fields: {
    anchor,
    title: heading,
    intro,
    items: field.list({
      label: "Marcos",
      itemLabel: "Marco",
      required: true,
      min: 1,
      max: 16,
      of: {
        date: field.text({ label: "Data", required: true, maxLength: 40, help: "Texto livre: 2019, mar. 2021, Hoje." }),
        title: field.text({ label: "Título", required: true, maxLength: 120 }),
        body: field.text({ label: "Texto", multiline: true, maxLength: 600 }),
        image: field.image({ label: "Imagem" }),
      },
    }),
  },
});

export const comparativoPlanos = defineBlock({
  type: "comparativo-planos",
  label: "Comparativo de planos",
  description: "Tabela que compara os planos da coleção item a item (linhas = recursos, colunas = planos), com o botão de cada plano.",
  guidance: {
    use: "Tabela que compara os planos recurso a recurso, na página de preços, quando a diferença entre eles está nos detalhes.",
    avoid: "Com um ou dois planos simples, precos basta. Não invente recursos nem valores.",
    pairsWith: ["precos", "faq", "cta"],
  },
  category: "empresa",
  plugin: "pricing",
  source: { collections: ["plans"], default: { collection: "plans", sort: "order" } },
  fields: {
    anchor,
    title: heading,
    intro,
    caption: field.text({
      label: "Legenda da tabela",
      maxLength: 160,
      help: "Resumo da tabela para leitores de tela (e visível acima dela). Sem ela, vale o título, só para leitores de tela.",
    }),
    rows: field.list({
      label: "Recursos",
      itemLabel: "Recurso",
      required: true,
      min: 1,
      max: 40,
      of: {
        label: field.text({ label: "Recurso", required: true, maxLength: 120 }),
        detail: field.text({ label: "Detalhe", maxLength: 200 }),
        cells: field.list({
          label: "Planos",
          itemLabel: "Plano",
          max: 8,
          help: "Um valor por plano, na ordem das colunas (a mesma da lista de planos do bloco). Plano sem valor fica com um traço.",
          of: {
            value: field.select({
              label: "Valor",
              options: [
                { value: "sim", label: "✓ Incluso" },
                { value: "nao", label: "✗ Não incluso" },
                { value: "texto", label: "Texto" },
              ],
              default: "sim",
            }),
            text: field.text({ label: "Texto", maxLength: 60, help: "Para o valor \"Texto\" (ex.: até 5, ilimitado)." }),
          },
        }),
      },
    }),
    note: field.text({ label: "Observação", multiline: true, maxLength: 300 }),
  },
  validate: (f) => {
    const errors: { path: string; message: string }[] = [];
    (f.rows as { cells?: { value?: string; text?: Record<string, string> }[] }[]).forEach((row, r) =>
      row.cells?.forEach((cell, c) => {
        const hasText = !!cell.text && Object.values(cell.text).some((t) => t.trim());
        if (cell.value === "texto" && !hasText) errors.push({ path: `rows.${r}.cells.${c}.text`, message: "Texto: obrigatório quando o valor é \"Texto\"" });
      }),
    );
    return errors;
  },
  sample: (mode) => ({
    rows: (mode === "cheio" ? ROWS_SAMPLE : ROWS_SAMPLE.slice(0, 2)).map(([label, cells], i) => ({
      label: { "*": mode === "cheio" && i === 0 ? "Páginas do site, com textos revisados e otimizados para busca" : label },
      ...(mode === "cheio" && i === 1 ? { detail: { "*": "Atualizações de segurança e cópias de segurança diárias." } } : {}),
      cells: cells.map((c) => (c === "sim" || c === "nao" ? { value: c } : { value: "texto", text: { "*": c } })),
    })),
  }),
});

const ROWS_SAMPLE: [string, string[]][] = [
  ["Páginas", ["até 5", "até 15", "ilimitadas"]],
  ["Hospedagem", ["sim", "sim", "sim"]],
  ["Blog e SEO", ["nao", "sim", "sim"]],
  ["Suporte", ["e-mail", "prioritário", "dedicado 24/7"]],
  ["Relatório mensal", ["nao", "sim", "sim"]],
  ["Integrações sob medida", ["nao", "nao", "sim"]],
];

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
  video,
  incorporacao,
  linhaDoTempo,
  comparativoPlanos,
] as const;

export type CoreBlock = (typeof CORE_BLOCKS)[number];
export type CoreBlockType = CoreBlock["type"];
