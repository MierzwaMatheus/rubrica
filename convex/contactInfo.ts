import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireRole } from './auth';
import { markPendingChanges } from './publishStatus';
import { logAudit } from './audit';

export const get = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query('contactInfo').first();
  },
});

export const update = mutation({
  args: {
    name: v.optional(v.string()),
    role: v.optional(v.string()),
    roleTranslations: v.optional(
      v.object({ 'ptBR': v.string(), 'enUS': v.optional(v.string()) }),
    ),
    email: v.optional(v.string()),
    showEmail: v.optional(v.boolean()),
    phone: v.optional(v.string()),
    showPhone: v.optional(v.boolean()),
    birthDate: v.optional(v.string()),
    showBirthDate: v.optional(v.boolean()),
    location: v.optional(v.string()),
    showLocation: v.optional(v.boolean()),
    avatarUrl: v.optional(v.string()),
    avatarStorageId: v.optional(v.id('_storage')),
    linkedinUrl: v.optional(v.string()),
    githubUrl: v.optional(v.string()),
    behanceUrl: v.optional(v.string()),
    proposalIntro: v.optional(v.string()),
    proposalAiContext: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireRole(ctx, ['root', 'admin']);
    const existing = await ctx.db.query('contactInfo').first();
    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, { ...args, updatedAt: now });
    } else {
      await ctx.db.insert('contactInfo', {
        name: args.name ?? '',
        role: args.role ?? '',
        email: args.email ?? '',
        showEmail: args.showEmail ?? true,
        showPhone: args.showPhone ?? false,
        showBirthDate: args.showBirthDate ?? false,
        showLocation: args.showLocation ?? false,
        ...args,
        createdAt: now,
      });
    }
    await markPendingChanges(ctx);
    await logAudit(ctx, { eventType: 'admin.update', actorType: 'user', actorId: userId, targetType: 'contactInfo', success: true });
  },
});
