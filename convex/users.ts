import { v } from 'convex/values';
import { mutation, query, action, internalAction, internalMutation, internalQuery } from './_generated/server';
import { requireRole, getUserRole } from './auth';
import { logAudit } from './audit';
import { getAuthUserId, createAccount, modifyAccountCredentials } from '@convex-dev/auth/server';
import { internal } from './_generated/api';

const roleValidator = v.union(
  v.literal('root'),
  v.literal('admin'),
  v.literal('content-editor'),
  v.literal('blog-editor'),
  v.literal('proposal-editor'),
);

/** Returns true when no root user exists — used to show first-time setup UI. */
export const isSetupRequired = query({
  args: {},
  handler: async (ctx) => {
    const root = await ctx.db
      .query('userRoles')
      .withIndex('by_role', (q) => q.eq('role', 'root'))
      .first();
    return root === null;
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, ['root']);
    const users = await ctx.db.query('users').take(100);
    return Promise.all(
      users.map(async (user) => ({
        ...user,
        role: await getUserRole(ctx, user._id),
      })),
    );
  },
});

export const getMyRole = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return getUserRole(ctx, userId);
  },
});

export const assignRole = mutation({
  args: {
    userId: v.id('users'),
    role: roleValidator,
  },
  handler: async (ctx, args) => {
    const { userId: actorId } = await requireRole(ctx, ['root']);

    const existing = await ctx.db
      .query('userRoles')
      .withIndex('by_userId', (q) => q.eq('userId', args.userId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { role: args.role });
    } else {
      await ctx.db.insert('userRoles', {
        userId: args.userId,
        role: args.role,
        createdAt: Date.now(),
        createdBy: actorId,
      });
    }

    await logAudit(ctx, {
      eventType: 'user.role_assigned',
      actorType: 'user',
      actorId: actorId,
      targetType: 'user',
      targetId: args.userId,
      metadata: { role: args.role },
      success: true,
    });
  },
});

export const removeRole = mutation({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const { userId: actorId } = await requireRole(ctx, ['root']);

    const existing = await ctx.db
      .query('userRoles')
      .withIndex('by_userId', (q) => q.eq('userId', args.userId))
      .unique();

    if (existing) {
      const targetUser = await ctx.db.get(args.userId);
      await ctx.db.delete(existing._id);
      await logAudit(ctx, {
        eventType: 'user.role_removed',
        actorType: 'user',
        actorId: actorId,
        targetType: 'user',
        targetId: args.userId,
        metadata: {
          role: existing.role,
          email: targetUser?.email,
          name: targetUser?.name,
        },
        success: true,
      });
    }
  },
});

export const assignRoleInternal = internalMutation({
  args: {
    userId: v.id('users'),
    role: roleValidator,
    createdBy: v.optional(v.id('users')),
    mustChangePassword: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('userRoles')
      .withIndex('by_userId', (q) => q.eq('userId', args.userId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { role: args.role });
    } else {
      await ctx.db.insert('userRoles', {
        userId: args.userId,
        role: args.role,
        createdAt: Date.now(),
        createdBy: args.createdBy,
        mustChangePassword: args.mustChangePassword,
      });
    }
  },
});

export const getMustChangePassword = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;
    const roleDoc = await ctx.db
      .query('userRoles')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .unique();
    return roleDoc?.mustChangePassword ?? false;
  },
});

/** Regras de senha do painel (troca de senha e `npx create-rubrica senha`). */
function assertStrongPassword(password: string): void {
  if (password.length < 12) throw new Error('A senha deve ter no mínimo 12 caracteres');
  if (!/[A-Z]/.test(password)) throw new Error('A senha deve conter ao menos uma letra maiúscula');
  if (!/[a-z]/.test(password)) throw new Error('A senha deve conter ao menos uma letra minúscula');
  if (!/[0-9]/.test(password)) throw new Error('A senha deve conter ao menos um número');
}

export const changePassword = action({
  args: {
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    assertStrongPassword(args.newPassword);

    const actorData = await ctx.runQuery(internal.auth.requireAuthQuery, {});

    await modifyAccountCredentials(ctx, {
      provider: 'password',
      account: { id: actorData.user.email as string, secret: args.newPassword },
    });

    await ctx.runMutation(internal.users.clearMustChangePassword, { userId: actorData.userId });
  },
});

export const clearMustChangePassword = internalMutation({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const roleDoc = await ctx.db
      .query('userRoles')
      .withIndex('by_userId', (q) => q.eq('userId', args.userId))
      .unique();
    if (roleDoc) {
      await ctx.db.patch(roleDoc._id, { mustChangePassword: false });
    }
  },
});

export const logAuditInternal = internalMutation({
  args: {
    eventType: v.string(),
    actorId: v.optional(v.string()),
    targetId: v.optional(v.string()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.insert('auditLog', {
      eventType: args.eventType,
      actorType: 'user',
      actorId: args.actorId,
      targetType: 'user',
      targetId: args.targetId,
      metadata: args.metadata,
      success: true,
      createdAt: now,
      expiresAt: now + 2 * 365 * 24 * 60 * 60 * 1000,
    });
  },
});

export const adminCreateUser = action({
  args: {
    name: v.string(),
    email: v.string(),
    role: v.union(
      v.literal('admin'),
      v.literal('content-editor'),
      v.literal('blog-editor'),
      v.literal('proposal-editor'),
    ),
  },
  handler: async (ctx, args) => {
    const actorData = await ctx.runQuery(internal.auth.requireAuthQuery, {});
    const actorRole = await ctx.runQuery(internal.auth.getUserRoleQuery, { userId: actorData.userId });
    if (actorRole?.role !== 'root') throw new Error('Forbidden: only root can create users');

    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    const array = new Uint8Array(12);
    crypto.getRandomValues(array);
    const tempPassword = Array.from(array).map((b) => chars[b % chars.length]).join('');

    const result = await createAccount(ctx, {
      provider: 'password',
      account: { id: args.email, secret: tempPassword },
      profile: { email: args.email, name: args.name },
    });

    await ctx.runMutation(internal.users.assignRoleInternal, {
      userId: result.user._id,
      role: args.role,
      createdBy: actorData.userId,
      mustChangePassword: true,
    });

    await ctx.runMutation(internal.users.logAuditInternal, {
      eventType: 'user.created',
      actorId: actorData.userId,
      targetId: result.user._id,
      metadata: { role: args.role, email: args.email, name: args.name },
    });

    return { userId: result.user._id, tempPassword };
  },
});

/**
 * Promotes the currently authenticated user to root.
 * Only works when no root exists yet (first-time setup).
 * Call this right after the first signIn via the setup form.
 */
export const bootstrapRootUser = mutation({
  args: {},
  handler: async (ctx) => {
    // Guard: bootstrap must be explicitly enabled via env var to prevent accidental escalation
    if (process.env.BOOTSTRAP_ALLOWED !== 'true') {
      throw new Error('Bootstrap is not enabled');
    }

    const existingRoot = await ctx.db
      .query('userRoles')
      .withIndex('by_role', (q) => q.eq('role', 'root'))
      .first();
    if (existingRoot) throw new Error('Root user already exists');

    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error('Not authenticated');

    await ctx.db.insert('userRoles', {
      userId,
      role: 'root',
      createdAt: Date.now(),
    });

    return { userId };
  },
});

// ---- Troca de senha pelo terminal (`npx create-rubrica senha`) --------------
// Funções internas: só quem tem acesso ao projeto no Convex (o dono, logado no CLI)
// consegue chamar. É a saída para quem esqueceu a senha do painel.

export const findPasswordAccount = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const account = await ctx.db
      .query('authAccounts')
      .withIndex('providerAndAccountId', (q) => q.eq('provider', 'password').eq('providerAccountId', email))
      .unique();
    return account ? { accountId: account._id, userId: account.userId } : null;
  },
});

export const afterPasswordReset = internalMutation({
  args: { accountId: v.string(), userId: v.id('users') },
  handler: async (ctx, { accountId, userId }) => {
    // Quem errou a senha demais fica bloqueado mesmo com a senha certa: destrava.
    const limits = await ctx.db
      .query('authRateLimits')
      .withIndex('identifier', (q) => q.eq('identifier', accountId))
      .collect();
    for (const limit of limits) await ctx.db.delete(limit._id);

    const roleDoc = await ctx.db
      .query('userRoles')
      .withIndex('by_userId', (q) => q.eq('userId', userId))
      .unique();
    if (roleDoc) await ctx.db.patch(roleDoc._id, { mustChangePassword: false });

    await logAudit(ctx, {
      eventType: 'auth.password_reset',
      actorType: 'system',
      targetType: 'user',
      targetId: userId,
      metadata: { via: 'cli' },
      success: true,
    });
  },
});

export const resetPasswordInternal = internalAction({
  args: { email: v.string(), password: v.string() },
  handler: async (ctx, args): Promise<{ email: string }> => {
    const email = args.email.trim().toLowerCase();
    assertStrongPassword(args.password);
    const account = await ctx.runQuery(internal.users.findPasswordAccount, { email });
    if (!account) throw new Error(`Nenhum usuário com o e-mail ${email}`);
    await modifyAccountCredentials(ctx, { provider: 'password', account: { id: email, secret: args.password } });
    await ctx.runMutation(internal.users.afterPasswordReset, account);
    return { email };
  },
});
