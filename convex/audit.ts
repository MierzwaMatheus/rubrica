import { v } from 'convex/values';
import { internalMutation, query } from './_generated/server';
import { MutationCtx } from './_generated/server';
import { requireRole } from './auth';
import { isPluginEnabled } from './plugins';

const TWO_YEARS_MS = 2 * 365 * 24 * 60 * 60 * 1000;

/** Para actions, que não têm acesso direto ao banco. */
export const logFromAction = internalMutation({
  args: {
    eventType: v.string(),
    actorId: v.optional(v.string()),
    targetType: v.optional(v.string()),
    targetId: v.optional(v.string()),
    metadata: v.optional(v.any()),
    success: v.boolean(),
  },
  handler: async (ctx, args) => {
    await logAudit(ctx, { ...args, actorType: 'user' });
  },
});

export async function logAudit(
  ctx: MutationCtx,
  event: {
    eventType: string;
    actorType: 'user' | 'system' | 'external';
    actorId?: string;
    targetType?: string;
    targetId?: string;
    metadata?: unknown;
    ipAddress?: string;
    userAgent?: string;
    success: boolean;
  },
) {
  const now = Date.now();
  await ctx.db.insert('auditLog', {
    ...event,
    metadata: event.metadata ?? undefined,
    createdAt: now,
    expiresAt: now + TWO_YEARS_MS,
  });
}

export const recent = query({
  args: {
    limit: v.optional(v.number()),
    eventType: v.optional(v.string()),
    targetType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, ['root']);
    if (!(await isPluginEnabled(ctx, 'audit-log'))) return [];
    const logs = await ctx.db
      .query('auditLog')
      .withIndex('by_createdAt')
      .order('desc')
      .take(500);

    const filtered = logs
      .filter((l) => !args.eventType || l.eventType === args.eventType)
      .filter((l) => !args.targetType || l.targetType === args.targetType)
      .slice(0, args.limit ?? 100);

    const userCache = new Map<string, string | null>();
    return Promise.all(
      filtered.map(async (log) => {
        let actorEmail: string | null = null;
        if (log.actorId && log.actorType === 'user') {
          if (!userCache.has(log.actorId)) {
            const user = await ctx.db.get(log.actorId as Parameters<typeof ctx.db.get>[0]);
            userCache.set(log.actorId, (user as { email?: string } | null)?.email ?? null);
          }
          actorEmail = userCache.get(log.actorId) ?? null;
        }
        return { ...log, actorEmail };
      }),
    );
  },
});

export const listSoftDeleted = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireRole(ctx, ['root']);
    if (!(await isPluginEnabled(ctx, 'audit-log'))) return [];
    const logs = await ctx.db
      .query('auditLog')
      .withIndex('by_eventType_and_createdAt', (q) => q.eq('eventType', 'admin.delete'))
      .order('desc')
      .take(500);

    const softDeletedLogs = logs.filter((l) => (l.metadata as any)?.softDelete === true);

    const userCache = new Map<string, string | null>();
    const results = await Promise.all(
      softDeletedLogs.slice(0, args.limit ?? 100).map(async (log) => {
        let actorEmail: string | null = null;
        if (log.actorId && log.actorType === 'user') {
          if (!userCache.has(log.actorId)) {
            const user = await ctx.db.get(log.actorId as Parameters<typeof ctx.db.get>[0]);
            userCache.set(log.actorId, (user as { email?: string } | null)?.email ?? null);
          }
          actorEmail = userCache.get(log.actorId) ?? null;
        }

        // Check if item still exists (is restorable)
        let isRestorable = false;
        if (log.targetId && log.targetType) {
          try {
            const doc = await ctx.db.get(log.targetId as Parameters<typeof ctx.db.get>[0]);
            isRestorable = doc !== null && (doc as any).deletedAt !== undefined;
          } catch {
            isRestorable = false;
          }
        }

        return { ...log, actorEmail, isRestorable };
      }),
    );

    return results;
  },
});

export const cleanupExpired = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const expired = await ctx.db
      .query('auditLog')
      .withIndex('by_expiresAt', (q) => q.lt('expiresAt', now))
      .take(100);
    for (const doc of expired) {
      await ctx.db.delete(doc._id);
    }
    return { deleted: expired.length };
  },
});

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000;

export const anonymizeOldIps = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - NINETY_DAYS_MS;
    const old = await ctx.db
      .query('auditLog')
      .withIndex('by_createdAt', (q) => q.lt('createdAt', cutoff))
      .take(200);
    let count = 0;
    for (const doc of old) {
      if (doc.ipAddress && doc.ipAddress !== '0.0.0.0') {
        await ctx.db.patch(doc._id, { ipAddress: '0.0.0.0', userAgent: undefined });
        count++;
      }
    }
    return { anonymized: count };
  },
});
