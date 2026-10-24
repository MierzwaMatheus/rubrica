/**
 * Cabeçalho fixo do layout Conversa, como o topo de um aplicativo de mensagens: avatar,
 * nome, status (disponibilidade ou cargo), navegação e os controles de modo e idioma.
 * No celular os links somem daqui: a navegação fica nas respostas rápidas do rodapé.
 */
import { Link, useLocation } from "wouter";
import { ColorModeToggle } from "@/components/ColorModeToggle";
import { usePlugins } from "@/contexts/PluginsContext";
import { useI18n } from "@/i18n/context/I18nContext";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { useHome } from "@/hooks/useHome";
import { useSidebar } from "@/hooks/useSidebar";
import { homeRepository, sidebarRepository } from "@/repositories/instances";
import { Avatar, useChatText } from "./ChatShared";

export function ChatHeader() {
  const [location] = useLocation();
  const { t } = useTranslation();
  const text = useChatText();
  const { locale, setLocale } = useI18n();
  const { isEnabled } = usePlugins();
  const { contactInfo } = useSidebar(sidebarRepository);
  const { contactName, contactRole, availability } = useHome(homeRepository);

  const name = contactInfo?.name || contactName;
  const status = availability?.available ? availability.label || t("home.availability.label") : contactRole;

  const links = [
    { href: "/curriculo", label: t("navigation.resume"), on: isEnabled("resume") },
    { href: "/portfolio", label: t("navigation.portfolio"), on: isEnabled("portfolio") },
    { href: "/sobre", label: t("navigation.about"), on: isEnabled("about") },
    { href: "/blog", label: t("navigation.blog"), on: isEnabled("blog") },
  ].filter((l) => l.on);

  return (
    <header className="ct-h">
      <Link href="/" className="ct-who">
        <span className="ct-sr">{t("navigation.home")}: </span>
        <Avatar name={name} src={contactInfo?.avatar_url || undefined} />
        <span className="ct-id">
          <b>{name}</b>
          {status && (
            <small>
              {availability?.available && <i className="ct-dot" aria-hidden="true" />}
              {status}
            </small>
          )}
        </span>
      </Link>

      <nav className="ct-nav ct-nav-links" aria-label={text.navLabel}>
        {links.map((l) => (
          <Link key={l.href} href={l.href} aria-current={location === l.href ? "page" : undefined}>
            {l.label}
          </Link>
        ))}
      </nav>

      <div className="ct-tools">
        {isEnabled("i18n") && (
          <button
            type="button"
            className="ct-tool ct-lang"
            onClick={() => setLocale(locale === "en-US" ? "pt-BR" : "en-US")}
            aria-label={text.switchLanguage}
            title={text.switchLanguage}
          >
            {text.langShort}
          </button>
        )}
        <ColorModeToggle className="ct-tool" iconSize={17} />
      </div>
    </header>
  );
}
