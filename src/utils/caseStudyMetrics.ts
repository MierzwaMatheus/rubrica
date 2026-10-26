import type { CaseStudyMetric } from "@/repositories/interfaces/PortfolioRepository";

/** Texto de um card de métrica num idioma; o ícone fica só na métrica original. */
export interface MetricText {
  label: string;
  value: string;
}

const hasLetters = (s: string) => /\p{L}/u.test(s);

/** Aplica a tradução dos cards por posição, caindo no original onde faltar. */
export function localizeMetrics(
  metrics: CaseStudyMetric[],
  translated: MetricText[] | undefined,
): CaseStudyMetric[] {
  if (!translated?.length) return metrics;
  return metrics.map((m, i) => ({
    ...m,
    label: translated[i]?.label || m.label,
    value: translated[i]?.value || m.value,
  }));
}

function savedTranslation(
  i: number,
  field: keyof MetricText,
  metric: MetricText,
  previous?: MetricText[],
  previousTranslated?: MetricText[],
): string | undefined {
  const unchanged = previous?.[i]?.[field]?.trim() === metric[field].trim();
  return unchanged ? previousTranslated?.[i]?.[field] || undefined : undefined;
}

/** Campos (chave `metric.<i>.<campo>`) que precisam ir para o tradutor. */
export function metricFieldsToTranslate(
  metrics: MetricText[],
  previous?: MetricText[],
  previousTranslated?: MetricText[],
): Record<string, string> {
  const fields: Record<string, string> = {};
  metrics.forEach((m, i) => {
    (["label", "value"] as const).forEach((field) => {
      const text = m[field];
      if (!text.trim() || !hasLetters(text)) return;
      if (savedTranslation(i, field, m, previous, previousTranslated)) return;
      fields[`metric.${i}.${field}`] = text;
    });
  });
  return fields;
}

/** Monta os cards traduzidos: tradução nova, senão a salva, senão o original. */
export function buildTranslatedMetrics(
  metrics: MetricText[],
  translated: Record<string, string>,
  previous?: MetricText[],
  previousTranslated?: MetricText[],
): MetricText[] {
  return metrics.map((m, i) => {
    const pick = (field: keyof MetricText) =>
      translated[`metric.${i}.${field}`] ??
      savedTranslation(i, field, m, previous, previousTranslated) ??
      m[field];
    return { label: pick("label"), value: pick("value") };
  });
}
