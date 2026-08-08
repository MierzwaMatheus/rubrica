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

import { seedSiteConfig, seedAll, setupAdmin } from "../../convex/seed";
import { internal } from "../../convex/_generated/api";
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

describe("convex/seed · seedAll", () => {
  let ctx: MockCtx;

  beforeEach(() => {
    ctx = createMockCtx();
  });

  it("com lista vazia de plugins invoca os seeds core (3 mutations)", async () => {
    ctx.runMutation.mockResolvedValue(undefined);

    await handler(seedAll)(ctx, { enabledPlugins: [] });

    expect(ctx.runMutation).toHaveBeenCalledTimes(3);
  });

  it("com plugins irrelevantes também invoca os seeds core (3 mutations)", async () => {
    ctx.runMutation.mockResolvedValue(undefined);

    await handler(seedAll)(ctx, { enabledPlugins: ["analytics", "newsletter"] });

    expect(ctx.runMutation).toHaveBeenCalledTimes(3);
  });

  it("com proposals habilitado invoca 3 core + seedDefaultTemplate (4 mutations)", async () => {
    ctx.runMutation.mockResolvedValue(undefined);

    await handler(seedAll)(ctx, { enabledPlugins: ["proposals"] });

    expect(ctx.runMutation).toHaveBeenCalledTimes(4);
  });

  it("com i18n habilitado invoca 3 core + siteTexts.seed (4 mutations)", async () => {
    ctx.runMutation.mockResolvedValue(undefined);

    await handler(seedAll)(ctx, { enabledPlugins: ["i18n"] });

    expect(ctx.runMutation).toHaveBeenCalledTimes(4);
  });

  it("com proposals + i18n invoca 3 core + seedDefaultTemplate + siteTexts.seed (5 mutations)", async () => {
    ctx.runMutation.mockResolvedValue(undefined);

    await handler(seedAll)(ctx, { enabledPlugins: ["proposals", "i18n"] });

    expect(ctx.runMutation).toHaveBeenCalledTimes(5);
  });

  it("com proposals mas não i18n invoca 5 mutations (3 core + seedDefaultTemplate + posts.seed)", async () => {
    ctx.runMutation.mockResolvedValue(undefined);

    await handler(seedAll)(ctx, { enabledPlugins: ["proposals", "blog"] });

    expect(ctx.runMutation).toHaveBeenCalledTimes(5);
  });

  it("com i18n mas não proposals invoca 5 mutations (3 core + siteTexts.seed + posts.seed)", async () => {
    ctx.runMutation.mockResolvedValue(undefined);

    await handler(seedAll)(ctx, { enabledPlugins: ["i18n", "blog"] });

    expect(ctx.runMutation).toHaveBeenCalledTimes(5);
  });

  it("com portfolio habilitado invoca 3 core + projects.seed (4 mutations)", async () => {
    ctx.runMutation.mockResolvedValue(undefined);

    await handler(seedAll)(ctx, { enabledPlugins: ["portfolio"] });

    expect(ctx.runMutation).toHaveBeenCalledTimes(4);
  });

  it("com portfolio + proposals invoca 3 core + projects.seed + seedDefaultTemplate (5 mutations)", async () => {
    ctx.runMutation.mockResolvedValue(undefined);

    await handler(seedAll)(ctx, { enabledPlugins: ["portfolio", "proposals"] });

    expect(ctx.runMutation).toHaveBeenCalledTimes(5);
  });

  it("com portfolio + proposals + i18n invoca 6 mutations (todos os plugins)", async () => {
    ctx.runMutation.mockResolvedValue(undefined);

    await handler(seedAll)(ctx, { enabledPlugins: ["portfolio", "proposals", "i18n"] });

    expect(ctx.runMutation).toHaveBeenCalledTimes(6);
  });

  it("com portfolio + i18n invoca 5 mutations (3 core + projects.seed + siteTexts.seed)", async () => {
    ctx.runMutation.mockResolvedValue(undefined);

    await handler(seedAll)(ctx, { enabledPlugins: ["portfolio", "i18n"] });

    expect(ctx.runMutation).toHaveBeenCalledTimes(5);
  });

  it("com blog habilitado invoca 3 core + posts.seed (4 mutations)", async () => {
    ctx.runMutation.mockResolvedValue(undefined);

    await handler(seedAll)(ctx, { enabledPlugins: ["blog"] });

    expect(ctx.runMutation).toHaveBeenCalledTimes(4);
  });

  it("com blog + portfolio invoca 3 core + projects.seed + posts.seed (5 mutations)", async () => {
    ctx.runMutation.mockResolvedValue(undefined);

    await handler(seedAll)(ctx, { enabledPlugins: ["blog", "portfolio"] });

    expect(ctx.runMutation).toHaveBeenCalledTimes(5);
  });

  it("com blog + i18n invoca 3 core + posts.seed + siteTexts.seed (5 mutations)", async () => {
    ctx.runMutation.mockResolvedValue(undefined);

    await handler(seedAll)(ctx, { enabledPlugins: ["blog", "i18n"] });

    expect(ctx.runMutation).toHaveBeenCalledTimes(5);
  });

  it("com blog + proposals invoca 3 core + seedDefaultTemplate + posts.seed (5 mutations)", async () => {
    ctx.runMutation.mockResolvedValue(undefined);

    await handler(seedAll)(ctx, { enabledPlugins: ["blog", "proposals"] });

    expect(ctx.runMutation).toHaveBeenCalledTimes(5);
  });

  it("com blog + portfolio + i18n invoca 3 core + projects.seed + posts.seed + siteTexts.seed (6 mutations)", async () => {
    ctx.runMutation.mockResolvedValue(undefined);

    await handler(seedAll)(ctx, { enabledPlugins: ["blog", "portfolio", "i18n"] });

    expect(ctx.runMutation).toHaveBeenCalledTimes(6);
  });

  it("com blog + proposals + i18n invoca 3 core + seedDefaultTemplate + posts.seed + siteTexts.seed (6 mutations)", async () => {
    ctx.runMutation.mockResolvedValue(undefined);

    await handler(seedAll)(ctx, { enabledPlugins: ["blog", "proposals", "i18n"] });

    expect(ctx.runMutation).toHaveBeenCalledTimes(6);
  });

  it("com blog + portfolio + proposals + i18n invoca todos os plugins (7 mutations)", async () => {
    ctx.runMutation.mockResolvedValue(undefined);

    await handler(seedAll)(ctx, { enabledPlugins: ["blog", "portfolio", "proposals", "i18n"] });

    expect(ctx.runMutation).toHaveBeenCalledTimes(7);
  });

  it("com resume habilitado invoca 3 core + resumeItems.seed (4 mutations)", async () => {
    ctx.runMutation.mockResolvedValue(undefined);

    await handler(seedAll)(ctx, { enabledPlugins: ["resume"] });

    expect(ctx.runMutation).toHaveBeenCalledTimes(4);
    expect(ctx.runMutation).toHaveBeenCalledWith(internal.resumeItems.seed, {});
  });

  it("sem resume não invoca resumeItems.seed", async () => {
    ctx.runMutation.mockResolvedValue(undefined);

    await handler(seedAll)(ctx, { enabledPlugins: ["blog", "portfolio", "proposals", "i18n"] });

    const called = ctx.runMutation.mock.calls.some(
      (c: unknown[]) => c[0] === internal.resumeItems.seed,
    );
    expect(called).toBe(false);
  });

  it("com resume + blog invoca 3 core + posts.seed + resumeItems.seed (5 mutations)", async () => {
    ctx.runMutation.mockResolvedValue(undefined);

    await handler(seedAll)(ctx, { enabledPlugins: ["resume", "blog"] });

    expect(ctx.runMutation).toHaveBeenCalledTimes(5);
    expect(ctx.runMutation).toHaveBeenCalledWith(internal.posts.seed, {});
    expect(ctx.runMutation).toHaveBeenCalledWith(internal.resumeItems.seed, {});
  });

  it("com todos os plugins invoca 3 core + 6 plugins (10 mutations: about tem 2)", async () => {
    ctx.runMutation.mockResolvedValue(undefined);

    await handler(seedAll)(ctx, {
      enabledPlugins: ["blog", "portfolio", "proposals", "i18n", "resume", "about"],
    });

    expect(ctx.runMutation).toHaveBeenCalledTimes(10);
  });

  it("com about habilitado invoca 3 core + aboutDailyRoutine.seed + aboutFaq.seed (5 mutations)", async () => {
    ctx.runMutation.mockResolvedValue(undefined);

    await handler(seedAll)(ctx, { enabledPlugins: ["about"] });

    expect(ctx.runMutation).toHaveBeenCalledTimes(5);
    expect(ctx.runMutation).toHaveBeenCalledWith(internal.aboutDailyRoutine.seed, {});
    expect(ctx.runMutation).toHaveBeenCalledWith(internal.aboutFaq.seed, {});
  });

  it("sem about não invoca aboutDailyRoutine.seed nem aboutFaq.seed", async () => {
    ctx.runMutation.mockResolvedValue(undefined);

    await handler(seedAll)(ctx, {
      enabledPlugins: ["blog", "portfolio", "proposals", "i18n", "resume"],
    });

    const dailyCalled = ctx.runMutation.mock.calls.some(
      (c: unknown[]) => c[0] === internal.aboutDailyRoutine.seed,
    );
    const faqCalled = ctx.runMutation.mock.calls.some(
      (c: unknown[]) => c[0] === internal.aboutFaq.seed,
    );
    expect(dailyCalled).toBe(false);
    expect(faqCalled).toBe(false);
  });

  it("com about + resume invoca 3 core + resumeItems.seed + aboutDailyRoutine.seed + aboutFaq.seed (6 mutations)", async () => {
    ctx.runMutation.mockResolvedValue(undefined);

    await handler(seedAll)(ctx, { enabledPlugins: ["about", "resume"] });

    expect(ctx.runMutation).toHaveBeenCalledTimes(6);
    expect(ctx.runMutation).toHaveBeenCalledWith(internal.resumeItems.seed, {});
    expect(ctx.runMutation).toHaveBeenCalledWith(internal.aboutDailyRoutine.seed, {});
    expect(ctx.runMutation).toHaveBeenCalledWith(internal.aboutFaq.seed, {});
  });

  it("com about + blog invoca 3 core + posts.seed + aboutDailyRoutine.seed + aboutFaq.seed (6 mutations)", async () => {
    ctx.runMutation.mockResolvedValue(undefined);

    await handler(seedAll)(ctx, { enabledPlugins: ["about", "blog"] });

    expect(ctx.runMutation).toHaveBeenCalledTimes(6);
    expect(ctx.runMutation).toHaveBeenCalledWith(internal.posts.seed, {});
    expect(ctx.runMutation).toHaveBeenCalledWith(internal.aboutDailyRoutine.seed, {});
    expect(ctx.runMutation).toHaveBeenCalledWith(internal.aboutFaq.seed, {});
  });

  it("com about + i18n invoca 3 core + siteTexts.seed + aboutDailyRoutine.seed + aboutFaq.seed (6 mutations)", async () => {
    ctx.runMutation.mockResolvedValue(undefined);

    await handler(seedAll)(ctx, { enabledPlugins: ["about", "i18n"] });

    expect(ctx.runMutation).toHaveBeenCalledTimes(6);
    expect(ctx.runMutation).toHaveBeenCalledWith(internal.siteTexts.seed, {});
    expect(ctx.runMutation).toHaveBeenCalledWith(internal.aboutDailyRoutine.seed, {});
    expect(ctx.runMutation).toHaveBeenCalledWith(internal.aboutFaq.seed, {});
  });

  it("com about + portfolio invoca 3 core + projects.seed + aboutDailyRoutine.seed + aboutFaq.seed (6 mutations)", async () => {
    ctx.runMutation.mockResolvedValue(undefined);

    await handler(seedAll)(ctx, { enabledPlugins: ["about", "portfolio"] });

    expect(ctx.runMutation).toHaveBeenCalledTimes(6);
    expect(ctx.runMutation).toHaveBeenCalledWith(internal.projects.seed, {});
    expect(ctx.runMutation).toHaveBeenCalledWith(internal.aboutDailyRoutine.seed, {});
    expect(ctx.runMutation).toHaveBeenCalledWith(internal.aboutFaq.seed, {});
  });
});
