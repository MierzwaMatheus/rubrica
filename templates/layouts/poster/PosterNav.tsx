import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X } from "lucide-react";
import { ColorModeToggle } from "@/components/ColorModeToggle";
import { usePlugins } from "@/contexts/PluginsContext";
import { useSidebar } from "@/hooks/useSidebar";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { sidebarRepository } from "@/repositories/instances";
import type { PluginId } from "../../convex/pluginRegistry";
import { usePosterLabels } from "./PosterShared";

const NAV_ITEMS: Array<{ key: string; href: string; pluginId?: PluginId }> = [
  { key: "home", href: "/" },
  { key: "resume", href: "/curriculo", pluginId: "resume" },
  { key: "portfolio", href: "/portfolio", pluginId: "portfolio" },
  { key: "about", href: "/sobre", pluginId: "about" },
  { key: "blog", href: "/blog", pluginId: "blog" },
];

const isActive = (location: string, href: string) =>
  location === href || (href !== "/" && location.startsWith(`${href}/`));

/** Barra fixa do topo: nome em caixa alta à esquerda, navegação e modo de cor à direita. */
export function PosterNav() {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const labels = usePosterLabels();
  const { isEnabled } = usePlugins();
  const { contactInfo } = useSidebar(sidebarRepository);
  const items = NAV_ITEMS.filter((item) => !item.pluginId || isEnabled(item.pluginId));

  // Fecha o menu do celular ao trocar de página e com Esc.
  useEffect(() => setOpen(false), [location]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const links = (className?: string) =>
    items.map((item) => (
      <Link
        key={item.key}
        href={item.href}
        className={className}
        aria-current={isActive(location, item.href) ? "page" : undefined}
      >
        {t(`navigation.${item.key}`)}
      </Link>
    ));

  return (
    <header className="poster-bar">
      <div className="poster-wrap poster-bar-in">
        <Link href="/" className="poster-brand">
          {contactInfo?.name || "Rubrica"}
        </Link>
        <div className="poster-bar-tools">
          <nav className="poster-links" aria-label={labels.navPrincipal}>
            {links("poster-link")}
          </nav>
          <ColorModeToggle className="poster-toggle" />
          <button
            type="button"
            className="poster-menu-btn"
            aria-expanded={open}
            aria-controls="poster-menu"
            aria-label={open ? labels.fecharMenu : labels.abrirMenu}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={18} aria-hidden="true" /> : <Menu size={18} aria-hidden="true" />}
            <span aria-hidden="true">Menu</span>
          </button>
        </div>
      </div>
      {open && (
        <nav id="poster-menu" className="poster-wrap poster-drawer" aria-label={labels.navPrincipal}>
          {links()}
        </nav>
      )}
    </header>
  );
}
