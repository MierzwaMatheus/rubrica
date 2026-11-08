/**
 * Dados pessoais do comercial, por e-mail do titular (LGPD: exportação e exclusão).
 *
 * Ponto de ligação com a fonte de dados pessoais do núcleo (que vem com o módulo de
 * LGPD): `commercePersonalData.export(ctx, email)` e `.erase(ctx, email)`. As mesmas
 * operações ficam expostas como funções internas em `commerce.exportPersonalData` e
 * `commerce.erasePersonalData`.
 *
 * O que entra: aceites de proposta (e as sessões que os geraram, por causa do IP) e
 * checkouts. A proposta em si não tem e-mail (só o nome do cliente, digitado por quem
 * a criou) e o registro de atividades do comercial não guarda e-mail nem IP do titular.
 *
 * Exclusão = anonimização: o aceite continua existindo (prova do contrato, com o hash
 * original), mas sem nome, documento, e-mail, IP, navegador nem assinatura; o checkout
 * continua para a contabilidade, sem os dados do pagador.
 */
import type { Doc, MutationCtx, ReaderCtx } from "../server";
import { normalizeEmailAddress } from "./shared";

export const ANONYMIZED = "[ANONIMIZADO]";
export const ANONYMIZED_EMAIL = "anonimizado@example.invalid";

export interface CommercePersonalDataExport {
  proposalAcceptances: Array<Omit<Doc<"proposalAcceptances">, "signatureStorageId"> & { signatureUrl: string | null }>;
  proposalSessions: Array<Omit<Doc<"proposalSessions">, "tokenHash">>;
  checkouts: Array<Omit<Doc<"checkouts">, "paymentLockUntil">>;
}

/** Contrato de uma fonte de dados pessoais. */
export interface PersonalDataSource<E = unknown> {
  id: string;
  label: string;
  export(ctx: ReaderCtx, email: string): Promise<E>;
  /** Anonimiza e devolve quantos registros mudaram. */
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

export const commercePersonalData: PersonalDataSource<CommercePersonalDataExport> = {
  id: "commerce",
  label: "Propostas aceitas e pagamentos",

  async export(ctx, rawEmail) {
    const email = normalizeEmailAddress(rawEmail);
    const acceptances = await acceptancesOf(ctx, email);
    const sessions: CommercePersonalDataExport["proposalSessions"] = [];
    for (const acc of acceptances) {
      if (!acc.sessionId) continue;
      const session = await ctx.db.get(acc.sessionId);
      if (session) {
        const { tokenHash: _token, ...rest } = session;
        sessions.push(rest);
      }
    }
    const proposalAcceptances = await Promise.all(
      acceptances.map(async ({ signatureStorageId, ...acc }) => ({
        ...acc,
        signatureUrl: signatureStorageId ? await ctx.storage.getUrl(signatureStorageId) : null,
      })),
    );
    const checkouts = (await checkoutsOf(ctx, email)).map(({ paymentLockUntil: _lock, ...rest }) => rest);
    return { proposalAcceptances, proposalSessions: sessions, checkouts };
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
    for (const co of await checkoutsOf(ctx, email)) {
      await ctx.db.patch(co._id, {
        customerName: ANONYMIZED,
        customerEmail: ANONYMIZED_EMAIL,
        customerCpfCnpj: "00000000000",
        customerMobilePhone: undefined,
        customerPhone: undefined,
        customerCompany: undefined,
        updatedAt: now,
      });
      count++;
    }
    return count;
  },
};
