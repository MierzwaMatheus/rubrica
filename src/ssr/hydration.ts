/**
 * Página pré-renderizada: a primeira renderização no navegador precisa repetir o HTML do
 * build. O que só existe no navegador (escolha salva no localStorage, tema do sistema) entra
 * depois, num efeito.
 */
let hydratingPrerender = false;

/** Chamado pelo main.tsx antes de hidratar uma página pré-renderizada. */
export function markHydratingPrerender() {
  hydratingPrerender = true;
}

export function isHydratingPrerender(): boolean {
  return hydratingPrerender;
}
