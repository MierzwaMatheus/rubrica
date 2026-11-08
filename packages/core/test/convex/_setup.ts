/**
 * Ambiente dos testes do backend: `convex-test` (oficial) rodando as funções de
 * verdade, pelo `convex/` do projeto de referência (apps/demo), que só reexporta as
 * do núcleo. Assim o teste cobre também o formato dos arquivos de reexportação.
 */
import { convexTest } from "convex-test";
import schema from "../../../../apps/demo/convex/schema";
import { api, internal } from "../../../../apps/demo/convex/_generated/api";
import type { Role } from "../../src/convex/lib/roles";
import type { Id } from "../../src/convex/server";
import type { SiteSettings } from "../../src/content/types";

export const modules = (import.meta as unknown as { glob: (p: string) => Record<string, () => Promise<unknown>> }).glob(
  "../../../../apps/demo/convex/**/*.*s",
);

export { api, internal };

export function setup() {
  return convexTest(schema, modules);
}

export type T = ReturnType<typeof setup>;

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

/** Cria um usuário (com papel, se houver) e devolve o cliente logado como ele. */
export async function as(t: T, role: Role | null, email = `pessoa${++counter}@exemplo.dev`) {
  const userId = await t.run(async (ctx) => {
    const id = await ctx.db.insert("users", { email, name: email.split("@")[0] });
    if (role) await ctx.db.insert("userRoles", { userId: id, role, createdAt: Date.now() });
    return id;
  });
  return Object.assign(t.withIdentity({ subject: `${userId}|sessao`, email }), { userId: userId as Id<"users"> });
}
