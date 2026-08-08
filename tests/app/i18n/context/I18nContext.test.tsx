import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { ReactNode } from "react";

const { mockUseQuery } = vi.hoisted(() => ({ mockUseQuery: vi.fn() }));

vi.mock("convex/react", () => ({ useQuery: mockUseQuery }));
vi.mock("../../../convex/_generated/api", () => ({
  api: { siteTexts: { getAll: "siteTexts:getAll" } },
}));

import { I18nProvider, useI18n } from "@/i18n/context/I18nContext";

function TestConsumer() {
  const { t, isLoading } = useI18n();
  return (
    <div>
      <span data-testid="loading">{String(isLoading)}</span>
      <span data-testid="value">{t("home.greeting")}</span>
    </div>
  );
}

function wrapper({ children }: { children: ReactNode }) {
  return <I18nProvider>{children}</I18nProvider>;
}

describe("I18nContext com DynamicTranslationsRepository", () => {
  beforeEach(() => {
    mockUseQuery.mockReset();
    localStorage.clear();
  });

  it("usa textos dinâmicos do Convex quando useQuery retorna registros", async () => {
    mockUseQuery.mockReturnValue([
      { key: "home.greeting", ptBR: "Olá dinâmico", enUS: "Dynamic Hello" },
    ]);
    localStorage.setItem("locale", "pt-BR");

    render(<TestConsumer />, { wrapper });

    await waitFor(() => {
      expect(screen.getByTestId("value").textContent).toBe("Olá dinâmico");
    });
  });

  it("usa textos estáticos como fallback quando useQuery retorna undefined", async () => {
    mockUseQuery.mockReturnValue(undefined);
    localStorage.setItem("locale", "pt-BR");

    render(<TestConsumer />, { wrapper });

    // O valor estático para home.greeting deve existir (não vazio)
    await waitFor(() => {
      const value = screen.getByTestId("value").textContent;
      expect(value).toBeTruthy();
      expect(value).not.toBe("");
    });
  });
});
