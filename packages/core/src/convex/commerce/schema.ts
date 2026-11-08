/**
 * Tabelas do comercial (port da v1): propostas, versões, sessões e aceites; modelos
 * de contrato; checkouts, links de pagamento de planos e eventos do Asaas já
 * processados; currículos gerados com IA. Entram em `rubricaTables`.
 */
import { defineTable } from "convex/server";
import { v } from "convex/values";
import { customerFields, proposalContentFields, vBillingType, vCheckoutStatus } from "./validators";

export const commerceTables = {
  // ── Propostas ───────────────────────────────────────────────────────────
  proposals: defineTable({
    ...proposalContentFields,
    /** Parte pública do link (`/proposta/<slug>`). */
    slug: v.string(),
    /** Hash PBKDF2 (`pbkdf2:<sal>:<hash>`). Nunca sai do servidor. */
    password: v.optional(v.string()),
    /** Contrato congelado no aceite (ou migrado da v1). Antes disso vale o modelo atual. */
    templateSnapshot: v.optional(v.string()),
    version: v.number(),
    isAccepted: v.boolean(),
    acceptedAt: v.optional(v.number()),
    expiresAt: v.number(),
    createdAt: v.number(),
    createdBy: v.optional(v.id("users")),
    updatedAt: v.optional(v.number()),
    updatedBy: v.optional(v.id("users")),
    deletedAt: v.optional(v.number()),
    deletedBy: v.optional(v.id("users")),
  })
    .index("by_slug", ["slug"])
    .index("by_isAccepted", ["isAccepted"])
    .index("by_expiresAt", ["expiresAt"]),

  /** Como a proposta estava antes de cada edição (versão 1, 2…). */
  proposalVersions: defineTable({
    proposalId: v.id("proposals"),
    version: v.number(),
    content: v.object(proposalContentFields),
    createdAt: v.number(),
    createdBy: v.optional(v.id("users")),
  }).index("by_proposalId_and_version", ["proposalId", "version"]),

  /** Sessão aberta com a senha da proposta. Guarda só o hash do token. */
  proposalSessions: defineTable({
    proposalId: v.id("proposals"),
    tokenHash: v.string(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    isUsed: v.boolean(),
    expiresAt: v.number(),
    createdAt: v.number(),
  })
    .index("by_tokenHash", ["tokenHash"])
    .index("by_proposalId", ["proposalId"])
    .index("by_expiresAt", ["expiresAt"]),

  /** Registro do aceite eletrônico: quem, quando, de onde, o conteúdo aceito e o hash dele. */
  proposalAcceptances: defineTable({
    proposalId: v.id("proposals"),
    proposalVersion: v.number(),
    sessionId: v.optional(v.id("proposalSessions")),
    clientName: v.string(),
    clientDocument: v.string(),
    clientEmail: v.string(),
    clientRole: v.optional(v.string()),
    clientDeclaration: v.optional(v.string()),
    /** Idioma em que a proposta foi lida e aceita. */
    locale: v.optional(v.string()),
    contentSnapshot: v.string(),
    contentSnapshotVersion: v.string(),
    contentHash: v.string(),
    ipAddress: v.string(),
    userAgent: v.string(),
    signatureStorageId: v.optional(v.id("_storage")),
    acceptedAt: v.number(),
    createdAt: v.number(),
    anonymizedAt: v.optional(v.number()),
  })
    .index("by_proposalId", ["proposalId"])
    .index("by_clientDocument", ["clientDocument"])
    .index("by_clientEmail", ["clientEmail"])
    .index("by_acceptedAt", ["acceptedAt"]),

  // ── Modelos de contrato ─────────────────────────────────────────────────
  contractTemplates: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    /** Markdown com variáveis (`{{client_name}}`, `{{scope}}`…), preenchido pela página da proposta. */
    content: v.string(),
    isDefault: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
    updatedBy: v.optional(v.id("users")),
  }).index("by_is_default", ["isDefault"]),

  // ── Pagamentos ──────────────────────────────────────────────────────────
  checkouts: defineTable({
    uniqueLink: v.string(),
    /** Cliente no Asaas. */
    customerId: v.optional(v.string()),
    ...customerFields,
    /** Em reais. */
    value: v.number(),
    description: v.optional(v.string()),
    dueDate: v.string(),
    billingType: v.optional(vBillingType),
    status: vCheckoutStatus,
    /** Origem: link de pagamento de um plano, ou proposta. */
    paymentLinkId: v.optional(v.id("paymentLinks")),
    planId: v.optional(v.id("plans")),
    proposalId: v.optional(v.id("proposals")),
    paymentMethod: v.optional(v.string()),
    installmentCount: v.optional(v.number()),
    installmentValue: v.optional(v.number()),
    installmentInterestRate: v.optional(v.number()),
    installmentInterestAmount: v.optional(v.number()),
    totalValue: v.optional(v.number()),
    pixQrCode: v.optional(v.string()),
    pixQrCodeImage: v.optional(v.string()),
    pixExpirationDate: v.optional(v.number()),
    bankSlipUrl: v.optional(v.string()),
    /** Linha digitável do boleto. */
    bankSlipLine: v.optional(v.string()),
    /** Página de pagamento do Asaas (cartão). */
    invoiceUrl: v.optional(v.string()),
    asaasChargeId: v.optional(v.string()),
    /** Parcelamento no Asaas (cartão em 2x ou mais): cancelar remove todas as parcelas. */
    asaasInstallmentId: v.optional(v.string()),
    /** Trava contra duas gerações de cobrança ao mesmo tempo. */
    paymentLockUntil: v.optional(v.number()),
    /** Cobranças geradas por este link (limite contra abuso). */
    chargeAttempts: v.optional(v.number()),
    /** Cobrança e valor confirmados pelo webhook. */
    paidChargeId: v.optional(v.string()),
    paidValue: v.optional(v.number()),
    refundedAt: v.optional(v.number()),
    externalReference: v.optional(v.string()),
    expiresAt: v.number(),
    completedAt: v.optional(v.number()),
    createdAt: v.number(),
    createdBy: v.optional(v.id("users")),
    updatedAt: v.optional(v.number()),
    deletedAt: v.optional(v.number()),
    deletedBy: v.optional(v.id("users")),
  })
    .index("by_uniqueLink", ["uniqueLink"])
    .index("by_asaasChargeId", ["asaasChargeId"])
    .index("by_status", ["status"])
    .index("by_status_and_expiresAt", ["status", "expiresAt"])
    .index("by_customerEmail", ["customerEmail"])
    .index("by_expiresAt", ["expiresAt"]),

  /**
   * Link de pagamento reutilizável de um plano (`/checkout/<uniqueLink>`). Cada
   * visitante que paga gera um checkout próprio, com o preço do plano naquele momento.
   */
  paymentLinks: defineTable({
    uniqueLink: v.string(),
    planId: v.id("plans"),
    billingType: v.optional(vBillingType),
    active: v.boolean(),
    createdAt: v.number(),
    createdBy: v.optional(v.id("users")),
    updatedAt: v.optional(v.number()),
  })
    .index("by_uniqueLink", ["uniqueLink"])
    .index("by_planId", ["planId"]),

  /** Eventos do webhook já processados (o Asaas reenvia quando não recebe 200 a tempo). */
  paymentEvents: defineTable({
    provider: v.literal("asaas"),
    eventId: v.string(),
    event: v.string(),
    uniqueLink: v.optional(v.string()),
    createdAt: v.number(),
    expiresAt: v.number(),
  })
    .index("by_eventId", ["eventId"])
    .index("by_expiresAt", ["expiresAt"]),

  // ── Currículos com IA ───────────────────────────────────────────────────
  aiResumes: defineTable({
    title: v.string(),
    locale: v.string(),
    jobDescription: v.string(),
    fitScore: v.number(),
    fitComment: v.string(),
    strengths: v.array(v.string()),
    weaknesses: v.array(v.string()),
    cvData: v.any(),
    createdBy: v.id("users"),
    createdAt: v.number(),
    deletedAt: v.optional(v.number()),
    deletedBy: v.optional(v.id("users")),
  }).index("by_createdAt", ["createdAt"]),
};
