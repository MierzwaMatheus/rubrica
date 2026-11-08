/**
 * Biblioteca de mídia: imagens no storage do Convex, com pasta, nome, alt por idioma
 * e dimensões (o site usa `width`/`height` para não pular o layout).
 *
 * Fluxo do painel: `generateUploadUrl` → POST do arquivo → `save` com o `storageId`.
 */
import { v } from "convex/values";
import { requireRole } from "./auth";
import { hitRateLimit, logUserAction } from "./audit";
import { cleanByValidator } from "./lib/clean";
import { mutation, query, type Doc, type Id, type QueryCtx } from "./server";
import { vLocalized } from "./validators";

/** Até 20 MB. Acima disso o build fica lento para otimizar. */
export const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const IMAGE_TYPES = /^image\/(png|jpe?g|webp|avif|gif|svg\+xml)$/;

export function normalizeFolder(folder: string | undefined): string {
  const clean = (folder ?? "/").trim().replace(/\/+$/, "") || "/";
  const path = clean.startsWith("/") ? clean : `/${clean}`;
  if (path !== "/" && !/^(\/[\p{L}\p{N}_ -]{1,60}){1,6}$/u.test(path)) throw new Error(`Pasta inválida: "${folder}"`);
  return path;
}

async function withUrl(ctx: QueryCtx, doc: Doc<"media">) {
  return { ...doc, url: await ctx.storage.getUrl(doc.storageId) };
}

const dimension = v.optional(v.number());

export function mediaFunctions() {
  return {
    generateUploadUrl: mutation({
      args: {},
      handler: async (ctx) => {
        const { userId } = await requireRole(ctx, "media");
        await hitRateLimit(ctx, "media_upload", userId);
        return ctx.storage.generateUploadUrl();
      },
    }),

    /** Registra o arquivo enviado. Recusa o que não for imagem ou passar do limite. */
    save: mutation({
      args: {
        storageId: v.id("_storage"),
        name: v.string(),
        folder: v.optional(v.string()),
        alt: v.optional(vLocalized),
        width: dimension,
        height: dimension,
      },
      handler: async (ctx, args) => {
        const { userId } = await requireRole(ctx, "media");
        const file = await ctx.db.system.get(args.storageId);
        if (!file) throw new Error("Arquivo não encontrado no storage");
        const already = await ctx.db
          .query("media")
          .withIndex("by_storageId", (q) => q.eq("storageId", args.storageId))
          .unique();
        if (already) throw new Error("Esse arquivo já está na biblioteca");
        if (!file.contentType || !IMAGE_TYPES.test(file.contentType) || file.size > MAX_IMAGE_BYTES) {
          await ctx.storage.delete(args.storageId);
          throw new Error(file.size > MAX_IMAGE_BYTES ? "Imagem acima de 20 MB" : "Envie uma imagem (PNG, JPG, WebP, AVIF, GIF ou SVG)");
        }
        for (const d of [args.width, args.height]) {
          if (d !== undefined && (!Number.isInteger(d) || d < 1 || d > 20000)) throw new Error("Dimensões inválidas");
        }
        const name = args.name.trim().slice(0, 200) || "imagem";
        const id = await ctx.db.insert("media", {
          storageId: args.storageId,
          name,
          folder: normalizeFolder(args.folder),
          alt: args.alt ? (cleanByValidator(vLocalized, args.alt, "alt") as Record<string, string>) : undefined,
          width: args.width,
          height: args.height,
          size: file.size,
          contentType: file.contentType,
          createdAt: Date.now(),
          createdBy: userId,
        });
        await logUserAction(ctx, userId, "media.uploaded", { type: "media", id, label: name });
        return { id, url: await ctx.storage.getUrl(args.storageId) };
      },
    }),

    list: query({
      args: { folder: v.optional(v.string()) },
      handler: async (ctx, args) => {
        await requireRole(ctx, "media");
        const docs = args.folder
          ? await ctx.db
              .query("media")
              .withIndex("by_folder", (q) => q.eq("folder", normalizeFolder(args.folder)))
              .collect()
          : await ctx.db.query("media").collect();
        docs.sort((a, b) => b.createdAt - a.createdAt);
        return Promise.all(docs.map((d) => withUrl(ctx, d)));
      },
    }),

    /** Pastas em uso, com a quantidade de imagens. */
    folders: query({
      args: {},
      handler: async (ctx) => {
        await requireRole(ctx, "media");
        const counts = new Map<string, number>();
        for (const doc of await ctx.db.query("media").collect()) counts.set(doc.folder, (counts.get(doc.folder) ?? 0) + 1);
        return [...counts].map(([path, count]) => ({ path, count })).sort((a, b) => a.path.localeCompare(b.path));
      },
    }),

    get: query({
      args: { id: v.id("media") },
      handler: async (ctx, args) => {
        await requireRole(ctx, "media");
        const doc = await ctx.db.get(args.id);
        return doc ? withUrl(ctx, doc) : null;
      },
    }),

    /** Nome, pasta, alt e dimensões. */
    update: mutation({
      args: {
        id: v.id("media"),
        name: v.optional(v.string()),
        folder: v.optional(v.string()),
        alt: v.optional(vLocalized),
        width: dimension,
        height: dimension,
      },
      handler: async (ctx, args) => {
        const { userId } = await requireRole(ctx, "media");
        const doc = await ctx.db.get(args.id);
        if (!doc) throw new Error("Imagem não encontrada");
        const patch: Partial<Doc<"media">> = { updatedAt: Date.now() };
        if (args.name !== undefined) patch.name = args.name.trim().slice(0, 200) || doc.name;
        if (args.folder !== undefined) patch.folder = normalizeFolder(args.folder);
        if (args.alt !== undefined) patch.alt = cleanByValidator(vLocalized, args.alt, "alt") as Record<string, string>;
        if (args.width !== undefined) patch.width = args.width;
        if (args.height !== undefined) patch.height = args.height;
        await ctx.db.patch(doc._id, patch);
        await logUserAction(ctx, userId, "media.updated", { type: "media", id: doc._id, label: doc.name });
        return null;
      },
    }),

    /**
     * Apaga a imagem do storage e da biblioteca. O conteúdo que ainda a usa continua
     * com a URL antiga (que deixa de funcionar): o painel deve avisar antes.
     */
    remove: mutation({
      args: { id: v.id("media") },
      handler: async (ctx, args) => {
        const { userId } = await requireRole(ctx, "media");
        const doc = await ctx.db.get(args.id);
        if (!doc) throw new Error("Imagem não encontrada");
        await ctx.storage.delete(doc.storageId as Id<"_storage">);
        await ctx.db.delete(doc._id);
        await logUserAction(ctx, userId, "media.deleted", { type: "media", id: doc._id, label: doc.name });
        return null;
      },
    }),
  };
}
