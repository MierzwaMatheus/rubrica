import { useEffect, type ReactNode } from "react";
import { PresenceContext } from "framer-motion";
import { isHydratingPrerender } from "@/ssr/hydration";

/**
 * Primeira visita sem esperar as animações de entrada.
 *
 * Os componentes animados começam no estado `initial` (ex.: opacity 0) e só aparecem quando o
 * JavaScript carrega e anima: na página pré-renderizada, o título e o conteúdo ficavam
 * invisíveis até lá (o LCP da home chegava a 4 s no celular). O framer-motion lê
 * `PresenceContext.initial` uma vez, ao criar cada componente: com `false`, ele nasce no estado
 * final. Este contexto vale no build e na hidratação; depois dela, `initial` volta ao normal, e
 * as páginas abertas pela navegação continuam com as animações de entrada.
 */
const firstPaint: {
  id: string;
  isPresent: boolean;
  initial: false | undefined;
  custom: undefined;
  onExitComplete: undefined;
  register: () => () => void;
} = {
  id: "rubrica-first-paint",
  isPresent: true,
  initial: false,
  custom: undefined,
  onExitComplete: undefined,
  register: () => () => {},
};

export function FirstPaintMotion({ children }: { children: ReactNode }) {
  // No build (sem window) sempre; no navegador, só ao hidratar uma página pré-renderizada.
  const prerendered = typeof window === "undefined" || isHydratingPrerender();
  useEffect(() => {
    // Mesmo objeto (sem re-renderizar a árvore): só os componentes criados daqui em diante leem o novo valor.
    firstPaint.initial = undefined;
  }, []);
  if (!prerendered) return <>{children}</>;
  return <PresenceContext.Provider value={firstPaint}>{children}</PresenceContext.Provider>;
}
