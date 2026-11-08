/**
 * Envios públicos das ilhas (contato e depoimento): validação do corpo, origem
 * permitida (CORS) e defesas contra spam sem captcha de terceiros. Arquivo puro,
 * sem Convex. O contrato é o de `islands/api.ts`.
 *
 * Defesas, nesta ordem, nas rotas (`httpRoutes.ts`):
 * 1. `Origin` obrigatório e igual à URL do site (`siteSettings.url`), a uma das
 *    `RUBRICA_ALLOWED_ORIGINS` ou, com `RUBRICA_ALLOW_LOCALHOST=true`, a localhost;
 * 2. `Content-Type: application/json` (força o preflight no navegador) e corpo até 32 KB;
 * 3. honeypot: o campo `website` (escondido na ilha) preenchido finge sucesso e não grava;
 * 4. validação dos campos e `consent: true`;
 * 5. limite por hash de IP e por hash de e-mail (`RATE_LIMITS`);
 * 6. mensagem com muitos links fica marcada como spam e não dispara os destinos.
 */
import { isLocaleCode } from "./text";

export const MAX_BODY_BYTES = 32 * 1024;
export const HONEYPOT_FIELD = "website";
/** A partir de quantos links a mensagem é tratada como spam. */
export const SPAM_LINKS = 4;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const BLOCK_ID = /^[A-Za-z0-9_-]{1,64}$/;

export interface ContactInput {
  name: string;
  email: string;
  phone?: string;
  message: string;
  details?: Record<string, string>;
  locale: string;
  blockId: string;
  page: string;
}

export interface TestimonialInput {
  name: string;
  email: string;
  role?: string;
  company?: string;
  quote: string;
  locale: string;
  blockId: string;
  page: string;
}

export type Validation<T> = { ok: true; data: T } | { ok: false; fields: string[] };

type Body = Record<string, unknown>;

function isObject(value: unknown): value is Body {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** O honeypot veio preenchido (robô). */
export function isHoneypotFilled(body: unknown): boolean {
  if (!isObject(body)) return false;
  const value = body[HONEYPOT_FIELD];
  return typeof value === "string" ? value.trim().length > 0 : value !== undefined && value !== null && value !== "";
}

class Checker {
  readonly fields: string[] = [];
  constructor(private readonly body: Body) {}

  text(key: string, opts: { required?: boolean; max: number }): string | undefined {
    const raw = this.body[key];
    if (raw === undefined || raw === null || raw === "") {
      if (opts.required) this.fields.push(key);
      return undefined;
    }
    if (typeof raw !== "string") {
      this.fields.push(key);
      return undefined;
    }
    const value = raw.trim();
    if ((opts.required && value.length === 0) || value.length > opts.max) {
      this.fields.push(key);
      return undefined;
    }
    return value.length ? value : undefined;
  }

  email(): string | undefined {
    const value = this.text("email", { required: true, max: 254 });
    if (value === undefined) return undefined;
    const normalized = value.toLowerCase();
    if (!EMAIL.test(normalized)) {
      this.fields.push("email");
      return undefined;
    }
    return normalized;
  }

  common(): { locale?: string; blockId?: string; page?: string } {
    if (this.body.consent !== true) this.fields.push("consent");
    const locale = this.text("locale", { required: true, max: 35 });
    if (locale !== undefined && !isLocaleCode(locale)) this.fields.push("locale");
    const blockId = this.text("blockId", { required: true, max: 64 });
    if (blockId !== undefined && !BLOCK_ID.test(blockId)) this.fields.push("blockId");
    const page = this.text("page", { required: true, max: 300 });
    if (page !== undefined && (!page.startsWith("/") || /\s/.test(page))) this.fields.push("page");
    return { locale, blockId, page };
  }

  details(): Record<string, string> | undefined {
    const raw = this.body.details;
    if (raw === undefined || raw === null) return undefined;
    if (!isObject(raw)) {
      this.fields.push("details");
      return undefined;
    }
    const entries = Object.entries(raw);
    const valid =
      entries.length <= 20 &&
      entries.every(([k, v]) => /^[A-Za-z0-9_.-]{1,40}$/.test(k) && typeof v === "string" && v.length <= 200);
    if (!valid) {
      this.fields.push("details");
      return undefined;
    }
    const out: Record<string, string> = {};
    for (const [k, v] of entries) if ((v as string).trim()) out[k] = (v as string).trim();
    return Object.keys(out).length ? out : undefined;
  }
}

export function validateContact(body: unknown): Validation<ContactInput> {
  if (!isObject(body)) return { ok: false, fields: [] };
  const c = new Checker(body);
  const name = c.text("name", { required: true, max: 120 });
  const email = c.email();
  const phone = c.text("phone", { max: 40 });
  const message = c.text("message", { required: true, max: 5000 });
  const details = c.details();
  const { locale, blockId, page } = c.common();
  if (c.fields.length) return { ok: false, fields: [...new Set(c.fields)] };
  return {
    ok: true,
    data: { name: name!, email: email!, message: message!, locale: locale!, blockId: blockId!, page: page!, ...(phone ? { phone } : {}), ...(details ? { details } : {}) },
  };
}

export function validateTestimonial(body: unknown): Validation<TestimonialInput> {
  if (!isObject(body)) return { ok: false, fields: [] };
  const c = new Checker(body);
  const name = c.text("name", { required: true, max: 120 });
  const email = c.email();
  const role = c.text("role", { max: 120 });
  const company = c.text("company", { max: 120 });
  const quote = c.text("quote", { required: true, max: 2000 });
  const { locale, blockId, page } = c.common();
  if (c.fields.length) return { ok: false, fields: [...new Set(c.fields)] };
  return {
    ok: true,
    data: { name: name!, email: email!, quote: quote!, locale: locale!, blockId: blockId!, page: page!, ...(role ? { role } : {}), ...(company ? { company } : {}) },
  };
}

/** Quantos links o texto tem. */
export function countLinks(text: string): number {
  return (text.match(/https?:\/\/|www\./gi) ?? []).length;
}

// ── Origem (CORS) ───────────────────────────────────────────────────────────

const LOCALHOST = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;

function originOf(url: string): string | undefined {
  try {
    return new URL(url).origin;
  } catch {
    return undefined;
  }
}

/**
 * Origens que podem enviar: a URL do site e as extras de `RUBRICA_ALLOWED_ORIGINS`
 * (separadas por vírgula, ex. o domínio com e sem `www`).
 */
export function allowedOrigins(siteUrl: string | undefined, env: Record<string, string | undefined> = process.env): Set<string> {
  const out = new Set<string>();
  const site = siteUrl ? originOf(siteUrl) : undefined;
  if (site) out.add(site);
  for (const extra of (env.RUBRICA_ALLOWED_ORIGINS ?? "").split(",")) {
    const origin = extra.trim() ? originOf(extra.trim()) : undefined;
    if (origin) out.add(origin);
  }
  return out;
}

/** localhost (qualquer porta) só com `RUBRICA_ALLOW_LOCALHOST=true`, no deployment de desenvolvimento. */
export function isOriginAllowed(origin: string | null, siteUrl: string | undefined, env: Record<string, string | undefined> = process.env): boolean {
  if (!origin) return false;
  if (allowedOrigins(siteUrl, env).has(origin)) return true;
  return env.RUBRICA_ALLOW_LOCALHOST === "true" && LOCALHOST.test(origin);
}

export function corsHeaders(origin: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

/** IP do visitante, dos cabeçalhos do proxy. Só serve para o hash; nunca é gravado. */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip")?.trim() || headers.get("cf-connecting-ip")?.trim() || "unknown";
}
