import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import React from "react";
import { ThemeProvider, useTheme, COLOR_MODE_STORAGE_KEY, type ColorModeSetting } from "@/contexts/ThemeContext";

const html = document.documentElement;

beforeEach(() => {
  localStorage.clear();
  html.classList.remove("dark");
  html.removeAttribute("data-color-mode");
  html.removeAttribute("data-color-toggle");
  html.removeAttribute("data-admin");
  window.history.replaceState(null, "", "/");
});

function wrapper(props: { defaultTheme?: ColorModeSetting; switchable?: boolean } = {}) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <ThemeProvider {...props}>{children}</ThemeProvider>;
  };
}

function mockSystem(dark: boolean) {
  vi.stubGlobal("matchMedia", (q: string) => ({
    matches: dark && q.includes("dark"),
    media: q,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
}

describe("ThemeContext", () => {
  it("uses the defaultTheme when no switchable", () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: wrapper({ defaultTheme: "dark", switchable: false }),
    });
    expect(result.current.theme).toBe("dark");
    expect(result.current.toggleTheme).toBeUndefined();
    expect(html.classList.contains("dark")).toBe(true);
  });

  it("lê o modo e a alternância dos atributos do <html> (gravados pelo CLI)", () => {
    html.setAttribute("data-color-mode", "light");
    html.setAttribute("data-color-toggle", "true");
    const { result } = renderHook(() => useTheme(), { wrapper: wrapper() });
    expect(result.current.theme).toBe("light");
    expect(result.current.switchable).toBe(true);
    expect(html.classList.contains("dark")).toBe(false);
  });

  it("modo system segue o sistema operacional", () => {
    mockSystem(false);
    const { result } = renderHook(() => useTheme(), { wrapper: wrapper({ defaultTheme: "system" }) });
    expect(result.current.theme).toBe("light");
    vi.unstubAllGlobals();
  });

  it("hydrates from localStorage when switchable=true", () => {
    localStorage.setItem(COLOR_MODE_STORAGE_KEY, "dark");
    const { result } = renderHook(() => useTheme(), {
      wrapper: wrapper({ defaultTheme: "light", switchable: true }),
    });
    expect(result.current.theme).toBe("dark");
  });

  it("ignora a escolha salva quando a alternância está desligada", () => {
    localStorage.setItem(COLOR_MODE_STORAGE_KEY, "dark");
    const { result } = renderHook(() => useTheme(), {
      wrapper: wrapper({ defaultTheme: "light", switchable: false }),
    });
    expect(result.current.theme).toBe("light");
  });

  it("toggleTheme toggles between light and dark when switchable", () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: wrapper({ defaultTheme: "light", switchable: true }),
    });
    expect(result.current.theme).toBe("light");
    act(() => result.current.toggleTheme!());
    expect(result.current.theme).toBe("dark");
    expect(html.classList.contains("dark")).toBe(true);

    act(() => result.current.toggleTheme!());
    expect(result.current.theme).toBe("light");
    expect(html.classList.contains("dark")).toBe(false);
  });

  it("persists toggled theme in localStorage when switchable", () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: wrapper({ defaultTheme: "light", switchable: true }),
    });
    act(() => result.current.toggleTheme!());
    expect(localStorage.getItem(COLOR_MODE_STORAGE_KEY)).toBe("dark");
  });

  it("o painel admin fica sempre no modo escuro e sem textura", () => {
    window.history.replaceState(null, "", "/admin/dashboard");
    renderHook(() => useTheme(), { wrapper: wrapper({ defaultTheme: "light" }) });
    expect(html.classList.contains("dark")).toBe(true);
    expect(html.hasAttribute("data-admin")).toBe(true);
  });

  it("toggleTheme is undefined when switchable=false (no-op)", () => {
    const { result } = renderHook(() => useTheme(), {
      wrapper: wrapper({ defaultTheme: "light", switchable: false }),
    });
    expect(result.current.toggleTheme).toBeUndefined();
  });

  it("throws when useTheme is called outside provider", () => {
    expect(() => renderHook(() => useTheme())).toThrow(/must be used within ThemeProvider/);
  });
});
