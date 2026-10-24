import { FloatingDock } from "./FloatingDock";
import { cn } from "@/lib/utils";
import { MobileLayoutStyles } from "@/components/MobileLayoutStyles";
import { useLocation } from "wouter";

/** Páginas que o próprio template desenha (com margens próprias). As demais (post, case,
 * depoimentos…) são compartilhadas por todos os layouts e recebem a margem daqui. */
const TEMPLATE_PAGES = new Set(["/", "/sobre", "/curriculo", "/portfolio", "/blog"]);

/**
 * Texto sobre a cor de destaque. O acento é escuro em alguns esquemas e claro em outros
 * (no modo escuro, quase sempre claro): esta tinta vira preto ou branco conforme a
 * luminosidade do próprio --accent, então continua legível nos dois modos.
 */
const ON_ACCENT = "oklch(from var(--accent) calc((0.62 - l) * 100) 0 0)";


interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function Layout({ children, className }: LayoutProps) {
  const [location] = useLocation();
  const shared = !TEMPLATE_PAGES.has(location);
  return (
    <div className="rb-mobile min-h-screen bg-[var(--bg)] text-[var(--text)]" style={{ fontFamily: "var(--font-sans)", "--bento-on-accent": ON_ACCENT } as React.CSSProperties}>
      <MobileLayoutStyles />
      {/* Em telas muito largas o grid para de esticar e fica centralizado. */}
      <main className={cn("pb-28", shared ? "max-w-6xl mx-auto px-4 md:px-8 pt-10" : "max-w-[1600px] mx-auto", className)}>
        {children}
      </main>
      <FloatingDock />
    </div>
  );
}
