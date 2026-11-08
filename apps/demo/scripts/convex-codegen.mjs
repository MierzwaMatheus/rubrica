/**
 * Gera `convex/_generated` sem deployment, com os mesmos modelos do `npx convex
 * codegen`. O comando oficial exige um CONVEX_DEPLOYMENT só para escolher onde
 * rodar; para um app sem componentes, o código gerado não depende do deployment.
 *
 * Uso (em apps/demo): node scripts/convex-codegen.mjs
 * Com um deployment configurado, prefira `npx convex dev --once` ou `npx convex codegen`.
 */
import { createRequire } from "node:module";
import { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const templates = join(dirname(require.resolve("convex/package.json")), "dist/cjs/cli/codegen_templates");
const { apiCodegen } = require(join(templates, "api.js"));
const { serverCodegen } = require(join(templates, "server.js"));
const { header } = require(join(templates, "common.js"));

// O modelo `dataModel.js` importa o CLI inteiro (chalk etc.); o conteúdo é este, fixo.
const dataModelDTS = `${header("Generated data model types.")}
import type { DataModelFromSchemaDefinition, DocumentByName, TableNamesInDataModel, SystemTableNames } from "convex/server";
import type { GenericId } from "convex/values";
import schema from "../schema.js";

/** The names of all of your Convex tables. */
export type TableNames = TableNamesInDataModel<DataModel>;

/** The type of a document stored in Convex. */
export type Doc<TableName extends TableNames> = DocumentByName<DataModel, TableName>;

/** An identifier for a document in Convex. */
export type Id<TableName extends TableNames | SystemTableNames> = GenericId<TableName>;

/** A type describing your Convex data model. */
export type DataModel = DataModelFromSchemaDefinition<typeof schema>;
`;

const convexDir = join(dirname(fileURLToPath(import.meta.url)), "../convex");

/** Mesmas regras de `entryPoints` do bundler do Convex. */
function modules(dir) {
  const out = [];
  for (const name of readdirSync(dir).sort()) {
    const path = join(dir, name);
    const rel = relative(convexDir, path);
    if (statSync(path).isDirectory()) {
      if (rel !== "_generated" && rel !== "node_modules") out.push(...modules(path));
      continue;
    }
    if (!/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(name) || name.endsWith(".d.ts")) continue;
    if (name.startsWith(".") || name.startsWith("#") || name === "schema.ts" || (name.match(/\./g) ?? []).length > 1 || rel.includes(" ")) continue;
    if (!/^\s{0,100}(import|export)/m.test(readFileSync(path, "utf-8"))) continue;
    out.push(rel.split(sep).join("/"));
  }
  return out;
}

const generated = join(convexDir, "_generated");
mkdirSync(generated, { recursive: true });
const api = apiCodegen(modules(convexDir), { useTypeScript: false });
const server = serverCodegen({ useTypeScript: false });
writeFileSync(join(generated, "api.d.ts"), api.DTS);
writeFileSync(join(generated, "api.js"), api.JS);
writeFileSync(join(generated, "server.d.ts"), server.DTS);
writeFileSync(join(generated, "server.js"), server.JS);
writeFileSync(join(generated, "dataModel.d.ts"), dataModelDTS);
console.log("convex/_generated atualizado");
