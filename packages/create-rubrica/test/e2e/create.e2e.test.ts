/**
 * Ponta a ponta: o create gera um projeto que instala (pacotes do monorepo por link:)
 * e builda com os dados de exemplo da demo (RUBRICA_FIXTURES), sem Convex.
 * Desligue com RUBRICA_SKIP_E2E=1.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createProject, resolveCreateOptions } from "../../src/commands/create";
import { ejectBlock } from "../../src/commands/eject";
import { readState } from "../../src/state";
import { run } from "../../src/utils/exec";
import { repo, tmp } from "../helpers";

const skip = process.env.RUBRICA_SKIP_E2E === "1";

describe.skipIf(skip)("create → install → build (ponta a ponta)", () => {
  const parent = tmp("rubrica-e2e-");
  const dir = join(parent, "site-da-ana");

  beforeAll(async () => {
    const options = await resolveCreateOptions(
      ["site-da-ana", "--yes", "--tipo", "pessoal", "--tema", "padrao", "--nome", "Ana Souza", "--url", "ana.dev", "--idiomas", "pt-BR,en", "--local", repo(), "--sem-git", "--gerenciador", "pnpm"],
      parent,
      {},
    );
    await createProject(options);
  });

  afterAll(() => rmSync(parent, { recursive: true, force: true }));

  it("o projeto só tem configuração, convex/ gerado e personalizações", () => {
    const top = readdirSync(dir).filter((f) => f !== "node_modules" && f !== "pnpm-lock.yaml" && f !== ".rubrica").sort();
    expect(top).toEqual([".env.example", ".gitignore", ".mcp.json", "AGENTS.md", "CLAUDE.md", "README.md", "astro.config.ts", "convex", "package.json", "public", "rubrica.json", "src", "tsconfig.json", "vercel.json"].sort());
    expect(readdirSync(join(dir, "src"))).toEqual(["blocks"]);
    const demoModules = readdirSync(repo("apps/demo/convex/rubrica")).sort();
    expect(readdirSync(join(dir, "convex/rubrica")).sort()).toEqual(demoModules);
    for (const f of demoModules) expect(readFileSync(join(dir, "convex/rubrica", f), "utf-8")).toBe(readFileSync(repo("apps/demo/convex/rubrica", f), "utf-8"));
  });

  it("--local usa os pacotes reais do monorepo: núcleo, tema, CLI e MCP", () => {
    const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf-8"));
    expect(pkg.dependencies["@rubrica/core"]).toBe(`link:${repo("packages/core")}`);
    expect(pkg.dependencies["@rubrica/theme-padrao"]).toBe(`link:${repo("packages/themes/padrao")}`);
    expect(pkg.devDependencies["@rubrica/mcp"]).toBe(`link:${repo("packages/mcp")}`);
    expect(pkg.devDependencies["create-rubrica"]).toBe(`link:${repo("packages/create-rubrica")}`);
    expect(realpathSync(join(dir, "node_modules/@rubrica/mcp"))).toBe(realpathSync(repo("packages/mcp")));
  });

  it("o backend gerado empacota como no Convex", () => {
    // O script da demo confere a pasta ../convex a partir de onde ele está: vai uma cópia para o projeto.
    mkdirSync(join(dir, ".rubrica"), { recursive: true });
    copyFileSync(repo("apps/demo/scripts/convex-bundle-check.mjs"), join(dir, ".rubrica/convex-bundle-check.mjs"));
    const out = run("node", [join(dir, ".rubrica/convex-bundle-check.mjs")], { cwd: dir });
    expect(out).toMatch(/ok: \d+ exports/);
  }, 120_000);

  it("ejeta um bloco (com arquivo local importado) e o projeto continua compilando", () => {
    const { entry } = ejectBlock(dir, readState(dir), "cases");
    expect(existsSync(join(dir, entry.arquivo))).toBe(true);
    // marca na cópia, para conferir no HTML que o site usa a cópia
    const file = join(dir, "src/overrides/cases/blocks/collections.tsx");
    writeFileSync(file, readFileSync(file, "utf-8").replace('type="cases" variant={variant}>', 'type="cases" variant={variant}>\n      <span data-ejetado="sim" hidden />'));
  });

  it("builda o site estático com os dados de exemplo", () => {
    run("pnpm", ["build"], { cwd: dir, env: { RUBRICA_FIXTURES: repo("apps/demo/fixtures/pessoal") } });
    const home = readFileSync(join(dir, "dist/index.html"), "utf-8");
    expect(home).toMatch(/<h1[\s>]/);
    expect(home).toContain('lang="pt-BR"');
    expect(existsSync(join(dir, "dist/en/index.html"))).toBe(true);
    expect(existsSync(join(dir, "dist/_headers"))).toBe(true);
    expect(existsSync(join(dir, "dist/sitemap.xml"))).toBe(true);
    expect(home).toContain('data-ejetado="sim"');
  }, 300_000);

  it("os tipos do projeto passam (pnpm check)", () => {
    run("pnpm", ["check"], { cwd: dir });
  }, 120_000);
});
