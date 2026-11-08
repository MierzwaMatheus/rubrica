import { defineConfig } from "astro/config";
import rubrica from "@rubrica/core/astro";

// Demonstração: SITE=pessoal|empresa escolhe os dados de exemplo; THEME troca o tema.
const kind = process.env.SITE === "empresa" ? "empresa" : "pessoal";

// O testador de temas (@rubrica/theme-tester) passa aliases do Vite para temas do
// workspace que a demo não declara como dependência.
const themeAliases: { find: string; replacement: string }[] = JSON.parse(process.env.RUBRICA_THEME_ALIAS ?? "[]");

export default defineConfig({
  site: "https://demo.userubrica.dev",
  vite: { resolve: { alias: themeAliases.map((a) => ({ find: new RegExp(a.find), replacement: a.replacement })) } },
  integrations: [
    rubrica({
      theme: process.env.THEME ?? "@rubrica/theme-padrao",
      source: { fixtures: `./fixtures/${kind}` },
    }),
  ],
});
