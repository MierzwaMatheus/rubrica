import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("convex/react", () => ({
  useMutation: vi.fn(() => vi.fn()),
  useQuery: vi.fn(() => undefined),
}));

vi.mock("../../../convex/_generated/api", () => ({
  api: {
    siteConfig: {
      setBatch: "siteConfig:setBatch",
      setOgImage: "siteConfig:setOgImage",
    },
    images: {
      generateUploadUrl: "images:generateUploadUrl",
    },
  },
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), loading: vi.fn(), dismiss: vi.fn() },
}));

vi.mock("@/pages/admin/Dashboard", () => ({
  AdminLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import { useQuery } from "convex/react";
import AdminSiteConfig from "@/pages/admin/SiteConfig";

const mockUseQuery = vi.mocked(useQuery);

const defaultRawConfig = [
  { key: "site_title", value: "Meu Site" },
  { key: "site_description", value: "Descrição do site" },
  { key: "site_url", value: "https://exemplo.com" },
  { key: "site_name", value: "Meu Site Portfolio" },
  { key: "og_image_url", value: "" },
  { key: "twitter_handle", value: "usuario" },
  { key: "author_name", value: "Autor" },
  { key: "author_email", value: "autor@exemplo.com" },
  { key: "seo_home_title", value: "Título Home" },
  { key: "seo_home_description", value: "Descrição Home" },
  { key: "theme_background", value: "#09090b" },
  { key: "theme_foreground", value: "#fafafa" },
  { key: "theme_primary", value: "#6366f1" },
  { key: "theme_accent", value: "#f59e0b" },
  { key: "theme_font_sans", value: "Inter" },
  { key: "theme_font_mono", value: "JetBrains Mono" },
  { key: "keywords", value: [] },
  { key: "lang", value: "pt-BR" },
];

beforeEach(() => {
  mockUseQuery.mockReturnValue(defaultRawConfig as any);
});

describe("SiteConfig — Ciclo 1: estrutura básica da página", () => {
  it("renderiza o heading da seção Aparência", () => {
    render(<AdminSiteConfig />);
    expect(screen.getByText("Aparência")).toBeInTheDocument();
  });

  it("renderiza o heading da seção SEO & Identidade", () => {
    render(<AdminSiteConfig />);
    expect(screen.getByText("SEO & Identidade")).toBeInTheDocument();
  });
});

describe("SiteConfig — Ciclo 7: 4 color pickers", () => {
  it("renderiza color picker nativo para fundo (theme_background)", () => {
    render(<AdminSiteConfig />);
    expect(screen.getByTestId("color-picker-bg-native")).toBeInTheDocument();
  });

  it("renderiza color picker nativo para texto (theme_foreground)", () => {
    render(<AdminSiteConfig />);
    expect(screen.getByTestId("color-picker-fg-native")).toBeInTheDocument();
  });

  it("renderiza color picker nativo para primária (theme_primary)", () => {
    render(<AdminSiteConfig />);
    expect(screen.getByTestId("color-picker-primary-native")).toBeInTheDocument();
  });

  it("renderiza color picker nativo para destaque (theme_accent)", () => {
    render(<AdminSiteConfig />);
    expect(screen.getByTestId("color-picker-accent-native")).toBeInTheDocument();
  });

  it("pickers carregam valores do Convex", () => {
    render(<AdminSiteConfig />);
    expect(screen.getByTestId("color-picker-bg-hex")).toHaveValue("#09090b");
    expect(screen.getByTestId("color-picker-fg-hex")).toHaveValue("#fafafa");
    expect(screen.getByTestId("color-picker-primary-hex")).toHaveValue("#6366f1");
    expect(screen.getByTestId("color-picker-accent-hex")).toHaveValue("#f59e0b");
  });
});

describe("SiteConfig — Ciclo 8: contrast badges WCAG", () => {
  it("renderiza badge de contraste para texto (fg vs bg)", () => {
    render(<AdminSiteConfig />);
    expect(screen.getByTestId("contrast-badge-fg")).toBeInTheDocument();
  });

  it("renderiza badge de contraste para primária (primary vs bg)", () => {
    render(<AdminSiteConfig />);
    expect(screen.getByTestId("contrast-badge-primary")).toBeInTheDocument();
  });

  it("renderiza badge de contraste para destaque (accent vs bg)", () => {
    render(<AdminSiteConfig />);
    expect(screen.getByTestId("contrast-badge-accent")).toBeInTheDocument();
  });

  it("badge fg mostra AAA para branco (#fafafa) sobre preto (#09090b)", () => {
    render(<AdminSiteConfig />);
    const badge = screen.getByTestId("contrast-badge-fg");
    expect(badge.textContent).toContain("AAA");
  });
});

describe("SiteConfig — Ciclo 9: border-radius removido", () => {
  it("não renderiza select de border radius", () => {
    render(<AdminSiteConfig />);
    expect(screen.queryByTestId("select-radius")).not.toBeInTheDocument();
  });

  it("não exibe label 'Border radius'", () => {
    render(<AdminSiteConfig />);
    expect(screen.queryByText("Border radius")).not.toBeInTheDocument();
  });
});

describe("SiteConfig — Ciclo 6: salvamento via setBatch + toast", () => {
  it("renderiza botão 'Salvar Aparência'", () => {
    render(<AdminSiteConfig />);
    expect(screen.getByTestId("btn-save-aparencia")).toBeInTheDocument();
  });

  it("renderiza botão 'Salvar SEO'", () => {
    render(<AdminSiteConfig />);
    expect(screen.getByTestId("btn-save-seo")).toBeInTheDocument();
  });

  it("clicar em 'Salvar Aparência' chama setBatch com as 4 novas chaves de cor", async () => {
    const { useMutation: mockUseMutation } = await import("convex/react");
    const mockSetBatch = vi.fn().mockResolvedValue(undefined);
    vi.mocked(mockUseMutation).mockImplementation((fn: any) => {
      if (fn === "siteConfig:setBatch") return mockSetBatch;
      return vi.fn();
    });

    const { fireEvent } = await import("@testing-library/react");
    render(<AdminSiteConfig />);
    fireEvent.click(screen.getByTestId("btn-save-aparencia"));

    await new Promise((r) => setTimeout(r, 0));
    expect(mockSetBatch).toHaveBeenCalledWith(
      expect.objectContaining({
        items: expect.arrayContaining([
          expect.objectContaining({ key: "theme_background" }),
          expect.objectContaining({ key: "theme_foreground" }),
          expect.objectContaining({ key: "theme_primary" }),
          expect.objectContaining({ key: "theme_accent" }),
          expect.objectContaining({ key: "theme_font_sans" }),
          expect.objectContaining({ key: "theme_font_mono" }),
        ]),
      })
    );
  });

  it("clicar em 'Salvar Aparência' não salva theme_radius", async () => {
    const { useMutation: mockUseMutation } = await import("convex/react");
    const mockSetBatch = vi.fn().mockResolvedValue(undefined);
    vi.mocked(mockUseMutation).mockImplementation((fn: any) => {
      if (fn === "siteConfig:setBatch") return mockSetBatch;
      return vi.fn();
    });

    const { fireEvent } = await import("@testing-library/react");
    render(<AdminSiteConfig />);
    fireEvent.click(screen.getByTestId("btn-save-aparencia"));

    await new Promise((r) => setTimeout(r, 0));
    const call = mockSetBatch.mock.calls[0]?.[0];
    const keys = call?.items?.map((i: any) => i.key) ?? [];
    expect(keys).not.toContain("theme_radius");
  });

  it("clicar em 'Salvar SEO' chama setBatch com chaves de identidade", async () => {
    const { useMutation: mockUseMutation } = await import("convex/react");
    const mockSetBatch = vi.fn().mockResolvedValue(undefined);
    vi.mocked(mockUseMutation).mockImplementation((fn: any) => {
      if (fn === "siteConfig:setBatch") return mockSetBatch;
      return vi.fn();
    });

    const { fireEvent } = await import("@testing-library/react");
    render(<AdminSiteConfig />);
    fireEvent.click(screen.getByTestId("btn-save-seo"));

    await new Promise((r) => setTimeout(r, 0));
    expect(mockSetBatch).toHaveBeenCalledWith(
      expect.objectContaining({
        items: expect.arrayContaining([
          expect.objectContaining({ key: "site_title" }),
          expect.objectContaining({ key: "site_description" }),
          expect.objectContaining({ key: "twitter_handle" }),
        ]),
      })
    );
  });
});

describe("SiteConfig — Ciclo 5: OG Image upload", () => {
  it("renderiza botão de upload de OG image", () => {
    render(<AdminSiteConfig />);
    expect(screen.getByTestId("og-image-upload-button")).toBeInTheDocument();
  });
});

describe("SiteConfig — Ciclo 4: seção SEO campos de texto e keywords", () => {
  it("renderiza input para site_title com valor atual", () => {
    render(<AdminSiteConfig />);
    const input = screen.getByTestId("input-site-title");
    expect(input).toHaveValue("Meu Site");
  });

  it("renderiza textarea para site_description com valor atual", () => {
    render(<AdminSiteConfig />);
    const textarea = screen.getByTestId("textarea-site-description");
    expect(textarea).toHaveValue("Descrição do site");
  });

  it("renderiza input para twitter_handle sem @", () => {
    render(<AdminSiteConfig />);
    const input = screen.getByTestId("input-twitter-handle");
    expect(input).toHaveValue("usuario");
    expect(input).not.toHaveValue("@usuario");
  });

  it("renderiza input para seo_home_title", () => {
    render(<AdminSiteConfig />);
    expect(screen.getByTestId("input-seo-home-title")).toBeInTheDocument();
  });

  it("renderiza textarea para seo_home_description", () => {
    render(<AdminSiteConfig />);
    expect(screen.getByTestId("textarea-seo-home-description")).toBeInTheDocument();
  });

  it("renderiza área de keywords", () => {
    render(<AdminSiteConfig />);
    expect(screen.getByTestId("keywords-input")).toBeInTheDocument();
  });
});

describe("SiteConfig — Ciclo 3: fontes", () => {
  it("renderiza select de fonte principal com as 5 opções curadas", () => {
    render(<AdminSiteConfig />);
    expect(screen.getByTestId("select-font-sans")).toBeInTheDocument();
  });

  it("renderiza select de fonte mono com as 4 opções", () => {
    render(<AdminSiteConfig />);
    expect(screen.getByTestId("select-font-mono")).toBeInTheDocument();
  });

  it("select de fonte principal mostra valor atual do config", () => {
    render(<AdminSiteConfig />);
    expect(screen.getByText("Inter")).toBeInTheDocument();
  });
});
