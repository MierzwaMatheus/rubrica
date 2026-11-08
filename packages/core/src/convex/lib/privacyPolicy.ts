/**
 * Texto padrão da política de privacidade (RFC v2, "LGPD no site"), em pt, en e es,
 * montado a partir dos dados da empresa/pessoa, dos plugins ligados e dos destinos
 * dos contatos. Arquivo puro: devolve os blocos `texto` da página `/privacidade`.
 *
 * O texto é um ponto de partida: a página fica editável no painel, e quem publica é
 * responsável por conferir que ele descreve o que o site faz de verdade.
 */
import type { BlockInstance, Organization, Person } from "../../content/types";

/** Texto nos três idiomas que o núcleo escreve. Outros idiomas usam o inglês. */
export interface Tri {
  pt: string;
  en: string;
  es: string;
}

export interface PolicyEntry {
  /** Que dados (ex.: "nome, e-mail e mensagem"). */
  data: Tri;
  /** Para quê. */
  purpose: Tri;
  /** Prazo de guarda, se diferente do geral. */
  retention?: Tri;
  /** Terceiros que recebem esses dados por causa deste recurso. */
  sharedWith?: { name: string; purpose: Tri }[];
}

export interface PolicySource {
  label: Tri;
  policy: PolicyEntry;
}

export interface PolicyInput {
  siteName: string;
  url: string;
  locales: string[];
  person?: Person;
  organization?: Organization;
  /** Fontes de dados pessoais com o plugin ligado. */
  sources: PolicySource[];
  /** Destinos dos contatos ligados. */
  destinations: { telegram: boolean; email: boolean; webhook: boolean };
  /** Nome do provedor de e-mail (ex.: "Resend"). */
  emailProvider: string;
  contactRetentionDays: number;
  /** Data da geração (epoch ms). */
  generatedAt: number;
}

type Lang = keyof Tri;

function langOf(locale: string): Lang {
  const base = locale.split("-")[0]!.toLowerCase();
  return base === "pt" || base === "es" ? base : "en";
}

function esc(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const tri = (pt: string, en: string, es: string): Tri => ({ pt, en, es });

export const POLICY_TITLE = tri("Política de privacidade", "Privacy policy", "Política de privacidad");

function controller(input: PolicyInput): { name: string; email?: string; details: string[] } {
  const org = input.organization;
  const name = org?.legalName || input.person?.name || input.siteName;
  const email = org?.email || input.person?.email;
  const details: string[] = [];
  if (org?.taxId) details.push(`CNPJ/CPF: ${org.taxId}`);
  const a = org?.address;
  if (a) {
    const address = [a.street, a.locality, a.region, a.postalCode, a.country].filter(Boolean).join(", ");
    if (address) details.push(address);
  }
  return { name, email, details };
}

function list(items: string[]): string {
  return `<ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul>`;
}

function p(text: string): string {
  return `<p>${text}</p>`;
}

interface Section {
  id: string;
  title: Tri;
  body: (lang: Lang) => string;
}

export function privacySections(input: PolicyInput): Section[] {
  const c = controller(input);
  const name = esc(c.name);
  const url = esc(input.url);
  const email = c.email ? `<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>` : undefined;
  const contactWay = (lang: Lang) =>
    email ?? { pt: "pelos canais de contato deste site", en: "through the contact channels on this site", es: "por los canales de contacto de este sitio" }[lang];

  const date = (lang: Lang) =>
    new Date(input.generatedAt).toLocaleDateString({ pt: "pt-BR", en: "en-US", es: "es-ES" }[lang], { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });

  const same = (name: string): Tri => tri(name, name, name);
  const shared: { name: Tri; purpose: Tri }[] = [
    {
      name: same("Convex"),
      purpose: tri(
        "banco de dados e servidores onde os envios ficam guardados",
        "database and servers where submissions are stored",
        "base de datos y servidores donde se guardan los envíos",
      ),
    },
    {
      name: tri("O provedor de hospedagem do site", "The website hosting provider", "El proveedor de alojamiento del sitio"),
      purpose: tri("entrega das páginas", "serving the pages", "entrega de las páginas"),
    },
  ];
  if (input.destinations.telegram) {
    shared.push({ name: same("Telegram"), purpose: tri("aviso imediato de novos contatos para quem atende", "instant notice of new contacts to whoever answers them", "aviso inmediato de nuevos contactos a quien los atiende") });
  }
  if (input.destinations.email) {
    shared.push({ name: same(input.emailProvider), purpose: tri("envio do aviso de novos contatos por e-mail", "sending new-contact notices by e-mail", "envío del aviso de nuevos contactos por correo") });
  }
  if (input.destinations.webhook) {
    shared.push({
      name: tri(`O sistema de gestão de clientes (CRM) de ${c.name}`, `${c.name}'s customer management system (CRM)`, `El sistema de gestión de clientes (CRM) de ${c.name}`),
      purpose: tri("acompanhamento do atendimento", "following up on your request", "seguimiento de la atención"),
    });
  }
  for (const source of input.sources) {
    for (const s of source.policy.sharedWith ?? []) if (!shared.some((x) => x.name.pt === s.name)) shared.push({ name: same(s.name), purpose: s.purpose });
  }

  return [
    {
      id: "privacidade-controlador",
      title: tri("Quem cuida dos seus dados", "Who is responsible for your data", "Quién es responsable de sus datos"),
      body: (lang) =>
        p(
          {
            pt: `<strong>${name}</strong> é o controlador dos dados pessoais coletados neste site (${url}), nos termos da Lei Geral de Proteção de Dados (Lei 13.709/2018, LGPD).`,
            en: `<strong>${name}</strong> is the controller of the personal data collected on this website (${url}), under Brazil's General Data Protection Law (Law 13,709/2018, LGPD).`,
            es: `<strong>${name}</strong> es el responsable de los datos personales recogidos en este sitio (${url}), según la Ley General de Protección de Datos de Brasil (Ley 13.709/2018, LGPD).`,
          }[lang],
        ) +
        (c.details.length ? p(c.details.map(esc).join(" · ")) : "") +
        p({ pt: `Contato para assuntos de privacidade: ${contactWay("pt")}.`, en: `Privacy contact: ${contactWay("en")}.`, es: `Contacto sobre privacidad: ${contactWay("es")}.` }[lang]),
    },
    {
      id: "privacidade-dados",
      title: tri("Que dados coletamos e para quê", "What data we collect and why", "Qué datos recogemos y para qué"),
      body: (lang) => {
        const items = input.sources.map((s) => `<strong>${esc(s.label[lang])}:</strong> ${esc(s.policy.data[lang])}. ${esc(s.policy.purpose[lang])}`);
        const ip = {
          pt: "<strong>Endereço IP:</strong> não guardamos o seu IP. Guardamos só um resumo criptográfico (hash) dele, junto do registro do seu consentimento, para limitar envios abusivos.",
          en: "<strong>IP address:</strong> we do not store your IP. We keep only a cryptographic digest (hash) of it, with the record of your consent, to limit abusive submissions.",
          es: "<strong>Dirección IP:</strong> no guardamos su IP. Guardamos solo un resumen criptográfico (hash), junto con el registro de su consentimiento, para limitar envíos abusivos.",
        }[lang];
        if (!items.length) {
          return p({ pt: "Este site não coleta dados pessoais por formulários.", en: "This website does not collect personal data through forms.", es: "Este sitio no recoge datos personales mediante formularios." }[lang]);
        }
        return list([...items, ip]);
      },
    },
    {
      id: "privacidade-consentimento",
      title: tri("Consentimento", "Consent", "Consentimiento"),
      body: (lang) =>
        p(
          {
            pt: "Os formulários deste site só são enviados com o seu consentimento explícito. Registramos a data, o idioma, a página e a versão desta política em que você consentiu. Você pode retirar o consentimento a qualquer momento, pedindo a exclusão dos seus dados.",
            en: "The forms on this website are only sent with your explicit consent. We record the date, language, page and version of this policy under which you consented. You can withdraw consent at any time by asking us to delete your data.",
            es: "Los formularios de este sitio solo se envían con su consentimiento explícito. Registramos la fecha, el idioma, la página y la versión de esta política en la que usted consintió. Puede retirar el consentimiento en cualquier momento solicitando la eliminación de sus datos.",
          }[lang],
        ),
    },
    {
      id: "privacidade-compartilhamento",
      title: tri("Com quem compartilhamos", "Who we share data with", "Con quién compartimos"),
      body: (lang) =>
        list(shared.map((s) => `<strong>${esc(s.name[lang])}</strong>: ${esc(s.purpose[lang])}`)) +
        p({ pt: "Não vendemos nem alugamos dados pessoais.", en: "We do not sell or rent personal data.", es: "No vendemos ni alquilamos datos personales." }[lang]),
    },
    {
      id: "privacidade-retencao",
      title: tri("Por quanto tempo guardamos", "How long we keep it", "Cuánto tiempo los guardamos"),
      body: (lang) => {
        const days = input.contactRetentionDays;
        const items = [
          {
            pt: `Pedidos de contato: até ${days} dias, ou menos se você pedir a exclusão.`,
            en: `Contact requests: up to ${days} days, or less if you ask for deletion.`,
            es: `Solicitudes de contacto: hasta ${days} días, o menos si solicita la eliminación.`,
          }[lang],
          ...input.sources.filter((s) => s.policy.retention).map((s) => `${esc(s.label[lang])}: ${esc(s.policy.retention![lang])}`),
        ];
        return list(items);
      },
    },
    {
      id: "privacidade-cookies",
      title: tri("Cookies", "Cookies", "Cookies"),
      body: (lang) =>
        p(
          {
            pt: "Este site não usa cookies de rastreamento nem de publicidade.",
            en: "This website does not use tracking or advertising cookies.",
            es: "Este sitio no utiliza cookies de seguimiento ni de publicidad.",
          }[lang],
        ),
    },
    {
      id: "privacidade-direitos",
      title: tri("Seus direitos", "Your rights", "Sus derechos"),
      body: (lang) =>
        p(
          {
            pt: "Pela LGPD (art. 18), você pode pedir: confirmação de que tratamos seus dados, acesso a eles, correção, anonimização ou exclusão, portabilidade, informação sobre com quem os compartilhamos e a revogação do consentimento.",
            en: "Under the LGPD (art. 18), you may request: confirmation that we process your data, access to it, correction, anonymization or deletion, portability, information about who we share it with, and withdrawal of consent.",
            es: "Según la LGPD (art. 18), usted puede solicitar: confirmación de que tratamos sus datos, acceso a ellos, corrección, anonimización o eliminación, portabilidad, información sobre con quién los compartimos y la revocación del consentimiento.",
          }[lang],
        ) + p({ pt: `Para isso, escreva ${email ? `para ${email}` : contactWay("pt")}.`, en: `To do so, write ${email ? `to ${email}` : contactWay("en")}.`, es: `Para ello, escriba ${email ? `a ${email}` : contactWay("es")}.` }[lang]),
    },
    {
      id: "privacidade-atualizacoes",
      title: tri("Mudanças nesta política", "Changes to this policy", "Cambios en esta política"),
      body: (lang) =>
        p(
          {
            pt: `Esta política pode mudar. Cada mudança gera uma nova versão, registrada junto dos consentimentos. Última atualização: ${date("pt")}.`,
            en: `This policy may change. Each change creates a new version, recorded with the consents. Last updated: ${date("en")}.`,
            es: `Esta política puede cambiar. Cada cambio genera una nueva versión, registrada junto con los consentimientos. Última actualización: ${date("es")}.`,
          }[lang],
        ),
    },
  ];
}

/** Mapa por idioma a partir do texto nos três idiomas do núcleo. */
export function localizeTri(value: Tri | ((lang: Lang) => string), locales: string[]): Record<string, string> {
  const get = typeof value === "function" ? value : (lang: Lang) => value[lang];
  return Object.fromEntries(locales.map((l) => [l, get(langOf(l))]));
}

/** Blocos `texto` da página `/privacidade`. */
export function privacyPolicyBlocks(input: PolicyInput): BlockInstance[] {
  return privacySections(input).map((s) => ({
    id: s.id,
    type: "texto",
    visible: true,
    fields: { title: localizeTri(s.title, input.locales), body: localizeTri(s.body, input.locales) },
  }));
}
