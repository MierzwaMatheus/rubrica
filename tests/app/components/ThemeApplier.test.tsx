import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
}));

vi.mock("@/repositories/instances", () => ({
  siteConfigRepository: { getPublic: vi.fn() },
}));

import { useQuery } from "@tanstack/react-query";
import { ThemeApplier } from "@/components/ThemeApplier";

const mockUseQuery = vi.mocked(useQuery);
const rootVar = (name: string) => document.documentElement.style.getPropertyValue(name);

beforeEach(() => {
  document.documentElement.removeAttribute("style");
  // jsdom não implementa CSS.supports
  vi.stubGlobal("CSS", { supports: (_p: string, v: string) => /^#[0-9a-f]{3,8}$/i.test(v) || v.startsWith("hsl(") });
});

describe("ThemeApplier", () => {
  it("aplica as 4 cores salvas no admin nas variáveis do contrato", () => {
    mockUseQuery.mockReturnValue({
      data: [
        { key: "theme_background", value: "#0a1224" },
        { key: "theme_foreground", value: "#e8e6e0" },
        { key: "theme_primary", value: "#06b6d4" },
        { key: "theme_accent", value: "#facc15" },
      ],
    } as any);

    render(<ThemeApplier />);

    expect(rootVar("--bg")).toBe("#0a1224");
    expect(rootVar("--text")).toBe("#e8e6e0");
    expect(rootVar("--primary")).toBe("#06b6d4");
    expect(rootVar("--accent")).toBe("#facc15");
  });

  it("não sobrescreve nada enquanto a configuração carrega", () => {
    mockUseQuery.mockReturnValue({ data: undefined } as any);

    render(<ThemeApplier />);

    expect(document.documentElement.getAttribute("style")).toBeNull();
  });

  it("só aplica as cores que foram salvas, mantendo o tema padrão nas demais", () => {
    mockUseQuery.mockReturnValue({ data: [{ key: "theme_primary", value: "#f97316" }] } as any);

    render(<ThemeApplier />);

    expect(rootVar("--primary")).toBe("#f97316");
    expect(rootVar("--bg")).toBe("");
    expect(rootVar("--accent")).toBe("");
  });

  it("ignora valores que não são cores válidas", () => {
    mockUseQuery.mockReturnValue({
      data: [
        { key: "theme_primary", value: "não é cor; color: red" },
        { key: "theme_accent", value: 42 },
      ],
    } as any);

    render(<ThemeApplier />);

    expect(rootVar("--primary")).toBe("");
    expect(rootVar("--accent")).toBe("");
  });
});
