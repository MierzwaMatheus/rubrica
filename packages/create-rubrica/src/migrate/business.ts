/**
 * Conversão das tabelas de negócio da v1 para as da v2 (contatos, depoimentos enviados,
 * propostas, aceites, modelos de contrato, checkouts e currículos com IA). Função pura,
 * chamada pelo `convertV1`.
 *
 * - Os ids continuam (as tabelas herdam o número da tabela da v1): propostas, versões e
 *   aceites seguem ligados, e checkouts, depoimentos e currículos apontam para os mesmos
 *   usuários e itens.
 * - Aceites de proposta vão como estão: o `contentSnapshot` e o `contentHash` são a prova
 *   do aceite e não podem mudar.
 * - Checkouts mantêm o estado e os ids do Asaas: pago continua pago, e o webhook do Asaas
 *   continua achando o checkout pelo `asaasChargeId`.
 * - Envios públicos da v1 (contato, depoimento) não registravam consentimento. Eles vão
 *   com o consentimento marcado como **anterior à v2** (`V1_CONSENT`): política 0 (o site
 *   ainda não tinha política), idioma e página desconhecidos, sem hash de IP. Nada é
 *   inventado: o único instante que se sabe é o do envio.
 */
import { EN, loc, PT } from "./convert.js";

type Doc = Record<string, any>;
type Loc = Record<string, string>;

/**
 * Marca dos envios da v1 no consentimento (`consent`) e no bloco de origem. `und` é o
 * código BCP 47 de idioma indeterminado; `policyVersion: 0` é "sem política vigente".
 */
export const V1_CONSENT = { locale: "und", page: "v1", policyVersion: 0, ipHash: "v1:anterior-a-v2" } as const;
export const V1_BLOCK_ID = "v1";

/** Pedidos de contato mais antigos que isto o cron da v2 apaga (RUBRICA_CONTACT_RETENTION_DAYS, padrão). */
export const CONTACT_RETENTION_DAYS = 730;

export interface BusinessReport {
  /** Linha por tabela da v2, para a tabela do relatório. */
  tables: { v2: string; from: string; count: number }[];
  /** Documentos que ficaram de fora de propósito (lixeira da v1, recusados, sessões). */
  dropped: { table: string; count: number; reason: string }[];
  /** Documentos sem destino na v2, guardados como estavam (pendentes-v1.zip). */
  pending: { table: string; count: number; reason: string }[];
  warnings: string[];
}

export interface BusinessResult {
  tables: Record<string, Doc[]>;
  /** Tabela da v1 de onde veio cada tabela da v2 (mantém o número da tabela). */
  sources: Record<string, string>;
  pending: Record<string, Doc[]>;
  report: BusinessReport;
}

/** Tabelas de negócio da v1 que esta conversão lê. */
export const BUSINESS_TABLES = [
  "contactRequests",
  "testimonialSubmissions",
  "proposals",
  "proposalVersions",
  "proposalSessions",
  "proposalAcceptances",
  "contractTemplates",
  "checkouts",
  "aiGeneratedResumes",
] as const;

const str = (v: unknown): string | undefined => (typeof v === "string" && v.trim() ? v : undefined);

/** Tira só os `undefined` (objetos vazios ficam: `{}` é um texto traduzido válido). */
function defined<T extends Doc>(doc: T): T {
  return Object.fromEntries(Object.entries(doc).filter(([, v]) => v !== undefined)) as T;
}

const meta = (d: Doc) => ({ _id: d._id, _creationTime: d._creationTime });

/** Lista de textos com a tradução em `{ ptBR: [], enUS: [] }`. */
function locList(base: unknown, translations: unknown): Loc[] {
  const list = Array.isArray(base) ? base : [];
  const en = (translations as Doc | undefined)?.enUS;
  return list.map((item, i) => loc(item, { enUS: Array.isArray(en) ? en[i] : undefined }));
}

/** Valor curto para o mapa `details` do contato. */
function shortValue(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "string") return str(value);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map((v) => shortValue(v)).filter(Boolean).join(", ") || undefined;
  return JSON.stringify(value);
}

// ── Contatos ────────────────────────────────────────────────────────────────

const FREE_TEXT = ["description", "message"];
const CONTACT_STATUS: Record<string, "new" | "read" | "archived"> = { new: "new", read: "read", contacted: "read", in_progress: "read", closed: "read", archived: "archived" };

export function convertContact(d: Doc): Doc {
  const info = (d.contactInfo ?? {}) as Doc;
  const answers = (d.answers && typeof d.answers === "object" ? d.answers : {}) as Doc;
  const details: Record<string, string> = {};
  const put = (k: string, v: unknown) => {
    const s = shortValue(v);
    if (s) details[k] = s;
  };
  put("tipo", d.type);
  for (const [k, v] of Object.entries(answers)) if (!FREE_TEXT.includes(k)) put(k, v);
  put("empresa", info.company);
  put("linkedin", info.linkedin);
  put("origem", d.sourceContext);
  if (d.status && CONTACT_STATUS[d.status] !== d.status) put("situacaoV1", d.status);
  put("notas", d.adminNotes);
  put("atendidoPor", d.handledBy);
  // A mensagem é o texto livre do assistente; sem ele, as respostas em linhas.
  const free = FREE_TEXT.map((k) => str(answers[k])).filter(Boolean) as string[];
  const message = free.length
    ? free.join("\n\n")
    : Object.entries(answers)
        .map(([k, v]) => (shortValue(v) ? `${k}: ${shortValue(v)}` : ""))
        .filter(Boolean)
        .join("\n");
  const createdAt = typeof d.createdAt === "number" ? d.createdAt : d._creationTime;
  return defined({
    ...meta(d),
    name: String(info.name ?? "").trim(),
    email: String(info.email ?? "").trim().toLowerCase(),
    phone: str(info.phone),
    message,
    details: Object.keys(details).length ? details : undefined,
    locale: V1_CONSENT.locale,
    blockId: V1_BLOCK_ID,
    page: V1_CONSENT.page,
    status: CONTACT_STATUS[d.status] ?? "new",
    consent: { acceptedAt: createdAt, ...V1_CONSENT },
    createdAt,
    updatedAt: d.updatedAt,
  });
}

// ── Depoimentos enviados ────────────────────────────────────────────────────

export function convertSubmission(d: Doc): Doc {
  const createdAt = typeof d.createdAt === "number" ? d.createdAt : d._creationTime;
  const published = d.status === "published" || (d.status === "approved" && d.testimonialId);
  return defined({
    ...meta(d),
    name: String(d.name ?? "").trim(),
    email: String(d.email ?? "").trim().toLowerCase(),
    role: str(d.role),
    company: str(d.company),
    quote: String(d.text ?? ""),
    locale: V1_CONSENT.locale,
    blockId: V1_BLOCK_ID,
    page: V1_CONSENT.page,
    // Na v2, aprovar cria o item na coleção: aprovado sem item na v1 volta para a fila.
    status: published ? "approved" : "pending",
    testimonialId: published ? d.testimonialId : undefined,
    consent: { acceptedAt: createdAt, ...V1_CONSENT },
    createdAt,
    reviewedAt: published ? d.reviewedAt : undefined,
    reviewedBy: published ? d.reviewedBy : undefined,
  });
}

// ── Propostas ───────────────────────────────────────────────────────────────

/** Conteúdo editável da proposta (`proposalContentFields` da v2) a partir dos campos da v1. */
export function proposalContent(d: Doc): Doc {
  const tl = d.timelineTranslations as Doc | Doc[] | undefined;
  const tlEn: Doc[] | undefined = Array.isArray(tl) ? tl : Array.isArray((tl as Doc | undefined)?.enUS) ? (tl as Doc).enUS : undefined;
  return defined({
    clientName: String(d.clientName ?? ""),
    title: loc(d.title, d.titleTranslations),
    objective: loc(d.objective, d.objectiveTranslations),
    scope: locList(d.scope, d.scopeTranslations),
    timeline: (Array.isArray(d.timeline) ? d.timeline : []).map((t: Doc, i: number) => ({ step: loc(t.step, { enUS: tlEn?.[i]?.step }), period: loc(t.period, { enUS: tlEn?.[i]?.period }) })),
    deliveryDate: String(d.deliveryDate ?? ""),
    investmentValue: Number(d.investmentValue ?? 0),
    scopePrices: Array.isArray(d.scopePrices) ? d.scopePrices : undefined,
    originalValue: typeof d.originalValue === "number" ? d.originalValue : undefined,
    giftIndexes: Array.isArray(d.giftIndexes) ? d.giftIndexes : undefined,
    // A v1 não traduzia as formas de pagamento.
    paymentMethods: (Array.isArray(d.paymentMethods) ? d.paymentMethods : []).map((p: unknown) => loc(p)),
    conditions: locList(d.conditions, d.conditionsTranslations),
    rescissionPolicy: loc(d.rescissionPolicy, d.rescissionPolicyTranslations),
    templateId: d.templateId,
  });
}

export function convertProposal(d: Doc): Doc {
  return defined({
    ...meta(d),
    ...proposalContent(d),
    slug: d.slug,
    // Mesmo formato (pbkdf2:<sal>:<hash>) e mesmas iterações: a senha continua valendo.
    password: str(d.password),
    templateSnapshot: typeof d.templateSnapshot === "string" ? d.templateSnapshot : undefined,
    version: d.version ?? 1,
    isAccepted: d.isAccepted === true,
    acceptedAt: d.acceptedAt,
    expiresAt: d.expiresAt,
    createdAt: typeof d.createdAt === "number" ? d.createdAt : d._creationTime,
    createdBy: d.userId,
    updatedAt: d.updatedAt,
    deletedAt: d.deletedAt,
    deletedBy: d.deletedBy,
  });
}

/** Versão antiga: o `contentSnapshot` (JSON) sobre a proposta atual. `null` se não der para ler. */
export function convertProposalVersion(d: Doc, proposal: Doc | undefined): Doc | null {
  if (!proposal) return null;
  let snap: Doc;
  try {
    snap = JSON.parse(String(d.contentSnapshot)) as Doc;
  } catch {
    return null;
  }
  const fields = (snap && typeof snap === "object" && snap.proposal && typeof snap.proposal === "object" ? snap.proposal : snap) as Doc;
  if (!fields || typeof fields !== "object" || Array.isArray(fields)) return null;
  // Campos que a versão não trouxe ficam como na proposta.
  const { _id: _i, _creationTime: _c, ...base } = proposal;
  void _i;
  void _c;
  return defined({ ...meta(d), proposalId: d.proposalId, version: d.version, content: proposalContent({ ...base, ...fields }), createdAt: d.createdAt ?? d._creationTime, createdBy: d.createdBy });
}

/** Aceite como estava (prova do aceite), sem a sessão (as sessões não vão para a v2). */
export function convertAcceptance(d: Doc): Doc {
  const { sessionId: _s, ...rest } = d;
  void _s;
  return rest;
}

// ── Conversão ───────────────────────────────────────────────────────────────

export function convertBusiness(tables: Record<string, Doc[]>, now: number): BusinessResult {
  const out: Record<string, Doc[]> = {};
  const sources: Record<string, string> = {};
  const pending: Record<string, Doc[]> = {};
  const report: BusinessReport = { tables: [], dropped: [], pending: [], warnings: [] };
  const put = (v2: string, from: string, docs: Doc[]) => {
    if (!tables[from]) return;
    out[v2] = docs;
    sources[v2] = from;
    report.tables.push({ v2, from, count: docs.length });
  };
  const drop = (table: string, count: number, reason: string) => count && report.dropped.push({ table, count, reason });
  const keep = (table: string, docs: Doc[], reason: string) => {
    if (!docs.length) return;
    pending[table] = [...(pending[table] ?? []), ...docs];
    report.pending.push({ table, count: docs.length, reason });
  };

  // Contatos: os da lixeira da v1 não voltam (a v2 apaga de vez).
  const contacts = tables.contactRequests ?? [];
  const liveContacts = contacts.filter((d) => d.deletedAt === undefined);
  put("contactRequests", "contactRequests", liveContacts.map(convertContact));
  drop("contactRequests", contacts.length - liveContacts.length, "na lixeira da v1: a v2 não tem lixeira de contatos");
  if (liveContacts.length) {
    report.warnings.push(`Contatos: ${liveContacts.length} pedido(s) da v1 vão com o consentimento marcado como anterior à v2 (política 0, sem hash de IP: a v1 guardava o IP, que não vai). As respostas do assistente ficam em "detalhes".`);
    const limit = now - CONTACT_RETENTION_DAYS * 24 * 60 * 60 * 1000;
    const old = liveContacts.filter((d) => (d.createdAt ?? d._creationTime) < limit).length;
    if (old) report.warnings.push(`Contatos: ${old} pedido(s) têm mais de ${CONTACT_RETENTION_DAYS} dias e o cron de retenção da v2 vai apagá-los depois do import (exporte antes, se precisar guardar, ou aumente RUBRICA_CONTACT_RETENTION_DAYS).`);
  }

  // Depoimentos enviados.
  const subs = tables.testimonialSubmissions ?? [];
  const rejected = subs.filter((d) => d.status === "rejected");
  const videos = subs.filter((d) => d.status !== "rejected" && (d.type === "video" || !str(d.text)));
  const texts = subs.filter((d) => !rejected.includes(d) && !videos.includes(d));
  put("testimonialSubmissions", "testimonialSubmissions", texts.map(convertSubmission));
  drop("testimonialSubmissions", rejected.length, "recusados na v1: a v2 apaga o envio ao recusar");
  keep("testimonialSubmissions", videos, "depoimentos em vídeo (ou sem texto): a v2 só recebe depoimento em texto");
  const requeued = texts.filter((d) => d.status === "approved" && !d.testimonialId).length;
  if (requeued) report.warnings.push(`Depoimentos enviados: ${requeued} aprovado(s) na v1 sem item publicado voltam para a fila (na v2, aprovar já cria o depoimento).`);
  const withAvatar = texts.filter((d) => d.avatarStorageId || str(d.imageUrl)).length;
  if (withAvatar) report.warnings.push(`Depoimentos enviados: a foto de ${withAvatar} envio(s) não tem campo na v2 (o arquivo continua na biblioteca do Convex); ponha no depoimento ao aprovar.`);

  // Modelos de contrato: um padrão só (o mais recente, se a v1 tinha vários).
  const templates = (tables.contractTemplates ?? []).map((d) => ({ ...d }));
  const defaults = templates.filter((d) => d.isDefault === true).sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
  if (defaults.length > 1) {
    for (const d of defaults.slice(1)) d.isDefault = false;
    report.warnings.push(`Modelos de contrato: a v1 tinha ${defaults.length} padrões; ficou como padrão "${defaults[0]!.name}" (o editado por último).`);
  }
  put("contractTemplates", "contractTemplates", templates.map((d) => defined({ ...meta(d), name: d.name, description: str(d.description), content: String(d.content ?? ""), isDefault: d.isDefault === true, createdAt: d.createdAt ?? d._creationTime, updatedAt: d.updatedAt ?? d.createdAt ?? d._creationTime })));

  // Propostas, versões, sessões e aceites.
  const proposals = tables.proposals ?? [];
  put("proposals", "proposals", proposals.map(convertProposal));
  const byId = new Map(proposals.map((p) => [p._id, p]));
  const versions = tables.proposalVersions ?? [];
  const okVersions: Doc[] = [];
  const badVersions: Doc[] = [];
  for (const d of versions) {
    const converted = convertProposalVersion(d, byId.get(d.proposalId));
    if (converted) okVersions.push(converted);
    else badVersions.push(d);
  }
  put("proposalVersions", "proposalVersions", okVersions);
  keep("proposalVersions", badVersions, "versão sem proposta ou com o conteúdo ilegível");
  drop("proposalSessions", (tables.proposalSessions ?? []).length, "sessões de proposta: expiram (o cliente digita a senha de novo)");
  put("proposalAcceptances", "proposalAcceptances", (tables.proposalAcceptances ?? []).map(convertAcceptance));
  const accepted = proposals.filter((p) => p.isAccepted && !str(p.templateSnapshot) && p.templateId === undefined).length;
  if (accepted) report.warnings.push(`Propostas: ${accepted} aceita(s) sem contrato congelado e sem modelo escolhido mostram o modelo padrão atual (como na v1).`);

  // Checkouts: como estavam (estado, valores e ids do Asaas).
  put("checkouts", "checkouts", (tables.checkouts ?? []).map((d) => ({ ...d })));
  const open = (tables.checkouts ?? []).filter((d) => (d.status === "pending" || d.status === "payment_selected") && d.asaasChargeId).length;
  if (open) report.warnings.push(`Checkouts: ${open} com cobrança aberta no Asaas. O webhook do Asaas precisa apontar para o Convex da v2 (<CONVEX_SITE_URL>/webhooks/asaas) antes de o cliente pagar, senão o pagamento não é confirmado.`);

  // Currículos com IA.
  const aiLocales: Record<string, string> = { "pt-BR": PT, "en-US": EN };
  put("aiResumes", "aiGeneratedResumes", (tables.aiGeneratedResumes ?? []).map((d) => ({ ...d, locale: aiLocales[d.locale] ?? d.locale })));

  return { tables: out, sources, pending, report };
}
