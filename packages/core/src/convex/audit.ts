/**
 * Registro de atividades e limite de tentativas (port da v1).
 */
import { v } from "convex/values";
import { requireRole } from "./auth";
import { internalMutation, query, type MutationCtx, type ReaderCtx } from "./server";
import { isPluginOn } from "./plugins";
import type { RubricaRuntime } from "./runtime";

const TWO_YEARS_MS = 2 * 365 * 24 * 60 * 60 * 1000;
const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

export interface AuditEvent {
  eventType: string;
  actorType: "user" | "system" | "external";
  actorId?: string;
  targetType?: string;
  targetId?: string;
  metadata?: unknown;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
}

export async function logAudit(ctx: MutationCtx, event: AuditEvent): Promise<void> {
  const now = Date.now();
  await ctx.db.insert("auditLog", { ...event, metadata: event.metadata ?? undefined, createdAt: now, expiresAt: now + TWO_YEARS_MS });
}

/** Atalho para ações de um usuário do painel. */
export function logUserAction(
  ctx: MutationCtx,
  actorId: string,
  eventType: string,
  target: { type: string; id?: string; label?: string },
  metadata?: Record<string, unknown>,
): Promise<void> {
  return logAudit(ctx, {
    eventType,
    actorType: "user",
    actorId,
    targetType: target.type,
    targetId: target.id,
    metadata: { ...(target.label !== undefined ? { label: target.label } : {}), ...metadata },
    success: true,
  });
}

// ── Limite de tentativas ────────────────────────────────────────────────────

/**
 * Janela e limite por tipo. O login com senha NÃO passa por aqui: o limite dele é do
 * Convex Auth (`MAX_FAILED_SIGN_INS_PER_HOUR`). Os envios públicos (contato,
 * depoimento, proposta) entram aqui na próxima etapa.
 */
export const RATE_LIMITS = {
  password_change: { windowMs: 60 * 60 * 1000, perKey: 5, blockMs: 60 * 60 * 1000 },
  user_create: { windowMs: 60 * 60 * 1000, perKey: 20, blockMs: 60 * 60 * 1000 },
  media_upload: { windowMs: 60 * 60 * 1000, perKey: 300, blockMs: 60 * 60 * 1000 },
  proposal_password: { windowMs: 15 * 60 * 1000, perKey: 5, blockMs: 30 * 60 * 1000 },
  proposal_accept: { windowMs: 60 * 60 * 1000, perKey: 3, blockMs: 60 * 60 * 1000 },
  contact_submit: { windowMs: 60 * 60 * 1000, perKey: 5, blockMs: 60 * 60 * 1000 },
  testimonial_submit: { windowMs: 7 * 24 * 60 * 60 * 1000, perKey: 1, blockMs: 7 * 24 * 60 * 60 * 1000 },
  // Envios públicos: a chave é o hash do IP ou do e-mail, nunca o dado em si.
  contact_email: { windowMs: 24 * 60 * 60 * 1000, perKey: 5, blockMs: 24 * 60 * 60 * 1000 },
  testimonial_ip: { windowMs: 24 * 60 * 60 * 1000, perKey: 5, blockMs: 24 * 60 * 60 * 1000 },
  webhook_invalid: { windowMs: 60 * 60 * 1000, perKey: 20, blockMs: 60 * 60 * 1000 },
  checkout_start: { windowMs: 60 * 60 * 1000, perKey: 10, blockMs: 60 * 60 * 1000 },
} as const;
export type RateLimitType = keyof typeof RATE_LIMITS;

export async function checkRateLimit(
  ctx: ReaderCtx,
  type: RateLimitType,
  identifier: string,
): Promise<{ allowed: boolean; blockedUntil?: number }> {
  const record = await ctx.db
    .query("rateLimits")
    .withIndex("by_key", (q) => q.eq("key", `${type}:${identifier}`))
    .unique();
  if (!record) return { allowed: true };
  const now = Date.now();
  if (record.blockedUntil && record.blockedUntil > now) return { allowed: false, blockedUntil: record.blockedUntil };
  const limit = RATE_LIMITS[type];
  if (now - record.firstAttemptAt > limit.windowMs) return { allowed: true };
  if (record.attemptCount >= limit.perKey) return { allowed: false, blockedUntil: record.blockedUntil };
  return { allowed: true };
}

export async function recordRateLimitAttempt(ctx: MutationCtx, type: RateLimitType, identifier: string): Promise<void> {
  const key = `${type}:${identifier}`;
  const now = Date.now();
  const limit = RATE_LIMITS[type];
  const existing = await ctx.db
    .query("rateLimits")
    .withIndex("by_key", (q) => q.eq("key", key))
    .unique();
  if (!existing || now - existing.firstAttemptAt > limit.windowMs) {
    if (existing) await ctx.db.delete(existing._id);
    await ctx.db.insert("rateLimits", {
      key,
      type,
      identifier,
      attemptCount: 1,
      firstAttemptAt: now,
      lastAttemptAt: now,
      blockedUntil: limit.perKey <= 1 ? now + limit.blockMs : undefined,
      expiresAt: now + Math.max(limit.windowMs, limit.blockMs) * 2,
    });
    return;
  }
  const attemptCount = existing.attemptCount + 1;
  await ctx.db.patch(existing._id, {
    attemptCount,
    lastAttemptAt: now,
    blockedUntil: attemptCount >= limit.perKey ? now + limit.blockMs : existing.blockedUntil,
  });
}

/** Confere e conta uma tentativa. Lança quando o limite estourou. */
export async function hitRateLimit(ctx: MutationCtx, type: RateLimitType, identifier: string): Promise<void> {
  const { allowed, blockedUntil } = await checkRateLimit(ctx, type, identifier);
  if (!allowed) {
    const minutes = blockedUntil ? Math.max(1, Math.ceil((blockedUntil - Date.now()) / 60000)) : undefined;
    throw new Error(`Muitas tentativas. Tente de novo${minutes ? ` em ${minutes} min` : " mais tarde"}.`);
  }
  await recordRateLimitAttempt(ctx, type, identifier);
}

export async function resetRateLimit(ctx: MutationCtx, type: RateLimitType, identifier: string): Promise<void> {
  const existing = await ctx.db
    .query("rateLimits")
    .withIndex("by_key", (q) => q.eq("key", `${type}:${identifier}`))
    .unique();
  if (existing) await ctx.db.delete(existing._id);
}

// ── Funções ─────────────────────────────────────────────────────────────────

const vRateLimitType = v.union(...(Object.keys(RATE_LIMITS) as RateLimitType[]).map((k) => v.literal(k)));

export function auditFunctions(rt: RubricaRuntime) {
  return {
    /** Atividades recentes (root, com o plugin `audit-log` ligado). */
    recent: query({
      args: {
        limit: v.optional(v.number()),
        eventType: v.optional(v.string()),
        targetType: v.optional(v.string()),
      },
      handler: async (ctx, args) => {
        await requireRole(ctx, "audit");
        if (!(await isPluginOn(ctx, rt, "audit-log"))) return [];
        const logs = await ctx.db.query("auditLog").withIndex("by_createdAt").order("desc").take(500);
        const filtered = logs
          .filter((l) => !args.eventType || l.eventType === args.eventType)
          .filter((l) => !args.targetType || l.targetType === args.targetType)
          .slice(0, Math.min(args.limit ?? 100, 500));
        const emails = new Map<string, string | null>();
        return Promise.all(
          filtered.map(async (log) => {
            let actorEmail: string | null = null;
            if (log.actorId && log.actorType === "user") {
              if (!emails.has(log.actorId)) {
                const id = ctx.db.normalizeId("users", log.actorId);
                const user = id ? await ctx.db.get(id) : null;
                emails.set(log.actorId, user?.email ?? null);
              }
              actorEmail = emails.get(log.actorId) ?? null;
            }
            return { ...log, actorEmail };
          }),
        );
      },
    }),

    /** Para actions, que não gravam direto no banco. */
    logFromAction: internalMutation({
      args: {
        eventType: v.string(),
        actorId: v.optional(v.string()),
        targetType: v.optional(v.string()),
        targetId: v.optional(v.string()),
        metadata: v.optional(v.any()),
        success: v.boolean(),
      },
      handler: async (ctx, args) => {
        await logAudit(ctx, { ...args, actorType: "user" });
      },
    }),

    /** Limite de tentativas a partir de uma action. */
    hitRateLimit: internalMutation({
      args: { type: vRateLimitType, identifier: v.string() },
      handler: async (ctx, args) => {
        await hitRateLimit(ctx, args.type, args.identifier);
      },
    }),

    /** Cron diário: apaga registros vencidos e anonimiza IPs com mais de 90 dias. */
    cleanup: internalMutation({
      args: {},
      handler: async (ctx) => {
        const now = Date.now();
        const expired = await ctx.db
          .query("auditLog")
          .withIndex("by_expiresAt", (q) => q.lt("expiresAt", now))
          .take(200);
        for (const doc of expired) await ctx.db.delete(doc._id);
        const old = await ctx.db
          .query("auditLog")
          .withIndex("by_createdAt", (q) => q.lt("createdAt", now - NINETY_DAYS_MS))
          .take(200);
        let anonymized = 0;
        for (const doc of old) {
          if (doc.ipAddress && doc.ipAddress !== "0.0.0.0") {
            await ctx.db.patch(doc._id, { ipAddress: "0.0.0.0", userAgent: undefined });
            anonymized++;
          }
        }
        const limits = await ctx.db
          .query("rateLimits")
          .withIndex("by_expiresAt", (q) => q.lt("expiresAt", now))
          .take(200);
        for (const doc of limits) await ctx.db.delete(doc._id);
        return { auditDeleted: expired.length, anonymized, rateLimitsDeleted: limits.length };
      },
    }),
  };
}
