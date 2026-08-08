import { ConvexHttpClient } from "convex/browser";
import { SiteConfigRepository } from "../interfaces/SiteConfigRepository";
import { api } from "../../../convex/_generated/api";

const client = new ConvexHttpClient(import.meta.env.VITE_CONVEX_URL as string);

export class ConvexSiteConfigRepository implements SiteConfigRepository {
  async getPublic(): Promise<Array<{ key: string; value: unknown }> | null> {
    return client.query(api.siteConfig.getPublic);
  }
}
