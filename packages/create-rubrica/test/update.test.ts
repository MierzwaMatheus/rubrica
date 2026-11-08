import { describe, expect, it } from "vitest";
import { mkdirSync, readFileSync, symlinkSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { computeUpdatePlan, runUpdate } from "../src/commands/update";
import { verifyProject } from "../src/commands/verify";
import { ejectBlock } from "../src/commands/eject";
import { compareVersions, formatPlan, planUpdate } from "../src/project/update";
import { convexFiles, convexOwnedFiles } from "../src/project/convex";
import { astroConfig, packageJson } from "../src/project/files";
import { CORE_MODULES } from "../src/core-manifest";
import { readState, writeState } from "../src/state";
import { writeFiles } from "../src/utils/fs";
import { FakeShell } from "./fake-shell";
import { repo, sampleState, tmp } from "./helpers";

function snapshot(dir: string): Record<string, string> {
  const out: Record<string, string> = {};
  const walk = (d: string, rel = "") => {
    for (const name of readdirSync(d)) {
      if (name === "node_modules" || name === ".rubrica") continue;
      const full = join(d, name);
      try {
        out[rel + name] = readFileSync(full, "utf-8");
      } catch {
        walk(full, `${rel}${name}/`);
      }
    }
  };
  walk(dir);
  return out;
}

/** Projeto com núcleo, tema e convex do monorepo em node_modules (links). */
function installedProject() {
  const dir = tmp();
  const nm = join(dir, "node_modules");
  mkdirSync(join(nm, "@rubrica"), { recursive: true });
  mkdirSync(join(nm, "@convex-dev"), { recursive: true });
  mkdirSync(join(nm, "@auth"), { recursive: true });
  symlinkSync(repo("packages/core"), join(nm, "@rubrica/core"));
  symlinkSync(repo("packages/themes/padrao"), join(nm, "@rubrica/theme-padrao"));
  symlinkSync(repo("packages/core/node_modules/convex"), join(nm, "convex"));
  symlinkSync(repo("packages/core/node_modules/@convex-dev/auth"), join(nm, "@convex-dev/auth"));
  symlinkSync(repo("packages/core/node_modules/@auth/core"), join(nm, "@auth/core"));
  const state = sampleState();
  writeFileSync(join(dir, "package.json"), packageJson("x", state, { core: "^2.0.0-alpha.0", theme: "^2.0.0-alpha.0" }));
  writeState(dir, state);
  writeFileSync(join(dir, "astro.config.ts"), astroConfig(state));
  writeFiles(dir, { ...convexOwnedFiles(), ...convexFiles() });
  return dir;
}

describe("plano do update (puro)", () => {
  it("compara versões com pré-lançamento", () => {
    expect(compareVersions("2.1.0", "2.0.0")).toBeGreaterThan(0);
    expect(compareVersions("2.0.0", "2.0.0-alpha.3")).toBeGreaterThan(0);
    expect(compareVersions("2.0.0-alpha.10", "2.0.0-alpha.9")).toBeGreaterThan(0);
    expect(compareVersions("2.0.0", "2.0.0")).toBe(0);
  });

  it("regenera o que mudou, cria o que falta, apaga módulo removido e filtra migrações", () => {
    const disk = { ...convexFiles(), ...convexOwnedFiles() };
    disk["convex/rubrica/posts.ts"] = "// Gerado pelo Rubrica (@rubrica/core). Não edite: atualize o pacote.\nantigo";
    delete disk["convex/rubrica/team.ts"];
    disk["convex/rubrica/velho.ts"] = "// Gerado pelo Rubrica (@rubrica/core). Não edite: atualize o pacote.\n";
    disk["convex/minhas.ts"] = "export const x = 1;";
    const plan = planUpdate({
      packages: [{ pkg: "@rubrica/core", from: "2.0.0", to: "2.2.0" }],
      modules: CORE_MODULES,
      convexOnDisk: disk,
      fromVersion: "2.0.0",
      migrations: [
        { id: "a", since: "2.0.0", description: "já aplicada", fn: "rubrica/migrations:a" },
        { id: "b", since: "2.1.0", description: "nova", fn: "rubrica/migrations:b" },
        { id: "c", since: "2.3.0", description: "futura", fn: "rubrica/migrations:c" },
      ],
      ejected: [{ tipo: "hero", status: "mudou", arquivo: "src/overrides/hero/index.tsx", original: "/x/basic.tsx" }, { tipo: "faq", status: "igual", arquivo: "f" }],
    });
    expect(plan.convex.write).toEqual(["convex/rubrica/posts.ts"]);
    expect(plan.convex.create).toEqual(["convex/rubrica/team.ts"]);
    expect(plan.convex.remove).toEqual(["convex/rubrica/velho.ts"]);
    expect(plan.migrations.map((m) => m.id)).toEqual(["b"]);
    expect(plan.ejectedChanged.map((e) => e.tipo)).toEqual(["hero"]);
    const text = formatPlan(plan);
    expect(text).toContain("@rubrica/core: 2.0.0 → 2.2.0");
    expect(text).toContain("apagar convex/rubrica/velho.ts");
    expect(text).toContain("npx convex run rubrica/migrations:b");
    expect(text).toContain("hero: src/overrides/hero/index.tsx ↔ /x/basic.tsx");
    expect(text).not.toContain("minhas.ts");
  });

  it("sem a lista do núcleo, não apaga nem cria módulos do convex/rubrica", () => {
    const disk = { ...convexFiles(CORE_MODULES), ...convexOwnedFiles() };
    const plan = planUpdate({ packages: [], modules: {}, convexOnDisk: disk, fromVersion: "2.0.0", migrations: [], ejected: [] });
    expect(plan.convex).toMatchObject({ write: [], create: [], remove: [] });
  });
});

/** Versão atual do pacote no monorepo (o projeto de teste instala os pacotes por link). */
const workspaceVersion = (dir: string): string => JSON.parse(readFileSync(repo(dir, "package.json"), "utf-8")).version;

describe("update --dry-run (projeto instalado)", () => {
  it("mostra o plano com o núcleo instalado e não grava nada", async () => {
    const dir = installedProject();
    ejectBlock(dir, readState(dir), "hero");
    const state = readState(dir);
    state.ejetados!.hero!.hash = "antigo";
    writeState(dir, state);
    writeFileSync(join(dir, "convex/rubrica/posts.ts"), "// Gerado pelo Rubrica (@rubrica/core). Não edite: atualize o pacote.\nantigo\n");
    const before = snapshot(dir);
    const shell = new FakeShell();
    const npm = shell.runner;
    shell.runner = (file, args, opts) => (file === "npm" && args[0] === "view" ? "2.1.0\n" : file === "git" ? "" : npm(file, args, opts));

    const { plan, core } = await computeUpdatePlan(dir, { cwd: dir, runner: shell.runner });
    expect(core?.modules.posts).toEqual(CORE_MODULES.posts);
    expect(plan.packages).toEqual([
      { pkg: "@rubrica/core", from: workspaceVersion("packages/core"), to: "2.1.0" },
      { pkg: "@rubrica/theme-padrao", from: workspaceVersion("packages/themes/padrao"), to: "2.1.0" },
    ]);
    expect(plan.convex.write).toEqual(["convex/rubrica/posts.ts"]);
    expect(plan.ejectedChanged.map((e) => e.tipo)).toEqual(["hero"]);

    await runUpdate(["--dry-run"], { cwd: dir, runner: shell.runner });
    expect(snapshot(dir)).toEqual(before);
    expect(shell.calls.some((c) => c[0] === "pnpm" || c[0] === "npm" && c[1] !== "view")).toBe(false);
  }, 60_000);

  it("verificar aponta o convex/ fora do núcleo e passa quando em dia", async () => {
    const dir = installedProject();
    expect((await verifyProject(dir)).problems).toEqual([]);
    writeFileSync(join(dir, "convex/rubrica/posts.ts"), "// Gerado pelo Rubrica (@rubrica/core). Não edite: atualize o pacote.\nantigo\n");
    const { problems } = await verifyProject(dir);
    expect(problems.join(" ")).toMatch(/convex\/rubrica\/posts.ts/);
  }, 60_000);
});
