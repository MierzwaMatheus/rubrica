import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

const { getAuthUserId, createAccount, modifyAccountCredentials } = vi.hoisted(
  () => ({
    getAuthUserId: vi.fn(),
    createAccount: vi.fn(),
    modifyAccountCredentials: vi.fn(),
  }),
);

vi.mock("@convex-dev/auth/server", () => ({
  convexAuth: () => ({
    auth: {},
    signIn: vi.fn(),
    signOut: vi.fn(),
    store: vi.fn(),
    isAuthenticated: vi.fn(),
  }),
  getAuthUserId,
  createAccount,
  modifyAccountCredentials,
}));

vi.mock("@convex-dev/auth/providers/Password", () => ({
  Password: () => ({}),
}));

import {
  isSetupRequired,
  bootstrapRootUser,
  changePassword,
  assignRole,
  removeRole,
  assignRoleInternal,
  clearMustChangePassword,
  getMyRole,
  getMustChangePassword,
  adminCreateUser,
  resetPasswordInternal,
  findPasswordAccount,
  afterPasswordReset,
} from "../../convex/users";
import { createMockCtx, type MockCtx } from "../_helpers/convexCtx";

const handler = (fn: any) => fn._handler ?? fn;

describe("convex/users · isSetupRequired", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
  });

  it("returns true when no root role exists", async () => {
    expect(await handler(isSetupRequired)(ctx)).toBe(true);
  });

  it("returns false when root role exists", async () => {
    ctx.db._seed("userRoles", [{ userId: "u1", role: "root" }]);
    expect(await handler(isSetupRequired)(ctx)).toBe(false);
  });

  it("ignores non-root roles", async () => {
    ctx.db._seed("userRoles", [{ userId: "u1", role: "admin" }]);
    expect(await handler(isSetupRequired)(ctx)).toBe(true);
  });
});

describe("convex/users · bootstrapRootUser", () => {
  let ctx: MockCtx;
  const ORIGINAL_ENV = { ...process.env };

  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockReset();
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("rejects when BOOTSTRAP_ALLOWED is not set", async () => {
    delete process.env.BOOTSTRAP_ALLOWED;
    await expect(handler(bootstrapRootUser)(ctx, {})).rejects.toThrow(
      "Bootstrap is not enabled",
    );
  });

  it("rejects if a root user already exists", async () => {
    process.env.BOOTSTRAP_ALLOWED = "true";
    ctx.db._seed("userRoles", [{ userId: "u0", role: "root" }]);
    await expect(handler(bootstrapRootUser)(ctx, {})).rejects.toThrow(
      "Root user already exists",
    );
  });

  it("rejects when not authenticated", async () => {
    process.env.BOOTSTRAP_ALLOWED = "true";
    getAuthUserId.mockResolvedValue(null);
    await expect(handler(bootstrapRootUser)(ctx, {})).rejects.toThrow(
      "Not authenticated",
    );
  });

  it("creates a root role for the authenticated user", async () => {
    process.env.BOOTSTRAP_ALLOWED = "true";
    getAuthUserId.mockResolvedValue("u-new");
    const result = await handler(bootstrapRootUser)(ctx, {});
    expect(result.userId).toBe("u-new");
    const roles = ctx.db._all("userRoles");
    expect(roles).toHaveLength(1);
    expect(roles[0]).toMatchObject({ userId: "u-new", role: "root" });
  });
});

describe("convex/users · changePassword (validation)", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
    ctx.runQuery = vi.fn().mockResolvedValue({
      userId: "u1",
      user: { email: "x@y.com" },
    });
    ctx.runMutation = vi.fn().mockResolvedValue(undefined);
    modifyAccountCredentials.mockReset();
    modifyAccountCredentials.mockResolvedValue(undefined);
  });

  it("rejects when password is shorter than 12 characters", async () => {
    await expect(
      handler(changePassword)(ctx, { newPassword: "Short1aB" }),
    ).rejects.toThrow("mínimo 12 caracteres");
  });

  it("rejects when missing uppercase letter", async () => {
    await expect(
      handler(changePassword)(ctx, { newPassword: "abcdefghij12" }),
    ).rejects.toThrow("maiúscula");
  });

  it("rejects when missing lowercase letter", async () => {
    await expect(
      handler(changePassword)(ctx, { newPassword: "ABCDEFGHIJ12" }),
    ).rejects.toThrow("minúscula");
  });

  it("rejects when missing digit", async () => {
    await expect(
      handler(changePassword)(ctx, { newPassword: "AbcdefghijKl" }),
    ).rejects.toThrow("número");
  });

  it("accepts a valid password and updates credentials", async () => {
    await handler(changePassword)(ctx, { newPassword: "AbcdefGh1jkl" });
    expect(modifyAccountCredentials).toHaveBeenCalledTimes(1);
    expect(ctx.runMutation).toHaveBeenCalled();
  });
});

describe("convex/users · assignRole / removeRole", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockReset();
  });

  it("assignRole rejects non-root callers", async () => {
    ctx.db._seed("users", [{ _id: "actor", email: "a@b.com" }]);
    ctx.db._seed("userRoles", [{ userId: "actor", role: "admin" }]);
    getAuthUserId.mockResolvedValue("actor");
    await expect(
      handler(assignRole)(ctx, { userId: "u1", role: "admin" }),
    ).rejects.toThrow("Forbidden");
  });

  it("assignRole creates a new role record", async () => {
    ctx.db._seed("users", [
      { _id: "actor", email: "a@b.com" },
      { _id: "u1", email: "x@y.com" },
    ]);
    ctx.db._seed("userRoles", [{ userId: "actor", role: "root" }]);
    getAuthUserId.mockResolvedValue("actor");
    await handler(assignRole)(ctx, { userId: "u1", role: "admin" });
    const roles = ctx.db._all("userRoles");
    const u1Role = roles.find((r) => r.userId === "u1");
    expect(u1Role?.role).toBe("admin");
  });

  it("assignRole patches an existing role", async () => {
    ctx.db._seed("users", [
      { _id: "actor", email: "a@b.com" },
      { _id: "u1", email: "x@y.com" },
    ]);
    ctx.db._seed("userRoles", [
      { userId: "actor", role: "root" },
      { userId: "u1", role: "blog-editor" },
    ]);
    getAuthUserId.mockResolvedValue("actor");
    await handler(assignRole)(ctx, { userId: "u1", role: "admin" });
    const u1Role = ctx.db._all("userRoles").find((r) => r.userId === "u1");
    expect(u1Role?.role).toBe("admin");
  });

  it("removeRole deletes the role and writes audit", async () => {
    ctx.db._seed("users", [
      { _id: "actor", email: "a@b.com" },
      { _id: "u1", email: "x@y.com" },
    ]);
    ctx.db._seed("userRoles", [
      { userId: "actor", role: "root" },
      { userId: "u1", role: "admin" },
    ]);
    getAuthUserId.mockResolvedValue("actor");
    await handler(removeRole)(ctx, { userId: "u1" });
    const roles = ctx.db._all("userRoles").filter((r) => r.userId === "u1");
    expect(roles).toHaveLength(0);
    expect(ctx.db._all("auditLog").length).toBeGreaterThan(0);
  });

  it("removeRole is no-op when no role exists for the target", async () => {
    ctx.db._seed("users", [{ _id: "actor", email: "a@b.com" }]);
    ctx.db._seed("userRoles", [{ userId: "actor", role: "root" }]);
    getAuthUserId.mockResolvedValue("actor");
    await expect(
      handler(removeRole)(ctx, { userId: "ghost" }),
    ).resolves.toBeUndefined();
  });
});

describe("convex/users · assignRoleInternal & clearMustChangePassword", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
  });

  it("assignRoleInternal inserts when no role exists", async () => {
    await handler(assignRoleInternal)(ctx, {
      userId: "u1",
      role: "admin",
      createdBy: "actor",
      mustChangePassword: true,
    });
    const role = ctx.db._all("userRoles")[0];
    expect(role).toMatchObject({
      userId: "u1",
      role: "admin",
      mustChangePassword: true,
    });
  });

  it("assignRoleInternal patches an existing role", async () => {
    ctx.db._seed("userRoles", [{ userId: "u1", role: "blog-editor" }]);
    await handler(assignRoleInternal)(ctx, { userId: "u1", role: "admin" });
    expect(ctx.db._all("userRoles")[0].role).toBe("admin");
  });

  it("clearMustChangePassword sets the flag to false", async () => {
    ctx.db._seed("userRoles", [
      { userId: "u1", role: "admin", mustChangePassword: true },
    ]);
    await handler(clearMustChangePassword)(ctx, { userId: "u1" });
    expect(ctx.db._all("userRoles")[0].mustChangePassword).toBe(false);
  });

  it("clearMustChangePassword is no-op when no role exists", async () => {
    await expect(
      handler(clearMustChangePassword)(ctx, { userId: "ghost" }),
    ).resolves.toBeUndefined();
  });
});

describe("convex/users · getMyRole / getMustChangePassword", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockReset();
  });

  it("getMyRole returns null when not authenticated", async () => {
    getAuthUserId.mockResolvedValue(null);
    expect(await handler(getMyRole)(ctx, {})).toBeNull();
  });

  it("getMyRole returns the user's role", async () => {
    getAuthUserId.mockResolvedValue("u1");
    ctx.db._seed("userRoles", [{ userId: "u1", role: "admin" }]);
    expect(await handler(getMyRole)(ctx, {})).toBe("admin");
  });

  it("getMustChangePassword returns false when not authenticated", async () => {
    getAuthUserId.mockResolvedValue(null);
    expect(await handler(getMustChangePassword)(ctx, {})).toBe(false);
  });

  it("getMustChangePassword returns true when flag set", async () => {
    getAuthUserId.mockResolvedValue("u1");
    ctx.db._seed("userRoles", [
      { userId: "u1", role: "admin", mustChangePassword: true },
    ]);
    expect(await handler(getMustChangePassword)(ctx, {})).toBe(true);
  });
});

describe("convex/users · adminCreateUser", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
    createAccount.mockReset();
    ctx.runQuery = vi.fn();
    ctx.runMutation = vi.fn().mockResolvedValue(undefined);
  });

  it("rejects callers whose role is not root", async () => {
    ctx.runQuery
      .mockResolvedValueOnce({ userId: "actor", user: {} }) // requireAuthQuery
      .mockResolvedValueOnce({ role: "admin" }); // getUserRoleQuery
    await expect(
      handler(adminCreateUser)(ctx, {
        name: "X",
        email: "x@y.com",
        role: "admin",
      }),
    ).rejects.toThrow("Forbidden");
  });

  it("creates account and assigns role with mustChangePassword=true", async () => {
    ctx.runQuery
      .mockResolvedValueOnce({ userId: "actor", user: {} })
      .mockResolvedValueOnce({ role: "root" });
    createAccount.mockResolvedValue({ user: { _id: "newUser" } });

    const result = await handler(adminCreateUser)(ctx, {
      name: "Bob",
      email: "bob@x.com",
      role: "blog-editor",
    });

    expect(result.userId).toBe("newUser");
    expect(result.tempPassword).toMatch(/^[A-Za-z0-9]{12}$/);
    expect(createAccount).toHaveBeenCalledWith(
      ctx,
      expect.objectContaining({
        provider: "password",
        account: expect.objectContaining({ id: "bob@x.com" }),
        profile: expect.objectContaining({ email: "bob@x.com", name: "Bob" }),
      }),
    );
    // assignRoleInternal call
    expect(ctx.runMutation).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        userId: "newUser",
        role: "blog-editor",
        mustChangePassword: true,
      }),
    );
  });
});

describe("convex/users · troca de senha pelo terminal", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
    modifyAccountCredentials.mockReset();
    modifyAccountCredentials.mockResolvedValue(undefined);
  });

  it("findPasswordAccount acha a conta de senha pelo e-mail (ou devolve null)", async () => {
    const [accountId] = ctx.db._seed("authAccounts", [{ userId: "u1", provider: "password", providerAccountId: "ana@a.dev" }]);
    ctx.db._seed("authAccounts", [{ userId: "u2", provider: "google", providerAccountId: "outro@a.dev" }]);
    expect(await handler(findPasswordAccount)(ctx, { email: "ana@a.dev" })).toEqual({ accountId, userId: "u1" });
    expect(await handler(findPasswordAccount)(ctx, { email: "outro@a.dev" })).toBeNull();
  });

  it("afterPasswordReset destrava o login, limpa o 'precisa trocar a senha' e registra no histórico", async () => {
    const [userId] = ctx.db._seed("users", [{ email: "ana@a.dev" }]);
    ctx.db._seed("authRateLimits", [
      { identifier: "acc1", lastAttemptTime: 1, attemptsLeft: 0 },
      { identifier: "acc2", lastAttemptTime: 1, attemptsLeft: 0 },
    ]);
    ctx.db._seed("userRoles", [{ userId, role: "root", mustChangePassword: true }]);
    await handler(afterPasswordReset)(ctx, { accountId: "acc1", userId });
    expect(ctx.db._all("authRateLimits").map((r) => r.identifier)).toEqual(["acc2"]);
    expect(ctx.db._all("userRoles")[0].mustChangePassword).toBe(false);
    expect(ctx.db._all("auditLog")).toEqual([
      expect.objectContaining({ eventType: "auth.password_reset", actorType: "system", targetId: userId }),
    ]);
  });

  it("resetPasswordInternal troca a senha da conta e chama a limpeza", async () => {
    ctx.runQuery = vi.fn().mockResolvedValue({ accountId: "acc1", userId: "u1" });
    ctx.runMutation = vi.fn().mockResolvedValue(undefined);
    const result = await handler(resetPasswordInternal)(ctx, { email: "  Ana@A.dev ", password: "NovaSenha1234" });
    expect(ctx.runQuery).toHaveBeenCalledWith(expect.anything(), { email: "ana@a.dev" });
    expect(modifyAccountCredentials).toHaveBeenCalledWith(ctx, {
      provider: "password",
      account: { id: "ana@a.dev", secret: "NovaSenha1234" },
    });
    expect(ctx.runMutation).toHaveBeenCalledWith(expect.anything(), { accountId: "acc1", userId: "u1" });
    expect(result).toEqual({ email: "ana@a.dev" });
  });

  it("e-mail sem conta: erro claro e nada muda", async () => {
    ctx.runQuery = vi.fn().mockResolvedValue(null);
    ctx.runMutation = vi.fn();
    await expect(handler(resetPasswordInternal)(ctx, { email: "x@a.dev", password: "NovaSenha1234" })).rejects.toThrow(
      "Nenhum usuário com o e-mail x@a.dev"
    );
    expect(modifyAccountCredentials).not.toHaveBeenCalled();
    expect(ctx.runMutation).not.toHaveBeenCalled();
  });

  it.each([
    ["Curta1A", "mínimo 12 caracteres"],
    ["semmaiuscula123", "maiúscula"],
    ["SEMMINUSCULA123", "minúscula"],
    ["SemNumeroNenhum", "número"],
  ])("senha fraca %j é recusada como no painel (%s)", async (password, message) => {
    ctx.runQuery = vi.fn().mockResolvedValue({ accountId: "acc1", userId: "u1" });
    await expect(handler(resetPasswordInternal)(ctx, { email: "a@a.dev", password })).rejects.toThrow(message);
    expect(modifyAccountCredentials).not.toHaveBeenCalled();
  });
});
