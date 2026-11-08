/**
 * Referências às funções do backend que o painel chama. O painel vive no pacote e não
 * enxerga o `convex/_generated` do projeto, então monta as referências pelo nome
 * (`rubrica/<módulo>:<função>`, ver `MODULE_DIR`), com os tipos escritos aqui.
 */
import { makeFunctionReference, type FunctionReference } from "convex/server";
import type { BlockInstance, CollectionName, SeoFields, SiteKind, SiteSettings } from "../../content/types";
import type { Localized } from "../../i18n";
import type { Role } from "../../convex/lib/roles";
import type { SiteSnapshot } from "../../data/source";
import type { BlockError } from "../editor/model";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Args = Record<string, any>;
type Q<A extends Args, R> = FunctionReference<"query", "public", A, R>;
type M<A extends Args, R> = FunctionReference<"mutation", "public", A, R>;
type Act<A extends Args, R> = FunctionReference<"action", "public", A, R>;
type Empty = Record<string, never>;

const q = <A extends Args, R>(module: string, name: string) => makeFunctionReference<"query", A, R>(`rubrica/${module}:${name}`) as Q<A, R>;
const m = <A extends Args, R>(module: string, name: string) => makeFunctionReference<"mutation", A, R>(`rubrica/${module}:${name}`) as M<A, R>;
const a = <A extends Args, R>(module: string, name: string) => makeFunctionReference<"action", A, R>(`rubrica/${module}:${name}`) as Act<A, R>;

export interface Me {
  userId: string;
  email: string | null;
  name: string | null;
  role: Role | null;
  mustChangePassword: boolean;
}

export interface UserRow {
  userId: string;
  email: string | null;
  name: string | null;
  createdAt: number;
  role: Role | null;
}

export interface PageDoc {
  _id: string;
  _creationTime: number;
  path: string;
  title: Localized<string>;
  seo?: SeoFields;
  blocks: BlockInstance[];
  published: boolean;
  system?: boolean;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
}

export interface PluginRow {
  id: string;
  label: string;
  description: string;
  requires: string[];
  enabled: boolean;
}

export interface MediaDoc {
  _id: string;
  _creationTime: number;
  storageId: string;
  name: string;
  folder: string;
  alt?: Localized<string>;
  width?: number;
  height?: number;
  size?: number;
  contentType?: string;
  createdAt: number;
  url: string | null;
}

export interface MediaUsage {
  type: string;
  id: string;
  label: string;
  count: number;
}

export interface PageValidation {
  blockErrors: BlockError[];
  pathError?: string;
  titleError?: string;
}

/** Item de coleção como o `list` devolve (formato do banco, campos variam por coleção). */
export type CollectionDoc = Record<string, unknown> & { _id: string; published?: boolean; deletedAt?: number };


// ── Negócio ────────────────────────────────────────────────────────────────

export type ContactStatus = "new" | "read" | "archived";
export type DestinationId = "telegram" | "email" | "webhook";

export interface DeliveryDoc {
  _id: string;
  destination: DestinationId;
  status: "pending" | "sent" | "failed";
  attempts: number;
  lastError?: string;
  lastAttemptAt?: number;
  nextAttemptAt?: number;
  sentAt?: number;
  /** Só nas falhas listadas à parte. */
  source?: "contact" | "testimonial";
  sourceId?: string;
  createdAt?: number;
}

export interface ContactDoc {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  details?: Record<string, string>;
  locale: string;
  page: string;
  status: ContactStatus;
  spam?: boolean;
  createdAt: number;
  readAt?: number;
  archivedAt?: number;
  deliveries: DeliveryDoc[];
}

export interface ContactDestinations {
  telegram: boolean;
  email: { enabled: boolean; to: string[] };
  webhook: { enabled: boolean; url?: string };
  /** O que falta no ambiente (variáveis) para cada destino. */
  missing: Record<DestinationId, string[]>;
}

export interface TestimonialSubmission {
  _id: string;
  name: string;
  email: string;
  role?: string;
  company?: string;
  quote: string;
  locale: string;
  page: string;
  status: "pending" | "approved";
  createdAt: number;
}

export interface PrivacyExport {
  email: string;
  generatedAt: number;
  total: number;
  sources: { id: string; label: string; records: unknown[] }[];
}

export interface PolicyStatus {
  path: string;
  exists: boolean;
  pageId: string | null;
  published: boolean;
  version: number;
  updatedAt: number | null;
}

export type PublishState = "unconfigured" | "publishing" | "pending" | "published" | "failed";
export interface PublishStatus {
  status: PublishState;
  configured: boolean;
  pendingChanges: number;
  lastTriggeredAt: number | null;
  lastPublishedAt: number | null;
  lastError: string | null;
  nextAllowedAt: number;
}

export interface AuditEntry {
  _id: string;
  eventType: string;
  actorType: string;
  actorId?: string;
  actorEmail: string | null;
  targetType?: string;
  targetId?: string;
  metadata?: unknown;
  success: boolean;
  createdAt: number;
}

export interface TimelineItem {
  step: Localized<string>;
  period: Localized<string>;
}

/** Conteúdo de uma proposta (o que o painel edita e o histórico guarda). */
export interface ProposalContent {
  clientName: string;
  title: Localized<string>;
  objective: Localized<string>;
  scope: Localized<string>[];
  timeline: TimelineItem[];
  deliveryDate: string;
  /** Valor final, em reais. */
  investmentValue: number;
  scopePrices?: (number | null)[];
  originalValue?: number;
  giftIndexes?: number[];
  paymentMethods: Localized<string>[];
  conditions: Localized<string>[];
  rescissionPolicy: Localized<string>;
  templateId?: string;
}

export interface ProposalDoc extends ProposalContent {
  _id: string;
  slug: string;
  hasPassword: boolean;
  version: number;
  isAccepted: boolean;
  acceptedAt?: number;
  expiresAt: number;
  createdAt: number;
  updatedAt?: number;
  deletedAt?: number;
}

export interface ProposalVersion {
  _id: string;
  proposalId: string;
  version: number;
  content: ProposalContent;
  createdAt: number;
}

export interface ProposalAcceptance {
  _id: string;
  clientName: string;
  clientDocument: string;
  clientEmail: string;
  clientRole?: string;
  clientDeclaration?: string;
  proposalVersion: number;
  locale?: string;
  contentHash: string;
  ipAddress: string;
  userAgent: string;
  acceptedAt: number;
  signatureUrl: string | null;
}

export interface ContractTemplate {
  _id: string;
  name: string;
  description?: string;
  content: string;
  isDefault: boolean;
  createdAt: number;
  updatedAt: number;
}

export type BillingType = "PIX" | "BOLETO" | "CREDIT_CARD";
export type CheckoutStatus = "pending" | "payment_selected" | "payment_confirmed" | "paid" | "expired" | "failed" | "refunded";

export interface CheckoutDoc {
  _id: string;
  uniqueLink: string;
  customerName: string;
  customerEmail: string;
  value: number;
  description?: string;
  dueDate: string;
  billingType?: BillingType;
  status: CheckoutStatus;
  paymentMethod?: string;
  planId?: string;
  proposalId?: string;
  paidValue?: number;
  expiresAt: number;
  createdAt: number;
  completedAt?: number;
  deletedAt?: number;
}

export interface PaymentLink {
  _id: string;
  uniqueLink: string;
  planId: string;
  billingType?: BillingType;
  active: boolean;
  createdAt: number;
}

export interface AiResume {
  _id: string;
  title: string;
  locale: string;
  jobDescription: string;
  fitScore: number;
  fitComment: string;
  strengths: string[];
  weaknesses: string[];
  createdAt: number;
  deletedAt?: number;
}

type SettingsPatch = Partial<Omit<SiteSettings, "kind">> & { kind?: SiteKind };

export const api = {
  users: {
    isSetupRequired: q<Empty, boolean>("users", "isSetupRequired"),
    me: q<Empty, Me | null>("users", "me"),
    list: q<Empty, UserRow[]>("users", "list"),
    create: a<{ name: string; email: string; role: Exclude<Role, "root"> }, { userId: string; tempPassword: string }>("users", "create"),
    setRole: m<{ userId: string; role: Role }, null>("users", "setRole"),
    remove: m<{ userId: string }, null>("users", "remove"),
    changePassword: a<{ newPassword: string }, null>("users", "changePassword"),
  },
  settings: {
    get: q<Empty, SiteSettings | null>("settings", "get"),
    plugins: q<Empty, PluginRow[]>("settings", "plugins"),
    update: m<{ patch: SettingsPatch }, null>("settings", "update"),
    setPlugin: m<{ id: string; enabled: boolean }, null>("settings", "setPlugin"),
  },
  texts: {
    list: q<Empty, Record<string, Localized<string>>>("texts", "list"),
    set: m<{ key: string; value: Localized<string> }, null>("texts", "set"),
    reset: m<{ key: string }, null>("texts", "reset"),
  },
  media: {
    generateUploadUrl: m<Empty, string>("media", "generateUploadUrl"),
    save: m<{ storageId: string; name: string; folder?: string; alt?: Localized<string>; width?: number; height?: number }, { id: string; url: string | null }>("media", "save"),
    list: q<{ folder?: string }, MediaDoc[]>("media", "list"),
    folders: q<Empty, { path: string; count: number }[]>("media", "folders"),
    update: m<{ id: string; name?: string; folder?: string; alt?: Localized<string>; width?: number; height?: number }, null>("media", "update"),
    remove: m<{ id: string }, null>("media", "remove"),
  },
  pages: {
    list: q<{ includeDeleted?: boolean }, PageDoc[]>("pages", "list"),
    get: q<{ id: string }, PageDoc | null>("pages", "get"),
    create: m<{ path: string; title: Localized<string>; seo?: SeoFields; blocks?: BlockInstance[]; published?: boolean }, string>("pages", "create"),
    update: m<{ id: string; path?: string; title?: Localized<string>; seo?: SeoFields; clearSeo?: boolean; blocks?: BlockInstance[] }, null>("pages", "update"),
    publish: m<{ id: string }, null>("pages", "publish"),
    unpublish: m<{ id: string }, null>("pages", "unpublish"),
    remove: m<{ id: string }, null>("pages", "remove"),
  },
  site: {
    snapshot: q<Empty, SiteSnapshot>("site", "snapshot"),
  },
  panel: {
    validatePage: q<{ blocks: BlockInstance[]; path?: string; title?: Localized<string>; pageId?: string }, PageValidation>("panel", "validatePage"),
    mediaUsage: q<{ id: string }, MediaUsage[]>("panel", "mediaUsage"),
    replaceMedia: m<{ id: string; storageId: string; width?: number; height?: number }, { url: string; updated: number }>("panel", "replaceMedia"),
  },
  /**
   * Plugin `translation` (decisão 32): ponto "traduzir este campo". A action pode não
   * existir no backend ainda; o painel trata a ausência (`isMissingFunction`).
   */
  translation: {
    translate: a<{ text: string; from: string; to: string; html?: boolean }, string>("translation", "translate"),
  },
  collection: (name: CollectionName) => ({
    list: q<{ includeDeleted?: boolean }, CollectionDoc[]>(name, "list"),
    get: q<{ id: string }, CollectionDoc | null>(name, "get"),
    create: m<Args, string>(name, "create"),
    update: m<{ id: string; patch: Args; unset?: string[] }, null>(name, "update"),
    publish: m<{ id: string }, null>(name, "publish"),
    unpublish: m<{ id: string }, null>(name, "unpublish"),
    reorder: m<{ ids: string[] }, null>(name, "reorder"),
    remove: m<{ id: string }, null>(name, "remove"),
    restore: m<{ id: string }, null>(name, "restore"),
    removePermanently: m<{ id: string }, null>(name, "removePermanently"),
  }),
  contacts: {
    list: q<{ status?: ContactStatus; limit?: number }, ContactDoc[]>("contacts", "list"),
    get: q<{ id: string }, ContactDoc | null>("contacts", "get"),
    unreadCount: q<Empty, number>("contacts", "unreadCount"),
    markRead: m<{ id: string }, null>("contacts", "markRead"),
    markUnread: m<{ id: string }, null>("contacts", "markUnread"),
    archive: m<{ id: string }, null>("contacts", "archive"),
    unarchive: m<{ id: string }, null>("contacts", "unarchive"),
    remove: m<{ id: string }, null>("contacts", "remove"),
    destinations: q<Empty, ContactDestinations>("contacts", "destinations"),
    setDestinations: m<{ telegram: boolean; email: { enabled: boolean; to: string[] }; webhook: { enabled: boolean; url?: string } }, null>("contacts", "setDestinations"),
    failedDeliveries: q<{ limit?: number }, DeliveryDoc[]>("contacts", "failedDeliveries"),
    retryDelivery: m<{ id: string }, null>("contacts", "retryDelivery"),
  },
  testimonialIntake: {
    list: q<{ status?: "pending" | "approved"; limit?: number }, TestimonialSubmission[]>("testimonialIntake", "list"),
    approve: m<{ id: string; locale?: string; quote?: string; role?: string; published?: boolean }, string>("testimonialIntake", "approve"),
    reject: m<{ id: string }, null>("testimonialIntake", "reject"),
  },
  privacy: {
    exportData: q<{ email: string }, PrivacyExport>("privacy", "exportData"),
    erase: m<{ email: string; confirm: string }, { total: number; bySource: Record<string, number> }>("privacy", "erase"),
    policyStatus: q<Empty, PolicyStatus>("privacy", "policyStatus"),
    policyDraft: q<Empty, { path: string; title: Localized<string>; blocks: BlockInstance[] }>("privacy", "policyDraft"),
    generatePolicy: m<{ overwrite?: boolean; publish?: boolean }, { pageId: string; version: number }>("privacy", "generatePolicy"),
  },
  publish: {
    status: q<Empty, PublishStatus>("publish", "status"),
    trigger: a<{ force?: boolean }, { ok: boolean; skipped?: boolean; message?: string }>("publish", "trigger"),
  },
  audit: {
    recent: q<{ limit?: number; eventType?: string; targetType?: string }, AuditEntry[]>("audit", "recent"),
  },
  proposals: {
    list: q<{ filter?: "all" | "accepted" | "pending"; limit?: number; includeDeleted?: boolean }, ProposalDoc[]>("proposals", "list"),
    get: q<{ id: string }, ProposalDoc | null>("proposals", "get"),
    versions: q<{ id: string }, ProposalVersion[]>("proposals", "versions"),
    getAcceptance: q<{ id: string }, ProposalAcceptance | null>("proposals", "getAcceptance"),
    create: m<Args, string>("proposals", "create"),
    update: m<{ id: string; patch?: Args; unset?: string[]; password?: string; expiresAt?: number }, null>("proposals", "update"),
    resetPassword: m<{ id: string; newPassword?: string }, null>("proposals", "resetPassword"),
    remove: m<{ id: string }, null>("proposals", "remove"),
    restore: m<{ id: string }, null>("proposals", "restore"),
    removePermanently: m<{ id: string }, null>("proposals", "removePermanently"),
  },
  contractTemplates: {
    list: q<Empty, ContractTemplate[]>("contractTemplates", "list"),
    create: m<{ name: string; description?: string; content: string; isDefault?: boolean }, string>("contractTemplates", "create"),
    update: m<{ id: string; name?: string; description?: string; content?: string }, null>("contractTemplates", "update"),
    remove: m<{ id: string }, null>("contractTemplates", "remove"),
    setDefault: m<{ id: string }, null>("contractTemplates", "setDefault"),
  },
  checkouts: {
    list: q<{ status?: CheckoutStatus; limit?: number; includeDeleted?: boolean }, CheckoutDoc[]>("checkouts", "list"),
    create: m<Args, string>("checkouts", "create"),
    remove: m<{ id: string }, null>("checkouts", "remove"),
    restore: m<{ id: string }, null>("checkouts", "restore"),
    linkPlan: m<{ planId: string; billingType?: BillingType }, { uniqueLink: string; href: string }>("checkouts", "linkPlan"),
    unlinkPlan: m<{ planId: string }, null>("checkouts", "unlinkPlan"),
    listLinks: q<Empty, PaymentLink[]>("checkouts", "listLinks"),
  },
  aiResumes: {
    list: q<{ includeDeleted?: boolean }, AiResume[]>("aiResumes", "list"),
    generate: a<{ title: string; locale: string; jobDescription: string }, { id: string }>("aiResumes", "generate"),
    remove: m<{ id: string }, null>("aiResumes", "remove"),
    restore: m<{ id: string }, null>("aiResumes", "restore"),
  },
};

/** O backend não tem a função (módulo ainda não instalado ou de outra versão). */
export function isMissingFunction(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /Could not find (public )?function/i.test(message);
}
