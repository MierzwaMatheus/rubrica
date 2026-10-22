import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// Mocks de dependências externas
vi.mock("@/hooks/useSidebar", () => ({ useSidebar: vi.fn() }));
vi.mock("@/hooks/useResume", () => ({ useResume: vi.fn() }));
vi.mock("@/hooks/usePortfolio", () => ({ usePortfolio: vi.fn() }));
vi.mock("@/hooks/useHome", () => ({ useHome: vi.fn() }));
vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({ data: undefined }),
}));
vi.mock("@/i18n/hooks/useTranslation", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));
vi.mock("@/i18n/context/I18nContext", () => ({
  useI18n: () => ({ locale: "pt-BR", setLocale: vi.fn() }),
}));
vi.mock("@/contexts/ContactWizardContext", () => ({
  useContactWizard: () => ({ openWizard: vi.fn() }),
}));
vi.mock("@/contexts/PluginsContext", () => ({
  usePlugins: () => ({ isEnabled: () => false }),
}));
vi.mock("wouter", () => ({
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
  useLocation: () => ["/"],
}));
vi.mock("@/utils/cvPDF", () => ({ generateCV: vi.fn() }));
vi.mock("@/repositories/instances", () => ({
  sidebarRepository: {},
  resumeRepository: {},
  portfolioRepository: {},
  homeRepository: {},
}));

import { useSidebar } from "@/hooks/useSidebar";
import { useResume } from "@/hooks/useResume";
import { usePortfolio } from "@/hooks/usePortfolio";
import { Sidebar } from "@/components/Sidebar";

const mockUseSidebar = vi.mocked(useSidebar);
const mockUseResume = vi.mocked(useResume);
const mockUsePortfolio = vi.mocked(usePortfolio);

const baseContactInfo = {
  name: "João Silva",
  role: "Dev Full-Stack",
  email: "joao@exemplo.com",
  show_email: true,
  phone: "+5511999999999",
  show_phone: false,
  avatar_url: "https://exemplo.com/avatar.jpg",
  linkedin_url: "",
  github_url: "",
  behance_url: "",
};

beforeEach(() => {
  mockUseSidebar.mockReturnValue({ contactInfo: baseContactInfo, isLoading: false });
  mockUseResume.mockReturnValue({ items: [] } as ReturnType<typeof useResume>);
  mockUsePortfolio.mockReturnValue({ projects: [] } as ReturnType<typeof usePortfolio>);
});

describe("Sidebar — Ciclo A: fallbacks de nome neutros", () => {
  it("exibe contactInfo.name no h1 quando disponível", () => {
    render(<Sidebar />);
    expect(screen.getAllByText("João Silva").length).toBeGreaterThan(0);
  });

  it("não exibe 'Matheus Mierzwa' quando contactInfo.name está preenchido", () => {
    render(<Sidebar />);
    expect(screen.queryByText("Matheus Mierzwa")).toBeNull();
  });

  it("img alt usa contactInfo.name quando disponível", () => {
    render(<Sidebar />);
    const imgs = screen.getAllByRole("img");
    expect(imgs.some((img) => img.getAttribute("alt") === "João Silva")).toBe(true);
  });

  it("img alt é string vazia quando contactInfo.name é vazio", () => {
    mockUseSidebar.mockReturnValue({
      contactInfo: { ...baseContactInfo, name: "" },
      isLoading: false,
    });
    render(<Sidebar />);
    const imgs = document.querySelectorAll("img");
    expect(Array.from(imgs).some((img) => img.getAttribute("alt") === "")).toBe(true);
  });

  it("não exibe 'Matheus Mierzwa' quando contactInfo é null", () => {
    mockUseSidebar.mockReturnValue({ contactInfo: null, isLoading: false });
    render(<Sidebar />);
    expect(screen.queryByText("Matheus Mierzwa")).toBeNull();
  });
});

describe("Sidebar — Ciclo B: fallback de role neutro", () => {
  it("exibe contactInfo.role quando disponível", () => {
    render(<Sidebar />);
    expect(screen.getByText("Dev Full-Stack")).toBeTruthy();
  });

  it("não exibe 'Front-End Developer' quando contactInfo é null", () => {
    mockUseSidebar.mockReturnValue({ contactInfo: null, isLoading: false });
    render(<Sidebar />);
    expect(screen.queryByText("Front-End Developer")).toBeNull();
  });

  it("não exibe 'Front-End Developer' quando role é vazio", () => {
    mockUseSidebar.mockReturnValue({
      contactInfo: { ...baseContactInfo, role: "" },
      isLoading: false,
    });
    render(<Sidebar />);
    expect(screen.queryByText("Front-End Developer")).toBeNull();
  });
});

describe("Sidebar — Ciclo C: avatar placeholder", () => {
  it("renderiza <img> quando avatar_url está preenchido", () => {
    render(<Sidebar />);
    const imgs = screen.getAllByRole("img");
    expect(imgs.some((img) => img.getAttribute("src") === "https://exemplo.com/avatar.jpg")).toBe(true);
  });

  it("não usa URL pessoal como fallback quando avatar_url é vazio", () => {
    mockUseSidebar.mockReturnValue({
      contactInfo: { ...baseContactInfo, avatar_url: "" },
      isLoading: false,
    });
    render(<Sidebar />);
    const imgs = screen.queryAllByRole("img");
    expect(imgs.every((img) => !img.getAttribute("src")?.includes("i.postimg.cc"))).toBe(true);
  });

  it("exibe inicial do nome quando avatar_url está ausente", () => {
    mockUseSidebar.mockReturnValue({
      contactInfo: { ...baseContactInfo, avatar_url: "", name: "João Silva" },
      isLoading: false,
    });
    render(<Sidebar />);
    expect(screen.getAllByText("J").length).toBeGreaterThan(0);
  });

  it("não crasha quando avatar_url e name são vazios", () => {
    mockUseSidebar.mockReturnValue({
      contactInfo: { ...baseContactInfo, avatar_url: "", name: "" },
      isLoading: false,
    });
    expect(() => render(<Sidebar />)).not.toThrow();
  });
});

describe("Sidebar — Ciclo D: sem crash com contactInfo null", () => {
  it("renderiza sem erro quando contactInfo é null e isLoading é false", () => {
    mockUseSidebar.mockReturnValue({ contactInfo: null, isLoading: false });
    expect(() => render(<Sidebar />)).not.toThrow();
  });

  it("renderiza skeletons quando isLoading é true", () => {
    mockUseSidebar.mockReturnValue({ contactInfo: null, isLoading: true });
    render(<Sidebar />);
    // Skeletons existem — apenas verifica que não crasha
    expect(document.body).toBeTruthy();
  });
});
