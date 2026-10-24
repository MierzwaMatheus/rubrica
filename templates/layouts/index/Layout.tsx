import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { MobileLayoutStyles } from "@/components/MobileLayoutStyles";
import { useSidebar } from "@/hooks/useSidebar";
import { useSiteConfig } from "@/hooks/useSiteConfig";
import { sidebarRepository } from "@/repositories/instances";
import { IndexHeader } from "./IndexHeader";
import { IndexStyles, useIndexCopy } from "./IndexShared";

/** Páginas que o próprio template desenha. As demais (post, case, depoimentos…) são
 * compartilhadas por todos os layouts e recebem a margem daqui. */
const TEMPLATE_PAGES = new Set(["/", "/sobre", "/curriculo", "/portfolio", "/blog"]);

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

function IndexFooter() {
  const { contactInfo } = useSidebar(sidebarRepository);
  const siteConfig = useSiteConfig();
  const copy = useIndexCopy();
  const name = contactInfo?.name || siteConfig.author_name || "";
  const email = contactInfo?.show_email ? contactInfo.email : "";

  return (
    <footer className="ix-wrap">
      <div className="ix-f">
        {email ? <a href={`mailto:${email}`}>{email}</a> : <span>{contactInfo?.role ?? ""}</span>}
        <span>
          {copy.archive} · {name}
        </span>
        <span>
          © {new Date().getFullYear()} · {copy.allRights}
        </span>
      </div>
    </footer>
  );
}

export function Layout({ children, className }: LayoutProps) {
  const [location] = useLocation();
  const copy = useIndexCopy();
  const shared = !TEMPLATE_PAGES.has(location);

  return (
    <div className="ix rb-mobile">
      <IndexStyles />
      <MobileLayoutStyles />
      <a href="#conteudo" className="ix-skip">
        {copy.skip}
      </a>
      <IndexHeader />
      <main id="conteudo" tabIndex={-1} className={cn("ix-wrap", shared && "pt-10 pb-16", className)}>
        {children}
      </main>
      <IndexFooter />
    </div>
  );
}
