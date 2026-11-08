/**
 * Textos do site em português. É a referência: o dicionário em inglês (en.ts) tem
 * exatamente o mesmo formato, e o TypeScript reclama se faltar alguma chave lá.
 *
 * Rótulos e dicas de temas, esquemas e presets vêm do CLI (packages/create-rubrica) em
 * português; em inglês eles ficam em `catalog` no en.ts.
 */
import { LAYOUTS, SCHEMES } from "../lib/data";
import { PLUGIN_PRESETS } from "../../../../packages/create-rubrica/src/plugins";

const fromCli = <T extends { hint: string }>(list: T[], key: (x: T) => string) =>
  Object.fromEntries(list.map((x) => [key(x), x.hint])) as Record<string, string>;

export const pt = {
  meta: {
    homeTitle: "Rubrica — sites pessoais e de empresa, open source",
    homeDescription:
      "Site estático em Astro com painel e backend no Convex. Duas linhas (pessoal e empresa), 14 temas, 15 esquemas de cores, vários idiomas e MCP para agentes. Atualizar é subir a versão do pacote.",
    changelogTitle: "Novidades — Rubrica",
    changelogDescription: "O que mudou em cada versão do Rubrica: o núcleo, os temas e o CLI create-rubrica.",
  },
  common: {
    copy: "Copiar",
    copied: "Copiado",
    selected: "Selecionado",
    homeAria: "Rubrica — início",
  },
  header: {
    nav: "Seções",
    combinator: "Combinador",
    layouts: "Temas",
    schemes: "Esquemas",
    start: "Começar",
    docs: "Docs",
    switchLabel: "English",
    switchAria: "Read this page in English",
  },
  hero: {
    eyebrow: "Sites pessoais e de empresa · open source",
    title: "Assine com a sua cara.",
    lede: "Um site rápido, em HTML estático, com painel para editar sem tocar no código. Para o seu portfólio ou para o site da empresa de um cliente: você escolhe o tema, monta as páginas com blocos e publica com domínio próprio.",
    /** Aviso só para quem lê em inglês; vazio em português. */
    languageNote: "",
    build: "Montar o meu",
    factsAria: "O que vem no Rubrica",
    layouts: "temas",
    schemes: "esquemas de cores",
    modes: "claro e escuro",
    modesTail: "em todos",
    imageAlt:
      "Uma caneta-tinteiro desenha o r do Rubrica com o floreio em terracota sobre papel envelhecido, ao lado de um ramo de folhas.",
  },
  combinator: {
    eyebrow: "Combinador",
    title: "Monte o seu e veja funcionando.",
    intro:
      "O preview não é uma imagem: é o site de demonstração do Rubrica, gerado para cada um dos temas com dados de exemplo. Troque as peças, navegue pelas páginas e veja no celular.",
    controlsAria: "Escolhas do combinador",
    moods: "Moods prontos",
    moodsHelp: "Uma combinação completa de tema, esquema, modo e fontes.",
    layout: "Tema",
    scheme: "Esquema de cores",
    schemeHelp: "A paleta: só as cores, com versão clara e escura.",
    mode: "Modo",
    light: "Claro",
    dark: "Escuro",
    sans: "Fonte principal",
    mono: "Fonte mono",
    pageTabs: "Página do preview",
    screenSize: "Tamanho da tela",
    desktop: "Desktop",
    mobile: "Celular",
    openFull: "Abrir o preview em tela cheia",
    frameTitle: "Preview do Rubrica com as escolhas do combinador",
    loading: "carregando o Rubrica…",
    answers: "Escolhas para o create-rubrica",
    createCta: "Criar o meu com essas escolhas",
    /** Rótulos da lista de respostas, montada no navegador. */
    rows: {
      kind: "Tipo",
      layout: "Tema",
      scheme: "Esquema",
      mode: "Modo",
      sans: "Fonte principal",
      mono: "Fonte mono",
    },
  },
  create: {
    eyebrow: "Crie o seu",
    title: "Gostou? Leve para o seu computador.",
    intro:
      "O tema, o esquema e o modo que você montou no combinador já vão junto. Preencha os seus dados e cole o comando num terminal: ele cria o projeto, instala tudo e oferece ligar o Convex (o backend, com login pelo navegador e conta gratuita). As fontes você ajusta depois, no painel.",
    formAria: "Seus dados para criar o site",
    kind: "Tipo de site",
    kindPersonal: "Pessoal",
    kindPersonalHint: "portfólio: sobre, currículo, projetos e blog",
    kindCompany: "Empresa",
    kindCompanyHint: "quem somos, serviços, preços, equipe, cases e contato",
    locales: "Idiomas",
    localesHelp: "O primeiro marcado é o principal, sem prefixo na URL. Dá para mudar depois com o config.",
    plugins: "O que o site vai ter",
    pluginsHelp: "Dá para ligar e desligar cada parte depois, no painel.",
    optional: "opcional",
    siteName: "Nome do site ou da empresa",
    siteNamePh: "Ana Souza",
    siteUrl: "Endereço do site",
    siteUrlPh: "meusite.com",
    siteUrlNote: "Ainda não tem? Deixe em branco: o terminal sugere um endereço gratuito da Vercel.",
    email: "Seu e-mail",
    emailPrivate: "login do painel e contato",
    emailPh: "nome@meusite.com",
    description: "Em uma frase, o que você faz?",
    descriptionPh: "Designer de produto e ilustradora.",
    paste: "Cole no terminal",
    folder: "Cria a pasta",
    nodeBefore: "Precisa do",
    nodeLink: "Node.js 22.23 ou mais novo",
    nodeUrl: "https://nodejs.org/pt/download",
    nodeAfter: "Nada do que você digita aqui sai do seu navegador: o comando é montado nesta página.",
    /** Mensagens montadas no navegador (recipeForm.ts). */
    form: {
      badUrl: "Não parece um endereço (ex: meusite.com). O terminal vai perguntar de novo.",
      badEmail: "Confira o e-mail (ex: nome@meusite.com). O terminal vai perguntar de novo.",
      missingName: "o nome",
      missingUrl: "o endereço",
      missingEmail: "o e-mail",
      and: "e",
      willAsk: "O terminal vai perguntar {list}. O resto já vai no comando.",
      allSet:
        "Está tudo no comando: no terminal, você só liga o Convex (login pelo navegador) e escolhe a senha do painel.",
    },
  },
  layouts: {
    eyebrow: "Temas",
    title: "Quatorze jeitos de contar a mesma história.",
    intro:
      "O conteúdo é o mesmo em todos: o tema muda a forma. Cada miniatura é a home de verdade, na aparência que o tema recomenda. Clique para abrir no combinador.",
    newTitle: "Temas",
    newText: "Todos usam o esquema de cores completo e passam na mesma bateria de testes.",
    legacyTitle: "",
    legacyText: "",
    shotAlt: "Home do tema {name}",
    light: "claro",
    dark: "escuro",
    moreBefore: "Como escolher, trocar, ejetar e criar um tema está no",
    moreLink: "guia de temas",
  },
  schemes: {
    eyebrow: "Esquemas de cores",
    title: "Quinze paletas, cada uma em claro e escuro.",
    intro:
      "Qualquer esquema funciona com qualquer tema. O site pode abrir no claro, no escuro ou seguir o sistema de quem visita, e mostrar um botão para alternar. Clique numa paleta para aplicá-la no combinador.",
    roles: { bg: "fundo", surface: "cartão", text: "texto", primary: "primária", accent: "acento", accent2: "acento 2" },
    light: "claro",
    dark: "escuro",
    stripAria: "Modo {mode} de {name}",
    moreBefore: "Como trocar o esquema, os 11 papéis de cor e as fontes estão no",
    moreLink: "guia de temas",
  },
  features: {
    eyebrow: "O que vem pronto",
    title: "A base técnica é coletiva. A identidade é sua.",
    intro:
      "Montar um site profissional do zero dá trabalho demais, e os construtores prontos deixam todo mundo com a mesma cara. O Rubrica fica no meio do caminho: o sistema inteiro já resolvido, para você cuidar do conteúdo e da marca.",
    items: [
      { title: "Duas linhas", text: "Pessoal (sobre, currículo, projetos, blog) e empresa (quem somos, serviços, preços, equipe, cases, contato)." },
      { title: "Páginas com blocos", text: "Monte e reordene as páginas pelo painel, com prévia ao vivo. Crie páginas novas sem código." },
      { title: "HTML estático", text: "Astro gera tudo no build: rápido, com SEO completo e quase nenhum JavaScript." },
      { title: "14 temas", text: "Do limpo ao ousado, todos com a mesma estrutura de SEO e acessibilidade, testados antes de cada release." },
      { title: "Vários idiomas", text: "Quantos você quiser, com o principal à sua escolha. O que não foi traduzido não aparece no idioma." },
      { title: "Painel e papéis", text: "Agência, dono, editores e comercial, cada um vê só o que pode mexer." },
      { title: "Propostas e pagamentos", text: "Proposta com senha, aceite eletrônico, contrato em PDF e checkout no Asaas. Opcional." },
      { title: "Contatos e LGPD", text: "Pedidos no painel, no Telegram, no e-mail ou num webhook, com consentimento registrado." },
      { title: "Agentes", text: "Servidor MCP local: o agente edita o conteúdo com prévia antes de gravar." },
    ],
  },
  start: {
    eyebrow: "Começar",
    title: "Do terminal ao domínio próprio.",
    introBefore: "O CLI cria o projeto com as suas escolhas. Depois, tudo se edita pelo painel, e o",
    introAfter: "sobe a versão do pacote sem mexer no que você personalizou.",
    steps: [
      {
        title: "Crie o projeto",
        text: 'Monte no combinador e copie o comando pronto em "Crie o seu", ou rode este e responda às perguntas. Ele instala tudo, liga o Convex e cria o painel.',
      },
      {
        title: "Abra o site",
        text: "Na pasta do projeto (com pnpm, pnpm dev também serve). O painel fica em /admin, com o e-mail e a senha que você definiu.",
      },
      {
        title: "Publique",
        text: "Coloca o site no ar na Vercel (conta gratuita), com o banco de produção. Depois, o update sobe as versões novas do núcleo e do tema.",
      },
    ],
    moreBefore: "Passo a passo completo, variáveis de ambiente e publicação no",
  },
  creator: {
    eyebrow: "Quem fez",
    role: "AI Enablement Lead e Tech Lead de Front-End",
    photoAlt: "Matheus Mierzwa de perfil, de boné e óculos, em fundo escuro",
    bio: [
      "Matheus constrói sistemas de ponta a ponta, da arquitetura à produção, e lidera os times que usam esses sistemas. Na InBot, empresa de IA conversacional, fundou e lidera a área de AI Enablement e é o Tech Lead de front-end de um monorepo multiproduto.",
      "O Rubrica nasceu do mesmo jeito que ele trabalha: documento antes do código, testado por quem vai usar e fácil de manter depois do lançamento. Presença profissional não é luxo, é o mínimo que o seu trabalho merece.",
    ],
    portfolioNote: "o portfólio dele, feito com o Rubrica",
  },
  footer: {
    repo: "Repositório",
    templates: "Guia de temas",
    colors: "Migrar da v1",
    changelog: "Novidades",
    npm: "create-rubrica no npm",
    licenseBefore: "Código aberto sob",
    madeBy: "Feito por Matheus Mierzwa.",
  },
  changelog: {
    eyebrow: "Novidades",
    title: "Tudo o que entrou no Rubrica.",
    versions: "Versões",
    latest: "Mais recente",
    releaseNotes: "Notas da release",
  },
  docs: {
    eyebrow: "Documentação",
    nav: "Documentação",
    start: "Começar",
    look: "Aparência e idiomas",
    extend: "Estender",
    layouts: "Avançado",
    onThisPage: "Nesta página",
    edit: "Editar no GitHub",
    titleSuffix: "Documentação do Rubrica",
    /** Aviso só para quem lê em inglês; vazio em português. */
    translationNote: "",
  },
  /** Nomes das páginas do preview. */
  pages: {
    "/": "Início",
    "/curriculo": "Currículo",
    "/portfolio": "Portfólio",
    "/sobre": "Sobre",
    "/blog": "Blog",
    "/quem-somos": "Quem somos",
    "/servicos": "Serviços",
    "/precos": "Preços",
    "/cases": "Cases",
    "/contato": "Contato",
  } as Record<string, string>,
  catalog: {
    layoutHints: fromCli(LAYOUTS, (l) => l.id),
    schemeHints: fromCli(SCHEMES, (s) => s.id),
    presets: Object.fromEntries(PLUGIN_PRESETS.map((p) => [p.id, { label: p.label, hint: p.hint }])) as Record<
      string,
      { label: string; hint: string }
    >,
    moods: {
      atelie: "Ateliê de papel",
      catalogo: "Catálogo",
      ensaio: "Ensaio longo",
      sessao: "Sessão 1998",
      madrugada: "Madrugada",
      prancheta: "Prancheta",
      "fim-de-tarde": "Fim de tarde",
      "fala-comigo": "Fala comigo",
      verao: "Verão no Aterro",
      neon: "Neon original",
      terminal: "Terminal",
      cartaz: "Cartaz suíço",
      produto: "Produto",
      revista: "Revista",
    } as Record<string, string>,
  },
};

/** Formato de um dicionário de textos do site. */
export type Dict = typeof pt;
