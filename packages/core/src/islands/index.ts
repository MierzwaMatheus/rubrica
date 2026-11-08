import type { ComponentType } from "react";
import Contato from "./contato";
import Curriculo from "./curriculo";
import DepoimentoEnvio from "./depoimento-envio";
import Video from "./video";
import { APP_ISLANDS, APP_TEXT_PREFIXES } from "./app";

/**
 * Ilhas do núcleo, por nome. Um bloco `interactive` usa a ilha com o nome do seu tipo
 * (ou o de `ISLAND_FOR_BLOCK`); o projeto pode acrescentar ou substituir pela opção `islands`.
 * A alternância de tema NÃO é ilha: é um botão estático (ColorToggleButton) ligado
 * pelo script /_rubrica/color-mode.js, para não carregar React em toda página.
 */
export const CORE_ISLANDS: Record<string, ComponentType<any>> = {
  contato: Contato,
  curriculo: Curriculo,
  "depoimento-envio": DepoimentoEnvio,
  video: Video,
  // Páginas do app (rotas `kind: "app"` dos plugins), carregadas sob demanda.
  ...APP_ISLANDS,
};

/** Bloco → ilha, quando o nome difere do tipo do bloco. */
export const ISLAND_FOR_BLOCK: Record<string, string> = { depoimentos: "depoimento-envio" };

export function islandNameFor(blockType: string): string {
  return ISLAND_FOR_BLOCK[blockType] ?? blockType;
}

/**
 * O que o núcleo entrega a cada ilha além do básico (bloco, campos, idioma, página, site):
 * `textPrefixes` são os prefixos das chaves de interface enviadas em `texts`;
 * `items` manda os itens da coleção do bloco; `title` é a chave do título (`<title>`) da página
 * de uma rota do app. Ilha do projeto sem entrada aqui recebe só o básico.
 */
export const ISLAND_META: Record<string, { textPrefixes: string[]; items?: boolean; title?: string }> = {
  contato: { textPrefixes: ["form.", "contactForm."] },
  curriculo: { textPrefixes: ["resume."], items: true },
  "depoimento-envio": { textPrefixes: ["form.", "testimonialForm."] },
  video: { textPrefixes: ["video.", "common.external"] },
  proposta: { textPrefixes: APP_TEXT_PREFIXES, title: "proposal.title" },
  "proposta-aceite": { textPrefixes: APP_TEXT_PREFIXES, title: "accept.title" },
  checkout: { textPrefixes: APP_TEXT_PREFIXES, title: "checkout.title" },
  "pagamento-concluido": { textPrefixes: APP_TEXT_PREFIXES, title: "payment.title" },
};
