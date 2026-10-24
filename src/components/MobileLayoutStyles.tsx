/**
 * Ajustes de celular para layouts que montam o grid com estilo inline (Swiss, Magazine,
 * Brutalist). Estilo inline não aceita media query, então esta folha sobrepõe no celular.
 *
 * Dentro de um elemento com a classe `rb-mobile`, abaixo de 768px:
 * - todo grid com `grid-template-columns` inline vira uma coluna, e os filhos perdem o `span`;
 * - `data-m-cols="2"` mantém 2 colunas (ex.: números e métricas);
 * - `data-m-keep` mantém o grid como está (ex.: linhas decorativas, ícone + texto);
 * - `data-m-hide` esconde o elemento (decoração que não cabe);
 * - `data-m-scroll` deixa o conteúdo rolar na horizontal em vez de vazar a página;
 * - `data-m-bleed` anula o padding lateral de 24px do <main> (a página cuida da própria margem).
 */
export const MOBILE_LAYOUT_CSS = `
@media (max-width: 767px) {
  .rb-mobile { overflow-x: clip; }
  .rb-mobile [style*="grid-template-columns"]:not([data-m-keep]):not([data-m-cols]) {
    grid-template-columns: minmax(0, 1fr) !important;
  }
  .rb-mobile [data-m-cols="2"] { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
  .rb-mobile [style*="grid-template-columns"]:not([data-m-keep]) > * {
    grid-column: auto !important;
    grid-row: auto !important;
  }
  .rb-mobile [data-m-hide] { display: none !important; }
  .rb-mobile [data-m-scroll] { overflow-x: auto !important; max-width: 100%; }
  .rb-mobile [data-m-bleed] { margin-inline: -24px; }
  .rb-mobile img, .rb-mobile video { max-width: 100%; height: auto; }
}
`;

export function MobileLayoutStyles() {
  return <style>{MOBILE_LAYOUT_CSS}</style>;
}
