import { v } from "convex/values";
import { action, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireRole } from "./auth";
import { ptBR } from "../src/i18n/translations/pt-BR";
import { enUS } from "../src/i18n/translations/en-US";

function flattenTranslations(
  obj: Record<string, unknown>,
  prefix = ""
): Array<{ key: string; page: string; ptBR: string; enUS?: string }> {
  return [];
}

function buildEntries(): Array<{ key: string; page: string; ptBR: string; enUS?: string }> {
  const flatten = (
    obj: Record<string, unknown>,
    enObj: Record<string, unknown>,
    prefix: string
  ): Array<{ key: string; page: string; ptBR: string; enUS?: string }> => {
    return Object.entries(obj).flatMap(([k, v]) => {
      const key = prefix ? `${prefix}.${k}` : k;
      const enVal = (enObj as any)?.[k];
      if (typeof v === "object" && v !== null) {
        return flatten(
          v as Record<string, unknown>,
          typeof enVal === "object" && enVal !== null ? (enVal as Record<string, unknown>) : {},
          key
        );
      }
      const page = key.split(".")[0];
      return [{ key, page, ptBR: String(v), enUS: typeof enVal === "string" ? enVal : undefined }];
    });
  };
  return flatten(ptBR as unknown as Record<string, unknown>, enUS as unknown as Record<string, unknown>, "");
}

export const getAll = query({
  args: {},
  handler: async (ctx) => ctx.db.query("siteTexts").collect(),
});

export const getAllInternal = internalQuery({
  args: {},
  handler: async (ctx) => ctx.db.query("siteTexts").collect(),
});

export const getByPage = query({
  args: { page: v.string() },
  handler: async (ctx, { page }) =>
    ctx.db.query("siteTexts").withIndex("by_page", (q) => q.eq("page", page)).collect(),
});

export const seed = internalMutation({
  args: {},
  handler: async (ctx) => {
    const entries = buildEntries();
    const now = Date.now();
    for (const entry of entries) {
      const existing = await ctx.db
        .query("siteTexts")
        .withIndex("by_key", (q) => q.eq("key", entry.key))
        .unique();
      if (existing) {
        await ctx.db.patch(existing._id, { ptBR: entry.ptBR, enUS: entry.enUS, updatedAt: now });
      } else {
        await ctx.db.insert("siteTexts", { ...entry, updatedAt: now });
      }
    }
  },
});

export const update = mutation({
  args: { key: v.string(), ptBR: v.string(), enUS: v.optional(v.string()) },
  handler: async (ctx, { key, ptBR, enUS }) => {
    await requireRole(ctx, ["root", "admin", "content-editor"]);
    const doc = await ctx.db
      .query("siteTexts")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();
    if (!doc) throw new Error(`siteTexts key not found: ${key}`);
    await ctx.db.patch(doc._id, { ptBR, enUS, updatedAt: Date.now() });
  },
});

export const updateInternal = internalMutation({
  args: { key: v.string(), enUS: v.string() },
  handler: async (ctx, { key, enUS }) => {
    const doc = await ctx.db
      .query("siteTexts")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();
    if (!doc) throw new Error(`siteTexts key not found: ${key}`);
    await ctx.db.patch(doc._id, { enUS, updatedAt: Date.now() });
  },
});

export const translateAllMissing = action({
  args: {},
  handler: async (ctx) => {
    await ctx.runQuery(internal.auth.requireAuthQuery, {});

    const all = await ctx.runQuery(internal.siteTexts.getAllInternal, {});
    const missing = (all as Array<{ key: string; ptBR: string; enUS?: string }>).filter(
      (i) => !i.enUS
    );

    if (missing.length === 0) return;

    const { translatedTexts } = await ctx.runAction(
      internal.translation.translateBatchInternal,
      { texts: missing.map((i) => i.ptBR) }
    ) as { translatedTexts: string[] };

    for (let idx = 0; idx < missing.length; idx++) {
      const translated = translatedTexts[idx];
      if (!translated) continue;
      try {
        await ctx.runMutation(internal.siteTexts.updateInternal, {
          key: missing[idx].key,
          enUS: translated,
        });
      } catch {
        // erro individual não trava o processo
      }
    }
  },
});
