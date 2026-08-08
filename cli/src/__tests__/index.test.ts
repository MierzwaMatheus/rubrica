import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@clack/prompts", () => ({
  intro: vi.fn(),
  outro: vi.fn(),
}));

vi.mock("../commands/create.js", () => ({
  runCreate: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../commands/config.js", () => ({
  runConfig: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../commands/update.js", () => ({
  runUpdate: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../commands/setup.js", () => ({
  runSetup: vi.fn().mockResolvedValue(undefined),
}));

// Importar após mocks
const { runCli } = await import("../index.js");
const { runSetup } = await import("../commands/setup.js");
const { runCreate } = await import("../commands/create.js");
const { runConfig } = await import("../commands/config.js");
const { runUpdate } = await import("../commands/update.js");

describe("runCli — roteamento de comandos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("roteia 'setup' para runSetup", async () => {
    await runCli(["node", "rubrica", "setup"], process.cwd());
    expect(vi.mocked(runSetup)).toHaveBeenCalledOnce();
  });

  it("roteia 'create' para runCreate com nome do projeto", async () => {
    await runCli(["node", "rubrica", "create", "meu-projeto"], process.cwd());
    expect(vi.mocked(runCreate)).toHaveBeenCalledWith("meu-projeto", expect.objectContaining({ projectsDir: process.cwd() }));
  });

  it("roteia 'config' para runConfig", async () => {
    await runCli(["node", "rubrica", "config"], process.cwd());
    expect(vi.mocked(runConfig)).toHaveBeenCalledOnce();
  });

  it("roteia 'update' para runUpdate", async () => {
    await runCli(["node", "rubrica", "update"], process.cwd());
    expect(vi.mocked(runUpdate)).toHaveBeenCalledOnce();
  });

  it("exibe ajuda para comando desconhecido", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await runCli(["node", "rubrica", "foobar"], process.cwd());
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringMatching(/setup/i)
    );
    consoleSpy.mockRestore();
  });
});
