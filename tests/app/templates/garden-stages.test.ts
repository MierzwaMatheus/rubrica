import { describe, it, expect, vi } from "vitest";

// As funções testadas são puras; os repositórios só existem para os hooks do arquivo.
vi.mock("@/repositories/instances", () => ({ portfolioRepository: {}, blogRepository: {}, resumeRepository: {} }));
import {
  RECENT_DAYS,
  buildGardenMap,
  experienceStage,
  linkTerms,
  postStage,
  projectStage,
  readingMinutes,
} from "../../../templates/layouts/garden/GardenShared";
import type { Project } from "@/repositories/interfaces/PortfolioRepository";

// Jardim Digital: os estágios (semente, broto, árvore) saem só dos dados existentes.

const project = (over: Partial<Project> = {}): Project => ({
  id: 1,
  title: "Projeto",
  description: "",
  long_description: "",
  tags: [],
  images: [],
  demo_link: "",
  github_link: "",
  ...over,
});

const NOW = new Date("2026-10-24T12:00:00Z").getTime();
const daysAgo = (n: number) => new Date(NOW - n * 24 * 60 * 60 * 1000).toISOString();

describe("garden — estágio dos projetos", () => {
  it("projeto com estudo de caso é árvore", () => {
    const p = project({ slug: "x", case_study: { problem: "", solution: "", results: "", metrics: [] } });
    expect(projectStage(p)).toBe("tree");
  });
  it("projeto sem case (ou sem slug) é broto", () => {
    expect(projectStage(project())).toBe("sprout");
    expect(projectStage(project({ case_study: { problem: "", solution: "", results: "", metrics: [] } }))).toBe("sprout");
  });
});

describe("garden — estágio dos posts", () => {
  it("post em destaque é árvore, mesmo recente", () => {
    expect(postStage({ featured: true, published_at: daysAgo(1) }, NOW)).toBe("tree");
  });
  it(`post dos últimos ${RECENT_DAYS} dias é semente`, () => {
    expect(postStage({ featured: false, published_at: daysAgo(0) }, NOW)).toBe("seed");
    expect(postStage({ featured: false, published_at: daysAgo(RECENT_DAYS) }, NOW)).toBe("seed");
  });
  it("post mais antigo, sem data ou com data inválida é broto", () => {
    expect(postStage({ featured: false, published_at: daysAgo(RECENT_DAYS + 1) }, NOW)).toBe("sprout");
    expect(postStage({ featured: false }, NOW)).toBe("sprout");
    expect(postStage({ featured: false, published_at: "não é data" }, NOW)).toBe("sprout");
  });
  it("post com data no futuro não vira semente", () => {
    expect(postStage({ featured: false, published_at: daysAgo(-3) }, NOW)).toBe("sprout");
  });
});

describe("garden — estágio das experiências", () => {
  it("a experiência atual é broto (ainda crescendo)", () => {
    expect(experienceStage("2024 - atual")).toBe("sprout");
    expect(experienceStage("2022 – presente")).toBe("sprout");
    expect(experienceStage("Jan 2023 - Present")).toBe("sprout");
  });
  it("as encerradas (ou sem período) são árvore", () => {
    expect(experienceStage("2021 - 2024")).toBe("tree");
    expect(experienceStage(undefined)).toBe("tree");
  });
});

describe("garden — utilidades", () => {
  it("tempo de leitura ignora as tags e tem no mínimo 1 minuto", () => {
    expect(readingMinutes("<p>oi</p>")).toBe(1);
    expect(readingMinutes(`<p>${"palavra ".repeat(401)}</p>`)).toBe(3);
  });

  it("liga só a primeira ocorrência de cada termo, como palavra inteira", () => {
    const segs = linkTerms("React e Reactive; react de novo", [{ term: "React", href: "/curriculo" }]);
    expect(segs.filter((s) => s.href)).toEqual([{ text: "React", href: "/curriculo" }]);
    expect(segs.map((s) => s.text).join("")).toBe("React e Reactive; react de novo");
  });

  it("o mapa liga o início às páginas e o portfólio aos projetos, destacando a página atual", () => {
    const pages = [
      { key: "home", href: "/", label: "Início" },
      { key: "portfolio", href: "/portfolio", label: "Portfólio" },
      { key: "blog", href: "/blog", label: "Blog" },
    ];
    const withCase = project({ id: 2, slug: "a", case_study: { problem: "", solution: "", results: "", metrics: [] } });
    const { nodes, edges } = buildGardenMap(pages, [withCase, project({ id: 3 })], "/portfolio/a");
    expect(nodes).toHaveLength(5);
    expect(nodes.filter((n) => n.current).map((n) => n.id)).toEqual(["project:2"]);
    expect(edges).toContainEqual(["/", "/blog", false]);
    expect(edges).toContainEqual(["/portfolio", "project:3", false]);
    expect(edges).toContainEqual(["/", "project:2", true]);
    for (const n of nodes) {
      expect(n.x).toBeGreaterThan(0);
      expect(n.x).toBeLessThan(200);
      expect(n.y).toBeGreaterThan(0);
      expect(n.y).toBeLessThan(208);
    }
  });
});
