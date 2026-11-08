import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createRubrica, reexportSource, RUBRICA_MODULES } from "../../src/convex";
import { defineBlock } from "../../src/blocks/define";
import { field } from "../../src/blocks/fields";

const demo = (path: string) => fileURLToPath(new URL(`../../../../apps/demo/convex/${path}`, import.meta.url));

describe("arquivos de reexportação (projeto de referência)", () => {
  const rubrica = createRubrica();

  it("cada módulo do núcleo tem o arquivo gerado e em dia em apps/demo/convex/rubrica", () => {
    for (const module of RUBRICA_MODULES) {
      const path = demo(`rubrica/${module}.ts`);
      expect(existsSync(path), path).toBe(true);
      expect(readFileSync(path, "utf-8"), module).toBe(reexportSource(rubrica, module));
    }
  });

  it("o arquivo é uma linha que reexporta todas as funções do módulo", () => {
    expect(reexportSource(rubrica, "site")).toBe(
      [
        "// Gerado pelo Rubrica (@rubrica/core). Não edite: atualize o pacote.",
        'import { rubrica } from "../rubrica.config";',
        "",
        "export const { snapshot } = rubrica.site;",
        "",
      ].join("\n"),
    );
  });

  it("o snapshot fica onde a fonte do build procura", () => {
    expect(readFileSync(demo("rubrica/site.ts"), "utf-8")).toContain("export const { snapshot } = rubrica.site;");
  });

  it("aceita blocos do projeto e recusa tipo repetido", () => {
    const meu = defineBlock({ type: "meu-bloco", label: "Meu", description: "", category: "comum", fields: { t: field.text({ label: "T" }) } });
    expect(createRubrica({ blocks: [meu] }).runtime.blocks.some((b) => b.type === "meu-bloco")).toBe(true);
    expect(() => createRubrica({ blocks: [{ ...meu, type: "hero" }] })).toThrow(/tipo de bloco repetido: "hero"/);
  });
});
