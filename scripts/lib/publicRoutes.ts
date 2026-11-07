/**
 * Rotas públicas do site, montadas a partir dos JSON de public/data (ou dist/data).
 * Fonte única para o sitemap e para a pré-renderização.
 */
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { PLUGIN_REGISTRY, type PluginId } from "../../convex/pluginRegistry";
import { isValidSlug } from "../../convex/lib/slug";

export interface PublicRoute {
  /** Caminho em pt-BR (sem prefixo de idioma). */
  path: string;
  changefreq: string;
  priority: string;
  /** Data da última mudança (AAAA-MM-DD), quando o conteúdo informa. */
  lastmod?: string;
}

function readJson<T>(dataDir: string, file: string, fallback: T): T {
  const path = join(dataDir, file);
  if (!existsSync(path)) return fallback;
  try {
    return JSON.parse(readFileSync(path, "utf-8")) as T;
  } catch {
    return fallback;
  }
}

function toDay(value: unknown): string | undefined {
  if (typeof value !== "number" && typeof value !== "string") return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString().split("T")[0];
}

export function pluginEnabled(dataDir: string): (id: PluginId) => boolean {
  const raw = readJson<Record<string, boolean> | null>(dataDir, "plugins.json", null) ?? {};
  return (id) => raw[id] ?? PLUGIN_REGISTRY.find((p) => p.id === id)?.defaultEnabled ?? true;
}

export function listPublicRoutes(dataDir: string): PublicRoute[] {
  const enabled = pluginEnabled(dataDir);
  const routes: PublicRoute[] = [{ path: "/", changefreq: "daily", priority: "1.0" }];

  if (enabled("about")) routes.push({ path: "/sobre", changefreq: "weekly", priority: "0.9" });
  if (enabled("resume")) routes.push({ path: "/curriculo", changefreq: "weekly", priority: "0.9" });
  if (enabled("testimonials")) routes.push({ path: "/depoimentos", changefreq: "monthly", priority: "0.5" });

  if (enabled("portfolio")) {
    routes.push({ path: "/portfolio", changefreq: "weekly", priority: "0.9" });
    const projects = readJson<Array<{ slug?: string; updatedAt?: number }>>(dataDir, "portfolio.json", []);
    for (const project of projects) {
      if (!project.slug) continue;
      if (!isValidSlug(project.slug)) {
        console.warn(`[rotas] case ignorado, slug inválido: ${project.slug}`);
        continue;
      }
      routes.push({
        path: `/portfolio/${project.slug}`,
        changefreq: "monthly",
        priority: "0.6",
        lastmod: toDay(project.updatedAt),
      });
    }
  }

  if (enabled("blog")) {
    routes.push({ path: "/blog", changefreq: "daily", priority: "0.8" });
    const posts = readJson<Array<{ slug: string; status?: string; updatedAt?: number; publishedAt?: number }>>(
      dataDir,
      "blog.json",
      [],
    );
    for (const post of posts) {
      if (post.status && post.status !== "published") continue;
      if (!isValidSlug(post.slug)) {
        console.warn(`[rotas] post ignorado, slug inválido: ${post.slug}`);
        continue;
      }
      routes.push({
        path: `/blog/${post.slug}`,
        changefreq: "monthly",
        priority: "0.7",
        lastmod: toDay(post.updatedAt ?? post.publishedAt),
      });
    }
  }

  return routes;
}
