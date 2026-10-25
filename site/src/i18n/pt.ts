/**
 * Textos do site em português. É a referência: o dicionário em inglês (en.ts) tem
 * exatamente o mesmo formato, e o TypeScript reclama se faltar alguma chave lá.
 *
 * Rótulos e dicas de layouts, esquemas, texturas e presets vêm do CLI (cli/src) em
 * português; em inglês eles ficam em `catalog` no en.ts.
 */
import { LAYOUTS, TEXTURES } from "../../../cli/src/layouts";
import { SCHEMES } from "../../../cli/src/themes/schemes";
import { PLUGIN_PRESETS } from "../../../cli/src/plugins";

const fromCli = <T extends { hint: string }>(list: T[], key: (x: T) => string) =>
  Object.fromEntries(list.map((x) => [key(x), x.hint])) as Record<string, string>;

export const pt = {
  meta: {
    homeTitle: "Rubrica — portfólio profissional open source",
    homeDescription:
      "Home, portfólio, blog, currículo, propostas e painel admin prontos. 13 layouts e 15 esquemas de cores com modo claro e escuro. Assine com a sua cara.",
    changelogTitle: "Novidades — Rubrica",
    changelogDescription: "O que mudou em cada versão do Rubrica: o template e o CLI create-rubrica.",
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
    layouts: "Layouts",
    schemes: "Esquemas",
    start: "Começar",
    switchLabel: "English",
    switchAria: "Read this page in English",
  },
  hero: {
    eyebrow: "Portfólio profissional · open source",
    title: "Assine com a sua cara.",
    lede: "Home, portfólio, blog, currículo, propostas comerciais, painel admin e pagamentos já resolvidos. Você escolhe a aparência, escreve o seu conteúdo e publica com domínio próprio.",
    /** Aviso só para quem lê em inglês; vazio em português. */
    languageNote: "",
    build: "Montar o meu",
    factsAria: "O que vem no Rubrica",
    layouts: "layouts",
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
      "O preview não é uma imagem: é o próprio Rubrica rodando com dados de exemplo, em cada um dos layouts. Troque as peças, navegue pelas páginas e veja no celular.",
    previewNote: "",
    controlsAria: "Escolhas do combinador",
    moods: "Moods prontos",
    moodsHelp: "Uma combinação completa de layout, esquema, modo, textura e fontes.",
    layout: "Layout",
    newLayouts: "Novos",
    legacyLayouts: "Originais",
    scheme: "Esquema de cores",
    schemeHelp: "A paleta: só as cores, com versão clara e escura.",
    mode: "Modo",
    light: "Claro",
    dark: "Escuro",
    toggle: "Botão de modo",
    show: "Mostrar",
    hide: "Esconder",
    texture: "Textura",
    sans: "Fonte principal",
    mono: "Fonte mono",
    pageTabs: "Página do preview",
    screenSize: "Tamanho da tela",
    desktop: "Desktop",
    mobile: "Celular",
    openFull: "Abrir o preview em tela cheia",
    frameTitle: "Preview do Rubrica com as escolhas do combinador",
    loading: "carregando o Rubrica…",
    answers: "Respostas para o create-rubrica",
    createCta: "Criar o meu com essas escolhas",
    /** Rótulos da lista de respostas, montada no navegador. */
    rows: {
      layout: "Layout",
      scheme: "Esquema",
      mode: "Modo",
      toggle: "Botão de modo",
      texture: "Textura",
      sans: "Fonte principal",
      mono: "Fonte mono",
      yes: "Sim",
      no: "Não",
    },
  },
  create: {
    eyebrow: "Crie o seu",
    title: "Gostou? Leve para o seu computador.",
    intro:
      "O visual que você montou no combinador já vai junto. Preencha os seus dados e cole o comando num terminal: ele baixa o Rubrica, instala tudo, cria o banco de dados (com login pelo navegador, conta gratuita) e monta o seu painel. No terminal, você só escolhe a senha do painel.",
    formAria: "Seus dados para criar o site",
    plugins: "O que o site vai ter",
    pluginsHelp: "Dá para ligar e desligar cada parte depois, no painel.",
    optional: "opcional",
    authorName: "Seu nome",
    authorNamePh: "Ana Souza",
    siteName: "Nome do site",
    siteNamePh: "Igual ao seu nome",
    siteUrl: "Endereço do site",
    siteUrlPh: "meusite.com",
    siteUrlNote: "Ainda não tem? Deixe em branco: o terminal sugere um endereço gratuito da Vercel.",
    email: "Seu e-mail",
    emailPrivate: "não aparece no site",
    emailPh: "nome@meusite.com",
    description: "Em uma frase, o que você faz?",
    descriptionPh: "Designer de produto e ilustradora.",
    twitter: "Perfil no X",
    twitterPh: "@seuperfil",
    profession: "Profissão",
    professionPh: "Fotógrafa, Designer UX, Advogada…",
    professionNote: "Aparece abaixo do seu nome no site.",
    specialties: "Especialidades",
    specialtiesPh: "Retrato, Casamentos, Ensaios",
    specialtiesNote: "Separadas por vírgula. A IA usa ao escrever as suas propostas.",
    paste: "Cole no terminal",
    folder: "Cria a pasta",
    nodeBefore: "Precisa do",
    nodeLink: "Node.js 20 ou mais novo",
    nodeUrl: "https://nodejs.org/pt/download",
    nodeAfter: "Nada do que você digita aqui sai do seu navegador: o comando é montado nesta página.",
    /** Mensagens montadas no navegador (recipeForm.ts). */
    form: {
      badUrl: "Não parece um endereço (ex: meusite.com). O terminal vai perguntar de novo.",
      badEmail: "Confira o e-mail (ex: nome@meusite.com). O terminal vai perguntar de novo.",
      missingName: "seu nome",
      missingUrl: "o endereço",
      missingEmail: "o e-mail",
      and: "e",
      willAsk: "O terminal vai perguntar {list}. O resto já vai no comando.",
      allSet:
        "Está tudo no comando: no terminal, você só faz o login no banco de dados (pelo navegador) e escolhe a senha do painel.",
    },
  },
  layouts: {
    eyebrow: "Layouts",
    title: "Treze jeitos de contar a mesma história.",
    intro:
      "O conteúdo é o mesmo em todos: o layout muda a forma. Cada miniatura é a home de verdade, na aparência que o CLI recomenda para ela. Clique para abrir no combinador.",
    newTitle: "Novos",
    newText: "Usam o esquema de cores completo.",
    legacyTitle: "Originais",
    legacyText: "Os cinco primeiros, com as quatro cores principais do esquema.",
    shotAlt: "Home do layout {name}",
    light: "claro",
    dark: "escuro",
    moreBefore: "Cada página de cada layout está descrita no",
    moreLink: "guia dos templates",
  },
  schemes: {
    eyebrow: "Esquemas de cores",
    title: "Quinze paletas, cada uma em claro e escuro.",
    intro:
      "Qualquer esquema funciona com qualquer layout. O site pode abrir no claro, no escuro ou seguir o sistema de quem visita, e mostrar um botão para alternar. Clique numa paleta para aplicá-la no combinador.",
    roles: { bg: "fundo", surface: "cartão", text: "texto", primary: "primária", accent: "acento", accent2: "acento 2" },
    light: "claro",
    dark: "escuro",
    stripAria: "Modo {mode} de {name}",
    moreBefore: "Os 11 papéis de cor de cada esquema, as texturas e as cores do painel admin estão em",
    moreLink: "Esquemas de cores",
  },
  features: {
    eyebrow: "O que vem pronto",
    title: "A base técnica é coletiva. A identidade é sua.",
    intro:
      "Começar um portfólio do zero dá trabalho demais, e os construtores prontos deixam todo mundo com a mesma cara. O Rubrica fica no meio do caminho: o sistema inteiro já resolvido, para você cuidar do conteúdo e da marca.",
    items: [
      { title: "Home", text: "Apresentação, números de destaque, cases, serviços, depoimentos e chamada de contato." },
      { title: "Portfólio", text: "Projetos com filtro por categoria e estudos de caso com métricas, decisões e aprendizados." },
      { title: "Blog", text: "Editor rich text, tags, busca e RSS automático." },
      { title: "Currículo", text: "Estruturado, com PDF otimizado para ATS." },
      { title: "Propostas", text: "Protegidas por senha, com aceite eletrônico, assinatura manuscrita e contrato em PDF." },
      { title: "Painel admin", text: "Tudo editável pela interface, sem tocar no código." },
      { title: "Plugins", text: "Liga e desliga o que você não quer expor." },
      { title: "Pagamentos", text: "Checkout com PIX, boleto e cartão em até 12x pelo Asaas. Opcional." },
      { title: "IA", text: "Tradução automática e currículo adaptado para cada vaga. Opcional." },
    ],
  },
  start: {
    eyebrow: "Começar",
    title: "Do terminal ao domínio próprio.",
    introBefore: "O CLI baixa a versão mais recente e aplica as suas escolhas. Depois, tudo se edita pelo painel admin, e o",
    introAfter: "traz as versões novas sem apagar o que você personalizou.",
    steps: [
      {
        title: "Crie o projeto",
        text: 'Monte no combinador e copie o comando pronto em "Crie o seu", ou rode este e responda às perguntas. Ele instala tudo, conecta o banco de dados e cria o painel admin.',
      },
      { title: "Abra o site", text: "Na pasta do projeto. O painel fica em /login, com o e-mail e a senha que você definiu." },
      {
        title: "Publique",
        text: "Coloca o site no ar na Vercel (conta gratuita), com o banco de produção e o admin do site publicado. Depois, o update traz as versões novas sem apagar o que você personalizou.",
      },
    ],
    moreBefore: "Passo a passo completo, variáveis de ambiente e publicação na Vercel no",
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
    templates: "Guia dos templates",
    colors: "Esquemas de cores",
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
  /** Nomes das páginas do preview. */
  pages: { "/": "Início", "/curriculo": "Currículo", "/portfolio": "Portfólio", "/sobre": "Sobre", "/blog": "Blog" } as Record<
    string,
    string
  >,
  catalog: {
    layoutHints: fromCli(LAYOUTS, (l) => l.id),
    schemeHints: fromCli(SCHEMES, (s) => s.id),
    textures: Object.fromEntries(TEXTURES.map((t) => [t.value, { label: t.label, hint: t.hint }])) as Record<
      string,
      { label: string; hint: string }
    >,
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
