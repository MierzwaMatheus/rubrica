import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { ColorModeToggle } from "@/components/ColorModeToggle";
import { useSidebar } from "@/hooks/useSidebar";
import { usePlugin } from "@/contexts/PluginsContext";
import { useI18n } from "@/i18n/context/I18nContext";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { sidebarRepository } from "@/repositories/instances";
import { GardenMap, StageLegend, isActivePath, useGardenPages, useGardenTexts } from "./GardenShared";

/** Rótulos da navegação no idioma atual (chaves `navigation.*`). */
export function useNavLabels(): Record<string, string> {
  const { t } = useTranslation();
  return {
    home: t("navigation.home"),
    resume: t("navigation.resume"),
    portfolio: t("navigation.portfolio"),
    about: t("navigation.about"),
    blog: t("navigation.blog"),
  };
}

function GardenNav({ onNavigate }: { onNavigate?: () => void }) {
  const [location] = useLocation();
  const pages = useGardenPages();
  const labels = useNavLabels();
  const tx = useGardenTexts();
  return (
    <nav className="gd-nav" aria-label={tx.navLabel}>
      {pages.map((p) => (
        <Link
          key={p.key}
          href={p.href}
          aria-current={isActivePath(location, p.href) ? "page" : undefined}
          onClick={onNavigate}
        >
          {labels[p.key]}
        </Link>
      ))}
    </nav>
  );
}

function LanguageSwitch() {
  const enabled = usePlugin("i18n");
  const { locale, setLocale } = useI18n();
  const tx = useGardenTexts();
  if (!enabled) return null;
  return (
    <div className="gd-lang" role="group" aria-label={tx.languageLabel}>
      <button type="button" aria-pressed={locale === "pt-BR"} onClick={() => setLocale("pt-BR")} lang="pt-BR">
        PT
      </button>
      <button type="button" aria-pressed={locale === "en-US"} onClick={() => setLocale("en-US")} lang="en-US">
        EN
      </button>
    </div>
  );
}

function GardenName() {
  const { contactInfo } = useSidebar(sidebarRepository);
  const tx = useGardenTexts();
  const first = (contactInfo?.name ?? "").trim().split(/\s+/)[0] ?? "";
  return (
    <Link href="/" className="gd-logo">
      {tx.gardenOf(first)}
    </Link>
  );
}

/**
 * Barra lateral fixa (computador) e barra do topo com menu (celular e tablet).
 * As duas ficam no DOM; o CSS do layout mostra uma ou outra.
 */
export function GardenSidebar() {
  const { contactInfo } = useSidebar(sidebarRepository);
  const labels = useNavLabels();
  const tx = useGardenTexts();
  const [location] = useLocation();
  const [open, setOpen] = useState(false);

  // Fecha o menu ao trocar de página.
  useEffect(() => setOpen(false), [location]);

  return (
    <>
      <aside className="gd-side">
        <div>
          <GardenName />
          {contactInfo?.role && <p className="gd-role">{contactInfo.role}</p>}
        </div>
        <GardenNav />
        <StageLegend />
        <GardenMap pageLabels={labels} />
        <div className="gd-tools">
          <LanguageSwitch />
          <ColorModeToggle className="gd-mode" iconSize={16} />
        </div>
      </aside>

      <header className="gd-top">
        <GardenName />
        <div className="gd-top-tools">
          <ColorModeToggle className="gd-mode" iconSize={18} />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button type="button" className="gd-menu" aria-label={tx.menu}>
                <Menu size={20} aria-hidden="true" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="gd-sheet w-72">
              <VisuallyHidden>
                <SheetTitle>{tx.navLabel}</SheetTitle>
              </VisuallyHidden>
              <div>
                <GardenName />
                {contactInfo?.role && <p className="gd-role">{contactInfo.role}</p>}
              </div>
              <GardenNav onNavigate={() => setOpen(false)} />
              <StageLegend />
              <div className="gd-tools">
                <LanguageSwitch />
                <ColorModeToggle className="gd-mode" showLabel iconSize={16} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>
    </>
  );
}
