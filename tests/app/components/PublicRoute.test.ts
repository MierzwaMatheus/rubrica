import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "../../..");
const src = readFileSync(resolve(ROOT, "src/components/PublicRoute.tsx"), "utf-8");

describe("PublicRoute — sem duplicação de Layout", () => {
  it("não importa o componente Layout", () => {
    expect(src).not.toMatch(/import.*Layout/);
  });

  it("não renderiza <Layout>", () => {
    expect(src).not.toMatch(/<Layout[\s>]/);
  });

  it("retorna apenas os children sem wrapper adicional", () => {
    expect(src).toMatch(/return\s*<>\s*\{children\}\s*<\/>/);
  });
});
