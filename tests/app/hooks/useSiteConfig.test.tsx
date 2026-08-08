import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { rubricalConfig } from "../../../rubrica.config";

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
}));

vi.mock("@/repositories/instances", () => ({
  siteConfigRepository: { getPublic: vi.fn() },
}));

import { useQuery } from "@tanstack/react-query";
import { useSiteConfig } from "@/hooks/useSiteConfig";

const mockUseQuery = vi.mocked(useQuery);

beforeEach(() => {
  mockUseQuery.mockReturnValue({ data: undefined, isLoading: true } as any);
});

describe("useSiteConfig", () => {
  describe("enquanto Convex está carregando (undefined)", () => {
    it("retorna isLoading: true", () => {
      const { result } = renderHook(() => useSiteConfig());
      expect(result.current.isLoading).toBe(true);
    });

    it("retorna site_title a partir de rubricalConfig.siteName", () => {
      const { result } = renderHook(() => useSiteConfig());
      expect(result.current.site_title).toBe(rubricalConfig.siteName);
    });

    it("retorna site_url a partir de rubricalConfig.siteUrl", () => {
      const { result } = renderHook(() => useSiteConfig());
      expect(result.current.site_url).toBe(rubricalConfig.siteUrl);
    });

    it("retorna lang a partir de rubricalConfig.lang", () => {
      const { result } = renderHook(() => useSiteConfig());
      expect(result.current.lang).toBe(rubricalConfig.lang);
    });
  });

  describe("quando Convex retorna dados", () => {
    it("retorna isLoading: false", () => {
      mockUseQuery.mockReturnValue({ data: [], isLoading: false } as any);
      const { result } = renderHook(() => useSiteConfig());
      expect(result.current.isLoading).toBe(false);
    });

    it("sobrescreve site_title com valor do Convex", () => {
      mockUseQuery.mockReturnValue({
        data: [{ key: "site_title", value: "Override Title" }],
        isLoading: false,
      } as any);
      const { result } = renderHook(() => useSiteConfig());
      expect(result.current.site_title).toBe("Override Title");
    });

    it("preserva fallback quando Convex não tem a chave", () => {
      mockUseQuery.mockReturnValue({
        data: [{ key: "site_title", value: "Override Title" }],
        isLoading: false,
      } as any);
      const { result } = renderHook(() => useSiteConfig());
      expect(result.current.lang).toBe(rubricalConfig.lang);
    });

    it("sobrescreve múltiplas chaves do Convex", () => {
      mockUseQuery.mockReturnValue({
        data: [
          { key: "site_title", value: "Novo Título" },
          { key: "twitter_handle", value: "novousuario" },
        ],
        isLoading: false,
      } as any);
      const { result } = renderHook(() => useSiteConfig());
      expect(result.current.site_title).toBe("Novo Título");
      expect(result.current.twitter_handle).toBe("novousuario");
    });
  });

  describe("todas as chaves estão presentes", () => {
    it("retorna as chaves públicas incluindo as 4 novas de tema", () => {
      mockUseQuery.mockReturnValue({ data: [], isLoading: false } as any);
      const { result } = renderHook(() => useSiteConfig());
      const expectedKeys = [
        "site_title", "site_description", "site_url", "site_name",
        "og_image_url", "twitter_handle", "author_name", "author_email",
        "rss_title", "rss_description", "seo_home_title", "seo_home_description",
        "theme_background", "theme_foreground", "theme_primary", "theme_accent",
        "theme_accent_color", "theme_accent_hsl", "theme_font_sans",
        "theme_font_mono", "keywords", "lang",
      ];
      for (const key of expectedKeys) {
        expect(result.current).toHaveProperty(key);
      }
    });

    it("não contém theme_radius", () => {
      mockUseQuery.mockReturnValue({ data: [], isLoading: false } as any);
      const { result } = renderHook(() => useSiteConfig());
      expect(result.current).not.toHaveProperty("theme_radius");
    });

    it("keywords tem fallback de array vazio", () => {
      mockUseQuery.mockReturnValue({ data: [], isLoading: false } as any);
      const { result } = renderHook(() => useSiteConfig());
      expect(result.current.keywords).toEqual([]);
    });

    it("theme_accent_hsl tem fallback de string vazia", () => {
      mockUseQuery.mockReturnValue({ data: [], isLoading: false } as any);
      const { result } = renderHook(() => useSiteConfig());
      expect(result.current.theme_accent_hsl).toBe("");
    });
  });
});
