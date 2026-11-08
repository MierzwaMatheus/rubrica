/**
 * Analytics do site (plugin `analytics`): o script do Umami, como na v1
 * (`src/lib/umamiScript.ts`). Sem endereço https e id do site, nada entra na página.
 *
 * O tracker manda os eventos para a origem do script: ela precisa estar liberada em
 * `script-src` e `connect-src` da CSP (o CLI gera: `npx create-rubrica config --analytics`).
 *
 * Funções puras: o backend (validação das configurações) e o build usam as mesmas.
 */
import type { SiteSettings } from "../content/types";

/** Marca do script de analytics no HTML (a bateria de tema reconhece por ela). */
export const ANALYTICS_ATTR = "data-rb-analytics";

/** Endereço do script, se for https válido (normalizado); senão `undefined`. */
export function analyticsScriptUrl(src: string | undefined): string | undefined {
  const value = src?.trim();
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? url.href : undefined;
  } catch {
    return undefined;
  }
}

/** Id do site no Umami (um UUID): letras, números e hífen. */
export function isAnalyticsId(id: string | undefined): id is string {
  return typeof id === "string" && /^[A-Za-z0-9-]{1,64}$/.test(id.trim());
}

/** Cor em hexadecimal (`#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`). */
export function isCssColor(color: string | undefined): color is string {
  return typeof color === "string" && /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(color.trim());
}

export interface AnalyticsConfig {
  src: string;
  websiteId: string;
  /** Origem do script (a mesma dos eventos), para a CSP. */
  origin: string;
}

/**
 * Configuração efetiva: cada campo vem das configurações do site ou, sem ele, das
 * variáveis do build (`PUBLIC_UMAMI_SCRIPT_URL`, `PUBLIC_UMAMI_WEBSITE_ID`; aceita os
 * nomes da v1, `VITE_UMAMI_*` e `VITE_ANALYTICS_ENDPOINT`/`VITE_ANALYTICS_WEBSITE_ID`).
 */
export function resolveAnalytics(settings: Pick<SiteSettings, "analytics">, env: Record<string, string | undefined> = {}): AnalyticsConfig | undefined {
  const legacyEndpoint = env.VITE_ANALYTICS_ENDPOINT?.trim().replace(/\/+$/, "");
  const src = analyticsScriptUrl(
    settings.analytics?.scriptUrl || env.PUBLIC_UMAMI_SCRIPT_URL || env.VITE_UMAMI_SCRIPT_URL || (legacyEndpoint ? `${legacyEndpoint}/umami` : undefined),
  );
  const websiteId = (settings.analytics?.websiteId || env.PUBLIC_UMAMI_WEBSITE_ID || env.VITE_UMAMI_WEBSITE_ID || env.VITE_ANALYTICS_WEBSITE_ID)?.trim();
  if (!src || !isAnalyticsId(websiteId)) return undefined;
  return { src, websiteId, origin: new URL(src).origin };
}
