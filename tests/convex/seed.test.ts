import { describe, it, expect, beforeEach, vi } from "vitest";

const { getAuthUserId, createAccount } = vi.hoisted(() => ({
  getAuthUserId: vi.fn(),
  createAccount: vi.fn(),
}));

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
  modifyAccountCredentials: vi.fn(),
}));

vi.mock("@convex-dev/auth/providers/Password", () => ({
  Password: () => ({}),
}));

import { seedSiteConfig, setupAdmin } from "../../convex/seed";
import { createMockCtx, type MockCtx } from "../_helpers/convexCtx";

const handler = (fn: any) => fn._handler ?? fn;

describe("convex/seed · seedSiteConfig", () => {
  let ctx: MockCtx;

  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockResolvedValue(null);
  });

  it("insere todas as chaves de rubricalConfig em banco vazio", async () => {
    await handler(seedSiteConfig)(ctx, {});
    const docs = ctx.db._all("siteConfig");
    expect(docs.length).toBe(17);
  });

  it("chave site_title recebe valor de rubricalConfig.siteName", async () => {
    await handler(seedSiteConfig)(ctx, {});
    const doc = ctx.db._all("siteConfig").find((d) => d.key === "site_title");
    expect(doc?.value).toBe("Portfolio");
  });

  it("chave rss_title recebe valor de rubricalConfig.rssTitle", async () => {
    await handler(seedSiteConfig)(ctx, {});
    const doc = ctx.db._all("siteConfig").find((d) => d.key === "rss_title");
    expect(doc?.value).toBe("Portfolio — Blog");
  });

  it("chave theme_accent_color recebe valor de rubricalConfig.accentColor", async () => {
    await handler(seedSiteConfig)(ctx, {});
    const doc = ctx.db._all("siteConfig").find((d) => d.key === "theme_accent_color");
    expect(doc?.value).toBe("#6366f1");
  });

  it("não insere nem sobrescreve quando banco já está populado (idempotente)", async () => {
    ctx.db._seed("siteConfig", [
      { key: "site_title", value: "Existente", createdAt: 1 },
    ]);
    await handler(seedSiteConfig)(ctx, {});
    const docs = ctx.db._all("siteConfig");
    expect(docs.length).toBe(1);
    expect(docs[0].value).toBe("Existente");
  });
});

describe("convex/seed · setupAdmin", () => {
  let ctx: MockCtx;

  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockResolvedValue(null);
    createAccount.mockReset();
  });

  it("com root já existente lança erro Root user already exists", async () => {
    ctx.runQuery.mockResolvedValue(false); // isSetupRequired = false → root já existe

    await expect(
      handler(setupAdmin)(ctx, { email: "test@test.com", password: "senha123456789" }),
    ).rejects.toThrow("Root user already exists");
    expect(createAccount).not.toHaveBeenCalled();
  });

  it("com banco vazio cria conta com email e senha fornecidos", async () => {
    ctx.runQuery.mockResolvedValue(true);
    createAccount.mockResolvedValue({ user: { _id: "user_1" } });
    ctx.runMutation.mockResolvedValue(undefined);

    await handler(setupAdmin)(ctx, { email: "test@test.com", password: "senha123456789" });

    expect(createAccount).toHaveBeenCalledWith(
      ctx,
      expect.objectContaining({
        provider: "password",
        account: { id: "test@test.com", secret: "senha123456789" },
        profile: { email: "test@test.com" },
      }),
    );
  });

  it("retorna { userId } em caso de sucesso", async () => {
    ctx.runQuery.mockResolvedValue(true);
    createAccount.mockResolvedValue({ user: { _id: "user_1" } });
    ctx.runMutation.mockResolvedValue(undefined);

    const result = await handler(setupAdmin)(ctx, { email: "test@test.com", password: "senha123456789" });

    expect(result).toEqual({ userId: "user_1" });
  });

  it("insere em userRoles com role root via assignRoleInternal", async () => {
    ctx.runQuery.mockResolvedValue(true);
    createAccount.mockResolvedValue({ user: { _id: "user_1" } });
    ctx.runMutation.mockResolvedValue(undefined);

    await handler(setupAdmin)(ctx, { email: "test@test.com", password: "senha123456789" });

    expect(ctx.runMutation).toHaveBeenCalledWith(
      expect.anything(), // internal.users.assignRoleInternal
      expect.objectContaining({ userId: "user_1", role: "root" }),
    );
  });
});
