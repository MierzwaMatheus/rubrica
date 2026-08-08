import { v } from 'convex/values';
import { mutation, query, internalMutation } from './_generated/server';
import { paginationOptsValidator } from 'convex/server';
import { requireRole } from './auth';
import { markPendingChanges } from './publishStatus';
import { getAuthUserId } from '@convex-dev/auth/server';
import { logAudit } from './audit';
import { requirePlugin, isPluginEnabled } from './plugins';
import { softDeleteDoc, restoreDoc } from './lib/softDelete';

export const listAllPublished = query({
  args: {},
  handler: async (ctx) => {
    if (!(await isPluginEnabled(ctx, 'blog'))) return [];
    const posts = (await ctx.db
      .query('posts')
      .withIndex('by_status_and_publishedAt', (q) => q.eq('status', 'published'))
      .order('desc')
      .collect()).filter((p) => p.deletedAt === undefined);

    return Promise.all(
      posts.map(async (post) => ({
        ...post,
        imageUrl: post.imageId
          ? await ctx.db
              .get(post.imageId)
              .then((img) => (img ? ctx.storage.getUrl(img.storageId) : post.imageUrl))
          : post.imageUrl,
      })),
    );
  },
});

export const listPublished = query({
  args: {
    paginationOpts: paginationOptsValidator,
    tag: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!(await isPluginEnabled(ctx, 'blog'))) {
      return { page: [], isDone: true, continueCursor: '' };
    }
    const result = await ctx.db
      .query('posts')
      .withIndex('by_status_and_publishedAt', (q) => q.eq('status', 'published'))
      .order('desc')
      .paginate(args.paginationOpts);

    const nonDeleted = { ...result, page: result.page.filter((p) => p.deletedAt === undefined) };
    const filtered = args.tag
      ? { ...nonDeleted, page: nonDeleted.page.filter((p) => p.tags.includes(args.tag!)) }
      : nonDeleted;

    return {
      ...filtered,
      page: await Promise.all(
        filtered.page.map(async (post) => ({
          ...post,
          imageUrl: post.imageId
            ? await ctx.db
                .get(post.imageId)
                .then((img) => (img ? ctx.storage.getUrl(img.storageId) : post.imageUrl))
            : post.imageUrl,
        })),
      ),
    };
  },
});

export const listAdmin = query({
  args: { limit: v.optional(v.number()), includeDeleted: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    await requireRole(ctx, ['root', 'admin', 'content-editor', 'blog-editor']);
    const all = await ctx.db
      .query('posts')
      .withIndex('by_status_and_publishedAt')
      .order('desc')
      .take(args.limit ?? 200);
    const posts = args.includeDeleted ? all : all.filter((p) => p.deletedAt === undefined).slice(0, args.limit ?? 50);

    return Promise.all(
      posts.map(async (post) => ({
        ...post,
        imageUrl: post.imageId
          ? await ctx.db
              .get(post.imageId)
              .then((img) => (img ? ctx.storage.getUrl(img.storageId) : post.imageUrl))
          : post.imageUrl,
      })),
    );
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    if (!(await isPluginEnabled(ctx, 'blog'))) return null;
    const post = await ctx.db
      .query('posts')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .unique();
    if (!post || post.deletedAt !== undefined) return null;

    const imageUrl = post.imageId
      ? await ctx.db
          .get(post.imageId)
          .then((img) => (img ? ctx.storage.getUrl(img.storageId) : post.imageUrl))
      : post.imageUrl;

    return { ...post, imageUrl };
  },
});

export const searchByTitle = query({
  args: { query: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return ctx.db
      .query('posts')
      .withSearchIndex('search_title', (q) =>
        q.search('title', args.query).eq('status', 'published'),
      )
      .take(args.limit ?? 20);
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    titleTranslations: v.optional(
      v.object({ 'ptBR': v.string(), 'enUS': v.optional(v.string()) }),
    ),
    subtitle: v.optional(v.string()),
    subtitleTranslations: v.optional(
      v.object({ 'ptBR': v.string(), 'enUS': v.optional(v.string()) }),
    ),
    slug: v.string(),
    content: v.string(),
    contentTranslations: v.optional(
      v.object({ 'ptBR': v.string(), 'enUS': v.optional(v.string()) }),
    ),
    imageId: v.optional(v.id('imageMetadata')),
    imageUrl: v.optional(v.string()),
    tags: v.array(v.string()),
    featured: v.boolean(),
    status: v.union(v.literal('draft'), v.literal('published')),
    readTime: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requirePlugin(ctx, 'blog');
    await requireRole(ctx, ['root', 'admin', 'content-editor', 'blog-editor']);
    const userId = await getAuthUserId(ctx);

    const existing = await ctx.db
      .query('posts')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .unique();
    if (existing) throw new Error('Slug already in use');

    const now = Date.now();
    const id = await ctx.db.insert('posts', {
      ...args,
      authorId: userId ?? undefined,
      publishedAt: args.status === 'published' ? now : undefined,
      createdAt: now,
    });
    if (args.status === 'published') await markPendingChanges(ctx);
    await logAudit(ctx, { eventType: 'admin.create', actorType: 'user', actorId: userId ?? undefined, targetType: 'post', targetId: id, metadata: { label: args.title }, success: true });
    return id;
  },
});

export const update = mutation({
  args: {
    id: v.id('posts'),
    title: v.optional(v.string()),
    titleTranslations: v.optional(
      v.object({ 'ptBR': v.string(), 'enUS': v.optional(v.string()) }),
    ),
    subtitle: v.optional(v.string()),
    subtitleTranslations: v.optional(
      v.object({ 'ptBR': v.string(), 'enUS': v.optional(v.string()) }),
    ),
    slug: v.optional(v.string()),
    content: v.optional(v.string()),
    contentTranslations: v.optional(
      v.object({ 'ptBR': v.string(), 'enUS': v.optional(v.string()) }),
    ),
    imageId: v.optional(v.id('imageMetadata')),
    imageUrl: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    featured: v.optional(v.boolean()),
    readTime: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requirePlugin(ctx, 'blog');
    const { userId } = await requireRole(ctx, ['root', 'admin', 'content-editor', 'blog-editor']);
    const existing = await ctx.db.get(args.id);
    const { id, ...fields } = args;
    await ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
    const post = await ctx.db.get(id);
    if (post?.status === 'published') await markPendingChanges(ctx);
    await logAudit(ctx, { eventType: 'admin.update', actorType: 'user', actorId: userId, targetType: 'post', targetId: id, metadata: { label: existing?.title }, success: true });
  },
});

export const publish = mutation({
  args: { id: v.id('posts') },
  handler: async (ctx, args) => {
    await requirePlugin(ctx, 'blog');
    const { userId } = await requireRole(ctx, ['root', 'admin', 'content-editor', 'blog-editor']);
    const post = await ctx.db.get(args.id);
    const now = Date.now();
    await ctx.db.patch(args.id, { status: 'published', publishedAt: now, updatedAt: now });
    await markPendingChanges(ctx);
    await logAudit(ctx, { eventType: 'admin.publish', actorType: 'user', actorId: userId, targetType: 'post', targetId: args.id, metadata: { label: post?.title }, success: true });
  },
});

export const unpublish = mutation({
  args: { id: v.id('posts') },
  handler: async (ctx, args) => {
    await requirePlugin(ctx, 'blog');
    const { userId } = await requireRole(ctx, ['root', 'admin', 'content-editor', 'blog-editor']);
    const post = await ctx.db.get(args.id);
    await ctx.db.patch(args.id, { status: 'draft', updatedAt: Date.now() });
    await markPendingChanges(ctx);
    await logAudit(ctx, { eventType: 'admin.unpublish', actorType: 'user', actorId: userId, targetType: 'post', targetId: args.id, metadata: { label: post?.title }, success: true });
  },
});

export const remove = mutation({
  args: { id: v.id('posts') },
  handler: async (ctx, args) => {
    await requirePlugin(ctx, 'blog');
    const { userId } = await requireRole(ctx, ['root', 'admin', 'content-editor', 'blog-editor']);
    const post = await ctx.db.get(args.id);
    await softDeleteDoc(ctx, 'posts', args.id, userId);
    if (post?.status === 'published') await markPendingChanges(ctx);
    await logAudit(ctx, { eventType: 'admin.delete', actorType: 'user', actorId: userId, targetType: 'post', targetId: args.id, metadata: { label: post?.title, softDelete: true }, success: true });
  },
});

export const permanentDelete = mutation({
  args: { id: v.id('posts') },
  handler: async (ctx, args) => {
    await requirePlugin(ctx, 'blog');
    const { userId } = await requireRole(ctx, ['root']);
    const post = await ctx.db.get(args.id);
    await ctx.db.delete(args.id);
    if (post?.status === 'published') await markPendingChanges(ctx);
    await logAudit(ctx, { eventType: 'admin.permanent_delete', actorType: 'user', actorId: userId, targetType: 'post', targetId: args.id, metadata: { label: post?.title }, success: true });
  },
});

export const restore = mutation({
  args: { id: v.id('posts') },
  handler: async (ctx, args) => {
    await requirePlugin(ctx, 'blog');
    const { userId } = await requireRole(ctx, ['root']);
    const post = await ctx.db.get(args.id);
    await restoreDoc(ctx, 'posts', args.id);
    if (post?.status === 'published') await markPendingChanges(ctx);
    await logAudit(ctx, { eventType: 'admin.restore', actorType: 'user', actorId: userId, targetType: 'post', targetId: args.id, metadata: { label: post?.title }, success: true });
  },
});

const POSTS_SEED_VALUES = [
  {
    title: 'Convex como backend reativo: além do CRUD',
    titleTranslations: { ptBR: 'Convex como backend reativo: além do CRUD' },
    slug: 'convex-como-backend-reativo-alem-do-crud',
    content: `# Convex como backend reativo: além do CRUD

A maioria dos backends que conhecemos segue o mesmo ritual: você monta rotas REST, conecta um ORM, escreve queries SQL e torce para que o front-end faça cache direito. Funciona, mas tem um custo cognitivo enorme — e a reatividade quase nunca é o ponto forte. Foi exatamente isso que me levou a experimentar o [Convex](https://www.convex.dev/) em um projeto pessoal, e o resultado foi surpreendente.

## O que muda quando o backend é reativo

Com Convex, **funções são o backend inteiro**. Você declara funções \`query\` e \`mutation\` em TypeScript, e elas são executadas no servidor com tipos gerados automaticamente. O grande diferencial é que toda \`query\` é **reativa por padrão**: o cliente recebe atualizações em tempo real sempre que os dados lidos pela query mudam, sem precisar montar um WebSocket manualmente ou configurar subscriptions.

Em outras palavras, você escreve \`ctx.db.query('posts').order('desc')\` e o front-end recebe o resultado automaticamente, refletindo inserções, updates e deletes em milissegundos. Para painéis administrativos, listas compartilhadas e dashboards, isso elimina camadas inteiras de complexidade.

## Schema declarativo e geração de tipos

O schema é definido em \`convex/schema.ts\` usando validadores do \`convex/values\`. A partir daí, o Convex gera um cliente TypeScript com tipos precisos para cada tabela e cada função — incluindo IDs tipados por tabela. O resultado: se você tentar passar um \`Id<'posts'>\` onde o parâmetro espera \`Id<'users'>\`, o TypeScript reclama antes mesmo de você rodar o código.

## Mutations tipadas e side-effects garantidos

Mutations são transacionais e executam **exatamente uma vez**. Side-effects (envio de e-mail, postagem em webhook, atualização de cache) ficam em \`internalAction\` ou \`crons.ts\`, isolados do caminho de leitura. Isso força uma disciplina saudável: leitura rápida no \`query\`, escrita consistente no \`mutation\`, trabalho pesado em actions.

## Onde o CRUD básico fica pequeno

Para o CRUD clássico — listar, criar, atualizar, deletar — o boilerplate é mínimo. Em meia hora você tem um painel com auth, validação, paginação e reatividade ponta a ponta. O esforço de configuração que normalmente toma dias some, e sobra tempo para pensar no domínio.

## Limites e quando não usar

Convex não é bala de prata. Para consultas analíticas pesadas sobre milhões de linhas, um data warehouse ainda ganha. Para integrações complexas com sistemas legados, REST tradicional pode ser mais simples. Mas para o **noventa por cento dos produtos internos, MVPs e painéis administrativos**, a proposta de valor é imbatível: você escreve menos, seu código fica mais legível e a reatividade é cortesia da casa.`,
    contentTranslations: {
      ptBR: `# Convex como backend reativo: além do CRUD

A maioria dos backends que conhecemos segue o mesmo ritual: você monta rotas REST, conecta um ORM, escreve queries SQL e torce para que o front-end faça cache direito. Funciona, mas tem um custo cognitivo enorme — e a reatividade quase nunca é o ponto forte. Foi exatamente isso que me levou a experimentar o Convex em um projeto pessoal, e o resultado foi surpreendente.

O que muda quando o backend é reativo

Com Convex, funções são o backend inteiro. Você declara funções query e mutation em TypeScript, e elas são executadas no servidor com tipos gerados automaticamente. O grande diferencial é que toda query é reativa por padrão: o cliente recebe atualizações em tempo real sempre que os dados lidos pela query mudam, sem precisar montar um WebSocket manualmente ou configurar subscriptions.

Em outras palavras, você escreve ctx.db.query('posts').order('desc') e o front-end recebe o resultado automaticamente, refletindo inserções, updates e deletes em milissegundos. Para painéis administrativos, listas compartilhadas e dashboards, isso elimina camadas inteiras de complexidade.

Schema declarativo e geração de tipos

O schema é definido em convex/schema.ts usando validadores do convex/values. A partir daí, o Convex gera um cliente TypeScript com tipos precisos para cada tabela e cada função — incluindo IDs tipados por tabela. O resultado: se você tentar passar um Id<'posts'> onde o parâmetro espera Id<'users'>, o TypeScript reclama antes mesmo de você rodar o código.

Mutations tipadas e side-effects garantidos

Mutations são transacionais e executam exatamente uma vez. Side-effects ficam em internalAction ou crons.ts, isolados do caminho de leitura. Isso força uma disciplina saudável: leitura rápida no query, escrita consistente no mutation, trabalho pesado em actions.

Onde o CRUD básico fica pequeno

Para o CRUD clássico — listar, criar, atualizar, deletar — o boilerplate é mínimo. Em meia hora você tem um painel com auth, validação, paginação e reatividade ponta a ponta. O esforço de configuração que normalmente toma dias some, e sobra tempo para pensar no domínio.

Limites e quando não usar

Convex não é bala de prata. Para consultas analíticas pesadas sobre milhões de linhas, um data warehouse ainda ganha. Para integrações complexas com sistemas legados, REST tradicional pode ser mais simples. Mas para o noventa por cento dos produtos internos, MVPs e painéis administrativos, a proposta de valor é imbatível: você escreve menos, seu código fica mais legível e a reatividade é cortesia da casa.`,
    },
    tags: ['React', 'Convex'],
    featured: false,
    status: 'published' as const,
    imageUrl:
      'https://picsum.photos/seed/convex-como-backend-reativo-alem-do-crud-1/800/600',
  },
  {
    title: 'Transição de carreira para tecnologia: o que aprendi em 12 meses',
    titleTranslations: {
      ptBR: 'Transição de carreira para tecnologia: o que aprendi em 12 meses',
    },
    slug: 'transicao-de-carreira-para-tecnologia-o-que-aprendi-em-12-meses',
    content: `# Transição de carreira para tecnologia: o que aprendi em 12 meses

Há pouco mais de um ano eu trabalhava numa área completamente diferente. Hoje escrevo código profissionalmente. Esse post não é uma história de superação hiperbólica — é uma lista honesta do que funcionou, do que não funcionou e do que eu faria diferente se tivesse que começar do zero.

## O ponto de partida

Eu não era programador, mas sempre fui curioso. Meu trabalho anterior tinha alguma exposição a dados e planilhas avançadas, então o atrito inicial com lógica foi menor do que eu esperava. Mas a **falta de repertório técnico** era evidente: eu não sabia o que era um terminal, não tinha noção de como a web funcionava por baixo, e Git parecia coisa de filme.

## Os primeiros três meses

Decidi tratar isso como um curso universitário paralelo: das 6h às 8h da manhã eu estudava fundamentos, à noite e nos fins de semana eu praticava. O conteúdo era gratuito e abundantíssimo — MDN, freeCodeCamp, documentação do Node e do React. A parte mais difícil foi **não pular etapas**: entender de verdade como funciona o protocolo HTTP antes de partir para um framework.

Construí um diário de estudos. Cada conceito novo virava uma anotação com três blocos: o que é, por que existe e um exemplo meu. Forçar a escrever me obrigava a explicar, e explicar é a melhor forma de aprender.

## O momento em que tudo mudou

Por volta do quarto mês, comecei a contribuir em projetos open source pequenos. Achei bugs em bibliotecas conhecidas, mandei PRs de correções triviais. A sensação de ver meu código mergeado foi um combustível absurdo. Mas o salto real veio quando comecei a fazer **projetos completos com usuários reais** — nem que fossem amigos e família.

Projeto sem usuário é exercício. Com usuário, é engenharia.

## O que me subestimaram os tutoriais

- **Soft skills importam tanto quanto código**. Comunicação assíncrona, capacidade de receber feedback e organizar tarefas em equipe são diferenciais reais em entrevistas.
- **Currículo não contrata**. Portfolio contrata. Ter dois ou três projetos sólidos, com README honesto e deploy público, vale mais que uma lista infinita de cursos.
- **A comunidade é generosa**. Participei de grupos locais, mentorias coletivas e canais no Discord. Pedir ajuda com humility e contexto rende muito mais do que esperar alguém descobrir seu talento.

## O que eu faria diferente

Começaria por um projeto real desde o primeiro mês, mesmo que fosse horrível. Teria investido mais tempo em aprender **a ler código de outras pessoas**, não só a escrever o meu. E teria começado a contribuir em open source antes — o medo de "não estar pronto" foi meu maior inimigo.

## Conclusão

Transição de carreira não é mágica. É trabalho deliberado, rotina consistente e exposição a problemas reais. Se você está começando, saiba: o caminho existe, mas ele é construído um commit por vez.`,
    contentTranslations: {
      ptBR: `# Transição de carreira para tecnologia: o que aprendi em 12 meses

Há pouco mais de um ano eu trabalhava numa área completamente diferente. Hoje escrevo código profissionalmente. Esse post não é uma história de superação hiperbólica — é uma lista honesta do que funcionou, do que não funcionou e do que eu faria diferente se tivesse que começar do zero.

O ponto de partida

Eu não era programador, mas sempre fui curioso. Meu trabalho anterior tinha alguma exposição a dados e planilhas avançadas, então o atrito inicial com lógica foi menor do que eu esperava. Mas a falta de repertório técnico era evidente: eu não sabia o que era um terminal, não tinha noção de como a web funcionava por baixo, e Git parecia coisa de filme.

Os primeiros três meses

Decidi tratar isso como um curso universitário paralelo: das 6h às 8h da manhã eu estudava fundamentos, à noite e nos fins de semana eu praticava. O conteúdo era gratuito e abundantíssimo — MDN, freeCodeCamp, documentação do Node e do React. A parte mais difícil foi não pular etapas: entender de verdade como funciona o protocolo HTTP antes de partir para um framework.

Construí um diário de estudos. Cada conceito novo virava uma anotação com três blocos: o que é, por que existe e um exemplo meu. Forçar a escrever me obrigava a explicar, e explicar é a melhor forma de aprender.

O momento em que tudo mudou

Por volta do quarto mês, comecei a contribuir em projetos open source pequenos. Achei bugs em bibliotecas conhecidas, mandei PRs de correções triviais. A sensação de ver meu código mergeado foi um combustível absurdo. Mas o salto real veio quando comecei a fazer projetos completos com usuários reais — nem que fossem amigos e família.

Projeto sem usuário é exercício. Com usuário, é engenharia.

O que me subestimaram os tutoriais

Soft skills importam tanto quanto código. Comunicação assíncrona, capacidade de receber feedback e organizar tarefas em equipe são diferenciais reais em entrevistas. Currículo não contrata. Portfolio contrata. Ter dois ou três projetos sólidos, com README honesto e deploy público, vale mais que uma lista infinita de cursos. A comunidade é generosa. Participei de grupos locais, mentorias coletivas e canais no Discord. Pedir ajuda com humility e contexto rende muito mais do que esperar alguém descobrir seu talento.

O que eu faria diferente

Começaria por um projeto real desde o primeiro mês, mesmo que fosse horrível. Teria investido mais tempo em aprender a ler código de outras pessoas, não só a escrever o meu. E teria começado a contribuir em open source antes — o medo de não estar pronto foi meu maior inimigo.

Conclusão

Transição de carreira não é mágica. É trabalho deliberado, rotina consistente e exposição a problemas reais. Se você está começando, saiba: o caminho existe, mas ele é construído um commit por vez.`,
    },
    tags: ['Carreira'],
    featured: false,
    status: 'published' as const,
    imageUrl:
      'https://picsum.photos/seed/transicao-de-carreira-para-tecnologia-o-que-aprendi-em-12-meses-1/800/600',
  },
];

export const seed = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query('posts').collect();
    if (existing.length >= 2) return;

    const now = Date.now();
    for (let i = 0; i < POSTS_SEED_VALUES.length; i += 1) {
      const post = POSTS_SEED_VALUES[i];
      const publishedAt = i === 0 ? now - 86_400_000 : now;
      await ctx.db.insert('posts', { ...post, createdAt: now, publishedAt });
    }
  },
});
