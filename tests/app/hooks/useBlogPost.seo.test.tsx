import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const i18n = vi.hoisted(() => ({ locale: "pt-BR" }));
vi.mock("@/i18n/context/I18nContext", () => ({ useI18n: () => ({ locale: i18n.locale }) }));

import { useBlogPost } from "@/hooks/useBlog";
import { mapBlogPost } from "@/repositories/mappers/convexMappers";
import type { BlogRepository } from "@/repositories/interfaces/BlogRepository";

const raw = {
  _id: "p1",
  title: "Título",
  slug: "titulo",
  imageUrl: "https://i.com/capa.png",
  seoTitle: "SEO pt",
  seoTitleTranslations: { ptBR: "SEO pt", enUS: "SEO en" },
  seoDescription: "Desc pt",
  seoDescriptionTranslations: { ptBR: "Desc pt", enUS: "" },
  ogImageUrl: "https://i.com/og.png",
};

function setup(locale: string, data: unknown = raw) {
  i18n.locale = locale;
  const repo: BlogRepository = { list: async () => [], getBySlug: async () => mapBlogPost(data) };
  const client = new QueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return renderHook(() => useBlogPost(repo, "titulo"), { wrapper });
}

describe("mapBlogPost — campos de SEO", () => {
  it("mapeia título, descrição e imagem de compartilhamento", () => {
    const post = mapBlogPost(raw);
    expect(post.seo_title).toBe("SEO pt");
    expect(post.seo_title_translations).toEqual({ "pt-BR": "SEO pt", "en-US": "SEO en" });
    expect(post.seo_description).toBe("Desc pt");
    expect(post.og_image).toBe("https://i.com/og.png");
  });

  it("post sem SEO vira strings vazias", () => {
    const post = mapBlogPost({ _id: "p", title: "x", slug: "x" });
    expect(post.seo_title).toBe("");
    expect(post.seo_description).toBe("");
    expect(post.og_image).toBe("");
  });
});

describe("useBlogPost — SEO no idioma da página", () => {
  it("pt-BR usa o texto em português", async () => {
    const { result } = setup("pt-BR");
    await waitFor(() => expect(result.current.post).not.toBeNull());
    expect(result.current.post!.seo_title).toBe("SEO pt");
    expect(result.current.post!.seo_description).toBe("Desc pt");
  });

  it("inglês usa a tradução e, sem ela, cai no português", async () => {
    const { result } = setup("en-US");
    await waitFor(() => expect(result.current.post).not.toBeNull());
    expect(result.current.post!.seo_title).toBe("SEO en");
    expect(result.current.post!.seo_description).toBe("Desc pt");
  });

  it("sem SEO, fica vazio (a página usa título e subtítulo)", async () => {
    const { result } = setup("en-US", { _id: "p", title: "x", slug: "titulo" });
    await waitFor(() => expect(result.current.post).not.toBeNull());
    expect(result.current.post!.seo_title).toBe("");
  });
});
