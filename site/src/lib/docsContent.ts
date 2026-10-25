/**
 * Conteúdo dos docs publicados, lido do repositório no build (import.meta.glob).
 * As imagens de docs/templates/img entram no build como arquivos do site.
 */
import { LAYOUTS } from "../../../cli/src/layouts";
import type { Lang } from "../i18n/routes";
import { docSlug, isPublishedDoc, splitTitle } from "./docs";

const RAW = import.meta.glob("../../../docs/**/*.md", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
const IMAGES = import.meta.glob("../../../docs/templates/img/**/*.{jpg,jpeg,png,svg,webp,gif}", {
  query: "?url",
  import: "default",
  eager: true,
}) as Record<string, string>;

const toRepoPath = (key: string) => key.replace(/^(\.\.\/)+/, "");
const files = new Map(Object.entries(RAW).map(([k, v]) => [toRepoPath(k), v]));
const images = new Map(Object.entries(IMAGES).map(([k, v]) => [toRepoPath(k), v]));

export interface Doc {
  slug: string;
  /** Arquivo de cada idioma, relativo à raiz do repositório. */
  file: Record<Lang, string>;
  title: Record<Lang, string>;
  body: Record<Lang, string>;
}

function load(repoPath: string): Doc {
  const enPath = repoPath.replace(/\.md$/, ".en.md");
  const pt = splitTitle(files.get(repoPath) ?? "");
  // Sem tradução, a página em inglês mostra o original (o teste de docs avisa antes).
  const en = files.has(enPath) ? splitTitle(files.get(enPath)!) : pt;
  return {
    slug: docSlug(repoPath),
    file: { pt: repoPath, en: files.has(enPath) ? enPath : repoPath },
    title: { pt: pt.title, en: en.title },
    body: { pt: pt.body, en: en.body },
  };
}

const ALL = [...files.keys()].filter(isPublishedDoc).sort().map(load);
const bySlug = new Map(ALL.map((d) => [d.slug, d]));

const START = ["guia/comecando", "guia/cli", "guia/publicar", "atualizacao"];
const LOOK = ["templates", "templates/cores", "templates/criando-um-layout"];
const LAYOUT_SLUGS = LAYOUTS.map((l) => `templates/${l.id}`);
const listed = new Set([...START, ...LOOK, ...LAYOUT_SLUGS]);
const pick = (slugs: string[]) => slugs.map((s) => bySlug.get(s)).filter((d): d is Doc => Boolean(d));

/** Docs na ordem da navegação; doc novo fora das listas entra no fim de "Começar". */
export const DOC_GROUPS: { key: "start" | "look" | "layouts"; docs: Doc[] }[] = [
  { key: "start", docs: pick([...START, ...ALL.map((d) => d.slug).filter((s) => !listed.has(s))]) },
  { key: "look", docs: pick(LOOK) },
  { key: "layouts", docs: pick(LAYOUT_SLUGS) },
];

/** Primeira página da documentação. */
export const FIRST_DOC = "guia/comecando";

export const DOCS: Doc[] = DOC_GROUPS.flatMap((g) => g.docs);

export function imageUrl(repoPath: string): string | undefined {
  return images.get(repoPath);
}
