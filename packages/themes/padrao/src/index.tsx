/**
 * Tema padrão. Ponto de partida: usa a casca e os blocos padrão do núcleo e só
 * define tokens, variações e receitas. A portagem do layout padrão da v1 completa
 * este tema.
 */
import { defineTheme } from "@rubrica/core";
import { DefaultShell } from "@rubrica/core/components";

export default defineTheme({
  id: "padrao",
  label: "Padrão",
  description: "Layout padrão do Rubrica.",
  contract: "^1",
  tokens: {
    "rb-accent": { label: "Cor de destaque", kind: "color", default: "#7cc4ff", light: "#0b5cad" },
  },
  Shell: DefaultShell,
  variants: {
    cases: [
      { value: "grade", label: "Grade" },
      { value: "lista", label: "Lista" },
    ],
  },
});
