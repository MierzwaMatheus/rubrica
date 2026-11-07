import { describe, it, expect, vi, afterEach } from "vitest";
import { StaticPortfolioRepository } from "@/repositories/implementations/StaticPortfolioRepository";
import { applyLocale } from "@/hooks/usePortfolio";

const index = [
  { _id: "p1", title: "Projeto", slug: "projeto", caseStudy: { metrics: [] }, longDescriptionChars: { ptBR: 300, enUS: 280 } },
  { _id: "p2", title: "Sem arquivo", slug: "sem-arquivo" },
];
const detail = { _id: "p1", title: "Projeto", slug: "projeto", longDescription: "texto longo", caseStudy: { problem: "problema", metrics: [] } };

function stubFetch(files: Record<string, unknown>) {
  const calls: string[] = [];
  vi.stubGlobal("fetch", vi.fn(async (url: string) => {
    calls.push(url);
    return url in files ? new Response(JSON.stringify(files[url])) : new Response("", { status: 404 });
  }));
  return calls;
}

describe("StaticPortfolioRepository", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("getBySlug devolve o projeto completo do arquivo próprio", async () => {
    stubFetch({ "/data/portfolio.json": index, "/data/projects/p1.json": detail });
    const project = await new StaticPortfolioRepository().getBySlug("projeto");
    expect(project?.long_description).toBe("texto longo");
    expect(project?.case_study?.problem).toBe("problema");
  });

  it("sem o arquivo (dados antigos), cai no item do índice", async () => {
    stubFetch({ "/data/portfolio.json": index });
    const project = await new StaticPortfolioRepository().getBySlug("sem-arquivo");
    expect(project?.title).toBe("Sem arquivo");
  });

  it("slug que não existe devolve null sem buscar arquivo", async () => {
    const calls = stubFetch({ "/data/portfolio.json": index });
    expect(await new StaticPortfolioRepository().getBySlug("nada")).toBeNull();
    expect(calls.some((c) => c.includes("/projects/"))).toBe(false);
  });

  it("o tamanho da descrição longa vem do índice quando o texto não está lá", async () => {
    stubFetch({ "/data/portfolio.json": index });
    const [p1] = await new StaticPortfolioRepository().list();
    expect(applyLocale(p1, "en-US").long_description_length).toBe(280);
    expect(applyLocale(p1, "pt-BR").long_description_length).toBe(300);
  });
});
