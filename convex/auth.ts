import { v } from "convex/values";
import { query, internalQuery } from "./_generated/server";
import { convexAuth, getAuthUserId } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { Id } from "./_generated/dataModel";
import { QueryCtx, MutationCtx } from "./_generated/server";

// sign-up bloqueado: apenas root/admin criam usuários via users.adminCreateUser
const PasswordNoSignUp = Password({
  profile(params) {
    if ((params as { flow?: string }).flow === "signUp") {
      throw new Error("Cadastro público desabilitado");
    }
    return { email: params.email as string };
  },
});

/** Senhas erradas por conta, por hora. Depois disso, uma nova tentativa a cada 12 minutos. */
export const MAX_FAILED_SIGN_INS_PER_HOUR = 5;

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [PasswordNoSignUp],
  // O Convex Auth conta as falhas por conta (tabela authRateLimits) e bloqueia o login
  // ao estourar o limite, mesmo com a senha certa, até a janela liberar.
  signIn: { maxFailedAttempsPerHour: MAX_FAILED_SIGN_INS_PER_HOUR },
});

export const getAuthUser = query({
  args: {},
  handler: async ctx => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return ctx.db.get(userId);
  },
});

export const requireAuthQuery = internalQuery({
  args: {},
  handler: async ctx => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");
    return { userId, user };
  },
});

export const getUserRoleQuery = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const roleDoc = await ctx.db
      .query("userRoles")
      .withIndex("by_userId", q => q.eq("userId", args.userId))
      .unique();
    return roleDoc;
  },
});

export const requireRoleQuery = internalQuery({
  args: { allowedRoles: v.array(v.string()) },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");
    const roleDoc = await ctx.db
      .query("userRoles")
      .withIndex("by_userId", q => q.eq("userId", userId))
      .unique();
    const role = roleDoc?.role ?? null;
    if (!role || !args.allowedRoles.includes(role)) {
      throw new Error("Forbidden: insufficient permissions");
    }
    return { userId, user, role };
  },
});

export async function requireAuth(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Unauthorized");
  const user = await ctx.db.get(userId);
  if (!user) throw new Error("User not found");
  return { userId, user };
}

export async function getUserRole(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">
) {
  const roleDoc = await ctx.db
    .query("userRoles")
    .withIndex("by_userId", q => q.eq("userId", userId))
    .unique();
  return roleDoc?.role ?? null;
}

export async function requireRole(
  ctx: QueryCtx | MutationCtx,
  allowedRoles: Array<"root" | "admin" | "content-editor" | "blog-editor" | "proposal-editor">
) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Unauthorized");
  const user = await ctx.db.get(userId);
  if (!user) throw new Error("User not found");
  const roleDoc = await ctx.db
    .query("userRoles")
    .withIndex("by_userId", q => q.eq("userId", userId))
    .unique();
  const role = roleDoc?.role ?? null;
  if (!role || !allowedRoles.includes(role)) {
    throw new Error("Forbidden: insufficient permissions");
  }
  return { userId, user, role };
}
