/** `ejetar <bloco>`: copia o componente do bloco para `src/overrides/` e passa a usar a cópia. */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { CORE_BLOCKS } from "@rubrica/core/blocks";
import { parseArgs } from "../utils/args.js";
import { writeFiles } from "../utils/fs.js";
import { componentSegment, findComponentSource, findCoreSource, hashText, planEject } from "../project/eject.js";
import { ejectedSection, MARK, replaceSection } from "../project/files.js";
import { findProjectDir, readState, writeState, type EjectedComponent, type RubricaState } from "../state.js";
import { themePackage } from "../themes.js";
import { Cancelled, log, outro } from "../ui.js";
import { track } from "../telemetry.js";

export interface EjectedStatus {
  tipo: string;
  entry: EjectedComponent;
  /** `igual`, `mudou` (o original mudou desde a cópia) ou `sumiu` (não achei o original). */
  status: "igual" | "mudou" | "sumiu";
  /** Onde está o original agora (para comparar). */
  original?: string;
}

/** Ejeta (grava a cópia, o rubrica.json e o astro.config.ts). Devolve o estado novo. */
export function ejectBlock(projectDir: string, state: RubricaState, type: string, force = false): { state: RubricaState; entry: EjectedComponent } {
  if (state.ejetados?.[type] && !force) throw new Cancelled(`O bloco ${type} já foi ejetado (${state.ejetados[type].arquivo}). Para copiar de novo por cima: --forcar.`);
  const source = findComponentSource(projectDir, themePackage(state.tema), type);
  if (!source) throw new Cancelled(`Não achei o componente do bloco ${type} no tema ${themePackage(state.tema)} nem no núcleo (rode pnpm install?).`);
  const plan = planEject(source, type);
  if (!force && existsSync(join(projectDir, plan.folder))) throw new Cancelled(`A pasta ${plan.folder} já existe. Apague-a ou use --forcar.`);
  writeFiles(projectDir, plan.files);
  const entry: EjectedComponent = {
    tipo: type,
    pasta: plan.folder,
    arquivo: plan.entry,
    origem: source.pkg,
    versao: source.version,
    hash: plan.hash,
    arquivoOrigem: plan.sourceFile,
    componente: source.component,
  };
  const next: RubricaState = { ...state, ejetados: { ...(state.ejetados ?? {}), [type]: entry } };
  writeState(projectDir, next);
  const configPath = join(projectDir, "astro.config.ts");
  writeFileSync(configPath, replaceSection(readFileSync(configPath, "utf-8"), MARK.ejectedStart, MARK.ejectedEnd, ejectedSection(next)));
  return { state: next, entry };
}

/** Situação de cada componente ejetado em relação ao original instalado (decisão 20). */
export function ejectedStatus(projectDir: string, state: RubricaState): EjectedStatus[] {
  return Object.entries(state.ejetados ?? {}).map(([tipo, entry]) => {
    // O original é o da origem registrada na ejeção: se o tema passou a implementar o bloco depois,
    // o do núcleo continua sendo o original de quem ejetou do núcleo.
    const source = entry.origem.startsWith("@rubrica/theme-") ? findComponentSource(projectDir, entry.origem, tipo) : findCoreSource(projectDir, tipo);
    const sameOrigin = source && source.pkg === entry.origem && source.component === entry.componente;
    const file = sameOrigin ? source.file : null;
    if (!file || !existsSync(file)) return { tipo, entry, status: "sumiu" as const };
    const hash = hashText(componentSegment(readFileSync(file, "utf-8"), entry.componente));
    return { tipo, entry, status: hash === entry.hash ? ("igual" as const) : ("mudou" as const), original: file };
  });
}

export async function runEject(argv: string[], deps: { cwd: string }): Promise<void> {
  const args = parseArgs(argv, { flags: ["forcar", "listar"] });
  const projectDir = findProjectDir(deps.cwd);
  const state = readState(projectDir);
  if (args.flags.has("listar") || args.positionals.length === 0) {
    const list = ejectedStatus(projectDir, state);
    if (!list.length) log.info("Nenhum componente ejetado.");
    for (const e of list) log.info(`${e.tipo}: ${e.entry.arquivo} (de ${e.entry.origem} ${e.entry.versao}) — ${e.status === "igual" ? "original sem mudanças" : e.status === "mudou" ? `o original mudou: compare com ${e.original}` : "o original não existe mais"}`);
    if (args.positionals.length === 0 && !args.flags.has("listar")) log.info(`Uso: npx create-rubrica ejetar <bloco>. Blocos: ${CORE_BLOCKS.map((b) => b.type).join(", ")}.`);
    return;
  }
  const type = args.positionals[0]!;
  if (!CORE_BLOCKS.some((b) => b.type === type)) {
    throw new Cancelled(`Bloco desconhecido: "${type}". Blocos: ${CORE_BLOCKS.map((b) => b.type).join(", ")}. Blocos próprios já são do projeto (src/blocks/): não precisam de ejeção.`);
  }
  const { entry } = ejectBlock(projectDir, state, type, args.flags.has("forcar"));
  await track(projectDir, "ejecao", { bloco: type, origem: entry.origem.startsWith("@rubrica/theme-") ? "tema" : "nucleo" });
  outro(`Bloco ${type} ejetado de ${entry.origem} para ${entry.pasta}/.\nO site passa a usar ${entry.arquivo}; você cuida dele agora. O update avisa quando o original mudar.`);
}
