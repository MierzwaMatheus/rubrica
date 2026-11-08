/** Auxiliares puros do tema (o núcleo ainda não exporta os dele). */

/** Número de ficha com dois dígitos: 1 → "01". */
export const two = (n: number) => String(n).padStart(2, "0");

/** Identificador seguro para `id` e seletores CSS. */
export const safeId = (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, "_");

/**
 * Regras CSS do filtro por etiqueta sem JavaScript: botões de opção antes da lista e uma
 * folha gerada esconde os itens sem a etiqueta marcada. Os ids vêm do índice, nunca do texto.
 */
export function tagFilterCss(scope: string, count: number): string {
  const rules: string[] = [];
  const on = "background:var(--rb-fg);color:var(--rb-bg)";
  for (let i = 0; i < count; i++) {
    const radio = `#${scope}-t${i}`;
    rules.push(`${radio}:checked ~ .sw-posts-list > .sw-post:not([data-tags~="t${i}"]){display:none}`);
    rules.push(`${radio}:checked ~ .sw-filter label[for="${scope}-t${i}"]{${on}}`);
    rules.push(`${radio}:focus-visible ~ .sw-filter label[for="${scope}-t${i}"]{outline:2px solid var(--rb-accent);outline-offset:2px}`);
  }
  rules.push(`#${scope}-all:checked ~ .sw-filter label[for="${scope}-all"]{${on}}`);
  rules.push(`#${scope}-all:focus-visible ~ .sw-filter label[for="${scope}-all"]{outline:2px solid var(--rb-accent);outline-offset:2px}`);
  return rules.join("\n");
}

/** Divide o nome em "inicial." + resto (v1: `M.Mierzwa`). Nome de uma palavra só vira um bloco inteiro. */
export function splitName(name: string): { initial: string; rest: string; single: boolean } {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { initial: name.trim(), rest: "", single: true };
  return { initial: `${parts[0]![0]}.`, rest: parts.slice(1).join(" "), single: false };
}
