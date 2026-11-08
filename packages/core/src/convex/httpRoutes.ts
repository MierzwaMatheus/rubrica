/**
 * Rotas HTTP da linha de empresa, acrescentadas ao `rubrica.http`:
 *
 * - `POST /rubrica/contato` e `POST /rubrica/depoimento`: envios das ilhas, com o
 *   contrato de `islands/api.ts` (CORS com preflight, origem do site, honeypot,
 *   validação, consentimento e limite por IP; ver `lib/intake.ts`);
 * - `POST /rubrica/publicacao/concluida`: aviso do provedor de hospedagem de que o
 *   build terminou (segredo em `RUBRICA_DEPLOY_CALLBACK_SECRET`).
 */
import type { HttpRouter } from "convex/server";
import { personalHash, timingSafeEqual } from "./lib/crypto";
import {
  clientIp,
  corsHeaders,
  isHoneypotFilled,
  isOriginAllowed,
  MAX_BODY_BYTES,
  validateContact,
  validateTestimonial,
  type Validation,
} from "./lib/intake";
import { httpAction, ref, type ActionCtx } from "./server";

export const INTAKE_PATHS = { contato: "/rubrica/contato", depoimento: "/rubrica/depoimento" } as const;
export const PUBLISH_CALLBACK_PATH = "/rubrica/publicacao/concluida";

type SubmitResult = { ok: true; id: string } | { ok: false; error: "rate_limited"; retryAfter: number } | { ok: false; error: "disabled" };

const refs = {
  publicConfig: ref<"query", Record<string, never>, { siteUrl: string | null; contact: boolean; testimonial: boolean }>("query", "contacts", "publicConfig"),
  submitContact: ref<"mutation", Record<string, unknown>, SubmitResult>("mutation", "contacts", "submit"),
  submitTestimonial: ref<"mutation", Record<string, unknown>, SubmitResult>("mutation", "testimonialIntake", "submit"),
  publishDone: ref<"mutation", Record<string, never>, null>("mutation", "publish", "markPublished"),
};

function json(body: unknown, status: number, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...headers } });
}

interface IntakeSpec<T> {
  plugin: "contact" | "testimonial";
  validate: (body: unknown) => Validation<T>;
  submit: typeof refs.submitContact;
}

function intakeHandler<T extends { email: string }>(spec: IntakeSpec<T>) {
  return httpAction(async (actionCtx, req) => {
    const ctx = actionCtx as unknown as ActionCtx;
    const origin = req.headers.get("origin");
    const config = await ctx.runQuery(refs.publicConfig, {});
    if (!isOriginAllowed(origin, config.siteUrl ?? undefined)) return json({ ok: false, error: "forbidden_origin" }, 403);
    const cors = corsHeaders(origin!);
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (!config[spec.plugin]) return json({ ok: false, error: "disabled" }, 404, cors);
    if (!(req.headers.get("content-type") ?? "").toLowerCase().includes("application/json")) {
      return json({ ok: false, error: "invalid", fields: [] }, 415, cors);
    }
    const raw = await req.text();
    if (raw.length > MAX_BODY_BYTES) return json({ ok: false, error: "invalid", fields: [] }, 413, cors);
    let body: unknown;
    try {
      body = JSON.parse(raw);
    } catch {
      return json({ ok: false, error: "invalid", fields: [] }, 400, cors);
    }
    // Robô preencheu o campo escondido: responde como sucesso e não grava nada.
    if (isHoneypotFilled(body)) return json({ ok: true }, 200, cors);
    const result = spec.validate(body);
    if (!result.ok) return json({ ok: false, error: "invalid", fields: result.fields }, 400, cors);
    const ipHash = await personalHash(`ip:${clientIp(req.headers)}`);
    const emailHash = await personalHash(`email:${result.data.email}`);
    const saved = await ctx.runMutation(spec.submit, { ...result.data, ipHash, emailHash });
    if (saved.ok) return json({ ok: true, id: saved.id }, 200, cors);
    if (saved.error === "rate_limited") return json({ ok: false, error: "rate_limited", retryAfter: saved.retryAfter }, 429, { ...cors, "Retry-After": String(saved.retryAfter) });
    return json({ ok: false, error: "disabled" }, 404, cors);
  });
}

export function addBusinessRoutes(http: HttpRouter): void {
  const contato = intakeHandler({ plugin: "contact", validate: validateContact, submit: refs.submitContact });
  const depoimento = intakeHandler({ plugin: "testimonial", validate: validateTestimonial, submit: refs.submitTestimonial });
  for (const method of ["POST", "OPTIONS"] as const) {
    http.route({ path: INTAKE_PATHS.contato, method, handler: contato });
    http.route({ path: INTAKE_PATHS.depoimento, method, handler: depoimento });
  }

  http.route({
    path: PUBLISH_CALLBACK_PATH,
    method: "POST",
    handler: httpAction(async (actionCtx, req) => {
      const ctx = actionCtx as unknown as ActionCtx;
      const expected = process.env.RUBRICA_DEPLOY_CALLBACK_SECRET;
      const url = new URL(req.url);
      const received = req.headers.get("x-rubrica-secret") ?? url.searchParams.get("secret") ?? "";
      if (!expected || !timingSafeEqual(received, expected)) return new Response("Unauthorized", { status: 401 });
      await ctx.runMutation(refs.publishDone, {});
      return new Response("ok", { status: 200 });
    }),
  });
}
