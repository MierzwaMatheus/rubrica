/**
 * `verificar` (o `pnpm test` dos projetos): confere que o convex/ gerado bate com o
 * núcleo instalado, que o tema do rubrica.json está instalado e no astro.config.ts, e
 * que os componentes ejetados existem. Termina com erro se algo estiver fora.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { readConvexDir } from "../project/disk.js";
import { installedVersion, loadInstalledCore, type InstalledCore } from "../project/introspect.js";
import { planUpdate } from "../project/update.js";
import { MARK } from "../project/files.js";
import { findProjectDir, readState } from "../state.js";
import { themePackage } from "../themes.js";
import { log, outro } from "../ui.js";
import { ejectedStatus } from "./eject.js";

export async function verifyProject(projectDir: string, loadCore: (dir: string) => Promise<InstalledCore> = loadInstalledCore): Promise<{ problems: string[]; notes: string[] }> {
  const state = readState(projectDir);
  const problems: string[] = [];
  const notes: string[] = [];
  const themePkg = themePackage(state.tema);
  if (!installedVersion(projectDir, themePkg)) problems.push(`O tema ${themePkg} não está instalado (rode pnpm install).`);
  const core = await loadCore(projectDir).catch((err: Error) => {
    problems.push(`Não consegui ler o @rubrica/core instalado: ${err.message}`);
    return null;
  });
  if (core) {
    const plan = planUpdate({ packages: [], modules: core.modules, convexOnDisk: readConvexDir(projectDir), migrations: [], fromVersion: state.version, ejected: [] });
    const stale = [...plan.convex.write, ...plan.convex.create, ...plan.convex.remove];
    if (stale.length) problems.push(`convex/ fora do núcleo instalado (${core.version}): ${stale.join(", ")}. Rode npx create-rubrica update --yes (ele regenera).`);
    if (core.version !== state.version) notes.push(`O rubrica.json diz ${state.version} e o instalado é ${core.version}: rode npx create-rubrica update.`);
  }
  const schema = join(projectDir, "convex/schema.ts");
  if (!existsSync(schema) || !readFileSync(schema, "utf-8").includes("rubricaTables")) problems.push("convex/schema.ts precisa espalhar ...rubricaTables (de @rubrica/core/convex/schema).");
  const configPath = join(projectDir, "astro.config.ts");
  const config = existsSync(configPath) ? readFileSync(configPath, "utf-8") : "";
  for (const mark of Object.values(MARK)) if (!config.includes(mark)) problems.push(`astro.config.ts sem o marcador "${mark}" (o CLI mantém esse trecho).`);
  if (config && !config.includes(JSON.stringify(themePkg))) problems.push(`astro.config.ts não usa o tema do rubrica.json (${themePkg}).`);
  for (const e of ejectedStatus(projectDir, state)) {
    if (!existsSync(join(projectDir, e.entry.arquivo))) problems.push(`Ejetado ${e.tipo}: ${e.entry.arquivo} não existe.`);
    else if (e.status === "mudou") notes.push(`Ejetado ${e.tipo}: o original mudou desde a cópia (compare com ${e.original}).`);
    else if (e.status === "sumiu") notes.push(`Ejetado ${e.tipo}: o original não existe mais no pacote instalado.`);
  }
  return { problems, notes };
}

export async function runVerify(deps: { cwd: string }): Promise<void> {
  const projectDir = findProjectDir(deps.cwd);
  const { problems, notes } = await verifyProject(projectDir);
  for (const n of notes) log.info(n);
  for (const p of problems) log.error(p);
  if (problems.length) {
    process.exitCode = 1;
    outro(`${problems.length} problema(s).`);
    return;
  }
  outro("Projeto em dia com o Rubrica instalado.");
}
