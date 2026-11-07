import { describe, it, expect, beforeEach, vi } from "vitest";
import { render } from "@testing-library/react";

// Página pré-renderizada: o ThemeProvider começa igual ao build e só depois aplica o que
// está no navegador (escolha salva, tema do sistema).
const hydration = vi.hoisted(() => ({ value: false }));
vi.mock("@/ssr/hydration", () => ({ isHydratingPrerender: () => hydration.value }));

import { ThemeProvider, useTheme, COLOR_MODE_STORAGE_KEY } from "@/contexts/ThemeContext";

const html = document.documentElement;

function Recorder({ renders }: { renders: string[] }) {
  const { theme } = useTheme();
  renders.push(theme);
  return null;
}

beforeEach(() => {
  localStorage.clear();
  html.classList.remove("dark");
  window.history.replaceState(null, "", "/");
});

describe("ThemeContext — hidratação de página pré-renderizada", () => {
  it("primeira renderização igual ao build; depois aplica a escolha salva", () => {
    hydration.value = true;
    localStorage.setItem(COLOR_MODE_STORAGE_KEY, "light");
    const renders: string[] = [];
    render(
      <ThemeProvider defaultTheme="dark" switchable>
        <Recorder renders={renders} />
      </ThemeProvider>,
    );
    expect(renders[0]).toBe("dark");
    expect(renders.at(-1)).toBe("light");
    // A classe posta pelo color-mode.js (claro) não é trocada pelo valor do build.
    expect(html.classList.contains("dark")).toBe(false);
  });

  it("fora da hidratação, já começa com a escolha salva", () => {
    hydration.value = false;
    localStorage.setItem(COLOR_MODE_STORAGE_KEY, "light");
    const renders: string[] = [];
    render(
      <ThemeProvider defaultTheme="dark" switchable>
        <Recorder renders={renders} />
      </ThemeProvider>,
    );
    expect(renders[0]).toBe("light");
  });
});
