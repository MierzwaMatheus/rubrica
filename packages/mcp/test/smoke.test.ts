/**
 * Fumaça: sobe o servidor de verdade (processo filho, stdio) e conversa com ele pelo
 * cliente oficial do MCP. O Convex é um servidor HTTP falso na própria máquina.
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { sessionPath } from "../src/session";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const BIN = fileURLToPath(new URL("../src/bin.ts", import.meta.url));
// O processo filho roda numa pasta temporária: o tsx vai por caminho absoluto.
const TSX = pathToFileURL(createRequire(import.meta.url).resolve("tsx")).href;
const jwt = (exp: number) => `h.${Buffer.from(JSON.stringify({ exp })).toString("base64url")}.s`;

let convex: Server;
let url: string;
const seen: { path: string; auth?: string }[] = [];

beforeAll(async () => {
  convex = createServer((req, res) => {
    let raw = "";
    req.on("data", (c) => (raw += c));
    req.on("end", () => {
      const { path, args } = JSON.parse(raw || "{}") as { path: string; args: Record<string, unknown> };
      seen.push({ path, auth: req.headers.authorization });
      const ok = (value: unknown) => res.end(JSON.stringify({ status: "success", value }));
      if (args?.__rubricaProbe) return res.end(JSON.stringify({ status: "error", errorMessage: "Could not find public function for 'x:y'" }));
      if (path === "rubrica/users:me") return ok({ userId: "u1", email: "ana@exemplo.dev", name: "Ana", role: "content-editor", mustChangePassword: false });
      if (path === "rubrica/settings:get")
        return ok({ kind: "pessoal", name: { "pt-BR": "Ana" }, description: { "pt-BR": "x" }, url: "https://exemplo.dev", locales: { locales: ["pt-BR", "en"], default: "pt-BR" }, theme: "padrao", appearance: { colorMode: "dark", colorToggle: true }, navigation: [], social: [], plugins: {} });
      if (path === "rubrica/settings:plugins") return ok([{ id: "blog", label: "Blog", description: "", requires: [], enabled: true }]);
      if (path === "rubrica/pages:list") return ok([]);
      res.end(JSON.stringify({ status: "error", errorMessage: `inesperado ${path}` }));
    });
  });
  await new Promise<void>((r) => convex.listen(0, "127.0.0.1", r));
  url = `http://127.0.0.1:${(convex.address() as AddressInfo).port}`;
});
afterAll(() => convex.close());

function project() {
  const root = mkdtempSync(join(tmpdir(), "rubrica-mcp-smoke-"));
  writeFileSync(join(root, "rubrica.json"), JSON.stringify({ name: "smoke" }));
  return { root, config: join(root, "cfg") };
}

function transport(root: string, config: string) {
  return new StdioClientTransport({
    command: process.execPath,
    args: ["--import", TSX, BIN, "serve"],
    cwd: root,
    stderr: "pipe",
    env: { PATH: process.env.PATH ?? "", HOME: root, RUBRICA_PROJECT: root, RUBRICA_CONVEX_URL: url, RUBRICA_CONFIG_DIR: config },
  });
}

describe("servidor stdio", () => {
  it("sem login, sobe e lista só as ferramentas de login", async () => {
    const { root, config } = project();
    const client = new Client({ name: "fumaca", version: "1" });
    await client.connect(transport(root, config));
    try {
      const { tools } = await client.listTools();
      expect(tools.map((t) => t.name).sort()).toEqual(["blocks_catalog", "login", "logout", "whoami"]);
      const who = await client.callTool({ name: "whoami", arguments: {} });
      const body = JSON.parse((who.content as any)[0].text);
      expect(body).toMatchObject({ loggedIn: false, project: { name: "smoke" } });
      expect(body.notes.join(" ")).toContain("npx rubrica mcp login");
    } finally {
      await client.close();
    }
  }, 30000);

  it("com a sessão guardada, lista as ferramentas do papel e fala com o Convex com o token", async () => {
    const { root, config } = project();
    mkdirSync(config, { recursive: true });
    const token = jwt(Math.floor(Date.now() / 1000) + 3600);
    writeFileSync(sessionPath("smoke", url, { RUBRICA_CONFIG_DIR: config }), JSON.stringify({ convexUrl: url, email: "ana@exemplo.dev", token, refreshToken: "r", savedAt: Date.now() }));
    const client = new Client({ name: "fumaca", version: "1" });
    await client.connect(transport(root, config));
    try {
      const { tools } = await client.listTools();
      const names = tools.map((t) => t.name);
      expect(names).toEqual(expect.arrayContaining(["pages_create", "block_update_fields", "posts_create", "media_upload", "site_get"]));
      expect(names).not.toContain("site_update");
      expect(names.length).toBeGreaterThan(30);
      const res = await client.callTool({ name: "pages_list", arguments: {} });
      expect(JSON.parse((res.content as any)[0].text)).toEqual({ pages: [] });
      expect(seen.some((s) => s.path === "rubrica/pages:list" && s.auth === `Bearer ${token}`)).toBe(true);
    } finally {
      await client.close();
    }
  }, 30000);

  it("o token nunca aparece nas respostas nem no stderr", async () => {
    const { root, config } = project();
    mkdirSync(config, { recursive: true });
    const token = jwt(Math.floor(Date.now() / 1000) + 3600);
    writeFileSync(sessionPath("smoke", url, { RUBRICA_CONFIG_DIR: config }), JSON.stringify({ convexUrl: url, email: "ana@exemplo.dev", token, refreshToken: "refresh-secreto", savedAt: Date.now() }));
    const t = transport(root, config);
    const client = new Client({ name: "fumaca", version: "1" });
    await client.connect(t);
    let errText = "";
    t.stderr?.on("data", (d) => (errText += String(d)));
    try {
      const outputs = [JSON.stringify(await client.listTools()), JSON.stringify(await client.callTool({ name: "whoami", arguments: {} })), JSON.stringify(await client.readResource({ uri: "rubrica://site/estado" }))];
      for (const out of [...outputs, errText]) {
        expect(out).not.toContain(token);
        expect(out).not.toContain("refresh-secreto");
      }
    } finally {
      await client.close();
    }
    expect(readFileSync(sessionPath("smoke", url, { RUBRICA_CONFIG_DIR: config }), "utf8")).toContain("refresh-secreto");
  }, 30000);
});
