import { describe, expect, it, vi } from "vitest";
import { runMcp, runThemeTester, findRubricaBin } from "../src/commands/delegate";
import { HELP, runCli } from "../src/cli";
import { repo, tmp } from "./helpers";

describe("roteador", () => {
  it("mostra a ajuda sem comando", async () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    await runCli([], tmp());
    expect(spy.mock.calls[0]?.[0]).toBe(HELP);
    spy.mockRestore();
    for (const cmd of ["create", "setup", "config", "publicar", "senha", "update", "ejetar", "verificar", "testar-tema", "mcp", "migrar", "telemetria"]) expect(HELP).toContain(cmd);
  });

  it("fora de um projeto, os comandos de projeto explicam e saem com erro", async () => {
    process.exitCode = 0;
    await runCli(["verificar"], tmp());
    expect(process.exitCode).toBe(1);
    process.exitCode = 0;
  });
});

describe("delegação", () => {
  it("testar-tema acha o @rubrica/theme-tester do monorepo e repassa as opções", () => {
    const calls: [string, string[]][] = [];
    const code = runThemeTester(["padrao", "--sem-lighthouse"], { cwd: repo("apps/demo"), spawn: (bin, args) => (calls.push([bin, args]), 0) });
    expect(code).toBe(0);
    expect(calls[0]![0]).toBe(repo("packages/theme-tester/bin/rubrica-testar-tema.js"));
    expect(calls[0]![1]).toEqual(["padrao", "--sem-lighthouse"]);
  });

  it("mcp ausente: mensagem clara no stderr e código de erro", () => {
    const errors: string[] = [];
    const dir = tmp();
    expect(findRubricaBin(dir, "@rubrica/mcp", "mcp-que-nao-existe", "bin/x.js")).toBeNull();
    const code = runMcp(["serve"], { cwd: dir, error: (m) => errors.push(m), spawn: () => 0 });
    expect(code).toBe(1);
    expect(errors[0]).toMatch(/pnpm add -D @rubrica\/mcp/);
  });
});
