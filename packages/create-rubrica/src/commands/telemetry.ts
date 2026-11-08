import { outro, cancel, log } from "@clack/prompts";
import * as nodeFsPromises from "node:fs/promises";
import * as path from "node:path";
import { detectProject as defaultDetectProject } from "../utils/detectProject.js";
import { setTelemetry, telemetryOff, TELEMETRY_DOCS, type TelemetryFs } from "../telemetry.js";

export interface RunTelemetryDeps {
  cwd?: string;
  /** `ligar`, `desligar` ou nada (mostra como está). */
  action?: string;
  fs?: TelemetryFs & { access: (p: string) => Promise<void> };
  env?: Record<string, string | undefined>;
  detectProject?: typeof defaultDetectProject;
}

/** `npx create-rubrica telemetria [ligar|desligar]`. */
export async function runTelemetry(deps: RunTelemetryDeps = {}): Promise<void> {
  const fs = deps.fs ?? (nodeFsPromises as unknown as NonNullable<RunTelemetryDeps["fs"]>);
  const env = deps.env ?? process.env;
  const detect = deps.detectProject ?? defaultDetectProject;

  let projectDir: string;
  try {
    projectDir = path.dirname(await detect(deps.cwd ?? process.cwd(), fs));
  } catch {
    cancel(
      "Rode este comando na pasta de um projeto Rubrica. " +
        `Para desligar em qualquer lugar, use a variável RUBRICA_TELEMETRIA=0 (ou DO_NOT_TRACK=1). Detalhes: ${TELEMETRY_DOCS}`
    );
    return;
  }

  const action = deps.action;
  if (action === "ligar" || action === "desligar") {
    await setTelemetry(projectDir, action === "ligar", { fs });
    outro(
      action === "ligar"
        ? "Telemetria ligada neste projeto. Obrigado: ajuda a saber o que melhorar no Rubrica."
        : "Telemetria desligada neste projeto. O CLI não manda mais nada daqui."
    );
    return;
  }
  if (action !== undefined) {
    cancel(`Uso: npx create-rubrica telemetria [ligar|desligar]`);
    return;
  }

  let state: Record<string, unknown> = {};
  try {
    state = JSON.parse(await fs.readFile(path.join(projectDir, "rubrica.json"), "utf-8")) as Record<string, unknown>;
  } catch {
    state = {};
  }
  const off = telemetryOff(env, state);
  log.info(off ? `Telemetria ${off}.` : "Telemetria ligada: o CLI manda, sem dados pessoais, as escolhas feitas nos comandos.");
  outro(`Para mudar: npx create-rubrica telemetria ${off ? "ligar" : "desligar"}. O que vai: ${TELEMETRY_DOCS}`);
}
