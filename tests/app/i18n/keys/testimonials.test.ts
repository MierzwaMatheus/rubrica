import { describe, it, expect } from "vitest";
import { StaticTranslationsRepository } from "@/i18n/implementations/StaticTranslationsRepository";
import fs from "fs";
import path from "path";

const repo = new StaticTranslationsRepository();
const source = fs.readFileSync(
  path.resolve(__dirname, "../../../../src/pages/Testimonials.tsx"),
  "utf-8",
);

describe("testimonials i18n keys", () => {
  it("testimonials.title exists in pt-BR", () => {
    expect(repo.getStaticTranslation("testimonials.title", "pt-BR")).toBe("Depoimentos");
  });

  it("testimonials.title exists in en-US", () => {
    expect(repo.getStaticTranslation("testimonials.title", "en-US")).toBe("Testimonials");
  });

  it("testimonials.subtitle exists in pt-BR", () => {
    expect(repo.getStaticTranslation("testimonials.subtitle", "pt-BR")).toBe(
      "Experiências de clientes e colaboradores que trabalharam comigo.",
    );
  });

  it("testimonials.subtitle exists in en-US", () => {
    expect(repo.getStaticTranslation("testimonials.subtitle", "en-US")).toBe(
      "Experiences from clients and collaborators I've worked with.",
    );
  });

  it("testimonials.empty exists in pt-BR", () => {
    expect(repo.getStaticTranslation("testimonials.empty", "pt-BR")).toBe(
      "Nenhum depoimento publicado ainda.",
    );
  });

  it("testimonials.empty exists in en-US", () => {
    expect(repo.getStaticTranslation("testimonials.empty", "en-US")).toBe(
      "No testimonials published yet.",
    );
  });

  it("testimonials.leaveTestimonial exists in pt-BR", () => {
    expect(repo.getStaticTranslation("testimonials.leaveTestimonial", "pt-BR")).toBe(
      "Deixar meu depoimento",
    );
  });

  it("testimonials.leaveTestimonial exists in en-US", () => {
    expect(repo.getStaticTranslation("testimonials.leaveTestimonial", "en-US")).toBe(
      "Leave my testimonial",
    );
  });

  it("Testimonials.tsx does not hardcode 'Depoimentos' as JSX text", () => {
    // Should use t("testimonials.title") instead
    expect(source).not.toMatch(/>Depoimentos</);
  });

  it("Testimonials.tsx does not hardcode subtitle text", () => {
    expect(source).not.toContain(
      "Experiências de clientes e colaboradores que trabalharam comigo.",
    );
  });

  it("Testimonials.tsx does not hardcode empty state text", () => {
    expect(source).not.toContain("Nenhum depoimento publicado ainda.");
  });

  it("Testimonials.tsx does not hardcode leave testimonial button text", () => {
    expect(source).not.toContain("Deixar meu depoimento");
  });
});
