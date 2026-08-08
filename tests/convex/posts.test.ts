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
  publish,
  unpublish,
  remove,
  permanentDelete,
  restore,
  getBySlug,
  listAdmin,
  listAllPublished,
  seed,
} from "../../convex/posts";
import { createMockCtx, type MockCtx } from "../_helpers/convexCtx";

const handler = (fn: any) => fn._handler ?? fn;

function asEditor(ctx: MockCtx, role = "blog-editor", userId = "u1") {
  ctx.db._seed("users", [{ _id: userId, email: "u@x.com" }]);
  ctx.db._seed("userRoles", [{ userId, role }]);
  getAuthUserId.mockResolvedValue(userId);
  return userId;
}

const baseArgs = {
  title: "Hello",
  slug: "hello",
  content: "<p>Body</p>",
  tags: ["tech"],
  featured: false,
  status: "draft" as const,
};

describe("convex/posts · create", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockReset();
  });

  it("creates a draft with no publishedAt", async () => {
    asEditor(ctx);
    const id = await handler(create)(ctx, baseArgs);
    const post = await ctx.db.get(id);
    expect(post!.status).toBe("draft");
    expect(post!.publishedAt).toBeUndefined();
  });

  it("creates a published post with publishedAt set to now", async () => {
    asEditor(ctx);
    const before = Date.now();
    const id = await handler(create)(ctx, { ...baseArgs, status: "published" });
    const post = await ctx.db.get(id);
    expect(post!.publishedAt).toBeGreaterThanOrEqual(before);
  });

  it("rejects duplicate slug", async () => {
    asEditor(ctx);
    await handler(create)(ctx, baseArgs);
    await expect(handler(create)(ctx, baseArgs)).rejects.toThrow(
      "Slug already in use",
    );
  });

  it("rejects unauthorized roles", async () => {
    asEditor(ctx, "proposal-editor");
    await expect(handler(create)(ctx, baseArgs)).rejects.toThrow("Forbidden");
  });
});

describe("convex/posts · publish / unpublish", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockReset();
  });

  it("publish sets status=published with publishedAt", async () => {
    asEditor(ctx);
    const id = await handler(create)(ctx, baseArgs);
    await handler(publish)(ctx, { id });
    const post = await ctx.db.get(id);
    expect(post!.status).toBe("published");
    expect(post!.publishedAt).toBeGreaterThan(0);
  });

  it("unpublish reverts to draft", async () => {
    asEditor(ctx);
    const id = await handler(create)(ctx, { ...baseArgs, status: "published" });
    await handler(unpublish)(ctx, { id });
    expect((await ctx.db.get(id))!.status).toBe("draft");
  });
});

describe("convex/posts · update", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockReset();
  });

  it("patches fields and updatedAt", async () => {
    asEditor(ctx);
    const id = await handler(create)(ctx, baseArgs);
    await handler(update)(ctx, { id, title: "New Title" });
    const post = await ctx.db.get(id);
    expect(post!.title).toBe("New Title");
    expect(post!.updatedAt).toBeGreaterThan(0);
  });
});

describe("convex/posts · remove / permanentDelete / restore", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockReset();
  });

  it("remove soft-deletes", async () => {
    asEditor(ctx);
    const id = await handler(create)(ctx, baseArgs);
    await handler(remove)(ctx, { id });
    const post = await ctx.db.get(id);
    expect(post!.deletedAt).toBeGreaterThan(0);
  });

  it("permanentDelete is root-only", async () => {
    asEditor(ctx, "blog-editor");
    const id = await handler(create)(ctx, baseArgs);
    await expect(handler(permanentDelete)(ctx, { id })).rejects.toThrow(
      "Forbidden",
    );
  });

  it("permanentDelete removes for root", async () => {
    asEditor(ctx, "root");
    const id = await handler(create)(ctx, baseArgs);
    await handler(permanentDelete)(ctx, { id });
    expect(await ctx.db.get(id)).toBeNull();
  });

  it("restore is root-only and clears deletedAt", async () => {
    asEditor(ctx, "root");
    const id = await handler(create)(ctx, baseArgs);
    await handler(remove)(ctx, { id });
    await handler(restore)(ctx, { id });
    expect((await ctx.db.get(id))!.deletedAt).toBeUndefined();
  });
});

describe("convex/posts · getBySlug / listAdmin / listAllPublished", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockReset();
  });

  it("getBySlug returns null for missing or soft-deleted", async () => {
    expect(await handler(getBySlug)(ctx, { slug: "ghost" })).toBeNull();

    asEditor(ctx);
    const id = await handler(create)(ctx, baseArgs);
    await handler(remove)(ctx, { id });
    expect(await handler(getBySlug)(ctx, { slug: "hello" })).toBeNull();
  });

  it("getBySlug returns post with imageUrl resolution", async () => {
    asEditor(ctx);
    await handler(create)(ctx, { ...baseArgs, imageUrl: "https://i.com/x.png" });
    const post = await handler(getBySlug)(ctx, { slug: "hello" });
    expect(post.title).toBe("Hello");
    expect(post.imageUrl).toBe("https://i.com/x.png");
  });

  it("listAdmin requires editor role", async () => {
    await expect(handler(listAdmin)(ctx, {})).rejects.toThrow();
  });

  it("listAdmin excludes soft-deleted by default", async () => {
    asEditor(ctx);
    const id = await handler(create)(ctx, baseArgs);
    await handler(create)(ctx, { ...baseArgs, slug: "two", title: "Two" });
    await handler(remove)(ctx, { id });
    const posts = await handler(listAdmin)(ctx, {});
    expect(posts).toHaveLength(1);
    expect(posts[0].slug).toBe("two");
  });

  it("listAllPublished returns only published, non-deleted posts", async () => {
    asEditor(ctx);
    await handler(create)(ctx, { ...baseArgs, slug: "p1", status: "published" });
    await handler(create)(ctx, { ...baseArgs, slug: "p2", status: "draft" });
    const published = await handler(listAllPublished)(ctx, {});
    expect(published.map((p: any) => p.slug)).toEqual(["p1"]);
  });
});

describe("convex/posts · seed", () => {
  let ctx: MockCtx;
  beforeEach(() => {
    ctx = createMockCtx();
    getAuthUserId.mockReset();
  });

  it("em banco vazio insere exatamente 2 posts", async () => {
    await handler(seed)(ctx, {});
    const docs = ctx.db._all("posts");
    expect(docs.length).toBe(2);
  });

  it("cada post tem slug determinístico único", async () => {
    await handler(seed)(ctx, {});
    const docs = ctx.db._all("posts");
    const slugs = docs.map((d) => d.slug).sort();
    expect(slugs).toEqual([
      "convex-como-backend-reativo-alem-do-crud",
      "transicao-de-carreira-para-tecnologia-o-que-aprendi-em-12-meses",
    ]);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("post 1 tem tags [React, Convex] e post 2 tem tags [Carreira]", async () => {
    await handler(seed)(ctx, {});
    const docs = ctx.db._all("posts");
    const post1 = docs.find((d) => d.slug === "convex-como-backend-reativo-alem-do-crud")!;
    const post2 = docs.find((d) => d.slug === "transicao-de-carreira-para-tecnologia-o-que-aprendi-em-12-meses")!;
    expect(post1.tags).toEqual(["React", "Convex"]);
    expect(post2.tags).toEqual(["Carreira"]);
  });

  it("cada post tem status 'published'", async () => {
    await handler(seed)(ctx, {});
    const docs = ctx.db._all("posts");
    for (const doc of docs) {
      expect(doc.status).toBe("published");
    }
  });

  it("cada post tem featured = false", async () => {
    await handler(seed)(ctx, {});
    const docs = ctx.db._all("posts");
    for (const doc of docs) {
      expect(doc.featured).toBe(false);
    }
  });

  it("cada post tem publishedAt numérico positivo e distintos", async () => {
    await handler(seed)(ctx, {});
    const docs = ctx.db._all("posts");
    const publishedAtValues = docs.map((d) => d.publishedAt);
    for (const value of publishedAtValues) {
      expect(typeof value).toBe("number");
      expect(value).toBeGreaterThan(0);
    }
    expect(new Set(publishedAtValues).size).toBe(publishedAtValues.length);
  });

  it("cada post tem imageUrl externa com picsum e slug determinístico", async () => {
    await handler(seed)(ctx, {});
    const docs = ctx.db._all("posts");
    for (const doc of docs) {
      expect(typeof doc.imageUrl).toBe("string");
      expect(doc.imageUrl).toMatch(/^https:\/\/picsum\.photos\/seed\/[a-z0-9-]+-\d+\/800\/600$/);
      expect(doc.imageUrl).toContain(doc.slug);
    }
  });

  it("cada post NÃO tem imageId (apenas imageUrl externa)", async () => {
    await handler(seed)(ctx, {});
    const docs = ctx.db._all("posts");
    for (const doc of docs) {
      expect(doc.imageId).toBeUndefined();
    }
  });

  it("cada post tem titleTranslations.ptBR e contentTranslations.ptBR não-vazios", async () => {
    await handler(seed)(ctx, {});
    const docs = ctx.db._all("posts");
    for (const doc of docs) {
      expect(doc.titleTranslations).toBeDefined();
      expect(typeof doc.titleTranslations.ptBR).toBe("string");
      expect(doc.titleTranslations.ptBR.length).toBeGreaterThan(0);
      expect(doc.contentTranslations).toBeDefined();
      expect(typeof doc.contentTranslations.ptBR).toBe("string");
      expect(doc.contentTranslations.ptBR.length).toBeGreaterThan(0);
    }
  });

  it("cada post tem content em markdown com ~400 palavras em pt-BR", async () => {
    await handler(seed)(ctx, {});
    const docs = ctx.db._all("posts");
    for (const doc of docs) {
      expect(typeof doc.content).toBe("string");
      const wordCount = doc.content.trim().split(/\s+/).length;
      expect(wordCount).toBeGreaterThanOrEqual(300);
    }
  });

  it("cada post tem createdAt numérico positivo", async () => {
    await handler(seed)(ctx, {});
    const docs = ctx.db._all("posts");
    for (const doc of docs) {
      expect(typeof doc.createdAt).toBe("number");
      expect(doc.createdAt).toBeGreaterThan(0);
    }
  });

  it("em banco vazio insere exatamente 2 posts (idempotência inicial)", async () => {
    await handler(seed)(ctx, {});
    expect(ctx.db._all("posts").length).toBe(2);
  });

  it("com 1 post pré-existente, seed insere só o que falta → vai para 2", async () => {
    ctx.db._seed("posts", [
      {
        title: "Post Existente",
        titleTranslations: { ptBR: "Post Existente" },
        slug: "post-existente",
        content: "Conteúdo existente",
        contentTranslations: { ptBR: "Conteúdo existente" },
        tags: ["x"],
        featured: false,
        status: "published",
        publishedAt: 100,
        createdAt: 1,
      },
    ]);
    await handler(seed)(ctx, {});
    const docs = ctx.db._all("posts");
    expect(docs.length).toBe(2);
    expect(docs.find((d) => d.slug === "post-existente")).toBeDefined();
    const seededSlugs = docs
      .map((d) => d.slug)
      .filter(
        (s) =>
          s === "convex-como-backend-reativo-alem-do-crud" ||
          s === "transicao-de-carreira-para-tecnologia-o-que-aprendi-em-12-meses",
      );
    expect(seededSlugs.length).toBe(1);
  });

  it("com 2 posts pré-existentes, seed é no-op (não duplica nem sobrescreve)", async () => {
    ctx.db._seed("posts", [
      {
        title: "Existente 1",
        titleTranslations: { ptBR: "Existente 1" },
        slug: "post-existente-1",
        content: "x",
        contentTranslations: { ptBR: "x" },
        tags: ["x"],
        featured: false,
        status: "published",
        publishedAt: 100,
        createdAt: 1,
      },
      {
        title: "Existente 2",
        titleTranslations: { ptBR: "Existente 2" },
        slug: "post-existente-2",
        content: "y",
        contentTranslations: { ptBR: "y" },
        tags: ["y"],
        featured: false,
        status: "published",
        publishedAt: 200,
        createdAt: 2,
      },
    ]);
    await handler(seed)(ctx, {});
    const docs = ctx.db._all("posts");
    expect(docs.length).toBe(2);
    expect(docs.map((d) => d.slug).sort()).toEqual(["post-existente-1", "post-existente-2"]);
    expect(docs.find((d) => d.slug === "post-existente-1")!.createdAt).toBe(1);
    expect(docs.find((d) => d.slug === "post-existente-2")!.createdAt).toBe(2);
  });

  it("rodar seed 2x seguidas mantém exatamente 2 posts", async () => {
    await handler(seed)(ctx, {});
    await handler(seed)(ctx, {});
    expect(ctx.db._all("posts").length).toBe(2);
  });
});
