/** Leitura do tema instalado: o pacote de verdade, empacotado com o esbuild do projeto. */
import { mkdirSync, mkdtempSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, describe, expect, it } from "vitest";
import { loadProjectTheme, themePackageOf, themeRecipe, themeVariants } from "../src/theme";

const repo = fileURLToPath(new URL("../../..", import.meta.url));
const dirs: string[] = [];

/** Projeto descartável com o node_modules apontando para os pacotes do monorepo. */
function project(files: Record<string, string>, links: Record<string, string> = {}): string {
  const root = mkdtempSync(join(tmpdir(), "rb-mcp-tema-"));
  dirs.push(root);
  const all: Record<string, string> = {
    convex: join(repo, "packages/mcp/node_modules/convex"),
    react: join(repo, "packages/themes/padrao/node_modules/react"),
    "@rubrica/core": join(repo, "packages/core"),
    "@rubrica/theme-padrao": join(repo, "packages/themes/padrao"),
    ...links,
  };
  for (const [name, target] of Object.entries(all)) {
    const at = join(root, "node_modules", name);
    mkdirSync(dirname(at), { recursive: true });
    symlinkSync(target, at, "dir");
  }
  writeFileSync(join(root, "package.json"), JSON.stringify({ name: "site", type: "module" }));
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), content);
  }
  return root;
}

afterAll(() => {
  for (const d of dirs) rmSync(d, { recursive: true, force: true });
});

describe("tema do projeto", () => {
  it("acha o pacote no astro.config.ts e, sem ele, no rubrica.json", () => {
    const a = project({ "astro.config.ts": 'rubrica({\n  // rubrica:tema:inicio\n  theme: "@rubrica/theme-zine",\n  // rubrica:tema:fim\n})' });
    expect(themePackageOf(a)).toBe("@rubrica/theme-zine");
    const b = project({ "rubrica.json": JSON.stringify({ tema: "cyberpunk" }) });
    expect(themePackageOf(b)).toBe("@rubrica/theme-cyberpunk");
    expect(themePackageOf(project({}))).toBeNull();
  });

  it("lê as variações e as receitas do pacote instalado, sem renderizar nada", async () => {
    const root = project({ "rubrica.json": JSON.stringify({ tema: "padrao" }) });
    const theme = await loadProjectTheme(root);
    expect(theme).toMatchObject({ source: "tema", id: "padrao", package: "@rubrica/theme-padrao" });
    expect(themeVariants(theme, "cases").map((v) => v.value)).toEqual(["grade", "lista"]);
    // O padrão desenha o próprio hero: sem variações do núcleo para ele.
    expect(theme.overridden).toContain("hero");
    expect(themeVariants(theme, "hero")).toEqual([]);
    expect(themeRecipe(theme, "pessoal")[0]!.blocks.map((b) => b.type)).toContain("numeros");
    // O arquivo temporário não fica para trás.
    expect(readdirSync(join(root, "node_modules/.cache/rubrica-mcp"))).toEqual([]);
  }, 30_000);

  it("tema local do projeto (caminho no astro.config.ts) com variação própria", async () => {
    const root = project({
      "astro.config.ts": 'export default { integrations: [rubrica({ theme: "./tema/index.tsx" })] };',
      "tema/index.tsx": `import { defineTheme } from "@rubrica/core";
import "./styles.css";
const Shell = ({ children }: { children: unknown }) => <div>{children as never}</div>;
export default defineTheme({ id: "farol", label: "Farol", contract: "^1", tokens: {}, Shell: Shell as never, variants: { selos: [{ value: "faixa", label: "Faixa" }] } });`,
      "tema/styles.css": "body { color: red }",
    });
    const theme = await loadProjectTheme(root);
    expect(theme).toMatchObject({ source: "tema", id: "farol", label: "Farol" });
    expect(themeVariants(theme, "selos")).toEqual([{ value: "faixa", label: "Faixa" }]);
    expect(themeRecipe(theme, "empresa").some((p) => p.path === "/quem-somos")).toBe(true);
  }, 30_000);

  it("falha legível: sem projeto, sem tema ou com pacote ausente, valem as do núcleo", async () => {
    expect((await loadProjectTheme(null)).source).toBe("nucleo");
    const missing = await loadProjectTheme(project({ "rubrica.json": JSON.stringify({ tema: "inexistente" }) }));
    expect(missing).toMatchObject({ source: "nucleo", package: "@rubrica/theme-inexistente" });
    expect(missing.problem).toContain("Não consegui ler o tema");
    expect(themeVariants(missing, "cases").map((v) => v.value)).toEqual(["grade", "lista"]);
  }, 30_000);
});
