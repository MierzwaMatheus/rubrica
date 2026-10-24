import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

// O create-rubrica baixa o tarball da release do GitHub, que deixa de fora o que está
// marcado com export-ignore no .gitattributes. Código que roda no app ou no build não
// pode importar dessas pastas: o projeto criado pelo CLI quebraria no `npm run build`.

const ROOT = path.resolve(__dirname, "..");
const RUNTIME_DIRS = ["src", "scripts", "convex"];

const ignored = readFileSync(path.join(ROOT, ".gitattributes"), "utf-8")
  .split("\n")
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith("#") && l.includes("export-ignore"))
  .map((l) => l.split(/\s+/)[0].replace(/\/$/, ""));

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (name === "node_modules" || name === "_generated") return [];
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.(ts|tsx|js|mjs)$/.test(name) ? [full] : [];
  });
}

describe("tarball da release", () => {
  it("o .gitattributes tem regras de export-ignore", () => {
    expect(ignored.length).toBeGreaterThan(0);
  });

  it("nenhum código do app ou do build importa de algo que fica fora da release", () => {
    const offenders: string[] = [];
    for (const dir of RUNTIME_DIRS) {
      for (const file of sourceFiles(path.join(ROOT, dir))) {
        const source = readFileSync(file, "utf-8");
        for (const match of source.matchAll(/(?:from|import)\s*\(?\s*["']([^"']+)["']/g)) {
          const spec = match[1];
          if (!spec.startsWith(".")) continue;
          const target = path.relative(ROOT, path.resolve(path.dirname(file), spec));
          if (ignored.some((ig) => target === ig || target.startsWith(`${ig}/`))) {
            offenders.push(`${path.relative(ROOT, file)} → ${spec}`);
          }
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
