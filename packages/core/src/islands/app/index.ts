/**
 * Ilhas das páginas do app (rotas `kind: "app"` do registro de plugins). Carregadas sob
 * demanda: o cliente do Convex e o resto não pesam nas outras ilhas do site.
 */
import { createElement, lazy, Suspense, type ComponentType } from "react";
import type { AppIslandProps } from "./ui";

function lazyIsland(load: () => Promise<{ default: ComponentType<AppIslandProps> }>): ComponentType<AppIslandProps> {
  const Lazy = lazy(load);
  return function AppIsland(props: AppIslandProps) {
    return createElement(Suspense, { fallback: null }, createElement(Lazy, props));
  };
}

export const APP_ISLANDS: Record<string, ComponentType<AppIslandProps>> = {
  proposta: lazyIsland(() => import("./proposta")),
  "proposta-aceite": lazyIsland(() => import("./proposta-aceite")),
  checkout: lazyIsland(() => import("./checkout")),
  "pagamento-concluido": lazyIsland(() => import("./pagamento-concluido")),
};

/** Textos de interface que toda página do app recebe (prefixos de `ui-texts.ts`). */
export const APP_TEXT_PREFIXES = ["app.", "proposal.", "accept.", "contract.", "checkout.", "payment.", "form.", "common."];

