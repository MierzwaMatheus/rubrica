import { useQuery } from "@tanstack/react-query";
import { useI18n } from "@/i18n/context/I18nContext";
import { useSidebar } from "@/hooks/useSidebar";
import { useResume } from "@/hooks/useResume";
import { usePortfolio } from "@/hooks/usePortfolio";
import {
  sidebarRepository,
  resumeRepository,
  portfolioRepository,
  homeRepository,
} from "@/repositories/instances";
import { generateCV } from "@/utils/cvPDF";

/** Gera o PDF do currículo no idioma atual. Usado na barra lateral e na página de currículo. */
export function useDownloadCV() {
  const { locale } = useI18n();
  const { contactInfo } = useSidebar(sidebarRepository);
  const { items: resumeItems } = useResume(resumeRepository);
  const { projects } = usePortfolio(portfolioRepository);
  const { data: aboutData } = useQuery({
    queryKey: ["home", "about"],
    queryFn: () => homeRepository.getAboutData(),
    staleTime: Infinity,
  });

  const downloadCV = () => {
    if (!contactInfo) return;
    const cvLocale = locale === "en-US" ? "en-US" : "pt-BR";
    const summary = aboutData?.value?.[cvLocale] ?? aboutData?.value?.["pt-BR"] ?? "";
    generateCV(contactInfo, resumeItems, projects, cvLocale, summary);
  };

  return { downloadCV, canDownload: !!contactInfo };
}
