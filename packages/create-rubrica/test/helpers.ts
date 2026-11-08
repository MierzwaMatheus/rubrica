import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { RubricaState } from "../src/state";

/** Raiz do monorepo. */
export const REPO = fileURLToPath(new URL("../../../", import.meta.url));
export const repo = (...p: string[]) => join(REPO, ...p);

export const tmp = (prefix = "rubrica-cli-") => mkdtempSync(join(tmpdir(), prefix));

export function sampleState(patch: Partial<RubricaState> = {}): RubricaState {
  return {
    rubrica: 2,
    version: "2.0.0-alpha.0",
    tipo: "pessoal",
    tema: "padrao",
    identidade: { nome: "Ana Souza", url: "https://ana.dev", descricao: "Portfólio da Ana", autor: "Ana Souza", email: "ana@exemplo.dev" },
    idiomas: { lista: ["pt-BR", "en"], principal: "pt-BR" },
    aparencia: { esquema: "neon", modo: "dark", alternancia: true },
    plugins: { blog: true, portfolio: true },
    ...patch,
  };
}
