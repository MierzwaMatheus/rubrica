import { describe, it, expect } from "vitest";
import { StaticTranslationsRepository } from "@/i18n/implementations/StaticTranslationsRepository";

const repo = new StaticTranslationsRepository();

describe("blog i18n keys", () => {
  it("blog.filterByTags exists in pt-BR", () => {
    expect(repo.getStaticTranslation("blog.filterByTags", "pt-BR")).toBe(
      "Filtrar por tags",
    );
  });

  it("blog.filterByTags exists in en-US", () => {
    expect(repo.getStaticTranslation("blog.filterByTags", "en-US")).toBe(
      "Filter by tags",
    );
  });

  it("Blog.tsx does not hardcode 'Filtrar por tags' in JSX", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const blogSource = fs.readFileSync(
      path.resolve(__dirname, "../../../../src/pages/Blog.tsx"),
      "utf-8",
    );
    // Match string both as JSX text content and as JS string literal
    const hardcodedOccurrences = (blogSource.match(/Filtrar por tags/g) || []).length;
    expect(hardcodedOccurrences).toBe(0);
  });
});
