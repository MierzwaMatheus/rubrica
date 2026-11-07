import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useI18n } from "@/i18n/context/I18nContext";
import {
  ResumeRepository,
  ResumeItem,
} from "@/repositories/interfaces/ResumeRepository";

export function useResume(repository: ResumeRepository) {
  const { locale } = useI18n();

  const { data: itemsRaw, isLoading } = useQuery({
    queryKey: ["resume", "items"],
    queryFn: () => repository.list(),
    staleTime: Infinity,
  });

  // Processa items com tradução
  const items = useMemo(() => localizeResumeItems(itemsRaw ?? [], locale), [itemsRaw, locale]);

  const getItemsByType = (type: string) =>
    items
      .filter(i => i.type === type)
      .sort((a, b) => a.order_index - b.order_index);

  return {
    items,
    getItemsByType,
    isLoading,
  };
}

/** Itens do currículo no idioma pedido (usado pelo hook e pela geração do PDF). */
export function localizeResumeItems(itemsRaw: ResumeItem[], locale: string) {
  return itemsRaw.map(item => {
    // Helper function to get translated content based on locale
    let translatedContent = item.content;
    if (item.content_translations) {
      const raw =
        item.content_translations[locale as "pt-BR" | "en-US"] ||
        item.content_translations["pt-BR"] ||
        item.content;

      // Simple types store translations as plain strings; re-wrap into content shape
      if (
        typeof raw === "string" &&
        item.content &&
        typeof item.content === "object"
      ) {
        if ("text" in item.content) {
          translatedContent = { ...item.content, text: raw };
        } else if ("name" in item.content) {
          translatedContent = { ...item.content, name: raw };
        } else {
          translatedContent = raw;
        }
      } else if (
        typeof raw === "object" &&
        raw !== null &&
        item.content &&
        typeof item.content === "object"
      ) {
        // Complex types (experience, education, volunteer): merge translated fields with original
        // This preserves non-translated fields like company, institution, period, level
        translatedContent = { ...item.content, ...raw };
      } else {
        translatedContent = raw;
      }
    }

    return {
      ...item,
      translatedContent,
    };
  });
}
