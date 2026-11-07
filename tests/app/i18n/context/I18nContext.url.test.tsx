import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Router } from "wouter";
import { memoryLocation } from "wouter/memory-location";

vi.mock("convex/react", () => ({ useQuery: () => undefined }));
vi.mock("../../../convex/_generated/api", () => ({
  api: { siteTexts: { getAll: "siteTexts:getAll" } },
}));

import { I18nProvider, useI18n } from "@/i18n/context/I18nContext";

function Probe() {
  const { locale, setLocale } = useI18n();
  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <button onClick={() => setLocale(locale === "en-US" ? "pt-BR" : "en-US")}>trocar</button>
    </div>
  );
}

function renderAt(path: string) {
  const location = memoryLocation({ path, record: true });
  render(
    <Router hook={location.hook}>
      <I18nProvider>
        <Probe />
      </I18nProvider>
    </Router>,
  );
  return location;
}

describe("I18nProvider — idioma pela URL", () => {
  beforeEach(() => localStorage.clear());

  it("pt-BR na raiz, mesmo com navegador em inglês", () => {
    renderAt("/blog/x");
    expect(screen.getByTestId("locale").textContent).toBe("pt-BR");
  });

  it("en-US sob /en", () => {
    renderAt("/en/blog/x");
    expect(screen.getByTestId("locale").textContent).toBe("en-US");
  });

  it("ignora o idioma salvo: a URL decide", () => {
    localStorage.setItem("locale", "en-US");
    renderAt("/sobre");
    expect(screen.getByTestId("locale").textContent).toBe("pt-BR");
  });

  it("trocar o idioma navega para a mesma página no outro idioma e grava a escolha", () => {
    const location = renderAt("/blog/x");
    fireEvent.click(screen.getByText("trocar"));
    expect(location.history?.at(-1)).toBe("/en/blog/x");
    expect(screen.getByTestId("locale").textContent).toBe("en-US");
    expect(localStorage.getItem("locale")).toBe("en-US");
  });

  it("voltar do inglês para pt-BR tira o prefixo (home em inglês → /)", () => {
    const location = renderAt("/en");
    fireEvent.click(screen.getByText("trocar"));
    expect(location.history?.at(-1)).toBe("/");
    expect(screen.getByTestId("locale").textContent).toBe("pt-BR");
  });
});
