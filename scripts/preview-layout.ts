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
import { execFileSync, spawn } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { applyLayout } from "../cli/src/transforms/applyLayout";
import { applyTheme } from "../cli/src/transforms/applyTheme";
import { applyAppearance } from "../cli/src/transforms/applyAppearance";
import { applyFont } from "../cli/src/transforms/applyFont";
import { getLayout, type ColorMode, type Texture } from "../cli/src/layouts";

const ROOT = resolve(import.meta.dirname, "..");

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
rmSync(dir, { recursive: true, force: true });
mkdirSync(dir, { recursive: true });

// Cópia do repositório sem dependências nem artefatos (node_modules vira link).
execFileSync("rsync", [
  "-a",
  "--exclude=node_modules", "--exclude=.git", "--exclude=dist", "--exclude=reports",
  "--exclude=.playwright-mcp", "--exclude=cli", "--exclude=templates", "--exclude=docs",
  "--exclude=.stryker-tmp", "--exclude=.env.local",
  `${ROOT}/`, `${dir}/`,
]);
symlinkSync(join(ROOT, "node_modules"), join(dir, "node_modules"));

const fsMod = {
  ...(await import("node:fs/promises")),
  exists: async (p: string) => existsSync(p),
} as never;

await applyLayout(layout.id, { projectDir: dir, templatesDir: join(ROOT, "templates") }, fsMod);
const cssPath = join(dir, "src", "index.css");
const htmlPath = join(dir, "index.html");
await applyTheme({ preset: scheme }, cssPath, fsMod);
await applyAppearance({ colorMode: mode, colorModeToggle: true, texture }, htmlPath, fsMod);
await applyFont({ fontSans: layout.fonts.sans[0] ?? "Inter", fontMono: layout.fonts.mono }, { css: cssPath, html: htmlPath }, fsMod);

console.log(`[1/3] projeto em ${dir} (layout ${layout.id}, esquema ${scheme}, modo ${mode}, textura ${texture})`);

// Tipos: o tsconfig do projeto cobre src/ (onde o layout acabou de ser copiado).
try {
  execFileSync(join(ROOT, "node_modules", ".bin", "tsc"), ["--noEmit", "-p", join(dir, "tsconfig.json")], {
    cwd: dir,
    stdio: "pipe",
  });
  console.log("[2/3] tsc: sem erros");
} catch (e) {
  const out = String((e as { stdout?: Buffer }).stdout ?? e);
  console.error("[2/3] tsc encontrou erros:\n" + out.replaceAll(`${dir}/`, ""));
  process.exit(1);
}

if (flag("check-only")) process.exit(0);

execFileSync(join(ROOT, "node_modules", ".bin", "vite"), ["build", "--logLevel", "warn"], {
  cwd: dir,
  stdio: "inherit",
  // Endereço fictício: no build de produção os dados vêm de public/data, mas o app cria o
  // cliente do Convex ao iniciar e quebra sem endereço nenhum.
  env: { ...process.env, NODE_ENV: "production", VITE_CONVEX_URL: process.env.VITE_CONVEX_URL ?? "https://preview-layout.convex.cloud" },
});

const child = spawn(join(ROOT, "node_modules", ".bin", "vite"), ["preview", "--port", String(port), "--strictPort", "--host", "127.0.0.1"], {
  cwd: dir,
  detached: true,
  stdio: "ignore",
});
child.unref();
writeFileSync(pidFile, String(child.pid));
console.log(`[3/3] preview em http://127.0.0.1:${port}  (parar: npx tsx scripts/preview-layout.ts --stop --port ${port})`);
