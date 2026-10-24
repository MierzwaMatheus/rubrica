import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@clack/prompts", () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  log: { warn: vi.fn() },
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

vi.mock("../commands/password.js", () => ({
  runPassword: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../commands/publish.js", () => ({
  runPublish: vi.fn().mockResolvedValue(undefined),
}));

import { encodeRecipe } from "../recipe.js";

// Importar após mocks
const { runCli } = await import("../index.js");
const { runSetup } = await import("../commands/setup.js");
const { runCreate } = await import("../commands/create.js");
const { runConfig } = await import("../commands/config.js");
const { runUpdate } = await import("../commands/update.js");
const { runPassword } = await import("../commands/password.js");
const { runPublish } = await import("../commands/publish.js");

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

  it("roteia 'senha' para runPassword", async () => {
    await runCli(["node", "rubrica", "senha"], "/p");
    expect(vi.mocked(runPassword)).toHaveBeenCalledWith({ cwd: "/p" });
    expect(vi.mocked(runCreate)).not.toHaveBeenCalled();
  });

  it("roteia 'publicar' para runPublish", async () => {
    await runCli(["node", "rubrica", "publicar"], "/p");
    expect(vi.mocked(runPublish)).toHaveBeenCalledWith({ cwd: "/p" });
    expect(vi.mocked(runCreate)).not.toHaveBeenCalled();
  });

  it("a ajuda lista os comandos senha e publicar", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await runCli(["node", "rubrica"], "/p");
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringMatching(/senha.*publicar|publicar.*senha/s));
    consoleSpy.mockRestore();
  });

  it("roteia 'config' para runConfig", async () => {
    await runCli(["node", "rubrica", "config"], process.cwd());
    expect(vi.mocked(runConfig)).toHaveBeenCalledOnce();
  });

  it("roteia 'update' para runUpdate", async () => {
    await runCli(["node", "rubrica", "update"], process.cwd());
    expect(vi.mocked(runUpdate)).toHaveBeenCalledOnce();
  });

  it("exibe ajuda sem argumentos ou com uma flag", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    await runCli(["node", "rubrica"], process.cwd());
    await runCli(["node", "rubrica", "--help"], process.cwd());
    expect(consoleSpy).toHaveBeenCalledTimes(2);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringMatching(/setup/i));
    expect(vi.mocked(runCreate)).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it("`create-rubrica <nome>` (formato do pnpm create) cria o projeto", async () => {
    await runCli(["node", "create-rubrica", "meu-portfolio"], "/projetos");
    expect(vi.mocked(runCreate)).toHaveBeenCalledWith("meu-portfolio", { projectsDir: "/projetos" });
  });
});

describe("runCli — receita e opções do create", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.exitCode = undefined;
  });

  it("`create-rubrica <nome> --receita <código>` passa a receita ao create", async () => {
    const code = encodeRecipe({ layout: "zine" });
    await runCli(["node", "create-rubrica", "ana", "--receita", code], "/p");
    expect(vi.mocked(runCreate)).toHaveBeenCalledWith("ana", { projectsDir: "/p", recipe: { layout: "zine" } });
  });

  it("`rubrica create <nome>` com opções legíveis", async () => {
    await runCli(["node", "rubrica", "create", "ana", "--layout", "zine", "--sem-alternancia"], "/p");
    expect(vi.mocked(runCreate)).toHaveBeenCalledWith("ana", { projectsDir: "/p", recipe: { layout: "zine", colorModeToggle: false } });
  });

  it("mostra os avisos antes de começar", async () => {
    const { log } = await import("@clack/prompts");
    await runCli(["node", "create-rubrica", "ana", "--layout", "xpto"], "/p");
    expect(vi.mocked(log.warn)).toHaveBeenCalledWith(expect.stringContaining("xpto"));
    expect(vi.mocked(runCreate)).toHaveBeenCalledWith("ana", { projectsDir: "/p" });
  });

  it("opções sem o nome da pasta: mostra o uso e não cria", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await runCli(["node", "rubrica", "create", "--layout", "zine"], "/p");
    expect(errorSpy).toHaveBeenCalledWith(expect.stringMatching(/Uso:/));
    expect(vi.mocked(runCreate)).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
    errorSpy.mockRestore();
    process.exitCode = undefined;
  });

  it("receita inválida: explica, não cria e sai com erro", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await runCli(["node", "create-rubrica", "ana", "--receita", "!!"], "/p");
    expect(errorSpy).toHaveBeenCalledWith(expect.stringMatching(/receita não é válida/));
    expect(vi.mocked(runCreate)).not.toHaveBeenCalled();
    expect(process.exitCode).toBe(1);
    errorSpy.mockRestore();
    process.exitCode = undefined;
  });
});

describe("runCli — flags do update", () => {
  beforeEach(() => vi.clearAllMocks());

  it("repassa --dry-run, --from, --to e --yes", async () => {
    await runCli(["node", "rubrica", "update", "--dry-run", "--from", "0.3.12", "--to", "v0.4.0", "--yes"], "/p");
    expect(vi.mocked(runUpdate)).toHaveBeenCalledWith({
      cwd: "/p",
      options: { dryRun: true, from: "0.3.12", to: "v0.4.0", yes: true },
    });
  });

  it("sem flags, chama o update sem opções", async () => {
    await runCli(["node", "rubrica", "update"], "/p");
    expect(vi.mocked(runUpdate)).toHaveBeenCalledWith({ cwd: "/p", options: {} });
  });
});
