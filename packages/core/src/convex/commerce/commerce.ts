/**
 * Funções internas comuns ao comercial (`convex/rubrica/commerce.ts`): aviso ao dono
 * do site, origens aceitas pelas rotas HTTP, checagem de acesso para as actions,
 * registro de webhook recusado e os dados pessoais (LGPD).
 */
import { v } from "convex/values";
import { checkRateLimit, logAudit, recordRateLimitAttempt } from "../audit";
import type { Permission } from "../lib/roles";
import { PERMISSIONS } from "../lib/roles";
import { getSettingsDoc } from "../plugins";
import type { RubricaRuntime } from "../runtime";
import { internalAction, internalMutation, internalQuery } from "../server";
import { vRole } from "../validators";
import { commercePersonalData } from "./personalData";
import { guard } from "./shared";

/** Origens do servidor de desenvolvimento (Astro e Vite). */
export const DEV_ORIGINS = ["http://localhost:4321", "http://127.0.0.1:4321", "http://localhost:5173", "http://localhost:3000"];

/** A origem e a variante com/sem `www`. */
export function originsOf(url: string | undefined | null): string[] {
  if (!url) return [];
  try {
    const parsed = new URL(url);
    const other = parsed.hostname.startsWith("www.") ? parsed.hostname.slice(4) : `www.${parsed.hostname}`;
    return [parsed.origin, `${parsed.protocol}//${other}${parsed.port ? `:${parsed.port}` : ""}`];
  } catch {
    return [];
  }
}

const vPermission = v.union(...(Object.keys(PERMISSIONS) as Permission[]).map((p) => v.literal(p)));

export function commerceFunctions(rt: RubricaRuntime) {
  return {
    /** Mensagem para o dono do site no Telegram (TELEGRAM_BOT_TOKEN + TELEGRAM_ADMIN_CHAT_ID). Sem as duas, não faz nada. */
    notifyAdmin: internalAction({
      args: { message: v.string() },
      handler: async (_ctx, { message }) => {
        const token = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
        if (!token || !chatId) return null;
        const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: "HTML" }),
        });
        if (!res.ok) console.error("[telegram] sendMessage falhou:", res.status, await res.text());
        return null;
      },
    }),

    /** Origens aceitas no CORS das rotas públicas: SITE_URL, a URL do site nas configurações e o servidor local. */
    siteOrigins: internalQuery({
      args: {},
      handler: async (ctx): Promise<string[]> => {
        const settings = await getSettingsDoc(ctx);
        return [...new Set([...originsOf(process.env.SITE_URL), ...originsOf(settings?.url), ...DEV_ORIGINS])];
      },
    }),

    /** Papel e plugins para as actions (que não leem o banco). Devolve o usuário. */
    access: internalQuery({
      args: { permission: v.optional(vPermission), roles: v.optional(v.array(vRole)), plugins: v.array(v.string()) },
      handler: async (ctx, args) => {
        const allowed = args.roles ?? args.permission;
        if (!allowed) throw new Error("Informe a permissão ou os papéis");
        const { userId, role } = await guard(ctx, rt, allowed, ...args.plugins);
        return { userId, role };
      },
    }),

    /** Token errado no webhook: registra e conta por IP. Devolve se ainda está liberado. */
    recordInvalidWebhook: internalMutation({
      args: { provider: v.string(), ipAddress: v.string() },
      handler: async (ctx, args) => {
        const key = `${args.provider}:${args.ipAddress}`;
        const { allowed } = await checkRateLimit(ctx, "webhook_invalid", key);
        if (!allowed) return { allowed };
        await recordRateLimitAttempt(ctx, "webhook_invalid", key);
        await logAudit(ctx, {
          eventType: "webhook.unauthorized",
          actorType: "external",
          targetType: "webhook",
          targetId: args.provider,
          ipAddress: args.ipAddress,
          success: false,
        });
        return { allowed };
      },
    }),

    /** LGPD: o que o comercial guarda sobre o e-mail (ver `personalData.ts`). */
    exportPersonalData: internalQuery({
      args: { email: v.string() },
      handler: (ctx, args) => commercePersonalData.export(ctx, args.email),
    }),

    /** LGPD: anonimiza o que o comercial guarda sobre o e-mail. Devolve quantos registros mudaram. */
    erasePersonalData: internalMutation({
      args: { email: v.string() },
      handler: async (ctx, args) => ({ anonymized: await commercePersonalData.erase(ctx, args.email) }),
    }),
  };
}
