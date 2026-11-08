/**
 * Tema cyberpunk: o layout do cyberpunk da v1 (e do mmlo.com.br). Compartilha a
 * estrutura e os blocos do tema padrão (na v1 os dois usam as mesmas páginas) e muda a
 * casca (avatar grande, fundo da sidebar igual ao da página), o esquema padrão (`neon`)
 * e os títulos, que usam a cor do texto em vez da versão "forte".
 */
import { defineTheme } from "@rubrica/core";
import padrao, { createSidebarShell } from "@rubrica/theme-padrao";
import fonts from "./fonts.json";

export default defineTheme({
  ...padrao,
  id: "cyberpunk",
  label: "Cyberpunk",
  description: "Sidebar com avatar grande, esquema neon e Chakra Petch: o visual do mmlo.com.br.",
  scheme: "neon",
  fonts,
  Shell: createSidebarShell({ avatar: "lg" }),
});
