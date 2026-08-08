import { describe, it, expect } from "vitest";
import { StaticTranslationsRepository } from "@/i18n/implementations/StaticTranslationsRepository";
import fs from "fs";
import path from "path";

const repo = new StaticTranslationsRepository();
const source = fs.readFileSync(
  path.resolve(__dirname, "../../../../src/pages/Home.tsx"),
  "utf-8",
);

describe("home i18n keys", () => {
  it("home.catRole exists in pt-BR", () => {
    expect(repo.getStaticTranslation("home.catRole", "pt-BR")).toBe("cat role.txt");
  });

  it("home.catRole exists in en-US", () => {
    expect(repo.getStaticTranslation("home.catRole", "en-US")).toBe("cat role.txt");
  });

  it("home.loading exists in pt-BR", () => {
    expect(repo.getStaticTranslation("home.loading", "pt-BR")).toContain(
      "Carregando informações do perfil",
    );
  });

  it("home.loading exists in en-US", () => {
    expect(repo.getStaticTranslation("home.loading", "en-US")).toContain(
      "Loading profile information",
    );
  });

  it("home.loadingTestimonial exists in pt-BR", () => {
    expect(repo.getStaticTranslation("home.loadingTestimonial", "pt-BR")).toContain(
      "Carregando depoimento",
    );
  });

  it("home.loadingTestimonial exists in en-US", () => {
    expect(repo.getStaticTranslation("home.loadingTestimonial", "en-US")).toContain(
      "Loading testimonial",
    );
  });

  it("Home.tsx does not hardcode 'cat role.txt' as JSX text", () => {
    // Must not appear as bare JSX text content (outside t() call)
    expect(source).not.toMatch(/>\s*cat role\.txt\s*</);
  });

  it("Home.tsx does not hardcode 'Ver todos os depoimentos' as JSX text", () => {
    expect(source).not.toMatch(/Ver todos os depoimentos/);
  });

  it("Home.tsx does not hardcode 'Deixar meu depoimento' as JSX text", () => {
    expect(source).not.toMatch(/Deixar meu depoimento/);
  });

  it("Home.tsx does not hardcode loading profile text", () => {
    expect(source).not.toContain("Carregando informações do perfil");
  });

  it("Home.tsx does not hardcode loading testimonial text", () => {
    expect(source).not.toContain("Carregando depoimento");
  });
});
