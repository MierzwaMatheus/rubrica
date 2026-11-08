/**
 * O coração do servidor: estado do site, quais ferramentas aparecem e a execução
 * delas (permissão, validação dos argumentos, dryRun, erros).
 */
import { AuthManager, ConvexClient, RubricaError, type RubricaClient } from "./client";
import { ConfigError, type ProjectConfig } from "./config";
import { validateAgainst } from "./schema/validate";
import { loadState, EMPTY_STATE, type SiteState } from "./state";
import { loadProjectTheme, type ThemeInfo } from "./theme";
import { allTools, isVisible, toolSchema } from "./tools";
import { ToolInputError, type RuntimeApi, type ToolDef } from "./tools/types";

export interface RuntimeOptions {
  /** Padrão de `dryRun` nas ferramentas que gravam. Padrão: true. */
  defaultDryRun: boolean;
  /** Aceita `password` na ferramenta `login`. Padrão: false. */
  allowPasswordArg: boolean;
  /** Quanto tempo o estado vale antes de ser relido (ms). */
  stateTtlMs: number;
}

export function optionsFromEnv(env: Record<string, string | undefined> = process.env): RuntimeOptions {
  return {
    defaultDryRun: !/^(0|false|nao|não|no)$/i.test(env.RUBRICA_MCP_DRYRUN ?? ""),
    allowPasswordArg: env.RUBRICA_MCP_ALLOW_PASSWORD === "1",
    stateTtlMs: 60_000,
  };
}

export interface ToolResult {
  content: { type: "text"; text: string }[];
  isError?: boolean;
}

const text = (value: unknown, isError = false): ToolResult => ({
  content: [{ type: "text", text: typeof value === "string" ? value : JSON.stringify(value, null, 2) }],
  ...(isError ? { isError: true } : {}),
});

export class Runtime implements RuntimeApi {
  private state: SiteState = EMPTY_STATE;
  private loading: Promise<SiteState> | null = null;
  private readonly tools = allTools();
  private theme: Promise<ThemeInfo> | null = null;
  onToolsChanged: () => void = () => {};

  constructor(
    readonly project: ProjectConfig,
    private readonly auth: AuthManager,
    private readonly client: RubricaClient,
    readonly options: RuntimeOptions,
    /** Lê o tema instalado (variações e receitas). Padrão: o do projeto, pelo esbuild dele. */
    private readonly themeLoader: () => Promise<ThemeInfo> = () => loadProjectTheme(project.root),
  ) {}

  static create(project: ProjectConfig, options: RuntimeOptions, deps: { auth: AuthManager; client?: RubricaClient; loadTheme?: () => Promise<ThemeInfo> }): Runtime {
    return new Runtime(project, deps.auth, deps.client ?? new ConvexClient(deps.auth), options, deps.loadTheme);
  }

  /** O tema é lido uma vez por processo (trocar de tema pede reinstalar e reiniciar o agente). */
  private loadTheme(): Promise<ThemeInfo> {
    this.theme ??= this.themeLoader();
    return this.theme;
  }

  hasSession(): boolean {
    return this.auth.session() !== null;
  }

  async signIn(email: string, password: string) {
    const s = await this.auth.signIn(email, password);
    return { email: s.email };
  }

  signOut(): Promise<boolean> {
    return this.auth.signOut();
  }

  /** Relê papel, configurações e plugins; avisa o agente quando a lista de ferramentas muda. */
  async refresh(): Promise<SiteState> {
    this.loading ??= Promise.all([loadState(this.client, this.hasSession()), this.loadTheme()])
      .then(([loaded, theme]) => {
        const next: SiteState = { ...loaded, theme };
        const changed = this.visibleTools(this.state).map((t) => t.name).join() !== this.visibleTools(next).map((t) => t.name).join();
        this.state = next;
        if (changed) this.onToolsChanged();
        return next;
      })
      .finally(() => {
        this.loading = null;
      });
    return this.loading;
  }

  async ensureState(): Promise<SiteState> {
    if (this.state.loadedAt === 0 || Date.now() - this.state.loadedAt > this.options.stateTtlMs || (!this.state.me && this.hasSession())) {
      await this.refresh();
    }
    return this.state;
  }

  currentState(): SiteState {
    return this.state;
  }

  private visibleTools(state: SiteState): ToolDef[] {
    return this.tools.filter((t) => isVisible(t, state));
  }

  toolNames(): string[] {
    return this.visibleTools(this.state).map((t) => t.name);
  }

  async listTools() {
    const state = await this.ensureState();
    return this.visibleTools(state).map((t) => ({
      name: t.name,
      title: t.title,
      description: t.description,
      inputSchema: { $schema: "http://json-schema.org/draft-07/schema#", ...toolSchema(t, { state, typed: true }, this.options.defaultDryRun) } as unknown as { type: "object" } & Record<string, unknown>,
      annotations: {
        title: t.title,
        readOnlyHint: !t.write,
        destructiveHint: !!t.destructive,
        idempotentHint: !t.write,
        openWorldHint: false,
      },
    }));
  }

  async callTool(name: string, rawArgs: Record<string, unknown> = {}): Promise<ToolResult> {
    const tool = this.tools.find((t) => t.name === name);
    if (!tool) return text({ error: `Ferramenta desconhecida: ${name}` }, true);
    try {
      const state = await this.ensureState();
      if (!isVisible(tool, state)) {
        if (!state.me) throw new RubricaError(`Sem login. ${state.problem ?? "Peça à pessoa para rodar `npx rubrica mcp login` no terminal dela."}`, "auth");
        throw new RubricaError(`A ferramenta ${name} não está disponível: o papel ${state.me.role ?? "(nenhum)"}, os plugins ligados ou o backend deste projeto não a oferecem.`, "forbidden");
      }
      const { dryRun: rawDryRun, ...args } = rawArgs;
      if (rawDryRun !== undefined && typeof rawDryRun !== "boolean") throw new ToolInputError("dryRun deve ser true ou false.");
      const problems = validateAgainst(toolSchema(tool, { state, typed: false }, this.options.defaultDryRun), tool.write ? { ...args, ...(rawDryRun === undefined ? {} : { dryRun: rawDryRun }) } : args);
      if (problems.length) {
        throw new ToolInputError(`Argumentos inválidos: ${problems.slice(0, 5).map((p) => `${p.path || "(raiz)"}: ${p.message}`).join("; ")}`, problems);
      }
      const dryRun = tool.write ? (rawDryRun ?? this.options.defaultDryRun) : false;
      const result = await tool.handler(args, { client: this.client, state, dryRun, runtime: this });
      return text(result);
    } catch (e) {
      return text(this.errorBody(e), true);
    }
  }

  private errorBody(e: unknown): Record<string, unknown> {
    if (e instanceof ToolInputError) return { error: e.message, ...(e.problems.length ? { problems: e.problems } : {}) };
    if (e instanceof RubricaError) {
      const hint =
        e.kind === "auth"
          ? "Peça à pessoa para rodar `npx rubrica mcp login` no terminal dela."
          : e.kind === "forbidden"
            ? "O papel desta conta não permite a ação. Não tente contornar; avise a pessoa."
            : undefined;
      return { error: redact(e.message), kind: e.kind, ...(hint ? { hint } : {}) };
    }
    if (e instanceof ConfigError) return { error: e.message };
    return { error: redact((e as Error).message ?? String(e)) };
  }
}

/** Tira de uma mensagem qualquer coisa que pareça token. */
export function redact(message: string): string {
  return message.replace(/Bearer\s+[\w.-]+/gi, "Bearer ***").replace(/\beyJ[\w-]+\.[\w-]+\.[\w-]+/g, "***");
}
