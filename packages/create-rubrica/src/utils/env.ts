/** Leitura de arquivos `.env` (só os nomes e valores; nunca mostrados por inteiro). */
import { readFileSync } from "node:fs";
import { join } from "node:path";

export function parseEnv(content: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    out[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim().replace(/^"(.*)"$/, "$1");
  }
  return out;
}

/** Variáveis do `.env.local` (vazio se não existir). */
export function readEnvLocal(projectDir: string): Record<string, string> {
  try {
    return parseEnv(readFileSync(join(projectDir, ".env.local"), "utf-8"));
  } catch {
    return {};
  }
}

/** `dev:nome-123` → "nome-123 (desenvolvimento)". O nome do deployment não é segredo. */
export function describeDeployment(deployment: string | undefined): string {
  if (!deployment) return "nenhum (o projeto ainda não foi ligado ao Convex)";
  const [kind, name] = deployment.includes(":") ? deployment.split(":", 2) : ["", deployment];
  const label = kind === "prod" ? "PRODUÇÃO" : kind === "dev" ? "desenvolvimento" : kind === "preview" ? "prévia" : kind || "local";
  return `${(name ?? "").split("#")[0]?.trim()} (${label})`;
}
