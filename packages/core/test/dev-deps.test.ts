/**
 * Toda dependência que o painel e as ilhas importam está na lista de pré-otimização do dev
 * (`astro/dev-deps.ts`). Uma que falte o Vite descobre no meio do uso, recarrega a página
 * e a edição se perde.
 */
import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { ADMIN_BROWSER_DEPS, CORE_PACKAGE, DEDUPE, ISLAND_BROWSER_DEPS, optimizeDepsInclude } from "../src/astro/dev-deps";

const src = fileURLToPath(new URL("../src", import.meta.url));

function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? files(join(dir, e.name)) : /\.(tsx?|jsx?)$/.test(e.name) && !e.name.endsWith(".d.ts") ? [join(dir, e.name)] : [],
  );
}

const RE = /(?:^|[\n;])\s*(import|export)\s+(type\s+)?(?:[^'"]*?\sfrom\s+)?["']([^"']+)["']|import\(\s*["']([^"']+)["']\s*\)/g;

function resolveLocal(from: string, spec: string): string | undefined {
  const base = join(dirname(from), spec);
  return [base, `${base}.ts`, `${base}.tsx`, join(base, "index.ts"), join(base, "index.tsx")].find(
    (f) => existsSync(f) && statSync(f).isFile() && /\.(tsx?|jsx?)$/.test(f),
  );
}

/**
 * Pacotes importados em tempo de execução pelo código de `dir` e por tudo o que ele importa
 * por caminho relativo (o painel usa `src/convex/lib/*`, que importa `xss`). Fica de fora
 * `import type`, os virtuais e o `node:`.
 */
function runtimeImports(dir: string): Set<string> {
  const found = new Set<string>();
  const seen = new Set<string>();
  const queue = files(dir);
  while (queue.length) {
    const file = queue.pop()!;
    if (seen.has(file)) continue;
    seen.add(file);
    for (const m of readFileSync(file, "utf-8").matchAll(RE)) {
      if (m[2]) continue;
      const spec = m[3] ?? m[4]!;
      if (spec.startsWith(".")) {
        const local = resolveLocal(file, spec);
        if (local) queue.push(local);
        continue;
      }
      if (spec.startsWith("virtual:") || spec.startsWith("node:")) continue;
      found.add(spec);
    }
  }
  return found;
}

const isReact = (s: string) => DEDUPE.some((d) => s === d || s.startsWith(`${d}/`));

describe("dependências de navegador do dev", () => {
  it.each([
    ["admin", ADMIN_BROWSER_DEPS as readonly string[]],
    ["islands", ISLAND_BROWSER_DEPS as readonly string[]],
  ])("src/%s: toda importação está na lista", (dir, list) => {
    const missing = [...runtimeImports(join(src, dir))].filter((s) => !isReact(s) && !list.includes(s));
    expect(missing).toEqual([]);
  });

  it("a lista não guarda dependência que ninguém importa", () => {
    const used = new Set([...runtimeImports(join(src, "admin")), ...runtimeImports(join(src, "islands"))]);
    expect([...ADMIN_BROWSER_DEPS, ...ISLAND_BROWSER_DEPS].filter((d) => !used.has(d))).toEqual([]);
  });

  it("resolve as dependências a partir do núcleo e o React a partir do projeto", () => {
    const include = optimizeDepsInclude({ admin: true });
    expect(include).toContain(`${CORE_PACKAGE} > @tiptap/react`);
    expect(include).toContain("react");
    expect(include).toContain("react-dom/client");
    expect(include.filter((d) => !d.startsWith(`${CORE_PACKAGE} > `)).every(isReact)).toBe(true);
  });

  it("sem painel, não pré-otimiza o que é só do painel", () => {
    expect(optimizeDepsInclude({ admin: false })).not.toContain(`${CORE_PACKAGE} > @tiptap/react`);
  });
});
