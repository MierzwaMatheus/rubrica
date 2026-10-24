import { v } from 'convex/values';
import { internalMutation, mutation, query } from './_generated/server';
import { requireRole } from './auth';
import { markPendingChanges } from './publishStatus';
import { logAudit } from './audit';

const PUBLIC_HOME_KEYS = new Set([
  'about_text', 'availability_status', 'contact_wizard_enabled',
  'hero_title', 'hero_subtitle', 'about_short', 'hero_tags',
  'work_principles', // princípios de trabalho (página Sobre)
  'home_metrics',    // números de prova no topo da home e do currículo
]);

const HOME_SEED_VALUES: Record<string, unknown> = {
  hero_title: 'Olá, sou Ana Souza',
  hero_subtitle: 'Desenvolvedora Full-Stack especializada em criar experiências digitais memoráveis.',
  about_short: 'Construo produtos web do zero ao deploy, com foco em performance, acessibilidade e código limpo.',
  about_text: {
    ptBR: 'Sou Ana Souza, desenvolvedora full-stack com mais de 8 anos de experiência entregando produtos web de alta qualidade. Trabalho com React, Node.js, TypeScript e plataformas serverless como a Vercel. Acredito que software bem feito nasce de empatia pelo usuário, código legível e iteração constante. Nos últimos anos, tenho me dedicado a arquiteturas sustentáveis, design system e a melhorar a experiência de times que constroem software em larga escala.',
  },
  hero_tags: [
    { label: 'React', color: '#61dafb' },
    { label: 'TypeScript', color: '#3178c6' },
    { label: 'Node.js', color: '#3c873a' },
    { label: 'Next.js', color: '#000000' },
    { label: 'Convex', color: '#ee3322' },
  ],
  availability_status: {
    available: true,
    label: {
      ptBR: 'Disponível para novos projetos',
      enUS: 'Available for new projects',
    },
  },
  contact_wizard_enabled: true,
  // números de prova: aparecem no topo da home e do currículo (até 4)
  home_metrics: [
    { value: '8+', label: 'anos de experiência', labelTranslations: { ptBR: 'anos de experiência', enUS: 'years of experience' } },
    { value: '30+', label: 'produtos entregues', labelTranslations: { ptBR: 'produtos entregues', enUS: 'products shipped' } },
    { value: '1.200+', label: 'agendamentos por mês no maior case', labelTranslations: { ptBR: 'agendamentos por mês no maior case', enUS: 'bookings a month in the top case' } },
    { value: '−65%', label: 'de no-show para um cliente', labelTranslations: { ptBR: 'de no-show para um cliente', enUS: 'fewer no-shows for a client' } },
  ],
  // metodologia de trabalho: abre a página Sobre, antes do conteúdo pessoal
  work_principles: [
    { title: 'Entender antes de construir', description: 'Todo projeto começa com o problema escrito, quem usa e como vamos medir o resultado.',
      titleTranslations: { ptBR: 'Entender antes de construir', enUS: 'Understand before building' },
      descriptionTranslations: { ptBR: 'Todo projeto começa com o problema escrito, quem usa e como vamos medir o resultado.', enUS: 'Every project starts with the problem written down, who uses it and how we will measure the result.' } },
    { title: 'Entregas pequenas e frequentes', description: 'Versões curtas, validadas com quem usa, em vez de uma grande entrega no fim.',
      titleTranslations: { ptBR: 'Entregas pequenas e frequentes', enUS: 'Small, frequent releases' },
      descriptionTranslations: { ptBR: 'Versões curtas, validadas com quem usa, em vez de uma grande entrega no fim.', enUS: 'Short versions validated with users, instead of one big release at the end.' } },
    { title: 'Qualidade desde o início', description: 'Testes, acessibilidade e performance fazem parte da tarefa, não de uma fase depois.',
      titleTranslations: { ptBR: 'Qualidade desde o início', enUS: 'Quality from day one' },
      descriptionTranslations: { ptBR: 'Testes, acessibilidade e performance fazem parte da tarefa, não de uma fase depois.', enUS: 'Tests, accessibility and performance are part of the task, not a later phase.' } },
    { title: 'Fácil de manter', description: 'Código legível e documentado: o projeto continua saudável depois da entrega.',
      titleTranslations: { ptBR: 'Fácil de manter', enUS: 'Easy to maintain' },
      descriptionTranslations: { ptBR: 'Código legível e documentado: o projeto continua saudável depois da entrega.', enUS: 'Readable, documented code: the project stays healthy after handover.' } },
  ],
};

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

export const seed = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    for (const key of PUBLIC_HOME_KEYS) {
      const value = HOME_SEED_VALUES[key];
      const existing = await ctx.db
        .query('homeContent')
        .withIndex('by_key', (q) => q.eq('key', key))
        .unique();
      // Só cria o que falta: rodar o setup de novo não apaga a home personalizada.
      if (!existing) {
        await ctx.db.insert('homeContent', { key, value, createdAt: now });
      }
    }
  },
});
