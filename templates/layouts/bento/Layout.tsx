import { FloatingDock } from "./FloatingDock";
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
    <div className="rb-mobile min-h-screen bg-[var(--bg)] text-[var(--text)]" style={{ fontFamily: "var(--font-sans)" }}>
      <MobileLayoutStyles />
      <main className={cn("pb-28", shared && "max-w-6xl mx-auto px-4 md:px-8 pt-10", className)}>
        {children}
      </main>
      <FloatingDock />
    </div>
  );
}
