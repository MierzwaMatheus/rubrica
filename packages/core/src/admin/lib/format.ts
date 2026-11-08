/**
 * Formatação e conferências puras das telas de negócio e de coleções: preço em reais,
 * período do plano, contador de SEO e prévia do Google, desconto, comparação de
 * versões de proposta e datas. Sem React: testável.
 */
import type { Localized } from "../../i18n";

// ── Preço ───────────────────────────────────────────────────────────────────

/** `9900` → `R$ 99,00` (centavos; a moeda é BRL se não vier outra). */
export function formatCents(cents: number, currency = "BRL"): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency }).format(cents / 100);
}

/** Valor em reais (propostas e checkouts): `1500` → `R$ 1.500,00`. */
export function formatBRL(value: number): string {
  return formatCents(Math.round(value * 100));
}

/**
 * Lê o que a pessoa digitou como valor em reais: `1.234,56`, `1234,56`, `1234.56`,
 * `R$ 99`. Devolve reais, ou `undefined` se não for um valor (vazio, texto, negativo).
 */
export function parseMoney(input: string): number | undefined {
  const text = input.replace(/R\$|\s/g, "");
  if (!text || !/^\d[\d.,]*$/.test(text)) return undefined;
  const lastComma = text.lastIndexOf(",");
  const lastDot = text.lastIndexOf(".");
  let normalized: string;
  if (lastComma >= 0 && lastDot >= 0) {
    // O último separador é o decimal.
    const decimal = lastComma > lastDot ? "," : ".";
    const thousands = decimal === "," ? "." : ",";
    normalized = text.split(thousands).join("").replace(decimal, ".");
  } else if (lastComma >= 0) {
    normalized = /,\d{1,2}$/.test(text) && text.indexOf(",") === lastComma ? text.replace(",", ".") : text.split(",").join("");
  } else if (lastDot >= 0) {
    // "1.500" é mil e quinhentos; "1.5" e "1.50" são decimais.
    normalized = /\.\d{3}$/.test(text) ? text.split(".").join("") : text;
  } else normalized = text;
  const n = Number(normalized);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : undefined;
}

export function toCents(reais: number): number {
  return Math.round(reais * 100);
}

/** Centavos como texto editável (`9900` → `99,00`). */
export function centsToInput(cents: number | undefined): string {
  return cents === undefined ? "" : (cents / 100).toFixed(2).replace(".", ",");
}

export const PERIOD_LABELS = { month: "por mês", year: "por ano", once: "pagamento único", hour: "por hora", project: "por projeto" } as const;
export type PricePeriod = keyof typeof PERIOD_LABELS;
export const PERIODS = Object.keys(PERIOD_LABELS) as PricePeriod[];

/** `R$ 99,00 por mês`; sem preço, o texto livre (`priceLabel`) ou "Sob consulta". */
export function formatPlanPrice(plan: { priceCents?: number; currency?: string; period?: PricePeriod; priceLabel?: string }): string {
  if (plan.priceCents === undefined) return plan.priceLabel || "Sob consulta";
  const price = formatCents(plan.priceCents, plan.currency || "BRL");
  return plan.period ? `${price} ${PERIOD_LABELS[plan.period]}` : price;
}

/** O backend só vira link de pagamento com valor em reais (mínimo R$ 5) e pagamento único. */
export const MIN_CHARGE_CENTS = 500;
export function planPayability(plan: { priceCents?: number; currency?: string; period?: PricePeriod }): { ok: true } | { ok: false; reason: string } {
  if (plan.priceCents === undefined) return { ok: false, reason: "Defina o preço em reais." };
  if (plan.currency && plan.currency !== "BRL") return { ok: false, reason: "O link de pagamento só aceita reais." };
  if (plan.priceCents < MIN_CHARGE_CENTS) return { ok: false, reason: `O valor mínimo é ${formatCents(MIN_CHARGE_CENTS)}.` };
  if (plan.period && plan.period !== "once" && plan.period !== "project") return { ok: false, reason: "Só planos de pagamento único (único ou por projeto) viram link de pagamento." };
  return { ok: true };
}

// ── SEO ─────────────────────────────────────────────────────────────────────

export const SEO_TITLE_MAX = 60;
export const SEO_DESCRIPTION_MAX = 160;

export type CountState = "empty" | "short" | "good" | "long";

/** Situação do contador: vazio, curto, bom, ou longo (o Google corta). */
export function countState(length: number, range: { min: number; max: number }): CountState {
  if (length === 0) return "empty";
  if (length > range.max) return "long";
  return length < range.min ? "short" : "good";
}

export const SEO_TITLE_RANGE = { min: 30, max: SEO_TITLE_MAX };
export const SEO_DESCRIPTION_RANGE = { min: 70, max: SEO_DESCRIPTION_MAX };

export function truncate(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
}

/** Como o resultado aparece no Google: título e descrição cortados como ele corta. */
export function googlePreview(input: { title: string; description?: string; url: string; siteName?: string }) {
  let host = input.url;
  let crumbs = "";
  try {
    const u = new URL(input.url);
    host = u.host;
    crumbs = u.pathname.split("/").filter(Boolean).join(" › ");
  } catch {
    /* url relativa: mostra como veio */
  }
  return {
    site: input.siteName || host,
    breadcrumb: crumbs ? `${host} › ${crumbs}` : host,
    title: truncate(input.title, SEO_TITLE_MAX),
    description: truncate(input.description ?? "", SEO_DESCRIPTION_MAX),
  };
}

// ── Texto ───────────────────────────────────────────────────────────────────

export function plainText(html: string): string {
  return html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

/** Primeiro texto preenchido: o do idioma, senão o do principal, senão qualquer um. */
export function textIn(value: Localized<string> | string | undefined, locale: string, fallback?: string): string {
  if (typeof value === "string") return value;
  if (!value) return "";
  const hit = value[locale] || (fallback ? value[fallback] : "") || Object.values(value).find((v) => typeof v === "string" && v.trim());
  return typeof hit === "string" ? hit : "";
}

// ── Datas ───────────────────────────────────────────────────────────────────

export function formatDateTime(ms: number | undefined | null): string {
  if (!ms) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(ms);
}

export function formatDate(ms: number | undefined | null): string {
  if (!ms) return "—";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(ms);
}

/** "há 5 min", "há 2 h", "ontem", ou a data. */
export function timeAgo(ms: number, now = Date.now()): string {
  const diff = Math.max(0, now - ms);
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.floor(h / 24);
  if (d === 1) return "ontem";
  if (d < 7) return `há ${d} dias`;
  return formatDate(ms);
}

// ── Versões de proposta ─────────────────────────────────────────────────────

export interface VersionChange {
  field: string;
  label: string;
  before: string;
  after: string;
}

const VERSION_FIELDS: { key: string; label: string }[] = [
  { key: "clientName", label: "Cliente" },
  { key: "title", label: "Título" },
  { key: "objective", label: "Objetivo" },
  { key: "scope", label: "Escopo" },
  { key: "timeline", label: "Cronograma" },
  { key: "deliveryDate", label: "Entrega" },
  { key: "investmentValue", label: "Investimento" },
  { key: "originalValue", label: "Valor original" },
  { key: "scopePrices", label: "Preço dos itens" },
  { key: "giftIndexes", label: "Itens de cortesia" },
  { key: "paymentMethods", label: "Formas de pagamento" },
  { key: "conditions", label: "Condições" },
  { key: "rescissionPolicy", label: "Rescisão" },
  { key: "templateId", label: "Modelo de contrato" },
];

function describe(key: string, value: unknown, locale: string): string {
  if (value === undefined || value === null) return "—";
  if (key === "investmentValue" || key === "originalValue") return formatBRL(value as number);
  if (key === "scopePrices") return (value as (number | null)[]).map((p) => (p === null ? "—" : formatBRL(p))).join(" · ");
  if (key === "giftIndexes") return (value as number[]).map((i) => i + 1).join(", ") || "—";
  if (key === "timeline") return (value as { step: Localized<string>; period: Localized<string> }[]).map((t) => `${textIn(t.step, locale)} (${textIn(t.period, locale)})`).join(" → ") || "—";
  if (Array.isArray(value)) return value.map((v) => textIn(v as Localized<string>, locale)).join(" · ") || "—";
  if (typeof value === "object") return textIn(value as Localized<string>, locale) || JSON.stringify(value);
  return String(value);
}

/** O que mudou de uma versão para a outra (só os campos com diferença). */
export function diffVersions(before: Record<string, unknown>, after: Record<string, unknown>, locale = "pt-BR"): VersionChange[] {
  const out: VersionChange[] = [];
  for (const { key, label } of VERSION_FIELDS) {
    if (JSON.stringify(before[key] ?? null) === JSON.stringify(after[key] ?? null)) continue;
    out.push({ field: key, label, before: describe(key, before[key], locale), after: describe(key, after[key], locale) });
  }
  return out;
}

// ── Contrato ────────────────────────────────────────────────────────────────

/** Variáveis `{{nome}}` usadas no texto do modelo. */
export function templateVariables(content: string): string[] {
  return [...new Set([...content.matchAll(/\{\{\s*([a-z_][a-z0-9_]*)\s*\}\}/gi)].map((m) => m[1]!))];
}

/** Variáveis `{{nome}}` que o texto do contrato entende. */
export const CONTRACT_VARIABLES: { name: string; label: string }[] = [
  { name: "client_name", label: "Nome do cliente" },
  { name: "client_document_line", label: "Documento do cliente (linha)" },
  { name: "client_email_line", label: "E-mail do cliente (linha)" },
  { name: "contractor_name", label: "Nome de quem presta o serviço" },
  { name: "contractor_document", label: "Documento de quem presta" },
  { name: "contractor_document_type", label: "Tipo do documento (CPF/CNPJ)" },
  { name: "contractor_address", label: "Endereço de quem presta" },
  { name: "objective", label: "Objetivo" },
  { name: "scope", label: "Escopo" },
  { name: "timeline", label: "Cronograma" },
  { name: "delivery_date_line", label: "Entrega (linha)" },
  { name: "investment_value", label: "Valor do investimento" },
  { name: "discount", label: "Desconto" },
  { name: "payment_methods", label: "Formas de pagamento" },
  { name: "conditions", label: "Condições" },
  { name: "rescission_policy", label: "Rescisão" },
  { name: "jurisdiction", label: "Foro" },
  { name: "accepted_at", label: "Data do aceite" },
];

/** Variáveis do texto que o contrato não conhece (ficariam sem preencher). */
export function unknownVariables(content: string): string[] {
  const known = new Set(CONTRACT_VARIABLES.map((v) => v.name));
  return templateVariables(content).filter((v) => !known.has(v));
}
