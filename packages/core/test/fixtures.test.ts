/** Os dados de exemplo da demo seguem o contrato: blocos válidos e textos por idioma. */
import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { validateBlock } from "../src/blocks/define";
import { CORE_BLOCKS } from "../src/blocks/catalog";
import type { PageRecord } from "../src/content/types";

const root = fileURLToPath(new URL("../../../apps/demo/fixtures", import.meta.url));
const defs = new Map(CORE_BLOCKS.map((b) => [b.type, b]));

function jsonFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? jsonFiles(join(dir, e.name)) : e.name.endsWith(".json") ? [join(dir, e.name)] : []));
}

/** Procura valores com a chave dada que não são mapas idioma → texto. */
function badLocalized(value: unknown, keys: string[], path = ""): string[] {
  if (Array.isArray(value)) return value.flatMap((v, i) => badLocalized(v, keys, `${path}[${i}]`));
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([k, v]) =>
      keys.includes(k) && (typeof v !== "object" || v === null || Array.isArray(v)) ? [`${path}.${k}`] : badLocalized(v, keys, `${path}.${k}`),
    );
  }
  return [];
}

describe.each(["pessoal", "empresa"])("fixtures %s", (kind) => {
  it("todos os blocos são válidos no catálogo", () => {
    const pages = JSON.parse(readFileSync(join(root, kind, "pages.json"), "utf-8")) as PageRecord[];
    const errors = pages.flatMap((p) =>
      p.blocks.flatMap((b) => {
        const def = defs.get(b.type);
        if (!def) return [`${p.path}#${b.id}: tipo desconhecido ${b.type}`];
        return validateBlock(def, b).map((e) => `${p.path}#${b.id} ${e.path}: ${e.message}`);
      }),
    );
    expect(errors).toEqual([]);
  });

  it("textos alternativos e rótulos são por idioma", () => {
    const bad = jsonFiles(join(root, kind)).flatMap((f) => badLocalized(JSON.parse(readFileSync(f, "utf-8")), ["alt", "title", "label"]).map((p) => `${f.slice(root.length)}${p}`));
    expect(bad).toEqual([]);
  });
});
