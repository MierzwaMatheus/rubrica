import { describe, it, expect } from "vitest";
import {
  normalizeUrl,
  validateUrl,
  normalizeHandle,
  normalizeEmail,
  validateEmail,
} from "../utils/normalize.js";

describe("normalizeUrl", () => {
  it.each([
    ["meusite.com", "https://meusite.com"],
    ["www.meusite.com.br", "https://www.meusite.com.br"],
    ["  meusite.com  ", "https://meusite.com"],
    ["meusite.com/", "https://meusite.com"],
    ["https://meusite.com///", "https://meusite.com"],
    ["https://meusite.com", "https://meusite.com"],
    ["http://meusite.com", "http://meusite.com"],
    ["HTTPS://meusite.com", "https://meusite.com"],
    ["Http://meusite.com", "http://meusite.com"],
    ["localhost:3000", "http://localhost:3000"],
    ["localhost", "http://localhost"],
    ["meusite.com/localhost", "https://meusite.com/localhost"],
    ["meusite.com/ir?para=https://x.com", "https://meusite.com/ir?para=https://x.com"],
    ["127.0.0.1:3000", "http://127.0.0.1:3000"],
    ["meusite.com/portfolio/", "https://meusite.com/portfolio"],
    ["", ""],
    ["   ", ""],
  ])("%j vira %j", (input, expected) => {
    expect(normalizeUrl(input)).toBe(expected);
  });
});

describe("validateUrl", () => {
  it.each(["meusite.com", "https://meusite.com/", "localhost:3000", "http://127.0.0.1:3000"])(
    "aceita %j (sem exigir o https://)",
    (input) => {
      expect(validateUrl(input)).toBeUndefined();
    }
  );

  it("recusa vazio com mensagem pedindo o endereço", () => {
    expect(validateUrl("  ")).toMatch(/Informe o endereço/);
  });

  it.each(["meusite", "meu site.com", "https://", "https://meusite"])(
    "recusa %j com um exemplo do formato",
    (input) => {
      expect(validateUrl(input)).toMatch(/meusite\.com/);
    }
  );
});

describe("normalizeHandle", () => {
  it.each([
    ["fulano", "fulano"],
    ["@fulano", "fulano"],
    ["  @fulano  ", "fulano"],
    ["https://x.com/fulano", "fulano"],
    ["https://twitter.com/fulano/", "fulano"],
    ["x.com/fulano", "fulano"],
    ["x.com/fulano//", "fulano"],
    ["www.x.com/fulano?s=20", "fulano"],
    ["", ""],
  ])("%j vira %j", (input, expected) => {
    expect(normalizeHandle(input)).toBe(expected);
  });
});

describe("normalizeEmail", () => {
  it("tira espaços e deixa minúsculo", () => {
    expect(normalizeEmail("  Fulana@Site.COM ")).toBe("fulana@site.com");
  });
});

describe("validateEmail", () => {
  it.each(["fulana@site.com", "  fulana@site.com  ", "fulana@site.com.br"])("aceita %j", (input) => {
    expect(validateEmail(input)).toBeUndefined();
  });

  it.each(["", "fulana", "fulana@site", "fulana.site.com", "ful ana@site.com", "@site.com", "fulana@.com", "fulana@site.", "fulana@site.com@outro"])(
    "recusa %j com um exemplo",
    (input) => {
      expect(validateEmail(input)).toMatch(/nome@meusite\.com/);
    }
  );
});
