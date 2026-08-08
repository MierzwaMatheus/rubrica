import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireRole } from './auth';
import { markPendingChanges } from './publishStatus';
import { logAudit } from './audit';

const PUBLIC_HOME_KEYS = new Set([
  'about_text', 'availability_status', 'contact_wizard_enabled',
  'hero_title', 'hero_subtitle', 'about_short', 'hero_tags',
]);

export const getByKey = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    if (!PUBLIC_HOME_KEYS.has(args.key)) {
      await requireRole(ctx, ['root', 'admin', 'content-editor']);
    }
    return ctx.db
      .query('homeContent')
      .withIndex('by_key', (q) => q.eq('key', args.key))
      .unique();
  },
});

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, ['root', 'admin', 'content-editor']);
    return ctx.db.query('homeContent').collect();
  },
});

export const getAllPublic = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query('homeContent').collect();
    return all.filter((row) => PUBLIC_HOME_KEYS.has(row.key));
  },
});

export const set = mutation({
  args: {
    key: v.string(),
    value: v.any(),
  },
  handler: async (ctx, args) => {
    if (args.key.startsWith('plugin:')) {
      throw new Error('Use plugins.setPluginEnabled to toggle plugins');
    }
    const { userId } = await requireRole(ctx, ['root', 'admin', 'content-editor']);
    const now = Date.now();
    const existing = await ctx.db
      .query('homeContent')
      .withIndex('by_key', (q) => q.eq('key', args.key))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { value: args.value, updatedAt: now });
    } else {
      await ctx.db.insert('homeContent', {
        key: args.key,
        value: args.value,
        createdAt: now,
      });
    }
    await markPendingChanges(ctx);
    await logAudit(ctx, { eventType: 'admin.update', actorType: 'user', actorId: userId, targetType: 'homeContent', metadata: { key: args.key }, success: true });
  },
});
