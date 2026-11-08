import { intro, outro, confirm, text, isCancel, cancel, log, spinner } from "@clack/prompts";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { tmpdir } from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { detectProject } from "../utils/detectProject.js";
import { readState } from "../state/readState.js";
import { writeState } from "../state/writeState.js";
import { getLatestVersion as defaultGetLatestVersion, downloadRelease as defaultDownloadRelease } from "../utils/download.js";
import { buildPristine } from "../utils/pristine.js";
import { planUpdate, applyPlan, formatPlan, NEW_SUFFIX } from "../utils/threeWayUpdate.js";
import { checkRequiredEnv as defaultCheckRequiredEnv } from "../utils/checkRequiredEnv.js";
import { track as defaultTrack } from "../telemetry.js";

const execFileAsync = promisify(execFile);

export interface UpdateOptions {
  /** Versão de onde o projeto foi criado (sobrepõe o rubrica.json). */
  from?: string;
  /** Versão de destino (padrão: a release mais recente). */
  to?: string;
  /** Só mostra o que mudaria. */
  dryRun?: boolean;
  /** Não pergunta nada (aceita o plano). */
  yes?: boolean;
}

export interface RunUpdateDeps {
  cwd?: string;
  options?: UpdateOptions;
  getLatestVersion?: typeof defaultGetLatestVersion;
  downloadRelease?: typeof defaultDownloadRelease;
  checkRequiredEnv?: typeof defaultCheckRequiredEnv;
  track?: typeof defaultTrack;
}

/** Versões antigas do CLI gravavam sempre "0.1.0" no rubrica.json, qualquer que fosse a versão baixada. */
const LEGACY_PLACEHOLDER_VERSION = "0.1.0";

function normalizeVersion(version: string): string {
  return version.trim().replace(/^v/, "");
}

function parseMajor(version: string): number {
  const major = parseInt(normalizeVersion(version).split(".")[0] ?? "0", 10);
  return isNaN(major) ? 0 : major;
}

async function gitStatus(projectDir: string): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync("git", ["status", "--porcelain"], { cwd: projectDir });
    return stdout.trim();
  } catch {
    return null; // não é um repositório git
  }
}

export async function runUpdate(deps: RunUpdateDeps = {}): Promise<void> {
  const cwd = deps.cwd ?? process.cwd();
  const opts = deps.options ?? {};
  const getLatestVersionFn = deps.getLatestVersion ?? defaultGetLatestVersion;
  const download = deps.downloadRelease ?? defaultDownloadRelease;
  const checkRequiredEnvFn = deps.checkRequiredEnv ?? defaultCheckRequiredEnv;
  const ask = !opts.yes;

  intro("Rubrica Update");

  try {
    await execFileAsync("git", ["--version"]);
  } catch {
    cancel("O update precisa do git instalado (ele é usado para mesclar suas mudanças com a versão nova).");
    return;
  }

  const projectDir = path.dirname(await detectProject(cwd));
  const state = await readState(projectDir);

  // 1. De qual versão o projeto saiu
  let fromVersion = normalizeVersion(opts.from ?? state.version);
  if (!opts.from && fromVersion === LEGACY_PLACEHOLDER_VERSION) {
    log.warn(
      `O rubrica.json diz ${LEGACY_PLACEHOLDER_VERSION}, mas versões antigas do CLI sempre gravavam esse número.\n` +
      `Para preservar suas personalizações, o update precisa saber com qual versão o projeto foi criado ` +
      `(veja a data de criação e compare com https://github.com/MierzwaMatheus/rubrica/releases).`
    );
    if (!ask) {
      cancel("Informe a versão de origem com --from <versão>.");
      return;
    }
    const answer = await text({
      message: "Com qual versão o projeto foi criado?",
      placeholder: "ex.: 0.3.12",
      validate: (v) => (/^v?\d+\.\d+\.\d+$/.test(v.trim()) ? undefined : "Use o formato 0.3.12"),
    });
    if (isCancel(answer)) {
      cancel("Atualização cancelada.");
      return;
    }
    fromVersion = normalizeVersion(answer);
  }

  // 2. Para qual versão
  const toVersion = normalizeVersion(opts.to ?? (await getLatestVersionFn()));
  if (fromVersion === toVersion) {
    outro(`Já está na versão mais recente (${toVersion}).`);
    return;
  }

  // 3. Segurança: avisar sobre mudanças não commitadas
  const status = await gitStatus(projectDir);
  if (!opts.dryRun) {
    if (status === null) {
      log.warn("Este projeto não está num repositório git. Recomendado: faça um backup antes, para poder desfazer.");
    } else if (status !== "") {
      log.warn("Há mudanças não commitadas. Recomendado: faça commit antes, para poder desfazer o update com o git.");
    }
  }

  if (parseMajor(toVersion) > parseMajor(fromVersion)) {
    log.warn(
      `Atualização de versão major: ${fromVersion} → ${toVersion}.\n` +
      `Leia o guia de atualização nas notas da release antes de publicar.`
    );
  }

  // 4. Montar as duas versões e calcular o plano
  const workDir = await fs.mkdtemp(path.join(tmpdir(), "rubrica-update-"));
  const baseDir = path.join(workDir, "base");
  const nextDir = path.join(workDir, "next");
  let packageName: string | undefined;
  try {
    packageName = (JSON.parse(await fs.readFile(path.join(projectDir, "package.json"), "utf-8")) as { name?: string }).name;
  } catch {
    packageName = undefined;
  }

  const s = spinner();
  try {
    s.start(`Baixando ${fromVersion} e ${toVersion}`);
    await buildPristine({ dir: baseDir, version: fromVersion, state, packageName, download });
    await buildPristine({ dir: nextDir, version: toVersion, state, packageName, download });
    s.stop("Versões baixadas");

    s.start("Comparando com o seu projeto");
    const actions = await planUpdate({ base: baseDir, next: nextDir, project: projectDir });
    s.stop("Comparação concluída");

    log.info(`${fromVersion} → ${toVersion}\n\n${formatPlan(actions)}`);

    if (opts.dryRun) {
      outro("Simulação: nada foi gravado.");
      return;
    }

    if (ask) {
      const proceed = await confirm({ message: `Aplicar a atualização para ${toVersion}?` });
      if (isCancel(proceed) || !proceed) {
        cancel("Atualização cancelada.");
        return;
      }
    }

    await applyPlan(projectDir, actions);
    await writeState(projectDir, { version: toVersion });

    // 5. Próximos passos
    const changed = actions.filter((a) => ["update", "add", "remove", "merge"].includes(a.kind)).map((a) => a.file);
    const conflicts = actions.filter((a) => a.kind === "conflict");
    const steps: string[] = [];
    if (changed.includes("package.json") || actions.some((a) => a.kind === "lockfile")) {
      steps.push("Instale as dependências: pnpm install (ou npm install)");
    }
    if (changed.some((f) => f.startsWith("convex/"))) {
      steps.push("Publique o backend: npx convex dev --once (dev) e, depois de testar, npx convex deploy (produção)");
    }
    if (conflicts.length) {
      steps.push(
        `Revise ${conflicts.length} arquivo(s) com conflito: compare cada um com o ${NEW_SUFFIX} ao lado, ` +
        `leve o que quiser da versão nova e apague o ${NEW_SUFFIX}`
      );
    }
    steps.push("Rode o site (pnpm dev) e confira antes de publicar");

    const missingVars = await checkRequiredEnvFn(projectDir, fs as unknown as Parameters<typeof defaultCheckRequiredEnv>[1]);
    if (missingVars.length > 0) {
      log.warn(
        `Variáveis de ambiente faltando no Convex:\n` +
        missingVars.map((v) => `  • ${v.name} — ${v.description}`).join("\n")
      );
    }

    await (deps.track ?? defaultTrack)(
      projectDir,
      "atualizacao",
      { de: fromVersion, para: toVersion, conflitos: conflicts.length, arquivos: changed.length },
      { notice: (message) => log.info(message) }
    );

    outro(`Atualizado para ${toVersion}.\n\nPróximos passos:\n${steps.map((st, i) => `  ${i + 1}. ${st}`).join("\n")}`);
  } finally {
    await fs.rm(workDir, { recursive: true, force: true });
  }
}
