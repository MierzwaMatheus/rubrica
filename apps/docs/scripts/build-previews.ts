/**
 * Gera os previews do combinador: um build de produção do app do Rubrica para cada
 * layout, aplicado pelo próprio CLI e com os dados de exemplo (public/data). O site mostra
 * esses builds em iframes, então o que aparece é literalmente a home de cada layout.
 *
 * Saída (não versionada): site/public/previews/<layout>/, site/public/previews/preview-bridge.js,
 * e os dados de exemplo compartilhados em site/public/data e site/public/samples.
 *
 * Roda da raiz do repositório (precisa das dependências do app):
 *   npx tsx site/scripts/build-previews.ts [--only zine,poster]
 */
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { LAYOUTS } from "../../cli/src/layouts";
import { SCHEMES, ROLE_VARS, type SchemeRole } from "../../cli/src/themes/schemes";
import { SANS_FONTS, MONO_FONTS } from "../../cli/src/themes/fonts";
import { ROOT, prepareLayoutProject, buildProject } from "../../scripts/lib/layoutProject";

const SITE = join(ROOT, "site");
const OUT = join(SITE, "public", "previews");
const only = (() => {
  const i = process.argv.indexOf("--only");
  return i >= 0 ? new Set(process.argv[i + 1].split(",")) : null;
})();

// Ponte com os esquemas e os pesos das fontes embutidos (fonte única: o CLI).
const schemes = Object.fromEntries(
  SCHEMES.map((s) => [
    s.id,
    {
      light: Object.fromEntries((Object.keys(ROLE_VARS) as SchemeRole[]).map((r) => [ROLE_VARS[r], s.light[r]])),
      dark: Object.fromEntries((Object.keys(ROLE_VARS) as SchemeRole[]).map((r) => [ROLE_VARS[r], s.dark[r]])),
    },
  ])
);
const fonts = Object.fromEntries([...SANS_FONTS, ...MONO_FONTS].map((f) => [f.family, f.weights]));
const bridge = readFileSync(join(SITE, "scripts", "preview-bridge.js"), "utf-8")
  .replace("var SCHEMES = __SCHEMES__;", `var SCHEMES = ${JSON.stringify(schemes)};`)
  .replace("var FONTS = __FONTS__;", `var FONTS = ${JSON.stringify(fonts)};`);
if (bridge.includes("= __")) throw new Error("preview-bridge.js: marcador não substituído");

mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, "preview-bridge.js"), bridge);

// Dados de exemplo: os builds buscam /data/*.json e /samples/* na raiz do site.
for (const dir of ["data", "samples"]) {
  rmSync(join(SITE, "public", dir), { recursive: true, force: true });
  cpSync(join(ROOT, "public", dir), join(SITE, "public", dir), { recursive: true });
}

for (const layout of LAYOUTS) {
  if (only && !only.has(layout.id)) continue;
  const dir = join(tmpdir(), "rubrica-site-previews", layout.id);
  const started = Date.now();
  await prepareLayoutProject({ layout, dir, mode: "light", toggle: true });

  // A ponte entra antes de tudo no <head>, para valer antes do script de modo e do app.
  const htmlPath = join(dir, "index.html");
  const html = readFileSync(htmlPath, "utf-8");
  writeFileSync(htmlPath, html.replace(/<head>/, '<head>\n    <script src="/previews/preview-bridge.js"></script>'));

  const out = join(OUT, layout.id);
  buildProject(dir, ["--base", `/previews/${layout.id}/`, "--outDir", out, "--emptyOutDir"]);
  for (const shared of ["data", "samples"]) rmSync(join(out, shared), { recursive: true, force: true });
  if (!existsSync(join(out, "index.html"))) throw new Error(`build de ${layout.id} sem index.html`);
  rmSync(dir, { recursive: true, force: true });
  console.log(`preview ${layout.id} pronto em ${Math.round((Date.now() - started) / 1000)}s`);
}
