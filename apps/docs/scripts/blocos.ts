/**
 * `pnpm docs:blocos`: regera docs/guia/blocos.md e blocos.en.md a partir do código.
 * O teste `blocos.test.ts` falha quando os arquivos ficam para trás.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { renderCatalog } from "./blocos/catalogo";
import { CATALOG_FILES, loadCatalogInput, REPO_ROOT } from "./blocos/fonte";

const input = await loadCatalogInput();
for (const lang of ["pt", "en"] as const) {
  writeFileSync(join(REPO_ROOT, CATALOG_FILES[lang]), renderCatalog(input, lang));
  console.log(`${CATALOG_FILES[lang]}: ${input.blocks.length} blocos`);
}
