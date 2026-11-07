import { describe, it, expect } from "vitest";
import {
  isLocalizedPath,
  localeFromPath,
  localizedPath,
  routerBase,
  stripLocale,
} from "@/i18n/localePath";

describe("localePath — idioma pela URL", () => {
  it("/en e /en/... são inglês; o resto é pt-BR", () => {
    expect(localeFromPath("/en")).toBe("en-US");
    expect(localeFromPath("/en/blog/x")).toBe("en-US");
    expect(localeFromPath("/")).toBe("pt-BR");
    expect(localeFromPath("/blog/x")).toBe("pt-BR");
  });

  it("não confunde slug que começa com 'en' com o prefixo", () => {
    expect(localeFromPath("/english-post")).toBe("pt-BR");
    expect(localeFromPath("/envio")).toBe("pt-BR");
    expect(stripLocale("/envio")).toBe("/envio");
  });

  it("stripLocale tira o prefixo e a home em inglês vira /", () => {
    expect(stripLocale("/en/blog/x")).toBe("/blog/x");
    expect(stripLocale("/en")).toBe("/");
    expect(stripLocale("/sobre")).toBe("/sobre");
  });

  it("localizedPath leva o caminho para o idioma pedido", () => {
    expect(localizedPath("/blog/x", "en-US")).toBe("/en/blog/x");
    expect(localizedPath("/", "en-US")).toBe("/en");
    expect(localizedPath("/en/blog/x", "pt-BR")).toBe("/blog/x");
    expect(localizedPath("/en", "pt-BR")).toBe("/");
    expect(localizedPath("/en/blog/x", "en-US")).toBe("/en/blog/x");
  });

  it("painel, login e playground não ganham versão em inglês", () => {
    expect(isLocalizedPath("/admin/blog")).toBe(false);
    expect(isLocalizedPath("/login")).toBe(false);
    expect(isLocalizedPath("/playground/blog")).toBe(false);
    expect(localizedPath("/admin", "en-US")).toBe("/admin");
    expect(isLocalizedPath("/administracao-de-tempo")).toBe(true);
  });

  it("routerBase é vazio em pt-BR e /en em inglês", () => {
    expect(routerBase("pt-BR")).toBe("");
    expect(routerBase("en-US")).toBe("/en");
  });
});
