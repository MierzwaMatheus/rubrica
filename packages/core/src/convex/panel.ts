/**
 * Funções que só o painel usa e que não cabem nos módulos de conteúdo:
 *
 * - `validatePage`: confere título, caminho e blocos de uma página SEM gravar e devolve
 *   os erros estruturados (bloco, campo, mensagem). O painel precisa disso porque, em
 *   produção, o Convex esconde a mensagem dos erros lançados nas mutations: sem esta
 *   query, o editor não conseguiria apontar o campo com problema.
 * - `mediaUsage`: onde uma imagem da biblioteca é usada (antes de apagar ou substituir).
 * - `replaceMedia`: troca o arquivo de uma imagem e atualiza toda referência a ele no
 *   conteúdo (páginas, coleções, configurações), para "substituir" não quebrar o site.
 */
import { v } from "convex/values";
import { localePrefix } from "../i18n";
import { requireRole } from "./auth";
import { logUserAction } from "./audit";
import { assertValidPagePath, validatePageBlocks, type PageBlockError } from "./lib/blocks";
import { filledLocales } from "./lib/text";
import { MAX_IMAGE_BYTES } from "./media";
import { enabledPluginsFor, getSettingsDoc } from "./plugins";
import type { RubricaRuntime } from "./runtime";
import { COLLECTION_TABLES } from "./schema";
import { mutation, query, type Id, type MutationCtx, type ReaderCtx } from "./server";
import { vBlock, vLocalized } from "./validators";
import type { BlockInstance } from "../content/types";

type Data = Record<string, unknown>;

const IMAGE_TYPES = /^image\/(png|jpe?g|webp|avif|gif|svg\+xml)$/;

function isObject(value: unknown): value is Data {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Quantas imagens (`{ url, storageId }`) do valor apontam para o arquivo. */
export function countImageRefs(value: unknown, storageId: string): number {
  if (Array.isArray(value)) return value.reduce((n: number, item) => n + countImageRefs(item, storageId), 0);
  if (!isObject(value)) return 0;
  const self = value.storageId === storageId && typeof value.url === "string" ? 1 : 0;
  return Object.values(value).reduce((n: number, item) => n + countImageRefs(item, storageId), self);
}

/**
 * Cópia do valor com cada imagem do arquivo antigo apontando para o novo. As dimensões
 * passam a ser as do arquivo novo (as antigas descreviam outra imagem); o alt fica.
 */
export function replaceImageRefs<T>(value: T, from: string, to: { storageId: string; url: string; width?: number; height?: number }): T {
  if (Array.isArray(value)) return value.map((item) => replaceImageRefs(item, from, to)) as T;
  if (!isObject(value)) return value;
  const out: Data = {};
  for (const [key, item] of Object.entries(value)) out[key] = replaceImageRefs(item, from, to);
  if (out.storageId === from && typeof out.url === "string") {
    out.storageId = to.storageId;
    out.url = to.url;
    delete out.width;
    delete out.height;
    if (to.width) out.width = to.width;
    if (to.height) out.height = to.height;
  }
  return out as T;
}

/** Campos do documento que o painel edita (sem os de controle do Convex). */
function contentEntries(doc: Data): [string, unknown][] {
  return Object.entries(doc).filter(([key]) => !key.startsWith("_"));
}

interface Usage {
  type: string;
  id: string;
  label: string;
  count: number;
}

function docLabel(doc: Data): string {
  for (const key of ["title", "name", "question", "author", "path"]) {
    const value = doc[key];
    if (typeof value === "string" && value.trim()) return value;
    if (isObject(value)) {
      const first = Object.values(value).find((s) => typeof s === "string" && s.trim());
      if (typeof first === "string") return first;
    }
  }
  return String(doc._id ?? "");
}

/** Documentos (tabela e conteúdo) que podem guardar imagens da biblioteca. */
async function* imageHolders(ctx: ReaderCtx): AsyncGenerator<{ table: string; type: string; doc: Data }> {
  for (const doc of await ctx.db.query("pages").collect()) yield { table: "pages", type: "page", doc: doc as unknown as Data };
  for (const [name, table] of Object.entries(COLLECTION_TABLES)) {
    // As tabelas de coleção têm formas diferentes; aqui só se percorrem os valores.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const doc of await (ctx.db as any).query(table).collect()) yield { table, type: name, doc: doc as Data };
  }
  const settings = await getSettingsDoc(ctx);
  if (settings) yield { table: "siteSettings", type: "siteSettings", doc: settings as unknown as Data };
}

async function usageOf(ctx: ReaderCtx, storageId: string): Promise<Usage[]> {
  const found: Usage[] = [];
  for await (const { type, doc } of imageHolders(ctx)) {
    const count = contentEntries(doc).reduce((n, [, value]) => n + countImageRefs(value, storageId), 0);
    if (count > 0) found.push({ type, id: String(doc._id), label: type === "siteSettings" ? "Configurações do site" : docLabel(doc), count });
  }
  return found;
}

export function panelFunctions(rt: RubricaRuntime) {
  return {
    /**
     * Erros da página como ela ficaria, sem gravar. `blockErrors` vem no mesmo formato
     * de `validatePageBlocks` (índice e id do bloco, caminho do campo, mensagem).
     */
    validatePage: query({
      args: {
        blocks: v.array(vBlock),
        path: v.optional(v.string()),
        title: v.optional(vLocalized),
        /** Página que está sendo editada (o próprio caminho não conta como ocupado). */
        pageId: v.optional(v.id("pages")),
      },
      handler: async (ctx, args): Promise<{ blockErrors: PageBlockError[]; pathError?: string; titleError?: string }> => {
        await requireRole(ctx, "pages");
        const settings = await getSettingsDoc(ctx);
        const catalog = { blocks: rt.blocks, kind: settings?.kind ?? "pessoal", enabledPlugins: await enabledPluginsFor(ctx, rt, settings) } as const;
        const result: { blockErrors: PageBlockError[]; pathError?: string; titleError?: string } = {
          blockErrors: validatePageBlocks(args.blocks as BlockInstance[], catalog),
        };

        if (args.title && filledLocales(args.title).length === 0) result.titleError = "Preencha o título em pelo menos um idioma";

        if (args.path !== undefined) {
          const current = args.pageId ? await ctx.db.get(args.pageId) : null;
          if (!current || current.path !== args.path) {
            const reserved = settings
              ? settings.locales.locales.map((l) => localePrefix(l, settings.locales)).filter(Boolean).map((p) => `/${p}`)
              : [];
            const detailBases = [settings?.paths?.posts ?? "/blog", settings?.paths?.projects ?? "/portfolio"];
            try {
              if (current?.system) throw new Error("O caminho de uma página do sistema não muda");
              assertValidPagePath(args.path, reserved, detailBases);
              const taken = await ctx.db
                .query("pages")
                .withIndex("by_path", (q) => q.eq("path", args.path!))
                .collect();
              if (taken.some((p) => p._id !== args.pageId && p.deletedAt === undefined)) throw new Error(`Já existe uma página em "${args.path}"`);
            } catch (e) {
              result.pathError = (e as Error).message;
            }
          }
        }
        return result;
      },
    }),

    /** Onde a imagem é usada: páginas, itens de coleção e configurações. */
    mediaUsage: query({
      args: { id: v.id("media") },
      handler: async (ctx, args): Promise<Usage[]> => {
        await requireRole(ctx, "media");
        const media = await ctx.db.get(args.id);
        if (!media) throw new Error("Imagem não encontrada");
        return usageOf(ctx, media.storageId);
      },
    }),

    /**
     * Substitui o arquivo de uma imagem da biblioteca. Fluxo do painel: `generateUploadUrl`
     * → POST do arquivo novo → `replaceMedia` com o `storageId` novo. Toda referência ao
     * arquivo antigo passa a apontar para o novo, e o antigo é apagado do storage.
     */
    replaceMedia: mutation({
      args: { id: v.id("media"), storageId: v.id("_storage"), width: v.optional(v.number()), height: v.optional(v.number()) },
      handler: async (ctx, args): Promise<{ url: string; updated: number }> => {
        const { userId } = await requireRole(ctx, "media");
        const media = await ctx.db.get(args.id);
        if (!media) throw new Error("Imagem não encontrada");
        if (media.storageId === args.storageId) throw new Error("O arquivo novo é o mesmo de antes");
        const file = await ctx.db.system.get(args.storageId);
        if (!file) throw new Error("Arquivo não encontrado no storage");
        // (Apagar o envio aqui não adiantaria: o erro desfaz a transação inteira.)
        if (!file.contentType || !IMAGE_TYPES.test(file.contentType) || file.size > MAX_IMAGE_BYTES) {
          throw new Error(file.size > MAX_IMAGE_BYTES ? "Imagem acima de 20 MB" : "Envie uma imagem (PNG, JPG, WebP, AVIF, GIF ou SVG)");
        }
        const inLibrary = await ctx.db
          .query("media")
          .withIndex("by_storageId", (q) => q.eq("storageId", args.storageId))
          .unique();
        if (inLibrary) throw new Error("Esse arquivo já está na biblioteca");
        for (const d of [args.width, args.height]) {
          if (d !== undefined && (!Number.isInteger(d) || d < 1 || d > 20000)) throw new Error("Dimensões inválidas");
        }
        const url = await ctx.storage.getUrl(args.storageId);
        if (!url) throw new Error("Arquivo não encontrado no storage");

        const target = { storageId: args.storageId as string, url, width: args.width, height: args.height };
        let updated = 0;
        for await (const { doc } of imageHolders(ctx as MutationCtx)) {
          const patch: Data = {};
          for (const [key, value] of contentEntries(doc)) {
            if (countImageRefs(value, media.storageId) > 0) patch[key] = replaceImageRefs(value, media.storageId, target);
          }
          if (Object.keys(patch).length) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (ctx.db as any).patch(doc._id, patch);
            updated++;
          }
        }

        const old = media.storageId as Id<"_storage">;
        await ctx.db.patch(media._id, {
          storageId: args.storageId,
          width: args.width,
          height: args.height,
          size: file.size,
          contentType: file.contentType,
          updatedAt: Date.now(),
        });
        await ctx.storage.delete(old);
        await logUserAction(ctx, userId, "media.replaced", { type: "media", id: media._id, label: media.name }, { updated });
        return { url, updated };
      },
    }),
  };
}
