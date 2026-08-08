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
  list,
  getBySlug,
  getById,
  create,
  update,
  remove,
  permanentDelete,
  restore,
  reorder,
  seed,
} from "../../convex/projects";
import { createMockCtx, type MockCtx } from "../_helpers/convexCtx";

const handler = (fn: any) => fn._handler ?? fn;

function asRole(ctx: MockCtx, role: string, userId = "u1") {
  ctx.db._seed("users", [{ _id: userId, email: "u@x.com" }]);
  ctx.db._seed("userRoles", [{ userId, role }]);
  getAuthUserId.mockResolvedValue(userId);
}

const baseArgs = {
  title: "Project 1",
  description: "Desc",
  tags: ["web"],
  imageIds: [],
  orderIndex: 1,
};

describe("convex/projects · list / getBySlug / getById", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
  });

  it("list returns empty when plugin disabled", async () => {
    ctx.db._seed("homeContent", [
      { key: "plugin:portfolio:enabled", value: false, createdAt: 1 },
    ]);
    expect(await handler(list)(ctx, {})).toEqual([]);
  });

  it("list filters by tag and excludes soft-deleted", async () => {
    ctx.db._seed("projects", [
      { title: "A", description: "x", tags: ["web"], imageIds: [], orderIndex: 1, createdAt: 1 },
      { title: "B", description: "x", tags: ["mobile"], imageIds: [], orderIndex: 2, createdAt: 2 },
      { title: "C", description: "x", tags: ["web"], imageIds: [], orderIndex: 3, createdAt: 3, deletedAt: 100 },
    ]);
    const filtered = await handler(list)(ctx, { tag: "web" });
    expect(filtered.map((p: any) => p.title)).toEqual(["A"]);
  });

  it("list resolves externalImageUrls into images array", async () => {
    ctx.db._seed("projects", [
      { title: "A", description: "x", tags: [], imageIds: [], externalImageUrls: ["https://i/1.png", ""], orderIndex: 1, createdAt: 1 },
    ]);
    const result = await handler(list)(ctx, {});
    expect(result[0].images).toHaveLength(1);
    expect(result[0].images[0].url).toBe("https://i/1.png");
  });

  it("getBySlug returns null for missing or soft-deleted", async () => {
    expect(await handler(getBySlug)(ctx, { slug: "ghost" })).toBeNull();
  });

  it("getBySlug returns project with images merged", async () => {
    ctx.db._seed("projects", [
      { title: "A", description: "x", tags: [], imageIds: [], externalImageUrls: ["https://i/1.png"], orderIndex: 1, slug: "a", createdAt: 1 },
    ]);
    const result = await handler(getBySlug)(ctx, { slug: "a" });
    expect(result.title).toBe("A");
    expect(result.images[0].url).toBe("https://i/1.png");
  });

  it("getById returns null for unknown id", async () => {
    expect(await handler(getById)(ctx, { id: "nope" as any })).toBeNull();
  });
});

describe("convex/projects · create / update / remove / permanentDelete / restore / reorder", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockReset();
  });

  it("create requires content-editor or above", async () => {
    asRole(ctx, "blog-editor");
    await expect(handler(create)(ctx, baseArgs)).rejects.toThrow("Forbidden");
  });

  it("create stores the project", async () => {
    asRole(ctx, "admin");
    const id = await handler(create)(ctx, baseArgs);
    expect((await ctx.db.get(id))!.title).toBe("Project 1");
  });

  it("update patches fields", async () => {
    asRole(ctx, "admin");
    const id = await handler(create)(ctx, baseArgs);
    await handler(update)(ctx, { id, title: "Updated" });
    expect((await ctx.db.get(id))!.title).toBe("Updated");
  });

  it("remove soft-deletes; permanentDelete is root-only", async () => {
    asRole(ctx, "admin");
    const id = await handler(create)(ctx, baseArgs);
    await handler(remove)(ctx, { id });
    expect((await ctx.db.get(id))!.deletedAt).toBeGreaterThan(0);
    await expect(handler(permanentDelete)(ctx, { id })).rejects.toThrow("Forbidden");
  });

  it("restore (root) clears deletedAt", async () => {
    asRole(ctx, "root");
    const id = await handler(create)(ctx, baseArgs);
    await handler(remove)(ctx, { id });
    await handler(restore)(ctx, { id });
    expect((await ctx.db.get(id))!.deletedAt).toBeUndefined();
  });

  it("reorder updates orderIndex of each item", async () => {
    asRole(ctx, "admin");
    const id1 = await handler(create)(ctx, { ...baseArgs, orderIndex: 0 });
    const id2 = await handler(create)(ctx, { ...baseArgs, title: "Project 2", orderIndex: 1 });
    await handler(reorder)(ctx, {
      items: [{ id: id1, orderIndex: 9 }, { id: id2, orderIndex: 5 }],
    });
    expect((await ctx.db.get(id1))!.orderIndex).toBe(9);
    expect((await ctx.db.get(id2))!.orderIndex).toBe(5);
  });
});

describe("convex/projects · seed", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
  });

  it("em banco vazio insere exatamente 2 projetos", async () => {
    await handler(seed)(ctx, {});
    const docs = ctx.db._all("projects");
    expect(docs.length).toBe(2);
  });

  it("cada projeto tem slug determinístico único", async () => {
    await handler(seed)(ctx, {});
    const docs = ctx.db._all("projects");
    const slugs = docs.map((d) => d.slug).sort();
    expect(slugs).toEqual(["app-de-financas-pessoais", "sistema-de-agendamento-online"]);
  });

  it("cada projeto tem orderIndex sequencial (0 e 1)", async () => {
    await handler(seed)(ctx, {});
    const docs = ctx.db._all("projects");
    const orderIndexes = docs.map((d) => d.orderIndex).sort((a, b) => a - b);
    expect(orderIndexes).toEqual([0, 1]);
  });

  it("cada projeto tem titleTranslations.ptBR não-vazio", async () => {
    await handler(seed)(ctx, {});
    const docs = ctx.db._all("projects");
    for (const doc of docs) {
      expect(doc.titleTranslations).toBeDefined();
      expect(typeof doc.titleTranslations.ptBR).toBe("string");
      expect(doc.titleTranslations.ptBR.length).toBeGreaterThan(0);
    }
  });

  it("cada projeto tem descriptionTranslations.ptBR não-vazio", async () => {
    await handler(seed)(ctx, {});
    const docs = ctx.db._all("projects");
    for (const doc of docs) {
      expect(doc.descriptionTranslations).toBeDefined();
      expect(typeof doc.descriptionTranslations.ptBR).toBe("string");
      expect(doc.descriptionTranslations.ptBR.length).toBeGreaterThan(0);
    }
  });

  it("cada projeto tem caseStudy com problem/solution/results/metrics/testimonial não-vazios", async () => {
    await handler(seed)(ctx, {});
    const docs = ctx.db._all("projects");
    for (const doc of docs) {
      expect(doc.caseStudy).toBeDefined();
      expect(typeof doc.caseStudy.problem).toBe("string");
      expect(doc.caseStudy.problem.length).toBeGreaterThan(0);
      expect(typeof doc.caseStudy.solution).toBe("string");
      expect(doc.caseStudy.solution.length).toBeGreaterThan(0);
      expect(typeof doc.caseStudy.results).toBe("string");
      expect(doc.caseStudy.results.length).toBeGreaterThan(0);
      expect(Array.isArray(doc.caseStudy.metrics)).toBe(true);
      expect(doc.caseStudy.metrics.length).toBeGreaterThan(0);
      expect(doc.caseStudy.testimonial).toBeDefined();
      expect(typeof doc.caseStudy.testimonial.text).toBe("string");
      expect(doc.caseStudy.testimonial.text.length).toBeGreaterThan(0);
    }
  });

  it("cada projeto tem caseStudyTranslations.ptBR com problem/solution/results não-vazios", async () => {
    await handler(seed)(ctx, {});
    const docs = ctx.db._all("projects");
    for (const doc of docs) {
      expect(doc.caseStudyTranslations).toBeDefined();
      expect(doc.caseStudyTranslations.ptBR).toBeDefined();
      expect(typeof doc.caseStudyTranslations.ptBR.problem).toBe("string");
      expect(doc.caseStudyTranslations.ptBR.problem.length).toBeGreaterThan(0);
      expect(typeof doc.caseStudyTranslations.ptBR.solution).toBe("string");
      expect(doc.caseStudyTranslations.ptBR.solution.length).toBeGreaterThan(0);
      expect(typeof doc.caseStudyTranslations.ptBR.results).toBe("string");
      expect(doc.caseStudyTranslations.ptBR.results.length).toBeGreaterThan(0);
    }
  });

  it("cada projeto tem imageIds como array vazio", async () => {
    await handler(seed)(ctx, {});
    const docs = ctx.db._all("projects");
    for (const doc of docs) {
      expect(doc.imageIds).toEqual([]);
    }
  });

  it("cada projeto tem createdAt numérico positivo", async () => {
    await handler(seed)(ctx, {});
    const docs = ctx.db._all("projects");
    for (const doc of docs) {
      expect(typeof doc.createdAt).toBe("number");
      expect(doc.createdAt).toBeGreaterThan(0);
    }
  });

  it("cada projeto tem demoLink e githubLink como strings não-vazias", async () => {
    await handler(seed)(ctx, {});
    const docs = ctx.db._all("projects");
    for (const doc of docs) {
      expect(typeof doc.demoLink).toBe("string");
      expect(doc.demoLink.length).toBeGreaterThan(0);
      expect(typeof doc.githubLink).toBe("string");
      expect(doc.githubLink.length).toBeGreaterThan(0);
    }
  });

  it("cada projeto tem tags como array não-vazio", async () => {
    await handler(seed)(ctx, {});
    const docs = ctx.db._all("projects");
    for (const doc of docs) {
      expect(Array.isArray(doc.tags)).toBe(true);
      expect(doc.tags.length).toBeGreaterThan(0);
    }
  });

  it("getBySlug retorna o projeto correto por slug", async () => {
    await handler(seed)(ctx, {});
    const result = await handler(getBySlug)(ctx, { slug: "sistema-de-agendamento-online" });
    expect(result).not.toBeNull();
    expect(result!.slug).toBe("sistema-de-agendamento-online");
    expect(result!.title).toBeDefined();
  });

  it("cada projeto tem externalImageUrls com 2 URLs picsum.photos determinísticas", async () => {
    await handler(seed)(ctx, {});
    const docs = ctx.db._all("projects");
    for (const doc of docs) {
      expect(Array.isArray(doc.externalImageUrls)).toBe(true);
      expect(doc.externalImageUrls.length).toBe(2);
      expect(doc.externalImageUrls[0]).toBe(`https://picsum.photos/seed/${doc.slug}-1/800/600`);
      expect(doc.externalImageUrls[1]).toBe(`https://picsum.photos/seed/${doc.slug}-2/800/600`);
    }
  });

  it("list expande externalImageUrls em array images com 2 entries por projeto", async () => {
    await handler(seed)(ctx, {});
    const result = await handler(list)(ctx, {});
    expect(result.length).toBe(2);
    for (const project of result) {
      expect(project.images).toHaveLength(2);
      expect(project.images[0].url).toBe(`https://picsum.photos/seed/${project.slug}-1/800/600`);
      expect(project.images[1].url).toBe(`https://picsum.photos/seed/${project.slug}-2/800/600`);
    }
  });
});
