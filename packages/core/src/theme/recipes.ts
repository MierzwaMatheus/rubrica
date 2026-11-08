/**
 * Receitas padrão do núcleo (RFC v2, decisão 24): a lista de blocos de cada página fixa,
 * por tipo de site. Valem quando o tema não declara a sua (`recipeFor`). Site novo e
 * `migrar` usam a mesma receita. Os textos são exemplos, nos três idiomas de partida
 * (pt-BR, en, es), para a pessoa trocar.
 */
import type { SiteKind } from "../content/types";
import type { ThemeDefinition, Recipe, RecipeBlock, RecipePage } from "./contract";

type Tr = Record<"pt-BR" | "en" | "es", string>;

/** Atalho: texto nos três idiomas de partida. */
const tr = (ptBR: string, en: string, es: string): Tr => ({ "pt-BR": ptBR, en, es });
const link = (label: Tr, href: string) => ({ label, href });

const privacidade: RecipePage = {
  path: "/privacidade",
  title: tr("Política de privacidade", "Privacy policy", "Política de privacidad"),
  blocks: [
    {
      type: "texto",
      fields: {
        title: tr("Política de privacidade", "Privacy policy", "Política de privacidad"),
        body: tr(
          "<p>Esta página explica quais dados pessoais este site coleta, por quê e por quanto tempo, conforme a Lei Geral de Proteção de Dados (LGPD).</p><h3>Dados que você nos envia</h3><p>Nome, e-mail e a mensagem que você escreve nos formulários de contato e de depoimento. Usamos esses dados só para responder a você e, no caso do depoimento, para exibi-lo no site depois da sua autorização.</p><h3>Seus direitos</h3><p>Você pode pedir acesso, correção ou exclusão dos seus dados a qualquer momento pelo e-mail de contato deste site.</p>",
          "<p>This page explains which personal data this site collects, why, and for how long, in line with Brazil's General Data Protection Law (LGPD).</p><h3>Data you send us</h3><p>Name, email and the message you write in the contact and testimonial forms. We use it only to reply to you and, for testimonials, to display them on the site once you authorize it.</p><h3>Your rights</h3><p>You can ask for access, correction or deletion of your data at any time through this site's contact email.</p>",
          "<p>Esta página explica qué datos personales recoge este sitio, por qué y por cuánto tiempo, conforme a la Ley General de Protección de Datos de Brasil (LGPD).</p><h3>Datos que nos envías</h3><p>Nombre, correo y el mensaje que escribes en los formularios de contacto y de testimonio. Los usamos solo para responderte y, en el caso del testimonio, para mostrarlo en el sitio con tu autorización.</p><h3>Tus derechos</h3><p>Puedes pedir acceso, corrección o eliminación de tus datos en cualquier momento mediante el correo de contacto de este sitio.</p>",
        ),
      },
    },
  ],
};

const ctaContato = (title: Tr, body: Tr, button: Tr): RecipeBlock => ({
  type: "cta",
  fields: { title, body, primary: link(button, "/contato") },
});

const pessoal: Recipe = [
  {
    path: "/",
    title: tr("Início", "Home", "Inicio"),
    blocks: [
      {
        type: "hero",
        fields: {
          eyebrow: tr("Seu cargo ou área", "Your role or field", "Tu cargo o área"),
          title: tr("Uma frase que diz o que você faz e para quem", "One sentence on what you do and for whom", "Una frase sobre qué haces y para quién"),
          subtitle: tr("Um parágrafo curto sobre você e o tipo de trabalho que procura.", "A short paragraph about you and the kind of work you look for.", "Un párrafo corto sobre ti y el tipo de trabajo que buscas."),
          primaryCta: link(tr("Ver projetos", "See projects", "Ver proyectos"), "/portfolio"),
          secondaryCta: link(tr("Falar comigo", "Get in touch", "Hablemos"), "#contato"),
          showAvailability: true,
        },
      },
      { type: "cases", fields: { title: tr("Projetos em destaque", "Featured work", "Proyectos destacados"), cta: link(tr("Ver todos", "See all", "Ver todos"), "/portfolio") } },
      {
        type: "texto",
        fields: {
          title: tr("Um pouco sobre mim", "A little about me", "Un poco sobre mí"),
          body: tr("<p>Conte em poucas linhas quem você é, como trabalha e o que te move.</p>", "<p>Say in a few lines who you are, how you work and what drives you.</p>", "<p>Cuenta en pocas líneas quién eres, cómo trabajas y qué te mueve.</p>"),
        },
      },
      {
        type: "numeros",
        fields: {
          title: tr("Em números", "By the numbers", "En números"),
          items: [
            { value: "8+", label: tr("anos de experiência", "years of experience", "años de experiencia") },
            { value: "40", label: tr("projetos entregues", "projects delivered", "proyectos entregados") },
            { value: "15", label: tr("clientes atendidos", "clients served", "clientes atendidos") },
          ],
        },
      },
      { type: "depoimentos", fields: { title: tr("O que dizem sobre meu trabalho", "What people say about my work", "Lo que dicen de mi trabajo") } },
      {
        type: "cta",
        fields: {
          title: tr("Vamos conversar?", "Shall we talk?", "¿Hablamos?"),
          body: tr("Me conte sobre o seu projeto ou a vaga.", "Tell me about your project or the role.", "Cuéntame sobre tu proyecto o la vacante."),
          primary: link(tr("Mandar uma mensagem", "Send a message", "Enviar un mensaje"), "#contato"),
        },
      },
      { type: "contato", fields: { anchor: "contato", title: tr("Contato", "Contact", "Contacto"), mode: "wizard", showChannels: true } },
    ],
  },
  {
    path: "/sobre",
    title: tr("Sobre", "About", "Sobre mí"),
    blocks: [
      {
        type: "texto",
        fields: {
          title: tr("Sobre mim", "About me", "Sobre mí"),
          body: tr("<p>Sua trajetória profissional em poucos parágrafos.</p>", "<p>Your professional story in a few paragraphs.</p>", "<p>Tu trayectoria profesional en pocos párrafos.</p>"),
        },
      },
      {
        type: "lista-itens",
        fields: {
          title: tr("Princípios de trabalho", "How I work", "Principios de trabajo"),
          numbered: true,
          items: [
            { title: tr("Entender antes de fazer", "Understand before doing", "Entender antes de hacer"), body: tr("Começo ouvindo o problema.", "I start by listening to the problem.", "Empiezo escuchando el problema.") },
            { title: tr("Entregar em partes", "Deliver in small steps", "Entregar por partes"), body: tr("Ciclos curtos, com feedback.", "Short cycles, with feedback.", "Ciclos cortos, con retroalimentación.") },
          ],
        },
      },
      {
        type: "texto",
        fields: {
          title: tr("Fora do trabalho", "Outside of work", "Fuera del trabajo"),
          body: tr("<p>O que você gosta de fazer quando não está trabalhando.</p>", "<p>What you like to do when you are not working.</p>", "<p>Lo que te gusta hacer cuando no trabajas.</p>"),
        },
      },
      { type: "galeria", fields: { title: tr("Meu dia a dia", "My day to day", "Mi día a día") } },
      { type: "faq", fields: { title: tr("Perguntas frequentes", "Frequently asked questions", "Preguntas frecuentes") } },
    ],
  },
  {
    path: "/curriculo",
    title: tr("Currículo", "Résumé", "Currículum"),
    blocks: [{ type: "curriculo", fields: { title: tr("Currículo", "Résumé", "Currículum"), showDownload: true } }],
  },
  {
    path: "/portfolio",
    title: tr("Projetos", "Projects", "Proyectos"),
    blocks: [
      {
        type: "cases",
        source: { collection: "projects", sort: "order" },
        fields: { title: tr("Projetos", "Projects", "Proyectos"), intro: tr("Uma seleção do que já fiz.", "A selection of what I've done.", "Una selección de lo que he hecho.") },
      },
    ],
  },
  {
    path: "/blog",
    title: tr("Blog", "Blog", "Blog"),
    blocks: [
      {
        type: "posts-recentes",
        source: { collection: "posts", sort: "recent" },
        fields: { title: tr("Blog", "Blog", "Blog"), intro: tr("Textos sobre o que aprendo e faço.", "Writing about what I learn and do.", "Textos sobre lo que aprendo y hago."), showTagFilter: true },
      },
    ],
  },
  {
    path: "/depoimentos",
    title: tr("Depoimentos", "Testimonials", "Testimonios"),
    blocks: [
      {
        type: "depoimentos",
        source: { collection: "testimonials", sort: "order" },
        fields: { title: tr("Depoimentos", "Testimonials", "Testimonios"), intro: tr("O que as pessoas dizem sobre trabalhar comigo.", "What people say about working with me.", "Lo que dice la gente sobre trabajar conmigo."), allowSubmission: true },
      },
    ],
  },
  privacidade,
];

const empresa: Recipe = [
  {
    path: "/",
    title: tr("Início", "Home", "Inicio"),
    blocks: [
      {
        type: "hero",
        fields: {
          title: tr("O que a sua empresa faz, em uma frase", "What your company does, in one sentence", "Lo que hace tu empresa, en una frase"),
          subtitle: tr("Para quem você trabalha e qual resultado entrega.", "Who you work for and what result you deliver.", "Para quién trabajas y qué resultado entregas."),
          primaryCta: link(tr("Fale com a gente", "Talk to us", "Habla con nosotros"), "/contato"),
          secondaryCta: link(tr("Ver serviços", "See services", "Ver servicios"), "/servicos"),
        },
      },
      { type: "servicos", fields: { title: tr("Serviços", "Services", "Servicios"), cta: link(tr("Todos os serviços", "All services", "Todos los servicios"), "/servicos") } },
      {
        type: "numeros",
        fields: {
          title: tr("Nossa história em números", "Our story in numbers", "Nuestra historia en números"),
          items: [
            { value: "12", label: tr("anos de mercado", "years in business", "años en el mercado") },
            { value: "300+", label: tr("clientes atendidos", "clients served", "clientes atendidos") },
          ],
        },
      },
      { type: "cases", fields: { title: tr("Cases", "Case studies", "Casos"), cta: link(tr("Ver todos", "See all", "Ver todos"), "/cases") } },
      { type: "depoimentos", fields: { title: tr("O que os clientes dizem", "What clients say", "Lo que dicen los clientes") } },
      ctaContato(tr("Vamos começar?", "Ready to start?", "¿Empezamos?"), tr("Conte o que você precisa e respondemos em até um dia útil.", "Tell us what you need and we'll reply within one business day.", "Cuéntanos qué necesitas y respondemos en un día hábil."), tr("Pedir contato", "Get in touch", "Pedir contacto")),
    ],
  },
  {
    path: "/quem-somos",
    title: tr("Quem somos", "About us", "Quiénes somos"),
    blocks: [
      {
        type: "texto",
        fields: {
          title: tr("Quem somos", "About us", "Quiénes somos"),
          body: tr("<p>A história da empresa, em poucos parágrafos: como começou e o que a move.</p>", "<p>The company story in a few paragraphs: how it started and what drives it.</p>", "<p>La historia de la empresa en pocos párrafos: cómo empezó y qué la mueve.</p>"),
        },
      },
      { type: "numeros", fields: { title: tr("Em números", "By the numbers", "En números"), items: [{ value: "12", label: tr("anos de mercado", "years in business", "años en el mercado") }] } },
      {
        type: "lista-itens",
        fields: {
          title: tr("Nossos valores", "Our values", "Nuestros valores"),
          items: [
            { title: tr("Transparência", "Transparency", "Transparencia"), body: tr("Combinamos tudo às claras.", "We agree everything in the open.", "Acordamos todo con claridad.") },
            { title: tr("Cuidado", "Care", "Cuidado"), body: tr("Tratamos cada cliente como único.", "We treat every client as unique.", "Tratamos a cada cliente como único.") },
          ],
        },
      },
      { type: "equipe", fields: { title: tr("Equipe", "Team", "Equipo") } },
    ],
  },
  {
    path: "/servicos",
    title: tr("Serviços", "Services", "Servicios"),
    blocks: [
      { type: "servicos", fields: { title: tr("Serviços", "Services", "Servicios"), intro: tr("O que fazemos por você.", "What we do for you.", "Lo que hacemos por ti.") } },
      { type: "faq", fields: { title: tr("Perguntas frequentes", "Frequently asked questions", "Preguntas frecuentes") } },
      ctaContato(tr("Precisa de algo diferente?", "Need something different?", "¿Necesitas algo distinto?"), tr("Montamos uma proposta sob medida.", "We'll put together a custom proposal.", "Preparamos una propuesta a medida."), tr("Pedir proposta", "Request a proposal", "Pedir propuesta")),
    ],
  },
  {
    path: "/precos",
    title: tr("Preços", "Pricing", "Precios"),
    blocks: [
      {
        type: "precos",
        fields: {
          title: tr("Planos e preços", "Plans and pricing", "Planes y precios"),
          intro: tr("Escolha o plano que cabe no seu momento.", "Pick the plan that fits where you are.", "Elige el plan que se ajusta a tu momento."),
          note: tr("Valores sem impostos.", "Prices exclude taxes.", "Valores sin impuestos."),
        },
      },
      { type: "faq", fields: { title: tr("Dúvidas sobre os planos", "Questions about the plans", "Dudas sobre los planes") } },
    ],
  },
  {
    path: "/cases",
    title: tr("Cases", "Case studies", "Casos"),
    blocks: [
      {
        type: "cases",
        source: { collection: "projects", sort: "order" },
        fields: { title: tr("Cases", "Case studies", "Casos"), intro: tr("Resultados que ajudamos a construir.", "Results we helped build.", "Resultados que ayudamos a construir.") },
      },
    ],
  },
  {
    path: "/blog",
    title: tr("Blog", "Blog", "Blog"),
    blocks: [
      {
        type: "posts-recentes",
        source: { collection: "posts", sort: "recent" },
        fields: { title: tr("Blog", "Blog", "Blog"), showTagFilter: true },
      },
    ],
  },
  {
    path: "/contato",
    title: tr("Contato", "Contact", "Contacto"),
    blocks: [
      { type: "contato", fields: { title: tr("Fale com a gente", "Talk to us", "Habla con nosotros"), intro: tr("Respondemos em até um dia útil.", "We reply within one business day.", "Respondemos en un día hábil."), mode: "wizard", showChannels: true } },
      { type: "localizacao", fields: { title: tr("Onde estamos", "Where we are", "Dónde estamos"), showMap: true, showHours: true } },
    ],
  },
  privacidade,
];

/** Receitas do núcleo por tipo de site. */
export const CORE_RECIPES: Record<SiteKind, Recipe> = { pessoal, empresa };

/** Receita do tema para o tipo de site; sem ela, a do núcleo (decisão 24). */
export function recipeFor(theme: Pick<ThemeDefinition, "recipes">, kind: SiteKind): Recipe {
  return theme.recipes?.[kind] ?? CORE_RECIPES[kind];
}
