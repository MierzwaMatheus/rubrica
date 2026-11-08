import { describe, expect, it } from "vitest";
import { packageManagerFromUserAgent, runScript } from "../utils/packageManager";

describe("gerenciador de pacotes", () => {
  it("usa pnpm só quando o create rodou com pnpm", () => {
    expect(packageManagerFromUserAgent("pnpm/10.0.0 npm/? node/v24")).toBe("pnpm");
    expect(packageManagerFromUserAgent("npm/10.0.0 node/v24")).toBe("npm");
    expect(packageManagerFromUserAgent(undefined)).toBe("npm");
  });

  it("monta o comando de um script que o gerenciador aceita", () => {
    // `npm dev` não existe: no npm, scripts próprios rodam com `npm run`.
    expect(runScript("npm", "dev")).toBe("npm run dev");
    expect(runScript("pnpm", "dev")).toBe("pnpm dev");
  });
});

describe("README do projeto", () => {
  it("mostra os comandos do gerenciador do projeto", async () => {
    const { readme } = await import("../project/files");
    const state = { identidade: { nome: "Roxus" }, tema: "padrao", tipo: "empresa" } as unknown as Parameters<typeof readme>[0];
    expect(readme(state, "npm")).toContain("`npm run dev` (e `npm run dev:convex` em outro terminal)");
    expect(readme(state)).toContain("`pnpm dev` (e `pnpm dev:convex` em outro terminal)");
  });
});
