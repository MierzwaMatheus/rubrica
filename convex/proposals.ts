import { v } from 'convex/values';
import { internalMutation, mutation, query } from './_generated/server';
import { internal } from './_generated/api';
import { requireRole, requireAuth } from './auth';
import { logAudit } from './audit';
import { checkRateLimit, recordRateLimitAttempt, resetRateLimit } from './rateLimit';
import { getAuthUserId } from '@convex-dev/auth/server';
import { requirePlugin, isPluginEnabled } from './plugins';
import { softDeleteDoc, restoreDoc } from './lib/softDelete';
import { escapeTgHtml } from './lib/security';

async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = Array.from(salt).map((b) => b.toString(16).padStart(2, '0')).join('');
  const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, keyMaterial, 256);
  const hashHex = Array.from(new Uint8Array(bits)).map((b) => b.toString(16).padStart(2, '0')).join('');
  return `pbkdf2:${saltHex}:${hashHex}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (!stored.startsWith('pbkdf2:')) return false;
  const parts = stored.split(':');
  if (parts.length !== 3) return false;
  const saltHex = parts[1];
  const storedHash = parts[2];
  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map((b) => parseInt(b, 16)));
  const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, keyMaterial, 256);
  const computedHash = Array.from(new Uint8Array(bits)).map((b) => b.toString(16).padStart(2, '0')).join('');
  if (computedHash.length !== storedHash.length) return false;
  const a = new TextEncoder().encode(computedHash);
  const b = new TextEncoder().encode(storedHash);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;

const timelineItemValidator = v.object({ step: v.string(), period: v.string() });

export const listAdmin = query({
  args: {
    filter: v.optional(v.union(v.literal('all'), v.literal('accepted'), v.literal('pending'))),
    limit: v.optional(v.number()),
    includeDeleted: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, ['root', 'admin', 'proposal-editor']);

    const all = args.filter === 'accepted'
      ? await ctx.db
          .query('proposals')
          .withIndex('by_isAccepted', (q) => q.eq('isAccepted', true))
          .order('desc')
          .take(200)
      : await ctx.db.query('proposals').order('desc').take(200);

    const filtered = args.includeDeleted ? all : all.filter((p) => p.deletedAt === undefined);
    return filtered.slice(0, args.limit ?? 50);
  },
});

export const getPublic = query({
  args: { slug: v.string(), token: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (!(await isPluginEnabled(ctx, 'proposals'))) return null;
    const proposal = await ctx.db
      .query('proposals')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .unique();
    if (!proposal) return null;

    const now = Date.now();
    const isExpired = proposal.expiresAt < now;
    const requiresPassword = !!proposal.password;
    let hasValidSession = false;

    if (requiresPassword && args.token) {
      const session = await ctx.db
        .query('proposalSessions')
        .withIndex('by_token', (q) => q.eq('token', args.token!))
        .unique();
      hasValidSession = !!(
        session &&
        session.proposalId === proposal._id &&
        session.expiresAt > now
      );
    }

    return {
      ...proposal,
      password: undefined,
      requiresPassword,
      hasValidSession,
      isExpired,
    };
  },
});

export const generateSignatureUploadUrl = mutation({
  args: {
    slug: v.string(),
    token: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const proposal = await ctx.db
      .query('proposals')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .unique();
    if (!proposal) throw new Error('Proposal not found');
    if (proposal.isAccepted) throw new Error('Proposal already accepted');
    if (proposal.expiresAt < now) throw new Error('Proposal expired');
    if (proposal.password) {
      if (!args.token) throw new Error('Session required');
      const session = await ctx.db
        .query('proposalSessions')
        .withIndex('by_token', (q) => q.eq('token', args.token!))
        .unique();
      if (!session || session.proposalId !== proposal._id || session.expiresAt < now || session.isUsed) {
        throw new Error('Invalid or expired session');
      }
    }
    return ctx.storage.generateUploadUrl();
  },
});

// Admin-only: full acceptance data including PII. Used by the admin panel.
export const getAcceptance = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    await requireRole(ctx, ['root', 'admin', 'proposal-editor']);

    const proposal = await ctx.db
      .query('proposals')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .unique();
    if (!proposal || !proposal.isAccepted) return null;

    const acceptance = await ctx.db
      .query('proposalAcceptances')
      .withIndex('by_proposalId', (q) => q.eq('proposalId', proposal._id))
      .order('desc')
      .first();
    if (!acceptance) return null;

    const signatureUrl = acceptance.signatureStorageId
      ? await ctx.storage.getUrl(acceptance.signatureStorageId)
      : null;

    return { ...acceptance, signatureUrl };
  },
});

// Client-facing: requires a valid proposal session token. Returns full acceptance data
// so the client can download the contract PDF after accepting.
export const getAcceptanceByToken = query({
  args: { slug: v.string(), token: v.string() },
  handler: async (ctx, args) => {
    const now = Date.now();
    const proposal = await ctx.db
      .query('proposals')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .unique();
    if (!proposal || !proposal.isAccepted) return null;

    const session = await ctx.db
      .query('proposalSessions')
      .withIndex('by_token', (q) => q.eq('token', args.token))
      .unique();
    if (!session || session.proposalId !== proposal._id || session.expiresAt < now) return null;

    const acceptance = await ctx.db
      .query('proposalAcceptances')
      .withIndex('by_proposalId', (q) => q.eq('proposalId', proposal._id))
      .order('desc')
      .first();
    if (!acceptance) return null;

    const signatureUrl = acceptance.signatureStorageId
      ? await ctx.storage.getUrl(acceptance.signatureStorageId)
      : null;

    return { ...acceptance, signatureUrl };
  },
});

export const checkSession = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const now = Date.now();
    const session = await ctx.db
      .query('proposalSessions')
      .withIndex('by_token', (q) => q.eq('token', args.token))
      .unique();
    if (!session || session.expiresAt < now) return null;
    return session;
  },
});

export const create = mutation({
  args: {
    clientName: v.string(),
    slug: v.string(),
    title: v.string(),
    titleTranslations: v.optional(
      v.object({ 'ptBR': v.string(), 'enUS': v.optional(v.string()) }),
    ),
    objective: v.string(),
    objectiveTranslations: v.optional(
      v.object({ 'ptBR': v.string(), 'enUS': v.optional(v.string()) }),
    ),
    scope: v.array(v.string()),
    scopeTranslations: v.optional(
      v.object({ 'ptBR': v.array(v.string()), 'enUS': v.optional(v.array(v.string())) }),
    ),
    timeline: v.array(timelineItemValidator),
    deliveryDate: v.string(),
    investmentValue: v.number(),
    paymentMethods: v.array(v.string()),
    conditions: v.array(v.string()),
    conditionsTranslations: v.optional(
      v.object({ 'ptBR': v.array(v.string()), 'enUS': v.optional(v.array(v.string())) }),
    ),
    password: v.optional(v.string()),
    rescissionPolicy: v.string(),
    rescissionPolicyTranslations: v.optional(
      v.object({ 'ptBR': v.string(), 'enUS': v.optional(v.string()) }),
    ),
    templateId: v.optional(v.id('contractTemplates')),
  },
  handler: async (ctx, args) => {
    await requirePlugin(ctx, 'proposals');
    const { userId } = await requireRole(ctx, ['root', 'admin', 'proposal-editor']);

    const existing = await ctx.db
      .query('proposals')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .unique();
    if (existing) throw new Error('Slug already in use');

    const now = Date.now();
    const hashedPassword = args.password ? await hashPassword(args.password) : undefined;
    const id = await ctx.db.insert('proposals', {
      ...args,
      password: hashedPassword,
      userId,
      version: 1,
      isAccepted: false,
      expiresAt: now + TEN_DAYS_MS,
      createdAt: now,
    });

    await logAudit(ctx, {
      eventType: 'admin.create',
      actorType: 'user',
      actorId: userId,
      targetType: 'proposal',
      targetId: id,
      metadata: { label: args.title, clientName: args.clientName },
      success: true,
    });

    return id;
  },
});

export const snapshotTemplate = mutation({
  args: { proposalId: v.id('proposals') },
  handler: async (ctx, { proposalId }) => {
    await requireRole(ctx, ['root', 'admin', 'proposal-editor']);
    const proposal = await ctx.db.get(proposalId);
    if (!proposal) throw new Error('Proposal not found');
    if (proposal.templateSnapshot) return;

    let template: { content: string } | null = null;
    if (proposal.templateId) {
      template = await ctx.db.get(proposal.templateId);
    } else {
      template = await ctx.db
        .query('contractTemplates')
        .withIndex('by_is_default', (q) => q.eq('isDefault', true))
        .unique();
    }
    if (!template) throw new Error('No template found');

    await ctx.db.patch(proposalId, { templateSnapshot: template.content });
  },
});

export const snapshotTemplateOnView = mutation({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const proposal = await ctx.db
      .query('proposals')
      .withIndex('by_slug', (q) => q.eq('slug', slug))
      .unique();
    if (!proposal) return;
    if (proposal.templateSnapshot) return;

    let template: { content: string } | null = null;
    if (proposal.templateId) {
      template = await ctx.db.get(proposal.templateId);
    } else {
      template = await ctx.db
        .query('contractTemplates')
        .withIndex('by_is_default', (q) => q.eq('isDefault', true))
        .unique();
    }
    if (!template) return;

    await ctx.db.patch(proposal._id, { templateSnapshot: template.content });
  },
});

export const update = mutation({
  args: {
    id: v.id('proposals'),
    clientName: v.optional(v.string()),
    title: v.optional(v.string()),
    titleTranslations: v.optional(
      v.object({ 'ptBR': v.string(), 'enUS': v.optional(v.string()) }),
    ),
    objective: v.optional(v.string()),
    objectiveTranslations: v.optional(
      v.object({ 'ptBR': v.string(), 'enUS': v.optional(v.string()) }),
    ),
    scope: v.optional(v.array(v.string())),
    timeline: v.optional(v.array(timelineItemValidator)),
    deliveryDate: v.optional(v.string()),
    investmentValue: v.optional(v.number()),
    paymentMethods: v.optional(v.array(v.string())),
    conditions: v.optional(v.array(v.string())),
    password: v.optional(v.string()),
    rescissionPolicy: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    templateId: v.optional(v.id('contractTemplates')),
  },
  handler: async (ctx, args) => {
    await requirePlugin(ctx, 'proposals');
    const { userId } = await requireRole(ctx, ['root', 'admin', 'proposal-editor']);

    const proposal = await ctx.db.get(args.id);
    if (!proposal) throw new Error('Proposal not found');
    if (proposal.isAccepted) throw new Error('Accepted proposals are immutable');

    const { id, password: plainPassword, ...fields } = args;
    const newVersion = proposal.version + 1;
    const hashedPassword = plainPassword ? await hashPassword(plainPassword) : undefined;

    const templateChanged = args.templateId !== undefined && args.templateId !== proposal.templateId;

    await ctx.db.patch(id, {
      ...fields,
      ...(hashedPassword !== undefined ? { password: hashedPassword } : {}),
      ...(templateChanged ? { templateSnapshot: undefined } : {}),
      version: newVersion,
      updatedAt: Date.now(),
    });

    // Invalidate all existing sessions when the password changes
    if (hashedPassword !== undefined) {
      await ctx.scheduler.runAfter(0, internal.proposals.invalidateSessions, { proposalId: id });
    }

    await logAudit(ctx, {
      eventType: 'admin.update',
      actorType: 'user',
      actorId: userId,
      targetType: 'proposal',
      targetId: id,
      success: true,
    });
  },
});

export const remove = mutation({
  args: { id: v.id('proposals') },
  handler: async (ctx, args) => {
    await requirePlugin(ctx, 'proposals');
    const { userId } = await requireRole(ctx, ['root', 'admin']);

    const proposal = await ctx.db.get(args.id);
    if (!proposal) throw new Error('Not found');
    if (proposal.isAccepted) throw new Error('Cannot delete accepted proposal');

    await softDeleteDoc(ctx, 'proposals', args.id, userId);
    await logAudit(ctx, {
      eventType: 'admin.delete',
      actorType: 'user',
      actorId: userId,
      targetType: 'proposal',
      targetId: args.id,
      metadata: { label: proposal.title, clientName: proposal.clientName, softDelete: true },
      success: true,
    });
  },
});

export const permanentDelete = mutation({
  args: { id: v.id('proposals') },
  handler: async (ctx, args) => {
    await requirePlugin(ctx, 'proposals');
    const { userId } = await requireRole(ctx, ['root']);

    const proposal = await ctx.db.get(args.id);
    if (!proposal) throw new Error('Not found');
    if (proposal.isAccepted) throw new Error('Cannot delete accepted proposal');

    await ctx.db.delete(args.id);
    await logAudit(ctx, {
      eventType: 'admin.permanent_delete',
      actorType: 'user',
      actorId: userId,
      targetType: 'proposal',
      targetId: args.id,
      metadata: { label: proposal.title, clientName: proposal.clientName },
      success: true,
    });
  },
});

export const restore = mutation({
  args: { id: v.id('proposals') },
  handler: async (ctx, args) => {
    await requirePlugin(ctx, 'proposals');
    const { userId } = await requireRole(ctx, ['root']);

    const proposal = await ctx.db.get(args.id);
    if (!proposal) throw new Error('Not found');

    await restoreDoc(ctx, 'proposals', args.id);
    await logAudit(ctx, {
      eventType: 'admin.restore',
      actorType: 'user',
      actorId: userId,
      targetType: 'proposal',
      targetId: args.id,
      metadata: { label: proposal.title, clientName: proposal.clientName },
      success: true,
    });
  },
});

export const _createSessionInternal = internalMutation({
  args: {
    slug: v.string(),
    password: v.string(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const rateLimitKey = `${args.slug}:${args.ipAddress ?? 'unknown'}`;
    const rl = await checkRateLimit(ctx, 'proposal_password', rateLimitKey);
    if (!rl.allowed) {
      throw new Error(`Too many attempts. Try again later.`);
    }

    const proposal = await ctx.db
      .query('proposals')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .unique();
    if (!proposal) throw new Error('Proposal not found');
    if (!proposal.password) throw new Error('This proposal has no password');
    const valid = await verifyPassword(args.password, proposal.password);
    if (!valid) {
      await recordRateLimitAttempt(ctx, 'proposal_password', rateLimitKey);
      throw new Error('Invalid password');
    }

    await resetRateLimit(ctx, 'proposal_password', rateLimitKey);

    const token = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    const now = Date.now();
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

    await ctx.db.insert('proposalSessions', {
      proposalId: proposal._id,
      token,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent ? args.userAgent.substring(0, 256) : undefined,
      isUsed: false,
      expiresAt: now + SEVEN_DAYS_MS,
      createdAt: now,
    });

    return token;
  },
});

export const _acceptInternal = internalMutation({
  args: {
    slug: v.string(),
    token: v.optional(v.string()),
    clientName: v.string(),
    clientDocument: v.string(),
    clientEmail: v.string(),
    clientRole: v.optional(v.string()),
    clientDeclaration: v.optional(v.string()),
    ipAddress: v.string(),
    userAgent: v.string(),
    signatureStorageId: v.optional(v.id('_storage')),
  },
  handler: async (ctx, args) => {
    const proposal = await ctx.db
      .query('proposals')
      .withIndex('by_slug', (q) => q.eq('slug', args.slug))
      .unique();
    if (!proposal) throw new Error('Proposal not found');
    if (proposal.isAccepted) throw new Error('Already accepted');

    const now = Date.now();
    if (proposal.expiresAt < now) throw new Error('Proposal expired');

    let session = null;
    if (proposal.password) {
      if (!args.token) throw new Error('Invalid or expired session');
      session = await ctx.db
        .query('proposalSessions')
        .withIndex('by_token', (q) => q.eq('token', args.token!))
        .unique();
      if (!session || session.proposalId !== proposal._id || session.expiresAt < now) {
        throw new Error('Invalid or expired session');
      }
    }

    // Build content snapshot server-side from authoritative DB data
    const contentSnapshot = JSON.stringify({
      proposal: {
        id: proposal._id,
        version: proposal.version,
        title: proposal.title,
        objective: proposal.objective,
        investmentValue: proposal.investmentValue,
        scope: proposal.scope,
        timeline: proposal.timeline,
        conditions: proposal.conditions,
        rescissionPolicy: proposal.rescissionPolicy,
        deliveryDate: proposal.deliveryDate,
      },
      acceptance: {
        clientName: args.clientName,
        clientDocument: args.clientDocument,
        clientEmail: args.clientEmail,
        clientRole: args.clientRole ?? null,
        clientDeclaration: args.clientDeclaration ?? null,
        acceptedAt: new Date(now).toISOString(),
      },
    });
    const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(contentSnapshot));
    const contentHash = Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, '0')).join('');

    const acceptanceId = await ctx.db.insert('proposalAcceptances', {
      proposalId: proposal._id,
      proposalVersion: proposal.version,
      sessionId: session?._id,
      clientName: args.clientName,
      clientDocument: args.clientDocument,
      clientEmail: args.clientEmail,
      clientRole: args.clientRole,
      clientDeclaration: args.clientDeclaration,
      contentSnapshot,
      contentSnapshotVersion: 'v2-server',
      contentHash,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent.substring(0, 512),
      signatureStorageId: args.signatureStorageId,
      acceptedAt: now,
      createdAt: now,
    });

    await ctx.db.patch(proposal._id, {
      isAccepted: true,
      acceptedAt: now,
      updatedAt: now,
    });
    if (session) await ctx.db.patch(session._id, { isUsed: true });

    await logAudit(ctx, {
      eventType: 'proposal.accepted',
      actorType: 'external',
      actorId: args.clientEmail,
      targetType: 'proposal',
      targetId: proposal._id,
      metadata: { version: proposal.version, email: args.clientEmail, contentHash },
      userAgent: args.userAgent,
      success: true,
    });

    await ctx.scheduler.runAfter(0, internal.telegram.notifyAdmin, {
      message: `✅ <b>Proposta aceita!</b>\n\nCliente: ${escapeTgHtml(args.clientName)}\nEmail: ${escapeTgHtml(args.clientEmail)}\nProposta: <code>${escapeTgHtml(proposal.slug)}</code>\nValor: R$ ${proposal.investmentValue.toFixed(2)}`,
    });

    return { acceptanceId, contentHash };
  },
});

export const requestErasure = mutation({
  args: {
    clientDocument: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireRole(ctx, ['root']);
    if (!args.clientDocument && !args.email) throw new Error('clientDocument or email required');

    const now = Date.now();
    let totalAnonymized = 0;
    const emailsToErase = new Set<string>();
    if (args.email) emailsToErase.add(args.email.toLowerCase().trim());

    // 1. proposalAcceptances — by clientDocument
    if (args.clientDocument) {
      const acceptances = await ctx.db
        .query('proposalAcceptances')
        .withIndex('by_clientDocument', (q) => q.eq('clientDocument', args.clientDocument!))
        .collect();
      for (const acc of acceptances) {
        emailsToErase.add(acc.clientEmail);

        // Redact PII from contentSnapshot while preserving the original contentHash as integrity proof
        let redactedSnapshot = acc.contentSnapshot;
        try {
          const snap = JSON.parse(acc.contentSnapshot) as Record<string, unknown>;
          if (snap.acceptance && typeof snap.acceptance === 'object') {
            const a = snap.acceptance as Record<string, unknown>;
            a.clientName = '[ANONIMIZADO]';
            a.clientDocument = '[ANONIMIZADO]';
            a.clientEmail = '[ANONIMIZADO]@example.invalid';
            a.clientRole = '[ANONIMIZADO]';
            a.clientDeclaration = '[ANONIMIZADO]';
          }
          snap._anonymizedAt = new Date(now).toISOString();
          redactedSnapshot = JSON.stringify(snap);
        } catch { /* keep original if JSON parse fails */ }

        await ctx.db.patch(acc._id, {
          clientName: '[ANONIMIZADO]',
          clientDocument: '[ANONIMIZADO]',
          clientEmail: '[ANONIMIZADO]@example.invalid',
          clientRole: '[ANONIMIZADO]',
          clientDeclaration: '[ANONIMIZADO]',
          contentSnapshot: redactedSnapshot,
          ipAddress: '0.0.0.0',
          userAgent: '[ANONIMIZADO]',
          anonymizedAt: now,
        });
        totalAnonymized++;
      }
    }

    // 2. contactRequests — email está dentro do objeto contactInfo (sem índice direto)
    const allContacts = await ctx.db.query('contactRequests').collect();
    for (const contact of allContacts) {
      if (emailsToErase.has(contact.contactInfo.email.toLowerCase())) {
        await ctx.db.patch(contact._id, {
          contactInfo: {
            name: '[ANONIMIZADO]',
            email: '[ANONIMIZADO]@example.invalid',
            phone: undefined,
            linkedin: undefined,
            company: contact.contactInfo.company ? '[ANONIMIZADO]' : undefined,
          },
          ipAddress: '0.0.0.0',
          userAgent: '[ANONIMIZADO]',
        });
        totalAnonymized++;
      }
    }

    // 3. testimonialSubmissions — by email
    for (const email of Array.from(emailsToErase)) {
      const submissions = await ctx.db
        .query('testimonialSubmissions')
        .withIndex('by_email', (q) => q.eq('email', email))
        .collect();
      for (const sub of submissions) {
        await ctx.db.patch(sub._id, {
          name: '[ANONIMIZADO]',
          email: '[ANONIMIZADO]@example.invalid',
          company: sub.company ? '[ANONIMIZADO]' : undefined,
        });
        totalAnonymized++;
      }
    }

    // 4. checkouts — by customerEmail
    for (const email of Array.from(emailsToErase)) {
      const cos = await ctx.db
        .query('checkouts')
        .withIndex('by_customerEmail', (q) => q.eq('customerEmail', email))
        .collect();
      for (const co of cos) {
        await ctx.db.patch(co._id, {
          customerName: '[ANONIMIZADO]',
          customerEmail: '[ANONIMIZADO]@example.invalid',
          customerCpfCnpj: '00000000000',
          customerMobilePhone: undefined,
          customerPhone: undefined,
          customerCompany: undefined,
        });
        totalAnonymized++;
      }
    }

    // 5. auditLog — by actorId (email)
    for (const email of Array.from(emailsToErase)) {
      const auditEntries = await ctx.db
        .query('auditLog')
        .withIndex('by_actorId', (q) => q.eq('actorId', email))
        .collect();
      for (const entry of auditEntries) {
        await ctx.db.patch(entry._id, {
          actorId: '[ANONIMIZADO]',
          metadata: {
            ...((entry.metadata as Record<string, unknown>) ?? {}),
            email: '[ANONIMIZADO]',
            clientName: '[ANONIMIZADO]',
            contactName: '[ANONIMIZADO]',
            contactEmail: '[ANONIMIZADO]',
          },
        });
      }
    }

    await logAudit(ctx, {
      eventType: 'lgpd.erasure_executed',
      actorType: 'user',
      actorId: userId,
      metadata: { document: args.clientDocument ?? null, email: args.email ?? null, count: totalAnonymized },
      success: true,
    });

    return { anonymized: totalAnonymized };
  },
});

export const exportTitularData = query({
  args: {
    clientDocument: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireRole(ctx, ['root']);
    if (!args.clientDocument && !args.email) throw new Error('clientDocument or email required');

    const emailsToSearch = new Set<string>();
    if (args.email) emailsToSearch.add(args.email.toLowerCase().trim());

    // proposalAcceptances
    let proposals: unknown[] = [];
    if (args.clientDocument) {
      proposals = await ctx.db
        .query('proposalAcceptances')
        .withIndex('by_clientDocument', (q) => q.eq('clientDocument', args.clientDocument!))
        .collect();
      (proposals as Array<{ clientEmail: string }>).forEach((p) => emailsToSearch.add(p.clientEmail));
    }

    // contactRequests — full scan (nested email field)
    const allContacts = await ctx.db.query('contactRequests').collect();
    const contacts = allContacts.filter((c) => emailsToSearch.has(c.contactInfo.email.toLowerCase()));

    // testimonialSubmissions + checkouts — by email index
    const testimonials: unknown[] = [];
    const checkoutsList: unknown[] = [];
    for (const email of Array.from(emailsToSearch)) {
      const subs = await ctx.db
        .query('testimonialSubmissions')
        .withIndex('by_email', (q) => q.eq('email', email))
        .collect();
      testimonials.push(...subs);

      const cos = await ctx.db
        .query('checkouts')
        .withIndex('by_customerEmail', (q) => q.eq('customerEmail', email))
        .collect();
      checkoutsList.push(...cos);
    }

    return { proposals, contacts, testimonials, checkouts: checkoutsList };
  },
});

export const resetPassword = mutation({
  args: {
    id: v.id('proposals'),
    newPassword: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requirePlugin(ctx, 'proposals');
    const { userId } = await requireRole(ctx, ['root', 'admin', 'proposal-editor']);

    const proposal = await ctx.db.get(args.id);
    if (!proposal) throw new Error('Proposal not found');

    const hashedPassword = args.newPassword ? await hashPassword(args.newPassword) : undefined;

    await ctx.db.patch(args.id, {
      password: hashedPassword,
      updatedAt: Date.now(),
    });

    // Invalidate all sessions when password changes
    await ctx.scheduler.runAfter(0, internal.proposals.invalidateSessions, { proposalId: args.id });

    await logAudit(ctx, {
      eventType: 'admin.update',
      actorType: 'user',
      actorId: userId,
      targetType: 'proposal',
      targetId: args.id,
      metadata: { action: 'password_reset', hadPassword: !!args.newPassword },
      success: true,
    });
  },
});

export const invalidateSessions = internalMutation({
  args: { proposalId: v.id('proposals') },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query('proposalSessions')
      .withIndex('by_proposalId', (q) => q.eq('proposalId', args.proposalId))
      .collect();
    for (const session of sessions) {
      await ctx.db.delete(session._id);
    }
  },
});

export const cleanupExpiredSessions = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const expired = await ctx.db
      .query('proposalSessions')
      .withIndex('by_expiresAt', (q) => q.lt('expiresAt', now))
      .take(200);
    for (const session of expired) {
      await ctx.db.delete(session._id);
    }
    return { deleted: expired.length };
  },
});
