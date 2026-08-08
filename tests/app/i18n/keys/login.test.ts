import { describe, it, expect } from "vitest";
import { StaticTranslationsRepository } from "@/i18n/implementations/StaticTranslationsRepository";
import fs from "fs";
import path from "path";

const repo = new StaticTranslationsRepository();
const source = fs.readFileSync(
  path.resolve(__dirname, "../../../../src/pages/Login.tsx"),
  "utf-8",
);

describe("login i18n keys", () => {
  it("auth.adminArea exists in pt-BR", () => {
    expect(repo.getStaticTranslation("auth.adminArea", "pt-BR")).toBe("Área Administrativa");
  });

  it("auth.adminArea exists in en-US", () => {
    expect(repo.getStaticTranslation("auth.adminArea", "en-US")).toBe("Administrative Area");
  });

  it("auth.enterCredentials exists in pt-BR", () => {
    expect(repo.getStaticTranslation("auth.enterCredentials", "pt-BR")).toBe(
      "Entre com suas credenciais para acessar o painel",
    );
  });

  it("auth.enterCredentials exists in en-US", () => {
    expect(repo.getStaticTranslation("auth.enterCredentials", "en-US")).toBe(
      "Sign in with your credentials to access the dashboard",
    );
  });

  it("auth.password exists in pt-BR", () => {
    expect(repo.getStaticTranslation("auth.password", "pt-BR")).toBe("Senha");
  });

  it("auth.password exists in en-US", () => {
    expect(repo.getStaticTranslation("auth.password", "en-US")).toBe("Password");
  });

  it("auth.signingIn exists in pt-BR", () => {
    expect(repo.getStaticTranslation("auth.signingIn", "pt-BR")).toBe("Entrando...");
  });

  it("auth.signingIn exists in en-US", () => {
    expect(repo.getStaticTranslation("auth.signingIn", "en-US")).toBe("Signing in...");
  });

  it("auth.signIn exists in pt-BR", () => {
    expect(repo.getStaticTranslation("auth.signIn", "pt-BR")).toBe("Entrar");
  });

  it("auth.signIn exists in en-US", () => {
    expect(repo.getStaticTranslation("auth.signIn", "en-US")).toBe("Sign in");
  });

  it("auth.invalidCredentials exists in pt-BR", () => {
    expect(repo.getStaticTranslation("auth.invalidCredentials", "pt-BR")).toBe(
      "Credenciais inválidas. Verifique seu email e senha.",
    );
  });

  it("auth.invalidCredentials exists in en-US", () => {
    expect(repo.getStaticTranslation("auth.invalidCredentials", "en-US")).toBe(
      "Invalid credentials. Check your email and password.",
    );
  });

  it("Login.tsx does not hardcode 'Área Administrativa'", () => {
    expect(source).not.toContain("Área Administrativa");
  });

  it("Login.tsx does not hardcode 'Entre com suas credenciais'", () => {
    expect(source).not.toContain("Entre com suas credenciais");
  });

  it("Login.tsx does not hardcode 'Senha' as label text", () => {
    expect(source).not.toMatch(/>Senha</);
  });

  it("Login.tsx does not hardcode 'Entrando...'", () => {
    expect(source).not.toContain("Entrando...");
  });

  it("Login.tsx does not hardcode 'Entrar' as button text", () => {
    expect(source).not.toMatch(/"Entrar"/);
  });

  it("Login.tsx does not hardcode invalidCredentials error message", () => {
    expect(source).not.toContain("Credenciais inválidas");
  });
});
