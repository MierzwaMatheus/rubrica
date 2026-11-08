/** Auxiliares do tema: os utilitários puros vêm do núcleo. */
import { tagFilterCss as coreTagFilterCss } from "@rubrica/core/components";

export { digits, formatDays, resolveFreeHref, safeId } from "@rubrica/core/components";

/** Primeiro nome, para a assinatura da carta ("Matheus Mierzwa" → "Matheus"). */
export const firstName = (name?: string) => (name ?? "").trim().split(/\s+/)[0] ?? "";

/**
 * Regras CSS do filtro por etiqueta sem JavaScript (o do núcleo): botões de opção antes
 * da lista e uma folha gerada esconde os recortes sem a etiqueta marcada.
 * As etiquetas viram abas de fita; a marcada fica na cor de destaque.
 */
export function tagFilterCss(scope: string, count: number): string {
  return coreTagFilterCss(scope, count, {
    items: ".zn-clips > .zn-clip-item",
    filter: ".zn-tabs",
    checked: "background:var(--rb-accent);color:var(--rb-accent-fg)",
    focus: "outline:3px solid var(--rb-fg);outline-offset:3px",
  });
}
