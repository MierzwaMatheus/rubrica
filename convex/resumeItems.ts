import { v } from 'convex/values';
import { internalMutation, mutation, query } from './_generated/server';
import { requireRole } from './auth';
import { markPendingChanges } from './publishStatus';
import { logAudit } from './audit';
import { requirePlugin, isPluginEnabled } from './plugins';
import { softDeleteDoc, restoreDoc } from './lib/softDelete';

const RESUME_ITEMS_SEED_VALUES = [
  { type: 'skill' as const, content: { name: 'TypeScript', level: 'Avançado' }, orderIndex: 0 },
  { type: 'skill' as const, content: { name: 'React', level: 'Avançado' }, orderIndex: 1 },
  { type: 'skill' as const, content: { name: 'Node.js', level: 'Intermediário' }, orderIndex: 2 },
  {
    type: 'experience' as const,
    content: {
      role: 'Desenvolvedor Full Stack',
      period: '2023 — Atual',
      company: 'Empresa de Tecnologia',
      description:
        'Desenvolvimento e manutenção de aplicações web com React, TypeScript e Node.js, com foco em qualidade de código e testes automatizados.',
    },
    orderIndex: 0,
  },
  {
    type: 'experience' as const,
    content: {
      role: 'Desenvolvedor Front-end',
      period: '2021 — 2023',
      company: 'Agência Digital',
      description:
        'Construção de interfaces responsivas e acessíveis, integração com APIs REST e colaboração próxima com times de design.',
    },
    orderIndex: 1,
  },
  {
    type: 'education' as const,
    content: {
      degree: 'Análise e Desenvolvimento de Sistemas',
      period: '2018 — 2021',
      institution: 'Universidade',
      description:
        'Formação em desenvolvimento de software, banco de dados, engenharia de requisitos e arquitetura de sistemas.',
    },
    orderIndex: 0,
  },
  { type: 'course' as const, content: { text: 'Arquitetura de software e Clean Architecture' }, orderIndex: 0 },
  { type: 'course' as const, content: { text: 'Testes automatizados e TDD na prática' }, orderIndex: 1 },
  { type: 'soft_skill' as const, content: { text: 'Comunicação clara e objetiva' }, orderIndex: 0 },
  { type: 'soft_skill' as const, content: { text: 'Trabalho em equipe e colaboração' }, orderIndex: 1 },
  { type: 'language' as const, content: { name: 'Português', level: 'Nativo' }, orderIndex: 0 },
  { type: 'language' as const, content: { name: 'Inglês', level: 'Avançado' }, orderIndex: 1 },
  {
    type: 'volunteer' as const,
    content: { text: 'Mentor voluntário — Programa de formação de novos desenvolvedores' },
    orderIndex: 0,
  },
];

const RESUME_TYPES = ['skill', 'experience', 'education', 'course', 'soft_skill', 'volunteer', 'language'] as const;
type ResumeType = typeof RESUME_TYPES[number];

function resumeItemLabel(type: string, content: Record<string, unknown>): string {
  if (type === 'experience' || type === 'volunteer') return (content.role as string) || (content.text as string) || '';
  if (type === 'education') return (content.degree as string) || '';
  if (type === 'course' || type === 'soft_skill') return (content.text as string) || '';
  return (content.name as string) || '';
}

export const listByType = query({
  args: {
    type: v.union(
      v.literal('skill'),
      v.literal('experience'),
      v.literal('education'),
      v.literal('course'),
      v.literal('soft_skill'),
      v.literal('volunteer'),
      v.literal('language'),
    ),
    includeDeleted: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    if (!(await isPluginEnabled(ctx, 'resume'))) return [];
    const all = await ctx.db
      .query('resumeItems')
      .withIndex('by_type_and_orderIndex', (q) => q.eq('type', args.type))
      .order('asc')
      .collect();
    return args.includeDeleted ? all : all.filter((i) => i.deletedAt === undefined);
  },
});

export const listAll = query({
  args: { includeDeleted: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    if (!(await isPluginEnabled(ctx, 'resume'))) return [];
    const all = await ctx.db.query('resumeItems').withIndex('by_orderIndex').order('asc').collect();
    return args.includeDeleted ? all : all.filter((i) => i.deletedAt === undefined);
  },
});

export const create = mutation({
  args: {
    type: v.union(
      v.literal('skill'),
      v.literal('experience'),
      v.literal('education'),
      v.literal('course'),
      v.literal('soft_skill'),
      v.literal('volunteer'),
      v.literal('language'),
    ),
    content: v.any(),
    contentTranslations: v.optional(v.any()),
    orderIndex: v.number(),
  },
  handler: async (ctx, args) => {
    await requirePlugin(ctx, 'resume');
    const { userId } = await requireRole(ctx, ['root', 'admin', 'content-editor']);
    const id = await ctx.db.insert('resumeItems', {
      ...args,
      createdAt: Date.now(),
    } as Parameters<typeof ctx.db.insert<'resumeItems'>>[1]);
    await markPendingChanges(ctx);
    await logAudit(ctx, { eventType: 'admin.create', actorType: 'user', actorId: userId, targetType: 'resumeItem', targetId: id, metadata: { type: args.type, label: resumeItemLabel(args.type, args.content as Record<string, unknown>) }, success: true });
    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id('resumeItems'),
    content: v.optional(v.any()),
    contentTranslations: v.optional(v.any()),
    orderIndex: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requirePlugin(ctx, 'resume');
    const { userId } = await requireRole(ctx, ['root', 'admin', 'content-editor']);
    const existing = await ctx.db.get(args.id);
    const { id, ...fields } = args;
    await ctx.db.patch(id, { ...fields, updatedAt: Date.now() } as Parameters<typeof ctx.db.patch<'resumeItems'>>[1]);
    await markPendingChanges(ctx);
    const label = existing ? resumeItemLabel(existing.type, existing.content as Record<string, unknown>) : undefined;
    await logAudit(ctx, { eventType: 'admin.update', actorType: 'user', actorId: userId, targetType: 'resumeItem', targetId: id, metadata: { type: existing?.type, label }, success: true });
  },
});

export const remove = mutation({
  args: { id: v.id('resumeItems') },
  handler: async (ctx, args) => {
    await requirePlugin(ctx, 'resume');
    const { userId } = await requireRole(ctx, ['root', 'admin', 'content-editor']);
    const existing = await ctx.db.get(args.id);
    await softDeleteDoc(ctx, 'resumeItems', args.id, userId);
    await markPendingChanges(ctx);
    const label = existing ? resumeItemLabel(existing.type, existing.content as Record<string, unknown>) : undefined;
    await logAudit(ctx, { eventType: 'admin.delete', actorType: 'user', actorId: userId, targetType: 'resumeItem', targetId: args.id, metadata: { type: existing?.type, label, softDelete: true }, success: true });
  },
});

export const permanentDelete = mutation({
  args: { id: v.id('resumeItems') },
  handler: async (ctx, args) => {
    await requirePlugin(ctx, 'resume');
    const { userId } = await requireRole(ctx, ['root']);
    const existing = await ctx.db.get(args.id);
    await ctx.db.delete(args.id);
    await markPendingChanges(ctx);
    const label = existing ? resumeItemLabel(existing.type, existing.content as Record<string, unknown>) : undefined;
    await logAudit(ctx, { eventType: 'admin.permanent_delete', actorType: 'user', actorId: userId, targetType: 'resumeItem', targetId: args.id, metadata: { type: existing?.type, label }, success: true });
  },
});

export const restore = mutation({
  args: { id: v.id('resumeItems') },
  handler: async (ctx, args) => {
    await requirePlugin(ctx, 'resume');
    const { userId } = await requireRole(ctx, ['root']);
    const existing = await ctx.db.get(args.id);
    await restoreDoc(ctx, 'resumeItems', args.id);
    await markPendingChanges(ctx);
    const label = existing ? resumeItemLabel(existing.type, existing.content as Record<string, unknown>) : undefined;
    await logAudit(ctx, { eventType: 'admin.restore', actorType: 'user', actorId: userId, targetType: 'resumeItem', targetId: args.id, metadata: { type: existing?.type, label }, success: true });
  },
});

export const reorder = mutation({
  args: {
    items: v.array(v.object({ id: v.id('resumeItems'), orderIndex: v.number() })),
  },
  handler: async (ctx, args) => {
    await requirePlugin(ctx, 'resume');
    const { userId } = await requireRole(ctx, ['root', 'admin', 'content-editor']);
    for (const { id, orderIndex } of args.items) {
      await ctx.db.patch(id, { orderIndex } as Parameters<typeof ctx.db.patch<'resumeItems'>>[1]);
    }
    await markPendingChanges(ctx);
    await logAudit(ctx, { eventType: 'admin.reorder', actorType: 'user', actorId: userId, targetType: 'resumeItem', success: true });
  },
});

export const seed = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query('resumeItems').collect();
    if (existing.length >= RESUME_ITEMS_SEED_VALUES.length) return;

    const now = Date.now();
    const remaining = RESUME_ITEMS_SEED_VALUES.length - existing.length;
    for (let i = 0; i < remaining; i += 1) {
      await ctx.db.insert('resumeItems', { ...RESUME_ITEMS_SEED_VALUES[i], createdAt: now });
    }
  },
});
