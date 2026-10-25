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

const GUIDE = ["templates", "templates/cores", "templates/criando-um-layout", "atualizacao"];
const LAYOUT_SLUGS = LAYOUTS.map((l) => `templates/${l.id}`);

/** Docs na ordem da navegação: o guia primeiro, depois os layouts na ordem do CLI. */
export const DOC_GROUPS: { key: "guide" | "layouts"; docs: Doc[] }[] = [
  {
    key: "guide",
    docs: [...GUIDE, ...ALL.map((d) => d.slug).filter((s) => !GUIDE.includes(s) && !LAYOUT_SLUGS.includes(s))]
      .map((s) => bySlug.get(s))
      .filter((d): d is Doc => Boolean(d)),
  },
  { key: "layouts", docs: LAYOUT_SLUGS.map((s) => bySlug.get(s)).filter((d): d is Doc => Boolean(d)) },
];

export const DOCS: Doc[] = DOC_GROUPS.flatMap((g) => g.docs);

export function imageUrl(repoPath: string): string | undefined {
  return images.get(repoPath);
}
