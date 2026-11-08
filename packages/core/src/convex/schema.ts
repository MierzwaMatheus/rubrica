/**
 * Tabelas do núcleo do Rubrica (RFC v2, revisão da decisão 13). O projeto as espalha
 * no próprio `convex/schema.ts`, junto com as do `@convex-dev/auth`:
 *
 * ```ts
 * import { defineSchema } from "convex/server";
 * import { authTables } from "@convex-dev/auth/server";
 * import { rubricaTables } from "@rubrica/core/convex/schema";
 *
 * export default defineSchema({ ...authTables, ...rubricaTables });
 * ```
 *
 * Textos são mapas por idioma (decisão 26). Itens de coleção têm `published` e lixeira
 * (`deletedAt`), como na v1. Mudar ou remover campo é quebra de contrato (decisão 30).
 */
import { defineTable } from "convex/server";
import { v, type PropertyValidators } from "convex/values";
import {
  faqFields,
  lifecycleFields,
  planFields,
  postFields,
  projectFields,
  resumeItemFields,
  routineFields,
  serviceFields,
  siteSettingsFields,
  teamMemberFields,
  testimonialFields,
  vBlock,
  vLocalized,
  vRole,
  vSeo,
} from "./validators";
import { businessTables } from "./businessTables";
import { commerceTables } from "./commerce/schema";

const collection = <F extends PropertyValidators>(fields: F) => ({ ...fields, ...lifecycleFields });

export const rubricaTables = {
  // ── Páginas ─────────────────────────────────────────────────────────────
  pages: defineTable({
    /** Caminho sem idioma: "/", "/sobre". Único entre as páginas fora da lixeira. */
    path: v.string(),
    title: vLocalized,
    seo: v.optional(vSeo),
    blocks: v.array(vBlock),
    published: v.boolean(),
    /** Página do ponto de partida (home, sobre…): pode ser editada, não apagada. */
    system: v.optional(v.boolean()),
    createdAt: v.number(),
    updatedAt: v.number(),
    updatedBy: v.optional(v.id("users")),
    deletedAt: v.optional(v.number()),
    deletedBy: v.optional(v.id("users")),
  })
    .index("by_path", ["path"])
    .index("by_published", ["published"]),

  // ── Coleções ────────────────────────────────────────────────────────────
  posts: defineTable(
    collection({
      ...postFields,
      slug: v.string(),
      /** Data da primeira publicação (epoch ms). Republicar não muda. */
      publishedAt: v.optional(v.number()),
      authorId: v.optional(v.id("users")),
    }),
  )
    .index("by_slug", ["slug"])
    .index("by_published_and_publishedAt", ["published", "publishedAt"])
    .index("by_order", ["order"]),

  projects: defineTable(collection({ ...projectFields, slug: v.string() }))
    .index("by_slug", ["slug"])
    .index("by_published_and_order", ["published", "order"])
    .index("by_order", ["order"]),

  services: defineTable(collection(serviceFields)).index("by_order", ["order"]).index("by_published_and_order", ["published", "order"]),
  testimonials: defineTable(collection(testimonialFields)).index("by_order", ["order"]).index("by_published_and_order", ["published", "order"]),
  faq: defineTable(collection(faqFields)).index("by_order", ["order"]).index("by_published_and_order", ["published", "order"]),
  resumeItems: defineTable(collection(resumeItemFields))
    .index("by_order", ["order"])
    .index("by_published_and_order", ["published", "order"])
    .index("by_kind_and_order", ["kind", "order"]),
  routine: defineTable(collection(routineFields)).index("by_order", ["order"]).index("by_published_and_order", ["published", "order"]),
  plans: defineTable(collection(planFields)).index("by_order", ["order"]).index("by_published_and_order", ["published", "order"]),
  team: defineTable(collection(teamMemberFields)).index("by_order", ["order"]).index("by_published_and_order", ["published", "order"]),

  // ── Site ────────────────────────────────────────────────────────────────
  /** Documento único com o `SiteSettings`. */
  siteSettings: defineTable({
    ...siteSettingsFields,
    updatedAt: v.number(),
    updatedBy: v.optional(v.id("users")),
  }),

  /** Textos de interface (menu, "ler mais", formulários, 404): chave → texto por idioma. */
  uiTexts: defineTable({
    key: v.string(),
    value: vLocalized,
    updatedAt: v.number(),
    updatedBy: v.optional(v.id("users")),
  }).index("by_key", ["key"]),

  /** Biblioteca de mídia. A pasta é um caminho ("/", "/blog/2026"). */
  media: defineTable({
    storageId: v.id("_storage"),
    name: v.string(),
    folder: v.string(),
    alt: v.optional(vLocalized),
    width: v.optional(v.number()),
    height: v.optional(v.number()),
    size: v.optional(v.number()),
    contentType: v.optional(v.string()),
    createdAt: v.number(),
    createdBy: v.optional(v.id("users")),
    updatedAt: v.optional(v.number()),
  })
    .index("by_storageId", ["storageId"])
    .index("by_folder", ["folder"]),

  // ── Usuários, auditoria e limites ───────────────────────────────────────
  userRoles: defineTable({
    userId: v.id("users"),
    role: vRole,
    createdAt: v.number(),
    createdBy: v.optional(v.id("users")),
    mustChangePassword: v.optional(v.boolean()),
    /** Suspenso: o papel fica guardado, mas não vale até reativar. */
    suspendedAt: v.optional(v.number()),
    suspendedBy: v.optional(v.id("users")),
  })
    .index("by_userId", ["userId"])
    .index("by_role", ["role"]),

  auditLog: defineTable({
    eventType: v.string(),
    actorType: v.union(v.literal("user"), v.literal("system"), v.literal("external")),
    actorId: v.optional(v.string()),
    targetType: v.optional(v.string()),
    targetId: v.optional(v.string()),
    metadata: v.optional(v.any()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    success: v.boolean(),
    createdAt: v.number(),
    expiresAt: v.number(),
  })
    .index("by_eventType_and_createdAt", ["eventType", "createdAt"])
    .index("by_actorId", ["actorId"])
    .index("by_targetType_and_targetId", ["targetType", "targetId"])
    .index("by_createdAt", ["createdAt"])
    .index("by_expiresAt", ["expiresAt"]),

  rateLimits: defineTable({
    key: v.string(),
    type: v.string(),
    identifier: v.string(),
    attemptCount: v.number(),
    firstAttemptAt: v.number(),
    lastAttemptAt: v.number(),
    blockedUntil: v.optional(v.number()),
    expiresAt: v.number(),
  })
    .index("by_key", ["key"])
    .index("by_expiresAt", ["expiresAt"]),

  // ── Linha de empresa: contatos, depoimentos enviados, LGPD, publicação ──
  ...businessTables,
  // ── Comercial (propostas, contratos, pagamentos, currículos com IA) ─────
  ...commerceTables,
};

/** Tabelas de coleção, pelo nome usado no conteúdo (`CollectionName`). */
export const COLLECTION_TABLES = {
  posts: "posts",
  projects: "projects",
  services: "services",
  testimonials: "testimonials",
  faq: "faq",
  resume: "resumeItems",
  routine: "routine",
  plans: "plans",
  team: "team",
} as const;
export type CollectionTable = (typeof COLLECTION_TABLES)[keyof typeof COLLECTION_TABLES];
