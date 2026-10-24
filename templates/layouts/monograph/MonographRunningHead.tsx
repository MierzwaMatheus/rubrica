/**
 * Cabeçalho corrido da Monografia: fixo e discreto, como o alto da página de um livro.
 * À esquerda, "Nome · Seção"; à direita, a navegação em versalete e o botão de modo.
 * No celular, a navegação vira um sumário que abre logo abaixo do cabeçalho.
 */
import { useEffect, useId, useState } from "react";
import { Link, useLocation } from "wouter";
import { BookOpen, X } from "lucide-react";
import { ColorModeToggle } from "@/components/ColorModeToggle";
import { usePlugin } from "@/contexts/PluginsContext";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { useSidebar } from "@/hooks/useSidebar";
import { useSiteConfig } from "@/hooks/useSiteConfig";
import { sidebarRepository } from "@/repositories/instances";
import { toRoman, useMonographText } from "./MonographShared";

interface NavItem {
  href: string;
  label: string;
}

function useNavItems(): NavItem[] {
  const { t } = useTranslation();
  const resume = usePlugin("resume");
  const portfolio = usePlugin("portfolio");
  const about = usePlugin("about");
  const blog = usePlugin("blog");
  return [
    { href: "/", label: t("navigation.home"), on: true },
    { href: "/curriculo", label: t("navigation.resume"), on: resume },
    { href: "/portfolio", label: t("navigation.portfolio"), on: portfolio },
    { href: "/sobre", label: t("navigation.about"), on: about },
    { href: "/blog", label: t("navigation.blog"), on: blog },
  ]
    .filter((i) => i.on)
    .map(({ href, label }) => ({ href, label }));
}

const isActive = (href: string, location: string) =>
  href === "/" ? location === "/" : location === href || location.startsWith(`${href}/`);

export function MonographRunningHead() {
  const [location] = useLocation();
  const { t } = useTranslation();
  const tx = useMonographText();
  const items = useNavItems();
  const { contactInfo } = useSidebar(sidebarRepository);
  const siteConfig = useSiteConfig();
  const [open, setOpen] = useState(false);
  const panelId = useId();

  const name = contactInfo?.name || siteConfig.author_name || "";
  const current = items.find((i) => isActive(i.href, location));
  const section =
    current?.label ?? (location.startsWith("/depoimentos") ? t("testimonials.title") : "");

  // Fecha o sumário ao trocar de página e com Esc.
  useEffect(() => setOpen(false), [location]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="mn-run">
      <div className="mn-run-in">
        <p className="mn-run-id">
          <Link href="/">{name}</Link>
          {section ? (
            <>
              <span aria-hidden="true">·</span>
              <span className="mn-run-sec">{section}</span>
            </>
          ) : null}
        </p>
        <div className="mn-run-tools">
          <nav className="mn-run-nav" aria-label={tx.contents}>
            <ul>
              {items.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} aria-current={isActive(item.href, location) ? "page" : undefined}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <ColorModeToggle className="mn-run-mode" iconSize={15} />
          <button
            type="button"
            className="mn-run-btn"
            aria-expanded={open}
            aria-controls={panelId}
            aria-label={open ? tx.closeContents : tx.openContents}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={16} aria-hidden="true" /> : <BookOpen size={16} aria-hidden="true" />}
            <span>{tx.contents}</span>
          </button>
        </div>
      </div>
      {open ? (
        <nav id={panelId} className="mn-toc" aria-label={tx.contents}>
          <ol>
            {items.map((item, i) => (
              <li key={item.href}>
                <Link href={item.href} aria-current={isActive(item.href, location) ? "page" : undefined}>
                  <span className="mn-ld">
                    <span className="mn-ld-t">
                      <em>{toRoman(i + 1)}.</em>
                      {item.label}
                    </span>
                    <span className="mn-ld-dots" aria-hidden="true" />
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </nav>
      ) : null}
    </header>
  );
}
