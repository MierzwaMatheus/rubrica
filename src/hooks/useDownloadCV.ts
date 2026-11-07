import { useQueryClient } from "@tanstack/react-query";
import { useI18n } from "@/i18n/context/I18nContext";
import { useSidebar } from "@/hooks/useSidebar";
import { localizeResumeItems } from "@/hooks/useResume";
import { applyLocale } from "@/hooks/usePortfolio";
import {
  sidebarRepository,
  resumeRepository,
  portfolioRepository,
  homeRepository,
} from "@/repositories/instances";
import { generateCV } from "@/utils/cvPDF";

/**
 * Gera o PDF do currículo no idioma atual. Usado na barra lateral e na página de currículo.
 *
 * Currículo, projetos e o "sobre" só são buscados no clique (do cache, se a página já os
 * carregou): o botão aparece em todas as páginas, e esses dados não precisam ir no HTML de
 * cada uma.
 */
export function useDownloadCV() {
  const { locale } = useI18n();
  const queryClient = useQueryClient();
  const { contactInfo } = useSidebar(sidebarRepository);

  const downloadCV = async () => {
    if (!contactInfo) return;
    const cvLocale = locale === "en-US" ? "en-US" : "pt-BR";
    // A aba abre ainda no clique: aberta depois de esperar os dados, o navegador a bloquearia.
    const target = window.open("", "_blank");
    try {
      const [resumeRaw, projectsRaw, aboutData] = await Promise.all([
        queryClient.fetchQuery({ queryKey: ["resume", "items"], queryFn: () => resumeRepository.list(), staleTime: Infinity }),
        queryClient.fetchQuery({ queryKey: ["portfolio", "projects"], queryFn: () => portfolioRepository.list(), staleTime: Infinity }),
        queryClient.fetchQuery({ queryKey: ["home", "about"], queryFn: () => homeRepository.getAboutData(), staleTime: Infinity }),
      ]);
      const summary = aboutData?.value?.[cvLocale] ?? aboutData?.value?.["pt-BR"] ?? "";
      generateCV(
        contactInfo,
        localizeResumeItems(resumeRaw ?? [], locale),
        (projectsRaw ?? []).map((project) => applyLocale(project, locale)),
        cvLocale,
        summary,
        undefined,
        target,
      );
    } catch (error) {
      target?.close();
      throw error;
    }
  };

  return { downloadCV, canDownload: !!contactInfo };
}
