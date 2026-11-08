import { describe, it, expect } from "vitest";
import { generateJwtKeys } from "../utils/generateJwtKeys.js";

describe("generateJwtKeys", () => {
  it("retorna objeto com JWT_PRIVATE_KEY e JWKS", async () => {
    const result = await generateJwtKeys();
    expect(result).toHaveProperty("JWT_PRIVATE_KEY");
    expect(result).toHaveProperty("JWKS");
  });

  it("JWT_PRIVATE_KEY começa com '-----BEGIN PRIVATE KEY-----'", async () => {
    const { JWT_PRIVATE_KEY } = await generateJwtKeys();
    expect(JWT_PRIVATE_KEY.trimStart()).toMatch(/^-----BEGIN PRIVATE KEY-----/);
  });

  it("JWT_PRIVATE_KEY termina com '-----END PRIVATE KEY-----'", async () => {
    const { JWT_PRIVATE_KEY } = await generateJwtKeys();
    expect(JWT_PRIVATE_KEY.trimEnd()).toMatch(/-----END PRIVATE KEY-----\n?$/);
  });

  it("JWKS é JSON válido parseável com JSON.parse", async () => {
    const { JWKS } = await generateJwtKeys();
    expect(() => JSON.parse(JWKS)).not.toThrow();
  });

  it("JWKS parseado contém propriedade keys que é array com pelo menos 1 elemento", async () => {
    const { JWKS } = await generateJwtKeys();
    const parsed = JSON.parse(JWKS);
    expect(Array.isArray(parsed.keys)).toBe(true);
    expect(parsed.keys.length).toBeGreaterThanOrEqual(1);
  });

  it("primeiro elemento de keys tem use: 'sig' e kty: 'RSA'", async () => {
    const { JWKS } = await generateJwtKeys();
    const parsed = JSON.parse(JWKS);
    expect(parsed.keys[0]).toMatchObject({ use: "sig", kty: "RSA" });
  });

  it("chamar duas vezes gera pares distintos (não determinístico)", async () => {
    const [a, b] = await Promise.all([generateJwtKeys(), generateJwtKeys()]);
    expect(a.JWT_PRIVATE_KEY).not.toBe(b.JWT_PRIVATE_KEY);
    expect(a.JWKS).not.toBe(b.JWKS);
  });
});
