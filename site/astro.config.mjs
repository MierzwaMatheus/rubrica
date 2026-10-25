import { defineConfig } from "astro/config";

// O site importa layouts, esquemas e fontes direto do CLI (../cli/src), a mesma fonte
// que o create-rubrica usa: o combinador nunca mostra uma opção que o CLI não tem.
export default defineConfig({
  site: "https://userubrica.vercel.app",
  vite: {
    server: { fs: { allow: [".."] } },
  },
});
