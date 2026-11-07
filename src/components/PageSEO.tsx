import { SEO } from "@/components/SEO";
import { useSiteConfig } from "@/hooks/useSiteConfig";
import { useTranslation } from "@/i18n/hooks/useTranslation";

export type SeoPage = "home" | "about" | "resume" | "portfolio" | "blog";

const PATHS: Record<SeoPage, string> = {
  home: "/",
  about: "/sobre",
  resume: "/curriculo",
  portfolio: "/portfolio",
  blog: "/blog",
};

/**
 * SEO padrão de cada página fixa, renderizado pela rota (App.tsx) antes da página. Página que
 * tem o seu próprio <SEO> o sobrepõe (no Helmet, vale o último); página de layout que não tem
 * continua com título, descrição, canonical e hreflang.
 */
export function PageSEO({ page }: { page: SeoPage }) {
  const { t } = useTranslation();
  const config = useSiteConfig();
  if (page === "home") {
    return (
      <SEO
        title={config.seo_home_title || config.site_title}
        description={config.seo_home_description || undefined}
        url="/"
      />
    );
  }
  return <SEO title={t(`seo.${page}Title`)} description={t(`seo.${page}Description`)} url={PATHS[page]} />;
}
