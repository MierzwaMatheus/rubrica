import { createRoot, hydrateRoot } from "react-dom/client";
import { hydrate } from "@tanstack/react-query";
import App from "./App";
import { createQueryClient } from "./providers/QueryProvider";
import { PRERENDER_STATE_ID } from "./ssr/constants";
import { markHydratingPrerender } from "./ssr/hydration";
import "./index.css";

const container = document.getElementById("root")!;
const stateEl = document.getElementById(PRERENDER_STATE_ID);

if (container.hasChildNodes() && stateEl) {
  // Página pré-renderizada no build: o React assume o HTML que já está na tela, com os
  // mesmos dados usados para gerá-lo (sem buscar de novo nem piscar).
  markHydratingPrerender();
  const queryClient = createQueryClient();
  hydrate(queryClient, JSON.parse(stateEl.textContent || "{}"));
  hydrateRoot(container, <App queryClient={queryClient} />);
} else {
  // Painel, login e rotas privadas: SPA comum.
  createRoot(container).render(<App />);
}
