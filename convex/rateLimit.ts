import { internalMutation } from './_generated/server';
import { MutationCtx, QueryCtx } from './_generated/server';

// O login com senha NÃO passa por aqui: o limite de tentativas é do Convex Auth
// (convex/auth.ts → signIn.maxFailedAttempsPerHour). "login" fica por compatibilidade.
const WINDOWS: Record<string, number> = {
  login: 15 * 60 * 1000,
  proposal_password: 15 * 60 * 1000,
  proposal_accept: 60 * 60 * 1000,
  webhook_invalid: 60 * 60 * 1000,
  playground_log: 60 * 60 * 1000,
  playground_ai: 24 * 60 * 60 * 1000,
  testimonial_submit: 7 * 24 * 60 * 60 * 1000,
};

const LIMITS: Record<string, { perKey: number; blockDuration: number }> = {
  login: { perKey: 10, blockDuration: 30 * 60 * 1000 },
  proposal_password: { perKey: 5, blockDuration: 30 * 60 * 1000 },
  proposal_accept: { perKey: 3, blockDuration: 60 * 60 * 1000 },
  webhook_invalid: { perKey: 20, blockDuration: 60 * 60 * 1000 },
  playground_log: { perKey: 30, blockDuration: 60 * 60 * 1000 },
  playground_ai: { perKey: 5, blockDuration: 24 * 60 * 60 * 1000 },
  testimonial_submit: { perKey: 1, blockDuration: 7 * 24 * 60 * 60 * 1000 },
};

export type RateLimitType = 'login' | 'proposal_password' | 'proposal_accept' | 'webhook_invalid' | 'playground_log' | 'playground_ai' | 'testimonial_submit';

export async function checkRateLimit(
  ctx: QueryCtx | MutationCtx,
  type: RateLimitType,
  identifier: string,
): Promise<{ allowed: boolean; blockedUntil?: number }> {
  const key = `${type}:${identifier}`;
  const record = await ctx.db
    .query('rateLimitAttempts')
    .withIndex('by_key', (q) => q.eq('key', key))
    .unique();

  if (!record) return { allowed: true };

  const now = Date.now();

  if (record.blockedUntil && record.blockedUntil > now) {
    return { allowed: false, blockedUntil: record.blockedUntil };
  }

  const windowMs = WINDOWS[type] ?? 15 * 60 * 1000;
  if (now - record.firstAttemptAt > windowMs) {
    return { allowed: true };
  }

  const limit = LIMITS[type];
  if (limit && record.attemptCount >= limit.perKey) {
    return { allowed: false, blockedUntil: record.blockedUntil };
  }

  return { allowed: true };
}

export async function recordRateLimitAttempt(
  ctx: MutationCtx,
  type: RateLimitType,
  identifier: string,
) {
  const key = `${type}:${identifier}`;
  const now = Date.now();
  const windowMs = WINDOWS[type] ?? 15 * 60 * 1000;
  const limit = LIMITS[type];

  const existing = await ctx.db
    .query('rateLimitAttempts')
    .withIndex('by_key', (q) => q.eq('key', key))
    .unique();

  if (!existing) {
    await ctx.db.insert('rateLimitAttempts', {
      key,
      identifier,
      type,
      attemptCount: 1,
      firstAttemptAt: now,
      lastAttemptAt: now,
      expiresAt: now + windowMs * 2,
    });
    return;
  }

  const newCount = existing.attemptCount + 1;
  const blockedUntil =
    limit && newCount >= limit.perKey
      ? now + limit.blockDuration
      : existing.blockedUntil;

  await ctx.db.patch(existing._id, {
    attemptCount: newCount,
    lastAttemptAt: now,
    blockedUntil,
  });
}

export async function resetRateLimit(
  ctx: MutationCtx,
  type: RateLimitType,
  identifier: string,
) {
  const key = `${type}:${identifier}`;
  const existing = await ctx.db
    .query('rateLimitAttempts')
    .withIndex('by_key', (q) => q.eq('key', key))
    .unique();
  if (existing) {
    await ctx.db.delete(existing._id);
  }
}

export const cleanupExpired = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const expired = await ctx.db
      .query('rateLimitAttempts')
      .withIndex('by_expiresAt', (q) => q.lt('expiresAt', now))
      .take(200);
    for (const doc of expired) {
      await ctx.db.delete(doc._id);
    }
    return { deleted: expired.length };
  },
});
