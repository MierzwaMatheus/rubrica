/**
 * Tabelas da linha de empresa, parte A (RFC v2, decisão 8 e "LGPD no site"):
 * pedidos de contato e seus destinos, depoimentos enviados pelo site, versões da
 * política de privacidade e estado da publicação.
 *
 * Ficam fora de `schema.ts` para não misturar com as tabelas do conteúdo; o
 * `rubricaTables` as espalha. Nenhuma guarda IP: só o hash (`ipHash`).
 */
import { defineTable } from "convex/server";
import { v } from "convex/values";

/** Consentimento registrado junto de cada envio público (LGPD). */
export const vConsent = v.object({
  /** Quando o envio foi aceito (epoch ms). */
  acceptedAt: v.number(),
  /** Idioma da página no momento do envio. */
  locale: v.string(),
  /** Caminho da página, com prefixo do idioma. */
  page: v.string(),
  /** Versão da política de privacidade vigente (0 = o site ainda não tinha política). */
  policyVersion: v.number(),
  /** SHA-256 do IP com o sal do projeto. O IP em si não é guardado. */
  ipHash: v.string(),
});

export const vContactStatus = v.union(v.literal("new"), v.literal("read"), v.literal("archived"));
export const vDestination = v.union(v.literal("telegram"), v.literal("email"), v.literal("webhook"));
export const vDeliverySource = v.union(v.literal("contact"), v.literal("testimonial"));
export const vDeliveryStatus = v.union(v.literal("pending"), v.literal("sent"), v.literal("failed"));

export const businessTables = {
  // ── Contatos (plugin contact-wizard) ────────────────────────────────────
  contactRequests: defineTable({
    name: v.string(),
    /** Minúsculo, sem espaços: é a chave da exportação e da exclusão (LGPD). */
    email: v.string(),
    phone: v.optional(v.string()),
    message: v.string(),
    /** Respostas do assistente (valores curtos). */
    details: v.optional(v.record(v.string(), v.string())),
    locale: v.string(),
    blockId: v.string(),
    page: v.string(),
    status: vContactStatus,
    /** Parece spam (muitos links): fica no painel, mas não dispara os destinos. */
    spam: v.optional(v.boolean()),
    consent: vConsent,
    createdAt: v.number(),
    readAt: v.optional(v.number()),
    archivedAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
    updatedBy: v.optional(v.id("users")),
  })
    .index("by_createdAt", ["createdAt"])
    .index("by_status_and_createdAt", ["status", "createdAt"])
    .index("by_email", ["email"]),

  /** Destinos configurados por site (documento único). O painel sempre recebe. */
  contactDestinations: defineTable({
    telegram: v.boolean(),
    email: v.object({ enabled: v.boolean(), to: v.array(v.string()) }),
    webhook: v.object({ enabled: v.boolean(), url: v.optional(v.string()) }),
    updatedAt: v.number(),
    updatedBy: v.optional(v.id("users")),
  }),

  /** Um envio para um destino, com as tentativas. Falha fica visível no painel. */
  contactDeliveries: defineTable({
    source: vDeliverySource,
    /** Id do `contactRequests` ou do `testimonialSubmissions`. */
    sourceId: v.string(),
    destination: vDestination,
    status: vDeliveryStatus,
    attempts: v.number(),
    lastError: v.optional(v.string()),
    lastAttemptAt: v.optional(v.number()),
    nextAttemptAt: v.optional(v.number()),
    sentAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_source_and_sourceId", ["source", "sourceId"])
    .index("by_status_and_createdAt", ["status", "createdAt"])
    .index("by_createdAt", ["createdAt"]),

  // ── Depoimentos enviados pelo site (plugin testimonials-intake) ─────────
  testimonialSubmissions: defineTable({
    name: v.string(),
    email: v.string(),
    role: v.optional(v.string()),
    company: v.optional(v.string()),
    quote: v.string(),
    locale: v.string(),
    blockId: v.string(),
    page: v.string(),
    status: v.union(v.literal("pending"), v.literal("approved")),
    /** Item criado na coleção `testimonials` ao aprovar. */
    testimonialId: v.optional(v.id("testimonials")),
    consent: vConsent,
    createdAt: v.number(),
    reviewedAt: v.optional(v.number()),
    reviewedBy: v.optional(v.id("users")),
  })
    .index("by_status_and_createdAt", ["status", "createdAt"])
    .index("by_email", ["email"]),

  // ── LGPD ────────────────────────────────────────────────────────────────
  /** Uma linha por versão da página `/privacidade` (o hash do conteúdo muda → versão nova). */
  privacyPolicyVersions: defineTable({
    version: v.number(),
    hash: v.string(),
    pageId: v.optional(v.id("pages")),
    createdAt: v.number(),
  }).index("by_version", ["version"]),

  // ── Publicação (decisão 21) ─────────────────────────────────────────────
  /** Documento único com o estado do botão "publicar". */
  publishState: defineTable({
    /** Última tentativa (deu certo ou não): base do limite de frequência. */
    lastAttemptAt: v.optional(v.number()),
    lastTriggeredAt: v.optional(v.number()),
    lastTriggeredBy: v.optional(v.id("users")),
    /** Fim do build avisado pelo provedor (ou presumido depois do prazo). */
    lastPublishedAt: v.optional(v.number()),
    /** Mudanças até este instante já foram para o build disparado. */
    publishedUpTo: v.optional(v.number()),
    lastError: v.optional(v.string()),
    lastErrorAt: v.optional(v.number()),
  }),
};
