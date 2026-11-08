/**
 * Recursos do site inteiro, configurados uma vez em `SiteSettings`: o WhatsApp (botão
 * flutuante e o endereço `whatsapp:` dos campos de link) e a faixa de aviso no topo.
 * Funções puras: rodam no backend (validação), no build, na prévia e nos testes.
 */
import { pick, type Locale } from "../i18n";
import type { Announcement, SiteSettings, WhatsAppSettings } from "../content/types";

// ── WhatsApp ────────────────────────────────────────────────────────────────

/** Endereço especial dos campos de link: `whatsapp:` ou `whatsapp:<mensagem>`. */
export const WHATSAPP_HREF = /^whatsapp:/i;

/** "+55 (11) 91234-5678" → "5511912345678". O prefixo internacional `00` sai. */
export function normalizeWhatsAppNumber(raw: string): string {
  return raw.replace(/\D+/g, "").replace(/^00/, "");
}

/** Formato internacional (E.164) só com dígitos: DDI sem zero na frente, de 8 a 15 dígitos. */
export function isWhatsAppNumber(value: string): boolean {
  return /^[1-9]\d{7,14}$/.test(value);
}

/** `https://wa.me/<número>`, com a mensagem já escrita quando houver. */
export function whatsAppUrl(number: string, message?: string): string {
  const base = `https://wa.me/${normalizeWhatsAppNumber(number)}`;
  const text = message?.trim();
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}

/**
 * Número do site para os links `whatsapp:`: o das configurações de WhatsApp e, sem elas,
 * o WhatsApp da pessoa ou da empresa. Só dígitos; ausente se não houver nenhum válido.
 */
export function siteWhatsAppNumber(settings: Pick<SiteSettings, "whatsapp" | "person" | "organization">): string | undefined {
  const raw = settings.whatsapp?.number ?? settings.person?.whatsapp ?? settings.organization?.whatsapp;
  const number = raw ? normalizeWhatsAppNumber(raw) : "";
  return isWhatsAppNumber(number) ? number : undefined;
}

/** Mensagem padrão do WhatsApp no idioma (sem tradução, nenhuma: decisão 28). */
export function whatsAppMessage(settings: Pick<SiteSettings, "whatsapp">, locale: Locale): string | undefined {
  return pick(settings.whatsapp?.message, locale);
}

/**
 * `whatsapp:` → o `wa.me` do site com a mensagem padrão do idioma; `whatsapp:Quero o plano Pro`
 * usa o texto depois dos dois-pontos como mensagem. Sem número configurado, `undefined`.
 */
export function resolveWhatsAppHref(href: string, number: string | undefined, defaultMessage: string | undefined): string | undefined {
  if (!number) return undefined;
  let custom = href.replace(WHATSAPP_HREF, "");
  try {
    custom = decodeURIComponent(custom);
  } catch {
    /* texto com "%" solto: vai como está */
  }
  return whatsAppUrl(number, custom.trim() || defaultMessage);
}

// ── Faixa de aviso ──────────────────────────────────────────────────────────

const DAY = /^(\d{4})-(\d{2})-(\d{2})$/;
const DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/;

/**
 * Data do período do aviso em epoch ms. `AAAA-MM-DD` vale o dia inteiro em UTC (início à
 * 0h, fim às 23h59min59s); data e hora precisam do fuso. Inválida: `undefined`.
 */
export function announcementTime(value: string, edge: "start" | "end"): number | undefined {
  const day = DAY.exec(value);
  if (day) {
    const [y, m, d] = [Number(day[1]), Number(day[2]) - 1, Number(day[3])];
    const date = new Date(Date.UTC(y, m, d));
    if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m || date.getUTCDate() !== d) return undefined;
    return edge === "start" ? date.getTime() : date.getTime() + 86_400_000 - 1;
  }
  if (!DATE_TIME.test(value)) return undefined;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? undefined : ms;
}

/** O aviso está no ar neste instante (ligado e dentro do período, quando há)? */
export function announcementActive(announcement: Announcement | undefined, now: number): boolean {
  if (!announcement?.enabled) return false;
  const start = announcement.startsAt ? announcementTime(announcement.startsAt, "start") : undefined;
  const end = announcement.endsAt ? announcementTime(announcement.endsAt, "end") : undefined;
  if (start !== undefined && now < start) return false;
  if (end !== undefined && now > end) return false;
  return true;
}

// ── Validação (backend e backend de demonstração do painel) ────────────────

type SiteWide = { whatsapp?: WhatsAppSettings; announcement?: Announcement };

/** O número do WhatsApp vira só dígitos ("+55 (11) 9…" → "55119…"). O resto fica como está. */
export function normalizeSiteWide<T extends SiteWide>(settings: T): T {
  if (!settings.whatsapp) return settings;
  return { ...settings, whatsapp: { ...settings.whatsapp, number: normalizeWhatsAppNumber(settings.whatsapp.number) } };
}

function tooLong(value: Partial<Record<string, string>> | undefined, max: number): boolean {
  return Object.values(value ?? {}).some((s) => (s ?? "").length > max);
}

/** Confere o WhatsApp e a faixa de aviso (já normalizados). Lança `Error` com a mensagem para o painel. */
export function validateSiteWide(settings: SiteWide): void {
  const { whatsapp, announcement } = settings;
  if (whatsapp) {
    if (!isWhatsAppNumber(whatsapp.number)) {
      throw new Error("Número do WhatsApp inválido: use o formato internacional, com DDI e DDD (ex.: +55 11 91234-5678)");
    }
    if (tooLong(whatsapp.message, 500)) throw new Error("Mensagem do WhatsApp: até 500 caracteres por idioma");
    if (tooLong(whatsapp.label, 40)) throw new Error("Texto do botão do WhatsApp: até 40 caracteres por idioma");
  }
  if (announcement) {
    const hasText = Object.values(announcement.text).some((s) => s?.trim());
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
}
