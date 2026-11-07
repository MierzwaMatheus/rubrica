import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";

const repo = vi.hoisted(() => ({ getById: vi.fn() }));

vi.mock("@/i18n/context/I18nContext", () => ({ useI18n: () => ({ locale: "pt-BR", isLoading: false }) }));
vi.mock("@/i18n/hooks/useTranslation", () => ({ useTranslation: () => ({ t: (k: string) => k }) }));
vi.mock("@/components/SEO", () => ({ SEO: () => null }));
vi.mock("@/repositories/instances", () => ({ portfolioRepository: repo }));
vi.mock("@/hooks/usePortfolio", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/hooks/usePortfolio")>();
  return {
    ...actual,
    usePortfolio: () => ({
      isLoading: false,
      // Item do índice do build: sem a descrição longa.
      projects: [{ id: "p1", title: "Projeto Simples", description: "Descrição curta", long_description: "", tags: [], images: [], demo_link: "", github_link: "" }],
    }),
  };
});

import Portfolio from "@/pages/Portfolio";

function renderPage() {
  const client = new QueryClient();
  return render(
    <HelmetProvider>
      <QueryClientProvider client={client}>
        <Portfolio />
      </QueryClientProvider>
    </HelmetProvider>,
  );
}

describe("Portfólio — modal busca a descrição longa ao abrir", () => {
  beforeEach(() => repo.getById.mockReset());

  it("não busca nada antes de abrir", () => {
    renderPage();
    expect(repo.getById).not.toHaveBeenCalled();
  });

  it("ao abrir, mostra a descrição curta e troca pela longa quando chega", async () => {
    repo.getById.mockResolvedValue({
      id: "p1", title: "Projeto Simples", description: "Descrição curta",
      long_description: "Descrição longa vinda do arquivo do projeto", tags: [], images: [], demo_link: "", github_link: "",
    });
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "portfolio.details" }));
    expect(repo.getById).toHaveBeenCalledWith("p1");
    await waitFor(() => expect(screen.getByText("Descrição longa vinda do arquivo do projeto")).toBeInTheDocument());
  });

  it("se a busca falhar, o modal fica com a descrição curta", async () => {
    repo.getById.mockRejectedValue(new Error("offline"));
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "portfolio.details" }));
    await waitFor(() => expect(repo.getById).toHaveBeenCalled());
    expect(screen.getAllByText("Descrição curta").length).toBeGreaterThan(0);
  });
});
