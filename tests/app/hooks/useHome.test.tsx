import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
}));

vi.mock("@/i18n/context/I18nContext", () => ({
  useI18n: () => ({ locale: "pt-BR" }),
}));

import { useQuery } from "@tanstack/react-query";
import { useHome } from "@/hooks/useHome";
import type { HomeRepository } from "@/repositories/interfaces/HomeRepository";

const mockUseQuery = vi.mocked(useQuery);

const mockRepository: HomeRepository = {
  getContactInfo: vi.fn(),
  getAboutData: vi.fn(),
  getServices: vi.fn(),
  getTestimonials: vi.fn(),
  getAvailability: vi.fn(),
  getContactWizardEnabled: vi.fn(),
};

beforeEach(() => {
  mockUseQuery.mockReturnValue({ data: undefined, isLoading: true } as any);
});

describe("useHome", () => {
  it("retorna contactName vazio enquanto carrega", () => {
    const { result } = renderHook(() => useHome(mockRepository));
    expect(result.current.contactName).toBe("");
  });

  it("retorna contactName do contactInfo quando dados disponíveis", () => {
    mockUseQuery.mockImplementation(({ queryKey }: any) => {
      if (queryKey[1] === "contact") {
        return {
          data: {
            name: "Ana Lima",
            role: "dev",
            role_translations: {},
          },
          isLoading: false,
        } as any;
      }
      return { data: undefined, isLoading: false } as any;
    });

    const { result } = renderHook(() => useHome(mockRepository));
    expect(result.current.contactName).toBe("Ana Lima");
  });
});
