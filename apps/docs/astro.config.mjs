import { defineConfig } from "astro/config";

// O site importa temas, esquemas e plugins direto de packages/create-rubrica e do núcleo
// (@rubrica/core), a mesma fonte que o create-rubrica usa: o combinador nunca mostra uma
// opção que o CLI não tem. Os Markdown vêm de docs/ e o changelog da raiz.
export default defineConfig({
  site: "https://userubrica.vercel.app",
  vite: {
    server: { fs: { allow: ["../.."] } },
  },
});
