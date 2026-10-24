import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useI18n } from "@/i18n/context/I18nContext";
import type { HomeRepository } from "@/repositories/interfaces/HomeRepository";
import { localizeMetric } from "@/utils/homeMetrics";

/** Números de prova (até 4) já no idioma atual. Lista vazia esconde a faixa. */
export function useHomeMetrics(repository: HomeRepository) {
  const { locale } = useI18n();
  const { data, isLoading } = useQuery({
    queryKey: ["home", "home_metrics"],
    queryFn: () => repository.getHomeMetrics(),
    staleTime: Infinity,
  });
  const metrics = useMemo(() => (data ?? []).map(m => localizeMetric(m, locale)), [data, locale]);
  return { metrics, isLoading };
}
