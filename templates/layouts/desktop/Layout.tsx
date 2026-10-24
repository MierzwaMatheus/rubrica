import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { useContactWizard } from "@/contexts/ContactWizardContext";
import { usePlugin } from "@/contexts/PluginsContext";
import { useHome } from "@/hooks/useHome";
import { homeRepository } from "@/repositories/instances";
import { DesktopMenuBar } from "./DesktopMenuBar";
import {
  DESKTOP_CSS,
  DeskIcon,
  ICON_COLORS,
  Window,
  WindowStack,
  isActivePath,
  useDesktopCopy,
  useDesktopNav,
  type DesktopCopy,
} from "./DesktopShared";

/** Páginas que o próprio template desenha. As demais (post, case, depoimentos…) são do app
 * e entram numa janela genérica, com a margem daqui. */
const TEMPLATE_PAGES = new Set(["/", "/sobre", "/curriculo", "/portfolio", "/blog"]);

function sharedTitle(location: string, copy: DesktopCopy): string {
  if (location.startsWith("/portfolio/")) return copy.shared.case;
  if (location.startsWith("/blog/")) return copy.shared.post;
  if (location.startsWith("/depoimentos")) return copy.shared.testimonials;
  if (location.startsWith("/proposta")) return copy.shared.proposal;
  if (location.startsWith("/checkout") || location.startsWith("/payment-success")) return copy.shared.checkout;
  return copy.shared.other;
}

/** Ícones da área de trabalho: atalhos reais para as páginas e para o contato. */
function DesktopIcons() {
  const [location] = useLocation();
  const { t } = useTranslation();
  const copy = useDesktopCopy();
  const nav = useDesktopNav().filter((item) => item.key !== "home");
  const { openWizard } = useContactWizard();
  const { contactWizardEnabled } = useHome(homeRepository);
  const wizardOn = usePlugin("contact-wizard") && contactWizardEnabled;

  const label: Record<string, string> = {
    resume: copy.resumeFile,
    about: copy.aboutFile,
  };
  let folder = 0;

  return (
    <nav aria-label={copy.desktop} data-desktop-icons>
      <ul className="dk-icons">
        {nav.map((item) => {
          const isDoc = item.key === "resume" || item.key === "about";
          const color = isDoc ? undefined : ICON_COLORS[folder++ % ICON_COLORS.length];
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className="dk-ic"
                aria-current={isActivePath(location, item.href) ? "page" : undefined}
              >
                <DeskIcon kind={isDoc ? "doc" : "folder"} color={color} />
                <span className="dk-ic-label">{label[item.key] ?? t(`navigation.${item.key}`)}</span>
              </Link>
            </li>
          );
        })}
        {wizardOn && (
          <li>
            <button
              type="button"
              className="dk-ic"
              onClick={() => openWizard({ sourceContext: "desktop-icon" })}
              data-umami-event="desktop-icone-contato"
            >
              <DeskIcon kind="folder" color={ICON_COLORS[folder % ICON_COLORS.length]} />
              <span className="dk-ic-label">{copy.contact}</span>
            </button>
          </li>
        )}
        <li aria-hidden="true">
          <span className="dk-ic dk-ic-static">
            <DeskIcon kind="trash" />
            <span className="dk-ic-label">{copy.trash}</span>
          </span>
        </li>
      </ul>
    </nav>
  );
}

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function Layout({ children, className }: LayoutProps) {
  const [location] = useLocation();
  const copy = useDesktopCopy();
  const shared = !TEMPLATE_PAGES.has(location);

  return (
    <div className="dk">
      <style>{DESKTOP_CSS}</style>
      <DesktopMenuBar />
      <div className="dk-desk">
        <DesktopIcons />
        <main className={cn("min-w-0", className)}>
          {shared ? (
            <WindowStack>
              <Window title={sharedTitle(location, copy)} titleAs="div" active>
                <div className="dk-shared">{children}</div>
              </Window>
            </WindowStack>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}
