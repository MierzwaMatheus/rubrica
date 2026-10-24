import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";

vi.mock("@tanstack/react-query", () => ({
  useQuery: vi.fn(),
}));

vi.mock("@/repositories/instances", () => ({
  siteConfigRepository: { getPublic: vi.fn() },
}));

import { useQuery } from "@tanstack/react-query";
import { ThemeApplier, ADMIN_COLORS_STYLE_ID } from "@/components/ThemeApplier";

const mockUseQuery = vi.mocked(useQuery);
const css = () => document.getElementById(ADMIN_COLORS_STYLE_ID)?.textContent ?? "";
/** Corpo do bloco de um modo na folha gerada. */
const block = (mode: "light" | "dark") => {
  const sel = mode === "light" ? "html:root:not(.dark)" : "html:root.dark";
  const start = css().indexOf(sel);
  return start < 0 ? "" : css().slice(start, css().indexOf("}", start));
};

beforeEach(() => {
  document.getElementById(ADMIN_COLORS_STYLE_ID)?.remove();
  document.documentElement.removeAttribute("style");
  // jsdom não implementa CSS.supports
  vi.stubGlobal("CSS", { supports: (_p: string, v: string) => /^#[0-9a-f]{3,8}$/i.test(v) || v.startsWith("hsl(") });
});

describe("ThemeApplier — dados antigos (sem cores por modo)", () => {
  it("as 4 cores salvas valem nos dois modos, como antes", () => {
    mockUseQuery.mockReturnValue({
      data: [
        { key: "theme_background", value: "#0a1224" },
        { key: "theme_foreground", value: "#e8e6e0" },
        { key: "theme_primary", value: "#06b6d4" },
        { key: "theme_accent", value: "#facc15" },
      ],
    } as any);

    render(<ThemeApplier />);

    for (const mode of ["light", "dark"] as const) {
      expect(block(mode)).toContain("--bg: #0a1224;");
      expect(block(mode)).toContain("--text: #e8e6e0;");
      expect(block(mode)).toContain("--primary: #06b6d4;");
      expect(block(mode)).toContain("--accent: #facc15;");
    }
  });

  it("não escreve estilo inline no <html> (que valeria para os dois modos)", () => {
    mockUseQuery.mockReturnValue({ data: [{ key: "theme_primary", value: "#f97316" }] } as any);
    render(<ThemeApplier />);
    expect(document.documentElement.getAttribute("style")).toBeNull();
  });
});

describe("ThemeApplier — cores por modo", () => {
  it("cada modo recebe só as suas cores", () => {
    mockUseQuery.mockReturnValue({
      data: [
        { key: "theme_colors_per_mode", value: true },
        { key: "theme_background", value: "#ffffff" },
        { key: "theme_dark_background", value: "#000000" },
        { key: "theme_dark_primary", value: "#ffd400" },
      ],
    } as any);

    render(<ThemeApplier />);

    expect(block("light")).toContain("--bg: #ffffff;");
    expect(block("light")).not.toContain("--primary:");
    expect(block("dark")).toContain("--bg: #000000;");
    expect(block("dark")).toContain("--primary: #ffd400;");
    expect(block("dark")).not.toContain("#ffffff;\n  --text");
  });

  it("cor vazia significa 'use a do esquema' e não gera bloco", () => {
    mockUseQuery.mockReturnValue({
      data: [
        { key: "theme_colors_per_mode", value: true },
        { key: "theme_background", value: "" },
        { key: "theme_dark_accent", value: "#7fd8ff" },
      ],
    } as any);

    render(<ThemeApplier />);

    expect(block("light")).toBe("");
    expect(block("dark")).toContain("--accent: #7fd8ff;");
  });

  it("sem nenhuma cor salva, remove a folha e o esquema do projeto vale inteiro", () => {
    mockUseQuery.mockReturnValue({ data: [{ key: "theme_colors_per_mode", value: true }] } as any);
    render(<ThemeApplier />);
    expect(document.getElementById(ADMIN_COLORS_STYLE_ID)).toBeNull();
  });
});

describe("ThemeApplier — cores derivadas", () => {
  it("com fundo/texto do admin, recalcula as cores de apoio a partir das 4", () => {
    mockUseQuery.mockReturnValue({
      data: [
        { key: "theme_background", value: "#ffffff" },
        { key: "theme_foreground", value: "#111111" },
      ],
    } as any);
    render(<ThemeApplier />);
    expect(block("light")).toMatch(/--surface: color-mix\(.*var\(--bg\)\)/);
    expect(block("light")).toMatch(/--line: color-mix\(.*var\(--text\)/);
  });

  it("escolhe o texto sobre a primária e o acento pelo contraste", () => {
    mockUseQuery.mockReturnValue({
      data: [
        { key: "theme_primary", value: "#ffd400" },
        { key: "theme_accent", value: "#1d4e89" },
      ],
    } as any);
    render(<ThemeApplier />);
    expect(block("light")).toContain("--on-primary: #111111;");
    expect(block("light")).toContain("--on-accent: #ffffff;");
    expect(block("light")).not.toContain("--surface:");
  });
});

describe("ThemeApplier — validação", () => {
  it("não sobrescreve nada enquanto a configuração carrega", () => {
    mockUseQuery.mockReturnValue({ data: undefined } as any);
    render(<ThemeApplier />);
    expect(document.getElementById(ADMIN_COLORS_STYLE_ID)).toBeNull();
  });

  it("ignora valores que não são cores válidas", () => {
    mockUseQuery.mockReturnValue({
      data: [
        { key: "theme_primary", value: "não é cor; color: red" },
        { key: "theme_accent", value: 42 },
      ],
    } as any);
    render(<ThemeApplier />);
    expect(document.getElementById(ADMIN_COLORS_STYLE_ID)).toBeNull();
  });
});
