import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useI18n } from "@/i18n/context/I18nContext";
import type { HomeRepository } from "@/repositories/interfaces/HomeRepository";
import { localizePrinciple } from "@/utils/aboutContent";

/** Princípios de trabalho já traduzidos para o idioma atual. */
export function useWorkPrinciples(repository: HomeRepository) {
  const { locale } = useI18n();
  const { data, isLoading } = useQuery({
    queryKey: ["home", "work_principles"],
    queryFn: () => repository.getWorkPrinciples(),
    staleTime: Infinity,
  });
  const principles = useMemo(
    () => (data ?? []).map(p => localizePrinciple(p, locale)),
    [data, locale],
  );
  return { principles, isLoading };
}
