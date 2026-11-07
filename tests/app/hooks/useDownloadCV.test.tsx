import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const repos = vi.hoisted(() => ({
  resume: vi.fn(async () => [
    { id: 1, type: "experience", order_index: 0, content: { title: "Dev" }, content_translations: { "en-US": { title: "Developer" } } },
  ]),
  projects: vi.fn(async () => [{ id: 1, title: "Projeto", title_translations: { "en-US": "Project" }, tags: [], images: [] }]),
  about: vi.fn(async () => ({ value: { "pt-BR": "Sobre", "en-US": "About" } })),
}));
const generateCV = vi.hoisted(() => vi.fn());

vi.mock("@/i18n/context/I18nContext", () => ({ useI18n: () => ({ locale: "en-US" }) }));
vi.mock("@/hooks/useSidebar", () => ({ useSidebar: () => ({ contactInfo: { name: "Ana" } }) }));
vi.mock("@/utils/cvPDF", () => ({ generateCV }));
vi.mock("@/repositories/instances", () => ({
  sidebarRepository: {},
  resumeRepository: { list: repos.resume },
  portfolioRepository: { list: repos.projects },
  homeRepository: { getAboutData: repos.about },
}));

import { useDownloadCV } from "@/hooks/useDownloadCV";

function setup() {
  const client = new QueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  return { client, ...renderHook(() => useDownloadCV(), { wrapper }) };
}

const fakeTab = { close: vi.fn() } as unknown as Window;
const openSpy = vi.fn(() => fakeTab);

describe("useDownloadCV — dados só no clique", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("open", openSpy);
  });

  it("não busca currículo, projetos nem 'sobre' ao renderizar (não vão no HTML de toda página)", () => {
    const { result, client } = setup();
    expect(result.current.canDownload).toBe(true);
    expect(repos.resume).not.toHaveBeenCalled();
    expect(repos.projects).not.toHaveBeenCalled();
    expect(repos.about).not.toHaveBeenCalled();
    expect(client.getQueryCache().getAll()).toHaveLength(0);
  });

  it("no clique, busca tudo e gera o PDF no idioma da página", async () => {
    const { result } = setup();
    await act(() => result.current.downloadCV());
    expect(generateCV).toHaveBeenCalledTimes(1);
    const [contact, items, projects, locale, summary] = generateCV.mock.calls[0];
    expect(contact).toEqual({ name: "Ana" });
    expect(items[0].translatedContent).toMatchObject({ title: "Developer" });
    expect(projects[0].title).toBe("Project");
    expect(locale).toBe("en-US");
    expect(summary).toBe("About");
  });

  it("abre a aba no clique, antes dos dados chegarem (senão o navegador bloqueia o pop-up)", async () => {
    let resolveResume: (v: unknown[]) => void = () => {};
    repos.resume.mockImplementationOnce(() => new Promise((r) => (resolveResume = r)));
    const { result } = setup();
    let pending: Promise<void> = Promise.resolve();
    act(() => {
      pending = result.current.downloadCV();
    });
    expect(openSpy).toHaveBeenCalledWith("", "_blank");
    expect(generateCV).not.toHaveBeenCalled();
    resolveResume([]);
    await act(() => pending);
    expect(generateCV.mock.calls[0][6]).toBe(fakeTab);
  });

  it("se a busca falhar, fecha a aba aberta", async () => {
    repos.projects.mockRejectedValueOnce(new Error("offline"));
    const { result } = setup();
    await act(async () => {
      await expect(result.current.downloadCV()).rejects.toThrow("offline");
    });
    expect(fakeTab.close).toHaveBeenCalled();
    expect(generateCV).not.toHaveBeenCalled();
  });

  it("reaproveita o cache: o segundo clique não busca de novo", async () => {
    const { result } = setup();
    await act(() => result.current.downloadCV());
    await act(() => result.current.downloadCV());
    expect(repos.resume).toHaveBeenCalledTimes(1);
    expect(generateCV).toHaveBeenCalledTimes(2);
  });
});
