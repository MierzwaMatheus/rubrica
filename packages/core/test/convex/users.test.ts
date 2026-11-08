// @vitest-environment edge-runtime
import { beforeEach, describe, expect, it } from "vitest";
import { assertStrongPassword, temporaryPassword } from "../../src/convex/users";
import { api, as, internal, seedSettings, setup, type T } from "./_setup";

describe("senhas", () => {
  it("exige 12 caracteres com maiúscula, minúscula e número", () => {
    expect(() => assertStrongPassword("curta")).toThrow(/12 caracteres/);
    expect(() => assertStrongPassword("semmaiuscula123")).toThrow(/maiúscula/);
    expect(() => assertStrongPassword("SEMMINUSCULA123")).toThrow(/minúscula/);
    expect(() => assertStrongPassword("SemNumeroNenhum")).toThrow(/número/);
    expect(() => assertStrongPassword("UmaSenhaBoa123")).not.toThrow();
  });

  it("a senha temporária já passa nas regras", () => {
    for (let i = 0; i < 50; i++) expect(() => assertStrongPassword(temporaryPassword())).not.toThrow();
  });
});

describe("usuários e papéis", () => {
  let t: T;
  beforeEach(async () => {
    t = setup();
    await seedSettings(t);
  });

  it("setup do primeiro root, uma vez só", async () => {
    expect(await t.query(api.rubrica.users.isSetupRequired, {})).toBe(true);
    const { userId } = await t.action(internal.rubrica.users.setupRoot, { email: " Dono@Exemplo.dev ", password: "SenhaForte123" });
    expect(await t.query(api.rubrica.users.isSetupRequired, {})).toBe(false);
    const user = await t.run((ctx) => ctx.db.get(userId));
    expect(user?.email).toBe("dono@exemplo.dev");
    await expect(t.action(internal.rubrica.users.setupRoot, { email: "outro@exemplo.dev", password: "SenhaForte123" })).rejects.toThrow(/Já existe/);
  });

  it("root cria usuário com senha temporária e troca obrigatória", async () => {
    const root = await as(t, "root");
    const { userId, tempPassword } = await root.action(api.rubrica.users.create, { name: "Bia", email: "bia@exemplo.dev", role: "comercial" });
    expect(tempPassword).toHaveLength(16);
    const list = await root.query(api.rubrica.users.list, {});
    expect(list.find((u) => u.userId === userId)).toMatchObject({ email: "bia@exemplo.dev", role: "comercial" });
    const bia = t.withIdentity({ subject: `${userId}|s` });
    expect(await bia.query(api.rubrica.users.me, {})).toMatchObject({ role: "comercial", mustChangePassword: true });
    await expect(root.action(api.rubrica.users.create, { name: "Bia 2", email: "BIA@exemplo.dev", role: "admin" })).rejects.toThrow(/Já existe/);
  });

  it("admin não cria usuários", async () => {
    const admin = await as(t, "admin");
    await expect(admin.action(api.rubrica.users.create, { name: "X", email: "x@exemplo.dev", role: "admin" })).rejects.toThrow(/Sem permissão/);
  });

  it("troca papel, sem mudar o próprio nem ficar sem root", async () => {
    const root = await as(t, "root");
    const other = await as(t, "blog-editor");
    await root.mutation(api.rubrica.users.setRole, { userId: other.userId, role: "admin" });
    expect(await other.query(api.rubrica.users.me, {})).toMatchObject({ role: "admin" });
    await expect(root.mutation(api.rubrica.users.setRole, { userId: root.userId, role: "admin" })).rejects.toThrow(/próprio papel/);
    // Dois roots: um pode rebaixar o outro, mas não o último.
    await root.mutation(api.rubrica.users.setRole, { userId: other.userId, role: "root" });
    await root.mutation(api.rubrica.users.setRole, { userId: other.userId, role: "admin" });
    const audit = await root.query(api.rubrica.audit.recent, { eventType: "user.role_assigned" });
    expect(audit).toHaveLength(3);
  });

  it("remove o acesso inteiro, menos o próprio e o do último root", async () => {
    const root = await as(t, "root");
    const { userId } = await root.action(api.rubrica.users.create, { name: "Caio", email: "caio@exemplo.dev", role: "content-editor" });
    await root.mutation(api.rubrica.users.remove, { userId });
    const left = await t.run(async (ctx) => ({
      user: await ctx.db.get(userId),
      accounts: (await ctx.db.query("authAccounts").collect()).filter((a) => a.userId === userId),
      roles: (await ctx.db.query("userRoles").collect()).filter((r) => r.userId === userId),
    }));
    expect(left).toEqual({ user: null, accounts: [], roles: [] });
    await expect(root.mutation(api.rubrica.users.remove, { userId: root.userId })).rejects.toThrow(/a si mesmo/);
  });

  it("limita a criação de usuários por hora", async () => {
    const root = await as(t, "root");
    await t.run(async (ctx) => {
      const now = Date.now();
      await ctx.db.insert("rateLimits", {
        key: `user_create:${root.userId}`,
        type: "user_create",
        identifier: root.userId,
        attemptCount: 20,
        firstAttemptAt: now,
        lastAttemptAt: now,
        blockedUntil: now + 60 * 60 * 1000,
        expiresAt: now + 2 * 60 * 60 * 1000,
      });
    });
    await expect(root.action(api.rubrica.users.create, { name: "Z", email: "z@exemplo.dev", role: "admin" })).rejects.toThrow(/Muitas tentativas/);
  });
});
