import {
  PortfolioRepository,
  Project,
} from "../interfaces/PortfolioRepository";
import { mapProject } from "../mappers/convexMappers";

export class StaticPortfolioRepository implements PortfolioRepository {
  async list(): Promise<Project[]> {
    try {
      const response = await fetch("/data/portfolio.json");
      if (!response.ok) return [];
      const raw = await response.json();
      return Array.isArray(raw) ? raw.map(mapProject) : [];
    } catch (error) {
      console.error("Error loading static portfolio data:", error);
      return [];
    }
  }

  async getBySlug(slug: string): Promise<Project | null> {
    const fromIndex = (await this.list()).find((p) => p.slug === slug);
    if (!fromIndex) return null;
    return (await this.getById(String(fromIndex.id))) ?? fromIndex;
  }

  /**
   * Projeto completo, do arquivo próprio gerado no build (o índice não leva os textos do case
   * nem a descrição longa). Dados antigos, sem o arquivo: cai no item do índice.
   */
  async getById(id: string): Promise<Project | null> {
    try {
      const response = await fetch(`/data/projects/${encodeURIComponent(id)}.json`);
      if (response.ok) return mapProject(await response.json());
    } catch {
      // segue para o índice
    }
    return (await this.list()).find((p) => String(p.id) === id) ?? null;
  }
}
