/**
 * Rotas HTTP do comercial, acrescentadas em `rubrica.http`. São HTTP (e não
 * mutations chamadas pelo navegador) para o IP e o navegador saírem do servidor.
 *
 * | Rota | Para quê |
 * |---|---|
 * | `POST /api/proposal/session` | senha da proposta → token de sessão |
 * | `POST /api/proposal/accept` | aceite eletrônico |
 * | `POST /api/checkout/start` | visitante informa os dados no link de pagamento de um plano |
 * | `POST /webhooks/asaas` | confirmações e estornos do Asaas |
 *
 * As rotas públicas respondem CORS só para as origens do site (`commerce.siteOrigins`).
 */
import type { HttpRouter } from "convex/server";
import { httpAction, ref, type ActionCtx } from "../server";
import { handleAsaasWebhook } from "./lib/asaasWebhook";
import { errorPayload } from "./shared";
import { isLocalDevOrigin } from "./commerce";

type Ctx = ActionCtx;

const refs = {
  siteOrigins: ref<"query", Record<string, never>, string[]>("query", "commerce", "siteOrigins"),
  recordInvalidWebhook: ref<"mutation", { provider: string; ipAddress: string }, { allowed: boolean }>("mutation", "commerce", "recordInvalidWebhook"),
  hitRateLimit: ref<"mutation", { type: string; identifier: string }>("mutation", "audit", "hitRateLimit"),
  createSession: ref<"mutation">("mutation", "proposals", "createSession"),
  accept: ref<"mutation">("mutation", "proposals", "accept"),
  startFromLink: ref<"mutation">("mutation", "checkouts", "startFromLink"),
  markPaidByLink: ref<"mutation">("mutation", "checkouts", "markPaidByLink"),
  markRefundedByLink: ref<"mutation">("mutation", "checkouts", "markRefundedByLink"),
};

function corsHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip")?.trim() || "unknown";
}

/** Só os campos esperados, com o tipo esperado (o resto do corpo é ignorado). */
function pick(body: unknown, fields: Record<string, "string" | "boolean">): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (!body || typeof body !== "object") return out;
  for (const [key, type] of Object.entries(fields)) {
    const value = (body as Record<string, unknown>)[key];
    if (typeof value === type) out[key] = value;
  }
  return out;
}

type PublicHandler = (ctx: Ctx, body: unknown, meta: { ip: string; userAgent: string }) => Promise<{ status: number; body: unknown }>;

function publicRoute(handler: PublicHandler) {
  return httpAction(async (ctx, req) => {
    const origin = req.headers.get("origin");
    const allowed = origin ? isLocalDevOrigin(origin) || (await ctx.runQuery(refs.siteOrigins, {})).includes(origin) : false;
    const cors = origin && allowed ? corsHeaders(origin) : {};
    if (req.method === "OPTIONS") {
      return allowed ? new Response(null, { status: 204, headers: cors }) : new Response("Forbidden", { status: 403 });
    }
    const json = (body: unknown, status: number) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...cors } });
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return json({ error: "INVALID_JSON", message: "Corpo inválido." }, 400);
    }
    try {
      const result = await handler(ctx, body, { ip: clientIp(req), userAgent: req.headers.get("user-agent") ?? "unknown" });
      return json(result.body, result.status);
    } catch (err) {
      const payload = errorPayload(err);
      return json(payload, payload.error === "TOO_MANY_ATTEMPTS" ? 429 : 400);
    }
  });
}

/** Limite por IP numa mutation à parte (a contagem fica mesmo se o pedido falhar). */
async function limit(ctx: Ctx, type: string, identifier: string): Promise<{ status: number; body: unknown } | null> {
  try {
    await ctx.runMutation(refs.hitRateLimit, { type, identifier });
    return null;
  } catch (err) {
    return { status: 429, body: { error: "TOO_MANY_ATTEMPTS", message: (err as Error).message } };
  }
}

const SESSION_STATUS = { NOT_FOUND: 404, NO_PASSWORD: 400, INVALID_PASSWORD: 401, TOO_MANY_ATTEMPTS: 429 } as const;

export function addCommerceRoutes(http: HttpRouter): void {
  const session = publicRoute(async (ctx, body, { ip, userAgent }) => {
    const args = pick(body, { slug: "string", password: "string" });
    if (typeof args.slug !== "string" || typeof args.password !== "string") {
      return { status: 400, body: { error: "INVALID_INPUT", message: "Informe a proposta e a senha." } };
    }
    const result = (await ctx.runMutation(refs.createSession, { ...args, ipAddress: ip, userAgent })) as
      | { ok: true; token: string; expiresAt: number }
      | { ok: false; error: keyof typeof SESSION_STATUS };
    if (result.ok) return { status: 200, body: { token: result.token, expiresAt: result.expiresAt } };
    return { status: SESSION_STATUS[result.error], body: { error: result.error, message: result.error } };
  });

  const accept = publicRoute(async (ctx, body, { ip, userAgent }) => {
    const args = pick(body, {
      slug: "string",
      token: "string",
      clientName: "string",
      clientDocument: "string",
      clientEmail: "string",
      clientRole: "string",
      clientDeclaration: "string",
      locale: "string",
      signatureStorageId: "string",
    });
    if (typeof args.slug !== "string") return { status: 400, body: { error: "INVALID_INPUT", message: "Proposta não informada." } };
    const blocked = await limit(ctx, "proposal_accept", `${args.slug}:${ip}`);
    if (blocked) return blocked;
    const result = (await ctx.runMutation(refs.accept, { ...args, ipAddress: ip, userAgent })) as { acceptanceId: string; contentHash: string };
    return { status: 200, body: { id: result.acceptanceId, contentHash: result.contentHash, ipAddress: ip, userAgent } };
  });

  const start = publicRoute(async (ctx, body, { ip }) => {
    const args = pick(body, {
      uniqueLink: "string",
      customerName: "string",
      customerEmail: "string",
      customerCpfCnpj: "string",
      customerMobilePhone: "string",
      customerCompany: "string",
    });
    const blocked = await limit(ctx, "checkout_start", ip);
    if (blocked) return blocked;
    const result = (await ctx.runMutation(refs.startFromLink, args)) as { uniqueLink: string };
    return { status: 200, body: result };
  });

  for (const [path, handler] of [
    ["/api/proposal/session", session],
    ["/api/proposal/accept", accept],
    ["/api/checkout/start", start],
  ] as const) {
    http.route({ path, method: "POST", handler });
    http.route({ path, method: "OPTIONS", handler });
  }

  http.route({
    path: "/webhooks/asaas",
    method: "POST",
    handler: httpAction(async (ctx, req) => {
      const ip = clientIp(req);
      const result = await handleAsaasWebhook({
        expectedToken: process.env.ASAAS_WEBHOOK_TOKEN,
        receivedToken: req.headers.get("asaas-access-token"),
        body: await req.text(),
        onUnauthorized: async () => {
          await ctx.runMutation(refs.recordInvalidWebhook, { provider: "asaas", ipAddress: ip });
        },
        markPaid: async (payment) => {
          await ctx.runMutation(refs.markPaidByLink, { ...payment });
        },
        markRefunded: async (payment) => {
          await ctx.runMutation(refs.markRefundedByLink, { ...payment });
        },
      });
      return new Response(result.body, { status: result.status });
    }),
  });
}
