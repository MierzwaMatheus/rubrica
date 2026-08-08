import { describe, it, expect, beforeEach, vi } from "vitest";

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
  reorder,
  listByType,
  listAll,
  seed,
} from "../../convex/resumeItems";
import { createMockCtx, type MockCtx } from "../_helpers/convexCtx";

const handler = (fn: any) => fn._handler ?? fn;

function asRole(ctx: MockCtx, role: string, userId = "u1") {
  ctx.db._seed("users", [{ _id: userId, email: "u@x.com" }]);
  ctx.db._seed("userRoles", [{ userId, role }]);
  getAuthUserId.mockResolvedValue(userId);
  return userId;
}

describe("convex/resumeItems · create + label extraction", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockReset();
  });

  it.each([
    ["skill", { name: "TypeScript" }, "TypeScript"],
    ["language", { name: "Português" }, "Português"],
    ["experience", { role: "Senior Dev" }, "Senior Dev"],
    ["volunteer", { role: "Helper" }, "Helper"],
    ["education", { degree: "BSc" }, "BSc"],
    ["course", { text: "Course X" }, "Course X"],
    ["soft_skill", { text: "Empathy" }, "Empathy"],
  ])("logs label correctly for type=%s", async (type, content, expectedLabel) => {
    asRole(ctx, "admin");
    const id = await handler(create)(ctx, {
      type: type as any,
      content,
      orderIndex: 0,
    });
    expect(id).toBeTruthy();
    const audit = ctx.db._all("auditLog").find((a) => a.targetId === id);
    expect((audit!.metadata as any).label).toBe(expectedLabel);
  });

  it("rejects unauthorized roles", async () => {
    asRole(ctx, "blog-editor");
    await expect(
      handler(create)(ctx, { type: "skill", content: { name: "X" }, orderIndex: 0 }),
    ).rejects.toThrow("Forbidden");
  });
});

describe("convex/resumeItems · listByType / listAll", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockReset();
  });

  it("listByType filters by type and excludes soft-deleted", async () => {
    asRole(ctx, "admin");
    await handler(create)(ctx, { type: "skill", content: { name: "TS" }, orderIndex: 1 });
    const id2 = await handler(create)(ctx, { type: "skill", content: { name: "JS" }, orderIndex: 2 });
    await handler(create)(ctx, { type: "experience", content: { role: "Dev" }, orderIndex: 1 });
    await handler(remove)(ctx, { id: id2 });

    const skills = await handler(listByType)(ctx, { type: "skill" });
    expect(skills).toHaveLength(1);
    expect(skills[0].content.name).toBe("TS");
  });

  it("listByType returns empty array when plugin disabled", async () => {
    ctx.db._seed("homeContent", [
      { key: "plugin:resume:enabled", value: false, createdAt: 1 },
    ]);
    const result = await handler(listByType)(ctx, { type: "skill" });
    expect(result).toEqual([]);
  });

  it("listAll returns items across all types", async () => {
    asRole(ctx, "admin");
    await handler(create)(ctx, { type: "skill", content: { name: "X" }, orderIndex: 1 });
    await handler(create)(ctx, { type: "experience", content: { role: "X" }, orderIndex: 2 });
    const all = await handler(listAll)(ctx, {});
    expect(all).toHaveLength(2);
  });

  it("listAll includes soft-deleted when includeDeleted=true", async () => {
    asRole(ctx, "admin");
    const id = await handler(create)(ctx, {
      type: "skill", content: { name: "X" }, orderIndex: 1,
    });
    await handler(remove)(ctx, { id });
    expect(await handler(listAll)(ctx, {})).toHaveLength(0);
    expect(await handler(listAll)(ctx, { includeDeleted: true })).toHaveLength(1);
  });
});

describe("convex/resumeItems · update / remove / permanentDelete / restore / reorder", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockReset();
  });

  it("update patches fields", async () => {
    asRole(ctx, "admin");
    const id = await handler(create)(ctx, {
      type: "skill", content: { name: "X" }, orderIndex: 1,
    });
    await handler(update)(ctx, { id, orderIndex: 5 });
    expect((await ctx.db.get(id))!.orderIndex).toBe(5);
  });

  it("permanentDelete is root-only", async () => {
    asRole(ctx, "admin");
    const id = await handler(create)(ctx, {
      type: "skill", content: { name: "X" }, orderIndex: 1,
    });
    await expect(handler(permanentDelete)(ctx, { id })).rejects.toThrow("Forbidden");
  });

  it("permanentDelete works for root", async () => {
    asRole(ctx, "root");
    const id = await handler(create)(ctx, {
      type: "skill", content: { name: "X" }, orderIndex: 1,
    });
    await handler(permanentDelete)(ctx, { id });
    expect(await ctx.db.get(id)).toBeNull();
  });

  it("restore (root only) clears deletedAt", async () => {
    asRole(ctx, "root");
    const id = await handler(create)(ctx, {
      type: "skill", content: { name: "X" }, orderIndex: 1,
    });
    await handler(remove)(ctx, { id });
    await handler(restore)(ctx, { id });
    expect((await ctx.db.get(id))!.deletedAt).toBeUndefined();
  });

  it("reorder updates orderIndex for multiple items", async () => {
    asRole(ctx, "admin");
    const id1 = await handler(create)(ctx, { type: "skill", content: { name: "A" }, orderIndex: 0 });
    const id2 = await handler(create)(ctx, { type: "skill", content: { name: "B" }, orderIndex: 1 });
    await handler(reorder)(ctx, { items: [{ id: id1, orderIndex: 5 }, { id: id2, orderIndex: 3 }] });
    expect((await ctx.db.get(id1))!.orderIndex).toBe(5);
    expect((await ctx.db.get(id2))!.orderIndex).toBe(3);
  });
});

describe("convex/resumeItems · seed", () => {
  let ctx: MockCtx;

  const seedAndAll = async () => {
    await handler(seed)(ctx, {});
    return ctx.db._all("resumeItems");
  };

  const countByType = (docs: any[], type: string) =>
    docs.filter((d) => d.type === type).length;

  beforeEach(() => {
    ctx = createMockCtx();
  });

  it("insere exatamente 13 itens em tabela vazia", async () => {
    const docs = await seedAndAll();
    expect(docs.length).toBe(13);
  });

  it("distribui os itens nos 7 tipos conforme a spec", async () => {
    const docs = await seedAndAll();
    expect(countByType(docs, "skill")).toBe(3);
    expect(countByType(docs, "experience")).toBe(2);
    expect(countByType(docs, "education")).toBe(1);
    expect(countByType(docs, "course")).toBe(2);
    expect(countByType(docs, "soft_skill")).toBe(2);
    expect(countByType(docs, "language")).toBe(2);
    expect(countByType(docs, "volunteer")).toBe(1);
  });

  it("skill e language têm content com name e level não vazios", async () => {
    const docs = await seedAndAll();
    for (const d of docs.filter((x) => x.type === "skill" || x.type === "language")) {
      expect(typeof d.content.name).toBe("string");
      expect(d.content.name.length).toBeGreaterThan(0);
      expect(typeof d.content.level).toBe("string");
      expect(d.content.level.length).toBeGreaterThan(0);
    }
  });

  it("experience tem content com role, period, company e description não vazios", async () => {
    const docs = await seedAndAll();
    const exps = docs.filter((d) => d.type === "experience");
    expect(exps.length).toBe(2);
    for (const d of exps) {
      for (const key of ["role", "period", "company", "description"]) {
        expect(typeof d.content[key]).toBe("string");
        expect(d.content[key].length).toBeGreaterThan(0);
      }
    }
  });

  it("education tem content com degree, period, institution e description não vazios", async () => {
    const docs = await seedAndAll();
    const edu = docs.find((d) => d.type === "education");
    for (const key of ["degree", "period", "institution", "description"]) {
      expect(typeof edu.content[key]).toBe("string");
      expect(edu.content[key].length).toBeGreaterThan(0);
    }
  });

  it("course, soft_skill e volunteer têm content com text não vazio", async () => {
    const docs = await seedAndAll();
    const textual = docs.filter((d) =>
      ["course", "soft_skill", "volunteer"].includes(d.type),
    );
    expect(textual.length).toBe(5);
    for (const d of textual) {
      expect(typeof d.content.text).toBe("string");
      expect(d.content.text.length).toBeGreaterThan(0);
      expect(Object.keys(d.content)).toEqual(["text"]);
    }
  });

  it("todo item tem createdAt numérico", async () => {
    const docs = await seedAndAll();
    for (const d of docs) {
      expect(typeof d.createdAt).toBe("number");
      expect(Number.isFinite(d.createdAt)).toBe(true);
    }
  });

  it("orderIndex é monotônico crescente dentro de cada tipo", async () => {
    const docs = await seedAndAll();
    for (const type of ["skill", "experience", "education", "course", "soft_skill", "volunteer", "language"]) {
      const idxs = docs.filter((d) => d.type === type).map((d) => d.orderIndex);
      expect(idxs).toEqual([...idxs].sort((a, b) => a - b));
      expect(new Set(idxs).size).toBe(idxs.length);
      for (const i of idxs) expect(typeof i).toBe("number");
    }
  });

  it("orderIndex começa em 0 para cada tipo", async () => {
    const docs = await seedAndAll();
    for (const type of ["skill", "experience", "education", "course", "soft_skill", "volunteer", "language"]) {
      const idxs = docs.filter((d) => d.type === type).map((d) => d.orderIndex);
      expect(Math.min(...idxs)).toBe(0);
    }
  });

  it("é no-op quando a tabela já está completa (13 itens)", async () => {
    await handler(seed)(ctx, {});
    const before = ctx.db._all("resumeItems").length;
    await handler(seed)(ctx, {});
    expect(ctx.db._all("resumeItems").length).toBe(before);
  });

  it("é fill-only: com tabela parcialmente populada completa até 13", async () => {
    ctx.db._seed("resumeItems", [
      { type: "skill", content: { name: "Existente", level: "Avançado" }, orderIndex: 0, createdAt: 1 },
    ]);
    await handler(seed)(ctx, {});
    const docs = ctx.db._all("resumeItems");
    expect(docs.length).toBe(13);
    expect(docs.filter((d) => d.content?.name === "Existente").length).toBe(1);
  });

  it("é idempotente: rodar 2× não duplica itens", async () => {
    await handler(seed)(ctx, {});
    await handler(seed)(ctx, {});
    expect(ctx.db._all("resumeItems").length).toBe(13);
  });
});
