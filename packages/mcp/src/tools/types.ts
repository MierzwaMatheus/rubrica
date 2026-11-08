import type { CollectionName } from "@rubrica/core";
import type { Permission } from "@rubrica/core/convex/roles";
import type { ProjectConfig } from "../config";
import type { Change } from "../diff";
import type { RubricaClient } from "../client";
import type { JsonSchema } from "../schema/json-schema";
import type { SiteState } from "../state";

export interface ToolAccess {
  /** `false`: funciona sem login (login, whoami, logout, catálogo). */
  login?: false;
  /** Papéis com qualquer uma destas permissões (ver `convex/lib/roles`). */
  permission?: Permission | readonly Permission[];
  /** Plugin que precisa estar ligado. */
  plugin?: string;
  /** Módulo opcional do backend que precisa existir. */
  module?: string;
  /** Coleção (liga o plugin dela). */
  collection?: CollectionName;
}

export interface SchemaContext {
  state: SiteState;
  /** `false`: o bloco vira genérico (usado só na validação local dos argumentos). */
  typed: boolean;
}

/** O que as ferramentas enxergam do servidor. */
export interface RuntimeApi {
  project: ProjectConfig;
  options: { defaultDryRun: boolean; allowPasswordArg: boolean };
  hasSession(): boolean;
  signIn(email: string, password: string): Promise<{ email: string }>;
  signOut(): Promise<boolean>;
  /** Recarrega papel, configurações e plugins e avisa o agente que a lista de ferramentas mudou. */
  refresh(): Promise<SiteState>;
  /** Ferramentas visíveis agora (para `whoami`). */
  toolNames(): string[];
}

export interface ToolContext {
  client: RubricaClient;
  state: SiteState;
  dryRun: boolean;
  runtime: RuntimeApi;
}

export interface ToolDef {
  name: string;
  title: string;
  description: string;
  access: ToolAccess;
  /** Grava: ganha o argumento `dryRun`. */
  write?: boolean;
  /** Apaga ou despublica. */
  destructive?: boolean;
  input(sc: SchemaContext): JsonSchema;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler(args: any, ctx: ToolContext): Promise<unknown>;
}

export interface FieldProblem {
  path: string;
  message: string;
  blockId?: string;
}

/** Entrada inválida: volta ao agente com os erros por campo. */
export class ToolInputError extends Error {
  constructor(
    message: string,
    readonly problems: FieldProblem[] = [],
  ) {
    super(message);
    this.name = "ToolInputError";
  }
}

export interface WritePlan {
  summary: string;
  changes?: Change[];
  warnings?: string[];
  /** Dado extra para a prévia (ordem dos blocos, tamanho do arquivo). */
  info?: Record<string, unknown>;
  apply(): Promise<unknown>;
}

/** Prévia (dryRun) ou gravação, no mesmo formato. */
export async function commit(ctx: ToolContext, plan: WritePlan): Promise<Record<string, unknown>> {
  const base = {
    summary: plan.summary,
    ...(plan.changes ? { changes: plan.changes } : {}),
    ...(plan.warnings?.length ? { warnings: plan.warnings } : {}),
    ...plan.info,
  };
  if (ctx.dryRun) {
    return {
      applied: false,
      dryRun: true,
      ...base,
      next: plan.changes && plan.changes.length === 0 ? "Nada mudaria." : "Nada foi gravado. Se a prévia estiver certa, repita a mesma chamada com dryRun: false.",
    };
  }
  const result = await plan.apply();
  return { applied: true, ...base, ...(result === undefined || result === null ? {} : { result }) };
}

export const DRY_RUN_PROP = (defaultValue: boolean): JsonSchema => ({
  type: "boolean",
  default: defaultValue,
  description: defaultValue
    ? "Padrão true: só mostra a prévia (antes/depois por campo e idioma) e NÃO grava. Mande false para gravar, depois de conferir a prévia."
    : "Mande true para ver só a prévia (antes/depois por campo e idioma), sem gravar. Padrão false: grava.",
});
