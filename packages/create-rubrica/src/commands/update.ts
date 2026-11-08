/**
 * `update [--dry-run] [--yes] [--para <versão>]`: sobe `@rubrica/core` e o tema,
 * regenera o convex/ (gerado, não editado), lista as migrações de dados da versão e
 * avisa dos componentes ejetados cujo original mudou (decisão 20). Um projeto por vez.
 */
import { readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "../utils/args.js";
import { convexRun, deploymentLabel, type ConvexContext } from "../utils/convex.js";
import { readEnvLocal } from "../utils/env.js";
import { errorOutput, run as defaultRun, tail, type Runner } from "../utils/exec.js";
import { projectPackageManager, writeFiles } from "../utils/fs.js";
import { runScript } from "../utils/packageManager.js";
import { CORE_MODULES } from "../core-manifest.js";
import { readConvexDir } from "../project/disk.js";
import { installedVersion, loadInstalledCore, type InstalledCore } from "../project/introspect.js";
import { formatPlan, planUpdate, type PackageBump, type UpdatePlan } from "../project/update.js";
import { findProjectDir, readState, updateState } from "../state.js";
import { getTheme, themePackage } from "../themes.js";
import { Cancelled, confirm, canAsk, log, note, outro, spinner } from "../ui.js";
import { track } from "../telemetry.js";
import { ejectedStatus } from "./eject.js";

export interface UpdateDeps {
  cwd: string;
  runner?: Runner;
  loadCore?: (projectDir: string) => Promise<InstalledCore>;
}

function isGitClean(runner: Runner, cwd: string): boolean | null {
  try {
    return runner("git", ["status", "--porcelain"], { cwd }).trim() === "";
  } catch {
    return null;
  }
}

function latestVersion(runner: Runner, cwd: string, pkg: string, tag?: string): string | null {
  try {
    return runner("npm", ["view", tag ? `${pkg}@${tag}` : pkg, "version"], { cwd }).trim().split("\n").pop()!.trim() || null;
  } catch {
    return null;
  }
}

/** Monta o plano com o que está instalado agora. */
export async function computeUpdatePlan(projectDir: string, deps: UpdateDeps, target?: string): Promise<{ plan: UpdatePlan; core: InstalledCore | null }> {
  const runner = deps.runner ?? defaultRun;
  const state = readState(projectDir);
  const pkg = JSON.parse(readFileSync(join(projectDir, "package.json"), "utf-8")) as { dependencies?: Record<string, string> };
  const themePkg = themePackage(state.tema);
  const packages: PackageBump[] = ["@rubrica/core", themePkg].map((name) => {
    const spec = pkg.dependencies?.[name] ?? "";
    const from = installedVersion(projectDir, name);
    if (spec.startsWith("link:") || spec.startsWith("file:") || spec.startsWith("workspace:")) return { pkg: name, from, to: from ?? "?", local: true };
    const to = target ?? latestVersion(runner, projectDir, name) ?? from ?? "?";
    return { pkg: name, from, to };
  });
  let core: InstalledCore | null = null;
  try {
    core = await (deps.loadCore ?? loadInstalledCore)(projectDir);
  } catch (err) {
    log.warn(`Não consegui ler o @rubrica/core instalado (${(err as Error).message}): uso a lista de funções deste CLI.`);
  }
  const plan = planUpdate({
    packages,
    modules: core?.modules ?? CORE_MODULES,
    convexOnDisk: readConvexDir(projectDir),
    migrations: core?.migrations ?? [],
    fromVersion: state.version,
    ejected: ejectedStatus(projectDir, state).map((e) => ({ tipo: e.tipo, status: e.status, arquivo: e.entry.arquivo, ...(e.original && { original: e.original }) })),
  });
  return { plan, core };
}

export async function runUpdate(argv: string[], deps: UpdateDeps): Promise<void> {
  const runner = deps.runner ?? defaultRun;
  const args = parseArgs(argv, { values: ["para"], flags: ["dry-run", "yes", "forcar"], aliases: { "-y": "yes" } });
  const projectDir = findProjectDir(deps.cwd);
  const state = readState(projectDir);
  const dryRun = args.flags.has("dry-run");

  const clean = isGitClean(runner, projectDir);
  if (clean === false && !dryRun && !args.flags.has("forcar")) {
    throw new Cancelled("Há mudanças sem commit. Faça commit (ou descarte) antes de atualizar: é o que permite voltar atrás. (Ou --forcar.)");
  }

  const before = await computeUpdatePlan(projectDir, deps, args.values.para);
  note(formatPlan(before.plan), dryRun ? "Plano (nada foi gravado)" : "Plano");
  if (state.temaDesejado && getTheme(state.temaDesejado)?.ported) {
    log.info(`O tema ${state.temaDesejado} já foi portado: troque com npx create-rubrica config --tema ${state.temaDesejado}.`);
  }
  if (dryRun) {
    log.info("A lista do convex/, das migrações e dos ejetados é refeita depois de instalar a versão nova.");
    return;
  }
  if (!args.flags.has("yes") && !(canAsk() && (await confirm("Aplicar a atualização?", true)))) throw new Cancelled();

  // 1. Pacotes.
  const pm = projectPackageManager(projectDir);
  const bumps = before.plan.packages.filter((p) => !p.local && p.to !== "?" && p.to !== p.from);
  const s = spinner();
  if (bumps.length) {
    s.start(`Subindo ${bumps.map((b) => `${b.pkg}@${b.to}`).join(" e ")}...`);
    try {
      runner(pm, [pm === "npm" ? "install" : "add", ...bumps.map((b) => `${b.pkg}@^${b.to}`)], { cwd: projectDir });
      s.stop("Pacotes atualizados.");
    } catch (err) {
      s.stop("A instalação falhou.");
      throw new Error(`O ${pm} não conseguiu instalar:\n${tail(errorOutput(err))}`);
    }
  }

  // 2. convex/ com as funções do núcleo agora instalado.
  const after = await computeUpdatePlan(projectDir, deps, args.values.para);
  writeFiles(projectDir, after.plan.files);
  for (const p of after.plan.convex.remove) rmSync(join(projectDir, p), { force: true });
  const coreVersion = after.core?.version ?? installedVersion(projectDir, "@rubrica/core") ?? state.version;
  updateState(projectDir, { version: coreVersion });
  const changed = after.plan.convex.write.length + after.plan.convex.create.length + after.plan.convex.remove.length;
  log.success(changed ? `convex/ regenerado (${changed} arquivo(s)).` : "convex/ já estava em dia.");

  // 3. Migrações de dados: no Convex de desenvolvimento.
  if (after.plan.migrations.length) {
    if (readEnvLocal(projectDir).CONVEX_DEPLOYMENT) {
      const ctx: ConvexContext = { projectDir, runner };
      log.info(`Publicando o backend e rodando ${after.plan.migrations.length} migração(ões) no Convex: ${deploymentLabel(ctx)}`);
      runner("npx", ["convex", "dev", "--once"], { cwd: projectDir });
      for (const m of after.plan.migrations) {
        convexRun(ctx, m.fn, m.args ?? {});
        log.success(`Migração ${m.id} aplicada no desenvolvimento.`);
      }
      log.warn("Na produção, rode as mesmas migrações depois de publicar, com o ok de quem cuida do site: npx convex run --prod <função>.");
    } else {
      log.warn("Projeto sem Convex ligado: rode as migrações listadas acima depois do setup.");
    }
  }

  // 4. Ejetados.
  for (const e of after.plan.ejectedChanged) log.warn(`Ejetado ${e.tipo}: ${e.status === "mudou" ? `o original mudou; compare ${e.arquivo} com ${e.original}` : "o original não existe mais"}.`);

  await track(projectDir, "atualizacao", { de: state.version, para: coreVersion, migracoes: after.plan.migrations.length, ejetadosMudaram: after.plan.ejectedChanged.length });
  const pushed = after.plan.migrations.length > 0 && !!readEnvLocal(projectDir).CONVEX_DEPLOYMENT;
  outro(
    [
      `Atualizado para o @rubrica/core ${coreVersion}. Confira com ${runScript(pm, "check")}, ${runScript(pm, "test")} e ${runScript(pm, "build")}, e faça o commit.`,
      ...(changed && !pushed ? ["O backend (convex/) mudou: publique no Convex de desenvolvimento com npx convex dev --once."] : []),
      "O site no ar só muda quando você publicar.",
    ].join("\n"),
  );
}
