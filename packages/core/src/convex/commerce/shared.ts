/**
 * Peças comuns do comercial: erros com código (chegam inteiros ao navegador), aviso
 * ao dono do site e checagem de papel + plugin.
 */
import { ConvexError } from "convex/values";
import { requireRole, type Actor } from "../auth";
import type { Permission, Role } from "../lib/roles";
import { requirePlugin } from "../plugins";
import type { RubricaRuntime } from "../runtime";
import { ref, type MutationCtx, type ReaderCtx } from "../server";

/**
 * Códigos dos erros das páginas públicas (proposta e checkout). Em produção o Convex
 * troca a mensagem de um `Error` comum por "Server Error"; a de um `ConvexError`
 * chega inteira, e a página traduz pelo código.
 */
export type CommerceErrorCode =
  | "NOT_FOUND"
  | "EXPIRED"
  | "ALREADY_ACCEPTED"
  | "SESSION_REQUIRED"
  | "INVALID_PASSWORD"
  | "NO_PASSWORD"
  | "TOO_MANY_ATTEMPTS"
  | "INVALID_INPUT"
  | "ALREADY_PAID"
  | "IN_PROGRESS"
  | "METHOD_NOT_ALLOWED"
  | "INVALID_INSTALLMENTS"
  | "BOLETO_ISSUED"
  | "SWITCH_FAILED"
  | "NOT_CONFIGURED"
  | "GATEWAY";

export type CommerceError = ConvexError<{ code: CommerceErrorCode; message: string }>;

export function commerceError(code: CommerceErrorCode, message: string): CommerceError {
  return new ConvexError({ code, message });
}

/** Código e mensagem de um erro qualquer, para as respostas HTTP. */
export function errorPayload(err: unknown): { error: string; message: string } {
  if (err instanceof ConvexError && err.data && typeof err.data === "object" && "code" in err.data) {
    const data = err.data as { code: string; message?: string };
    return { error: data.code, message: data.message ?? data.code };
  }
  const message = err instanceof Error ? err.message : String(err);
  return { error: "ERROR", message };
}

/** Papel e plugin, nessa ordem (sem login, "Não autenticado" vem antes de "plugin desligado"). */
export async function guard(ctx: ReaderCtx, rt: RubricaRuntime, permission: Permission | readonly Role[], ...plugins: string[]): Promise<Actor> {
  const actor = await requireRole(ctx, permission);
  for (const plugin of plugins) await requirePlugin(ctx, rt, plugin);
  return actor;
}

/**
 * Avisa o dono do site (Telegram, se configurado). Agendado: a falha do aviso não
 * desfaz o que gerou o aviso.
 */
export async function notifyAdmin(ctx: MutationCtx, message: string): Promise<void> {
  await ctx.scheduler.runAfter(0, ref("action", "commerce", "notifyAdmin"), { message });
}

export const formatBRL = (value: number) => `R$ ${value.toFixed(2).replace(".", ",")}`;

export function normalizeEmailAddress(email: string): string {
  return email.trim().toLowerCase();
}

/** Texto do navegador, cortado (cabeçalhos vêm do cliente). */
export function clip(value: string | undefined, max: number): string | undefined {
  return value === undefined ? undefined : value.slice(0, max);
}
