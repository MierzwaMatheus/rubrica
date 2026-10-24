import { Link, useLocation } from "wouter";
import { ColorModeToggle } from "@/components/ColorModeToggle";
import { usePlugins } from "@/contexts/PluginsContext";
import { useHome } from "@/hooks/useHome";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { homeRepository } from "@/repositories/instances";
import type { PluginId } from "../../convex/pluginRegistry";
import { useBlueprintLabels, useOwnerName } from "./BlueprintShared";

const NAV_ITEMS: Array<{ key: string; href: string; pluginId?: PluginId }> = [
  { key: "home", href: "/" },
  { key: "about", href: "/sobre", pluginId: "about" },
  { key: "resume", href: "/curriculo", pluginId: "resume" },
  { key: "portfolio", href: "/portfolio", pluginId: "portfolio" },
  { key: "blog", href: "/blog", pluginId: "blog" },
];

/**
 * Cabeçalho fixo do Blueprint: nome, especialidade em mono e a navegação como códigos
 * de folha (A0 INÍCIO, A1 SOBRE…). Itens de plugins desligados somem e os códigos
 * seguem em sequência.
 */
export function BlueprintHeader() {
  const [location] = useLocation();
  const { t } = useTranslation();
  const { isEnabled } = usePlugins();
  const { contactRole } = useHome(homeRepository);
  const name = useOwnerName();
  const L = useBlueprintLabels();

  const items = NAV_ITEMS.filter((item) => !item.pluginId || isEnabled(item.pluginId));

  return (
    <header className="bp-header">
      <div className="bp-header-id">
        <Link href="/" className="bp-header-name">
          {name || "Rubrica"}
        </Link>
        {contactRole && <span className="bp-header-role">{contactRole}</span>}
      </div>
      <nav className="bp-nav" aria-label={L.nav}>
        <ul>
          {items.map((item, i) => {
            const active = item.href === "/" ? location === "/" : location === item.href || location.startsWith(`${item.href}/`);
            return (
              <li key={item.key}>
                <Link href={item.href} aria-current={active ? "page" : undefined}>
                  <b aria-hidden="true">A{i}</b>
                  {t(`navigation.${item.key}`)}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <ColorModeToggle className="bp-toggle" iconSize={15} />
    </header>
  );
}
