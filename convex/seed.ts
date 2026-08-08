import { internalMutation, internalAction } from "./_generated/server";
import { internal, api } from "./_generated/api";
import { v } from "convex/values";
import { createAccount } from "@convex-dev/auth/server";
import { rubricalConfig } from "../rubrica.config";

export const setupAdmin = internalAction({
  args: { email: v.string(), password: v.string() },
  handler: async (ctx, { email, password }) => {
    const setupRequired = await ctx.runQuery(api.users.isSetupRequired);
    if (!setupRequired) throw new Error("Root user already exists");

    const result = await createAccount(ctx, {
      provider: "password",
      account: { id: email, secret: password },
      profile: { email },
    });

    await ctx.runMutation(internal.users.assignRoleInternal, {
      userId: result.user._id,
      role: "root",
    });

    return { userId: result.user._id };
  },
});

export const seedSiteConfig = internalMutation({
  handler: async (ctx) => {
    const existing = await ctx.db.query("siteConfig").collect();
    if (existing.length > 0) return;

    const items = [
      { key: "site_title", value: rubricalConfig.siteName },
      { key: "site_name", value: rubricalConfig.siteName },
      { key: "site_url", value: rubricalConfig.siteUrl },
      { key: "site_description", value: rubricalConfig.siteDescription },
      { key: "author_name", value: rubricalConfig.authorName },
      { key: "author_email", value: rubricalConfig.authorEmail },
      { key: "twitter_handle", value: rubricalConfig.twitterHandle },
      { key: "lang", value: rubricalConfig.lang },
      { key: "seo_home_title", value: rubricalConfig.seoHomeTitle },
      { key: "seo_home_description", value: rubricalConfig.seoHomeDescription },
      { key: "rss_title", value: rubricalConfig.rssTitle },
      { key: "rss_description", value: rubricalConfig.rssDescription },
      { key: "og_image_url", value: rubricalConfig.ogImageUrl },
      { key: "theme_font_sans", value: rubricalConfig.fontSans },
      { key: "theme_font_mono", value: rubricalConfig.fontMono },
    ];

    const now = Date.now();
    for (const item of items) {
      const existing = await ctx.db
        .query("siteConfig")
        .withIndex("by_key", (q) => q.eq("key", item.key))
        .unique();
      if (existing) {
        await ctx.db.patch(existing._id, { value: item.value, updatedAt: now });
      } else {
        await ctx.db.insert("siteConfig", { key: item.key, value: item.value, createdAt: now });
      }
    }
  },
});
