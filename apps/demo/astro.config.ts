import { existsSync, readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { defineConfig } from "astro/config";
import rubrica from "@rubrica/core/astro";

// Demonstração: SITE=pessoal|empresa escolhe os dados de exemplo; THEME troca o tema.
const kind = process.env.SITE === "empresa" ? "empresa" : "pessoal";
const theme = process.env.THEME ?? "@rubrica/theme-padrao";

type Alias = { find: string; replacement: string };

/**
 * Aliases do Vite para um tema do workspace que a demo não declara como dependência
 * (`THEME=@rubrica/theme-zine pnpm demo`), lidos do `exports` do pacote dele. O testador de
 * temas (@rubrica/theme-tester) passa os mesmos em RUBRICA_THEME_ALIAS, que vence.
 */
function workspaceThemeAliases(name: string): Alias[] {
  const base = fileURLToPath(new URL("../../packages/themes", import.meta.url));
  if (!existsSync(base)) return [];
  for (const entry of readdirSync(base)) {
    const pkgPath = join(base, entry, "package.json");
    if (!existsSync(pkgPath)) continue;
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8")) as { name?: string; exports?: Record<string, unknown> };
    if (pkg.name !== name) continue;
    const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
    return Object.entries(pkg.exports ?? {})
      .filter((e): e is [string, string] => typeof e[1] === "string")
      .map(([key, target]) => ({ find: `^${escape(key === "." ? name : `${name}/${key.replace(/^\.\//, "")}`)}$`, replacement: join(base, entry, target) }));
  }
  return [];
}

const themeAliases: Alias[] = process.env.RUBRICA_THEME_ALIAS ? JSON.parse(process.env.RUBRICA_THEME_ALIAS) : workspaceThemeAliases(theme);
// A integração lê as fontes do tema (fonts.json) pelo mesmo alias.
process.env.RUBRICA_THEME_ALIAS ??= JSON.stringify(themeAliases);

export default defineConfig({
  site: "https://demo.userubrica.dev",
  vite: { resolve: { alias: themeAliases.map((a) => ({ find: new RegExp(a.find), replacement: a.replacement })) } },
  integrations: [
    rubrica({
      theme,
      // RUBRICA_SHOWCASE=1 (a bateria de tema) acrescenta as páginas da vitrine em /vitrine.
      source: { fixtures: `./fixtures/${kind}`, showcase: process.env.RUBRICA_SHOWCASE === "1" },
    }),
  ],
});
