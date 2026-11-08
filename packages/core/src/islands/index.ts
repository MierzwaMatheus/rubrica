import type { ComponentType } from "react";

/**
 * Ilhas do núcleo, por nome. Um bloco `interactive` usa a ilha com o nome do seu tipo
 * (ex.: `contato`); o projeto pode acrescentar ou substituir pela opção `islands`.
 * A alternância de tema NÃO é ilha: é um botão estático (ColorToggleButton) ligado
 * pelo script /_rubrica/color-mode.js, para não carregar React em toda página.
 */
export const CORE_ISLANDS: Record<string, ComponentType<any>> = {};
