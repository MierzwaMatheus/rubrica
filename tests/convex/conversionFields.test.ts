import { describe, it, expect, beforeEach, vi } from "vitest";

const { getAuthUserId } = vi.hoisted(() => ({ getAuthUserId: vi.fn() }));

vi.mock("@convex-dev/auth/server", async importOriginal => ({
  ...(await importOriginal<any>()),
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
vi.mock("@convex-dev/auth/providers/Password", () => ({ Password: () => ({}) }));

import schema from "../../convex/schema";
import * as projects from "../../convex/projects";
import * as testimonials from "../../convex/testimonials";
import { getByKey } from "../../convex/homeContent";
import { createMockCtx, type MockCtx } from "../_helpers/convexCtx";

const handler = (fn: any) => fn._handler ?? fn;
const argsOf = (fn: any) => JSON.parse(fn.exportArgs()).value;

function asRole(ctx: MockCtx, role: string, userId = "u1") {
  ctx.db._seed("users", [{ _id: userId, email: "u@x.com" }]);
  ctx.db._seed("userRoles", [{ userId, role }]);
  getAuthUserId.mockResolvedValue(userId);
}

const NEW_CASE_FIELDS = ["role", "context", "decisions", "learnings"];

describe("projects · category and extended case study", () => {
  it.each(["create", "update"])("%s accepts category as optional", name => {
    const args = argsOf((projects as any)[name]);
    expect(args.category.optional).toBe(true);
    expect(args.categoryTranslations.optional).toBe(true);
  });

  it.each(["create", "update"])("%s accepts the new optional case study fields", name => {
    const args = argsOf((projects as any)[name]);
    const fields = args.caseStudy.fieldType.value;
    for (const f of NEW_CASE_FIELDS) expect(fields[f].optional).toBe(true);
    // campos antigos continuam obrigatórios
    for (const f of ["problem", "solution", "results"]) expect(fields[f].optional).toBe(false);
    const pt = args.caseStudyTranslations.fieldType.value.ptBR.fieldType.value;
    for (const f of NEW_CASE_FIELDS) expect(pt[f].optional).toBe(true);
  });

  it("schema stores the same fields", () => {
    const table = (schema as any).tables.projects.validator.json.value;
    expect(table.category.optional).toBe(true);
    const fields = table.caseStudy.fieldType.value;
    for (const f of NEW_CASE_FIELDS) expect(fields[f].optional).toBe(true);
  });

  describe("persistence", () => {
    let ctx: MockCtx;
    beforeEach(() => {
      ctx = createMockCtx();
      getAuthUserId.mockReset();
    });

    it("create keeps category and the new case study fields", async () => {
      asRole(ctx, "admin");
      const id = await handler(projects.create)(ctx, {
        title: "Hub",
        description: "d",
        tags: [],
        imageIds: [],
        orderIndex: 1,
        category: "IA aplicada",
        caseStudy: {
          problem: "p", solution: "s", results: "r", metrics: [],
          role: "Tech lead, time de 3", context: "antes", decisions: "trade-offs", learnings: "aprendi",
        },
      });
      const doc = await ctx.db.get(id);
      expect(doc!.category).toBe("IA aplicada");
      expect(doc!.caseStudy.role).toBe("Tech lead, time de 3");
      expect(doc!.caseStudy.learnings).toBe("aprendi");
    });
  });
});

describe("testimonials · category", () => {
  it.each(["create", "update"])("%s accepts category as optional", name => {
    expect(argsOf((testimonials as any)[name]).category.optional).toBe(true);
  });

  it("schema stores category", () => {
    expect((schema as any).tables.testimonials.validator.json.value.category.optional).toBe(true);
  });
});

describe("resumeItems · skill group", () => {
  it("skill content accepts an optional group", () => {
    const variants = (schema as any).tables.resumeItems.validator.json.value;
    const skill = variants.find((v: any) => v.value.type.fieldType.value === "skill");
    expect(skill.value.content.fieldType.value.group.optional).toBe(true);
  });

  it("skill translations use the { ptBR, enUS } shape the admin saves", () => {
    const variants = (schema as any).tables.resumeItems.validator.json.value;
    const skill = variants.find((v: any) => v.value.type.fieldType.value === "skill");
    const tr = skill.value.contentTranslations.fieldType.value;
    expect(Object.keys(tr).sort()).toEqual(["enUS", "ptBR"]);
    expect(tr.enUS.fieldType.value.group.optional).toBe(true);
  });
});

describe("homeContent · work_principles", () => {
  it("is readable without login, like the other public home keys", async () => {
    const ctx = createMockCtx();
    getAuthUserId.mockResolvedValue(null);
    ctx.db._seed("homeContent", [{ key: "work_principles", value: [], createdAt: 1 }]);
    const row = await handler(getByKey)(ctx, { key: "work_principles" });
    expect(row.value).toEqual([]);
  });
});
