/**
 * Monografia — o site como livro. O Layout dá a moldura comum: folha de estilo, cabeçalho
 * corrido fixo, link de pular para o conteúdo, rodapé com fólio e a margem das páginas do
 * app que o layout não desenha (post, case, depoimentos…).
 */
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/context/I18nContext";
import { useSidebar } from "@/hooks/useSidebar";
import { useSiteConfig } from "@/hooks/useSiteConfig";
import { sidebarRepository } from "@/repositories/instances";
import { MonographRunningHead } from "./MonographRunningHead";
import { MonographStyles, useMonographText } from "./MonographShared";

/** Páginas que o próprio template desenha (com margens próprias). As demais (post, case,
 * depoimentos…) são compartilhadas por todos os layouts e recebem a margem daqui. */
const TEMPLATE_PAGES = new Set(["/", "/sobre", "/curriculo", "/portfolio", "/blog"]);

/**
 * Famílias do CLI que têm itálico de verdade no Google Fonts. O CLI carrega só os romanos;
 * como o livro vive de itálico (subtítulos, notas, citações), o Layout pede o itálico da
 * fonte principal. Fontes fora da lista ficam com o itálico sintetizado pelo navegador.
 */
const FAMILIES_WITH_ITALIC = new Set([
  "Fraunces",
  "Source Serif 4",
  "Inter",
  "Chakra Petch",
  "Playfair Display",
  "DM Sans",
  "Bodoni Moda",
  "IBM Plex Serif",
  "Archivo",
  "Instrument Sans",
  "IBM Plex Sans",
  "JetBrains Mono",
]);

/** Link do Google Fonts com o itálico da fonte principal (`--font-sans`), quando existe. */
function useItalicStylesheet(): string | null {
  const [href, setHref] = useState<string | null>(null);
  useEffect(() => {
    const raw = getComputedStyle(document.documentElement).getPropertyValue("--font-sans");
    const family = raw.split(",")[0]?.trim().replace(/^["']|["']$/g, "") ?? "";
    if (!FAMILIES_WITH_ITALIC.has(family)) return;
    setHref(
      `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, "+")}:ital,wght@1,400;1,600&display=swap`,
    );
  }, []);
  return href;
}

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function Layout({ children, className }: LayoutProps) {
  const [location] = useLocation();
  const { locale } = useI18n();
  const tx = useMonographText();
  const { contactInfo } = useSidebar(sidebarRepository);
  const siteConfig = useSiteConfig();
  const italicHref = useItalicStylesheet();
  const shared = !TEMPLATE_PAGES.has(location);
  const name = contactInfo?.name || siteConfig.author_name || "";

  return (
    <div className="mn-root" lang={locale}>
      <MonographStyles />
      {italicHref ? (
        <Helmet>
          <link rel="stylesheet" href={italicHref} />
        </Helmet>
      ) : null}
      <a href="#conteudo" className="mn-skip">
        {tx.skip}
      </a>
      <MonographRunningHead />
      <main id="conteudo" tabIndex={-1} className={cn(shared && "mn-shared", className)}>
        {children}
      </main>
      <footer className="mn-foot">
        <b>{tx.end}</b>
        {name ? `${name} · ` : ""}
        {new Date().getFullYear()}
      </footer>
    </div>
  );
}
