/**
 * Confere, sem deployment, que o bundler do Convex aceita o `convex/` do projeto
 * (que importa as funções de `@rubrica/core`, um pacote do workspace em TypeScript).
 *
 * Roda o esbuild com as mesmas opções do `npx convex dev/deploy` para o runtime
 * padrão (isolate: `platform: "browser"`, condições `convex`/`module`, ESM com
 * splitting), grava numa pasta temporária, importa cada módulo e lista as funções
 * registradas. Falha se algum módulo não empacotar ou se uma função esperada faltar.
 *
 * Uso (em apps/demo): node scripts/convex-bundle-check.mjs
 */
import { createRequire } from "node:module";
import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const esbuild = createRequire(require.resolve("convex/package.json"))("esbuild");
const convexDir = join(dirname(fileURLToPath(import.meta.url)), "../convex");

function entryPoints(dir) {
  const out = [];
  for (const name of readdirSync(dir).sort()) {
    const path = join(dir, name);
    const rel = relative(convexDir, path);
    if (statSync(path).isDirectory()) {
      if (rel !== "_generated" && rel !== "node_modules") out.push(...entryPoints(path));
      continue;
    }
    if (!/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(name) || name.endsWith(".d.ts")) continue;
    if (name.startsWith(".") || name === "schema.ts" || (name.match(/\./g) ?? []).length > 1) continue;
    if (!/^\s{0,100}(import|export)/m.test(readFileSync(path, "utf-8"))) continue;
    out.push(path);
  }
  return out;
}

const asyncHooksShim = {
  name: "convex-async-hooks-shim",
  setup(build) {
    build.onResolve({ filter: /^(node:)?async_hooks$/ }, (args) => ({ path: args.path, namespace: "async-hooks-shim" }));
    build.onLoad({ filter: /.*/, namespace: "async-hooks-shim" }, () => ({
      contents: "export const AsyncLocalStorage = globalThis.AsyncLocalStorage; export default {};",
      loader: "js",
    }));
  },
};

const outdir = mkdtempSync(join(tmpdir(), "rubrica-convex-bundle-"));
const entries = [...entryPoints(convexDir), join(convexDir, "schema.ts"), join(convexDir, "auth.config.ts")];
try {
  const result = await esbuild.build({
    entryPoints: entries,
    bundle: true,
    platform: "browser",
    format: "esm",
    target: "esnext",
    jsx: "automatic",
    outdir,
    outbase: convexDir,
    outExtension: { ".js": ".mjs" },
    conditions: ["convex", "module"],
    plugins: [asyncHooksShim],
    splitting: true,
    chunkNames: "_deps/[hash]",
    treeShaking: true,
    minifySyntax: true,
    minifyIdentifiers: true,
    keepNames: true,
    define: { "process.env.NODE_ENV": '"production"' },
    metafile: true,
    logLevel: "warning",
  });
  const inputs = Object.keys(result.metafile.inputs);
  const fromCore = inputs.filter((p) => p.includes("packages/core/src/convex") || p.includes("@rubrica/core/src/convex"));
  console.log(`empacotado: ${entries.length} entradas, ${inputs.length} arquivos de origem (${fromCore.length} de @rubrica/core/src/convex)`);

  let total = 0;
  const problems = [];
  for (const entry of entries) {
    const rel = relative(convexDir, entry).replace(/\.ts$/, "");
    if (rel === "schema" || rel === "auth.config") continue;
    const mod = await import(pathToFileURL(join(outdir, `${rel}.mjs`)).href);
    const kinds = Object.entries(mod).map(([name, value]) => {
      const kind = value?.isQuery ? "query" : value?.isMutation ? "mutation" : value?.isAction ? "action" : value?.isHttp ? "http" : value?.isRouter ? "router" : value?.isCrons ? "crons" : typeof value;
      const visibility = value?.isInternal ? " (interna)" : "";
      return `${name}: ${kind}${visibility}`;
    });
    if (rel.startsWith(`rubrica${sep}`) || rel.startsWith("rubrica/")) {
      for (const [name, value] of Object.entries(mod)) {
        if (!(value?.isQuery || value?.isMutation || value?.isAction)) problems.push(`${rel}.${name} não é função do Convex`);
      }
    }
    total += kinds.length;
    console.log(`  ${rel}: ${kinds.join(", ")}`);
  }
  if (problems.length) throw new Error(problems.join("\n"));
  console.log(`ok: ${total} exports`);
} finally {
  rmSync(outdir, { recursive: true, force: true });
}
