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
    const all = await ctx.db.query('aboutFaq').withIndex('by_displayOrder').order('asc').collect();
    return args.includeDeleted ? all : all.filter((i) => i.deletedAt === undefined);
  },
});

export const create = mutation({
  args: {
    question: v.string(),
    questionTranslations: v.optional(
      v.object({ 'ptBR': v.string(), 'enUS': v.optional(v.string()) }),
    ),
    answer: v.string(),
    answerTranslations: v.optional(
      v.object({ 'ptBR': v.string(), 'enUS': v.optional(v.string()) }),
    ),
    displayOrder: v.number(),
  },
  handler: async (ctx, args) => {
    await requirePlugin(ctx, 'about');
    const { userId } = await requireRole(ctx, ['root', 'admin', 'content-editor']);
    const id = await ctx.db.insert('aboutFaq', { ...args, createdAt: Date.now() });
    await markPendingChanges(ctx);
    await logAudit(ctx, { eventType: 'admin.create', actorType: 'user', actorId: userId, targetType: 'aboutFaq', targetId: id, metadata: { label: args.question }, success: true });
    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id('aboutFaq'),
    question: v.optional(v.string()),
    questionTranslations: v.optional(
      v.object({ 'ptBR': v.string(), 'enUS': v.optional(v.string()) }),
    ),
    answer: v.optional(v.string()),
    answerTranslations: v.optional(
      v.object({ 'ptBR': v.string(), 'enUS': v.optional(v.string()) }),
    ),
    displayOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requirePlugin(ctx, 'about');
    const { userId } = await requireRole(ctx, ['root', 'admin', 'content-editor']);
    const existing = await ctx.db.get(args.id);
    const { id, ...fields } = args;
    await ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
    await markPendingChanges(ctx);
    await logAudit(ctx, { eventType: 'admin.update', actorType: 'user', actorId: userId, targetType: 'aboutFaq', targetId: id, metadata: { label: existing?.question }, success: true });
  },
});

export const remove = mutation({
  args: { id: v.id('aboutFaq') },
  handler: async (ctx, args) => {
    await requirePlugin(ctx, 'about');
    const { userId } = await requireRole(ctx, ['root', 'admin', 'content-editor']);
    const existing = await ctx.db.get(args.id);
    await softDeleteDoc(ctx, 'aboutFaq', args.id, userId);
    await markPendingChanges(ctx);
    await logAudit(ctx, { eventType: 'admin.delete', actorType: 'user', actorId: userId, targetType: 'aboutFaq', targetId: args.id, metadata: { label: existing?.question, softDelete: true }, success: true });
  },
});

export const permanentDelete = mutation({
  args: { id: v.id('aboutFaq') },
  handler: async (ctx, args) => {
    await requirePlugin(ctx, 'about');
    const { userId } = await requireRole(ctx, ['root']);
    const existing = await ctx.db.get(args.id);
    await ctx.db.delete(args.id);
    await markPendingChanges(ctx);
    await logAudit(ctx, { eventType: 'admin.permanent_delete', actorType: 'user', actorId: userId, targetType: 'aboutFaq', targetId: args.id, metadata: { label: existing?.question }, success: true });
  },
});

export const restore = mutation({
  args: { id: v.id('aboutFaq') },
  handler: async (ctx, args) => {
    await requirePlugin(ctx, 'about');
    const { userId } = await requireRole(ctx, ['root']);
    const existing = await ctx.db.get(args.id);
    await restoreDoc(ctx, 'aboutFaq', args.id);
    await markPendingChanges(ctx);
    await logAudit(ctx, { eventType: 'admin.restore', actorType: 'user', actorId: userId, targetType: 'aboutFaq', targetId: args.id, metadata: { label: existing?.question }, success: true });
  },
});

const ABOUT_FAQ_SEED_VALUES = [
  {
    question: 'Aceita projetos remotos?',
    answer: 'Sim, trabalho 100% remoto com clientes de qualquer região.',
    displayOrder: 0,
  },
  {
    question: 'Qual é o seu stack preferido?',
    answer: 'React no frontend, Node.js ou Convex no backend, com TypeScript em tudo.',
    displayOrder: 1,
  },
  {
    question: 'Como é o seu processo de trabalho?',
    answer:
      'Começo com um briefing detalhado, defino escopo e entregas, itero com feedback frequente.',
    displayOrder: 2,
  },
];

export const seed = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query('aboutFaq').collect();
    if (existing.length >= ABOUT_FAQ_SEED_VALUES.length) return;

    const now = Date.now();
    const remaining = ABOUT_FAQ_SEED_VALUES.length - existing.length;
    for (let i = 0; i < remaining; i += 1) {
      const item = ABOUT_FAQ_SEED_VALUES[i];
      await ctx.db.insert('aboutFaq', { ...item, createdAt: now });
    }
  },
});
