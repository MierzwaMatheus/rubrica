import { v } from 'convex/values';
import { mutation, query, internalMutation } from './_generated/server';
import { requireRole } from './auth';
import { markPendingChanges } from './publishStatus';
import { logAudit } from './audit';
import { softDeleteDoc, restoreDoc } from './lib/softDelete';

const TESTIMONIALS_SEED_VALUES = [
  {
    name: 'Carlos Mendes',
    slug: 'carlos-mendes',
    role: 'CEO, Agência Digital X',
    text: 'A Ana entregou o projeto dentro do prazo com qualidade acima do esperado. Recomendo sem reservas.',
  },
  {
    name: 'Patrícia Lima',
    slug: 'patricia-lima',
    role: 'Product Owner, Fintech Y',
    text: 'Comunicação excelente durante todo o projeto. Sempre proativa em reportar impedimentos e propor soluções.',
  },
  {
    name: 'Ricardo Alves',
    slug: 'ricardo-alves',
    role: 'CTO, SaaS Z',
    text: 'Expertise técnica impressionante. O código entregue era limpo, bem estruturado e fácil de manter.',
  },
];

export const list = query({
  args: { onlyHome: v.optional(v.boolean()), includeDeleted: v.optional(v.boolean()) },
  handler: async (ctx, { onlyHome, includeDeleted }) => {
    const all = await ctx.db
      .query('testimonials')
      .withIndex('by_orderIndex')
      .order('asc')
      .collect();
    const nonDeleted = includeDeleted ? all : all.filter((t) => t.deletedAt === undefined);
    const items = onlyHome ? nonDeleted.filter((t) => t.showOnHome === true) : nonDeleted;

    return Promise.all(
      items.map(async (t) => ({
        ...t,
        imageUrl: t.imageId
          ? await ctx.db
              .get(t.imageId)
              .then((img) => (img ? ctx.storage.getUrl(img.storageId) : t.imageUrl))
          : t.imageUrl,
      })),
    );
  },
});

export const getById = query({
  args: { id: v.id('testimonials') },
  handler: async (ctx, { id }) => {
    return ctx.db.get(id);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    role: v.string(),
    roleTranslations: v.optional(
      v.object({ 'ptBR': v.string(), 'enUS': v.optional(v.string()) }),
    ),
    imageId: v.optional(v.id('imageMetadata')),
    imageUrl: v.optional(v.string()),
    text: v.string(),
    textTranslations: v.optional(
      v.object({ 'ptBR': v.string(), 'enUS': v.optional(v.string()) }),
    ),
    orderIndex: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireRole(ctx, ['root', 'admin', 'content-editor']);
    const id = await ctx.db.insert('testimonials', { ...args, showOnHome: false, createdAt: Date.now() });
    await logAudit(ctx, {
      eventType: 'testimonial.created',
      actorType: 'user',
      actorId: userId,
      targetType: 'testimonial',
      targetId: id,
      metadata: { label: args.name },
      success: true,
    });
    await markPendingChanges(ctx);
    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id('testimonials'),
    name: v.optional(v.string()),
    role: v.optional(v.string()),
    roleTranslations: v.optional(
      v.object({ 'ptBR': v.string(), 'enUS': v.optional(v.string()) }),
    ),
    imageId: v.optional(v.id('imageMetadata')),
    imageUrl: v.optional(v.string()),
    text: v.optional(v.string()),
    textTranslations: v.optional(
      v.object({ 'ptBR': v.string(), 'enUS': v.optional(v.string()) }),
    ),
    orderIndex: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, ['root', 'admin', 'content-editor']);
    const { id, ...fields } = args;
    await ctx.db.patch(id, fields);
    await markPendingChanges(ctx);
  },
});

export const setTranslations = internalMutation({
  args: {
    id: v.id('testimonials'),
    textTranslations: v.object({ ptBR: v.string(), enUS: v.string() }),
    roleTranslations: v.object({ ptBR: v.string(), enUS: v.string() }),
  },
  handler: async (ctx, { id, textTranslations, roleTranslations }) => {
    await ctx.db.patch(id, { textTranslations, roleTranslations });
  },
});

export const createWithAvatar = mutation({
  args: {
    name: v.string(),
    role: v.string(),
    text: v.string(),
    roleTranslations: v.optional(v.object({ ptBR: v.string(), enUS: v.optional(v.string()) })),
    textTranslations: v.optional(v.object({ ptBR: v.string(), enUS: v.optional(v.string()) })),
    avatarStorageId: v.optional(v.id('_storage')),
    avatarFileSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireRole(ctx, ['root', 'admin', 'content-editor']);
    const now = Date.now();

    let imageId: string | undefined;
    if (args.avatarStorageId) {
      const existing = await ctx.db
        .query('imageFolders')
        .withIndex('by_path', (q) => q.eq('path', 'testimonials'))
        .unique();
      const folderId = existing
        ? existing._id
        : await ctx.db.insert('imageFolders', { name: 'Depoimentos', path: 'testimonials', createdAt: now });

      imageId = await ctx.db.insert('imageMetadata', {
        storageId: args.avatarStorageId,
        folderId,
        displayName: `${args.name} — ${new Date(now).toLocaleDateString('pt-BR')}`,
        altText: args.name,
        mimeType: 'image/jpeg',
        fileSize: args.avatarFileSize ?? 0,
        createdBy: userId as any,
        createdAt: now,
      });
    }

    const id = await ctx.db.insert('testimonials', {
      name: args.name,
      role: args.role,
      text: args.text,
      roleTranslations: args.roleTranslations,
      textTranslations: args.textTranslations,
      imageId: imageId as any,
      showOnHome: false,
      createdAt: now,
    });

    await logAudit(ctx, {
      eventType: 'testimonial.created',
      actorType: 'user',
      actorId: userId,
      targetType: 'testimonial',
      targetId: id,
      metadata: { label: args.name },
      success: true,
    });
    await markPendingChanges(ctx);
    return id;
  },
});

export const remove = mutation({
  args: { id: v.id('testimonials') },
  handler: async (ctx, args) => {
    const { userId } = await requireRole(ctx, ['root', 'admin', 'content-editor']);
    const existing = await ctx.db.get(args.id);
    await softDeleteDoc(ctx, 'testimonials', args.id, userId);
    await markPendingChanges(ctx);
    await logAudit(ctx, { eventType: 'admin.delete', actorType: 'user', actorId: userId, targetType: 'testimonial', targetId: args.id, metadata: { label: existing?.name, softDelete: true }, success: true });
  },
});

export const permanentDelete = mutation({
  args: { id: v.id('testimonials') },
  handler: async (ctx, args) => {
    const { userId } = await requireRole(ctx, ['root']);
    const existing = await ctx.db.get(args.id);
    await ctx.db.delete(args.id);
    await markPendingChanges(ctx);
    await logAudit(ctx, { eventType: 'admin.permanent_delete', actorType: 'user', actorId: userId, targetType: 'testimonial', targetId: args.id, metadata: { label: existing?.name }, success: true });
  },
});

export const restore = mutation({
  args: { id: v.id('testimonials') },
  handler: async (ctx, args) => {
    const { userId } = await requireRole(ctx, ['root']);
    const existing = await ctx.db.get(args.id);
    await restoreDoc(ctx, 'testimonials', args.id);
    await markPendingChanges(ctx);
    await logAudit(ctx, { eventType: 'admin.restore', actorType: 'user', actorId: userId, targetType: 'testimonial', targetId: args.id, metadata: { label: existing?.name }, success: true });
  },
});

export const toggleShowOnHome = mutation({
  args: { id: v.id('testimonials') },
  handler: async (ctx, { id }) => {
    await requireRole(ctx, ['root', 'admin', 'content-editor']);
    const doc = await ctx.db.get(id);
    if (!doc) throw new Error('Not found');
    await ctx.db.patch(id, { showOnHome: !doc.showOnHome });
    await markPendingChanges(ctx);
    return !doc.showOnHome;
  },
});

export const unpublish = mutation({
  args: { submissionId: v.id('testimonialSubmissions') },
  handler: async (ctx, { submissionId }) => {
    const { userId } = await requireRole(ctx, ['root', 'admin', 'content-editor']);
    const submission = await ctx.db.get(submissionId);
    if (!submission) throw new Error('Not found');
    if (submission.status !== 'published') throw new Error('Depoimento não está publicado');

    if (submission.testimonialId) {
      await ctx.db.delete(submission.testimonialId);
    }

    await ctx.db.patch(submissionId, {
      status: 'approved',
      testimonialId: undefined,
    });

    await logAudit(ctx, {
      eventType: 'testimonial.unpublished',
      actorType: 'user',
      actorId: userId,
      targetType: 'testimonialSubmission',
      targetId: submissionId,
      metadata: { label: submission.name },
      success: true,
    });

    await markPendingChanges(ctx);
  },
});

export const seed = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query('testimonials').collect();
    if (existing.length >= TESTIMONIALS_SEED_VALUES.length) return;

    const now = Date.now();
    const remaining = TESTIMONIALS_SEED_VALUES.length - existing.length;
    for (let i = 0; i < remaining; i += 1) {
      const item = TESTIMONIALS_SEED_VALUES[i];
      await ctx.db.insert('testimonials', {
        name: item.name,
        role: item.role,
        roleTranslations: { ptBR: item.role },
        imageUrl: `https://picsum.photos/seed/${item.slug}/256/256`,
        text: item.text,
        textTranslations: { ptBR: item.text },
        orderIndex: i,
        showOnHome: true,
        createdAt: now,
      });
    }
  },
});
