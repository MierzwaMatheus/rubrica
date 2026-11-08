/** Auxiliares do tema: os utilitários puros vêm do núcleo. */
import { tagFilterCss as coreTagFilterCss } from "@rubrica/core/components";

export { digits, formatDays, resolveFreeHref, safeId } from "@rubrica/core/components";

/**
 * Regras CSS do filtro por etiqueta sem JavaScript (o do núcleo): botões de opção antes
 * da tabela e uma folha gerada esconde as linhas sem a etiqueta marcada.
 */
export function tagFilterCss(scope: string, count: number): string {
  return coreTagFilterCss(scope, count, {
    items: ".ix-tablewrap tbody > tr",
    filter: ".ix-filter",
    checked: "text-decoration:underline;text-decoration-color:var(--rb-accent);text-decoration-thickness:2px;color:var(--rb-fg)",
    focus: "outline:2px solid var(--rb-fg);outline-offset:3px",
  });
}
