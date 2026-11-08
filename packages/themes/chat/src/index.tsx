/**
 * Tema Conversa: o layout `chat` da v1. O site inteiro é uma conversa com o dono do site:
 * topo de aplicativo de mensagens, cada bloco é uma pergunta de quem visita respondida em
 * balões, e as respostas rápidas presas embaixo são a navegação.
 *
 * Desenha a casca e os 17 blocos (na v1 nenhuma seção tem o visual de grade/cartão do
 * núcleo); os templates de post, case e 404 são os do núcleo, numa moldura com margem,
 * como as páginas do app na v1. Esquema e fontes padrão do layout na v1: `alto-contraste`,
 * Instrument Sans e IBM Plex Mono.
 */
import { defineTheme } from "@rubrica/core";
import fonts from "./fonts.json";
import { CHAT_BLOCKS } from "./blocks";
import { CHAT_RECIPES } from "./recipes";
import { ChatShell } from "./shell";
import { CHAT_TEXTS } from "./texts";

export { ChatShell } from "./shell";
export * from "./blocks";
export { CHAT_TEXTS } from "./texts";

export default defineTheme({
  id: "chat",
  label: "Conversa",
  description: "O site como uma conversa: cada seção responde a uma pergunta pronta, e as respostas rápidas embaixo são a navegação.",
  contract: "^1",
  scheme: "alto-contraste",
  fonts,
  tokens: {
    "rb-accent": { label: "Cor dos balões de quem visita", kind: "color", default: "#FFE14D", light: "#0030B8" },
  },
  Shell: ChatShell,
  blocks: CHAT_BLOCKS,
  variants: {
    cases: [
      { value: "lista", label: "Lista" },
      { value: "destaque", label: "Primeiro em destaque" },
    ],
    "posts-recentes": [
      { value: "lista", label: "Lista" },
      { value: "destaque", label: "Primeiro em destaque" },
    ],
    servicos: [
      { value: "lista", label: "Lista" },
      { value: "etiquetas", label: "Etiquetas" },
    ],
    texto: [
      { value: "mensagens", label: "Mensagens (título como assunto)" },
      { value: "pergunta", label: "Título como pergunta de quem visita" },
    ],
  },
  recipes: CHAT_RECIPES,
  texts: CHAT_TEXTS,
});
