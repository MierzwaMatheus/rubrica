/**
 * Monta um projeto temporário com um layout aplicado pelo próprio CLI, checa os tipos,
 * faz o build com os dados de exemplo (public/data) e sobe um `vite preview`.
 *
 * Serve para desenvolver e revisar layouts sem mexer no src/ do repositório: cada
 * execução usa a própria pasta e a própria porta, então várias podem rodar em paralelo.
 *
 * Uso:
 *   npx tsx scripts/preview-layout.ts --layout zine --port 4311
 *   npx tsx scripts/preview-layout.ts --layout zine --port 4311 --scheme riso --texture paper
 *   npx tsx scripts/preview-layout.ts --layout zine --port 4311 --check-only   (só tipos)
 *   npx tsx scripts/preview-layout.ts --stop --port 4311
 *
 * O build sai com a alternância de modo ligada: para fotografar claro e escuro use
 * scripts/shot-layout.mjs, que escolhe o modo pelo localStorage.
 */
import { spawn } from "node:child_process";
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { getLayout, type ColorMode, type Texture } from "../cli/src/layouts";
import { prepareLayoutProject, typecheckProject, buildProject } from "./lib/layoutProject";


function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
const flag = (name: string) => process.argv.includes(`--${name}`);

const port = Number(arg("port") ?? "4300");
const pidFile = join(tmpdir(), `rubrica-preview-${port}.pid`);

function stop() {
  if (!existsSync(pidFile)) return;
  const pid = Number(readFileSync(pidFile, "utf-8"));
  try {
    process.kill(-pid);
  } catch {
    try { process.kill(pid); } catch { /* já parou */ }
  }
  rmSync(pidFile, { force: true });
}

if (flag("stop")) {
  stop();
  console.log(`preview na porta ${port} parado`);
  process.exit(0);
}

const layoutId = arg("layout");
const layout = layoutId ? getLayout(layoutId) : undefined;
if (!layout) {
  console.error(`uso: --layout <id> --port <n>. Layout "${layoutId}" não existe em cli/src/layouts.ts`);
  process.exit(2);
}

const scheme = arg("scheme") ?? layout.recommended.scheme;
const mode = (arg("mode") ?? layout.recommended.mode) as ColorMode;
const texture = (arg("texture") ?? layout.recommended.texture) as Texture;
const dir = join(tmpdir(), "rubrica-preview", `${layout.id}-${port}`);

stop();
await prepareLayoutProject({ layout, dir, scheme, mode, texture, toggle: true });
console.log(`[1/3] projeto em ${dir} (layout ${layout.id}, esquema ${scheme}, modo ${mode}, textura ${texture})`);

// Tipos: o tsconfig do projeto cobre src/ (onde o layout acabou de ser copiado).
const errors = typecheckProject(dir);
if (errors) {
  console.error("[2/3] tsc encontrou erros:\n" + errors);
  process.exit(1);
}
console.log("[2/3] tsc: sem erros");

if (flag("check-only")) process.exit(0);

buildProject(dir);

const child = spawn(join(ROOT, "node_modules", ".bin", "vite"), ["preview", "--port", String(port), "--strictPort", "--host", "127.0.0.1"], {
  cwd: dir,
  detached: true,
  stdio: "ignore",
});
child.unref();
writeFileSync(pidFile, String(child.pid));
console.log(`[3/3] preview em http://127.0.0.1:${port}  (parar: npx tsx scripts/preview-layout.ts --stop --port ${port})`);
