import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requireRole } from "./auth";
import { logAudit } from "./audit";
import { markPendingChanges } from "./publishStatus";
import type { Id } from "./_generated/dataModel";

export const PUBLIC_KEYS = [
  "site_title",
  "site_description",
  "site_url",
  "site_name",
  "og_image_url",
  "twitter_handle",
  "author_name",
  "author_email",
  "rss_title",
  "rss_description",
  "seo_home_title",
  "seo_home_description",
  "theme_background",
  "theme_foreground",
  "theme_primary",
  "theme_accent",
  // Cores do modo escuro (as 4 acima são do claro) e a marca de que os dois são separados.
  "theme_dark_background",
  "theme_dark_foreground",
  "theme_dark_primary",
  "theme_dark_accent",
  "theme_colors_per_mode",
  "theme_accent_color",
  "theme_accent_hsl",
  "theme_font_sans",
  "theme_font_mono",
  "keywords",
  "lang",
] as const;

export const INTERNAL_KEYS = [
  "og_image_storage_id",
] as const;

export type PublicKey = (typeof PUBLIC_KEYS)[number];
export type InternalKey = (typeof INTERNAL_KEYS)[number];

function isInternalKey(key: string): boolean {
  return (INTERNAL_KEYS as readonly string[]).includes(key);
}

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, ["root", "admin"]);
    return ctx.db.query("siteConfig").collect();
  },
});

export const getByKey = query({
  args: { key: v.string() },
  handler: async (ctx, { key }) => {
    if (isInternalKey(key)) {
      const userId = await getAuthUserId(ctx);
      if (!userId) throw new Error("Unauthorized");
    }
    return ctx.db.query("siteConfig").withIndex("by_key", (q) => q.eq("key", key)).unique();
  },
});

export const getPublic = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("siteConfig").collect();
    return all.filter((doc) => !isInternalKey(doc.key));
  },
});

const batchItems = v.array(v.object({ key: v.string(), value: v.any() }));

async function upsertBatch(ctx: any, items: Array<{ key: string; value: unknown }>) {
  for (const { key, value } of items) {
    await upsertKey(ctx, key, value);
  }
}

export const setBatch = mutation({
  args: { items: batchItems },
  handler: async (ctx, { items }) => {
    const { userId } = await requireRole(ctx, ["root", "admin"]);
    await upsertBatch(ctx, items);
    await markPendingChanges(ctx);
    await logAudit(ctx, {
      eventType: "siteConfig.setBatch",
      actorType: "user",
      actorId: userId,
      targetType: "siteConfig",
      metadata: { keys: items.map((i) => i.key) },
      success: true,
    });
  },
});

// Usada pelo setup da CLI (`npx convex run`), que roda sem usuário logado.
export const setBatchInternal = internalMutation({
  args: { items: batchItems },
  handler: async (ctx, { items }) => {
    await upsertBatch(ctx, items);
  },
});

export const set = mutation({
  args: { key: v.string(), value: v.any() },
  handler: async (ctx, { key, value }) => {
    const { userId } = await requireRole(ctx, ["root", "admin"]);
    await upsertKey(ctx, key, value);
    await markPendingChanges(ctx);
    await logAudit(ctx, {
      eventType: "siteConfig.set",
      actorType: "user",
      actorId: userId,
      targetType: "siteConfig",
      metadata: { key },
      success: true,
    });
  },
});

async function upsertKey(ctx: any, key: string, value: any) {
  const existing = await ctx.db
    .query("siteConfig")
    .withIndex("by_key", (q: any) => q.eq("key", key))
    .unique();
  if (existing) {
    await ctx.db.patch(existing._id, { value, updatedAt: Date.now() });
  } else {
    await ctx.db.insert("siteConfig", { key, value, createdAt: Date.now() });
  }
}

export const setOgImage = mutation({
  args: { storageId: v.string() },
  handler: async (ctx, { storageId }) => {
    await requireRole(ctx, ["root", "admin"]);
    const url = await ctx.storage.getUrl(storageId as Id<"_storage">);
    await upsertKey(ctx, "og_image_storage_id", storageId);
    await upsertKey(ctx, "og_image_url", url ?? "");
    await markPendingChanges(ctx);
  },
});
