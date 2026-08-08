import { describe, it, expect, beforeEach } from "vitest";
import { seed } from "../../convex/contactInfo";
import { createMockCtx, type MockCtx } from "../_helpers/convexCtx";

const handler = (fn: any) => fn._handler ?? fn;

describe("convex/contactInfo · seed", () => {
  let ctx: MockCtx;

  beforeEach(() => {
    ctx = createMockCtx();
  });

  it("insere exatamente um registro com nome Ana Souza em banco vazio", async () => {
    await handler(seed)(ctx, {});
    const docs = ctx.db._all("contactInfo");
    expect(docs.length).toBe(1);
    expect(docs[0].name).toBe("Ana Souza");
  });

  it("popula email como string não-vazia em formato válido", async () => {
    await handler(seed)(ctx, {});
    const doc = ctx.db._all("contactInfo")[0];
    expect(typeof doc.email).toBe("string");
    expect(doc.email.length).toBeGreaterThan(0);
    expect(doc.email).toMatch(/@/);
  });

  it("popula avatarUrl apontando para picsum.photos com seed determinístico", async () => {
    await handler(seed)(ctx, {});
    const doc = ctx.db._all("contactInfo")[0];
    expect(doc.avatarUrl).toMatch(/^https:\/\/picsum\.photos\/seed\/[a-z0-9-]+\/512\/512$/);
  });

  it("popula roleTranslations com ptBR não-vazio", async () => {
    await handler(seed)(ctx, {});
    const doc = ctx.db._all("contactInfo")[0];
    expect(doc.roleTranslations).toBeDefined();
    expect(typeof doc.roleTranslations.ptBR).toBe("string");
    expect(doc.roleTranslations.ptBR.length).toBeGreaterThan(0);
  });

  it("popula role com texto específico (ptBR)", async () => {
    await handler(seed)(ctx, {});
    const doc = ctx.db._all("contactInfo")[0];
    expect(doc.role).toBe("Desenvolvedora Full-Stack");
  });

  it("popula birthDate em formato AAAA-MM-DD", async () => {
    await handler(seed)(ctx, {});
    const doc = ctx.db._all("contactInfo")[0];
    expect(doc.birthDate).toBe("1995-03-15");
  });

  it("popula location com cidade/país ptBR", async () => {
    await handler(seed)(ctx, {});
    const doc = ctx.db._all("contactInfo")[0];
    expect(doc.location).toBe("São Paulo, Brasil");
  });

  it("popula phone em formato brasileiro", async () => {
    await handler(seed)(ctx, {});
    const doc = ctx.db._all("contactInfo")[0];
    expect(doc.phone).toBeDefined();
    expect(doc.phone).toMatch(/^\+55/);
  });

  it("popula linkedinUrl e githubUrl apontando para os respectivos domínios", async () => {
    await handler(seed)(ctx, {});
    const doc = ctx.db._all("contactInfo")[0];
    expect(doc.linkedinUrl).toMatch(/linkedin\.com/);
    expect(doc.githubUrl).toMatch(/github\.com/);
  });

  it("seta flags show* com defaults esperados (email true, phone/birthDate false, location true)", async () => {
    await handler(seed)(ctx, {});
    const doc = ctx.db._all("contactInfo")[0];
    expect(doc.showEmail).toBe(true);
    expect(doc.showPhone).toBe(false);
    expect(doc.showBirthDate).toBe(false);
    expect(doc.showLocation).toBe(true);
  });

  it("seta createdAt numérico positivo", async () => {
    await handler(seed)(ctx, {});
    const doc = ctx.db._all("contactInfo")[0];
    expect(typeof doc.createdAt).toBe("number");
    expect(doc.createdAt).toBeGreaterThan(0);
  });

  it("é idempotente: não insere duplicado e não sobrescreve registro existente", async () => {
    ctx.db._seed("contactInfo", [
      { name: "Existing User", email: "existing@test.com", createdAt: 1 },
    ]);
    await handler(seed)(ctx, {});
    const docs = ctx.db._all("contactInfo");
    expect(docs.length).toBe(1);
    expect(docs[0].name).toBe("Existing User");
    expect(docs[0].email).toBe("existing@test.com");
  });
});