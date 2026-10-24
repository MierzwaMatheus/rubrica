/** Números de prova exibidos no topo da home e do currículo (chave `home_metrics`). */
export interface HomeMetric {
  value: string;
  label: string;
  labelTranslations?: { ptBR?: string; enUS?: string };
}

export const MAX_HOME_METRICS = 4;

export function parseHomeMetrics(raw: unknown): HomeMetric[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((m): m is HomeMetric => !!m && typeof m === "object")
    .filter(m => typeof m.value === "string" && m.value.trim() && typeof m.label === "string" && m.label.trim())
    .slice(0, MAX_HOME_METRICS);
}

export function localizeMetric(m: HomeMetric, locale: string): { value: string; label: string } {
  const k = locale === "en-US" ? "enUS" : "ptBR";
  return { value: m.value, label: m.labelTranslations?.[k] || m.labelTranslations?.ptBR || m.label };
}
