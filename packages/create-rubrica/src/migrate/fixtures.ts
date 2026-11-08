/**
 * Dados convertidos → fixtures do `@rubrica/core` (site.json, pages.json, texts.json,
 * collections/*.json). Com eles o projeto v2 builda (RUBRICA_FIXTURES) antes de qualquer
 * import, e o `migrar conferir` compara as páginas da v1 e da v2 sem tocar no Convex.
 */
import type { ConvertResult } from "./convert.js";

type Doc = Record<string, any>;

const live = (d: Doc) => d.published === true && d.deletedAt === undefined;
const order = (a: Doc, b: Doc) => (a.order ?? 0) - (b.order ?? 0);

/** Sem a URL da imagem (só o storageId), aponta para o Convex quando o endereço é conhecido. */
function withUrls(value: unknown, storageUrl?: (id: string) => string): unknown {
  if (Array.isArray(value)) return value.map((v) => withUrls(v, storageUrl));
  if (value && typeof value === "object") {
    const obj = value as Doc;
    const out: Doc = Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, withUrls(v, storageUrl)]));
    if (typeof obj.storageId === "string" && "url" in obj && !obj.url && storageUrl) out.url = storageUrl(obj.storageId);
    return out;
  }
  return value;
}

function item(d: Doc): Doc {
  const { _id, _creationTime, published, createdAt, createdBy, updatedBy, deletedAt, deletedBy, authorId, ...rest } = d;
  void _creationTime;
  void published;
  void createdAt;
  void createdBy;
  void updatedBy;
  void deletedAt;
  void deletedBy;
  void authorId;
  return { id: String(_id), ...rest };
}

export function toFixtures(result: ConvertResult, storageUrl?: (id: string) => string): Record<string, string> {
  const t = result.tables;
  const json = (v: unknown) => `${JSON.stringify(withUrls(v, storageUrl), null, 2)}\n`;
  const { updatedAt, ...site } = (t.siteSettings?.[0] ?? {}) as Doc;
  void updatedAt;
  const coll = (name: string) => (t[name] ?? []).filter(live).sort(order).map(item);
  const posts = (t.posts ?? []).filter(live).map((d) => ({ ...item(d), publishedAt: d.publishedAt ?? d.createdAt }));
  return {
    "site.json": json(site),
    "pages.json": json((t.pages ?? []).map((p, i) => ({ id: `pagina-${i + 1}`, path: p.path, system: true, title: p.title, ...(p.seo && { seo: p.seo }), blocks: p.blocks, published: true, updatedAt: p.updatedAt }))),
    "texts.json": json(Object.fromEntries((t.uiTexts ?? []).map((x) => [x.key, x.value]))),
    "collections/posts.json": json(posts),
    "collections/projects.json": json(coll("projects")),
    "collections/services.json": json(coll("services")),
    "collections/testimonials.json": json(coll("testimonials")),
    "collections/faq.json": json(coll("faq")),
    "collections/resume.json": json(coll("resumeItems")),
    "collections/routine.json": json(coll("routine")),
  };
}
