/**
 * Dados pessoais do comercial, por e-mail do titular (LGPD: exportação e exclusão).
 *
 * Duas fontes, no formato das fontes de dados pessoais do núcleo: `proposalsPersonalData`
 * (id `proposals`) e `checkoutsPersonalData` (id `checkouts`), cada uma com `find` e
 * `erase`. Juntas: `exportCommercePersonalData(ctx, email)` e
 * `eraseCommercePersonalData(ctx, email)`, expostas também como funções internas
 * `commerce.exportPersonalData` e `commerce.erasePersonalData`.
 *
 * O que entra: aceites de proposta (e as sessões que os geraram, por causa do IP) e
 * checkouts. A proposta em si não tem e-mail (só o nome do cliente, digitado por quem
 * a criou) e o registro de atividades do comercial não guarda e-mail nem IP do titular.
 *
 * Exclusão = anonimização: o aceite continua existindo (prova do contrato, com o hash
 * original), mas sem nome, documento, e-mail, IP, navegador nem assinatura; o checkout
 * continua para a contabilidade, sem os dados do pagador.
 */
import type { MutationCtx, ReaderCtx } from "../server";
import { normalizeEmailAddress } from "./shared";

export const ANONYMIZED = "[ANONIMIZADO]";
export const ANONYMIZED_EMAIL = "anonimizado@example.invalid";

/**
 * `find` e `erase` no formato das fontes de dados pessoais do núcleo (`PersonalDataSource`
 * de `convex/personalData.ts`, que vem com o módulo de LGPD): na junção, basta espalhar
 * em `proposalsPolicySource` / `paymentsPolicySource` (mesmos `id` e `plugin`).
 */
export interface CommercePersonalDataHandlers {
  id: "proposals" | "checkouts";
  plugin: "proposals" | "payments";
  find(ctx: ReaderCtx, email: string): Promise<Record<string, unknown>[]>;
  erase(ctx: MutationCtx, email: string): Promise<number>;
}

async function acceptancesOf(ctx: ReaderCtx, email: string) {
  return ctx.db
    .query("proposalAcceptances")
    .withIndex("by_clientEmail", (q) => q.eq("clientEmail", email))
    .collect();
}

async function checkoutsOf(ctx: ReaderCtx, email: string) {
  return ctx.db
    .query("checkouts")
    .withIndex("by_customerEmail", (q) => q.eq("customerEmail", email))
    .collect();
}

function redactSnapshot(snapshot: string, now: number): string {
  try {
    const snap = JSON.parse(snapshot) as Record<string, unknown>;
    if (snap.acceptance && typeof snap.acceptance === "object") {
      const a = snap.acceptance as Record<string, unknown>;
      for (const key of ["clientName", "clientDocument", "clientRole", "clientDeclaration"]) if (a[key] != null) a[key] = ANONYMIZED;
      a.clientEmail = ANONYMIZED_EMAIL;
    }
    snap._anonymizedAt = new Date(now).toISOString();
    return JSON.stringify(snap);
  } catch {
    return snapshot;
  }
}

/** Aceites de proposta (e a sessão de cada um, por causa do IP). */
export const proposalsPersonalData: CommercePersonalDataHandlers = {
  id: "proposals",
  plugin: "proposals",

  async find(ctx, rawEmail) {
    const email = normalizeEmailAddress(rawEmail);
    return Promise.all(
      (await acceptancesOf(ctx, email)).map(async ({ signatureStorageId, sessionId, ...acc }) => {
        const session = sessionId ? await ctx.db.get(sessionId) : null;
        const proposal = await ctx.db.get(acc.proposalId);
        return {
          ...acc,
          proposal: proposal ? { slug: proposal.slug, title: proposal.title, clientName: proposal.clientName } : null,
          session: session ? { ipAddress: session.ipAddress, userAgent: session.userAgent, createdAt: session.createdAt, expiresAt: session.expiresAt } : null,
          signatureUrl: signatureStorageId ? await ctx.storage.getUrl(signatureStorageId) : null,
        };
      }),
    );
  },

  async erase(ctx, rawEmail) {
    const email = normalizeEmailAddress(rawEmail);
    const now = Date.now();
    let count = 0;
    for (const acc of await acceptancesOf(ctx, email)) {
      if (acc.signatureStorageId) await ctx.storage.delete(acc.signatureStorageId);
      await ctx.db.patch(acc._id, {
        clientName: ANONYMIZED,
        clientDocument: ANONYMIZED,
        clientEmail: ANONYMIZED_EMAIL,
        clientRole: acc.clientRole !== undefined ? ANONYMIZED : undefined,
        clientDeclaration: acc.clientDeclaration !== undefined ? ANONYMIZED : undefined,
        contentSnapshot: redactSnapshot(acc.contentSnapshot, now),
        ipAddress: "0.0.0.0",
        userAgent: ANONYMIZED,
        signatureStorageId: undefined,
        anonymizedAt: now,
      });
      count++;
      if (acc.sessionId && (await ctx.db.get(acc.sessionId))) {
        await ctx.db.patch(acc.sessionId, { ipAddress: "0.0.0.0", userAgent: undefined });
      }
    }
    return count;
  },
};

/** Checkouts (dados do pagador). */
export const checkoutsPersonalData: CommercePersonalDataHandlers = {
  id: "checkouts",
  plugin: "payments",

  async find(ctx, rawEmail) {
    return (await checkoutsOf(ctx, normalizeEmailAddress(rawEmail))).map(({ paymentLockUntil: _lock, ...rest }) => rest);
  },

  async erase(ctx, rawEmail) {
    const now = Date.now();
    const docs = await checkoutsOf(ctx, normalizeEmailAddress(rawEmail));
    for (const co of docs) {
      await ctx.db.patch(co._id, {
        customerName: ANONYMIZED,
        customerEmail: ANONYMIZED_EMAIL,
        customerCpfCnpj: "00000000000",
        customerMobilePhone: undefined,
        customerPhone: undefined,
        customerCompany: undefined,
        updatedAt: now,
      });
    }
    return docs.length;
  },
};

export const COMMERCE_PERSONAL_DATA = [proposalsPersonalData, checkoutsPersonalData] as const;

/** `personalData.export(email)`: os registros de cada fonte do comercial. */
export async function exportCommercePersonalData(ctx: ReaderCtx, email: string): Promise<Record<string, Record<string, unknown>[]>> {
  const out: Record<string, Record<string, unknown>[]> = {};
  for (const source of COMMERCE_PERSONAL_DATA) out[source.id] = await source.find(ctx, email);
  return out;
}

/** `personalData.erase(email)`: anonimiza em cada fonte do comercial. */
export async function eraseCommercePersonalData(ctx: MutationCtx, email: string): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  for (const source of COMMERCE_PERSONAL_DATA) out[source.id] = await source.erase(ctx, email);
  return out;
}
