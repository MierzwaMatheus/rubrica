/**
 * Sessão do login: fica num arquivo local fora do repositório
 * (`~/.config/rubrica/<projeto>.json`, permissão 600). O MCP só lê e renova o token;
 * a senha não é guardada.
 */
import { chmodSync, existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export interface Session {
  convexUrl: string;
  email: string;
  token: string;
  refreshToken: string;
  savedAt: number;
}

export function configDir(env: Record<string, string | undefined> = process.env): string {
  if (env.RUBRICA_CONFIG_DIR) return env.RUBRICA_CONFIG_DIR;
  const base = env.XDG_CONFIG_HOME || join(homedir(), ".config");
  return join(base, "rubrica");
}

/** Uma sessão por projeto e por Convex (dev e produção têm logins separados). */
export function sessionPath(project: string, convexUrl: string, env: Record<string, string | undefined> = process.env): string {
  const host = new URL(convexUrl).hostname.split(".")[0]!.replace(/[^a-z0-9-]/gi, "_");
  return join(configDir(env), `${project}__${host}.json`);
}

export class SessionStore {
  constructor(readonly path: string) {}

  read(): Session | null {
    try {
      const data = JSON.parse(readFileSync(this.path, "utf8")) as Partial<Session>;
      if (typeof data.token === "string" && typeof data.refreshToken === "string" && typeof data.email === "string") return data as Session;
    } catch {
      /* sem sessão */
    }
    return null;
  }

  /** Grava por arquivo temporário + rename (outro processo nunca lê pela metade). */
  write(session: Session): void {
    const dir = join(this.path, "..");
    mkdirSync(dir, { recursive: true, mode: 0o700 });
    try {
      chmodSync(dir, 0o700);
    } catch {
      /* diretório de outra pessoa ou sistema sem chmod */
    }
    const tmp = `${this.path}.${process.pid}.tmp`;
    writeFileSync(tmp, JSON.stringify(session), { mode: 0o600 });
    chmodSync(tmp, 0o600);
    renameSync(tmp, this.path);
  }

  clear(): boolean {
    if (!existsSync(this.path)) return false;
    rmSync(this.path, { force: true });
    return true;
  }
}

/** Claims do JWT (sem conferir a assinatura: quem confere é o Convex). */
export function jwtClaims(token: string): { exp?: number; sub?: string } {
  try {
    const part = token.split(".")[1];
    if (!part) return {};
    return JSON.parse(Buffer.from(part, "base64url").toString("utf8")) as { exp?: number; sub?: string };
  } catch {
    return {};
  }
}
