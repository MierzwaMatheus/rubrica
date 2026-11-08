/**
 * Parte do backend de demonstração que cobre coleções e módulos de negócio (contatos,
 * depoimentos enviados, LGPD, publicação, atividades, propostas, contratos, pagamentos,
 * currículos com IA), em memória e com dados fictícios. As regras puras que existem no
 * núcleo (slug, desconto de proposta) são as mesmas do backend; o resto é mais simples.
 */
import { assertValidSlug, slugify } from "../../convex/lib/slug";
import { validateDiscount } from "../../convex/commerce/lib/proposalDiscount";
import type { Permission, Role } from "../../convex/lib/roles";
import type { BlockInstance, CollectionName } from "../../content/types";
import { COLLECTIONS } from "../../content/types";
import type { Localized } from "../../i18n";
import type { PluginDefinition } from "../../plugins/contract";

type Data = Record<string, unknown>;
export type DemoDoc = Data & { _id: string; _creationTime: number };
type Handlers = Record<string, (args: Data) => unknown>;

const DAY = 86_400_000;

/** Quem é dono de cada coleção (permissão e texto obrigatório). */
const COLLECTION_RULES: Record<CollectionName, { permission: Permission; slug?: boolean; required: string[]; defaultPublished: boolean }> = {
  posts: { permission: "blog", slug: true, required: ["title"], defaultPublished: false },
  projects: { permission: "content", slug: true, required: ["title"], defaultPublished: false },
  services: { permission: "content", required: ["title"], defaultPublished: true },
  testimonials: { permission: "content", required: ["quote"], defaultPublished: true },
  faq: { permission: "content", required: ["question", "answer"], defaultPublished: true },
  resume: { permission: "content", required: ["title"], defaultPublished: true },
  routine: { permission: "content", required: ["title"], defaultPublished: true },
  plans: { permission: "plans", required: ["name"], defaultPublished: true },
  team: { permission: "content", required: ["role"], defaultPublished: true },
};

const hasText = (v: unknown) => (typeof v === "string" ? v.trim().length > 0 : !!v && typeof v === "object" && Object.values(v).some((s) => typeof s === "string" && s.trim()));
const clone = <T>(v: T): T => structuredClone(v);

/** Alvos de ações que mudam o site (espelha `affectsSite` do backend). */
const SITE_TARGETS = new Set(["page", ...COLLECTIONS]);
export function demoAffectsSite(entry: { eventType: string; targetType?: string }): boolean {
  const [scope] = entry.eventType.split(".");
  if (scope === "admin" || scope === "page") return SITE_TARGETS.has((entry.targetType ?? "") as never);
  if (scope === "settings" || scope === "texts" || scope === "plugin") return true;
  return ["media.updated", "media.deleted", "testimonial.approved", "lgpd.erasure_executed"].includes(entry.eventType);
}

export interface BusinessState {
  contacts: DemoDoc[];
  deliveries: DemoDoc[];
  destinations: { telegram: boolean; email: { enabled: boolean; to: string[] }; webhook: { enabled: boolean; url?: string } };
  submissions: DemoDoc[];
  audit: DemoDoc[];
  publish: { lastTriggeredAt?: number; lastPublishedAt?: number; publishedUpTo?: number; lastAttemptAt?: number };
  policyVersion: number;
  proposals: (DemoDoc & { password?: string })[];
  versions: DemoDoc[];
  acceptances: DemoDoc[];
  templates: DemoDoc[];
  checkouts: DemoDoc[];
  links: DemoDoc[];
  aiResumes: DemoDoc[];
}

export function createBusinessState(now: number, newId: (prefix: string) => string): BusinessState {
  const doc = <T extends Data>(prefix: string, value: T, offset = 0): DemoDoc & T => ({ _id: newId(prefix), _creationTime: now - offset, ...value });
  const delivery = (source: string, sourceId: string, destination: string, status: string, extra: Data = {}) =>
    doc("d", { source, sourceId, destination, status, attempts: status === "failed" ? 5 : 1, createdAt: now - DAY, ...(status === "sent" ? { sentAt: now - DAY } : {}), ...extra });
  const c1 = doc("c", { name: "Marina Alves", email: "marina@exemplo.com.br", phone: "(11) 99999-0001", message: "Oi! Vi o seu portfólio e gostaria de um orçamento para o site da minha clínica.", details: { Interesse: "Site institucional", Prazo: "Até 2 meses" }, locale: "pt-BR", page: "/contato", status: "new", createdAt: now - 3_600_000 });
  const c2 = doc("c", { name: "Carlos Mendes", email: "carlos@startup.dev", message: "Podemos marcar uma conversa sobre um redesenho do produto?", locale: "pt-BR", page: "/contato", status: "new", createdAt: now - 5 * 3_600_000 });
  const c3 = doc("c", { name: "Julia Ferraz", email: "julia@agencia.co", phone: "(21) 98888-0002", message: "Adorei o case do app. Vocês fazem consultoria de design system?", locale: "pt-BR", page: "/contato", status: "read", readAt: now - 2 * DAY, createdAt: now - 3 * DAY }, 3 * DAY);
  const c4 = doc("c", { name: "Spam Bot", email: "x@spam.biz", message: "Compre agora http://a.biz http://b.biz http://c.biz", locale: "pt-BR", page: "/contato", status: "archived", spam: true, archivedAt: now - DAY, createdAt: now - 6 * DAY });
  const deliveries = [
    delivery("contact", c1._id, "telegram", "sent"),
    delivery("contact", c1._id, "email", "failed", { lastError: "Resend: domínio de envio não verificado", lastAttemptAt: now - 3_000_000 }),
    delivery("contact", c2._id, "telegram", "sent"),
    delivery("contact", c3._id, "telegram", "sent"),
  ];
  const s1 = doc("t", { name: "Rafael Souza", email: "rafael@empresa.com", role: "Diretor de produto", company: "Orbita", quote: "Trabalhar com ele mudou o jeito como a gente pensa o produto. Entrega rápida e muito cuidado com os detalhes.", locale: "pt-BR", page: "/depoimentos", status: "pending", createdAt: now - 2 * 3_600_000 });
  const s2 = doc("t", { name: "Ana Paula", email: "ana@exemplo.com.br", role: "Designer", quote: "Great collaboration, clear communication and a polished result.", locale: "en", page: "/depoimentos", status: "pending", createdAt: now - 20 * 3_600_000 });
  const content = (clientName: string, title: string, value: number, extra: Data = {}) => ({
    clientName,
    title: { "pt-BR": title, en: title },
    objective: { "pt-BR": "Criar uma presença digital clara e que converta.", en: "Create a clear, converting digital presence." },
    scope: [{ "pt-BR": "Pesquisa e arquitetura de informação", en: "Research and information architecture" }, { "pt-BR": "Design das telas principais", en: "Design of the main screens" }, { "pt-BR": "Desenvolvimento e publicação", en: "Development and launch" }],
    timeline: [{ step: { "pt-BR": "Descoberta", en: "Discovery" }, period: { "pt-BR": "Semana 1", en: "Week 1" } }, { step: { "pt-BR": "Design", en: "Design" }, period: { "pt-BR": "Semanas 2 a 3", en: "Weeks 2-3" } }, { step: { "pt-BR": "Desenvolvimento", en: "Development" }, period: { "pt-BR": "Semanas 4 a 6", en: "Weeks 4-6" } }],
    deliveryDate: "6 semanas após o aceite",
    investmentValue: value,
    paymentMethods: [{ "pt-BR": "50% no aceite e 50% na entrega", en: "50% on acceptance, 50% on delivery" }],
    conditions: [{ "pt-BR": "Duas rodadas de ajustes por etapa.", en: "Two revision rounds per stage." }],
    rescissionPolicy: { "pt-BR": "Rescisão com aviso de 15 dias, pagando o trabalho já feito.", en: "15 days' notice, paying for work already done." },
    ...extra,
  });
  const template = doc("ct", { name: "Contrato padrão", description: "Prestação de serviços de design e desenvolvimento", content: "# Contrato de prestação de serviços\n\nCONTRATANTE: {{client_name}}\n\nObjeto: {{title}}\n\nValor: {{investment_value}}\n\nPrazo de entrega: {{delivery_date}}\n\nEscopo:\n{{scope}}", isDefault: true, createdAt: now - 20 * DAY, updatedAt: now - 5 * DAY });
  const template2 = doc("ct", { name: "Contrato de consultoria", description: "Horas de consultoria", content: "# Contrato de consultoria\n\nCONTRATANTE: {{client_name}}\n\nValor: {{investment_value}}", isDefault: false, createdAt: now - 10 * DAY, updatedAt: now - 10 * DAY });
  const p1 = doc("pr", { ...content("Clínica Viva", "Site institucional", 8500, { originalValue: 10000, scopePrices: [1000, 3500, 5500], giftIndexes: [0] }), slug: "clinica-viva-k3m9x2ab", password: "senha123", version: 2, isAccepted: false, expiresAt: now + 7 * DAY, createdAt: now - 4 * DAY, updatedAt: now - DAY }, 4 * DAY);
  const p2 = doc("pr", { ...content("Orbita Tecnologia", "Redesenho do app", 24000), slug: "orbita-tecnologia-q8w2e7rt", version: 1, isAccepted: true, acceptedAt: now - 6 * DAY, expiresAt: now + 4 * DAY, createdAt: now - 12 * DAY }, 12 * DAY);
  const p3 = doc("pr", { ...content("Studio Lume", "Identidade e site", 6200), slug: "studio-lume-a1b2c3d4", version: 1, isAccepted: false, expiresAt: now - 2 * DAY, createdAt: now - 14 * DAY }, 14 * DAY);
  const checkout = (customerName: string, customerEmail: string, value: number, status: string, extra: Data = {}) =>
    doc("ck", { uniqueLink: `${customerName.toLowerCase().replace(/\W+/g, "")}${Math.abs(value)}-demo-link-0000`.slice(0, 40), customerName, customerEmail, value, dueDate: "2026-12-15", status, expiresAt: now + 5 * DAY, createdAt: now - 2 * DAY, ...extra });
  return {
    contacts: [c1, c2, c3, c4],
    deliveries,
    destinations: { telegram: true, email: { enabled: false, to: [] }, webhook: { enabled: false } },
    submissions: [s1, s2],
    audit: [],
    publish: { publishedUpTo: now - DAY, lastTriggeredAt: now - DAY, lastPublishedAt: now - DAY + 120_000 },
    policyVersion: 0,
    proposals: [p1, p2, p3],
    versions: [doc("pv", { proposalId: p1._id, version: 1, content: content("Clínica Viva", "Site institucional", 10000), createdAt: now - 4 * DAY })],
    acceptances: [doc("pa", { proposalId: p2._id, proposalVersion: 1, clientName: "Marcos Lima", clientDocument: "123.456.789-09", clientEmail: "marcos@orbita.com", clientRole: "CEO", clientDeclaration: "Li e aceito os termos.", locale: "pt-BR", contentHash: "9f2c1d7e8a4b6c03", ipAddress: "203.0.113.10", userAgent: "Mozilla/5.0 (demo)", acceptedAt: now - 6 * DAY, createdAt: now - 6 * DAY, signatureUrl: null })],
    templates: [template, template2],
    checkouts: [
      checkout("Orbita Tecnologia", "financeiro@orbita.com", 12000, "paid", { description: "Entrada do redesenho do app", paidValue: 12000, paymentMethod: "pix", completedAt: now - 5 * DAY, billingType: "PIX" }),
      checkout("Clínica Viva", "contato@clinicaviva.com", 4250, "pending", { description: "Entrada do site institucional" }),
      checkout("Studio Lume", "oi@studiolume.co", 3100, "expired", { description: "Identidade e site", expiresAt: now - DAY }),
      checkout("Pedro Dias", "pedro@exemplo.com", 990, "payment_selected", { description: "Plano Essencial", billingType: "CREDIT_CARD", paymentMethod: "cartão" }),
    ],
    links: [],
    aiResumes: [
      doc("ai", { title: "Product Designer — Nubank", locale: "pt-BR", jobDescription: "Procuramos pessoa designer de produto com experiência em design systems e pesquisa com usuários.", fitScore: 82, fitComment: "Boa aderência: experiência em design systems e produto; falta destaque para pesquisa quantitativa.", strengths: ["Design systems em produção", "Liderança de projetos", "Front-end em React"], weaknesses: ["Pouca pesquisa quantitativa", "Sem experiência em fintech"], createdAt: now - 3 * DAY }, 3 * DAY),
      doc("ai", { title: "Front-end Engineer — Stripe", locale: "en", jobDescription: "Front-end engineer to build the dashboard.", fitScore: 67, fitComment: "Solid front-end skills; payments domain is new.", strengths: ["React and TypeScript", "Accessibility"], weaknesses: ["No payments experience"], createdAt: now - 9 * DAY }, 9 * DAY),
    ],
  };
}

export interface BusinessHost {
  b: BusinessState;
  state: {
    settings: { plugins: Record<string, boolean>; locales: { locales: string[]; default: string } };
    pages: DemoDoc[];
    collections: Record<CollectionName, DemoDoc[]>;
  };
  require(permission: Permission): { userId: string; role: Role; email: string };
  requireRoles(roles: readonly Role[]): { userId: string; role: Role; email: string };
  enabled(): ReadonlySet<string>;
  plugins: readonly PluginDefinition[];
  newId(prefix: string): string;
  prepareBlocks(blocks: BlockInstance[]): BlockInstance[];
  /** Pede nova leitura às telas (efeitos assíncronos da demonstração). */
  changed(): void;
}

const plain = <T>(v: T): T => clone(v);

export function businessHandlers(host: BusinessHost): { queries: Handlers; mutations: Handlers; actions: Handlers } {
  const { b, state } = host;
  const queries: Handlers = {};
  const mutations: Handlers = {};
  const actions: Handlers = {};

  const pluginOn = (id: string) => {
    if (!host.enabled().has(id)) throw new Error(`O plugin "${id}" está desligado`);
  };
  const find = <T extends DemoDoc>(list: T[], id: unknown, what: string): T => {
    const item = list.find((x) => x._id === id);
    if (!item) throw new Error(`${what} não encontrado`);
    return item;
  };

  // ── Coleções ──────────────────────────────────────────────────────────
  for (const name of COLLECTIONS) {
    const rules = COLLECTION_RULES[name];
    const owner = host.plugins.find((p) => p.collections?.includes(name))?.id;
    const guard = (write: boolean) => {
      const me = host.require(rules.permission);
      if (write && owner) pluginOn(owner);
      return me;
    };
    const items = () => state.collections[name];
    const taken = (slug: string, except?: string) => items().some((d) => d.slug === slug && d._id !== except);
    const check = (data: Data, creating: boolean) => {
      for (const key of rules.required) if ((creating || key in data) && !hasText(data[key])) throw new Error(`${key}: preencha em pelo menos um idioma`);
    };
    const nextOrder = () => items().reduce((max, d) => Math.max(max, typeof d.order === "number" ? d.order : -1), -1) + 1;

    queries[`${name}:list`] = (args) => {
      guard(false);
      return plain(items().filter((d) => args.includeDeleted || d.deletedAt === undefined).sort((a, b2) => ((a.order as number) ?? 1e9) - ((b2.order as number) ?? 1e9)));
    };
    queries[`${name}:get`] = (args) => (guard(false), plain(items().find((d) => d._id === args.id) ?? null));
    mutations[`${name}:create`] = (args) => {
      const me = guard(true);
      const { published, slug: given, ...data } = args as Data & { published?: boolean; slug?: string };
      check(data, true);
      const doc: Data = { ...clone(data) };
      if (rules.slug) {
        if (given) {
          assertValidSlug(given);
          if (taken(given)) throw new Error(`O slug "${given}" já está em uso`);
          doc.slug = given;
        } else {
          const title = data.title as Localized<string>;
          const base = title[state.settings.locales.default] || Object.values(title).find(Boolean) || "item";
          // `uniqueSlug` é assíncrona no backend (consulta o banco); aqui o teste de uso é síncrono.
          const candidate = slugify(base.toString()) || "item";
          let n = 2;
          let slug = candidate;
          while (taken(slug)) slug = `${candidate}-${n++}`;
          doc.slug = slug;
        }
      }
      if (doc.order === undefined) doc.order = nextOrder();
      const now = Date.now();
      const isPublished = published ?? rules.defaultPublished;
      const id = host.newId("i");
      items().push({ ...doc, _id: id, _creationTime: now, published: isPublished, createdAt: now, createdBy: me.userId, ...(name === "posts" && isPublished ? { publishedAt: now } : {}) } as DemoDoc);
      return id;
    };
    mutations[`${name}:update`] = (args) => {
      const me = guard(true);
      const doc = find(items(), args.id, "Item");
      const patch = clone((args.patch ?? {}) as Data);
      check(patch, false);
      for (const key of (args.unset as string[] | undefined) ?? []) {
        if (rules.required.includes(key) || key === "slug") throw new Error(`O campo "${key}" não pode ser apagado`);
        delete doc[key];
      }
      if (rules.slug && typeof patch.slug === "string" && patch.slug !== doc.slug) {
        assertValidSlug(patch.slug);
        if (taken(patch.slug, doc._id)) throw new Error(`O slug "${patch.slug}" já está em uso`);
      }
      Object.assign(doc, patch, { updatedAt: Date.now(), updatedBy: me.userId });
      return null;
    };
    const setPublished = (published: boolean) => (args: Data) => {
      guard(true);
      const doc = find(items(), args.id, "Item");
      if (doc.deletedAt !== undefined) throw new Error("O item está na lixeira");
      doc.published = published;
      if (published && name === "posts" && typeof doc.publishedAt !== "number") doc.publishedAt = Date.now();
      doc.updatedAt = Date.now();
      return null;
    };
    mutations[`${name}:publish`] = setPublished(true);
    mutations[`${name}:unpublish`] = setPublished(false);
    mutations[`${name}:reorder`] = (args) => {
      guard(true);
      (args.ids as string[]).forEach((id, order) => (find(items(), id, "Item").order = order));
      return null;
    };
    mutations[`${name}:remove`] = (args) => {
      guard(true);
      find(items(), args.id, "Item").deletedAt = Date.now();
      return null;
    };
    mutations[`${name}:restore`] = (args) => {
      host.require("purge");
      delete find(items(), args.id, "Item").deletedAt;
      return null;
    };
    mutations[`${name}:removePermanently`] = (args) => {
      host.require("purge");
      find(items(), args.id, "Item");
      state.collections[name] = items().filter((d) => d._id !== args.id);
      return null;
    };
  }

  // ── Contatos ──────────────────────────────────────────────────────────
  const contactsOn = () => {
    host.require("contacts");
  };
  const withDeliveries = (c: DemoDoc) => ({ ...plain(c), deliveries: plain(b.deliveries.filter((d) => d.source === "contact" && d.sourceId === c._id)) });
  queries["contacts:list"] = (args) => {
    contactsOn();
    return b.contacts
      .filter((c) => !args.status || c.status === args.status)
      .sort((x, y) => (y.createdAt as number) - (x.createdAt as number))
      .slice(0, (args.limit as number | undefined) ?? 100)
      .map(withDeliveries);
  };
  queries["contacts:get"] = (args) => (contactsOn(), b.contacts.find((c) => c._id === args.id) ? withDeliveries(b.contacts.find((c) => c._id === args.id)!) : null);
  queries["contacts:unreadCount"] = () => (contactsOn(), b.contacts.filter((c) => c.status === "new").length);
  const setStatus = (status: string) => (args: Data) => {
    contactsOn();
    const c = find(b.contacts, args.id, "Pedido de contato");
    c.status = status;
    if (status === "read" && !c.readAt) c.readAt = Date.now();
    if (status === "archived") c.archivedAt = Date.now();
    else delete c.archivedAt;
    return null;
  };
  mutations["contacts:markRead"] = setStatus("read");
  mutations["contacts:markUnread"] = setStatus("new");
  mutations["contacts:archive"] = setStatus("archived");
  mutations["contacts:unarchive"] = setStatus("read");
  mutations["contacts:remove"] = (args) => {
    contactsOn();
    find(b.contacts, args.id, "Pedido de contato");
    b.contacts = b.contacts.filter((c) => c._id !== args.id);
    b.deliveries = b.deliveries.filter((d) => !(d.source === "contact" && d.sourceId === args.id));
    return null;
  };
  queries["contacts:destinations"] = () => {
    contactsOn();
    return {
      ...plain(b.destinations),
      missing: { telegram: ["TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID"], email: ["RESEND_API_KEY", "CONTACT_FROM_EMAIL"], webhook: [] },
    };
  };
  mutations["contacts:setDestinations"] = (args) => {
    host.require("settings");
    const email = args.email as { enabled: boolean; to: string[] };
    const webhook = args.webhook as { enabled: boolean; url?: string };
    const to = [...new Set(email.to.map((e) => e.trim().toLowerCase()).filter(Boolean))];
    for (const e of to) if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)) throw new Error(`E-mail inválido: ${e}`);
    if (email.enabled && !to.length) throw new Error("Informe pelo menos um destinatário de e-mail");
    const url = webhook.url?.trim() || undefined;
    if (url && !/^https:\/\//.test(url)) throw new Error("O webhook precisa de um endereço https");
    if (webhook.enabled && !url) throw new Error("Informe a URL do webhook");
    b.destinations = { telegram: args.telegram as boolean, email: { enabled: email.enabled, to }, webhook: { enabled: webhook.enabled, ...(url ? { url } : {}) } };
    return null;
  };
  queries["contacts:failedDeliveries"] = () => (contactsOn(), plain(b.deliveries.filter((d) => d.status === "failed")));
  mutations["contacts:retryDelivery"] = (args) => {
    contactsOn();
    const d = find(b.deliveries, args.id, "Envio");
    if (d.status === "sent") throw new Error("Este envio já foi feito");
    // Na demonstração a nova tentativa dá certo.
    Object.assign(d, { status: "sent", attempts: 1, sentAt: Date.now(), lastError: undefined });
    return null;
  };

  // ── Depoimentos enviados ──────────────────────────────────────────────
  queries["testimonialIntake:list"] = (args) => {
    host.require("content");
    return plain(b.submissions.filter((s) => s.status === ((args.status as string | undefined) ?? "pending")).sort((x, y) => (y.createdAt as number) - (x.createdAt as number)));
  };
  mutations["testimonialIntake:approve"] = (args) => {
    const me = host.require("content");
    pluginOn("testimonials");
    const sub = find(b.submissions, args.id, "Depoimento enviado");
    if (sub.status === "approved") throw new Error("Este depoimento já foi aprovado");
    const locale = (args.locale as string | undefined) ?? (sub.locale as string);
    const quote = String((args.quote as string | undefined) ?? sub.quote).trim();
    if (!quote) throw new Error("O texto do depoimento está vazio");
    const role = String((args.role as string | undefined) ?? sub.role ?? "").trim();
    const list = state.collections.testimonials;
    const id = host.newId("i");
    const now = Date.now();
    list.push({
      _id: id,
      _creationTime: now,
      quote: { [locale]: quote },
      author: sub.name,
      ...(role ? { role: { [locale]: role } } : {}),
      ...(sub.company ? { company: sub.company } : {}),
      order: list.reduce((m, d) => Math.max(m, (d.order as number) ?? -1), -1) + 1,
      published: (args.published as boolean | undefined) ?? true,
      createdAt: now,
      createdBy: me.userId,
    } as DemoDoc);
    Object.assign(sub, { status: "approved", testimonialId: id, reviewedAt: now });
    return id;
  };
  mutations["testimonialIntake:reject"] = (args) => {
    host.require("content");
    const sub = find(b.submissions, args.id, "Depoimento enviado");
    if (sub.status === "approved") throw new Error("Depoimento já aprovado: apague o item na coleção de depoimentos");
    b.submissions = b.submissions.filter((s) => s._id !== sub._id);
    return null;
  };

  // ── LGPD ──────────────────────────────────────────────────────────────
  const emailOf = (raw: unknown) => {
    const email = String(raw).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw new Error("E-mail inválido");
    return email;
  };
  const privacyPage = () => state.pages.find((p) => p.path === "/privacidade" && p.deletedAt === undefined);
  queries["privacy:exportData"] = (args) => {
    host.require("privacy");
    const email = emailOf(args.email);
    const sources = [
      { id: "contactRequests", label: "Pedidos de contato", records: b.contacts.filter((c) => c.email === email).map((c) => ({ nome: c.name, e_mail: c.email, telefone: c.phone, mensagem: c.message, recebido_em: c.createdAt })) },
      { id: "testimonialSubmissions", label: "Depoimentos enviados", records: b.submissions.filter((s) => s.email === email).map((s) => ({ nome: s.name, e_mail: s.email, depoimento: s.quote })) },
      { id: "proposalAcceptances", label: "Aceites de proposta", records: b.acceptances.filter((a) => a.clientEmail === email).map((a) => ({ nome: a.clientName, e_mail: a.clientEmail, documento: a.clientDocument, aceito_em: a.acceptedAt })) },
      { id: "checkouts", label: "Pagamentos", records: b.checkouts.filter((c) => c.customerEmail === email).map((c) => ({ nome: c.customerName, e_mail: c.customerEmail, valor: c.value, status: c.status })) },
    ];
    return { email, generatedAt: Date.now(), total: sources.reduce((n, s) => n + s.records.length, 0), sources };
  };
  mutations["privacy:erase"] = (args) => {
    host.require("privacy");
    const email = emailOf(args.email);
    if (emailOf(args.confirm) !== email) throw new Error("A confirmação não confere com o e-mail");
    const bySource: Record<string, number> = {};
    bySource.contactRequests = b.contacts.filter((c) => c.email === email).length;
    b.contacts = b.contacts.filter((c) => c.email !== email);
    bySource.testimonialSubmissions = b.submissions.filter((s) => s.email === email).length;
    b.submissions = b.submissions.filter((s) => s.email !== email);
    bySource.proposalAcceptances = b.acceptances.filter((a) => a.clientEmail === email).length;
    for (const a of b.acceptances.filter((x) => x.clientEmail === email)) Object.assign(a, { clientName: "(anonimizado)", clientDocument: "***", clientEmail: "***", anonymizedAt: Date.now() });
    bySource.checkouts = b.checkouts.filter((c) => c.customerEmail === email).length;
    for (const c of b.checkouts.filter((x) => x.customerEmail === email)) Object.assign(c, { customerName: "(anonimizado)", customerEmail: "***" });
    return { total: Object.values(bySource).reduce((a, n) => a + n, 0), bySource };
  };
  queries["privacy:policyStatus"] = () => {
    host.require("privacy");
    const page = privacyPage();
    return { path: "/privacidade", exists: !!page, pageId: (page?._id as string | undefined) ?? null, published: !!page?.published, version: Math.max(b.policyVersion, 1), updatedAt: (page?.updatedAt as number | undefined) ?? null };
  };
  const policyBlocks = (): BlockInstance[] => {
    const site = state.settings.locales;
    const t = (pt: string, en: string): Localized<string> => Object.fromEntries(site.locales.map((l) => [l, l.startsWith("pt") ? pt : en]));
    const section = (id: string, title: Localized<string>, body: Localized<string>): BlockInstance => ({ id, type: "texto", visible: true, fields: { title, body } });
    return [
      section("b-intro", t("Política de privacidade", "Privacy policy"), t("<p>Esta página explica quais dados pessoais este site coleta, para quê e por quanto tempo.</p>", "<p>This page explains which personal data this site collects, why and for how long.</p>")),
      section("b-dados", t("Que dados coletamos", "What we collect"), t("<p>Pedidos de contato: nome, e-mail, telefone e mensagem. Depoimentos enviados: nome, e-mail e texto.</p>", "<p>Contact requests: name, email, phone and message. Submitted testimonials: name, email and text.</p>")),
      section("b-direitos", t("Seus direitos", "Your rights"), t("<p>Você pode pedir a exportação ou a exclusão dos seus dados escrevendo para o e-mail do site.</p>", "<p>You can request an export or deletion of your data by writing to the site email.</p>")),
    ];
  };
  queries["privacy:policyDraft"] = () => {
    host.require("privacy");
    return { path: "/privacidade", title: Object.fromEntries(state.settings.locales.locales.map((l) => [l, l.startsWith("pt") ? "Política de privacidade" : "Privacy policy"])), blocks: policyBlocks() };
  };
  mutations["privacy:generatePolicy"] = (args) => {
    host.require("privacy");
    const existing = privacyPage();
    if (existing && !args.overwrite) throw new Error("A página /privacidade já existe. Use overwrite para trocar pelo texto padrão (as edições se perdem).");
    const blocks = host.prepareBlocks(policyBlocks());
    const title = Object.fromEntries(state.settings.locales.locales.map((l) => [l, l.startsWith("pt") ? "Política de privacidade" : "Privacy policy"]));
    const now = Date.now();
    b.policyVersion = Math.max(b.policyVersion, 1) + (existing ? 1 : 0);
    if (existing) Object.assign(existing, { title, blocks, published: (args.publish as boolean | undefined) ?? existing.published, updatedAt: now });
    else state.pages.push({ _id: host.newId("p"), _creationTime: now, path: "/privacidade", title, blocks, published: (args.publish as boolean | undefined) ?? false, system: true, createdAt: now, updatedAt: now } as DemoDoc);
    return { pageId: (existing?._id ?? state.pages[state.pages.length - 1]!._id) as string, version: b.policyVersion };
  };

  // ── Publicação e atividades ───────────────────────────────────────────
  const pendingChanges = () => Math.min(b.audit.filter((e) => (e.createdAt as number) >= (b.publish.publishedUpTo ?? 0) && demoAffectsSite(e as never)).length, 100);
  queries["publish:status"] = () => {
    host.require("panel");
    const now = Date.now();
    const p = b.publish;
    const publishing = !!p.lastTriggeredAt && (p.lastPublishedAt ?? 0) < p.lastTriggeredAt;
    const pending = pendingChanges();
    return {
      status: publishing ? "publishing" : pending > 0 ? "pending" : "published",
      configured: true,
      pendingChanges: pending,
      lastTriggeredAt: p.lastTriggeredAt ?? null,
      lastPublishedAt: p.lastPublishedAt ?? null,
      lastError: null,
      nextAllowedAt: p.lastAttemptAt ? Math.max(now, p.lastAttemptAt + 5_000) : now,
    };
  };
  actions["publish:trigger"] = (args) => {
    host.require("publish");
    const now = Date.now();
    const p = b.publish;
    if (p.lastAttemptAt && now - p.lastAttemptAt < 5_000) return { ok: true, skipped: true, message: "Publicação recente. Tente de novo em instantes." };
    if (!args.force && pendingChanges() === 0) return { ok: true, skipped: true, message: "Nada novo para publicar." };
    p.lastAttemptAt = now;
    p.lastTriggeredAt = now;
    p.publishedUpTo = now;
    // O build "termina" depois de um tempo, como o aviso do provedor.
    setTimeout(() => {
      p.lastPublishedAt = Date.now();
      host.changed();
    }, 2500);
    return { ok: true };
  };
  queries["audit:recent"] = (args) => {
    host.require("audit");
    pluginOn("audit-log");
    return plain(
      [...b.audit]
        .sort((x, y) => (y.createdAt as number) - (x.createdAt as number))
        .filter((e) => (!args.eventType || e.eventType === args.eventType) && (!args.targetType || e.targetType === args.targetType))
        .slice(0, Math.min((args.limit as number | undefined) ?? 100, 500)),
    );
  };

  // ── Propostas e contratos ─────────────────────────────────────────────
  const proposalsGuard = () => {
    const me = host.require("proposals");
    pluginOn("proposals");
    return me;
  };
  const forPanel = (p: DemoDoc & { password?: string }) => {
    const { password, ...rest } = p;
    return { ...plain(rest), hasPassword: !!password };
  };
  const CONTENT_KEYS = ["clientName", "title", "objective", "scope", "timeline", "deliveryDate", "investmentValue", "scopePrices", "originalValue", "giftIndexes", "paymentMethods", "conditions", "rescissionPolicy", "templateId"];
  const contentOf = (p: Data) => Object.fromEntries(CONTENT_KEYS.filter((k) => p[k] !== undefined).map((k) => [k, clone(p[k])]));
  const checkContent = (c: Data, creating: boolean) => {
    if ((creating || c.clientName !== undefined) && !String(c.clientName ?? "").trim()) throw new Error("clientName: informe o nome do cliente");
    if ((creating || c.title !== undefined) && !hasText(c.title)) throw new Error("title: preencha em pelo menos um idioma");
  };
  queries["proposals:list"] = (args) => {
    proposalsGuard();
    return b.proposals
      .filter((p) => (args.includeDeleted || p.deletedAt === undefined) && (args.filter === "accepted" ? p.isAccepted : args.filter === "pending" ? !p.isAccepted : true))
      .sort((x, y) => (y.createdAt as number) - (x.createdAt as number))
      .map(forPanel);
  };
  queries["proposals:get"] = (args) => (proposalsGuard(), b.proposals.find((p) => p._id === args.id) ? forPanel(b.proposals.find((p) => p._id === args.id)!) : null);
  queries["proposals:versions"] = (args) => (proposalsGuard(), plain(b.versions.filter((v) => v.proposalId === args.id).sort((x, y) => (y.version as number) - (x.version as number))));
  queries["proposals:getAcceptance"] = (args) => (proposalsGuard(), plain(b.acceptances.find((a) => a.proposalId === args.id) ?? null));
  mutations["proposals:create"] = (args) => {
    proposalsGuard();
    const { slug: given, password, expiresAt, ...content } = args as Data & { slug?: string; password?: string; expiresAt?: number };
    checkContent(content, true);
    validateDiscount({ investmentValue: content.investmentValue as number, originalValue: content.originalValue as number | undefined, scopePrices: content.scopePrices as (number | null)[] | undefined, giftIndexes: content.giftIndexes as number[] | undefined, scopeLength: (content.scope as unknown[]).length });
    let slug = given?.trim();
    if (slug) {
      assertValidSlug(slug);
      if (b.proposals.some((p) => p.slug === slug)) throw new Error(`O link "${slug}" já está em uso`);
    } else slug = `${slugify(String(content.clientName)).slice(0, 40) || "proposta"}-${Math.random().toString(36).slice(2, 10)}`;
    if (password !== undefined && password.length < 6) throw new Error("A senha da proposta precisa ter pelo menos 6 caracteres");
    const now = Date.now();
    const id = host.newId("pr");
    b.proposals.push({ ...clone(content), _id: id, _creationTime: now, slug, ...(password ? { password } : {}), version: 1, isAccepted: false, expiresAt: expiresAt ?? now + 10 * DAY, createdAt: now } as never);
    return id;
  };
  mutations["proposals:update"] = (args) => {
    proposalsGuard();
    const p = find(b.proposals, args.id, "Proposta");
    if (p.isAccepted) throw new Error("Proposta aceita não pode ser alterada");
    if (p.deletedAt !== undefined) throw new Error("A proposta está na lixeira");
    const patch = clone((args.patch ?? {}) as Data);
    checkContent(patch, false);
    for (const key of (args.unset as string[] | undefined) ?? []) {
      if (key in patch) throw new Error(`O campo "${key}" está no patch e no unset`);
      patch[key] = undefined;
    }
    const next = { ...contentOf(p), ...patch } as Data;
    validateDiscount({ investmentValue: next.investmentValue as number, originalValue: next.originalValue as number | undefined, scopePrices: next.scopePrices as (number | null)[] | undefined, giftIndexes: next.giftIndexes as number[] | undefined, scopeLength: (next.scope as unknown[]).length });
    if (args.password !== undefined && String(args.password).length < 6) throw new Error("A senha da proposta precisa ter pelo menos 6 caracteres");
    b.versions.push({ _id: host.newId("pv"), _creationTime: Date.now(), proposalId: p._id, version: p.version, content: contentOf(p), createdAt: Date.now() } as never);
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined) delete p[k];
      else p[k] = v;
    }
    if (args.password !== undefined) p.password = args.password as string;
    if (args.expiresAt !== undefined) p.expiresAt = args.expiresAt;
    p.version = (p.version as number) + 1;
    p.updatedAt = Date.now();
    return null;
  };
  mutations["proposals:resetPassword"] = (args) => {
    proposalsGuard();
    const p = find(b.proposals, args.id, "Proposta");
    if (args.newPassword !== undefined && String(args.newPassword).length < 6) throw new Error("A senha da proposta precisa ter pelo menos 6 caracteres");
    if (args.newPassword) p.password = args.newPassword as string;
    else delete p.password;
    return null;
  };
  mutations["proposals:remove"] = (args) => {
    host.requireRoles(["root", "admin", "comercial"]);
    const p = find(b.proposals, args.id, "Proposta");
    if (p.isAccepted) throw new Error("Proposta aceita não pode ser apagada");
    p.deletedAt = Date.now();
    return null;
  };
  mutations["proposals:restore"] = (args) => (host.require("purge"), delete find(b.proposals, args.id, "Proposta").deletedAt, null);
  mutations["proposals:removePermanently"] = (args) => {
    host.require("purge");
    const p = find(b.proposals, args.id, "Proposta");
    if (p.isAccepted) throw new Error("Proposta aceita não pode ser apagada");
    b.proposals = b.proposals.filter((x) => x._id !== p._id);
    b.versions = b.versions.filter((v) => v.proposalId !== p._id);
    return null;
  };

  const templatesGuard = (write: boolean) => {
    host.require(write ? "contracts" : "proposals");
    pluginOn("proposals");
    pluginOn("contract-templates");
  };
  queries["contractTemplates:list"] = () => (templatesGuard(false), plain([...b.templates].sort((x, y) => Number(y.isDefault) - Number(x.isDefault) || String(x.name).localeCompare(String(y.name)))));
  mutations["contractTemplates:create"] = (args) => {
    templatesGuard(true);
    if (!String(args.name ?? "").trim()) throw new Error("name: informe o nome do modelo");
    const isDefault = (args.isDefault as boolean | undefined) ?? b.templates.length === 0;
    if (isDefault) for (const t of b.templates) t.isDefault = false;
    const now = Date.now();
    const id = host.newId("ct");
    b.templates.push({ _id: id, _creationTime: now, name: String(args.name).trim(), description: args.description, content: args.content, isDefault, createdAt: now, updatedAt: now } as DemoDoc);
    return id;
  };
  mutations["contractTemplates:update"] = (args) => {
    templatesGuard(true);
    const t = find(b.templates, args.id, "Modelo de contrato");
    if (args.name !== undefined && !String(args.name).trim()) throw new Error("name: informe o nome do modelo");
    for (const k of ["name", "description", "content"]) if (args[k] !== undefined) t[k] = args[k];
    t.updatedAt = Date.now();
    return null;
  };
  mutations["contractTemplates:remove"] = (args) => (templatesGuard(true), find(b.templates, args.id, "Modelo de contrato"), (b.templates = b.templates.filter((t) => t._id !== args.id)), null);
  mutations["contractTemplates:setDefault"] = (args) => {
    templatesGuard(true);
    const t = find(b.templates, args.id, "Modelo de contrato");
    for (const x of b.templates) x.isDefault = false;
    t.isDefault = true;
    return null;
  };

  // ── Pagamentos ────────────────────────────────────────────────────────
  const paymentsGuard = () => {
    host.require("checkouts");
    pluginOn("payments");
  };
  queries["checkouts:list"] = (args) => {
    paymentsGuard();
    return plain(b.checkouts.filter((c) => (args.includeDeleted || c.deletedAt === undefined) && (!args.status || c.status === args.status)).sort((x, y) => (y.createdAt as number) - (x.createdAt as number)));
  };
  mutations["checkouts:create"] = (args) => {
    paymentsGuard();
    if (!(Number(args.value) >= 5)) throw new Error("O valor mínimo de uma cobrança é R$ 5,00.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(args.dueDate))) throw new Error("Vencimento inválido: use AAAA-MM-DD.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(args.customerEmail ?? "").trim())) throw new Error("E-mail do cliente inválido.");
    if (!String(args.customerName ?? "").trim()) throw new Error("Informe o nome do cliente.");
    const now = Date.now();
    const id = host.newId("ck");
    b.checkouts.push({ ...clone(args), _id: id, _creationTime: now, uniqueLink: (args.uniqueLink as string | undefined) ?? `${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`.slice(0, 24).padEnd(16, "x"), status: "pending", expiresAt: (args.expiresAt as number | undefined) ?? now + 7 * DAY, createdAt: now } as DemoDoc);
    return id;
  };
  mutations["checkouts:remove"] = (args) => {
    paymentsGuard();
    const c = find(b.checkouts, args.id, "Checkout");
    if (c.status === "paid") throw new Error("Checkout pago não pode ser apagado");
    c.deletedAt = Date.now();
    return null;
  };
  mutations["checkouts:restore"] = (args) => (host.require("purge"), delete find(b.checkouts, args.id, "Checkout").deletedAt, null);
  queries["checkouts:listLinks"] = () => (paymentsGuard(), plain([...b.links].sort((x, y) => (y.createdAt as number) - (x.createdAt as number))));
  mutations["checkouts:linkPlan"] = (args) => {
    paymentsGuard();
    const plan = find(state.collections.plans, args.planId, "Plano");
    const cents = plan.priceCents as number | undefined;
    const period = plan.period as string | undefined;
    if (cents === undefined || cents < 500 || (plan.currency && plan.currency !== "BRL") || (period && period !== "once" && period !== "project")) {
      throw new Error("O plano precisa de preço em reais (mínimo R$ 5,00) e pagamento único para virar link de pagamento.");
    }
    let link = b.links.find((l) => l.planId === plan._id);
    const now = Date.now();
    if (link) Object.assign(link, { active: true, billingType: args.billingType, updatedAt: now });
    else {
      link = { _id: host.newId("pl"), _creationTime: now, uniqueLink: `plano-${plan._id}-${Math.random().toString(36).slice(2, 10)}`.slice(0, 40).padEnd(16, "x"), planId: plan._id, billingType: args.billingType, active: true, createdAt: now } as DemoDoc;
      b.links.push(link);
    }
    const href = `/checkout/${link.uniqueLink}`;
    const label = (plan.cta as { label?: Localized<string> } | undefined)?.label ?? Object.fromEntries(state.settings.locales.locales.map((l) => [l, l.startsWith("pt") ? "Contratar" : "Get started"]));
    plan.cta = { label, href };
    plan.updatedAt = now;
    return { uniqueLink: link.uniqueLink as string, href };
  };
  mutations["checkouts:unlinkPlan"] = (args) => {
    paymentsGuard();
    const link = b.links.find((l) => l.planId === args.planId);
    if (!link) return null;
    link.active = false;
    const plan = state.collections.plans.find((p) => p._id === args.planId);
    if (plan && (plan.cta as { href?: string } | undefined)?.href === `/checkout/${link.uniqueLink}`) delete plan.cta;
    return null;
  };

  // ── Currículos com IA ─────────────────────────────────────────────────
  const aiGuard = () => {
    host.requireRoles(["root"]);
    pluginOn("ai-resumes");
  };
  queries["aiResumes:list"] = (args) => (aiGuard(), plain(b.aiResumes.filter((r) => args.includeDeleted || r.deletedAt === undefined).sort((x, y) => (y.createdAt as number) - (x.createdAt as number))));
  actions["aiResumes:generate"] = (args) => {
    aiGuard();
    if (!String(args.title ?? "").trim()) throw new Error("Dê um título ao currículo (ex.: a vaga e a empresa).");
    const job = String(args.jobDescription ?? "").trim();
    if (!job) throw new Error("Cole a descrição da vaga.");
    if (job.length > 8000) throw new Error("A descrição da vaga passa de 8000 caracteres.");
    const id = host.newId("ai");
    const now = Date.now();
    const score = 55 + (job.length % 40);
    b.aiResumes.push({ _id: id, _creationTime: now, title: String(args.title).trim(), locale: args.locale, jobDescription: job, fitScore: score, fitComment: "Currículo gerado na demonstração: na versão real, três chamadas à IA analisam a vaga e reescrevem o seu currículo.", strengths: ["Experiência alinhada com a vaga", "Competências em destaque"], weaknesses: ["Detalhe os resultados com números"], createdAt: now } as DemoDoc);
    return { id };
  };
  mutations["aiResumes:remove"] = (args) => (aiGuard(), (find(b.aiResumes, args.id, "Currículo").deletedAt = Date.now()), null);
  mutations["aiResumes:restore"] = (args) => (host.require("purge"), delete find(b.aiResumes, args.id, "Currículo").deletedAt, null);

  // ── Tradução (fictícia) ───────────────────────────────────────────────
  actions["translation:translate"] = (args) => {
    host.requireRoles(["root", "admin", "content-editor", "blog-editor"]);
    pluginOn("translation");
    return `[${args.to as string}] ${args.text as string}`;
  };

  return { queries, mutations, actions };
}
