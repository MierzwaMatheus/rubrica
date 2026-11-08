/**
 * Descoberta do projeto e do Convex dele. Nada aqui imprime segredos: o `.env.local`
 * é lido só para achar a URL e o tipo do deployment (dev, prod, local).
 */
import { existsSync, readFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";

export type Environment = "producao" | "desenvolvimento" | "local" | "informado" | "desconhecido";

export interface ProjectConfig {
  /** Raiz do projeto (onde está o `rubrica.json` ou o `rubrica.config.ts`), se achada. */
  root: string | null;
  /** Nome curto, usado no arquivo da sessão. */
  name: string;
  convexUrl: string;
  /** De onde veio a URL (sem valores secretos). */
  source: string;
  environment: Environment;
}

export class ConfigError extends Error {}

export interface ResolveOptions {
  cwd?: string;
  env?: Record<string, string | undefined>;
  /** Usa o Convex do site publicado (`producao.convexUrl` do `rubrica.json`). */
  production?: boolean;
}

const ROOT_MARKERS = ["rubrica.json", "rubrica.config.ts", join("convex", "rubrica.config.ts")];

export function findProjectRoot(start: string, env: Record<string, string | undefined> = process.env): string | null {
  if (env.RUBRICA_PROJECT) return resolve(env.RUBRICA_PROJECT);
  let dir = resolve(start);
  for (;;) {
    if (ROOT_MARKERS.some((m) => existsSync(join(dir, m)))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

/** Lê um `.env` simples (CHAVE=valor, aspas opcionais, comentários com #). */
export function parseEnvFile(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const m = /^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (!m) continue;
    let value = m[2]!.trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    else value = value.replace(/\s+#.*$/, "");
    out[m[1]!] = value;
  }
  return out;
}

function readFileOrNull(path: string): string | null {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return null;
  }
}

export function environmentOf(deployment: string | undefined): Environment {
  const kind = (deployment ?? "").split(":", 1)[0];
  if (kind === "prod") return "producao";
  if (kind === "dev") return "desenvolvimento";
  if (kind === "anonymous" || kind === "local") return "local";
  return "desconhecido";
}

function slug(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/^@[^/]+\//, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "rubrica"
  );
}

function projectName(root: string | null, url: string): string {
  if (root) {
    for (const file of ["rubrica.json", "package.json"]) {
      const text = readFileOrNull(join(root, file));
      if (!text) continue;
      try {
        const name = (JSON.parse(text) as { name?: unknown }).name;
        if (typeof name === "string" && name) return slug(name);
      } catch {
        /* segue para o próximo */
      }
    }
    return slug(basename(root));
  }
  return slug(new URL(url).hostname.split(".")[0] ?? "rubrica");
}

function cleanUrl(url: string): string {
  const trimmed = url.trim().replace(/\/+$/, "");
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new ConfigError(`Endereço do Convex inválido: "${trimmed}". Use algo como https://nome.convex.cloud`);
  }
  if (parsed.protocol !== "https:" && parsed.hostname !== "127.0.0.1" && parsed.hostname !== "localhost") {
    throw new ConfigError("O endereço do Convex precisa ser https (ou localhost, no Convex local).");
  }
  return trimmed;
}

/** Acha o projeto e a URL do Convex. Ordem: RUBRICA_CONVEX_URL, produção (se pedida), `.env.local`, variáveis, `rubrica.config.ts`. */
export function resolveProject(options: ResolveOptions = {}): ProjectConfig {
  const env = options.env ?? process.env;
  const root = findProjectRoot(options.cwd ?? process.cwd(), env);
  const wantsProduction = options.production || /^(producao|produção|prod)$/i.test(env.RUBRICA_AMBIENTE ?? "");

  let url: string | undefined;
  let source = "";
  let environment: Environment = "desconhecido";

  if (env.RUBRICA_CONVEX_URL?.trim()) {
    url = env.RUBRICA_CONVEX_URL;
    source = "variável RUBRICA_CONVEX_URL";
    environment = "informado";
  } else if (wantsProduction) {
    const text = root ? readFileOrNull(join(root, "rubrica.json")) : null;
    let prod: string | undefined;
    try {
      prod = text ? ((JSON.parse(text) as { producao?: { convexUrl?: string } }).producao?.convexUrl ?? undefined) : undefined;
    } catch {
      prod = undefined;
    }
    if (!prod) {
      throw new ConfigError(
        "O projeto não tem o endereço do site publicado (producao.convexUrl no rubrica.json). Publique com `npx create-rubrica publicar` ou defina RUBRICA_CONVEX_URL.",
      );
    }
    url = prod;
    source = "rubrica.json (site publicado)";
    environment = "producao";
  } else {
    const local = root ? readFileOrNull(join(root, ".env.local")) : null;
    const vars = local ? parseEnvFile(local) : {};
    const found = vars.CONVEX_URL || vars.VITE_CONVEX_URL || vars.PUBLIC_CONVEX_URL;
    if (found) {
      url = found;
      source = ".env.local";
      environment = environmentOf(vars.CONVEX_DEPLOYMENT);
    } else if (env.CONVEX_URL || env.VITE_CONVEX_URL || env.PUBLIC_CONVEX_URL) {
      url = env.CONVEX_URL || env.VITE_CONVEX_URL || env.PUBLIC_CONVEX_URL;
      source = "variável de ambiente CONVEX_URL";
      environment = environmentOf(env.CONVEX_DEPLOYMENT);
    } else if (root) {
      const cfg = readFileOrNull(join(root, "rubrica.config.ts"));
      const m = cfg ? /convexUrl:\s*["']([^"']+)["']/.exec(cfg) : null;
      if (m) {
        url = m[1];
        source = "rubrica.config.ts";
      }
    }
  }

  if (!url) {
    throw new ConfigError(
      root
        ? `Não achei a URL do Convex em ${root}. Rode \`npx convex dev\` no projeto (ele grava o .env.local) ou defina RUBRICA_CONVEX_URL.`
        : "Não achei o projeto Rubrica (nenhum rubrica.json ou rubrica.config.ts acima desta pasta). Abra o agente dentro do projeto, defina RUBRICA_PROJECT ou RUBRICA_CONVEX_URL.",
    );
  }
  const convexUrl = cleanUrl(url);
  return { root, name: projectName(root, convexUrl), convexUrl, source, environment };
}
