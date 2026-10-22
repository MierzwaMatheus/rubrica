import { v } from 'convex/values';
import { internalMutation, mutation, query } from './_generated/server';
import { requireRole } from './auth';
import { markPendingChanges } from './publishStatus';
import { logAudit } from './audit';
import { requirePlugin, isPluginEnabled } from './plugins';
import { softDeleteDoc, restoreDoc } from './lib/softDelete';

export const list = query({
  args: { includeDeleted: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    if (!(await isPluginEnabled(ctx, 'about'))) return [];
    const all = await ctx.db
      .query('aboutDailyRoutine')
      .withIndex('by_displayOrder')
      .order('asc')
      .collect();
    const items = args.includeDeleted ? all : all.filter((i) => i.deletedAt === undefined);

    return Promise.all(
      items.map(async (item) => {
        let image = null;
        if (item.imageId) {
          const img = await ctx.db.get(item.imageId);
          image = img ? { ...img, url: await ctx.storage.getUrl(img.storageId) } : null;
        }
        // Fall back to imageUrl if no Convex Storage image
        const imageUrl = image ? undefined : item.imageUrl;
        return { ...item, image, imageUrl };
      }),
    );
  },
});

export const create = mutation({
  args: {
    imageId: v.optional(v.id('imageMetadata')),
    imageUrl: v.optional(v.string()),
    description: v.string(),
    descriptionTranslations: v.optional(
      v.object({ 'ptBR': v.string(), 'enUS': v.optional(v.string()) }),
    ),
    spanSize: v.union(v.literal('1x1'), v.literal('1x2'), v.literal('2x1')),
    displayOrder: v.number(),
  },
  handler: async (ctx, args) => {
    await requirePlugin(ctx, 'about');
    const { userId } = await requireRole(ctx, ['root', 'admin', 'content-editor']);
    const id = await ctx.db.insert('aboutDailyRoutine', { ...args, createdAt: Date.now() });
    await markPendingChanges(ctx);
    await logAudit(ctx, { eventType: 'admin.create', actorType: 'user', actorId: userId, targetType: 'aboutDailyRoutine', targetId: id, metadata: { label: args.description }, success: true });
    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id('aboutDailyRoutine'),
    imageId: v.optional(v.id('imageMetadata')),
    imageUrl: v.optional(v.string()),
    description: v.optional(v.string()),
    descriptionTranslations: v.optional(
      v.object({ 'ptBR': v.string(), 'enUS': v.optional(v.string()) }),
    ),
    spanSize: v.optional(v.union(v.literal('1x1'), v.literal('1x2'), v.literal('2x1'))),
    displayOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requirePlugin(ctx, 'about');
    const { userId } = await requireRole(ctx, ['root', 'admin', 'content-editor']);
    const existing = await ctx.db.get(args.id);
    const { id, ...fields } = args;
    await ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
    await markPendingChanges(ctx);
    await logAudit(ctx, { eventType: 'admin.update', actorType: 'user', actorId: userId, targetType: 'aboutDailyRoutine', targetId: id, metadata: { label: existing?.description }, success: true });
  },
});

export const remove = mutation({
  args: { id: v.id('aboutDailyRoutine') },
  handler: async (ctx, args) => {
    await requirePlugin(ctx, 'about');
    const { userId } = await requireRole(ctx, ['root', 'admin', 'content-editor']);
    const existing = await ctx.db.get(args.id);
    await softDeleteDoc(ctx, 'aboutDailyRoutine', args.id, userId);
    await markPendingChanges(ctx);
    await logAudit(ctx, { eventType: 'admin.delete', actorType: 'user', actorId: userId, targetType: 'aboutDailyRoutine', targetId: args.id, metadata: { label: existing?.description, softDelete: true }, success: true });
  },
});

export const permanentDelete = mutation({
  args: { id: v.id('aboutDailyRoutine') },
  handler: async (ctx, args) => {
    await requirePlugin(ctx, 'about');
    const { userId } = await requireRole(ctx, ['root']);
    const existing = await ctx.db.get(args.id);
    await ctx.db.delete(args.id);
    await markPendingChanges(ctx);
    await logAudit(ctx, { eventType: 'admin.permanent_delete', actorType: 'user', actorId: userId, targetType: 'aboutDailyRoutine', targetId: args.id, metadata: { label: existing?.description }, success: true });
  },
});

export const restore = mutation({
  args: { id: v.id('aboutDailyRoutine') },
  handler: async (ctx, args) => {
    await requirePlugin(ctx, 'about');
    const { userId } = await requireRole(ctx, ['root']);
    const existing = await ctx.db.get(args.id);
    await restoreDoc(ctx, 'aboutDailyRoutine', args.id);
    await markPendingChanges(ctx);
    await logAudit(ctx, { eventType: 'admin.restore', actorType: 'user', actorId: userId, targetType: 'aboutDailyRoutine', targetId: args.id, metadata: { label: existing?.description }, success: true });
  },
});

const ABOUT_DAILY_ROUTINE_SEED_VALUES = [
  { description: 'Manhã: leitura técnica e revisão de PRs', spanSize: '1x1' as const, displayOrder: 0 },
  { description: 'Tarde: desenvolvimento e pair programming', spanSize: '1x1' as const, displayOrder: 1 },
  { description: 'Noite: projetos pessoais e estudo', spanSize: '1x1' as const, displayOrder: 2 },
];

export const seed = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query('aboutDailyRoutine').collect();
    if (existing.length >= ABOUT_DAILY_ROUTINE_SEED_VALUES.length) return;

    const now = Date.now();
    const remaining = ABOUT_DAILY_ROUTINE_SEED_VALUES.length - existing.length;
    for (let i = 0; i < remaining; i += 1) {
      const item = ABOUT_DAILY_ROUTINE_SEED_VALUES[i];
      await ctx.db.insert('aboutDailyRoutine', { ...item, createdAt: now });
    }
  },
});
