import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";

vi.mock("@/hooks/useSiteConfig", () => ({
  useSiteConfig: vi.fn(),
}));

// O idioma da página vem da URL (via useI18n); aqui ele é controlado pelo teste.
const i18n = vi.hoisted(() => ({ locale: "pt-BR" as "pt-BR" | "en-US" }));
vi.mock("@/i18n/context/I18nContext", () => ({
  useI18n: () => ({ locale: i18n.locale }),
}));

import { useSiteConfig } from "@/hooks/useSiteConfig";
import { SEO } from "@/components/SEO";

const mockUseSiteConfig = vi.mocked(useSiteConfig);

const defaultConfig = {
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
  seo_home_title: "",
  seo_home_description: "",
  theme_accent_color: "#6366f1",
  theme_accent_hsl: "",
  theme_font_sans: "Inter",
  theme_font_mono: "JetBrains Mono",
  theme_radius: "0.5rem",
  keywords: [],
  lang: "pt-BR",
  isLoading: false,
};

function renderSEO(props: Parameters<typeof SEO>[0]) {
  return render(
    <HelmetProvider>
      <SEO {...props} />
    </HelmetProvider>
  );
}

beforeEach(() => {
  i18n.locale = "pt-BR";
  mockUseSiteConfig.mockReturnValue(defaultConfig);
});

describe("SEO", () => {
  describe("Ciclo 8 — placeholder neutro sem crash", () => {
    it("renderiza sem crash quando todos os campos de config são strings vazias", async () => {
      const emptyConfig = {
        ...defaultConfig,
        site_title: "",
        site_description: "",
        site_url: "",
        site_name: "",
        og_image_url: "",
        twitter_handle: "",
        lang: "",
        isLoading: false,
      };
      mockUseSiteConfig.mockReturnValue(emptyConfig);
      expect(() => renderSEO({ title: "Página" })).not.toThrow();
    });

    it("renderiza sem crash durante carregamento (isLoading: true)", async () => {
      mockUseSiteConfig.mockReturnValue({ ...defaultConfig, isLoading: true });
      expect(() => renderSEO({ title: "Página" })).not.toThrow();
    });

    it("og:locale segue o idioma da página mesmo com lang vazio na config", async () => {
      mockUseSiteConfig.mockReturnValue({ ...defaultConfig, lang: "" });
      renderSEO({ title: "Página" });
      await waitFor(() => {
        const meta = document.querySelector('meta[property="og:locale"]');
        expect(meta?.getAttribute("content")).toBe("pt_BR");
      });
    });
  });

  describe("Ciclo 7 — twitter:creator", () => {
    it("usa twitter_handle do useSiteConfig com @ prefixado", async () => {
      renderSEO({ title: "Página" });
      await waitFor(() => {
        const meta = document.querySelector('meta[property="twitter:creator"]');
        expect(meta?.getAttribute("content")).toBe("@usuario");
      });
    });

    it("não contém handle pessoal hardcoded no twitter:creator", async () => {
      renderSEO({ title: "Página" });
      await waitFor(() => {
        const meta = document.querySelector('meta[property="twitter:creator"]');
        expect(meta?.getAttribute("content")).not.toBe("@matheusmierzwa");
      });
    });

    it("omite twitter:creator quando twitter_handle está vazio", async () => {
      mockUseSiteConfig.mockReturnValue({ ...defaultConfig, twitter_handle: "" });
      renderSEO({ title: "Página" });
      await waitFor(() => {
        const meta = document.querySelector('meta[property="twitter:creator"]');
        expect(meta?.getAttribute("content")).toBe("");
      });
    });
  });

  describe("Ciclo 6 — og:locale", () => {
    it("usa o idioma da página no formato og:locale (pt-BR → pt_BR)", async () => {
      renderSEO({ title: "Página" });
      await waitFor(() => {
        const meta = document.querySelector('meta[property="og:locale"]');
        expect(meta?.getAttribute("content")).toBe("pt_BR");
      });
    });

    it("converte en-US para en_US no og:locale e aponta o pt-BR como alternativo", async () => {
      i18n.locale = "en-US";
      renderSEO({ title: "Página" });
      await waitFor(() => {
        const meta = document.querySelector('meta[property="og:locale"]');
        expect(meta?.getAttribute("content")).toBe("en_US");
        const alt = document.querySelector('meta[property="og:locale:alternate"]');
        expect(alt?.getAttribute("content")).toBe("pt_BR");
      });
    });

    it("não contém pt_BR hardcoded — usa o idioma da página", async () => {
      i18n.locale = "en-US";
      renderSEO({ title: "Página" });
      await waitFor(() => {
        const meta = document.querySelector('meta[property="og:locale"]');
        expect(meta?.getAttribute("content")).not.toBe("pt_BR");
      });
    });
  });

  describe("Idioma pela URL — canonical e hreflang", () => {
    it("em pt-BR, o canonical é o caminho sem prefixo", async () => {
      renderSEO({ title: "Post", url: "/blog/meu-post" });
      await waitFor(() => {
        expect(document.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe(
          "https://exemplo.com/blog/meu-post",
        );
      });
    });

    it("em inglês, o canonical e o og:url levam o prefixo /en", async () => {
      i18n.locale = "en-US";
      renderSEO({ title: "Post", url: "/blog/meu-post" });
      await waitFor(() => {
        expect(document.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe(
          "https://exemplo.com/en/blog/meu-post",
        );
        expect(document.querySelector('meta[property="og:url"]')?.getAttribute("content")).toBe(
          "https://exemplo.com/en/blog/meu-post",
        );
      });
    });

    it("lista as duas versões em hreflang, com pt-BR como x-default", async () => {
      renderSEO({ title: "Post", url: "/blog/meu-post" });
      await waitFor(() => {
        const alt = (lang: string) =>
          document.querySelector(`link[rel="alternate"][hreflang="${lang}"]`)?.getAttribute("href");
        expect(alt("pt-BR")).toBe("https://exemplo.com/blog/meu-post");
        expect(alt("en")).toBe("https://exemplo.com/en/blog/meu-post");
        expect(alt("x-default")).toBe("https://exemplo.com/blog/meu-post");
      });
    });

    it("a home em inglês é /en (sem barra no fim)", async () => {
      i18n.locale = "en-US";
      renderSEO({ title: "Home", url: "/" });
      await waitFor(() => {
        expect(document.querySelector('link[rel="canonical"]')?.getAttribute("href")).toBe("https://exemplo.com/en");
      });
    });

    it("põe o idioma da página no <html lang>", async () => {
      i18n.locale = "en-US";
      renderSEO({ title: "Página" });
      await waitFor(() => {
        expect(document.documentElement.getAttribute("lang")).toBe("en-US");
      });
    });

    it("gera JSON-LD com @context quando recebe jsonLd", async () => {
      renderSEO({ title: "Post", jsonLd: { "@type": "BlogPosting", headline: "Oi </script>" } });
      await waitFor(() => {
        const script = document.querySelector('script[type="application/ld+json"]');
        expect(script).not.toBeNull();
        const data = JSON.parse(script!.textContent!);
        expect(data).toMatchObject({ "@context": "https://schema.org", "@type": "BlogPosting", headline: "Oi </script>" });
        expect(script!.textContent).not.toContain("</script>");
      });
    });
  });

  describe("Ciclo 5 — og:site_name", () => {
    it("usa site_name do useSiteConfig no og:site_name", async () => {
      renderSEO({ title: "Página" });
      await waitFor(() => {
        const meta = document.querySelector('meta[property="og:site_name"]');
        expect(meta?.getAttribute("content")).toBe("Site Neutro Portfolio");
      });
    });

    it("não contém nome pessoal hardcoded no og:site_name", async () => {
      renderSEO({ title: "Página" });
      await waitFor(() => {
        const meta = document.querySelector('meta[property="og:site_name"]');
        expect(meta?.getAttribute("content")).not.toContain("Matheus Mierzwa");
      });
    });
  });

  describe("Ciclo 4 — siteUrl", () => {
    it("usa site_url do useSiteConfig no link canonical quando url prop não fornecida", async () => {
      renderSEO({ title: "Página" });
      await waitFor(() => {
        const link = document.querySelector('link[rel="canonical"]');
        expect(link?.getAttribute("href")).toBe("https://exemplo.com");
      });
    });

    it("usa site_url do useSiteConfig no og:url quando url prop não fornecida", async () => {
      renderSEO({ title: "Página" });
      await waitFor(() => {
        const meta = document.querySelector('meta[property="og:url"]');
        expect(meta?.getAttribute("content")).toBe("https://exemplo.com");
      });
    });

    it("não contém domínio pessoal hardcoded no canonical", async () => {
      renderSEO({ title: "Página" });
      await waitFor(() => {
        const link = document.querySelector('link[rel="canonical"]');
        expect(link?.getAttribute("href")).not.toContain("mmlo.com.br");
      });
    });
  });

  describe("Ciclo 3 — OG image URL", () => {
    it("usa og_image_url do useSiteConfig como imagem padrão quando image prop não é fornecida", async () => {
      renderSEO({ title: "Página" });
      await waitFor(() => {
        const meta = document.querySelector('meta[property="og:image"]');
        expect(meta?.getAttribute("content")).toBe("https://exemplo.com/og.jpg");
      });
    });

    it("não contém URL de imagem pessoal hardcoded no og:image", async () => {
      renderSEO({ title: "Página" });
      await waitFor(() => {
        const meta = document.querySelector('meta[property="og:image"]');
        expect(meta?.getAttribute("content")).not.toContain("postimg.cc");
      });
    });

    it("usa image prop quando fornecida, ignorando o default", async () => {
      renderSEO({ title: "Página", image: "https://outro.com/img.jpg" });
      await waitFor(() => {
        const meta = document.querySelector('meta[property="og:image"]');
        expect(meta?.getAttribute("content")).toBe("https://outro.com/img.jpg");
      });
    });
  });

  describe("Ciclo 2 — defaultDescription", () => {
    it("usa site_description do useSiteConfig como meta description padrão", async () => {
      renderSEO({ title: "Página" });
      await waitFor(() => {
        const meta = document.querySelector('meta[name="description"]');
        expect(meta?.getAttribute("content")).toBe("Descrição padrão do site");
      });
    });

    it("não contém descrição pessoal hardcoded", async () => {
      renderSEO({ title: "Página" });
      await waitFor(() => {
        const meta = document.querySelector('meta[name="description"]');
        expect(meta?.getAttribute("content")).not.toContain("Matheus Mierzwa");
      });
    });

    it("usa description prop quando fornecida, ignorando o default", async () => {
      renderSEO({ title: "Página", description: "Descrição customizada" });
      await waitFor(() => {
        const meta = document.querySelector('meta[name="description"]');
        expect(meta?.getAttribute("content")).toBe("Descrição customizada");
      });
    });
  });

  describe("Ciclo 1.13 — og:title renderizado a partir do siteConfig", () => {
    it("renderiza og:title com o título composto (prop | site_title)", async () => {
      renderSEO({ title: "Página Específica" });
      await waitFor(() => {
        const meta = document.querySelector('meta[property="og:title"]');
        expect(meta?.getAttribute("content")).toContain("Site Neutro");
        expect(meta?.getAttribute("content")).toContain("Página Específica");
      });
    });

    it("og:title não contém nome pessoal hardcoded", async () => {
      renderSEO({ title: "Página" });
      await waitFor(() => {
        const meta = document.querySelector('meta[property="og:title"]');
        expect(meta?.getAttribute("content")).not.toContain("Matheus Mierzwa");
      });
    });

    it("og:title usa site_title do siteConfig, não valor hardcoded", async () => {
      mockUseSiteConfig.mockReturnValue({ ...defaultConfig, site_title: "Portfolio Neutro" });
      renderSEO({ title: "Página" });
      await waitFor(() => {
        const meta = document.querySelector('meta[property="og:title"]');
        expect(meta?.getAttribute("content")).toContain("Portfolio Neutro");
      });
    });
  });

  describe("Ciclo 1 — siteTitle e fullTitle", () => {
    it("usa site_title do useSiteConfig como sufixo do título", async () => {
      renderSEO({ title: "Minha Página" });
      await waitFor(() => expect(document.title).toBe("Minha Página | Site Neutro"));
    });

    it("não repete o sufixo quando title já é o site_title", async () => {
      renderSEO({ title: "Site Neutro" });
      await waitFor(() => expect(document.title).toBe("Site Neutro"));
    });

    it("não contém nome pessoal hardcoded no título", async () => {
      renderSEO({ title: "Página" });
      await waitFor(() => expect(document.title).not.toContain("Matheus Mierzwa"));
    });
  });
});
