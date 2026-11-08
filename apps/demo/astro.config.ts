import { defineConfig } from "astro/config";
import rubrica from "@rubrica/core/astro";

// Demonstração: SITE=pessoal|empresa escolhe os dados de exemplo; THEME troca o tema.
const kind = process.env.SITE === "empresa" ? "empresa" : "pessoal";

export default defineConfig({
  site: "https://demo.userubrica.dev",
  integrations: [
    rubrica({
      theme: process.env.THEME ?? "@rubrica/theme-padrao",
      source: { fixtures: `./fixtures/${kind}` },
    }),
  ],
});
