/**
 * De onde o build tira o conteúdo. Em produção, o Convex (`convexSource`, no
 * backend). Nos testes de tema e nos sites de demonstração, arquivos JSON
 * (`fixtureSource`), para o build rodar sem banco.
 */
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { CollectionName, PageRecord, RawCollections, SiteSettings, UiTexts } from "../content/types";

export interface SiteSnapshot {
  site: SiteSettings;
  pages: PageRecord[];
  collections: { [C in CollectionName]: RawCollections[C][] };
  texts: UiTexts;
}

export interface DataSource {
  /** Tudo o que o site público precisa, só publicado, numa leitura. */
  load(): Promise<SiteSnapshot>;
}

export function emptyCollections(): SiteSnapshot["collections"] {
  return { posts: [], projects: [], services: [], testimonials: [], faq: [], resume: [], routine: [], plans: [], team: [] };
}

/**
 * Lê `site.json`, `pages.json`, `texts.json` e `collections/<nome>.json` da pasta.
 * Coleção sem arquivo fica vazia.
 */
export function fixtureSource(dir: string): DataSource {
  const read = <T>(file: string, fallback?: T): T => {
    const path = join(dir, file);
    if (!existsSync(path)) {
      if (fallback !== undefined) return fallback;
      throw new Error(`[rubrica] fixture ausente: ${path}`);
    }
    return JSON.parse(readFileSync(path, "utf-8")) as T;
  };
  return {
    async load() {
      const collections = emptyCollections();
      for (const name of Object.keys(collections) as CollectionName[]) {
        (collections as Record<string, unknown[]>)[name] = read(`collections/${name}.json`, []);
      }
      return {
        site: read<SiteSettings>("site.json"),
        pages: read<PageRecord[]>("pages.json", []),
        texts: read<UiTexts>("texts.json", {}),
        collections,
      };
    },
  };
}
