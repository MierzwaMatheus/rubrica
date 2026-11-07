import { Helmet } from "react-helmet-async";
import { useSiteConfig } from "@/hooks/useSiteConfig";
import { useI18n } from "@/i18n/context/I18nContext";
import { localizedPath } from "@/i18n/localePath";
import { absoluteUrl, shareVariant } from "@/lib/mediaPath";

/**
 * O Helmet só repassa o atributo com o nome do HTML (`hreflang`); o `hrefLang` do React
 * some na renderização do build. O spread contorna a tipagem do React.
 */
const hreflang = (lang: string) => ({ hreflang: lang }) as Record<string, string>;

interface SEOProps {
  title: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  /** Data de publicação (ISO), para artigos. */
  publishedTime?: string;
  /** Dados estruturados (schema.org) da página. */
  jsonLd?: Record<string, unknown>;
}

export function SEO({
  title,
  description,
  image,
  url,
  type = "website",
  publishedTime,
  jsonLd,
}: SEOProps) {
  const config = useSiteConfig();
  const siteTitle = config.site_title;
  const defaultDescription = config.site_description;
  const defaultImage = config.og_image_url;
  const siteUrl = config.site_url;

  const fullTitle = !title || title === siteTitle ? siteTitle : `${title} | ${siteTitle}`;
  const metaDescription = description || defaultDescription;
  // Prévia de link: endereço completo e, para imagens baixadas no build, a variante JPG.
  const metaImage = absoluteUrl(shareVariant(image || defaultImage || ""), siteUrl);
  const { locale } = useI18n();
  const base = siteUrl.replace(/\/+$/, "");
  // `url` é o caminho em pt-BR; cada idioma tem a sua URL (/blog/x e /en/blog/x).
  // Sem `url`, a página é a raiz do site (pt-BR: o próprio site_url).
  const alternates =
    url === undefined
      ? { pt: siteUrl, en: `${base}${localizedPath("/", "en-US")}` }
      : !url.startsWith("http")
        ? {
            pt: `${base}${localizedPath(url, "pt-BR")}`,
            en: `${base}${localizedPath(url, "en-US")}`,
          }
        : null;
  const metaUrl = alternates ? (locale === "en-US" ? alternates.en : alternates.pt) : url!;

  return (
    <Helmet>
      <html lang={locale} />
      {/* Standard metadata */}
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href={metaUrl} />
      {alternates && <link rel="alternate" {...hreflang("pt-BR")} href={alternates.pt} />}
      {alternates && <link rel="alternate" {...hreflang("en")} href={alternates.en} />}
      {alternates && <link rel="alternate" {...hreflang("x-default")} href={alternates.pt} />}

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={metaUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:image" content={metaImage} />
      <meta property="og:site_name" content={config.site_name} />
      <meta property="og:locale" content={locale.replace("-", "_")} />
      <meta property="og:locale:alternate" content={(locale === "en-US" ? "pt-BR" : "en-US").replace("-", "_")} />

      {publishedTime && <meta property="article:published_time" content={publishedTime} />}

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={metaUrl} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={metaDescription} />
      <meta property="twitter:image" content={metaImage} />
      <meta property="twitter:creator" content={config.twitter_handle ? `@${config.twitter_handle}` : ""} />
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            ...jsonLd,
            ...(typeof jsonLd.image === "string" ? { image: absoluteUrl(jsonLd.image, siteUrl) } : {}),
          }).replace(/</g, "\\u003c")}
        </script>
      )}
    </Helmet>
  );
}
