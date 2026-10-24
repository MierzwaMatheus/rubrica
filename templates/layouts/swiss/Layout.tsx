import { SwissNav } from "./Sidebar";
import { cn } from "@/lib/utils";
import { MobileLayoutStyles } from "@/components/MobileLayoutStyles";
import { useLocation } from "wouter";

/** Páginas que o próprio template desenha (com margens próprias). As demais (post, case,
 * depoimentos…) são compartilhadas por todos os layouts e recebem a margem daqui. */
const TEMPLATE_PAGES = new Set(["/", "/sobre", "/curriculo", "/portfolio", "/blog"]);


interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function Layout({ children, className }: LayoutProps) {
  const [location] = useLocation();
  const shared = !TEMPLATE_PAGES.has(location);
  return (
    <div className="rb-mobile min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col font-sans">
      <MobileLayoutStyles />
      {/* A folha para de esticar em 1600px e, além disso, ganha bordas laterais no mesmo traço das linhas do layout. */}
      <div className="flex-1 flex flex-col w-full max-w-[1600px] mx-auto min-[1601px]:border-x min-[1601px]:border-[var(--text)]">
        <SwissNav />
        <main className={cn("flex-1 w-full", shared && "max-w-6xl mx-auto px-4 md:px-8 py-8", className)}>
          {children}
        </main>
      </div>
    </div>
  );
}
