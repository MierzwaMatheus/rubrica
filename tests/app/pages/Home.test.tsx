import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";

vi.mock("@/hooks/useSiteConfig", () => ({
  useSiteConfig: vi.fn(),
}));

vi.mock("@/repositories/instances", () => ({
  homeRepository: {},
  sidebarRepository: {},
  portfolioRepository: {},
}));

vi.mock("@/hooks/usePortfolio", () => ({
  usePortfolio: vi.fn(() => ({ projects: [], isLoading: false })),
}));

vi.mock("@/hooks/useHomeMetrics", () => ({
  useHomeMetrics: vi.fn(() => ({ metrics: [], isLoading: false })),
}));

vi.mock("@/contexts/ContactWizardContext", () => ({
  useContactWizard: vi.fn(() => ({ openWizard: vi.fn() })),
}));

vi.mock("@/hooks/useHome", () => ({
  useHome: vi.fn(),
}));

vi.mock("@/i18n/hooks/useTranslation", () => ({
  useTranslation: vi.fn(),
}));

vi.mock("@/i18n/context/I18nContext", () => ({
  useI18n: vi.fn(),
}));

vi.mock("@/contexts/PluginsContext", () => ({
  usePlugin: vi.fn(),
}));

vi.mock("@/hooks/useMatrixText", () => ({
  useMatrixText: vi.fn(() => ""),
}));

vi.mock("@/components/TestimonialWizard", () => ({
  TestimonialWizard: () => null,
}));

vi.mock("@/components/AvailabilityBadge", () => ({
  AvailabilityBadge: () => null,
}));

vi.mock("@/hooks/useSidebar", () => ({
  useSidebar: vi.fn(() => ({ contactInfo: null })),
}));

vi.mock("convex/react", () => ({
  useQuery: vi.fn(() => undefined),
}));

vi.mock("@/components/PageSkeleton", () => ({
  PageSkeleton: () => <div data-testid="page-skeleton" />,
}));

vi.mock("wouter", () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

import { useSiteConfig } from "@/hooks/useSiteConfig";
import { useHome } from "@/hooks/useHome";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { useI18n } from "@/i18n/context/I18nContext";
import { usePlugin } from "@/contexts/PluginsContext";
import Home from "@/pages/Home";

const mockUseSiteConfig = vi.mocked(useSiteConfig);
const mockUseHome = vi.mocked(useHome);
const mockUseTranslation = vi.mocked(useTranslation);
const mockUseI18n = vi.mocked(useI18n);
const mockUsePlugin = vi.mocked(usePlugin);

const defaultSiteConfig = {
  site_title: "Site Neutro",
  site_description: "Descrição padrão do site",
  site_url: "https://exemplo.com",
  site_name: "Site Neutro Portfolio",
  og_image_url: "https://exemplo.com/og.jpg",
  twitter_handle: "usuario",
  author_name: "",
  author_email: "",
  rss_title: "",
  rss_description: "",
  seo_home_title: "Meu título SEO home",
  seo_home_description: "Minha descrição SEO home",
  theme_accent_color: "#6366f1",
  theme_accent_hsl: "",
  theme_font_sans: "Inter",
  theme_font_mono: "JetBrains Mono",
  theme_radius: "0.5rem",
  keywords: [],
  lang: "pt-BR",
  isLoading: false,
};

const defaultHomeData = {
  contactRole: "Dev",
  aboutText: "Sobre mim",
  services: [],
  testimonials: [],
  availability: null,
  isLoading: false,
};

function renderHome() {
  return render(
    <HelmetProvider>
      <Home />
    </HelmetProvider>
  );
}

beforeEach(() => {
  mockUseSiteConfig.mockReturnValue(defaultSiteConfig);
  mockUseHome.mockReturnValue(defaultHomeData);
  mockUseTranslation.mockReturnValue({
    t: (key: string) => key,
    tValue: (_key: string) => [],
  } as ReturnType<typeof useTranslation>);
  mockUseI18n.mockReturnValue({ isLoading: false } as ReturnType<typeof useI18n>);
  mockUsePlugin.mockReturnValue(false);
});

describe("Home — Ciclo 1: SEO usa seo_home_title e seo_home_description do useSiteConfig", () => {
  it("renderiza <title> com seo_home_title do siteConfig", async () => {
    mockUseSiteConfig.mockReturnValue({
      ...defaultSiteConfig,
      seo_home_title: "Título dinâmico da home",
      site_title: "Site Neutro",
    });

    renderHome();

    await waitFor(() => {
      expect(document.title).toContain("Título dinâmico da home");
    });
  });

  it("renderiza meta description com seo_home_description do siteConfig", async () => {
    mockUseSiteConfig.mockReturnValue({
      ...defaultSiteConfig,
      seo_home_description: "Descrição dinâmica da home",
    });

    renderHome();

    await waitFor(() => {
      const meta = document.querySelector('meta[name="description"]');
      expect(meta?.getAttribute("content")).toContain("Descrição dinâmica da home");
    });
  });

  it("não usa strings hardcoded pessoais no title", async () => {
    renderHome();

    await waitFor(() => {
      expect(document.title).not.toContain("Desenvolvedor Front-end Sênior");
      expect(document.title).not.toContain("Tech Lead React");
    });
  });

  it("não usa strings hardcoded pessoais na meta description", async () => {
    renderHome();

    await waitFor(() => {
      const meta = document.querySelector('meta[name="description"]');
      expect(meta?.getAttribute("content")).not.toContain("Transformo desafios complexos");
    });
  });
});

describe("Home — Ciclo 2: não crasha com config vazio", () => {
  it("renderiza sem erro quando seo_home_title é string vazia", async () => {
    mockUseSiteConfig.mockReturnValue({
      ...defaultSiteConfig,
      seo_home_title: "",
      seo_home_description: "",
    });

    expect(() => renderHome()).not.toThrow();
  });
});
