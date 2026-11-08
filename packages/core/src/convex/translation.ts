/**
 * Tradução com IA (plugin `translation`, decisão 32). O núcleo cuida dos idiomas; este
 * módulo só sugere textos, pelo OpenRouter (`OPENROUTER_API_KEY`).
 *
 * - `translate`: textos soltos (o botão "traduzir" de um campo). Devolve a sugestão.
 * - `translateDocument`: todos os campos traduzíveis de uma página, post ou item de
 *   coleção, de um idioma para outro. Devolve as sugestões sem gravar.
 * - `applyDocument`: o mesmo, gravando no documento (só os campos que vieram).
 *
 * Quem pode: quem edita aquele conteúdo (páginas → `pages`, posts → `blog`, planos →
 * `plans`, o resto → `content`). HTML preservado e sanitizado ao gravar.
 */
import { v } from "convex/values";
import { actionUserId, requireRole } from "./auth";
import { logUserAction } from "./audit";
import { preparePageBlocks } from "./lib/blocks";
import { hasHtml, modelsFrom, translateMany } from "./lib/openrouter";
import { PERMISSIONS, type Permission, type Role } from "./lib/roles";
import { sanitizeHtml } from "./lib/sanitize";
import { isLocaleCode } from "./lib/text";
import { applyTranslations, collectTranslatable, parsePath, pathToString, type Path } from "./lib/translatable";
import { enabledPluginsFor, getSettingsDoc, requirePlugin } from "./plugins";
import type { RubricaRuntime } from "./runtime";
import { COLLECTION_TABLES } from "./schema";
import { action, internalMutation, internalQuery, ref, type ActionCtx, type ReaderCtx } from "./server";
import { vCollectionName } from "./validators";
import type { BlockInstance, CollectionName } from "../content/types";

const vTarget = v.union(
  v.object({ kind: v.literal("page"), id: v.string() }),
  v.object({ kind: v.literal("collection"), collection: vCollectionName, id: v.string() }),
);
type Target = { kind: "page"; id: string } | { kind: "collection"; collection: CollectionName; id: string };

const MAX_TEXTS = 50;
const MAX_CHARS = 20_000;
/** Soma dos textos de um documento traduzido de uma vez. */
const MAX_DOCUMENT_CHARS = 200_000;

function permissionFor(target: Target | undefined): Permission | readonly Role[] {
  if (!target) {
    // Campo solto: qualquer um que edite algum texto.
    return [...new Set([...PERMISSIONS.pages, ...PERMISSIONS.content, ...PERMISSIONS.blog, ...PERMISSIONS.plans])] as Role[];
  }
  if (target.kind === "page") return "pages";
  if (target.collection === "posts") return "blog";
  if (target.collection === "plans") return "plans";
  return "content";
}

function tableOf(target: Target): string {
  return target.kind === "page" ? "pages" : COLLECTION_TABLES[target.collection];
}

async function loadTarget(ctx: ReaderCtx, target: Target): Promise<Record<string, unknown>> {
  const table = tableOf(target);
  const id = ctx.db.normalizeId(table as "pages", target.id);
  const doc = id ? await ctx.db.get(id) : null;
  if (!doc) throw new Error("Documento não encontrado");
  if ((doc as { deletedAt?: number }).deletedAt !== undefined) throw new Error("O documento está na lixeira");
  return doc as Record<string, unknown>;
}

function assertLocales(from: string, to: string, siteLocales: string[]): void {
  if (!isLocaleCode(from) || !isLocaleCode(to)) throw new Error("Código de idioma inválido");
  if (from === to) throw new Error("Os idiomas de origem e destino são iguais");
  if (!siteLocales.includes(to)) throw new Error(`O idioma "${to}" não está na lista do site`);
}

/** Tradução que não respeita o tipo do campo: texto puro que virou HTML. HTML é sanitizado. */
function finalize(source: string, translated: string): string | null {
  if (!hasHtml(source)) return hasHtml(translated) ? null : translated;
  return sanitizeHtml(translated);
}

type Suggestion = { path: string; source: string; current?: string; suggestion: string | null; error?: string };

const refs = {
  prepare: ref<"query", { target?: Target; from: string; to: string; overwrite?: boolean }, { siteUrl: string; fields: { path: Path; source: string; current?: string }[] }>(
    "query",
    "translation",
    "prepare",
  ),
  apply: ref<"mutation", { target: Target; from: string; to: string; items: { path: string; value: string }[] }, { applied: string[] }>("mutation", "translation", "apply"),
};

export function translationFunctions(rt: RubricaRuntime) {
  function options(from: string, to: string, siteUrl: string) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) throw new Error("A tradução não está configurada: defina OPENROUTER_API_KEY no Convex");
    return { from, to, apiKey, models: modelsFrom(process.env), referer: siteUrl };
  }

  async function suggestions(ctx: ActionCtx, args: { target: Target; from: string; to: string; overwrite?: boolean; paths?: string[] }): Promise<Suggestion[]> {
    const { siteUrl, fields } = await ctx.runQuery(refs.prepare, { target: args.target, from: args.from, to: args.to, overwrite: args.overwrite });
    const wanted = args.paths ? new Set(args.paths) : null;
    const chosen = fields.filter((f) => !wanted || wanted.has(pathToString(f.path)));
    if (chosen.reduce((n, f) => n + f.source.length, 0) > MAX_DOCUMENT_CHARS) throw new Error("Documento grande demais para traduzir de uma vez: escolha os campos (paths)");
    const results = await translateMany(
      chosen.map((f) => f.source),
      options(args.from, args.to, siteUrl),
    );
    return chosen.map((f, i) => {
      const r = results[i]!;
      const base = { path: pathToString(f.path), source: f.source, ...(f.current !== undefined ? { current: f.current } : {}) };
      if ("error" in r) return { ...base, suggestion: null, error: r.error };
      const text = finalize(f.source, r.text);
      return text === null ? { ...base, suggestion: null, error: "A tradução acrescentou HTML a um texto simples" } : { ...base, suggestion: text };
    });
  }

  return {
    /** Traduz textos soltos (até 50). Falha de um texto vem como `null` com o erro. */
    translate: action({
      args: { texts: v.array(v.string()), from: v.string(), to: v.string() },
      handler: async (ctx, args): Promise<{ translations: (string | null)[]; errors: (string | null)[] }> => {
        await actionUserId(ctx);
        if (args.texts.length > MAX_TEXTS) throw new Error(`No máximo ${MAX_TEXTS} textos por vez`);
        if (args.texts.some((t) => t.length > MAX_CHARS)) throw new Error(`Cada texto pode ter até ${MAX_CHARS} caracteres`);
        const { siteUrl } = await ctx.runQuery(refs.prepare, { from: args.from, to: args.to });
        const results = await translateMany(args.texts, options(args.from, args.to, siteUrl));
        const translations = results.map((r, i) => ("error" in r ? null : finalize(args.texts[i]!, r.text)));
        return {
          translations,
          errors: results.map((r, i) => ("error" in r ? r.error : translations[i] === null ? "A tradução acrescentou HTML a um texto simples" : null)),
        };
      },
    }),

    /** Sugestões para os campos traduzíveis do documento, sem gravar. */
    translateDocument: action({
      args: { target: vTarget, from: v.string(), to: v.string(), overwrite: v.optional(v.boolean()), paths: v.optional(v.array(v.string())) },
      handler: async (ctx, args): Promise<{ fields: Suggestion[] }> => {
        await actionUserId(ctx);
        return { fields: await suggestions(ctx, args) };
      },
    }),

    /** Traduz e grava. Sem `overwrite`, só preenche o idioma onde está vazio. */
    applyDocument: action({
      args: { target: vTarget, from: v.string(), to: v.string(), overwrite: v.optional(v.boolean()), paths: v.optional(v.array(v.string())) },
      handler: async (ctx, args): Promise<{ applied: string[]; failed: { path: string; error: string }[] }> => {
        await actionUserId(ctx);
        const fields = await suggestions(ctx, args);
        const items = fields.filter((f) => f.suggestion !== null).map((f) => ({ path: f.path, value: f.suggestion! }));
        const { applied } = items.length ? await ctx.runMutation(refs.apply, { target: args.target, from: args.from, to: args.to, items }) : { applied: [] };
        return { applied, failed: fields.filter((f) => f.suggestion === null).map((f) => ({ path: f.path, error: f.error ?? "falhou" })) };
      },
    }),

    // ── Internas ─────────────────────────────────────────────────────────

    /** Confere papel, plugin e idiomas; devolve os campos a traduzir. */
    prepare: internalQuery({
      args: { target: v.optional(vTarget), from: v.string(), to: v.string(), overwrite: v.optional(v.boolean()) },
      handler: async (ctx, args) => {
        await requireRole(ctx, permissionFor(args.target));
        await requirePlugin(ctx, rt, "translation");
        const settings = await getSettingsDoc(ctx);
        if (!settings) throw new Error("O site ainda não foi configurado (rode o setup)");
        assertLocales(args.from, args.to, settings.locales.locales);
        const fields = args.target ? collectTranslatable(await loadTarget(ctx, args.target), args.from, args.to, args.overwrite ?? false) : [];
        return { siteUrl: settings.url, fields };
      },
    }),

    apply: internalMutation({
      args: { target: vTarget, from: v.string(), to: v.string(), items: v.array(v.object({ path: v.string(), value: v.string() })) },
      handler: async (ctx, args) => {
        const { userId } = await requireRole(ctx, permissionFor(args.target));
        await requirePlugin(ctx, rt, "translation");
        const doc = await loadTarget(ctx, args.target);
        const { patch, applied } = applyTranslations(
          doc,
          args.items.map((i) => ({ path: parsePath(i.path), value: i.value })),
          args.to,
        );
        if (!applied.length) return { applied };
        if (args.target.kind === "page" && patch.blocks) {
          const settings = await getSettingsDoc(ctx);
          patch.blocks = preparePageBlocks(patch.blocks as BlockInstance[], {
            blocks: rt.blocks,
            kind: settings?.kind ?? "pessoal",
            enabledPlugins: await enabledPluginsFor(ctx, rt, settings),
          });
        }
        const now = Date.now();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (ctx.db as any).patch(doc._id, { ...patch, updatedAt: now, updatedBy: userId });
        await logUserAction(ctx, userId, "admin.update", { type: args.target.kind === "page" ? "page" : args.target.collection, id: String(doc._id) }, { translatedTo: args.to, fields: applied });
        return { applied };
      },
    }),
  };
}
