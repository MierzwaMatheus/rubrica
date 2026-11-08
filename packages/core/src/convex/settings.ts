/**
 * Configurações do site (documento único com o `SiteSettings`) e textos de interface.
 */
import { v } from "convex/values";
import { defineLocales } from "../i18n";
import { enabledPlugins } from "../plugins/contract";
import { requireRole } from "./auth";
import { logUserAction } from "./audit";
import { cleanByValidator, cleanFields } from "./lib/clean";
import { isLocaleCode } from "./lib/text";
import { analyticsScriptUrl, isAnalyticsId, isCssColor } from "../seo/analytics";
import { getSettingsDoc } from "./plugins";
import { announcementTime, isWhatsAppNumber, normalizeWhatsAppNumber } from "../render/sitewide";
import type { RubricaRuntime } from "./runtime";
import { internalMutation, mutation, query, type Doc, type MutationCtx } from "./server";
import { siteSettingsFields, vLocalized, vSiteSettings, type SiteSettingsValue } from "./validators";

/** Campos que só a agência (root) muda: tipo do site, URL, idiomas e tema. */
export const TECHNICAL_SETTINGS = ["kind", "url", "locales", "theme"] as const;

function validateSettings(settings: SiteSettingsValue): void {
  for (const locale of settings.locales.locales) {
    if (!isLocaleCode(locale)) throw new Error(`Idioma inválido: "${locale}"`);
  }
  try {
    defineLocales(settings.locales);
  } catch (e) {
    throw new Error((e as Error).message.replace("[rubrica] ", ""));
  }
  if (!/^https?:\/\/[^/\s]+(\/[^\s]*)?$/.test(settings.url) || settings.url.endsWith("/")) {
    throw new Error("URL do site inválida: use https://exemplo.com, sem barra no final");
  }
  for (const [key, path] of Object.entries(settings.paths ?? {})) {
    if (path && !/^\/[a-z0-9-]+$/.test(path)) throw new Error(`Caminho inválido para ${key}: "${path}"`);
  }
  for (const [mode, color] of Object.entries(settings.themeColor ?? {})) {
    if (color && !isCssColor(color)) throw new Error(`Cor da barra do navegador (${mode === "light" ? "claro" : "escuro"}) inválida: use #rrggbb`);
  }
  const { scriptUrl, websiteId } = settings.analytics ?? {};
  if (scriptUrl && !analyticsScriptUrl(scriptUrl)) throw new Error("Endereço do script de analytics inválido: use https://…");
  if (websiteId && !isAnalyticsId(websiteId)) throw new Error("Id do site no analytics inválido: só letras, números e hífen");
  validateWhatsApp(settings.whatsapp);
  validateAnnouncement(settings.announcement);
}

function tooLong(value: Record<string, string> | undefined, max: number): boolean {
  return Object.values(value ?? {}).some((s) => s.length > max);
}

function validateWhatsApp(whatsapp: SiteSettingsValue["whatsapp"]): void {
  if (!whatsapp) return;
  if (!isWhatsAppNumber(whatsapp.number)) {
    throw new Error("Número do WhatsApp inválido: use o formato internacional, com DDI e DDD (ex.: +55 11 91234-5678)");
  }
  if (tooLong(whatsapp.message, 500)) throw new Error("Mensagem do WhatsApp: até 500 caracteres por idioma");
  if (tooLong(whatsapp.label, 40)) throw new Error("Texto do botão do WhatsApp: até 40 caracteres por idioma");
}

function validateAnnouncement(announcement: SiteSettingsValue["announcement"]): void {
  if (!announcement) return;
  const hasText = Object.values(announcement.text).some((s) => s.trim());
  if (announcement.enabled && !hasText) throw new Error("Aviso ligado sem texto: escreva o aviso em pelo menos um idioma");
  if (tooLong(announcement.text, 200)) throw new Error("Texto do aviso: até 200 caracteres por idioma");
  if (announcement.link) {
    if (!announcement.link.href.trim()) throw new Error("Link do aviso sem endereço");
    if (tooLong(announcement.link.label, 40)) throw new Error("Rótulo do link do aviso: até 40 caracteres por idioma");
  }
  const start = announcement.startsAt ? announcementTime(announcement.startsAt, "start") : undefined;
  const end = announcement.endsAt ? announcementTime(announcement.endsAt, "end") : undefined;
  const format = "use AAAA-MM-DD ou data e hora com fuso (2026-12-01T09:00-03:00)";
  if (announcement.startsAt && start === undefined) throw new Error(`Início do aviso inválido: ${format}`);
  if (announcement.endsAt && end === undefined) throw new Error(`Fim do aviso inválido: ${format}`);
  if (start !== undefined && end !== undefined && start > end) throw new Error("O aviso termina antes de começar: confira as datas");
}

/** Normaliza o que dá para normalizar sem mudar o sentido (o número do WhatsApp vira só dígitos). */
function normalizeSettings(settings: SiteSettingsValue): SiteSettingsValue {
  if (!settings.whatsapp) return settings;
  return { ...settings, whatsapp: { ...settings.whatsapp, number: normalizeWhatsAppNumber(settings.whatsapp.number) } };
}

export async function upsertSettings(ctx: MutationCtx, value: SiteSettingsValue, userId?: Doc<"users">["_id"]) {
  const clean = normalizeSettings(cleanFields(siteSettingsFields, value) as SiteSettingsValue);
  validateSettings(clean);
  const existing = await getSettingsDoc(ctx);
  const doc = { ...clean, updatedAt: Date.now(), updatedBy: userId };
  if (existing) await ctx.db.replace(existing._id, doc);
  else await ctx.db.insert("siteSettings", doc);
}

function stripMeta(doc: Doc<"siteSettings">): SiteSettingsValue {
  const { _id, _creationTime, updatedAt, updatedBy, ...settings } = doc;
  void _id;
  void _creationTime;
  void updatedAt;
  void updatedBy;
  return settings;
}

export function settingsFunctions(rt: RubricaRuntime) {
  return {
    /** Configurações para o painel (todo usuário com papel). */
    get: query({
      args: {},
      handler: async (ctx) => {
        await requireRole(ctx, "panel");
        const doc = await getSettingsDoc(ctx);
        return doc ? stripMeta(doc) : null;
      },
    }),

    /** Plugins disponíveis no tipo do site, com o estado efetivo (padrão + configurado + dependências). */
    plugins: query({
      args: {},
      handler: async (ctx) => {
        await requireRole(ctx, "panel");
        const doc = await getSettingsDoc(ctx);
        const kind = doc?.kind ?? "pessoal";
        const on = enabledPlugins([...rt.plugins], kind, doc?.plugins ?? {});
        return rt.plugins
          .filter((p) => p.kinds.includes(kind))
          .map((p) => ({ id: p.id, label: p.label, description: p.description, requires: p.requires ?? [], enabled: on.has(p.id) }));
      },
    }),

    /**
     * Altera parte das configurações. `kind`, `url`, `locales` e `theme` são da
     * agência (root); o resto, root e admin.
     */
    update: mutation({
      args: { patch: vSiteSettings.partial() },
      handler: async (ctx, args) => {
        const { userId, role } = await requireRole(ctx, "settings");
        const changed = Object.keys(args.patch);
        if (role !== "root" && changed.some((k) => (TECHNICAL_SETTINGS as readonly string[]).includes(k))) {
          throw new Error("Tipo do site, URL, idiomas e tema só a agência (root) muda");
        }
        const existing = await getSettingsDoc(ctx);
        if (!existing) throw new Error("O site ainda não foi configurado (rode o setup)");
        await upsertSettings(ctx, { ...stripMeta(existing), ...args.patch } as SiteSettingsValue, userId);
        await logUserAction(ctx, userId, "settings.updated", { type: "siteSettings" }, { fields: changed });
        return null;
      },
    }),

    /** Liga ou desliga um plugin. */
    setPlugin: mutation({
      args: { id: v.string(), enabled: v.boolean() },
      handler: async (ctx, args) => {
        const { userId } = await requireRole(ctx, "settings");
        const plugin = rt.plugins.find((p) => p.id === args.id);
        if (!plugin) throw new Error(`Plugin desconhecido: ${args.id}`);
        const existing = await getSettingsDoc(ctx);
        if (!existing) throw new Error("O site ainda não foi configurado (rode o setup)");
        if (!plugin.kinds.includes(existing.kind)) throw new Error(`O plugin ${args.id} não existe em sites do tipo ${existing.kind}`);
        await ctx.db.patch(existing._id, { plugins: { ...existing.plugins, [args.id]: args.enabled }, updatedAt: Date.now(), updatedBy: userId });
        await logUserAction(ctx, userId, args.enabled ? "plugin.enabled" : "plugin.disabled", { type: "plugin", id: args.id, label: plugin.label });
        return null;
      },
    }),

    /** Grava as configurações inteiras. Usada pelo `setup` e pelo `migrar` do CLI. */
    init: internalMutation({
      args: { settings: vSiteSettings, overwrite: v.optional(v.boolean()) },
      handler: async (ctx, args) => {
        const existing = await getSettingsDoc(ctx);
        if (existing && !args.overwrite) throw new Error("O site já tem configurações (use overwrite)");
        await upsertSettings(ctx, args.settings);
        return null;
      },
    }),
  };
}

export function textsFunctions() {
  return {
    /** Textos de interface gravados (os que não estão aqui usam o padrão do núcleo). */
    list: query({
      args: {},
      handler: async (ctx) => {
        await requireRole(ctx, "panel");
        const docs = await ctx.db.query("uiTexts").collect();
        return Object.fromEntries(docs.map((d) => [d.key, d.value]));
      },
    }),

    /** Grava o texto de uma chave. Mapa vazio volta ao padrão do núcleo. */
    set: mutation({
      args: { key: v.string(), value: vLocalized },
      handler: async (ctx, args) => {
        const { userId } = await requireRole(ctx, "texts");
        if (!/^[a-z0-9][a-z0-9._-]{0,99}$/i.test(args.key)) throw new Error(`Chave inválida: "${args.key}"`);
        const value = cleanByValidator(vLocalized, args.value, args.key) as Record<string, string>;
        const existing = await ctx.db
          .query("uiTexts")
          .withIndex("by_key", (q) => q.eq("key", args.key))
          .unique();
        if (Object.keys(value).length === 0) {
          if (existing) await ctx.db.delete(existing._id);
        } else if (existing) {
          await ctx.db.patch(existing._id, { value, updatedAt: Date.now(), updatedBy: userId });
        } else {
          await ctx.db.insert("uiTexts", { key: args.key, value, updatedAt: Date.now(), updatedBy: userId });
        }
        await logUserAction(ctx, userId, "texts.updated", { type: "uiText", id: args.key });
        return null;
      },
    }),

    /** Apaga a chave (volta ao texto padrão do núcleo). */
    reset: mutation({
      args: { key: v.string() },
      handler: async (ctx, args) => {
        const { userId } = await requireRole(ctx, "texts");
        const existing = await ctx.db
          .query("uiTexts")
          .withIndex("by_key", (q) => q.eq("key", args.key))
          .unique();
        if (existing) await ctx.db.delete(existing._id);
        await logUserAction(ctx, userId, "texts.reset", { type: "uiText", id: args.key });
        return null;
      },
    }),
  };
}
