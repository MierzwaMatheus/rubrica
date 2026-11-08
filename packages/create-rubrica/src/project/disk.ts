import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

/** Arquivos do convex/ do projeto (sem _generated), caminho relativo → conteúdo. */
export function readConvexDir(projectDir: string): Record<string, string> {
  const root = join(projectDir, "convex");
  const out: Record<string, string> = {};
  const walk = (dir: string) => {
    if (!existsSync(dir)) return;
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) {
        if (name !== "_generated" && name !== "node_modules") walk(full);
        continue;
      }
      out[relative(projectDir, full).split(sep).join("/")] = readFileSync(full, "utf-8");
    }
  };
  walk(root);
  return out;
}
