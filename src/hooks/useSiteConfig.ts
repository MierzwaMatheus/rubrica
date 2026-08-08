import { useQuery } from "@tanstack/react-query";
import { rubricalConfig } from "../../rubrica.config";
import { siteConfigRepository } from "@/repositories/instances";

export type SiteConfig = {
  site_title: string;
  site_description: string;
  site_url: string;
  site_name: string;
  og_image_url: string;
  twitter_handle: string;
  author_name: string;
  author_email: string;
  rss_title: string;
  rss_description: string;
  seo_home_title: string;
  seo_home_description: string;
  theme_background: string;
  theme_foreground: string;
  theme_primary: string;
  theme_accent: string;
  theme_accent_color: string;
  theme_accent_hsl: string;
  theme_font_sans: string;
  theme_font_mono: string;
  keywords: string[];
  lang: string;
};

function buildFallback(): SiteConfig {
  return {
    site_title: rubricalConfig.siteName,
    site_description: rubricalConfig.siteDescription,
    site_url: rubricalConfig.siteUrl,
    site_name: rubricalConfig.siteName,
    og_image_url: rubricalConfig.ogImageUrl,
    twitter_handle: rubricalConfig.twitterHandle,
    author_name: rubricalConfig.authorName,
    author_email: rubricalConfig.authorEmail,
    rss_title: rubricalConfig.rssTitle,
    rss_description: rubricalConfig.rssDescription,
    seo_home_title: rubricalConfig.seoHomeTitle,
    seo_home_description: rubricalConfig.seoHomeDescription,
    theme_background: "#09090b",
    theme_foreground: "#fafafa",
    theme_primary: "#6366f1",
    theme_accent: rubricalConfig.accentColor,
    theme_accent_color: rubricalConfig.accentColor,
    theme_accent_hsl: "",
    theme_font_sans: rubricalConfig.fontSans,
    theme_font_mono: rubricalConfig.fontMono,
    keywords: [],
    lang: rubricalConfig.lang,
  };
}

export function useSiteConfig(): SiteConfig & { isLoading: boolean } {
  const { data, isLoading } = useQuery({
    queryKey: ["siteConfig"],
    queryFn: () => siteConfigRepository.getPublic(),
    staleTime: Infinity,
  });

  const fallback = buildFallback();

  if (isLoading || !data) {
    return { ...fallback, isLoading: true };
  }

  const convexMap = Object.fromEntries(data.map((d) => [d.key, d.value]));
  return { ...fallback, ...convexMap, isLoading: false };
}
