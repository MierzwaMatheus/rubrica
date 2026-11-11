/**
 * Tema cyberpunk: o layout do cyberpunk da v1 (e do mmlo.com.br). Compartilha a
 * estrutura e os blocos do tema padrão (na v1 os dois usam as mesmas páginas) e muda a
 * casca (avatar grande, fundo da sidebar igual ao da página, "Fale comigo" na barra do
 * celular), a página de case (capa de fundo, cartões por seção, números com ícone, carrossel
 * das telas e o convite com o próximo case, como a da v1), o
 * esquema padrão (`neon`) e os títulos, que usam a cor do texto em vez da versão "forte".
 */
import { defineTheme } from "@rubrica/core";
import padrao, { createSidebarShell } from "@rubrica/theme-padrao";
import fonts from "./fonts.json";
import { CyberpunkCase } from "./templates";

export default defineTheme({
  ...padrao,
  id: "cyberpunk",
  label: "Cyberpunk",
  description: "Sidebar com avatar grande, esquema neon e Chakra Petch: o visual do mmlo.com.br.",
  scheme: "neon",
  fonts,
  Shell: createSidebarShell({ avatar: "lg", barTalk: true }),
  templates: { ...padrao.templates, case: CyberpunkCase },
  // As telas do case num carrossel (ilha do núcleo), como na v1.
  caseCarousel: true,
  texts: {
    ...padrao.texts,
    "cyberpunk.case.prompt": { pt: "./contato.sh --projeto", en: "./contato.sh --projeto", es: "./contato.sh --projeto" },
  },
});
