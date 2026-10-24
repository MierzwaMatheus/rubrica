import { useLocation } from "wouter";
import { MobileLayoutStyles } from "@/components/MobileLayoutStyles";
import { cn } from "@/lib/utils";
import { GardenSidebar, useNavLabels } from "./GardenSidebar";
import { GardenMap, GardenStyles, StageLegend, useGardenTexts } from "./GardenShared";

/** Páginas que o próprio template desenha (com margens próprias). As demais (post, case,
 * depoimentos…) são compartilhadas por todos os layouts e recebem a margem daqui. */
const TEMPLATE_PAGES = new Set(["/", "/sobre", "/curriculo", "/portfolio", "/blog"]);

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Jardim Digital: barra lateral fixa com o nome do jardim, a navegação, a legenda dos
 * estágios e o mapa de notas; o conteúdo fica numa coluna de leitura. No celular, a
 * barra vira um topo com menu e o mapa desce para o fim da página.
 */
export function Layout({ children, className }: LayoutProps) {
  const [location] = useLocation();
  const shared = !TEMPLATE_PAGES.has(location);
  const tx = useGardenTexts();
  const labels = useNavLabels();

  return (
    <div className="rb-mobile gd-shell">
      <GardenStyles />
      <MobileLayoutStyles />
      <a href="#conteudo" className="gd-skip">
        {tx.skip}
      </a>
      <GardenSidebar />
      <div className="gd-body">
        <main id="conteudo" className={cn(shared ? "gd-shared" : "gd-main", className)}>
          {children}
        </main>
        <aside className="gd-mapfoot" aria-label={tx.map}>
          <GardenMap pageLabels={labels} />
          <StageLegend />
        </aside>
      </div>
    </div>
  );
}
