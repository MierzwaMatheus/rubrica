/**
 * Pedidos de contato (plugin `contact-wizard`) e os destinos deles (decisão 8).
 *
 * O envio chega por `POST /rubrica/contato` (`httpRoutes.ts`), que valida e chama
 * `submit` (interna). O pedido fica no painel; cada destino ligado (Telegram, e-mail,
 * webhook) vira um `contactDeliveries` enviado por uma action agendada, com novas
 * tentativas e a falha visível no painel. Leitura e gestão: papel `contacts`
 * (root, admin, comercial). Configurar os destinos: `settings` (root, admin).
 */
import { v } from "convex/values";
import { requireRole } from "./auth";
import { checkRateLimit, logAudit, logUserAction, recordRateLimitAttempt, RATE_LIMITS, type RateLimitType } from "./audit";
import { vContactStatus } from "./businessTables";
import {
  assertWebhookUrl,
  DEFAULT_DESTINATIONS,
  deliver as sendTo,
  enabledDestinations,
  MAX_ATTEMPTS,
  missingEnv,
  RETRY_DELAYS_MS,
  type DestinationId,
  type DestinationsConfig,
  type NotificationPayload,
} from "./lib/destinations";
import { countLinks, SPAM_LINKS } from "./lib/intake";
import { anyText } from "./lib/text";
import { enabledPluginsFor, getSettingsDoc, isPluginOn } from "./plugins";
import { currentPolicyVersion } from "./privacyVersion";
import type { RubricaRuntime } from "./runtime";
import { internalAction, internalMutation, internalQuery, mutation, query, ref, type Doc, type Id, type MutationCtx, type ReaderCtx } from "./server";

const DAY_MS = 24 * 60 * 60 * 1000;
/** Pedidos mais antigos que isto são apagados pelo cron (LGPD: retenção definida). */
export const DEFAULT_CONTACT_RETENTION_DAYS = 730;

export function contactRetentionDays(env: Record<string, string | undefined> = process.env): number {
  const n = Number(env.RUBRICA_CONTACT_RETENTION_DAYS);
  return Number.isFinite(n) && n >= 30 ? Math.floor(n) : DEFAULT_CONTACT_RETENTION_DAYS;
}

// ── Limite de envios ────────────────────────────────────────────────────────

/**
 * Confere todos os limites e só então conta a tentativa em cada um. Devolve em quantos
 * segundos tentar de novo quando algum estourou.
 */
export async function consumeRateLimits(ctx: MutationCtx, limits: [RateLimitType, string][]): Promise<number | null> {
  const now = Date.now();
  for (const [type, identifier] of limits) {
    const { allowed, blockedUntil } = await checkRateLimit(ctx, type, identifier);
    if (!allowed) {
      const record = await ctx.db
        .query("rateLimits")
        .withIndex("by_key", (q) => q.eq("key", `${type}:${identifier}`))
        .unique();
      const until = blockedUntil ?? (record ? record.firstAttemptAt + RATE_LIMITS[type].windowMs : now + 60_000);
      return Math.max(1, Math.ceil((until - now) / 1000));
    }
  }
  for (const [type, identifier] of limits) await recordRateLimitAttempt(ctx, type, identifier);
  return null;
}

// ── Destinos ────────────────────────────────────────────────────────────────

export async function getDestinations(ctx: ReaderCtx): Promise<DestinationsConfig & { _id?: Id<"contactDestinations"> }> {
  const doc = await ctx.db.query("contactDestinations").first();
  if (!doc) return { ...DEFAULT_DESTINATIONS };
  return { _id: doc._id, telegram: doc.telegram, email: doc.email, webhook: doc.webhook };
}

/** Cria um envio pendente para cada destino ligado e agenda a primeira tentativa. */
export async function queueDeliveries(ctx: MutationCtx, source: "contact" | "testimonial", sourceId: string): Promise<number> {
  const config = await getDestinations(ctx);
  const now = Date.now();
  let count = 0;
  for (const destination of enabledDestinations(config)) {
    const deliveryId = await ctx.db.insert("contactDeliveries", { source, sourceId, destination, status: "pending", attempts: 0, createdAt: now });
    await ctx.scheduler.runAfter(0, refs.deliver, { deliveryId });
    count++;
  }
  return count;
}

export async function deleteDeliveries(ctx: MutationCtx, source: "contact" | "testimonial", sourceId: string): Promise<void> {
  const deliveries = await ctx.db
    .query("contactDeliveries")
    .withIndex("by_source_and_sourceId", (q) => q.eq("source", source).eq("sourceId", sourceId))
    .collect();
  for (const d of deliveries) await ctx.db.delete(d._id);
}

async function deliveriesOf(ctx: ReaderCtx, source: "contact" | "testimonial", sourceId: string) {
  const deliveries = await ctx.db
    .query("contactDeliveries")
    .withIndex("by_source_and_sourceId", (q) => q.eq("source", source).eq("sourceId", sourceId))
    .collect();
  return deliveries.map((d) => ({
    _id: d._id,
    destination: d.destination,
    status: d.status,
    attempts: d.attempts,
    lastError: d.lastError,
    lastAttemptAt: d.lastAttemptAt,
    nextAttemptAt: d.nextAttemptAt,
    sentAt: d.sentAt,
  }));
}

const refs = {
  deliver: ref<"action", { deliveryId: Id<"contactDeliveries"> }>("action", "contacts", "deliver"),
  deliveryContext: ref<"query", { deliveryId: Id<"contactDeliveries"> }, DeliveryContext | null>("query", "contacts", "deliveryContext"),
  recordAttempt: ref<"mutation", { deliveryId: Id<"contactDeliveries">; ok: boolean; error?: string }>("mutation", "contacts", "recordAttempt"),
};

interface DeliveryContext {
  destination: DestinationId;
  payload: NotificationPayload;
  config: DestinationsConfig;
}

function siteInfo(settings: Doc<"siteSettings"> | null): NotificationPayload["site"] {
  return { name: settings ? anyText(settings.name, settings.locales.default) || settings.url : "Site", url: settings?.url };
}

// ── Funções ─────────────────────────────────────────────────────────────────

export function contactsFunctions(rt: RubricaRuntime) {
  async function load(ctx: ReaderCtx, id: Id<"contactRequests">): Promise<Doc<"contactRequests">> {
    const doc = await ctx.db.get(id);
    if (!doc) throw new Error("Pedido de contato não encontrado");
    return doc;
  }

  async function setStatus(ctx: MutationCtx, id: Id<"contactRequests">, status: Doc<"contactRequests">["status"]) {
    const { userId } = await requireRole(ctx, "contacts");
    const doc = await load(ctx, id);
    const now = Date.now();
    await ctx.db.patch(id, {
      status,
      updatedAt: now,
      updatedBy: userId,
      ...(status === "read" && !doc.readAt ? { readAt: now } : {}),
      ...(status === "archived" ? { archivedAt: now } : { archivedAt: undefined }),
    });
    await logUserAction(ctx, userId, "contact.status_changed", { type: "contactRequest", id }, { from: doc.status, to: status });
    return null;
  }

  return {
    /** Pedidos, do mais novo para o mais antigo, com o estado de cada destino. */
    list: query({
      args: { status: v.optional(vContactStatus), limit: v.optional(v.number()) },
      handler: async (ctx, args) => {
        await requireRole(ctx, "contacts");
        const limit = Math.min(Math.max(args.limit ?? 100, 1), 500);
        const docs = args.status
          ? await ctx.db
              .query("contactRequests")
              .withIndex("by_status_and_createdAt", (q) => q.eq("status", args.status!))
              .order("desc")
              .take(limit)
          : await ctx.db.query("contactRequests").withIndex("by_createdAt").order("desc").take(limit);
        return Promise.all(docs.map(async (d) => ({ ...d, deliveries: await deliveriesOf(ctx, "contact", d._id) })));
      },
    }),

    get: query({
      args: { id: v.id("contactRequests") },
      handler: async (ctx, args) => {
        await requireRole(ctx, "contacts");
        const doc = await ctx.db.get(args.id);
        return doc ? { ...doc, deliveries: await deliveriesOf(ctx, "contact", doc._id) } : null;
      },
    }),

    /** Quantos pedidos novos (para o selo no menu). */
    unreadCount: query({
      args: {},
      handler: async (ctx) => {
        await requireRole(ctx, "contacts");
        const docs = await ctx.db
          .query("contactRequests")
          .withIndex("by_status_and_createdAt", (q) => q.eq("status", "new"))
          .take(1000);
        return docs.length;
      },
    }),

    markRead: mutation({ args: { id: v.id("contactRequests") }, handler: (ctx, args) => setStatus(ctx, args.id, "read") }),
    markUnread: mutation({ args: { id: v.id("contactRequests") }, handler: (ctx, args) => setStatus(ctx, args.id, "new") }),
    archive: mutation({ args: { id: v.id("contactRequests") }, handler: (ctx, args) => setStatus(ctx, args.id, "archived") }),
    unarchive: mutation({ args: { id: v.id("contactRequests") }, handler: (ctx, args) => setStatus(ctx, args.id, "read") }),

    /** Apaga de vez (dado pessoal: sem lixeira), com os envios. */
    remove: mutation({
      args: { id: v.id("contactRequests") },
      handler: async (ctx, args) => {
        const { userId } = await requireRole(ctx, "contacts");
        await load(ctx, args.id);
        await deleteDeliveries(ctx, "contact", args.id);
        await ctx.db.delete(args.id);
        await logUserAction(ctx, userId, "contact.deleted", { type: "contactRequest", id: args.id });
        return null;
      },
    }),

    /** Destinos configurados e o que falta no ambiente para cada um. */
    destinations: query({
      args: {},
      handler: async (ctx) => {
        await requireRole(ctx, "contacts");
        const { _id, ...config } = await getDestinations(ctx);
        void _id;
        const env = process.env;
        return {
          ...config,
          missing: { telegram: missingEnv("telegram", env), email: missingEnv("email", env), webhook: missingEnv("webhook", env) },
        };
      },
    }),

    setDestinations: mutation({
      args: {
        telegram: v.boolean(),
        email: v.object({ enabled: v.boolean(), to: v.array(v.string()) }),
        webhook: v.object({ enabled: v.boolean(), url: v.optional(v.string()) }),
      },
      handler: async (ctx, args) => {
        const { userId } = await requireRole(ctx, "settings");
        const to = [...new Set(args.email.to.map((e) => e.trim().toLowerCase()).filter(Boolean))];
        if (to.length > 10) throw new Error("No máximo 10 destinatários de e-mail");
        for (const email of to) if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw new Error(`E-mail inválido: ${email}`);
        if (args.email.enabled && !to.length) throw new Error("Informe pelo menos um destinatário de e-mail");
        const url = args.webhook.url?.trim() || undefined;
        if (url) assertWebhookUrl(url);
        if (args.webhook.enabled && !url) throw new Error("Informe a URL do webhook");
        const doc = { telegram: args.telegram, email: { enabled: args.email.enabled, to }, webhook: { enabled: args.webhook.enabled, ...(url ? { url } : {}) }, updatedAt: Date.now(), updatedBy: userId };
        const existing = await ctx.db.query("contactDestinations").first();
        if (existing) await ctx.db.replace(existing._id, doc);
        else await ctx.db.insert("contactDestinations", doc);
        await logUserAction(ctx, userId, "contact.destinations_updated", { type: "contactDestinations" }, { telegram: args.telegram, email: args.email.enabled, webhook: args.webhook.enabled });
        return null;
      },
    }),

    /** Envios que falharam de vez (para o aviso no painel). */
    failedDeliveries: query({
      args: { limit: v.optional(v.number()) },
      handler: async (ctx, args) => {
        await requireRole(ctx, "contacts");
        return ctx.db
          .query("contactDeliveries")
          .withIndex("by_status_and_createdAt", (q) => q.eq("status", "failed"))
          .order("desc")
          .take(Math.min(args.limit ?? 50, 200));
      },
    }),

    /** Tenta de novo um envio que falhou (zera as tentativas). */
    retryDelivery: mutation({
      args: { id: v.id("contactDeliveries") },
      handler: async (ctx, args) => {
        const { userId } = await requireRole(ctx, "contacts");
        const delivery = await ctx.db.get(args.id);
        if (!delivery) throw new Error("Envio não encontrado");
        if (delivery.status === "sent") throw new Error("Este envio já foi feito");
        await ctx.db.patch(args.id, { status: "pending", attempts: 0, nextAttemptAt: undefined });
        await ctx.scheduler.runAfter(0, refs.deliver, { deliveryId: args.id });
        await logUserAction(ctx, userId, "contact.delivery_retried", { type: "contactDelivery", id: args.id }, { destination: delivery.destination });
        return null;
      },
    }),

    // ── Internas ─────────────────────────────────────────────────────────

    /** Para as rotas HTTP: URL do site (CORS) e plugins de envio ligados. */
    publicConfig: internalQuery({
      args: {},
      handler: async (ctx) => {
        const settings = await getSettingsDoc(ctx);
        const plugins = await enabledPluginsFor(ctx, rt, settings);
        return { siteUrl: settings?.url ?? null, contact: plugins.has("contact-wizard"), testimonial: plugins.has("testimonials-intake") };
      },
    }),

    /** Grava um pedido validado pela rota HTTP. */
    submit: internalMutation({
      args: {
        name: v.string(),
        email: v.string(),
        phone: v.optional(v.string()),
        message: v.string(),
        details: v.optional(v.record(v.string(), v.string())),
        locale: v.string(),
        blockId: v.string(),
        page: v.string(),
        ipHash: v.string(),
        emailHash: v.string(),
      },
      handler: async (ctx, args): Promise<{ ok: true; id: string } | { ok: false; error: "rate_limited"; retryAfter: number } | { ok: false; error: "disabled" }> => {
        if (!(await isPluginOn(ctx, rt, "contact-wizard"))) return { ok: false, error: "disabled" };
        const retryAfter = await consumeRateLimits(ctx, [
          ["contact_submit", args.ipHash],
          ["contact_email", args.emailHash],
        ]);
        if (retryAfter !== null) return { ok: false, error: "rate_limited", retryAfter };
        const now = Date.now();
        const { ipHash, emailHash, ...data } = args;
        void emailHash;
        const spam = countLinks(`${data.message} ${Object.values(data.details ?? {}).join(" ")}`) >= SPAM_LINKS;
        const id = await ctx.db.insert("contactRequests", {
          ...data,
          status: "new",
          ...(spam ? { spam: true } : {}),
          consent: { acceptedAt: now, locale: data.locale, page: data.page, policyVersion: await currentPolicyVersion(ctx), ipHash },
          createdAt: now,
        });
        await logAudit(ctx, { eventType: "contact.submitted", actorType: "external", targetType: "contactRequest", targetId: id, metadata: { page: data.page, spam }, success: true });
        if (!spam) await queueDeliveries(ctx, "contact", id);
        return { ok: true, id };
      },
    }),

    deliveryContext: internalQuery({
      args: { deliveryId: v.id("contactDeliveries") },
      handler: async (ctx, args): Promise<DeliveryContext | null> => {
        const delivery = await ctx.db.get(args.deliveryId);
        if (!delivery || delivery.status !== "pending") return null;
        const settings = await getSettingsDoc(ctx);
        const { _id, ...config } = await getDestinations(ctx);
        void _id;
        const base = { id: delivery.sourceId, site: siteInfo(settings) };
        let payload: NotificationPayload | null = null;
        if (delivery.source === "contact") {
          const id = ctx.db.normalizeId("contactRequests", delivery.sourceId);
          const doc = id ? await ctx.db.get(id) : null;
          if (doc) {
            payload = { ...base, event: "contact.created", createdAt: doc.createdAt, name: doc.name, email: doc.email, phone: doc.phone, text: doc.message, details: doc.details, locale: doc.locale, page: doc.page };
          }
        } else {
          const id = ctx.db.normalizeId("testimonialSubmissions", delivery.sourceId);
          const doc = id ? await ctx.db.get(id) : null;
          if (doc) {
            payload = { ...base, event: "testimonial.submitted", createdAt: doc.createdAt, name: doc.name, email: doc.email, role: doc.role, company: doc.company, text: doc.quote, locale: doc.locale, page: doc.page };
          }
        }
        return payload ? { destination: delivery.destination, payload, config } : null;
      },
    }),

    /** Uma tentativa de envio. Falhou: agenda a próxima ou marca como falha. */
    deliver: internalAction({
      args: { deliveryId: v.id("contactDeliveries") },
      handler: async (ctx, args) => {
        const context = await ctx.runQuery(refs.deliveryContext, args);
        if (!context) return null;
        try {
          await sendTo(context.destination, context.payload, context.config, process.env);
          await ctx.runMutation(refs.recordAttempt, { deliveryId: args.deliveryId, ok: true });
        } catch (e) {
          await ctx.runMutation(refs.recordAttempt, { deliveryId: args.deliveryId, ok: false, error: (e as Error).message.slice(0, 500) });
        }
        return null;
      },
    }),

    recordAttempt: internalMutation({
      args: { deliveryId: v.id("contactDeliveries"), ok: v.boolean(), error: v.optional(v.string()) },
      handler: async (ctx, args) => {
        const delivery = await ctx.db.get(args.deliveryId);
        if (!delivery) return null;
        const now = Date.now();
        const attempts = delivery.attempts + 1;
        if (args.ok) {
          await ctx.db.patch(delivery._id, { status: "sent", attempts, sentAt: now, lastAttemptAt: now, lastError: undefined, nextAttemptAt: undefined });
          return null;
        }
        if (attempts >= MAX_ATTEMPTS) {
          await ctx.db.patch(delivery._id, { status: "failed", attempts, lastAttemptAt: now, lastError: args.error, nextAttemptAt: undefined });
          await logAudit(ctx, {
            eventType: "contact.delivery_failed",
            actorType: "system",
            targetType: "contactDelivery",
            targetId: delivery._id,
            metadata: { destination: delivery.destination, source: delivery.source, error: args.error },
            success: false,
          });
          return null;
        }
        const delay = RETRY_DELAYS_MS[attempts - 1]!;
        await ctx.db.patch(delivery._id, { attempts, lastAttemptAt: now, lastError: args.error, nextAttemptAt: now + delay });
        await ctx.scheduler.runAfter(delay, refs.deliver, { deliveryId: delivery._id });
        return null;
      },
    }),

    /** Cron diário: apaga pedidos além do prazo de retenção, com os envios. */
    cleanup: internalMutation({
      args: {},
      handler: async (ctx) => {
        const cutoff = Date.now() - contactRetentionDays() * DAY_MS;
        const old = await ctx.db
          .query("contactRequests")
          .withIndex("by_createdAt", (q) => q.lt("createdAt", cutoff))
          .take(200);
        for (const doc of old) {
          await deleteDeliveries(ctx, "contact", doc._id);
          await ctx.db.delete(doc._id);
        }
        return { deleted: old.length };
      },
    }),
  };
}
