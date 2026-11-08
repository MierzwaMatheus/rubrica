import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync, statSync, writeFileSync, existsSync } from "node:fs";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { HELP, parseArgs } from "../src/cli";
import { ConfigError } from "../src/config";
import { sessionPath } from "../src/session";

const BIN = fileURLToPath(new URL("../src/bin.ts", import.meta.url));
const TSX = pathToFileURL(createRequire(import.meta.url).resolve("tsx")).href;
const jwt = (exp: number) => `h.${Buffer.from(JSON.stringify({ exp })).toString("base64url")}.s`;

describe("argumentos", () => {
  it("padrão é subir o servidor; reconhece comando e opções", () => {
    expect(parseArgs([])).toMatchObject({ command: "serve", production: false });
    expect(parseArgs(["login", "--email", "a@b.dev", "--producao", "--senha-stdin"])).toMatchObject({ command: "login", email: "a@b.dev", production: true, passwordStdin: true });
    expect(parseArgs(["--email=a@b.dev", "whoami"])).toMatchObject({ command: "whoami", email: "a@b.dev" });
    expect(() => parseArgs(["--nada"])).toThrow(ConfigError);
    expect(HELP).toContain("npx rubrica mcp");
  });
});

describe("login no terminal", () => {
  let convex: Server;
  let url: string;
  const bodies: string[] = [];

  beforeAll(async () => {
    convex = createServer((req, res) => {
      let raw = "";
      req.on("data", (c) => (raw += c));
      req.on("end", () => {
        bodies.push(raw);
        const { path, args } = JSON.parse(raw) as { path: string; args: { params?: { password?: string } } };
        const ok = (value: unknown) => res.end(JSON.stringify({ status: "success", value }));
        if (path === "auth:signIn") {
          if (args.params?.password !== "Senha-certa-123") return res.end(JSON.stringify({ status: "error", errorMessage: "InvalidSecret" }));
          return ok({ tokens: { token: jwt(Math.floor(Date.now() / 1000) + 3600), refreshToken: "r1" } });
        }
        if (path === "auth:signOut") return ok(null);
        if (path === "rubrica/users:me") return ok({ userId: "u", email: "ana@exemplo.dev", name: "Ana", role: "admin", mustChangePassword: false });
        if (path === "rubrica/settings:get") return ok(null);
        if (path === "rubrica/settings:plugins") return ok([]);
        res.end(JSON.stringify({ status: "error", errorMessage: "Could not find public function" }));
      });
    });
    await new Promise<void>((r) => convex.listen(0, "127.0.0.1", r));
    url = `http://127.0.0.1:${(convex.address() as AddressInfo).port}`;
  });
  afterAll(() => convex.close());

  function run(args: string[], stdin: string, config: string, root: string) {
    return new Promise<{ code: number | null; stdout: string; stderr: string }>((resolve) => {
      const child = spawn(process.execPath, ["--import", TSX, BIN, ...args], {
        cwd: root,
        env: { PATH: process.env.PATH ?? "", HOME: root, RUBRICA_PROJECT: root, RUBRICA_CONVEX_URL: url, RUBRICA_CONFIG_DIR: config },
      });
      let stdout = "";
      let stderr = "";
      child.stdout.on("data", (d) => (stdout += d));
      child.stderr.on("data", (d) => (stderr += d));
      child.on("close", (code) => resolve({ code, stdout, stderr }));
      child.stdin.end(stdin);
    });
  }

  it("login (senha por stdin) grava a sessão com permissão 600 e não ecoa a senha; logout apaga", async () => {
    const root = mkdtempSync(join(tmpdir(), "rubrica-mcp-cli-"));
    writeFileSync(join(root, "rubrica.json"), JSON.stringify({ name: "cli" }));
    const config = join(root, "cfg");
    const file = sessionPath("cli", url, { RUBRICA_CONFIG_DIR: config });

    const bad = await run(["login", "--email", "ana@exemplo.dev", "--senha-stdin"], "errada\n", config, root);
    expect(bad.code).toBe(4);
    expect(bad.stderr).toContain("e-mail ou senha inválidos");
    expect(existsSync(file)).toBe(false);

    const good = await run(["login", "--email", "ana@exemplo.dev", "--senha-stdin"], "Senha-certa-123\n", config, root);
    expect(good.code).toBe(0);
    expect(good.stdout).toBe("");
    expect(good.stderr).toContain("Administrador");
    expect(good.stderr).not.toContain("Senha-certa-123");
    expect(statSync(file).mode & 0o777).toBe(0o600);
    const saved = JSON.parse(readFileSync(file, "utf8"));
    expect(saved).toMatchObject({ email: "ana@exemplo.dev", refreshToken: "r1" });
    expect(JSON.stringify(saved)).not.toContain("Senha-certa-123");

    const who = await run(["whoami"], "", config, root);
    expect(who.code).toBe(0);
    expect(who.stderr).toContain("ana@exemplo.dev");

    const out = await run(["logout"], "", config, root);
    expect(out.code).toBe(0);
    expect(existsSync(file)).toBe(false);
    expect((await run(["whoami"], "", config, root)).code).toBe(1);
  }, 60000);

  it("mostra a ajuda e recusa comando desconhecido", async () => {
    const root = mkdtempSync(join(tmpdir(), "rubrica-mcp-cli-"));
    writeFileSync(join(root, "rubrica.json"), "{}");
    expect((await run(["--help"], "", join(root, "c"), root)).stderr).toContain("Uso: rubrica-mcp");
    expect((await run(["voar"], "", join(root, "c"), root)).code).toBe(2);
  }, 30000);
});
