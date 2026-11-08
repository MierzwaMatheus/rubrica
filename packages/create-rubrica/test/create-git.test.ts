import { afterAll, describe, expect, it } from "vitest";
import { rmSync } from "node:fs";
import { createProject, resolveCreateOptions } from "../src/commands/create";
import { tmp } from "./helpers";

describe("git do projeto criado", () => {
  const parent = tmp("rubrica-git-");
  afterAll(() => rmSync(parent, { recursive: true, force: true }));

  async function create(name: string, runner: (cmd: string, args: string[]) => string) {
    const options = await resolveCreateOptions([name, "--yes", "--tema", "padrao", "--sem-instalar"], parent, {});
    await createProject(options, { runner: (cmd, args) => runner(cmd, args) });
  }

  it("inicia na main e faz o commit inicial", async () => {
    const calls: string[] = [];
    await create("site-a", (cmd, args) => (calls.push([cmd, ...args].join(" ")), ""));
    expect(calls).toEqual(["git init -q -b main", "git add -A", "git commit -q -m Projeto criado com create-rubrica"]);
  });

  it("cai no init antigo e assina o commit quando o git não tem nome configurado", async () => {
    const calls: string[] = [];
    await create("site-b", (cmd, args) => {
      const line = [cmd, ...args].join(" ");
      calls.push(line);
      if (line.includes("-b main") || line === "git commit -q -m Projeto criado com create-rubrica") throw new Error("falhou");
      return "";
    });
    expect(calls).toContain("git symbolic-ref HEAD refs/heads/main");
    expect(calls.at(-1)).toContain("user.name=create-rubrica");
  });
});

describe("gerenciador com --local", () => {
  it("usa pnpm por padrão, porque o npm não instala link:", async () => {
    const parent = tmp("rubrica-pm-");
    const { repo } = await import("./helpers");
    const options = await resolveCreateOptions(["site", "--yes", "--tema", "padrao", "--local", repo()], parent, { npm_config_user_agent: "npm/10 node/v24" });
    expect(options.packageManager).toBe("pnpm");
    const plain = await resolveCreateOptions(["site2", "--yes", "--tema", "padrao"], parent, { npm_config_user_agent: "npm/10 node/v24" });
    expect(plain.packageManager).toBe("npm");
    rmSync(parent, { recursive: true, force: true });
  });
});
