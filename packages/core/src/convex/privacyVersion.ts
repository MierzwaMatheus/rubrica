/**
 * Versão da política de privacidade (página `/privacidade`). A versão sobe sempre que
 * o conteúdo da página muda, seja pela geração (`privacy.generatePolicy`), seja pelo
 * editor de páginas: cada envio público confere o hash do conteúdo e, se mudou,
 * registra a versão nova antes de guardar o consentimento.
 */
import { fnv1a, stableJson } from "./lib/crypto";
import type { Doc, MutationCtx, ReaderCtx } from "./server";

export const PRIVACY_PATH = "/privacidade";

export async function privacyPage(ctx: ReaderCtx): Promise<Doc<"pages"> | null> {
  const pages = await ctx.db
    .query("pages")
    .withIndex("by_path", (q) => q.eq("path", PRIVACY_PATH))
    .collect();
  return pages.find((p) => p.deletedAt === undefined) ?? null;
}

export function policyHash(page: Pick<Doc<"pages">, "title" | "blocks" | "published">): string {
  return fnv1a(stableJson({ title: page.title, blocks: page.blocks, published: page.published }));
}

async function latest(ctx: ReaderCtx): Promise<Doc<"privacyPolicyVersions"> | null> {
  return ctx.db.query("privacyPolicyVersions").withIndex("by_version").order("desc").first();
}

/** Versão vigente sem gravar (para o painel): `outdated` = a página mudou desde a última versão registrada. */
export async function readPolicyVersion(ctx: ReaderCtx): Promise<{ version: number; outdated: boolean; page: Doc<"pages"> | null }> {
  const page = await privacyPage(ctx);
  const last = await latest(ctx);
  if (!page) return { version: last?.version ?? 0, outdated: false, page };
  return { version: last?.version ?? 0, outdated: !last || last.hash !== policyHash(page), page };
}

/** Versão vigente, registrando uma nova se a página mudou. 0 = o site não tem política. */
export async function currentPolicyVersion(ctx: MutationCtx): Promise<number> {
  const { version, outdated, page } = await readPolicyVersion(ctx);
  if (!page) return version;
  if (!outdated) return version;
  const next = version + 1;
  await ctx.db.insert("privacyPolicyVersions", { version: next, hash: policyHash(page), pageId: page._id, createdAt: Date.now() });
  return next;
}
