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
import { eraseCommercePersonalData, exportCommercePersonalData } from "./personalData";
import { guard } from "./shared";

const LOCALHOST = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;

/**
 * Servidor local em qualquer porta (o `astro dev` pode subir em outra), só com
 * RUBRICA_ALLOW_LOCALHOST=true (deployment de desenvolvimento). Igual aos formulários.
 */
export function isLocalDevOrigin(origin: string, env: Record<string, string | undefined> = process.env): boolean {
  return env.RUBRICA_ALLOW_LOCALHOST === "true" && LOCALHOST.test(origin);
}

/** Origens aceitas: URL do site (com e sem www), SITE_URL e RUBRICA_ALLOWED_ORIGINS. O servidor local é `isLocalDevOrigin`. */
export function allowedOrigins(siteUrl: string | undefined, env: Record<string, string | undefined> = process.env): string[] {
  const extra = (env.RUBRICA_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean)
    .flatMap((o) => originsOf(o).slice(0, 1));
  return [...new Set([...originsOf(siteUrl), ...originsOf(env.SITE_URL), ...extra])];
}

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
    /** Mensagem para o dono do site no Telegram (TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID). Sem as duas, não faz nada. */
    notifyAdmin: internalAction({
      args: { message: v.string() },
      handler: async (_ctx, { message }) => {
        const token = process.env.TELEGRAM_BOT_TOKEN;
        // TELEGRAM_ADMIN_CHAT_ID é o nome da v1.
        const chatId = process.env.TELEGRAM_CHAT_ID || process.env.TELEGRAM_ADMIN_CHAT_ID;
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

    /** Origens aceitas no CORS das rotas públicas (ver `allowedOrigins`). */
    siteOrigins: internalQuery({
      args: {},
      handler: async (ctx): Promise<string[]> => allowedOrigins((await getSettingsDoc(ctx))?.url),
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
      handler: (ctx, args) => exportCommercePersonalData(ctx, args.email),
    }),

    /** LGPD: anonimiza o que o comercial guarda sobre o e-mail. Devolve quantos registros mudaram, por fonte. */
    erasePersonalData: internalMutation({
      args: { email: v.string() },
      handler: async (ctx, args) => {
        const bySource = await eraseCommercePersonalData(ctx, args.email);
        return { anonymized: Object.values(bySource).reduce((a, b) => a + b, 0), bySource };
      },
    }),
  };
}
