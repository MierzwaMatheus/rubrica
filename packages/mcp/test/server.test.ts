import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, it, vi } from "vitest";
import { RubricaError, type AuthManager, type RubricaClient } from "../src/client";
import { Runtime } from "../src/runtime";
import { createServer } from "../src/server";

const SETTINGS = {
  kind: "pessoal",
  name: { "pt-BR": "Ana" },
  description: { "pt-BR": "x" },
  url: "https://exemplo.dev",
  locales: { locales: ["pt-BR", "en"], default: "pt-BR" },
  theme: "padrao",
  appearance: { colorMode: "dark", colorToggle: true },
  navigation: [],
  social: [],
  plugins: {},
};
const PLUGINS = [
  { id: "blog", label: "Blog", description: "", requires: [], enabled: true },
  { id: "portfolio", label: "Projetos", description: "", requires: [], enabled: true },
];

function fakeClient(role: string | null = "admin"): RubricaClient {
  const answer = async (path: string, args: Record<string, unknown> = {}) => {
    if (args.__rubricaProbe) throw new RubricaError("Could not find public function", "missing-function");
    if (path === "rubrica/users:me") return role ? { userId: "u1", email: "ana@exemplo.dev", name: "Ana", role, mustChangePassword: false } : null;
    if (path === "rubrica/settings:get") return SETTINGS;
    if (path === "rubrica/settings:plugins") return PLUGINS;
    if (path === "rubrica/pages:list") return [];
    throw new RubricaError(`inesperado: ${path}`);
  };
  return { query: answer, mutation: answer, action: answer, upload: async () => ({ storageId: "s" }) } as unknown as RubricaClient;
}

async function connect(session = true, role: string | null = "admin") {
  const auth = { session: () => (session ? { convexUrl: "x", email: "a@b.dev", token: "t", refreshToken: "r", savedAt: 0 } : null) } as unknown as AuthManager;
  const runtime = new Runtime(
    { root: null, name: "p", convexUrl: "https://teste-1.convex.cloud", source: "teste", environment: "desenvolvimento" },
    auth,
    fakeClient(role),
    { defaultDryRun: true, allowPasswordArg: false, stateTtlMs: 60_000 },
  );
  const server = createServer(runtime);
  const client = new Client({ name: "teste", version: "1" });
  const [a, b] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(a), client.connect(b)]);
  return { client, runtime, server };
}

describe("servidor MCP", () => {
  it("anuncia instruções e capacidades", async () => {
    const { client } = await connect();
    expect(client.getInstructions()).toContain("dryRun");
    expect(client.getServerCapabilities()).toMatchObject({ tools: { listChanged: true }, resources: {}, prompts: {} });
  });

  it("lista ferramentas com JSON Schema, dryRun nas que gravam e anotações", async () => {
    const { client } = await connect();
    const { tools } = await client.listTools();
    const byName = Object.fromEntries(tools.map((t) => [t.name, t]));
    expect(byName.pages_list!.annotations).toMatchObject({ readOnlyHint: true });
    expect(byName.pages_create!.annotations).toMatchObject({ readOnlyHint: false, destructiveHint: false });
    expect(byName.block_remove!.annotations).toMatchObject({ destructiveHint: true });
    const props = (byName.pages_create!.inputSchema as any).properties;
    expect(props.dryRun).toMatchObject({ type: "boolean", default: true });
    expect(props.blocks.items.anyOf.length).toBeGreaterThan(10);
    expect(props.title.properties).toHaveProperty("pt-BR");
    expect((byName.pages_list!.inputSchema as any).properties.dryRun).toBeUndefined();
    for (const t of tools) expect(t.description!.length, t.name).toBeGreaterThan(20);
  });

  it("o padrão do dryRun muda com RUBRICA_MCP_DRYRUN=0", async () => {
    const auth = { session: () => ({}) } as unknown as AuthManager;
    const runtime = new Runtime({ root: null, name: "p", convexUrl: "https://t.convex.cloud", source: "t", environment: "local" }, auth, fakeClient(), { defaultDryRun: false, allowPasswordArg: false, stateTtlMs: 1 });
    const tool = (await runtime.listTools()).find((t) => t.name === "pages_create")!;
    expect((tool.inputSchema as any).properties.dryRun).toMatchObject({ default: false });
  });

  it("chama ferramentas e devolve o JSON como texto", async () => {
    const { client } = await connect();
    const res = await client.callTool({ name: "pages_list", arguments: {} });
    expect(res.isError).toBeFalsy();
    expect(JSON.parse((res.content as any)[0].text)).toEqual({ pages: [] });
    const unknown = await client.callTool({ name: "nao_existe", arguments: {} });
    expect(unknown.isError).toBe(true);
  });

  it("recusa argumentos inválidos com o caminho do campo", async () => {
    const { client } = await connect();
    const res = await client.callTool({ name: "pages_get", arguments: {} });
    expect(res.isError).toBe(true);
    expect(JSON.parse((res.content as any)[0].text).problems).toEqual([{ path: "", message: "campo obrigatório: page" }]);
    const bad = await client.callTool({ name: "pages_create", arguments: { path: "/x", title: { "pt-BR": "x" }, dryRun: "sim" } });
    expect(bad.isError).toBe(true);
  });

  it("sem login só aparecem login, logout, whoami e o catálogo", async () => {
    const { client } = await connect(false);
    expect((await client.listTools()).tools.map((t) => t.name).sort()).toEqual(["blocks_catalog", "login", "logout", "whoami"]);
    const res = await client.callTool({ name: "pages_list", arguments: {} });
    expect(res.isError).toBe(true);
    expect(JSON.parse((res.content as any)[0].text).error).toContain("rubrica mcp login");
  });

  it("avisa o cliente quando a lista de ferramentas muda", async () => {
    const { client, runtime } = await connect();
    await client.listTools();
    const seen = vi.fn();
    client.setNotificationHandler((await import("@modelcontextprotocol/sdk/types.js")).ToolListChangedNotificationSchema, seen);
    await runtime.refresh();
    await new Promise((r) => setTimeout(r, 20));
    expect(seen).not.toHaveBeenCalled(); // releu o mesmo estado: a lista é igual
    const { runtime: other, client: c2 } = await connect();
    await c2.listTools();
    const seen2 = vi.fn();
    c2.setNotificationHandler((await import("@modelcontextprotocol/sdk/types.js")).ToolListChangedNotificationSchema, seen2);
    (other as any).state = { ...other.currentState(), me: null, plugins: [] };
    await other.refresh();
    await new Promise((r) => setTimeout(r, 20));
    expect(seen2).toHaveBeenCalled();
  });

  it("expõe recursos: regras de escrita, catálogo, estado e um por bloco", async () => {
    const { client } = await connect();
    const { resources } = await client.listResources();
    const uris = resources.map((r) => r.uri);
    expect(uris).toEqual(expect.arrayContaining(["rubrica://guia/escrita", "rubrica://blocos/catalogo", "rubrica://site/estado", "rubrica://blocos/hero"]));
    const guide = await client.readResource({ uri: "rubrica://guia/escrita" });
    expect((guide.contents[0] as any).text).toMatch(/sem tradução num idioma não aparece|não aparece no idioma/i);
    expect((guide.contents[0] as any).text).toContain("h1 é do hero");
    const catalog = await client.readResource({ uri: "rubrica://blocos/catalogo" });
    expect((catalog.contents[0] as any).text).toContain("## hero");
    expect((catalog.contents[0] as any).text).not.toContain("## precos");
    const hero = JSON.parse(((await client.readResource({ uri: "rubrica://blocos/hero" })).contents[0] as any).text);
    expect(hero.fields.required).toEqual(["title"]);
    const state = JSON.parse(((await client.readResource({ uri: "rubrica://site/estado" })).contents[0] as any).text);
    expect(state).toMatchObject({ loggedIn: true, role: "admin", site: { kind: "pessoal" } });
    await expect(client.readResource({ uri: "rubrica://nada" })).rejects.toThrow();
  });

  it("oferece prompts com os argumentos preenchidos", async () => {
    const { client } = await connect();
    const { prompts } = await client.listPrompts();
    expect(prompts.map((p) => p.name)).toEqual(["montar-pagina", "traduzir-conteudo", "revisar-antes-de-publicar"]);
    const p = await client.getPrompt({ name: "montar-pagina", arguments: { caminho: "/servicos", objetivo: "vender design" } });
    expect((p.messages[0]!.content as any).text).toContain("/servicos");
    expect((p.messages[0]!.content as any).text).toContain("dryRun");
  });
});
