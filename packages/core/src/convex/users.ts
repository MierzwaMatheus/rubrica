/**
 * Usuários e papéis (port de `convex/users.ts` da v1, com o papel `comercial`).
 */
import { v } from "convex/values";
import { createAccount, getAuthUserId, modifyAccountCredentials } from "@convex-dev/auth/server";
import { actionUserId, getUserRole, normalizeEmail, requireRole } from "./auth";
import { logAudit, logUserAction } from "./audit";
import { action, internalAction, internalMutation, internalQuery, mutation, query, ref, type Id, type MutationCtx } from "./server";
import { vRole } from "./validators";
import type { Role } from "./lib/roles";

/** Regras de senha do painel (troca de senha e `npx create-rubrica senha`). */
export function assertStrongPassword(password: string): void {
  if (password.length < 12) throw new Error("A senha deve ter no mínimo 12 caracteres");
  if (!/[A-Z]/.test(password)) throw new Error("A senha deve conter ao menos uma letra maiúscula");
  if (!/[a-z]/.test(password)) throw new Error("A senha deve conter ao menos uma letra minúscula");
  if (!/[0-9]/.test(password)) throw new Error("A senha deve conter ao menos um número");
}

/** Senha temporária de 16 caracteres sem os ambíguos (0/O, 1/l/I), com as quatro classes. */
export function temporaryPassword(): string {
  const sets = ["ABCDEFGHJKLMNPQRSTUVWXYZ", "abcdefghjkmnpqrstuvwxyz", "23456789", "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789"];
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b, i) => {
    const set = sets[Math.min(i, 3)]!;
    return set[b % set.length]!;
  }).join("");
}

/** Papel que alguém pode receber pelo painel: root só existe pelo setup. */
const vAssignableRole = v.union(
  v.literal("admin"),
  v.literal("content-editor"),
  v.literal("blog-editor"),
  v.literal("proposal-editor"),
  v.literal("comercial"),
);

async function roleDoc(ctx: MutationCtx, userId: Id<"users">) {
  return ctx.db
    .query("userRoles")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique();
}

async function countRoots(ctx: MutationCtx): Promise<number> {
  return (await ctx.db.query("userRoles").withIndex("by_role", (q) => q.eq("role", "root")).take(2)).length;
}

async function upsertRole(
  ctx: MutationCtx,
  userId: Id<"users">,
  role: Role,
  extra: { createdBy?: Id<"users">; mustChangePassword?: boolean } = {},
): Promise<void> {
  const existing = await roleDoc(ctx, userId);
  if (existing) await ctx.db.patch(existing._id, { role });
  else await ctx.db.insert("userRoles", { userId, role, createdAt: Date.now(), ...extra });
}

const refs = {
  actor: ref<"query", Record<string, never>, { userId: Id<"users">; email: string | null; role: Role | null }>("query", "users", "actor"),
  assignRoleInternal: ref<"mutation", { userId: Id<"users">; role: Role; createdBy?: Id<"users">; mustChangePassword?: boolean }, null>(
    "mutation",
    "users",
    "assignRoleInternal",
  ),
  isSetupRequired: ref<"query", Record<string, never>, boolean>("query", "users", "isSetupRequired"),
  findPasswordAccount: ref<"query", { email: string }, { accountId: string; userId: Id<"users"> } | null>("query", "users", "findPasswordAccount"),
  afterPasswordReset: ref<"mutation", { accountId: string; userId: Id<"users"> }, null>("mutation", "users", "afterPasswordReset"),
  clearMustChangePassword: ref<"mutation", { userId: Id<"users"> }, null>("mutation", "users", "clearMustChangePassword"),
  hitRateLimit: ref<"mutation", { type: string; identifier: string }, null>("mutation", "audit", "hitRateLimit"),
  logFromAction: ref<"mutation", Record<string, unknown>, null>("mutation", "audit", "logFromAction"),
};

export function usersFunctions() {
  return {
    /** Sem nenhum root ainda: o painel mostra a tela de primeiro acesso (rodar o `setup`). */
    isSetupRequired: query({
      args: {},
      handler: async (ctx) => {
        const root = await ctx.db.query("userRoles").withIndex("by_role", (q) => q.eq("role", "root")).first();
        return root === null;
      },
    }),

    /** Usuário logado, com papel. `null` se não logado. */
    me: query({
      args: {},
      handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return null;
        const user = await ctx.db.get(userId);
        if (!user) return null;
        const role = await ctx.db
          .query("userRoles")
          .withIndex("by_userId", (q) => q.eq("userId", userId))
          .unique();
        return {
          userId,
          email: user.email ?? null,
          name: user.name ?? null,
          role: role?.role ?? null,
          mustChangePassword: role?.mustChangePassword ?? false,
        };
      },
    }),

    list: query({
      args: {},
      handler: async (ctx) => {
        await requireRole(ctx, "users");
        const users = await ctx.db.query("users").take(200);
        return Promise.all(
          users.map(async (user) => ({
            userId: user._id,
            email: user.email ?? null,
            name: user.name ?? null,
            createdAt: user._creationTime,
            role: await getUserRole(ctx, user._id),
          })),
        );
      },
    }),

    /** Cria um usuário com senha temporária (troca obrigatória no primeiro acesso). Só root. */
    create: action({
      args: { name: v.string(), email: v.string(), role: vAssignableRole },
      handler: async (ctx, args): Promise<{ userId: Id<"users">; tempPassword: string }> => {
        await actionUserId(ctx);
        const actor = await ctx.runQuery(refs.actor, {});
        if (actor.role !== "root") throw new Error("Sem permissão para esta ação");
        await ctx.runMutation(refs.hitRateLimit, { type: "user_create", identifier: actor.userId });
        const email = normalizeEmail(args.email);
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("E-mail inválido");
        const existing = await ctx.runQuery(refs.findPasswordAccount, { email });
        if (existing) throw new Error("Já existe um usuário com esse e-mail");
        const tempPassword = temporaryPassword();
        const { user } = await createAccount(ctx, {
          provider: "password",
          account: { id: email, secret: tempPassword },
          profile: { email, name: args.name.trim() },
        });
        const userId = user._id as Id<"users">;
        await ctx.runMutation(refs.assignRoleInternal, { userId, role: args.role, createdBy: actor.userId, mustChangePassword: true });
        await ctx.runMutation(refs.logFromAction, {
          eventType: "user.created",
          actorId: actor.userId,
          targetType: "user",
          targetId: userId,
          metadata: { role: args.role, email, name: args.name },
          success: true,
        });
        return { userId, tempPassword };
      },
    }),

    /** Troca o papel de alguém. Só root; ninguém muda o próprio papel. */
    setRole: mutation({
      args: { userId: v.id("users"), role: vRole },
      handler: async (ctx, args) => {
        const { userId: actorId } = await requireRole(ctx, "users");
        if (args.userId === actorId) throw new Error("Você não pode mudar o próprio papel");
        if (!(await ctx.db.get(args.userId))) throw new Error("Usuário não encontrado");
        const current = await roleDoc(ctx, args.userId);
        if (current?.role === "root" && args.role !== "root" && (await countRoots(ctx)) <= 1) {
          throw new Error("O site precisa de pelo menos um root");
        }
        await upsertRole(ctx, args.userId, args.role, { createdBy: actorId });
        await logUserAction(ctx, actorId, "user.role_assigned", { type: "user", id: args.userId }, { role: args.role, previous: current?.role });
      },
    }),

    /** Tira o acesso: apaga papel, sessões, contas de login e o usuário. Só root. */
    remove: mutation({
      args: { userId: v.id("users") },
      handler: async (ctx, args) => {
        const { userId: actorId } = await requireRole(ctx, "users");
        if (args.userId === actorId) throw new Error("Você não pode remover a si mesmo");
        const user = await ctx.db.get(args.userId);
        if (!user) throw new Error("Usuário não encontrado");
        const role = await roleDoc(ctx, args.userId);
        if (role?.role === "root" && (await countRoots(ctx)) <= 1) throw new Error("O site precisa de pelo menos um root");
        if (role) await ctx.db.delete(role._id);
        const sessions = await ctx.db
          .query("authSessions")
          .withIndex("userId", (q) => q.eq("userId", args.userId))
          .collect();
        for (const session of sessions) {
          const tokens = await ctx.db
            .query("authRefreshTokens")
            .withIndex("sessionId", (q) => q.eq("sessionId", session._id))
            .collect();
          for (const token of tokens) await ctx.db.delete(token._id);
          await ctx.db.delete(session._id);
        }
        const accounts = await ctx.db
          .query("authAccounts")
          .withIndex("userIdAndProvider", (q) => q.eq("userId", args.userId))
          .collect();
        for (const account of accounts) await ctx.db.delete(account._id);
        await ctx.db.delete(args.userId);
        await logUserAction(ctx, actorId, "user.removed", { type: "user", id: args.userId }, { role: role?.role, email: user.email, name: user.name });
      },
    }),

    /** Troca a própria senha (e libera a troca obrigatória do primeiro acesso). */
    changePassword: action({
      args: { newPassword: v.string() },
      handler: async (ctx, args) => {
        await actionUserId(ctx);
        const actor = await ctx.runQuery(refs.actor, {});
        if (!actor.email) throw new Error("Usuário sem e-mail");
        await ctx.runMutation(refs.hitRateLimit, { type: "password_change", identifier: actor.userId });
        assertStrongPassword(args.newPassword);
        await modifyAccountCredentials(ctx, { provider: "password", account: { id: actor.email, secret: args.newPassword } });
        await ctx.runMutation(refs.clearMustChangePassword, { userId: actor.userId });
        await ctx.runMutation(refs.logFromAction, { eventType: "auth.password_changed", actorId: actor.userId, targetType: "user", targetId: actor.userId, success: true });
      },
    }),

    // ── Internas (CLI e actions) ─────────────────────────────────────────

    /** Quem está logado, para as actions (que não leem o banco direto). */
    actor: internalQuery({
      args: {},
      handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Não autenticado");
        const user = await ctx.db.get(userId);
        if (!user) throw new Error("Usuário não encontrado");
        return { userId, email: user.email ?? null, role: await getUserRole(ctx, userId) };
      },
    }),

    assignRoleInternal: internalMutation({
      args: { userId: v.id("users"), role: vRole, createdBy: v.optional(v.id("users")), mustChangePassword: v.optional(v.boolean()) },
      handler: async (ctx, args) => {
        await upsertRole(ctx, args.userId, args.role, { createdBy: args.createdBy, mustChangePassword: args.mustChangePassword });
        return null;
      },
    }),

    clearMustChangePassword: internalMutation({
      args: { userId: v.id("users") },
      handler: async (ctx, args) => {
        const doc = await roleDoc(ctx, args.userId);
        if (doc) await ctx.db.patch(doc._id, { mustChangePassword: false });
        return null;
      },
    }),

    /** Primeiro root, criado pelo `setup` do CLI. Falha se já existir um. */
    setupRoot: internalAction({
      args: { email: v.string(), password: v.string(), name: v.optional(v.string()) },
      handler: async (ctx, args): Promise<{ userId: Id<"users"> }> => {
        if (!(await ctx.runQuery(refs.isSetupRequired, {}))) throw new Error("Já existe um usuário root");
        assertStrongPassword(args.password);
        const email = normalizeEmail(args.email);
        const { user } = await createAccount(ctx, {
          provider: "password",
          account: { id: email, secret: args.password },
          profile: { email, ...(args.name ? { name: args.name } : {}) },
        });
        const userId = user._id as Id<"users">;
        await ctx.runMutation(refs.assignRoleInternal, { userId, role: "root" });
        await ctx.runMutation(refs.logFromAction, { eventType: "user.root_created", targetType: "user", targetId: userId, metadata: { via: "setup" }, success: true });
        return { userId };
      },
    }),

    findPasswordAccount: internalQuery({
      args: { email: v.string() },
      handler: async (ctx, { email }) => {
        const account = await ctx.db
          .query("authAccounts")
          .withIndex("providerAndAccountId", (q) => q.eq("provider", "password").eq("providerAccountId", normalizeEmail(email)))
          .unique();
        return account ? { accountId: account._id as string, userId: account.userId } : null;
      },
    }),

    afterPasswordReset: internalMutation({
      args: { accountId: v.string(), userId: v.id("users") },
      handler: async (ctx, { accountId, userId }) => {
        // Quem errou a senha demais fica bloqueado mesmo com a senha certa: destrava.
        const limits = await ctx.db
          .query("authRateLimits")
          .withIndex("identifier", (q) => q.eq("identifier", accountId))
          .collect();
        for (const limit of limits) await ctx.db.delete(limit._id);
        const doc = await roleDoc(ctx, userId);
        if (doc) await ctx.db.patch(doc._id, { mustChangePassword: false });
        await logAudit(ctx, { eventType: "auth.password_reset", actorType: "system", targetType: "user", targetId: userId, metadata: { via: "cli" }, success: true });
        return null;
      },
    }),

    /** Troca de senha pelo terminal (`npx create-rubrica senha`): só quem tem acesso ao Convex. */
    resetPasswordInternal: internalAction({
      args: { email: v.string(), password: v.string() },
      handler: async (ctx, args): Promise<{ email: string }> => {
        const email = normalizeEmail(args.email);
        assertStrongPassword(args.password);
        const account = await ctx.runQuery(refs.findPasswordAccount, { email });
        if (!account) throw new Error(`Nenhum usuário com o e-mail ${email}`);
        await modifyAccountCredentials(ctx, { provider: "password", account: { id: email, secret: args.password } });
        await ctx.runMutation(refs.afterPasswordReset, account);
        return { email };
      },
    }),
  };
}
