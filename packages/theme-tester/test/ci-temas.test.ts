import { describe, expect, it } from "vitest";
// @ts-expect-error script em JavaScript puro, fora do pacote
import { AMOSTRA, selectThemes } from "../../../.github/scripts/ci-temas.mjs";

const themes = ["bento", "brutalist", "chat", "cyberpunk", "padrao", "swiss", "zine"];
const pick = (files: string[], extra: Partial<Parameters<typeof selectThemes>[0]> = {}) => selectThemes({ files, themes, ...extra });

describe("temas que o CI testa", () => {
  it("tema alterado: só ele, com Lighthouse", () => {
    expect(pick(["packages/themes/swiss/src/styles.css"])).toEqual([{ dir: "swiss", lighthouse: true }]);
  });

  it("núcleo alterado: a amostra, sem Lighthouse", () => {
    expect(pick(["packages/core/src/styles/app.css"])).toEqual(AMOSTRA.map((dir: string) => ({ dir, lighthouse: false })));
  });

  it("núcleo e um tema: a amostra mais o tema; tema da amostra ganha Lighthouse", () => {
    const out = pick(["packages/core/src/x.ts", "packages/themes/zine/src/a.tsx", "packages/themes/chat/src/b.tsx"]);
    expect(out).toContainEqual({ dir: "zine", lighthouse: true });
    expect(out).toContainEqual({ dir: "chat", lighthouse: true });
    expect(out).toContainEqual({ dir: "padrao", lighthouse: false });
    expect(out).toHaveLength(5);
  });

  it("release (changeset, changelog, versão): nenhum tema", () => {
    const files = [".changeset/x.md", "CHANGELOG.md", "packages/core/CHANGELOG.md", "packages/core/package.json", "packages/themes/swiss/package.json"];
    expect(pick(files, { onlyVersion: () => true })).toEqual([]);
  });

  it("package.json com mais que a versão conta como mudança", () => {
    expect(pick(["packages/core/package.json"], { onlyVersion: () => false })).toHaveLength(AMOSTRA.length);
  });

  it("CLI, MCP ou documentação: nenhum tema", () => {
    expect(pick(["packages/create-rubrica/src/a.ts", "packages/mcp/src/b.ts", "docs/guia/x.md", "apps/docs/src/y.astro"])).toEqual([]);
  });

  it("dependências ou o próprio CI: a amostra", () => {
    expect(pick(["pnpm-lock.yaml"])).toHaveLength(AMOSTRA.length);
    expect(pick([".github/workflows/ci.yml"])).toHaveLength(AMOSTRA.length);
  });

  it("--todos: todos, com Lighthouse", () => {
    expect(pick([], { all: true })).toEqual(themes.map((dir) => ({ dir, lighthouse: true })));
  });
});
