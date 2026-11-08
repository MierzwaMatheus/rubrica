/** Tipos compartilhados da bateria de tema. */

export type SiteKind = "pessoal" | "empresa";

/** Limites configuráveis da bateria (decisão 31 do RFC). */
export interface Limits {
  /** Soma de JavaScript (gzip) por página com ilha, em KB. */
  jsKb: number;
  lighthouse: { performance: number; accessibility: number; seo: number };
}

export const DEFAULT_LIMITS: Limits = {
  jsKb: 120,
  lighthouse: { performance: 90, accessibility: 95, seo: 95 },
};

export type CheckId =
  | "status"
  | "axe"
  | "h1"
  | "title"
  | "description"
  | "canonical"
  | "lang"
  | "hreflang"
  | "overflow"
  | "console"
  | "network"
  | "js"
  | "hydration";

export interface CheckResult {
  id: CheckId;
  ok: boolean;
  /** Resumo de uma linha. */
  message: string;
  /** Detalhes (um item por ocorrência: seletor e regra do axe, URL, etc.). */
  details?: string[];
}

export interface PageReport {
  path: string;
  checks: CheckResult[];
  /** JavaScript carregado (gzip, em bytes) e se a página tem ilhas. */
  js: { gzipBytes: number; islands: number; files: { url: string; gzipBytes: number }[] };
  ok: boolean;
}

export interface LighthouseScores {
  performance: number;
  accessibility: number;
  seo: number;
}

export interface LighthouseReport {
  path: string;
  label: "home" | "post" | "case" | string;
  /** Mediana por categoria (0 a 100). */
  scores: LighthouseScores;
  runs: LighthouseScores[];
  ok: boolean;
  failures: string[];
}

export interface SiteReport {
  site: SiteKind | string;
  theme: string;
  /** Preenchido quando o site não pôde ser testado (fixtures ausentes, build quebrou). */
  skipped?: string;
  buildError?: string;
  pages: PageReport[];
  lighthouse: LighthouseReport[];
  lighthouseSkipped?: string;
  ok: boolean;
}

export interface FullReport {
  theme: string;
  limits: Limits;
  startedAt: string;
  sites: SiteReport[];
  ok: boolean;
}
