import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

const { getAuthUserId } = vi.hoisted(() => ({
  getAuthUserId: vi.fn(),
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
  createAccount: vi.fn(),
  modifyAccountCredentials: vi.fn(),
}));

vi.mock("@convex-dev/auth/providers/Password", () => ({
  Password: () => ({}),
}));

import {
  create,
  update,
  remove,
  permanentDelete,
  restore,
  getPublic,
  checkSession,
  _createSessionInternal,
  _acceptInternal,
  invalidateSessions,
  cleanupExpiredSessions,
  requestErasure,
  exportTitularData,
  resetPassword,
  snapshotTemplate,
  snapshotTemplateOnView,
} from "../../convex/proposals";
import { createMockCtx, type MockCtx } from "../_helpers/convexCtx";

const handler = (fn: any) => fn._handler ?? fn;

function asRoot(ctx: MockCtx, userId = "root-1") {
  ctx.db._seed("users", [{ _id: userId, email: "root@x.com" }]);
  ctx.db._seed("userRoles", [{ userId, role: "root" }]);
  getAuthUserId.mockResolvedValue(userId);
  return userId;
}

const baseProposalArgs = {
  clientName: "Acme Inc",
  slug: "acme-2024",
  title: "Website",
  objective: "Build a website",
  scope: ["Design", "Code"],
  timeline: [{ step: "Design", period: "2 weeks" }],
  deliveryDate: "2024-12-31",
  investmentValue: 5000,
  paymentMethods: ["PIX"],
  conditions: ["Pagamento via PIX"],
  rescissionPolicy: "Padrão",
};

describe("convex/proposals · create", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockReset();
  });

  it("creates a proposal with version=1, isAccepted=false, and ~10-day expiry", async () => {
    asRoot(ctx);
    const before = Date.now();
    const id = await handler(create)(ctx, baseProposalArgs);
    const proposal = await ctx.db.get(id);
    expect(proposal).toMatchObject({
      slug: "acme-2024",
      version: 1,
      isAccepted: false,
    });
    const tenDays = 10 * 24 * 60 * 60 * 1000;
    expect(proposal!.expiresAt).toBeGreaterThanOrEqual(before + tenDays - 5000);
    expect(proposal!.expiresAt).toBeLessThanOrEqual(before + tenDays + 5000);
  });

  it("hashes password before storage (never stores plaintext)", async () => {
    asRoot(ctx);
    const id = await handler(create)(ctx, {
      ...baseProposalArgs,
      password: "mypass123",
    });
    const proposal = await ctx.db.get(id);
    expect(proposal!.password).toMatch(/^pbkdf2:[0-9a-f]{32}:[0-9a-f]{64}$/);
    expect(proposal!.password).not.toBe("mypass123");
  });

  it("rejects when slug already in use", async () => {
    asRoot(ctx);
    await handler(create)(ctx, baseProposalArgs);
    await expect(
      handler(create)(ctx, baseProposalArgs),
    ).rejects.toThrow("Slug already in use");
  });

  it("rejects unauthorized callers", async () => {
    ctx.db._seed("users", [{ _id: "u1", email: "x@y.com" }]);
    ctx.db._seed("userRoles", [{ userId: "u1", role: "blog-editor" }]);
    getAuthUserId.mockResolvedValue("u1");
    await expect(handler(create)(ctx, baseProposalArgs)).rejects.toThrow("Forbidden");
  });

  it("persists templateId when provided", async () => {
    asRoot(ctx);
    const templateId = ctx.db._seed("contractTemplates", [
      { name: "Padrão", content: "# Contrato", isDefault: true, createdAt: Date.now(), updatedAt: Date.now() },
    ])[0]._id;
    const id = await handler(create)(ctx, { ...baseProposalArgs, slug: "acme-template", templateId });
    const proposal = await ctx.db.get(id);
    expect(proposal!.templateId).toBe(templateId);
  });
});

describe("convex/proposals · snapshotTemplate", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockReset();
  });

  function seedTemplate(overrides: Record<string, unknown> = {}) {
    const [id] = ctx.db._seed("contractTemplates", [
      { name: "Padrão", content: "# Contrato Padrão", isDefault: true, createdAt: Date.now(), updatedAt: Date.now(), ...overrides },
    ]);
    return id;
  }

  async function createProposal(extra: Record<string, unknown> = {}) {
    asRoot(ctx);
    return handler(create)(ctx, { ...baseProposalArgs, slug: `slug-${Date.now()}`, ...extra });
  }

  it("sets templateSnapshot from default template when proposal has no templateId", async () => {
    seedTemplate();
    const id = await createProposal();
    await handler(snapshotTemplate)(ctx, { proposalId: id });
    const proposal = await ctx.db.get(id);
    expect(proposal!.templateSnapshot).toBe("# Contrato Padrão");
  });

  it("uses the specific templateId when present on the proposal", async () => {
    seedTemplate();
    const specificId = seedTemplate({ name: "Específico", content: "# Específico", isDefault: false });
    const id = await createProposal({ templateId: specificId });
    await handler(snapshotTemplate)(ctx, { proposalId: id });
    const proposal = await ctx.db.get(id);
    expect(proposal!.templateSnapshot).toBe("# Específico");
  });

  it("does not overwrite existing templateSnapshot (idempotent)", async () => {
    seedTemplate({ content: "# Novo Conteúdo" });
    const id = await createProposal();
    await ctx.db.patch(id, { templateSnapshot: "# Snapshot Anterior" });
    await handler(snapshotTemplate)(ctx, { proposalId: id });
    const proposal = await ctx.db.get(id);
    expect(proposal!.templateSnapshot).toBe("# Snapshot Anterior");
  });
});

describe("convex/proposals · snapshotTemplateOnView", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockReset();
  });

  function seedTemplate(overrides: Record<string, unknown> = {}) {
    const [id] = ctx.db._seed("contractTemplates", [
      { name: "Padrão", content: "# Contrato Padrão", isDefault: true, createdAt: Date.now(), updatedAt: Date.now(), ...overrides },
    ]);
    return id;
  }

  async function createProposalAnon(extra: Record<string, unknown> = {}) {
    asRoot(ctx);
    const id = await handler(create)(ctx, { ...baseProposalArgs, slug: `slug-view-${Date.now()}`, ...extra });
    getAuthUserId.mockReset();
    return id;
  }

  it("sets templateSnapshot from default template when called without auth", async () => {
    seedTemplate();
    const id = await createProposalAnon();
    const proposal = await ctx.db.get(id);
    await handler(snapshotTemplateOnView)(ctx, { slug: proposal!.slug });
    const updated = await ctx.db.get(id);
    expect(updated!.templateSnapshot).toBe("# Contrato Padrão");
  });

  it("does not overwrite existing templateSnapshot (idempotent)", async () => {
    seedTemplate({ content: "# Novo Conteúdo" });
    const id = await createProposalAnon();
    const proposal = await ctx.db.get(id);
    await ctx.db.patch(id, { templateSnapshot: "# Snapshot Anterior" });
    await handler(snapshotTemplateOnView)(ctx, { slug: proposal!.slug });
    const updated = await ctx.db.get(id);
    expect(updated!.templateSnapshot).toBe("# Snapshot Anterior");
  });

  it("uses the specific templateId when present on the proposal", async () => {
    seedTemplate();
    const [specificId] = ctx.db._seed("contractTemplates", [
      { name: "Específico", content: "# Template Específico", isDefault: false, createdAt: Date.now(), updatedAt: Date.now() },
    ]);
    const id = await createProposalAnon({ templateId: specificId });
    const proposal = await ctx.db.get(id);
    await handler(snapshotTemplateOnView)(ctx, { slug: proposal!.slug });
    const updated = await ctx.db.get(id);
    expect(updated!.templateSnapshot).toBe("# Template Específico");
  });
});

describe("convex/proposals · update", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockReset();
  });

  it("increments version and patches fields", async () => {
    asRoot(ctx);
    const id = await handler(create)(ctx, baseProposalArgs);
    await handler(update)(ctx, { id, title: "Website v2" });
    const updated = await ctx.db.get(id);
    expect(updated!.version).toBe(2);
    expect(updated!.title).toBe("Website v2");
    expect(updated!.updatedAt).toBeGreaterThan(0);
  });

  it("rehashes password and schedules session invalidation", async () => {
    asRoot(ctx);
    const id = await handler(create)(ctx, {
      ...baseProposalArgs,
      password: "old-secret-pw",
    });
    const before = (await ctx.db.get(id))!.password;
    await handler(update)(ctx, { id, password: "new-secret-pw" });
    const after = (await ctx.db.get(id))!.password;
    expect(after).not.toBe(before);
    expect(ctx.scheduler.runAfter).toHaveBeenCalled();
  });

  it("does not schedule invalidation when password is omitted", async () => {
    asRoot(ctx);
    const id = await handler(create)(ctx, baseProposalArgs);
    ctx.scheduler.runAfter.mockClear();
    await handler(update)(ctx, { id, title: "X" });
    expect(ctx.scheduler.runAfter).not.toHaveBeenCalled();
  });

  it("rejects updates on accepted proposals", async () => {
    asRoot(ctx);
    const id = await handler(create)(ctx, baseProposalArgs);
    await ctx.db.patch(id, { isAccepted: true });
    await expect(
      handler(update)(ctx, { id, title: "x" }),
    ).rejects.toThrow("immutable");
  });

  it("persists templateId when updated", async () => {
    asRoot(ctx);
    const [{ _id: templateId }] = ctx.db._seed("contractTemplates", [
      { name: "Padrão", content: "# Contrato", isDefault: true, createdAt: Date.now(), updatedAt: Date.now() },
    ]);
    const id = await handler(create)(ctx, baseProposalArgs);
    await handler(update)(ctx, { id, templateId });
    const updated = await ctx.db.get(id);
    expect(updated!.templateId).toBe(templateId);
  });
});

describe("convex/proposals · remove / permanentDelete / restore", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockReset();
  });

  it("remove soft-deletes (sets deletedAt)", async () => {
    asRoot(ctx);
    const id = await handler(create)(ctx, baseProposalArgs);
    await handler(remove)(ctx, { id });
    const doc = await ctx.db.get(id);
    expect(doc!.deletedAt).toBeGreaterThan(0);
  });

  it("remove rejects accepted proposals", async () => {
    asRoot(ctx);
    const id = await handler(create)(ctx, baseProposalArgs);
    await ctx.db.patch(id, { isAccepted: true });
    await expect(handler(remove)(ctx, { id })).rejects.toThrow(
      "Cannot delete accepted proposal",
    );
  });

  it("permanentDelete hard-deletes when not accepted", async () => {
    asRoot(ctx);
    const id = await handler(create)(ctx, baseProposalArgs);
    await handler(permanentDelete)(ctx, { id });
    const doc = await ctx.db.get(id);
    expect(doc).toBeNull();
  });

  it("permanentDelete rejects accepted proposals", async () => {
    asRoot(ctx);
    const id = await handler(create)(ctx, baseProposalArgs);
    await ctx.db.patch(id, { isAccepted: true });
    await expect(
      handler(permanentDelete)(ctx, { id }),
    ).rejects.toThrow("Cannot delete accepted proposal");
  });

  it("restore clears deletedAt", async () => {
    asRoot(ctx);
    const id = await handler(create)(ctx, baseProposalArgs);
    await handler(remove)(ctx, { id });
    await handler(restore)(ctx, { id });
    const doc = await ctx.db.get(id);
    expect(doc!.deletedAt).toBeUndefined();
  });
});

describe("convex/proposals · getPublic", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockReset();
  });

  it("returns null when proposal does not exist", async () => {
    expect(await handler(getPublic)(ctx, { slug: "ghost" })).toBeNull();
  });

  it("strips password and exposes requiresPassword/hasValidSession/isExpired", async () => {
    asRoot(ctx);
    const id = await handler(create)(ctx, {
      ...baseProposalArgs,
      password: "secret",
    });
    const proposal = await handler(getPublic)(ctx, { slug: "acme-2024" });
    expect(proposal.password).toBeUndefined();
    expect(proposal.requiresPassword).toBe(true);
    expect(proposal.hasValidSession).toBe(false);
    expect(proposal.isExpired).toBe(false);
    expect(proposal._id).toBe(id);
  });

  it("flags expired when expiresAt is in the past", async () => {
    asRoot(ctx);
    const id = await handler(create)(ctx, baseProposalArgs);
    await ctx.db.patch(id, { expiresAt: 1 }); // very old
    const proposal = await handler(getPublic)(ctx, { slug: "acme-2024" });
    expect(proposal.isExpired).toBe(true);
  });

  it("hasValidSession=true when token matches an active session", async () => {
    asRoot(ctx);
    const id = await handler(create)(ctx, {
      ...baseProposalArgs,
      password: "secret",
    });
    await ctx.db.insert("proposalSessions", {
      proposalId: id,
      token: "tok123",
      expiresAt: Date.now() + 60_000,
      isUsed: false,
      createdAt: Date.now(),
    });
    const proposal = await handler(getPublic)(ctx, {
      slug: "acme-2024",
      token: "tok123",
    });
    expect(proposal.hasValidSession).toBe(true);
  });
});

describe("convex/proposals · _createSessionInternal", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockReset();
  });

  it("rejects with 'Invalid password' when password is wrong", async () => {
    asRoot(ctx);
    const id = await handler(create)(ctx, {
      ...baseProposalArgs,
      password: "right-secret",
    });
    void id;
    await expect(
      handler(_createSessionInternal)(ctx, {
        slug: "acme-2024",
        password: "wrong",
        ipAddress: "1.2.3.4",
      }),
    ).rejects.toThrow("Invalid password");
  });

  it("returns a 64-char hex token on correct password and resets rate limit", async () => {
    asRoot(ctx);
    await handler(create)(ctx, {
      ...baseProposalArgs,
      password: "right-secret",
    });
    const token = await handler(_createSessionInternal)(ctx, {
      slug: "acme-2024",
      password: "right-secret",
      ipAddress: "1.2.3.4",
    });
    expect(token).toMatch(/^[0-9a-f]{64}$/);
    const session = ctx.db._all("proposalSessions")[0];
    expect(session.token).toBe(token);
    expect(session.isUsed).toBe(false);
  });

  it("blocks after 5 invalid attempts (rate limit perKey=5)", async () => {
    asRoot(ctx);
    await handler(create)(ctx, {
      ...baseProposalArgs,
      password: "right-secret",
    });
    for (let i = 0; i < 5; i++) {
      await expect(
        handler(_createSessionInternal)(ctx, {
          slug: "acme-2024",
          password: "wrong",
          ipAddress: "1.2.3.4",
        }),
      ).rejects.toThrow();
    }
    await expect(
      handler(_createSessionInternal)(ctx, {
        slug: "acme-2024",
        password: "right-secret",
        ipAddress: "1.2.3.4",
      }),
    ).rejects.toThrow(/Too many attempts/);
  });
});

describe("convex/proposals · _acceptInternal", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockReset();
  });

  it("rejects when proposal is not found", async () => {
    await expect(
      handler(_acceptInternal)(ctx, {
        slug: "ghost",
        clientName: "X",
        clientDocument: "00000000000",
        clientEmail: "x@y.com",
        ipAddress: "1.1.1.1",
        userAgent: "ua",
      }),
    ).rejects.toThrow("Proposal not found");
  });

  it("creates an acceptance with content snapshot + SHA-256 hash and marks proposal accepted", async () => {
    asRoot(ctx);
    const id = await handler(create)(ctx, baseProposalArgs);
    const result = await handler(_acceptInternal)(ctx, {
      slug: "acme-2024",
      clientName: "John",
      clientDocument: "12345678900",
      clientEmail: "john@x.com",
      ipAddress: "1.1.1.1",
      userAgent: "ua",
    });
    expect(result.contentHash).toMatch(/^[0-9a-f]{64}$/);

    const proposal = await ctx.db.get(id);
    expect(proposal!.isAccepted).toBe(true);
    expect(proposal!.acceptedAt).toBeGreaterThan(0);

    const acceptance = ctx.db._all("proposalAcceptances")[0];
    expect(acceptance.clientName).toBe("John");
    expect(acceptance.contentSnapshotVersion).toBe("v2-server");
    expect(JSON.parse(acceptance.contentSnapshot).proposal.id).toBe(id);

    expect(ctx.scheduler.runAfter).toHaveBeenCalled();
  });

  it("rejects when proposal is already accepted", async () => {
    asRoot(ctx);
    const id = await handler(create)(ctx, baseProposalArgs);
    await ctx.db.patch(id, { isAccepted: true });
    await expect(
      handler(_acceptInternal)(ctx, {
        slug: "acme-2024",
        clientName: "X",
        clientDocument: "0",
        clientEmail: "x@y.com",
        ipAddress: "1.1.1.1",
        userAgent: "ua",
      }),
    ).rejects.toThrow("Already accepted");
  });

  it("rejects when proposal is expired", async () => {
    asRoot(ctx);
    const id = await handler(create)(ctx, baseProposalArgs);
    await ctx.db.patch(id, { expiresAt: 1 });
    await expect(
      handler(_acceptInternal)(ctx, {
        slug: "acme-2024",
        clientName: "X",
        clientDocument: "0",
        clientEmail: "x@y.com",
        ipAddress: "1.1.1.1",
        userAgent: "ua",
      }),
    ).rejects.toThrow("expired");
  });

  it("rejects when password-protected proposal lacks valid session token", async () => {
    asRoot(ctx);
    await handler(create)(ctx, {
      ...baseProposalArgs,
      password: "secret",
    });
    await expect(
      handler(_acceptInternal)(ctx, {
        slug: "acme-2024",
        clientName: "X",
        clientDocument: "0",
        clientEmail: "x@y.com",
        ipAddress: "1.1.1.1",
        userAgent: "ua",
      }),
    ).rejects.toThrow("Invalid or expired session");
  });
});

describe("convex/proposals · checkSession", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
  });

  it("returns null for unknown token", async () => {
    expect(await handler(checkSession)(ctx, { token: "x" })).toBeNull();
  });

  it("returns null for expired session", async () => {
    ctx.db._seed("proposalSessions", [
      {
        proposalId: "p1",
        token: "abc",
        expiresAt: Date.now() - 1000,
        isUsed: false,
        createdAt: Date.now() - 2000,
      },
    ]);
    expect(await handler(checkSession)(ctx, { token: "abc" })).toBeNull();
  });

  it("returns the session when valid", async () => {
    ctx.db._seed("proposalSessions", [
      {
        proposalId: "p1",
        token: "abc",
        expiresAt: Date.now() + 60_000,
        isUsed: false,
        createdAt: Date.now(),
      },
    ]);
    const result = await handler(checkSession)(ctx, { token: "abc" });
    expect(result?.token).toBe("abc");
  });
});

describe("convex/proposals · invalidateSessions / cleanupExpiredSessions", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
  });

  it("invalidateSessions deletes all sessions for the proposal", async () => {
    ctx.db._seed("proposalSessions", [
      { proposalId: "p1", token: "a", expiresAt: 9_999_999_999_999, isUsed: false, createdAt: 1 },
      { proposalId: "p1", token: "b", expiresAt: 9_999_999_999_999, isUsed: false, createdAt: 2 },
      { proposalId: "p2", token: "c", expiresAt: 9_999_999_999_999, isUsed: false, createdAt: 3 },
    ]);
    await handler(invalidateSessions)(ctx, { proposalId: "p1" });
    const remaining = ctx.db._all("proposalSessions");
    expect(remaining).toHaveLength(1);
    expect(remaining[0].proposalId).toBe("p2");
  });

  it("cleanupExpiredSessions removes only expired sessions", async () => {
    const now = Date.now();
    ctx.db._seed("proposalSessions", [
      { proposalId: "p", token: "a", expiresAt: now - 1000, isUsed: false, createdAt: 1 },
      { proposalId: "p", token: "b", expiresAt: now + 1000, isUsed: false, createdAt: 2 },
    ]);
    const result = await handler(cleanupExpiredSessions)(ctx, {});
    expect(result.deleted).toBe(1);
    expect(ctx.db._all("proposalSessions")).toHaveLength(1);
  });
});

describe("convex/proposals · requestErasure (LGPD)", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockReset();
  });

  it("rejects when neither document nor email provided", async () => {
    asRoot(ctx);
    await expect(
      handler(requestErasure)(ctx, {}),
    ).rejects.toThrow("clientDocument or email required");
  });

  it("anonymizes acceptance, contact, testimonialSubmission, checkout, auditLog by document+email", async () => {
    asRoot(ctx);
    ctx.db._seed("proposalAcceptances", [
      {
        proposalId: "p1",
        proposalVersion: 1,
        clientName: "John",
        clientDocument: "DOC123",
        clientEmail: "john@x.com",
        contentSnapshot: JSON.stringify({
          acceptance: { clientName: "John", clientDocument: "DOC123" },
        }),
        contentSnapshotVersion: "v2-server",
        contentHash: "h",
        ipAddress: "1.2.3.4",
        userAgent: "ua",
        acceptedAt: 1,
        createdAt: 1,
      },
    ]);
    ctx.db._seed("contactRequests", [
      {
        contactInfo: { name: "John", email: "john@x.com", phone: "1234", company: "Acme" },
        ipAddress: "1.2.3.4",
        userAgent: "ua",
      },
    ]);
    ctx.db._seed("testimonialSubmissions", [
      { name: "John", email: "john@x.com", company: "Acme" },
    ]);
    ctx.db._seed("checkouts", [
      {
        customerName: "John",
        customerEmail: "john@x.com",
        customerCpfCnpj: "DOC123",
        customerMobilePhone: "1234",
      },
    ]);
    ctx.db._seed("auditLog", [
      { actorId: "john@x.com", actorType: "external", eventType: "x", success: true, createdAt: 1, expiresAt: 9999999 },
    ]);

    const result = await handler(requestErasure)(ctx, {
      clientDocument: "DOC123",
    });
    expect(result.anonymized).toBeGreaterThanOrEqual(4);

    const acc = ctx.db._all("proposalAcceptances")[0];
    expect(acc.clientName).toBe("[ANONIMIZADO]");
    expect(acc.clientDocument).toBe("[ANONIMIZADO]");
    expect(acc.clientEmail).toContain("[ANONIMIZADO]");
    expect(acc.ipAddress).toBe("0.0.0.0");
    const snap = JSON.parse(acc.contentSnapshot);
    expect(snap.acceptance.clientName).toBe("[ANONIMIZADO]");
    expect(snap._anonymizedAt).toBeDefined();

    const co = ctx.db._all("checkouts")[0];
    expect(co.customerName).toBe("[ANONIMIZADO]");
    expect(co.customerCpfCnpj).toBe("00000000000");

    const audit = ctx.db._all("auditLog").find((a) => a.actorId === "[ANONIMIZADO]");
    expect(audit).toBeTruthy();
  });
});

describe("convex/proposals · resetPassword", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockReset();
  });

  it("re-hashes new password and schedules session invalidation", async () => {
    asRoot(ctx);
    const id = await handler(create)(ctx, baseProposalArgs);
    ctx.scheduler.runAfter.mockClear();
    await handler(resetPassword)(ctx, { id, newPassword: "novaSenha123" });
    const doc = await ctx.db.get(id);
    expect(doc!.password).toMatch(/^pbkdf2:/);
    expect(ctx.scheduler.runAfter).toHaveBeenCalled();
  });

  it("clears password (sets undefined) when newPassword is omitted", async () => {
    asRoot(ctx);
    const id = await handler(create)(ctx, {
      ...baseProposalArgs,
      password: "old-secret",
    });
    await handler(resetPassword)(ctx, { id });
    const doc = await ctx.db.get(id);
    expect(doc!.password).toBeUndefined();
  });
});
