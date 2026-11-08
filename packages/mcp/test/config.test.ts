import { mkdirSync, mkdtempSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ConfigError, environmentOf, parseEnvFile, resolveProject } from "../src/config";
import { SessionStore, jwtClaims, sessionPath } from "../src/session";

function project(files: Record<string, string>) {
  const dir = mkdtempSync(join(tmpdir(), "rubrica-mcp-"));
  for (const [name, content] of Object.entries(files)) {
    mkdirSync(join(dir, name, ".."), { recursive: true });
    writeFileSync(join(dir, name), content);
  }
  return dir;
}

describe("config do projeto", () => {
  it("lê .env.local com aspas e comentários", () => {
    expect(parseEnvFile('# x\nCONVEX_URL="https://a.convex.cloud"\nexport B=2 # fim\n')).toEqual({ CONVEX_URL: "https://a.convex.cloud", B: "2" });
  });

  it("acha a URL no .env.local e o ambiente pelo deployment", () => {
    const root = project({
      "rubrica.json": '{"name":"@acme/Site Cliente"}',
      ".env.local": "CONVEX_DEPLOYMENT=dev:feliz-gato-123\nVITE_CONVEX_URL=https://feliz-gato-123.convex.cloud/\n",
    });
    const cfg = resolveProject({ cwd: root, env: {} });
    expect(cfg).toMatchObject({ convexUrl: "https://feliz-gato-123.convex.cloud", environment: "desenvolvimento", source: ".env.local", name: "site-cliente" });
  });

  it("sobe pastas até a raiz do projeto", () => {
    const root = project({ "rubrica.config.ts": "export default {}", ".env.local": "CONVEX_URL=https://x.convex.cloud" });
    const sub = join(root, "src", "pages");
    mkdirSync(sub, { recursive: true });
    expect(resolveProject({ cwd: sub, env: {} }).root).toBe(root);
  });

  it("RUBRICA_CONVEX_URL vence, e --producao usa o rubrica.json", () => {
    const root = project({
      "rubrica.json": JSON.stringify({ producao: { convexUrl: "https://prod-1.convex.cloud" } }),
      ".env.local": "CONVEX_URL=https://dev-1.convex.cloud",
    });
    expect(resolveProject({ cwd: root, env: {}, production: true })).toMatchObject({ convexUrl: "https://prod-1.convex.cloud", environment: "producao" });
    expect(resolveProject({ cwd: root, env: { RUBRICA_CONVEX_URL: "https://outro.convex.cloud" }, production: true }).convexUrl).toBe("https://outro.convex.cloud");
  });

  it("falha com mensagem clara sem projeto, sem URL ou com URL insegura", () => {
    const vazio = mkdtempSync(join(tmpdir(), "rubrica-mcp-vazio-"));
    expect(() => resolveProject({ cwd: vazio, env: {} })).toThrow(ConfigError);
    expect(() => resolveProject({ cwd: project({ "rubrica.json": "{}" }), env: {} })).toThrow(/Não achei a URL do Convex/);
    expect(() => resolveProject({ cwd: vazio, env: { CONVEX_URL: "http://exemplo.com" } })).toThrow(/https/);
    expect(() => resolveProject({ cwd: project({ "rubrica.json": "{}" }), env: {}, production: true })).toThrow(/site publicado/);
  });

  it("mapeia o tipo de deployment", () => {
    expect(environmentOf("prod:abc")).toBe("producao");
    expect(environmentOf("anonymous:x")).toBe("local");
    expect(environmentOf(undefined)).toBe("desconhecido");
  });
});

describe("sessão", () => {
  it("grava com permissão 600 numa pasta 700 e lê de volta", () => {
    const dir = mkdtempSync(join(tmpdir(), "rubrica-mcp-cfg-"));
    const path = sessionPath("meu-site", "https://feliz-gato-123.convex.cloud", { RUBRICA_CONFIG_DIR: join(dir, "rubrica") });
    expect(path.endsWith("meu-site__feliz-gato-123.json")).toBe(true);
    const store = new SessionStore(path);
    expect(store.read()).toBeNull();
    store.write({ convexUrl: "https://feliz-gato-123.convex.cloud", email: "a@b.dev", token: "t", refreshToken: "r", savedAt: 1 });
    expect(statSync(path).mode & 0o777).toBe(0o600);
    expect(statSync(join(path, "..")).mode & 0o777).toBe(0o700);
    expect(store.read()?.email).toBe("a@b.dev");
    expect(store.clear()).toBe(true);
    expect(store.read()).toBeNull();
  });

  it("lê os claims de um JWT", () => {
    const body = Buffer.from(JSON.stringify({ exp: 123, sub: "u|s" })).toString("base64url");
    expect(jwtClaims(`a.${body}.c`)).toEqual({ exp: 123, sub: "u|s" });
    expect(jwtClaims("lixo")).toEqual({});
  });
});
