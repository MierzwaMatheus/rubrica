import { Link, useLocation } from "wouter";
import { Github, Linkedin, Mail } from "lucide-react";
import { ColorModeToggle } from "@/components/ColorModeToggle";
import { usePlugins } from "@/contexts/PluginsContext";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { useSidebar } from "@/hooks/useSidebar";
import { sidebarRepository } from "@/repositories/instances";
import type { PluginId } from "../../convex/pluginRegistry";
import { firstName, tilt, useZineCopy } from "./ZineShared";

const NAV_ITEMS: Array<{ key: string; href: string; pluginId?: PluginId }> = [
  { key: "home", href: "/" },
  { key: "resume", href: "/curriculo", pluginId: "resume" },
  { key: "portfolio", href: "/portfolio", pluginId: "portfolio" },
  { key: "about", href: "/sobre", pluginId: "about" },
  { key: "blog", href: "/blog", pluginId: "blog" },
];

/** Navegação: uma tira de fita adesiva com os links em letra à mão e o botão de modo. */
export function ZineNav() {
  const [location] = useLocation();
  const { isEnabled } = usePlugins();
  const { t } = useTranslation();
  const copy = useZineCopy();
  const { contactInfo } = useSidebar(sidebarRepository);
  const items = NAV_ITEMS.filter((item) => !item.pluginId || isEnabled(item.pluginId));

  return (
    <header className="zn-header">
      <div className="zn-wrap">
        <nav aria-label={copy.nav} className="zn-strip-nav zn-tilt" style={tilt(-1)}>
          <ul>
            {items.map((item) => {
              const active = item.href === "/" ? location === "/" : location.startsWith(item.href);
              return (
                <li key={item.key}>
                  <Link href={item.href} aria-current={active ? "page" : undefined}>
                    {t(`navigation.${item.key}`)}
                  </Link>
                </li>
              );
            })}
          </ul>
          <ColorModeToggle className="zn-toggle" iconSize={18} />
        </nav>
        {contactInfo?.name && (
          <Link href="/" className="zn-brand">
            {contactInfo.name}
          </Link>
        )}
      </div>
    </header>
  );
}

/** Rodapé: assinatura à mão e os contatos que a pessoa deixou visíveis. */
export function ZineFooter() {
  const copy = useZineCopy();
  const { contactInfo } = useSidebar(sidebarRepository);
  const name = contactInfo?.name ?? "";
  const email = contactInfo?.show_email ? contactInfo.email : "";

  return (
    <footer className="zn-footer">
      <div className="zn-wrap">
        <p>
          {copy.madeBy} {firstName(name) || name} · {new Date().getFullYear()}
        </p>
        <ul>
          {email && (
            <li>
              <a href={`mailto:${email}`}>
                <Mail size={15} aria-hidden="true" /> {email}
              </a>
            </li>
          )}
          {contactInfo?.github_url && (
            <li>
              <a href={contactInfo.github_url} target="_blank" rel="noopener noreferrer">
                <Github size={15} aria-hidden="true" /> GitHub
              </a>
            </li>
          )}
          {contactInfo?.linkedin_url && (
            <li>
              <a href={contactInfo.linkedin_url} target="_blank" rel="noopener noreferrer">
                <Linkedin size={15} aria-hidden="true" /> LinkedIn
              </a>
            </li>
          )}
        </ul>
      </div>
    </footer>
  );
}
