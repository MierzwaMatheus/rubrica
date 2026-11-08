// @vitest-environment edge-runtime
import { beforeEach, describe, expect, it } from "vitest";
import { assertStrongPassword, temporaryPassword } from "../../src/convex/users";
import { api, as, internal, seedSettings, setup, type T } from "./_setup";
import type { Id } from "../../src/convex/server";

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

describe("reiniciar senha, suspender e senha temporária", () => {
  let t: T;
  beforeEach(async () => {
    t = setup();
    await seedSettings(t);
  });

  const sessionsOf = (userId: string) => t.run(async (ctx) => (await ctx.db.query("authSessions").collect()).filter((s) => s.userId === userId).length);
  const openSession = (userId: Id<"users">) =>
    t.run(async (ctx) => {
      const sessionId = await ctx.db.insert("authSessions", { userId, expirationTime: Date.now() + 3_600_000 });
      await ctx.db.insert("authRefreshTokens", { sessionId, expirationTime: Date.now() + 3_600_000 });
    });

  it("quem está com senha temporária só troca a senha", async () => {
    const root = await as(t, "root");
    const { userId } = await root.action(api.rubrica.users.create, { name: "Bia", email: "bia@exemplo.dev", role: "admin" });
    const bia = t.withIdentity({ subject: `${userId}|s` });
    await expect(bia.query(api.rubrica.users.list, {})).rejects.toThrow(/senha temporária/);
    await expect(bia.query(api.rubrica.contacts.list, {})).rejects.toThrow(/senha temporária/);
    expect(await bia.query(api.rubrica.users.me, {})).toMatchObject({ role: "admin", mustChangePassword: true });
    await bia.action(api.rubrica.users.changePassword, { newPassword: "NovaSenhaBoa123" });
    await expect(bia.query(api.rubrica.contacts.list, {})).resolves.toBeDefined();
    await expect(bia.query(api.rubrica.users.list, {})).rejects.toThrow(/Sem permissão/);
  });

  it("root reinicia a senha de outra pessoa: temporária, troca obrigatória, sessões derrubadas, login destravado", async () => {
    const root = await as(t, "root");
    const { userId } = await root.action(api.rubrica.users.create, { name: "Caio", email: "caio@exemplo.dev", role: "comercial" });
    const caio = t.withIdentity({ subject: `${userId}|s` });
    await caio.action(api.rubrica.users.changePassword, { newPassword: "SenhaDoCaio123" });
    await openSession(userId);
    const accountId = await t.run(async (ctx) => (await ctx.db.query("authAccounts").collect()).find((a) => a.userId === userId)!._id);
    await t.run((ctx) => ctx.db.insert("authRateLimits", { identifier: accountId, lastAttemptTime: Date.now(), attemptsLeft: 0 }));

    const { tempPassword, email } = await root.action(api.rubrica.users.resetPassword, { userId });
    expect(email).toBe("caio@exemplo.dev");
    expect(() => assertStrongPassword(tempPassword)).not.toThrow();
    expect(await caio.query(api.rubrica.users.me, {})).toMatchObject({ mustChangePassword: true });
    expect(await sessionsOf(userId)).toBe(0);
    expect(await t.run(async (ctx) => (await ctx.db.query("authRateLimits").collect()).length)).toBe(0);
    const audit = await root.query(api.rubrica.audit.recent, { eventType: "auth.password_reset" });
    expect(audit).toHaveLength(1);
  });

  it("só root reinicia senha, e não a própria", async () => {
    const root = await as(t, "root");
    const admin = await as(t, "admin");
    await expect(admin.action(api.rubrica.users.resetPassword, { userId: root.userId })).rejects.toThrow(/Sem permissão/);
    await expect(root.action(api.rubrica.users.resetPassword, { userId: root.userId })).rejects.toThrow(/Minha conta/);
  });

  it("suspender corta o acesso na hora e reativar devolve o mesmo papel", async () => {
    const root = await as(t, "root");
    const editor = await as(t, "content-editor");
    await openSession(editor.userId);
    expect(await editor.query(api.rubrica.contacts.unreadCount, {}).catch((e: Error) => e.message)).toMatch(/Sem permissão/);
    await expect(editor.query(api.rubrica.pages.list, {})).resolves.toBeDefined();

    await root.mutation(api.rubrica.users.suspend, { userId: editor.userId });
    await expect(editor.query(api.rubrica.pages.list, {})).rejects.toThrow(/Sem permissão/);
    expect(await editor.query(api.rubrica.users.me, {})).toMatchObject({ role: null, suspended: true });
    expect(await sessionsOf(editor.userId)).toBe(0);
    expect((await root.query(api.rubrica.users.list, {})).find((u) => u.userId === editor.userId)).toMatchObject({ role: "content-editor", suspended: true });

    await root.mutation(api.rubrica.users.reactivate, { userId: editor.userId });
    expect(await editor.query(api.rubrica.users.me, {})).toMatchObject({ role: "content-editor", suspended: false });
    await expect(editor.query(api.rubrica.pages.list, {})).resolves.toBeDefined();
  });

  it("não suspende a si mesmo nem o último root; suspenso não conta como root", async () => {
    const root = await as(t, "root");
    const other = await as(t, "root");
    await expect(root.mutation(api.rubrica.users.suspend, { userId: root.userId })).rejects.toThrow(/a si mesmo/);
    await root.mutation(api.rubrica.users.suspend, { userId: other.userId });
    // Com o outro suspenso, este é o último root que vale.
    const third = await as(t, "admin");
    await expect(third.mutation(api.rubrica.users.suspend, { userId: root.userId })).rejects.toThrow(/Sem permissão/);
    await expect(other.mutation(api.rubrica.users.suspend, { userId: root.userId })).rejects.toThrow(/Sem permissão/);
    await expect(root.mutation(api.rubrica.users.setRole, { userId: third.userId, role: "admin" })).resolves.toBeNull();
  });

  it("só root suspende", async () => {
    const admin = await as(t, "admin");
    const editor = await as(t, "blog-editor");
    await expect(admin.mutation(api.rubrica.users.suspend, { userId: editor.userId })).rejects.toThrow(/Sem permissão/);
    await expect(admin.mutation(api.rubrica.users.reactivate, { userId: editor.userId })).rejects.toThrow(/Sem permissão/);
  });
});
