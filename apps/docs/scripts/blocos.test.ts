/** O catálogo de blocos da documentação está em dia com o código do núcleo. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { renderCatalog } from "./blocos/catalogo";
import { CATALOG_FILES, loadCatalogInput, REPO_ROOT } from "./blocos/fonte";

const input = await loadCatalogInput();

for (const lang of ["pt", "en"] as const) {
  test(`${CATALOG_FILES[lang]} está em dia com packages/core (rode pnpm docs:blocos)`, () => {
    const onDisk = readFileSync(join(REPO_ROOT, CATALOG_FILES[lang]), "utf-8");
    assert.equal(onDisk, renderCatalog(input, lang));
  });
}

test("cada bloco do núcleo tem a sua seção nas duas versões", () => {
  for (const lang of ["pt", "en"] as const) {
    const md = renderCatalog(input, lang);
    for (const b of input.blocks) assert.ok(md.includes(`## \`${b.type}\``), `${lang}: falta ${b.type}`);
  }
});
