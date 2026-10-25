/**
 * Documentação publicada no site: os .md de docs/ que interessam a quem usa o Rubrica
 * viram páginas em /docs (e /en/docs, a partir do <nome>.en.md ao lado).
 * Os outros docs (manutenção do CLI, notas internas) continuam só no GitHub.
 */
import type { Lang } from "../i18n/routes";
import { route } from "../i18n/routes";

/** Caminhos relativos à raiz do repositório, sempre com "/". */
export function isPublishedDoc(repoPath: string): boolean {
  if (repoPath.endsWith(".en.md")) return false;
  return repoPath === "docs/atualizacao.md" || /^docs\/templates\/[^/]+\.md$/.test(repoPath);
}

/** docs/templates/cores.md → templates/cores; o README de uma pasta vira a pasta. */
export function docSlug(repoPath: string): string {
  return repoPath.replace(/^docs\//, "").replace(/(\/)?README\.md$/, "").replace(/\.md$/, "");
}

export function docUrl(slug: string, lang: Lang): string {
  return `${lang === "en" ? "/en" : ""}/docs/${slug}`;
}

/** Tira o título "# ..." do começo: ele vira o título da página. */
export function splitTitle(md: string): { title: string; body: string } {
  const m = md.match(/^#\s+(.+)\n/);
  if (!m) return { title: "", body: md.trim() };
  return { title: m[1].trim(), body: md.slice(m[0].length).trim() };
}

export interface RewriteContext {
  /** Arquivo de onde o Markdown veio, relativo à raiz (ex.: docs/templates/zine.md). */
  from: string;
  lang: Lang;
  repo: string;
  /** URL final de uma imagem do repositório, ou undefined se o build não a empacotou. */
  asset: (repoPath: string) => string | undefined;
}

/** Resolve um caminho relativo a partir da pasta do arquivo de origem. */
function resolveFrom(from: string, ref: string): string {
  const parts = from.split("/").slice(0, -1);
  for (const seg of ref.split("/")) {
    if (seg === "." || seg === "") continue;
    if (seg === "..") parts.pop();
    else parts.push(seg);
  }
  return parts.join("/");
}

const isExternal = (ref: string) => /^([a-z][a-z0-9+.-]*:|#|\/)/i.test(ref);

function linkTarget(ref: string, ctx: RewriteContext): string {
  if (isExternal(ref)) return ref;
  const [file, hash] = ref.split("#");
  const repoPath = resolveFrom(ctx.from, file);
  const anchor = hash ? `#${hash}` : "";
  if (repoPath === "CHANGELOG.md") return route("changelog", ctx.lang) + anchor;
  if (isPublishedDoc(repoPath)) return docUrl(docSlug(repoPath), ctx.lang) + anchor;
  return `${ctx.repo}/blob/main/${repoPath}${anchor}`;
}

function imageTarget(ref: string, ctx: RewriteContext): string {
  if (isExternal(ref)) return ref;
  const repoPath = resolveFrom(ctx.from, ref);
  return ctx.asset(repoPath) ?? `${ctx.repo}/raw/main/${repoPath}`;
}

function rewriteText(text: string, ctx: RewriteContext): string {
  return text
    .replace(/(!?)\[([^\]]*)\]\(([^)\s]+)\)/g, (_, bang: string, label: string, ref: string) =>
      bang ? `![${label}](${imageTarget(ref, ctx)})` : `[${label}](${linkTarget(ref, ctx)})`,
    )
    .replace(/(<img\b[^>]*\ssrc=")([^"]+)(")/g, (_, a: string, ref: string, b: string) => a + imageTarget(ref, ctx) + b);
}

/**
 * Ajusta links e imagens de um Markdown do repositório para o site: docs publicados viram
 * páginas no idioma da página, o resto aponta para o GitHub. Código fica intacto.
 */
export function rewriteDoc(md: string, ctx: RewriteContext): string {
  return md
    .split(/(```[\s\S]*?```|`[^`\n]*`)/g)
    .map((chunk, i) => (i % 2 === 1 ? chunk : rewriteText(chunk, ctx)))
    .join("");
}
