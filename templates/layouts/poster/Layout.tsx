import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { MobileLayoutStyles } from "@/components/MobileLayoutStyles";
import { useSidebar } from "@/hooks/useSidebar";
import { sidebarRepository } from "@/repositories/instances";
import { PosterNav } from "./PosterNav";
import { PosterStyles, usePosterLabels } from "./PosterShared";

/** Páginas que o próprio template desenha (com margens próprias). As demais (post, case,
 * depoimentos…) são compartilhadas por todos os layouts e recebem a margem daqui. */
const TEMPLATE_PAGES = new Set(["/", "/sobre", "/curriculo", "/portfolio", "/blog"]);

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

/** Rodapé com o fio grosso: nome, e-mail, redes e o ano. */
function PosterFooter() {
  const { contactInfo } = useSidebar(sidebarRepository);
  const labels = usePosterLabels();
  const year = new Date().getFullYear();
  const email = contactInfo?.show_email ? contactInfo.email : "";
  const social = [
    { label: "GitHub", url: contactInfo?.github_url },
    { label: "LinkedIn", url: contactInfo?.linkedin_url },
    { label: "Behance", url: contactInfo?.behance_url },
  ].filter((s): s is { label: string; url: string } => Boolean(s.url));

  return (
    <footer className="poster-foot">
      <div className="poster-wrap poster-foot-in">
        <span>
          © {year} {contactInfo?.name ?? ""}
        </span>
        {email && <a href={`mailto:${email}`}>{email}</a>}
        {social.length > 0 && (
          <nav className="poster-foot-links" aria-label={labels.redes}>
            {social.map((s) => (
              <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer">
                {s.label} ↗
              </a>
            ))}
          </nav>
        )}
        <a href="#topo">{labels.voltarAoTopo} ↑</a>
      </div>
    </footer>
  );
}

export function Layout({ children, className }: LayoutProps) {
  const [location] = useLocation();
  const shared = !TEMPLATE_PAGES.has(location);
  return (
    <div id="topo" className="rb-mobile poster-root">
      <PosterStyles />
      <MobileLayoutStyles />
      <PosterNav />
      <main className={cn("poster-main", shared && "max-w-6xl mx-auto px-4 md:px-8 py-10", className)}>{children}</main>
      <PosterFooter />
    </div>
  );
}
