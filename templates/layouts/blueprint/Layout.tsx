import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { MobileLayoutStyles } from "@/components/MobileLayoutStyles";
import { BlueprintHeader } from "./BlueprintHeader";
import { BlueprintStyles, drawnBy, stampDate, useBlueprintLabels, useOwnerName } from "./BlueprintShared";

/** Páginas que o próprio template desenha (com margens próprias). As demais (post, case,
 * depoimentos…) são compartilhadas por todos os layouts e recebem daqui uma folha simples
 * como moldura, sobre o mesmo papel quadriculado. */
const TEMPLATE_PAGES = new Set(["/", "/sobre", "/curriculo", "/portfolio", "/blog"]);

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function Layout({ children, className }: LayoutProps) {
  const [location] = useLocation();
  const shared = !TEMPLATE_PAGES.has(location);
  const L = useBlueprintLabels();
  const owner = useOwnerName();

  return (
    <div className="bp-root rb-mobile">
      <BlueprintStyles />
      <MobileLayoutStyles />
      <a href="#conteudo" className="bp-skip">
        {L.skip}
      </a>
      <BlueprintHeader />
      <main id="conteudo" className={cn(shared ? "bp-shared" : "bp-main", className)}>
        {children}
      </main>
      <footer className="bp-footer">
        <span>
          {L.end} · {drawnBy(owner) || "—"} · {stampDate()}
        </span>
        <span>{L.madeWith}</span>
      </footer>
    </div>
  );
}
