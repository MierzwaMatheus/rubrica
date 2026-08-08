import { SiteConfigRepository } from "../interfaces/SiteConfigRepository";

export class StaticSiteConfigRepository implements SiteConfigRepository {
  async getPublic(): Promise<Array<{ key: string; value: unknown }> | null> {
    try {
      const response = await fetch("/data/site-config.json");
      if (!response.ok) return null;
      return await response.json();
    } catch {
      return null;
    }
  }
}
