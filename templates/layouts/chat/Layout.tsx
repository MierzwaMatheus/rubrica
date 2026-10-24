/**
 * Layout Conversa: o site inteiro é uma conversa com a pessoa dona do portfólio.
 * Cabeçalho fixo no topo, a conversa no meio e, fixas embaixo, as respostas rápidas,
 * que são a navegação de verdade (links para as páginas e o botão de contato).
 *
 * O rodapé usa `position: sticky`: enquanto a página rola ele fica preso embaixo e, no fim,
 * volta para o lugar dele depois do conteúdo — o fim da conversa nunca fica coberto.
 */
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { MobileLayoutStyles } from "@/components/MobileLayoutStyles";
import { useContactWizard } from "@/contexts/ContactWizardContext";
import { usePlugins } from "@/contexts/PluginsContext";
import { useHome } from "@/hooks/useHome";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { homeRepository } from "@/repositories/instances";
import { ChatHeader } from "./ChatHeader";
import { ChatStyles, useChatText } from "./ChatShared";

/** Páginas que o próprio template desenha. As demais (post, case, depoimentos…) são do app
 * e recebem daqui a moldura com margem. */
const TEMPLATE_PAGES = new Set(["/", "/sobre", "/curriculo", "/portfolio", "/blog"]);

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

function QuickReplies() {
  const [location] = useLocation();
  const { t } = useTranslation();
  const text = useChatText();
  const { isEnabled } = usePlugins();
  const { contactWizardEnabled } = useHome(homeRepository);
  const { openWizard } = useContactWizard();
  const canContact = contactWizardEnabled && isEnabled("contact-wizard");

  const replies = [
    { href: "/", label: text.qrHome, on: true },
    { href: "/portfolio", label: text.qrPortfolio, on: isEnabled("portfolio") },
    { href: "/curriculo", label: text.qrResume, on: isEnabled("resume") },
    { href: "/sobre", label: text.qrAbout, on: isEnabled("about") },
    { href: "/blog", label: text.qrBlog, on: isEnabled("blog") },
  ].filter((r) => r.on && r.href !== location);

  return (
    <footer className="ct-f">
      <nav className="ct-f-in" aria-label={text.quickReplies}>
        <span className="ct-f-lb" aria-hidden="true">
          {text.quickReplies}
        </span>
        {/* "Fale comigo" vem primeiro: no celular a lista rola de lado e a ação principal fica sempre à vista. */}
        <ul className="ct-qr">
          {canContact && (
            <li>
              <button
                type="button"
                className="ct-pill pri"
                onClick={() => openWizard({ sourceContext: "chat-quick-reply" })}
                data-umami-event="chat-quick-reply-contato"
              >
                {t("home.hero.ctaContact")}
              </button>
            </li>
          )}
          {replies.map((r) => (
            <li key={r.href}>
              <Link href={r.href} className="ct-pill">
                {r.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </footer>
  );
}

export function Layout({ children, className }: LayoutProps) {
  const [location] = useLocation();
  const shared = !TEMPLATE_PAGES.has(location);
  return (
    <div className="rb-mobile ct-root">
      <MobileLayoutStyles />
      <ChatStyles />
      <ChatHeader />
      <main className={cn("ct-main", shared && "ct-shared", className)}>{children}</main>
      <QuickReplies />
    </div>
  );
}
