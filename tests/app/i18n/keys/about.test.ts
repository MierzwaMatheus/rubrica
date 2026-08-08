import { describe, it, expect } from "vitest";
import { StaticTranslationsRepository } from "@/i18n/implementations/StaticTranslationsRepository";
import fs from "fs";
import path from "path";

const repo = new StaticTranslationsRepository();
const source = fs.readFileSync(
  path.resolve(__dirname, "../../../../src/pages/About.tsx"),
  "utf-8",
);

describe("about i18n keys", () => {
  it("about.tapToKnowMore exists in pt-BR", () => {
    expect(repo.getStaticTranslation("about.tapToKnowMore", "pt-BR")).toBe(
      "Toque para Saber Mais",
    );
  });

  it("about.tapToKnowMore exists in en-US", () => {
    expect(repo.getStaticTranslation("about.tapToKnowMore", "en-US")).toBe(
      "Tap to Learn More",
    );
  });

  it("About.tsx does not hardcode 'Toque para Saber Mais'", () => {
    expect(source).not.toContain("Toque para Saber Mais");
  });
});
