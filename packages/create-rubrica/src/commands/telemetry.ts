/** `telemetria [ligar|desligar]`: mostra, liga ou desliga a telemetria anônima do projeto. */
import { findProjectDir, readRawState } from "../state.js";
import { setTelemetry, telemetryOff, TELEMETRY_DOCS } from "../telemetry.js";
import { Cancelled, log, outro } from "../ui.js";

export async function runTelemetry(deps: { cwd: string; action?: string; env?: Record<string, string | undefined> }): Promise<void> {
  let projectDir: string;
  try {
    projectDir = findProjectDir(deps.cwd);
  } catch {
    throw new Cancelled(`Rode este comando na pasta de um projeto Rubrica. Para desligar em qualquer lugar: RUBRICA_TELEMETRIA=0 (ou DO_NOT_TRACK=1). Detalhes: ${TELEMETRY_DOCS}`);
  }
  if (deps.action === "ligar" || deps.action === "desligar") {
    await setTelemetry(projectDir, deps.action === "ligar");
    outro(deps.action === "ligar" ? "Telemetria ligada neste projeto. Obrigado: ajuda a saber o que melhorar no Rubrica." : "Telemetria desligada neste projeto. O CLI não manda mais nada daqui.");
    return;
  }
  if (deps.action !== undefined) throw new Cancelled("Uso: npx create-rubrica telemetria [ligar|desligar]");
  const off = telemetryOff(deps.env ?? process.env, readRawState(projectDir));
  log.info(off ? `Telemetria ${off}.` : "Telemetria ligada: o CLI manda, sem dados pessoais, as escolhas feitas nos comandos.");
  outro(`Para mudar: npx create-rubrica telemetria ${off ? "ligar" : "desligar"}. O que vai: ${TELEMETRY_DOCS}`);
}
