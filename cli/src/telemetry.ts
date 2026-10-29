/**
 * Telemetria anônima do CLI: quando um comando dá certo, manda as escolhas feitas
 * (layout, cores, plugins…) para o Rubrica saber o que mais se usa. Nada de nome,
 * e-mail, endereço do site, conteúdo ou chaves. O projeto ganha um id aleatório
 * (no rubrica.json) só para ligar os eventos do mesmo site: criou, configurou, publicou.
 *
 * Desliga com `npx create-rubrica telemetria desligar` (fica gravado no projeto),
 * `--sem-telemetria`, `RUBRICA_TELEMETRIA=0` ou `DO_NOT_TRACK=1`. Em CI e nos testes, nunca manda.
 *
 * Nada aqui pode quebrar ou atrasar um comando: qualquer erro vira silêncio e o envio
 * tem tempo-limite curto. O que vai em cada evento: docs/guia/telemetria.md.
 */
import * as nodeFsPromises from "node:fs/promises";
import * as nodeCrypto from "node:crypto";
import * as path from "node:path";
import { PLUGIN_PRESETS } from "./plugins.js";
import { packageManagerFromUserAgent } from "./utils/packageManager.js";

export const TELEMETRY_URL = "https://necessary-chihuahua-712.convex.site/v1/eventos";
export const TELEMETRY_DOCS = "https://userubrica.vercel.app/docs/guia/telemetria";
export const TELEMETRY_TIMEOUT_MS = 2000;
const FORMAT_VERSION = 1;

declare const __CLI_VERSION__: string | undefined;
/** Versão do CLI, injetada no build (tsup.config.ts). */
export const CLI_VERSION = typeof __CLI_VERSION__ === "string" ? __CLI_VERSION__ : "0.0.0";

export type TelemetryType = "criacao" | "setup" | "publicacao" | "atualizacao" | "config";

export interface TelemetryFs {
  readFile: (path: string, encoding: string) => Promise<string>;
  writeFile: (path: string, data: string) => Promise<void>;
}

export interface TelemetryDeps {
  env?: Record<string, string | undefined>;
  fs?: TelemetryFs;
  fetch?: (url: string, init: RequestInit) => Promise<Response>;
  /** Mostra o aviso da primeira vez. */
  notice?: (message: string) => void;
  randomUUID?: () => string;
  platform?: string;
  nodeVersion?: string;
  cliVersion?: string;
  userAgent?: string;
  /** Gerenciador que o comando usou, quando ele sabe (o create). Senão, vem dos lockfiles. */
  packageManager?: string;
}

interface TelemetryState {
  projeto?: string;
  ativa?: boolean;
}

const OFF_VALUES = ["0", "false", "nao", "não", "off", "desligada", "desligado"];
const isOn = (value: string | undefined) => value !== undefined && value !== "" && !["0", "false"].includes(value.toLowerCase());

export const NOTICE =
  "O Rubrica manda, sem dados pessoais, as escolhas feitas no CLI (layout, cores, plugins) " +
  "para saber o que as pessoas mais usam.\n" +
  `Para desligar neste projeto: npx create-rubrica telemetria desligar. O que vai: ${TELEMETRY_DOCS}`;

/** Por que não manda (para o `telemetria status`), ou null quando manda. */
export function telemetryOff(env: Record<string, string | undefined>, state?: { telemetria?: unknown }): string | null {
  const own = env.RUBRICA_TELEMETRIA;
  if (own !== undefined && OFF_VALUES.includes(own.toLowerCase())) return "desligada por RUBRICA_TELEMETRIA";
  if (isOn(env.DO_NOT_TRACK)) return "desligada por DO_NOT_TRACK";
  if (isOn(env.CI)) return "desligada em CI";
  if (env.VITEST) return "desligada nos testes";
  if ((state?.telemetria as TelemetryState | undefined)?.ativa === false) return "desligada neste projeto";
  return null;
}

/** Pacote pronto que bate com os plugins escolhidos, ou `custom`. */
export function pluginPreset(plugins: string[]): string {
  const chosen = [...new Set(plugins)].sort().join(",");
  return PLUGIN_PRESETS.find((p) => [...p.plugins].sort().join(",") === chosen)?.id ?? "custom";
}

/** Plugins ligados de um `{ id: ligado? }`. */
export const enabledPlugins = (record: Record<string, boolean>) =>
  Object.entries(record).filter(([, on]) => on).map(([id]) => id);

function defaults(deps: TelemetryDeps) {
  const env = deps.env ?? process.env;
  return {
    env,
    fs: deps.fs ?? (nodeFsPromises as unknown as TelemetryFs),
    fetch: deps.fetch ?? ((url: string, init: RequestInit) => fetch(url, init)),
    notice: deps.notice ?? (() => undefined),
    randomUUID: deps.randomUUID ?? (() => nodeCrypto.randomUUID()),
    platform: deps.platform ?? process.platform,
    nodeVersion: deps.nodeVersion ?? process.versions.node,
    cliVersion: deps.cliVersion ?? CLI_VERSION,
    userAgent: deps.userAgent ?? env.npm_config_user_agent,
  };
}

async function readJson(fs: TelemetryFs, file: string): Promise<Record<string, unknown> | null> {
  try {
    return JSON.parse(await fs.readFile(file, "utf-8")) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function packageManager(fs: TelemetryFs, projectDir: string, userAgent: string | undefined): Promise<string> {
  const has = (f: string) => fs.readFile(path.join(projectDir, f), "utf-8").then(() => true, () => false);
  // O template já vem com pnpm-lock.yaml: um package-lock.json só existe se a pessoa usou npm.
  if (await has("package-lock.json")) return "npm";
  if (await has("pnpm-lock.yaml")) return "pnpm";
  return packageManagerFromUserAgent(userAgent);
}

/**
 * Manda um evento do projeto em `projectDir`. Sempre resolve, nunca lança.
 * `dados` segue o formato do coletor para cada tipo (veja docs/guia/telemetria.md).
 */
export async function track(
  projectDir: string,
  tipo: TelemetryType,
  dados: Record<string, unknown>,
  deps: TelemetryDeps = {}
): Promise<void> {
  try {
    const d = defaults(deps);
    const file = path.join(projectDir, "rubrica.json");
    const state = await readJson(d.fs, file);
    if (!state || telemetryOff(d.env, state)) return;

    const current = (state.telemetria ?? {}) as TelemetryState;
    let projeto = current.projeto;
    if (!projeto) {
      projeto = d.randomUUID();
      await d.fs.writeFile(file, JSON.stringify({ ...state, telemetria: { projeto, ativa: true } }, null, 2));
      d.notice(NOTICE);
    }

    const body = {
      v: FORMAT_VERSION,
      tipo,
      projeto,
      cli: d.cliVersion.replace(/^v/, ""),
      template: String(state.version ?? "0.0.0").replace(/^v/, ""),
      so: d.platform,
      node: parseInt(d.nodeVersion.split(".")[0] ?? "0", 10),
      gerenciador: deps.packageManager ?? (await packageManager(d.fs, projectDir, d.userAgent)),
      dados,
    };
    await d.fetch(d.env.RUBRICA_TELEMETRIA_URL || TELEMETRY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TELEMETRY_TIMEOUT_MS),
    });
  } catch {
    // telemetria nunca atrapalha o comando
  }
}

/** `telemetria ligar|desligar`: grava a escolha no rubrica.json do projeto. */
export async function setTelemetry(projectDir: string, on: boolean, deps: Pick<TelemetryDeps, "fs"> = {}): Promise<void> {
  const fs = deps.fs ?? (nodeFsPromises as unknown as TelemetryFs);
  const file = path.join(projectDir, "rubrica.json");
  const state = JSON.parse(await fs.readFile(file, "utf-8")) as Record<string, unknown>;
  const current = (state.telemetria ?? {}) as TelemetryState;
  await fs.writeFile(file, JSON.stringify({ ...state, telemetria: { ...current, ativa: on } }, null, 2));
}
