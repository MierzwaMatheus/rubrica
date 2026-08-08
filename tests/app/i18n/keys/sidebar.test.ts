import { describe, it, expect } from "vitest";
import { StaticTranslationsRepository } from "@/i18n/implementations/StaticTranslationsRepository";
import fs from "fs";
import path from "path";

const repo = new StaticTranslationsRepository();
const source = fs.readFileSync(
  path.resolve(__dirname, "../../../../src/components/Sidebar.tsx"),
  "utf-8",
);

describe("sidebar i18n keys", () => {
  it("sidebar.terminalHint exists in pt-BR", () => {
    expect(repo.getStaticTranslation("sidebar.terminalHint", "pt-BR")).toBe(
      "Pressione ~ para o terminal",
    );
  });

  it("sidebar.terminalHint exists in en-US", () => {
    expect(repo.getStaticTranslation("sidebar.terminalHint", "en-US")).toBe(
      "Press ~ for terminal",
    );
  });

  it("Sidebar.tsx does not hardcode 'for terminal' as bare JSX text", () => {
    // The text should come from t() not be inline JSX text node
    expect(source).not.toMatch(/Press.*for terminal/);
  });
});
