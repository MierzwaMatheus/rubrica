import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { ColorModeToggle } from "@/components/ColorModeToggle";
import { usePlugins } from "@/contexts/PluginsContext";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { useSidebar } from "@/hooks/useSidebar";
import { useSiteConfig } from "@/hooks/useSiteConfig";
import { sidebarRepository } from "@/repositories/instances";
import type { PluginId } from "../../convex/pluginRegistry";
import { useIndexCopy } from "./IndexShared";

const NAV: Array<{ key: string; href: string; pluginId?: PluginId }> = [
  { key: "home", href: "/" },
  { key: "resume", href: "/curriculo", pluginId: "resume" },
  { key: "portfolio", href: "/portfolio", pluginId: "portfolio" },
  { key: "about", href: "/sobre", pluginId: "about" },
  { key: "blog", href: "/blog", pluginId: "blog" },
];

const isActive = (location: string, href: string) =>
  href === "/" ? location === "/" : location === href || location.startsWith(`${href}/`);

/**
 * Cabeçalho fixo em 3 colunas: nome | cargo e linha de catálogo | navegação + modo de cor.
 * No celular o nome e os controles ficam na primeira linha e a navegação abre num menu.
 */
export function IndexHeader() {
  const [location] = useLocation();
  const { t } = useTranslation();
  const copy = useIndexCopy();
  const { isEnabled } = usePlugins();
  const { contactInfo } = useSidebar(sidebarRepository);
  const siteConfig = useSiteConfig();
  const [open, setOpen] = useState(false);

  // Fecha o menu do celular a cada troca de página.
  useEffect(() => setOpen(false), [location]);

  const name = contactInfo?.name || siteConfig.author_name || siteConfig.site_name || "";
  const role = contactInfo?.role ?? "";
  const items = NAV.filter((item) => !item.pluginId || isEnabled(item.pluginId));

  return (
    <header className="ix-h">
      <div className="ix-wrap ix-h-in">
        <Link href="/" className="ix-h-name">
          {name}
        </Link>
        <p className="ix-h-role">
          {role}
          {role && <br />}
          <span>
            {copy.archive}, {new Date().getFullYear()}
          </span>
        </p>
        <nav id="ix-nav" className="ix-h-nav" aria-label={copy.navLabel} data-open={open ? "" : undefined}>
          <ul>
            {items.map((item) => (
              <li key={item.key}>
                <Link href={item.href} aria-current={isActive(location, item.href) ? "page" : undefined}>
                  {t(`navigation.${item.key}`)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="ix-h-tools">
          <ColorModeToggle iconSize={15} />
          <button
            type="button"
            className="ix-h-menu"
            aria-expanded={open}
            aria-controls="ix-nav"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? copy.closeMenu : copy.menu}
          </button>
        </div>
      </div>
    </header>
  );
}
