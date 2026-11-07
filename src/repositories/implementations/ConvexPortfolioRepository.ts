import { ConvexHttpClient } from "convex/browser";
import {
  PortfolioRepository,
  Project,
} from "../interfaces/PortfolioRepository";
import { mapProject } from "../mappers/convexMappers";
import { api } from "../../../convex/_generated/api";

const client = new ConvexHttpClient(import.meta.env.VITE_CONVEX_URL as string);

export class ConvexPortfolioRepository implements PortfolioRepository {
  async list(): Promise<Project[]> {
    const data = await client.query(api.projects.list, {});
    return Array.isArray(data) ? data.map(mapProject) : [];
  }

  async getBySlug(slug: string): Promise<Project | null> {
    const data = await client.query(api.projects.getBySlug, { slug });
    return data ? mapProject(data) : null;
  }

  /** No Convex, a lista já vem completa. */
  async getById(id: string): Promise<Project | null> {
    return (await this.list()).find((p) => String(p.id) === id) ?? null;
  }
}
