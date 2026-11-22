/**
 * Configuração do site. O CLI mantém os trechos entre marcadores "rubrica:" (tema e
 * componentes ejetados): mude-os com npx create-rubrica config e ejetar.
 *
 * Conteúdo do build: o Convex de CONVEX_URL. Com RUBRICA_FIXTURES=<pasta>, arquivos JSON
 * (site.json, pages.json, collections/*.json), para ver o site sem banco.
 */
import { defineConfig } from "astro/config";
import type { AstroIntegration } from "astro";
import rubrica from "@rubrica/core/astro";
import { components as ownComponents } from "./src/blocks";

/** Vercel Web Analytics e Speed Insights em todas as páginas (o Rubrica só traz o Umami). */
const vercelInsights: AstroIntegration = {
  name: "vercel-insights",
  hooks: {
    "astro:config:setup": ({ injectScript }) => {
      injectScript("page", `import "/src/lib/vercel-insights.ts";`);
    },
  },
};

export default defineConfig({
  site: "https://www.mmlo.app",
  integrations: [
    rubrica({
      // rubrica:tema:inicio
      theme: "@rubrica/theme-cyberpunk",
      // rubrica:tema:fim
      source: process.env.RUBRICA_FIXTURES ? { fixtures: process.env.RUBRICA_FIXTURES } : undefined,
      // Blocos próprios (definições). Os componentes deles vão em src/blocks/index.ts.
      blocks: ["./src/blocks/index.ts"],
      // rubrica:ejetados:inicio
      blockComponents: {
        ...ownComponents,
      },
      // rubrica:ejetados:fim
    }),
    vercelInsights,
  ],
});
