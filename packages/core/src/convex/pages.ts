/**
 * Páginas: lista ordenada de blocos (decisão 5). Cada gravação confere os blocos
 * contra o catálogo (núcleo + projeto): tipo desconhecido, de outro tipo de site ou
 * de plugin desligado é recusado, e os campos passam por `validateBlock`. O HTML dos
 * campos `richText` é sanitizado.
 */
import { v } from "convex/values";
import type { BlockInstance } from "../content/types";
import { localePrefix } from "../i18n";
import { requireRole } from "./auth";
import { logUserAction } from "./audit";
import { assertValidPagePath, preparePageBlocks, type BlockCatalog } from "./lib/blocks";
import { cleanByValidator } from "./lib/clean";
import { anyText, filledLocales } from "./lib/text";
import { enabledPluginsFor, getSettingsDoc } from "./plugins";
import type { RubricaRuntime } from "./runtime";
import { mutation, query, type Doc, type Id, type MutationCtx } from "./server";
import { vBlock, vLocalized, vSeo } from "./validators";

async function catalogFor(ctx: MutationCtx, rt: RubricaRuntime): Promise<{ catalog: BlockCatalog; reserved: string[]; detailBases: string[] }> {
  const settings = await getSettingsDoc(ctx);
  const catalog: BlockCatalog = {
    blocks: rt.blocks,
    kind: settings?.kind ?? "pessoal",
    enabledPlugins: await enabledPluginsFor(ctx, rt, settings),
  };
  // As páginas de detalhe (`/blog/<slug>`, `/portfolio/<slug>`) e os prefixos de idioma são do núcleo.
  const detailBases = [settings?.paths?.posts ?? "/blog", settings?.paths?.projects ?? "/portfolio"];
  const reserved: string[] = [];
  if (settings) {
    for (const locale of settings.locales.locales) {
      const prefix = localePrefix(locale, settings.locales);
      if (prefix) reserved.push(`/${prefix}`);
    }
  }
  return { catalog, reserved, detailBases };
}

async function loadPage(ctx: MutationCtx, id: Id<"pages">): Promise<Doc<"pages">> {
  const page = await ctx.db.get(id);
  if (!page) throw new Error("Página não encontrada");
  return page;
}

async function assertPathFree(ctx: MutationCtx, path: string, except?: Id<"pages">): Promise<void> {
  const found = await ctx.db
    .query("pages")
    .withIndex("by_path", (q) => q.eq("path", path))
    .collect();
  if (found.some((p) => p._id !== except && p.deletedAt === undefined)) throw new Error(`Já existe uma página em "${path}"`);
}

function cleanTitle(title: Record<string, string>): Record<string, string> {
  const clean = cleanByValidator(vLocalized, title, "title") as Record<string, string>;
  if (filledLocales(clean).length === 0) throw new Error("title: preencha em pelo menos um idioma");
  return clean;
}

const label = (page: Doc<"pages">) => anyText(page.title) || page.path;

export function pagesFunctions(rt: RubricaRuntime) {
  async function saveBlocks(ctx: MutationCtx, page: Doc<"pages">, blocks: BlockInstance[], userId: Id<"users">, event: string) {
    const { catalog } = await catalogFor(ctx, rt);
    const prepared = preparePageBlocks(blocks, catalog);
    await ctx.db.patch(page._id, { blocks: prepared, updatedAt: Date.now(), updatedBy: userId });
    await logUserAction(ctx, userId, event, { type: "page", id: page._id, label: label(page) });
  }

  return {
    list: query({
      args: { includeDeleted: v.optional(v.boolean()) },
      handler: async (ctx, args) => {
        await requireRole(ctx, "pages");
        const pages = await ctx.db.query("pages").collect();
        return pages.filter((p) => args.includeDeleted || p.deletedAt === undefined).sort((a, b) => a.path.localeCompare(b.path));
      },
    }),

    get: query({
      args: { id: v.id("pages") },
      handler: async (ctx, args) => {
        await requireRole(ctx, "pages");
        return ctx.db.get(args.id);
      },
    }),

    getByPath: query({
      args: { path: v.string() },
      handler: async (ctx, args) => {
        await requireRole(ctx, "pages");
        const pages = await ctx.db
          .query("pages")
          .withIndex("by_path", (q) => q.eq("path", args.path))
          .collect();
        return pages.find((p) => p.deletedAt === undefined) ?? null;
      },
    }),

    create: mutation({
      args: {
        path: v.string(),
        title: vLocalized,
        seo: v.optional(vSeo),
        blocks: v.optional(v.array(vBlock)),
        published: v.optional(v.boolean()),
        /** Página de ponto de partida (só pelo setup/migrar, com papel root). */
        system: v.optional(v.boolean()),
      },
      handler: async (ctx, args) => {
        const { userId, role } = await requireRole(ctx, "pages");
        if (args.system && role !== "root") throw new Error("Só a agência (root) cria páginas do sistema");
        const { catalog, reserved, detailBases } = await catalogFor(ctx, rt);
        assertValidPagePath(args.path, reserved, detailBases);
        await assertPathFree(ctx, args.path);
        const now = Date.now();
        const id = await ctx.db.insert("pages", {
          path: args.path,
          title: cleanTitle(args.title),
          seo: args.seo ? (cleanByValidator(vSeo, args.seo, "seo") as Doc<"pages">["seo"]) : undefined,
          blocks: preparePageBlocks(args.blocks ?? [], catalog),
          published: args.published ?? false,
          system: args.system || undefined,
          createdAt: now,
          updatedAt: now,
          updatedBy: userId,
        });
        await logUserAction(ctx, userId, "admin.create", { type: "page", id, label: anyText(args.title) || args.path });
        return id;
      },
    }),

    /** Título, caminho, SEO e/ou a lista inteira de blocos. */
    update: mutation({
      args: {
        id: v.id("pages"),
        path: v.optional(v.string()),
        title: v.optional(vLocalized),
        seo: v.optional(vSeo),
        clearSeo: v.optional(v.boolean()),
        blocks: v.optional(v.array(vBlock)),
      },
      handler: async (ctx, args) => {
        const { userId } = await requireRole(ctx, "pages");
        const page = await loadPage(ctx, args.id);
        if (page.deletedAt !== undefined) throw new Error("A página está na lixeira");
        const patch: Partial<Doc<"pages">> = { updatedAt: Date.now(), updatedBy: userId };
        const { catalog, reserved, detailBases } = await catalogFor(ctx, rt);
        if (args.path !== undefined && args.path !== page.path) {
          if (page.system) throw new Error("O caminho de uma página do sistema não muda");
          assertValidPagePath(args.path, reserved, detailBases);
          await assertPathFree(ctx, args.path, page._id);
          patch.path = args.path;
        }
        if (args.title) patch.title = cleanTitle(args.title);
        if (args.clearSeo) patch.seo = undefined;
        else if (args.seo) patch.seo = cleanByValidator(vSeo, args.seo, "seo") as Doc<"pages">["seo"];
        if (args.blocks) patch.blocks = preparePageBlocks(args.blocks, catalog);
        await ctx.db.patch(page._id, patch);
        await logUserAction(ctx, userId, "admin.update", { type: "page", id: page._id, label: label(page) }, { fields: Object.keys(args).filter((k) => k !== "id") });
        return null;
      },
    }),

    /** Nova ordem dos blocos: a lista precisa ter exatamente os ids atuais. */
    reorderBlocks: mutation({
      args: { id: v.id("pages"), blockIds: v.array(v.string()) },
      handler: async (ctx, args) => {
        const { userId } = await requireRole(ctx, "pages");
        const page = await loadPage(ctx, args.id);
        const byId = new Map(page.blocks.map((b) => [b.id, b]));
        if (args.blockIds.length !== page.blocks.length || new Set(args.blockIds).size !== args.blockIds.length || args.blockIds.some((id) => !byId.has(id))) {
          throw new Error("A nova ordem precisa ter todos os blocos da página, uma vez cada");
        }
        await ctx.db.patch(page._id, { blocks: args.blockIds.map((id) => byId.get(id)!), updatedAt: Date.now(), updatedBy: userId });
        await logUserAction(ctx, userId, "page.blocks_reordered", { type: "page", id: page._id, label: label(page) });
        return null;
      },
    }),

    /** Liga ou desliga um bloco sem apagar. */
    setBlockVisible: mutation({
      args: { id: v.id("pages"), blockId: v.string(), visible: v.boolean() },
      handler: async (ctx, args) => {
        const { userId } = await requireRole(ctx, "pages");
        const page = await loadPage(ctx, args.id);
        if (!page.blocks.some((b) => b.id === args.blockId)) throw new Error(`Bloco não encontrado: ${args.blockId}`);
        const blocks = page.blocks.map((b) => (b.id === args.blockId ? { ...b, visible: args.visible } : b));
        await ctx.db.patch(page._id, { blocks, updatedAt: Date.now(), updatedBy: userId });
        await logUserAction(ctx, userId, args.visible ? "page.block_shown" : "page.block_hidden", { type: "page", id: page._id, label: label(page) }, { blockId: args.blockId });
        return null;
      },
    }),

    /** Acrescenta ou substitui um bloco (pelo id), validando só a página resultante. */
    upsertBlock: mutation({
      args: { id: v.id("pages"), block: vBlock, index: v.optional(v.number()) },
      handler: async (ctx, args) => {
        const { userId } = await requireRole(ctx, "pages");
        const page = await loadPage(ctx, args.id);
        const blocks = [...page.blocks] as BlockInstance[];
        const at = blocks.findIndex((b) => b.id === args.block.id);
        if (at >= 0) blocks[at] = args.block;
        else blocks.splice(args.index ?? blocks.length, 0, args.block);
        await saveBlocks(ctx, page, blocks, userId, at >= 0 ? "page.block_updated" : "page.block_added");
        return null;
      },
    }),

    removeBlock: mutation({
      args: { id: v.id("pages"), blockId: v.string() },
      handler: async (ctx, args) => {
        const { userId } = await requireRole(ctx, "pages");
        const page = await loadPage(ctx, args.id);
        if (!page.blocks.some((b) => b.id === args.blockId)) throw new Error(`Bloco não encontrado: ${args.blockId}`);
        await ctx.db.patch(page._id, { blocks: page.blocks.filter((b) => b.id !== args.blockId), updatedAt: Date.now(), updatedBy: userId });
        await logUserAction(ctx, userId, "page.block_removed", { type: "page", id: page._id, label: label(page) }, { blockId: args.blockId });
        return null;
      },
    }),

    publish: mutation({
      args: { id: v.id("pages") },
      handler: async (ctx, args) => {
        const { userId } = await requireRole(ctx, "pages");
        const page = await loadPage(ctx, args.id);
        if (page.deletedAt !== undefined) throw new Error("A página está na lixeira");
        await ctx.db.patch(page._id, { published: true, updatedAt: Date.now(), updatedBy: userId });
        await logUserAction(ctx, userId, "admin.publish", { type: "page", id: page._id, label: label(page) });
        return null;
      },
    }),

    unpublish: mutation({
      args: { id: v.id("pages") },
      handler: async (ctx, args) => {
        const { userId } = await requireRole(ctx, "pages");
        const page = await loadPage(ctx, args.id);
        await ctx.db.patch(page._id, { published: false, updatedAt: Date.now(), updatedBy: userId });
        await logUserAction(ctx, userId, "admin.unpublish", { type: "page", id: page._id, label: label(page) });
        return null;
      },
    }),

    /** Lixeira. Páginas do sistema (home, sobre…) não vão para a lixeira. */
    remove: mutation({
      args: { id: v.id("pages") },
      handler: async (ctx, args) => {
        const { userId } = await requireRole(ctx, "pages");
        const page = await loadPage(ctx, args.id);
        if (page.system) throw new Error("Páginas do sistema podem ser editadas, não apagadas");
        await ctx.db.patch(page._id, { deletedAt: Date.now(), deletedBy: userId });
        await logUserAction(ctx, userId, "admin.delete", { type: "page", id: page._id, label: label(page) }, { softDelete: true });
        return null;
      },
    }),

    restore: mutation({
      args: { id: v.id("pages") },
      handler: async (ctx, args) => {
        const { userId } = await requireRole(ctx, "purge");
        const page = await loadPage(ctx, args.id);
        await assertPathFree(ctx, page.path, page._id);
        await ctx.db.patch(page._id, { deletedAt: undefined, deletedBy: undefined });
        await logUserAction(ctx, userId, "admin.restore", { type: "page", id: page._id, label: label(page) });
        return null;
      },
    }),

    removePermanently: mutation({
      args: { id: v.id("pages") },
      handler: async (ctx, args) => {
        const { userId } = await requireRole(ctx, "purge");
        const page = await loadPage(ctx, args.id);
        if (page.system) throw new Error("Páginas do sistema podem ser editadas, não apagadas");
        await ctx.db.delete(page._id);
        await logUserAction(ctx, userId, "admin.permanent_delete", { type: "page", id: page._id, label: label(page) });
        return null;
      },
    }),
  };
}
