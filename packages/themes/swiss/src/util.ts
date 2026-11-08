/** Auxiliares puros do tema (os genéricos vêm do núcleo). */
import { tagFilterCss as coreTagFilterCss } from "@rubrica/core/components";

/** Número de ficha com dois dígitos: 1 → "01". */
export const two = (n: number) => String(n).padStart(2, "0");

export { safeId } from "@rubrica/core/components";

/**
 * Regras CSS do filtro por etiqueta sem JavaScript (o do núcleo): botões de opção antes da
 * lista e uma folha gerada esconde os itens sem a etiqueta marcada.
 */
export function tagFilterCss(scope: string, count: number): string {
  return coreTagFilterCss(scope, count, {
    items: ".sw-posts-list > .sw-post",
    filter: ".sw-filter",
    checked: "background:var(--rb-fg);color:var(--rb-bg)",
  });
}

/** Divide o nome em "inicial." + resto (v1: `M.Mierzwa`). Nome de uma palavra só vira um bloco inteiro. */
export function splitName(name: string): { initial: string; rest: string; single: boolean } {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { initial: name.trim(), rest: "", single: true };
  return { initial: `${parts[0]![0]}.`, rest: parts.slice(1).join(" "), single: false };
}
