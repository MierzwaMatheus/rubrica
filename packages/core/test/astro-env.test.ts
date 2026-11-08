import { describe, expect, it } from "vitest";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { devFsAllow, findApiUrl, parseDotenv, projectEnv, workspaceRoot } from "../src/astro/env";

const tmp = () => mkdtempSync(join(tmpdir(), "rubrica-env-"));

describe("variáveis do projeto no config", () => {
  it("lê o formato que o convex dev grava, com comentários e aspas", () => {
    const env = parseDotenv('# Deployment used by `npx convex dev`\nCONVEX_DEPLOYMENT=dev:quixotic-dog-374 # team: x\n\nCONVEX_URL=https://quixotic-dog-374.convex.cloud\nA="com # dentro"\nexport B=\'b\'\n');
    expect(env).toEqual({ CONVEX_DEPLOYMENT: "dev:quixotic-dog-374", CONVEX_URL: "https://quixotic-dog-374.convex.cloud", A: "com # dentro", B: "b" });
  });

  it("segue a ordem do Vite e deixa o ambiente do processo vencer", () => {
    const root = tmp();
    writeFileSync(join(root, ".env"), "CONVEX_URL=https://env\nX=env\n");
    writeFileSync(join(root, ".env.local"), "CONVEX_URL=https://local\n");
    writeFileSync(join(root, ".env.production"), "Y=prod\n");
    expect(projectEnv(root, "development", {})).toMatchObject({ CONVEX_URL: "https://local", X: "env" });
    expect(projectEnv(root, "development", {}).Y).toBeUndefined();
    expect(projectEnv(root, "production", {}).Y).toBe("prod");
    expect(projectEnv(root, "production", { CONVEX_URL: "https://ci" }).CONVEX_URL).toBe("https://ci");
  });
});

describe("pastas do servidor de desenvolvimento", () => {
  it("não mexe no padrão quando o núcleo está no workspace do projeto", () => {
    const ws = tmp();
    writeFileSync(join(ws, "pnpm-workspace.yaml"), "packages: []\n");
    mkdirSync(join(ws, "apps/demo"), { recursive: true });
    expect(workspaceRoot(join(ws, "apps/demo"))).toBe(ws);
    expect(devFsAllow(join(ws, "apps/demo"), join(ws, "packages/core"))).toBeUndefined();
    const solo = tmp();
    expect(devFsAllow(solo, join(solo, "node_modules/@rubrica/core"))).toBeUndefined();
  });

  it("libera o clone ligado com create --local", () => {
    const project = tmp();
    const core = join(tmp(), "packages/core");
    expect(devFsAllow(project, core)).toEqual([project, core]);
  });
});

describe("endereço da API dos formulários", () => {
  it("segue PUBLIC_RUBRICA_API > CONVEX_SITE_URL > derivado do CONVEX_URL", () => {
    const all = { PUBLIC_RUBRICA_API: "https://api.exemplo.com/", CONVEX_SITE_URL: "https://a.convex.site", CONVEX_URL: "https://b.convex.cloud" };
    expect(findApiUrl(all)).toBe("https://api.exemplo.com");
    expect(findApiUrl({ CONVEX_SITE_URL: "https://a.convex.site", CONVEX_URL: "https://b.convex.cloud" })).toBe("https://a.convex.site");
    expect(findApiUrl({ CONVEX_URL: "https://quixotic-dog-374.convex.cloud/" })).toBe("https://quixotic-dog-374.convex.site");
    expect(findApiUrl({ VITE_CONVEX_URL: "https://x.convex.cloud" })).toBe("https://x.convex.site");
  });
  it("sem Convex reconhecível, fica desligada", () => {
    expect(findApiUrl({})).toBeUndefined();
    expect(findApiUrl({ PUBLIC_RUBRICA_API: " ", CONVEX_URL: "https://dominio.proprio.com" })).toBeUndefined();
  });
  it("lê o .env.local que o convex dev grava", () => {
    const root = tmp();
    writeFileSync(join(root, ".env.local"), "CONVEX_URL=https://x-y-1.convex.cloud\nCONVEX_SITE_URL=https://x-y-1.convex.site\n");
    expect(findApiUrl(projectEnv(root, "development", {}))).toBe("https://x-y-1.convex.site");
  });
});
