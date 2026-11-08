/**
 * Backend de teste: `convex-test` rodando as funções reais do núcleo pelo `convex/` do
 * projeto de referência (apps/demo), com o MCP ligado a ele por um cliente falso que
 * implementa `RubricaClient`.
 */
import { convexTest } from "convex-test";
import { makeFunctionReference } from "convex/server";
import schema from "../../../apps/demo/convex/schema";
import { internal } from "../../../apps/demo/convex/_generated/api";
import type { Role } from "@rubrica/core/convex/roles";
import type { SiteSettings } from "@rubrica/core";
import { RubricaError, classifyError, cleanErrorMessage, type Args, type AuthManager, type RubricaClient } from "../src/client";
import type { ProjectConfig } from "../src/config";
import { Runtime, type RuntimeOptions } from "../src/runtime";

export const modules = (import.meta as unknown as { glob: (p: string) => Record<string, () => Promise<unknown>> }).glob("../../../apps/demo/convex/**/*.*s");

export type T = ReturnType<typeof convexTest>;

export function setup(): T {
  return convexTest(schema, modules);
}

export const BASE_SETTINGS: SiteSettings = {
  kind: "pessoal",
  name: { "pt-BR": "Ana Souza", en: "Ana Souza" },
  description: { "pt-BR": "Portfólio", en: "Portfolio" },
  url: "https://exemplo.dev",
  locales: { locales: ["pt-BR", "en"], default: "pt-BR" },
  theme: "padrao",
  appearance: { colorMode: "dark", colorToggle: true },
  navigation: [{ label: { "pt-BR": "Início", en: "Home" }, href: "/" }],
  social: [],
  plugins: {},
};

export async function seedSettings(t: T, patch: Partial<SiteSettings> = {}) {
  await t.mutation(internal.rubrica.settings.init, { settings: { ...BASE_SETTINGS, ...patch } as never, overwrite: true });
}

let counter = 0;

export async function userAs(t: T, role: Role | null) {
  const email = `pessoa${++counter}@exemplo.dev`;
  const userId = await t.run(async (ctx) => {
    const id = await ctx.db.insert("users", { email, name: email.split("@")[0] });
    if (role) await ctx.db.insert("userRoles", { userId: id, role, createdAt: Date.now() });
    return id;
  });
  return t.withIdentity({ subject: `${userId}|sessao`, email });
}

type Identity = Awaited<ReturnType<typeof userAs>>;

/** Cliente do MCP sobre o convex-test: caminho "rubrica/pages:list" vira a referência da função. */
export class TestClient implements RubricaClient {
  readonly calls: { type: string; path: string; args: Args }[] = [];
  constructor(
    private readonly user: Identity,
    private readonly t: T,
  ) {}

  private async run(type: "query" | "mutation" | "action", path: string, args: Args = {}) {
    this.calls.push({ type, path, args });
    const ref = makeFunctionReference<typeof type>(path) as never;
    try {
      return await (this.user as never as Record<string, (r: never, a: Args) => Promise<unknown>>)[type]!(ref, args);
    } catch (e) {
      const message = cleanErrorMessage((e as Error).message);
      throw new RubricaError(message, classifyError(`${(e as Error).message}\n${message}`));
    }
  }
  query<T>(path: string, args?: Args) {
    return this.run("query", path, args) as Promise<T>;
  }
  mutation<T>(path: string, args?: Args) {
    return this.run("mutation", path, args) as Promise<T>;
  }
  action<T>(path: string, args?: Args) {
    return this.run("action", path, args) as Promise<T>;
  }
  async upload(_url: string, bytes: Uint8Array, contentType: string) {
    const storageId = await this.t.run((ctx) => ctx.storage.store(new Blob([bytes as BlobPart], { type: contentType })));
    return { storageId: storageId as string };
  }
  writes() {
    return this.calls.filter((c) => c.type !== "query" && !c.path.endsWith("generateUploadUrl") && !c.args.__rubricaProbe);
  }
}

export const PROJECT: ProjectConfig = { root: "/tmp/projeto", name: "projeto", convexUrl: "https://teste-1.convex.cloud", source: ".env.local", environment: "desenvolvimento" };

export async function runtimeFor(t: T, role: Role | null, options: Partial<RuntimeOptions> = {}) {
  const user = await userAs(t, role);
  const client = new TestClient(user, t);
  const auth = { session: () => ({ convexUrl: PROJECT.convexUrl, email: "x@y.dev", token: "t", refreshToken: "r", savedAt: 0 }) } as unknown as AuthManager;
  const runtime = new Runtime(PROJECT, auth, client, { defaultDryRun: true, allowPasswordArg: false, stateTtlMs: 60_000, ...options });
  return { runtime, client, user };
}

/** Chama a ferramenta e devolve o JSON da resposta. */
export async function call(runtime: Runtime, name: string, args: Record<string, unknown> = {}) {
  const res = await runtime.callTool(name, args);
  return { isError: !!res.isError, body: JSON.parse(res.content[0]!.text) as Record<string, any> };
}
