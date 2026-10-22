import { describe, it, expect, afterEach, vi } from "vitest";
import { siteUrl, allowedOrigins } from "../../convex/lib/siteUrl";
import { rubricalConfig } from "../../rubrica.config";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("siteUrl", () => {
  it("usa rubrica.config.ts quando SITE_URL não está definida", () => {
    vi.stubEnv("SITE_URL", "");
    expect(siteUrl()).toBe(rubricalConfig.siteUrl.replace(/\/+$/, ""));
  });

  it("prefere a env SITE_URL e remove a barra final", () => {
    vi.stubEnv("SITE_URL", "https://meusite.dev/");
    expect(siteUrl()).toBe("https://meusite.dev");
  });
});

describe("allowedOrigins", () => {
  it("aceita o domínio do site com e sem www, além do dev server", () => {
    vi.stubEnv("SITE_URL", "https://meusite.dev");
    const origins = allowedOrigins();
    expect(origins.has("https://meusite.dev")).toBe(true);
    expect(origins.has("https://www.meusite.dev")).toBe(true);
    expect(origins.has("http://localhost:5173")).toBe(true);
  });

  it("não aceita domínios fixos de outro deployment", () => {
    vi.stubEnv("SITE_URL", "https://meusite.dev");
    expect(allowedOrigins().has("https://www.mmlo.com.br")).toBe(false);
  });

  it("com SITE_URL inválida, aceita só o dev server", () => {
    vi.stubEnv("SITE_URL", "não é url");
    expect([...allowedOrigins()].every((o) => o.startsWith("http://localhost"))).toBe(true);
  });
});
