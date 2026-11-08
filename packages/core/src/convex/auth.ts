/**
 * Login (`@convex-dev/auth` com senha, como na v1) e checagem de papéis.
 *
 * O cadastro público é bloqueado: só o root cria usuários (`users.create`), e o
 * primeiro root sai do `setup` do CLI (`users.setupRoot`, interna).
 */
import { convexAuth, getAuthUserId } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { PERMISSIONS, type Permission, type Role } from "./lib/roles";
import type { ActionCtx, Doc, Id, ReaderCtx } from "./server";

/**
 * Senhas erradas por conta, por hora. Depois disso, o Convex Auth bloqueia o login
 * (mesmo com a senha certa) e libera uma tentativa a cada 12 minutos. É o rate limit
 * do login: fica na tabela `authRateLimits` do próprio Convex Auth.
 */
export const MAX_FAILED_SIGN_INS_PER_HOUR = 5;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Senha sem cadastro público. */
export const PasswordNoSignUp = Password({
  profile(params) {
    if ((params as { flow?: string }).flow === "signUp") {
      throw new Error("Cadastro público desabilitado");
    }
    return { email: normalizeEmail(String(params.email)) };
  },
});

/** O que o `convex/auth.ts` do projeto reexporta (`auth`, `signIn`, `signOut`, `store`, `isAuthenticated`). */
export function createAuth() {
  return convexAuth({
    providers: [PasswordNoSignUp],
    signIn: { maxFailedAttempsPerHour: MAX_FAILED_SIGN_INS_PER_HOUR },
  });
}

export async function requireAuth(ctx: ReaderCtx): Promise<{ userId: Id<"users">; user: Doc<"users"> }> {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Não autenticado");
  const user = await ctx.db.get(userId);
  if (!user) throw new Error("Usuário não encontrado");
  return { userId, user };
}

export async function getUserRole(ctx: ReaderCtx, userId: Id<"users">): Promise<Role | null> {
  const doc = await ctx.db
    .query("userRoles")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique();
  return doc?.role ?? null;
}

export interface Actor {
  userId: Id<"users">;
  user: Doc<"users">;
  role: Role;
}

/**
 * Exige login e um dos papéis. Aceita a lista de papéis ou o nome de uma permissão
 * de `PERMISSIONS` (`requireRole(ctx, "blog")`).
 */
export async function requireRole(ctx: ReaderCtx, allowed: readonly Role[] | Permission): Promise<Actor> {
  const roles: readonly Role[] = typeof allowed === "string" ? PERMISSIONS[allowed] : allowed;
  const { userId, user } = await requireAuth(ctx);
  const role = await getUserRole(ctx, userId);
  if (!role || !roles.includes(role)) throw new Error("Sem permissão para esta ação");
  return { userId, user, role };
}

/** Usuário logado numa action (sem banco): só o id. O papel vem por uma query interna. */
export async function actionUserId(ctx: ActionCtx): Promise<Id<"users">> {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Não autenticado");
  return userId;
}
