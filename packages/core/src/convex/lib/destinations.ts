/**
 * Destinos dos contatos (RFC v2, decisão 8): Telegram, e-mail e webhook. O painel
 * sempre recebe (o pedido fica no banco); estes são os avisos a mais.
 *
 * Arquivo puro: cada envio recebe o `fetch` e as variáveis de ambiente, para os
 * testes trocarem os dois. Os segredos vêm só do ambiente do Convex (ver
 * `docs/v2/variaveis.md`). Um envio que falha lança; quem chama registra e tenta de novo.
 */
import { hmacSha256Hex } from "./crypto";

export type FetchFn = (url: string, init?: RequestInit) => Promise<Response>;
export type Env = Record<string, string | undefined>;
export type DestinationId = "telegram" | "email" | "webhook";

export interface NotificationPayload {
  event: "contact.created" | "testimonial.submitted";
  id: string;
  createdAt: number;
  site: { name: string; url?: string };
  name: string;
  email: string;
  phone?: string;
  role?: string;
  company?: string;
  /** Mensagem do contato ou texto do depoimento. */
  text: string;
  details?: Record<string, string>;
  locale: string;
  page: string;
}

export interface DestinationsConfig {
  telegram: boolean;
  email: { enabled: boolean; to: string[] };
  webhook: { enabled: boolean; url?: string };
}

export const DEFAULT_DESTINATIONS: DestinationsConfig = {
  telegram: false,
  email: { enabled: false, to: [] },
  webhook: { enabled: false },
};

/** O que falta no ambiente para cada destino funcionar (vazio = pronto). */
export function missingEnv(destination: DestinationId, env: Env): string[] {
  if (destination === "telegram") {
    return [!env.TELEGRAM_BOT_TOKEN && "TELEGRAM_BOT_TOKEN", !(env.TELEGRAM_CHAT_ID || env.TELEGRAM_ADMIN_CHAT_ID) && "TELEGRAM_CHAT_ID"].filter(Boolean) as string[];
  }
  if (destination === "email") {
    const provider = emailProviderId(env);
    const key = EMAIL_PROVIDERS[provider]?.keyEnv;
    return [!key && `RUBRICA_EMAIL_PROVIDER (${provider} desconhecido)`, key && !env[key] && key, !env.RUBRICA_EMAIL_FROM && "RUBRICA_EMAIL_FROM"].filter(Boolean) as string[];
  }
  return env.RUBRICA_WEBHOOK_SECRET ? [] : ["RUBRICA_WEBHOOK_SECRET"];
}

/** Destinos ligados na configuração do site. */
export function enabledDestinations(config: DestinationsConfig): DestinationId[] {
  const out: DestinationId[] = [];
  if (config.telegram) out.push("telegram");
  if (config.email.enabled && config.email.to.length) out.push("email");
  if (config.webhook.enabled && config.webhook.url) out.push("webhook");
  return out;
}

// ── Texto do aviso ──────────────────────────────────────────────────────────

export function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function title(p: NotificationPayload): string {
  return p.event === "contact.created" ? "Novo pedido de contato" : "Novo depoimento para aprovar";
}

function lines(p: NotificationPayload): [string, string][] {
  const out: [string, string][] = [
    ["Nome", p.name],
    ["E-mail", p.email],
  ];
  if (p.phone) out.push(["Telefone", p.phone]);
  if (p.role) out.push(["Cargo", p.role]);
  if (p.company) out.push(["Empresa", p.company]);
  out.push(["Página", p.page], ["Idioma", p.locale]);
  for (const [k, v] of Object.entries(p.details ?? {})) out.push([k, v]);
  return out;
}

function when(p: NotificationPayload): string {
  return new Date(p.createdAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

export function telegramText(p: NotificationPayload): string {
  return [
    `🔔 <b>${title(p)}</b> · ${escapeHtml(p.site.name)}`,
    `🕐 ${when(p)}`,
    "",
    ...lines(p).map(([k, v]) => `<b>${escapeHtml(k)}:</b> ${escapeHtml(v)}`),
    "",
    escapeHtml(p.text.length > 3000 ? `${p.text.slice(0, 3000)}…` : p.text),
  ].join("\n");
}

export function emailContent(p: NotificationPayload): { subject: string; text: string; html: string } {
  const subject = `${title(p)}: ${p.name} (${p.site.name})`;
  const text = [`${title(p)} · ${when(p)}`, "", ...lines(p).map(([k, v]) => `${k}: ${v}`), "", p.text].join("\n");
  const html = [
    `<h2>${escapeHtml(title(p))}</h2>`,
    `<p>${escapeHtml(when(p))}</p>`,
    `<ul>${lines(p).map(([k, v]) => `<li><b>${escapeHtml(k)}:</b> ${escapeHtml(v)}</li>`).join("")}</ul>`,
    `<p style="white-space:pre-wrap">${escapeHtml(p.text)}</p>`,
  ].join("\n");
  return { subject, text, html };
}

// ── Envio ───────────────────────────────────────────────────────────────────

async function failIfNotOk(res: Response, what: string): Promise<void> {
  if (res.ok) return;
  const body = await res.text().catch(() => "");
  throw new Error(`${what}: HTTP ${res.status}${body ? ` ${body.slice(0, 200)}` : ""}`);
}

export async function sendTelegram(p: NotificationPayload, env: Env, fetchFn: FetchFn = fetch): Promise<void> {
  const token = env.TELEGRAM_BOT_TOKEN;
  const chatId = env.TELEGRAM_CHAT_ID || env.TELEGRAM_ADMIN_CHAT_ID;
  if (!token || !chatId) throw new Error("Telegram não configurado (TELEGRAM_BOT_TOKEN e TELEGRAM_CHAT_ID)");
  const res = await fetchFn(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: telegramText(p), parse_mode: "HTML", disable_web_page_preview: true }),
  });
  await failIfNotOk(res, "Telegram");
}

/**
 * Provedor de e-mail por API HTTP. Para trocar de provedor, acrescente uma entrada
 * aqui (chave em env própria) e escolha com `RUBRICA_EMAIL_PROVIDER`.
 */
export interface EmailMessage {
  from: string;
  to: string[];
  replyTo?: string;
  subject: string;
  text: string;
  html: string;
}

export interface EmailProvider {
  /** Variável de ambiente com a chave da API. */
  keyEnv: string;
  send(message: EmailMessage, apiKey: string, fetchFn: FetchFn): Promise<void>;
}

export const EMAIL_PROVIDERS: Record<string, EmailProvider> = {
  resend: {
    keyEnv: "RESEND_API_KEY",
    async send(m, apiKey, fetchFn) {
      const res = await fetchFn("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: m.from, to: m.to, subject: m.subject, text: m.text, html: m.html, ...(m.replyTo ? { reply_to: m.replyTo } : {}) }),
      });
      await failIfNotOk(res, "Resend");
    },
  },
};

export function emailProviderId(env: Env): string {
  return (env.RUBRICA_EMAIL_PROVIDER || "resend").toLowerCase();
}

export async function sendEmail(p: NotificationPayload, to: string[], env: Env, fetchFn: FetchFn = fetch): Promise<void> {
  const id = emailProviderId(env);
  const provider = EMAIL_PROVIDERS[id];
  if (!provider) throw new Error(`Provedor de e-mail desconhecido: ${id}`);
  const apiKey = env[provider.keyEnv];
  const from = env.RUBRICA_EMAIL_FROM;
  if (!apiKey || !from) throw new Error(`E-mail não configurado (${provider.keyEnv} e RUBRICA_EMAIL_FROM)`);
  if (!to.length) throw new Error("Nenhum destinatário de e-mail configurado");
  await provider.send({ from, to, replyTo: p.email, ...emailContent(p) }, apiKey, fetchFn);
}

/** Cabeçalhos do webhook. A assinatura é HMAC-SHA256 de `<timestamp>.<corpo>`. */
export const WEBHOOK_SIGNATURE_HEADER = "X-Rubrica-Signature";
export const WEBHOOK_TIMESTAMP_HEADER = "X-Rubrica-Timestamp";

export async function webhookRequest(p: NotificationPayload, secret: string, now = Date.now()): Promise<{ body: string; headers: Record<string, string> }> {
  const body = JSON.stringify({ event: p.event, id: p.id, createdAt: new Date(p.createdAt).toISOString(), data: p });
  const timestamp = String(Math.floor(now / 1000));
  const signature = await hmacSha256Hex(secret, `${timestamp}.${body}`);
  return {
    body,
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Rubrica-Webhook/1",
      [WEBHOOK_TIMESTAMP_HEADER]: timestamp,
      [WEBHOOK_SIGNATURE_HEADER]: `sha256=${signature}`,
    },
  };
}

export async function sendWebhook(p: NotificationPayload, url: string | undefined, env: Env, fetchFn: FetchFn = fetch): Promise<void> {
  const secret = env.RUBRICA_WEBHOOK_SECRET;
  if (!url) throw new Error("URL do webhook não configurada");
  if (!secret) throw new Error("Webhook sem segredo (RUBRICA_WEBHOOK_SECRET)");
  const { body, headers } = await webhookRequest(p, secret);
  const res = await fetchFn(url, { method: "POST", headers, body });
  await failIfNotOk(res, "Webhook");
}

/** Só https, sem credenciais na URL. */
export function assertWebhookUrl(url: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("URL do webhook inválida");
  }
  if (parsed.protocol !== "https:") throw new Error("O webhook precisa ser https");
  if (parsed.username || parsed.password) throw new Error("Não ponha usuário e senha na URL do webhook: use o segredo");
}

export async function deliver(
  destination: DestinationId,
  p: NotificationPayload,
  config: DestinationsConfig,
  env: Env,
  fetchFn: FetchFn = fetch,
): Promise<void> {
  if (destination === "telegram") return sendTelegram(p, env, fetchFn);
  if (destination === "email") return sendEmail(p, config.email.to, env, fetchFn);
  return sendWebhook(p, config.webhook.url, env, fetchFn);
}

/** Espera antes de cada nova tentativa (1 min, 5 min, 30 min, 2 h). Depois disso, falhou. */
export const RETRY_DELAYS_MS = [60_000, 5 * 60_000, 30 * 60_000, 2 * 60 * 60_000];
export const MAX_ATTEMPTS = RETRY_DELAYS_MS.length + 1;
