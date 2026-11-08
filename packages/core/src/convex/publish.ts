/**
 * Botão "publicar" do painel (decisão 21, port de `deploy.ts`/`publishStatus.ts` da
 * v1 sem acoplar à Vercel): chama o deploy hook de `RUBRICA_DEPLOY_HOOK_URL`, de
 * qualquer provedor (Vercel, Netlify, Cloudflare Pages…), com POST sem corpo.
 *
 * Estados:
 * - `publicando`: o hook foi chamado e o build ainda não avisou que terminou (aviso em
 *   `POST /rubrica/publicacao/concluida`, ou presumido depois de `PUBLISHING_WINDOW_MS`);
 * - `pendente`: há mudanças no conteúdo desde a última publicação. As mudanças saem do
 *   registro de atividades (`auditLog`), então qualquer módulo que registra a ação
 *   já conta, sem marcar nada à parte;
 * - `publicado`: nada pendente;
 * - `falhou`: a última chamada ao hook deu erro.
 *
 * Limite: uma chamada por `MIN_INTERVAL_MS` (contando as que falharam).
 */
import { v } from "convex/values";
import { actionUserId, requireRole } from "./auth";
import { logAudit } from "./audit";
import { action, internalMutation, query, ref, type Doc, type Id, type MutationCtx, type ReaderCtx } from "./server";

export const MIN_INTERVAL_MS = 60_000;
export const PUBLISHING_WINDOW_MS = 15 * 60_000;

/** Alvos de `admin.*` que aparecem no site (coleções e páginas). */
const SITE_TARGETS = new Set(["page", "posts", "projects", "services", "testimonials", "faq", "resume", "routine", "plans", "team"]);

/** A ação registrada muda o site publicado? */
export function affectsSite(entry: Pick<Doc<"auditLog">, "eventType" | "targetType">): boolean {
  const [scope] = entry.eventType.split(".");
  if (scope === "admin" || scope === "page") return SITE_TARGETS.has(entry.targetType ?? "");
  if (scope === "settings" || scope === "texts" || scope === "plugin") return true;
  return ["media.updated", "media.deleted", "testimonial.approved", "lgpd.erasure_executed"].includes(entry.eventType);
}

export function deployHookUrl(env: Record<string, string | undefined> = process.env): string | undefined {
  return env.RUBRICA_DEPLOY_HOOK_URL || env.VERCEL_DEPLOY_HOOK_URL || undefined;
}

async function getState(ctx: ReaderCtx): Promise<Doc<"publishState"> | null> {
  return ctx.db.query("publishState").first();
}

async function patchState(ctx: MutationCtx, patch: Partial<Omit<Doc<"publishState">, "_id" | "_creationTime">>): Promise<void> {
  const existing = await getState(ctx);
  if (existing) await ctx.db.patch(existing._id, patch);
  else await ctx.db.insert("publishState", patch);
}

/** Quantas mudanças desde `since` (até 100). No mesmo milissegundo, conta: melhor sobrar que faltar. */
async function pendingChanges(ctx: ReaderCtx, since: number | undefined): Promise<number> {
  const entries = await ctx.db
    .query("auditLog")
    .withIndex("by_createdAt", (q) => (since === undefined ? q : q.gte("createdAt", since)))
    .order("desc")
    .take(500);
  return Math.min(entries.filter(affectsSite).length, 100);
}

export type PublishState = "unconfigured" | "publishing" | "pending" | "published" | "failed";

async function computeStatus(ctx: ReaderCtx) {
  const state = await getState(ctx);
  const now = Date.now();
  const pending = await pendingChanges(ctx, state?.publishedUpTo);
  const configured = !!deployHookUrl();
  const publishing =
    !!state?.lastTriggeredAt && (state.lastPublishedAt ?? 0) < state.lastTriggeredAt && now - state.lastTriggeredAt < PUBLISHING_WINDOW_MS;
  const failed = !!state?.lastErrorAt && state.lastErrorAt >= (state.lastTriggeredAt ?? 0);
  const status: PublishState = !configured ? "unconfigured" : publishing ? "publishing" : failed ? "failed" : pending > 0 ? "pending" : "published";
  return {
    status,
    configured,
    pendingChanges: pending,
    lastTriggeredAt: state?.lastTriggeredAt ?? null,
    lastPublishedAt: state?.lastPublishedAt ?? null,
    lastError: failed ? (state?.lastError ?? null) : null,
    nextAllowedAt: state?.lastAttemptAt ? Math.max(now, state.lastAttemptAt + MIN_INTERVAL_MS) : now,
  };
}

type TriggerResult = { ok: true; skipped?: false } | { ok: true; skipped: true; message: string } | { ok: false; message: string };

const refs = {
  begin: ref<"mutation", { force: boolean }, { go: true; startedAt: number; userId: Id<"users"> } | { go: false; message: string; error: boolean }>("mutation", "publish", "begin"),
  finish: ref<"mutation", { startedAt: number; userId: Id<"users">; ok: boolean; error?: string }, null>("mutation", "publish", "finish"),
};

export function publishFunctions() {
  return {
    /** Estado do botão "publicar" (todo usuário do painel vê). */
    status: query({
      args: {},
      handler: async (ctx) => {
        await requireRole(ctx, "panel");
        return computeStatus(ctx);
      },
    }),

    /** Dispara o build. Sem mudanças pendentes, só com `force`. */
    trigger: action({
      args: { force: v.optional(v.boolean()) },
      handler: async (ctx, args): Promise<TriggerResult> => {
        await actionUserId(ctx);
        const begin = await ctx.runMutation(refs.begin, { force: args.force ?? false });
        if (!begin.go) return begin.error ? { ok: false, message: begin.message } : { ok: true, skipped: true, message: begin.message };
        const url = deployHookUrl();
        let error: string | undefined;
        try {
          const res = await fetch(url!, { method: "POST" });
          if (!res.ok) error = `O provedor recusou o deploy hook: HTTP ${res.status}`;
        } catch (e) {
          error = `Não foi possível chamar o deploy hook: ${(e as Error).message}`;
        }
        await ctx.runMutation(refs.finish, { startedAt: begin.startedAt, userId: begin.userId, ok: !error, ...(error ? { error } : {}) });
        return error ? { ok: false, message: error } : { ok: true };
      },
    }),

    // ── Internas ─────────────────────────────────────────────────────────

    /** Confere papel, configuração, limite e pendências; reserva a vez. */
    begin: internalMutation({
      args: { force: v.boolean() },
      handler: async (ctx, args) => {
        const { userId } = await requireRole(ctx, "publish");
        if (!deployHookUrl()) {
          return { go: false as const, error: true, message: "A publicação não está configurada: defina RUBRICA_DEPLOY_HOOK_URL no Convex (npx create-rubrica publicar faz isso na Vercel)." };
        }
        const state = await getState(ctx);
        const now = Date.now();
        if (state?.lastAttemptAt && now - state.lastAttemptAt < MIN_INTERVAL_MS) {
          const seconds = Math.ceil((state.lastAttemptAt + MIN_INTERVAL_MS - now) / 1000);
          return { go: false as const, error: false, message: `Publicação recente. Tente de novo em ${seconds} s.` };
        }
        if (!args.force && (await pendingChanges(ctx, state?.publishedUpTo)) === 0) {
          return { go: false as const, error: false, message: "Nada novo para publicar." };
        }
        await patchState(ctx, { lastAttemptAt: now });
        return { go: true as const, startedAt: now, userId };
      },
    }),

    finish: internalMutation({
      args: { startedAt: v.number(), userId: v.id("users"), ok: v.boolean(), error: v.optional(v.string()) },
      handler: async (ctx, args) => {
        if (args.ok) {
          await patchState(ctx, { lastTriggeredAt: args.startedAt, lastTriggeredBy: args.userId, publishedUpTo: args.startedAt });
        } else {
          await patchState(ctx, { lastError: args.error, lastErrorAt: Date.now() });
        }
        await logAudit(ctx, {
          eventType: args.ok ? "publish.triggered" : "publish.failed",
          actorType: "user",
          actorId: args.userId,
          targetType: "site",
          metadata: args.error ? { error: args.error } : undefined,
          success: args.ok,
        });
        return null;
      },
    }),

    /** O provedor avisou que o build terminou (rota `/rubrica/publicacao/concluida`). */
    markPublished: internalMutation({
      args: {},
      handler: async (ctx) => {
        await patchState(ctx, { lastPublishedAt: Date.now() });
        return null;
      },
    }),
  };
}
