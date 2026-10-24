import { Helmet } from "react-helmet-async";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { MobileLayoutStyles } from "@/components/MobileLayoutStyles";
import { ZineFooter, ZineNav } from "./ZineNav";
import { ZineStyles, useZineCopy } from "./ZineShared";

/** Páginas que o próprio template desenha (com margens próprias). As demais (post, case,
 * depoimentos…) são compartilhadas por todos os layouts e recebem a margem daqui. */
const TEMPLATE_PAGES = new Set(["/", "/sobre", "/curriculo", "/portfolio", "/blog"]);

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function Layout({ children, className }: LayoutProps) {
  const [location] = useLocation();
  const copy = useZineCopy();
  const shared = !TEMPLATE_PAGES.has(location);

  return (
    <div
      className="rb-mobile zn-root min-h-screen"
      style={{ background: "var(--bg)", color: "var(--text)", fontFamily: "var(--font-sans)" }}
    >
      {/* Letra à mão do Zine. Sem ela, a pilha de --zine-hand cai em fontes cursivas do sistema. */}
      <Helmet>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Caveat:wght@500;700&display=swap" />
      </Helmet>
      <MobileLayoutStyles />
      <ZineStyles />
      <a href="#conteudo" className="zn-skip">
        {copy.skip}
      </a>
      <ZineNav />
      <main
        id="conteudo"
        tabIndex={-1}
        className={cn(shared && "max-w-6xl mx-auto px-4 md:px-8 py-8", className)}
        style={{ outline: "none" }}
      >
        {children}
      </main>
      <ZineFooter />
    </div>
  );
}
