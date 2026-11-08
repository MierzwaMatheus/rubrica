import { describe, expect, it } from "vitest";
import { defineLocales, localizedPath, pick, pickWithFallback, splitLocale, translatedLocales } from "../src/i18n";

const cfg = defineLocales({ locales: ["pt-BR", "en", "es"], default: "pt-BR" });

describe("idiomas", () => {
  it("principal sem prefixo, outros com o prefixo do idioma", () => {
    expect(localizedPath("/", "pt-BR", cfg)).toBe("/");
    expect(localizedPath("/blog", "pt-BR", cfg)).toBe("/blog");
    expect(localizedPath("/", "en", cfg)).toBe("/en");
    expect(localizedPath("/blog/x", "es", cfg)).toBe("/es/blog/x");
  });

  it("idioma principal configurável (decisão 27)", () => {
    const en = defineLocales({ locales: ["en", "pt-BR"], default: "en" });
    expect(localizedPath("/about", "en", en)).toBe("/about");
    expect(localizedPath("/about", "pt-BR", en)).toBe("/pt/about");
    expect(splitLocale("/pt/about", en)).toEqual({ locale: "pt-BR", path: "/about" });
  });

  it("mantém as URLs /en da v1 com en-US", () => {
    const v1 = defineLocales({ locales: ["pt-BR", "en-US"], default: "pt-BR" });
    expect(localizedPath("/blog", "en-US", v1)).toBe("/en/blog");
  });

  it("separa idioma e caminho", () => {
    expect(splitLocale("/en/blog", cfg)).toEqual({ locale: "en", path: "/blog" });
    expect(splitLocale("/en", cfg)).toEqual({ locale: "en", path: "/" });
    expect(splitLocale("/blog", cfg)).toEqual({ locale: "pt-BR", path: "/blog" });
    expect(splitLocale("/english", cfg)).toEqual({ locale: "pt-BR", path: "/english" });
  });

  it("conteúdo sem tradução não cai no principal (decisão 28)", () => {
    expect(pick({ "pt-BR": "Olá" }, "en")).toBeUndefined();
    expect(pick({ "pt-BR": "Olá", en: "  " }, "en")).toBeUndefined();
    expect(pickWithFallback({ "pt-BR": "Olá" }, "en", cfg)).toBe("Olá");
    expect(translatedLocales({ "pt-BR": "a", es: "b", en: "" }, cfg)).toEqual(["pt-BR", "es"]);
  });

  it("recusa configuração inválida", () => {
    expect(() => defineLocales({ locales: ["en"], default: "pt-BR" })).toThrow();
    expect(() => defineLocales({ locales: ["pt-BR", "en-US", "en-GB"], default: "pt-BR" })).toThrow(/prefixo/);
  });
});
