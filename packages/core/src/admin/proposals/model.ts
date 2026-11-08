/**
 * Formulário da proposta: o que o painel mostra (itens do escopo com preço e cortesia
 * juntos) e o que o backend guarda (listas paralelas: `scope`, `scopePrices`,
 * `giftIndexes`). Puro: testável sem React.
 */
import { field, validateFields, type FieldError, type FieldMap } from "../../blocks/fields";
import { validateDiscount } from "../../convex/commerce/lib/proposalDiscount";
import type { ProposalContent, ProposalDoc } from "../data/api";
import { prune, type Values } from "../editor/model";

const textItem = (label: string) => field.list({ label, itemLabel: "Item", of: { text: field.text({ label: "Texto", required: true, maxLength: 300 }) } });

export const PROPOSAL_FIELDS: FieldMap = {
  clientName: field.text({ label: "Cliente", required: true, localized: false, maxLength: 120 }),
  title: field.text({ label: "Título da proposta", required: true, maxLength: 140 }),
  objective: field.text({ label: "Objetivo", required: true, multiline: true, maxLength: 1000 }),
  scope: field.list({
    label: "Escopo",
    itemLabel: "Item",
    required: true,
    min: 1,
    help: "O que será entregue. O preço e a cortesia de cada item são opcionais; cortesia só vale com desconto.",
    of: {
      text: field.text({ label: "Item do escopo", required: true, maxLength: 300 }),
      price: field.number({ label: "Preço do item (R$)", min: 0 }),
      gift: field.boolean({ label: "Cortesia (entra de brinde, dentro do desconto)", default: false }),
    },
  }),
  timeline: field.list({
    label: "Cronograma",
    itemLabel: "Etapa",
    of: { step: field.text({ label: "Etapa", required: true, maxLength: 120 }), period: field.text({ label: "Quando", required: true, maxLength: 80 }) },
  }),
  deliveryDate: field.text({ label: "Entrega", required: true, localized: false, maxLength: 120, help: "Texto livre: 15/03/2027 ou 6 semanas após o aceite." }),
  investmentValue: field.number({ label: "Valor final (R$)", required: true, min: 0 }),
  originalValue: field.number({ label: "Valor original antes do desconto (R$)", min: 0, help: "Preencha para mostrar o desconto na proposta. Precisa ser maior que o valor final." }),
  paymentMethods: textItem("Formas de pagamento"),
  conditions: textItem("Condições"),
  rescissionPolicy: field.text({ label: "Rescisão", required: true, multiline: true, maxLength: 800 }),
};

/** Chaves que o backend aceita apagar com `unset`. */
export const UNSETTABLE = ["scopePrices", "originalValue", "giftIndexes", "templateId"] as const;
export const CONTENT_KEYS = ["clientName", "title", "objective", "scope", "timeline", "deliveryDate", "investmentValue", "scopePrices", "originalValue", "giftIndexes", "paymentMethods", "conditions", "rescissionPolicy", "templateId"];
export const CONTENT_REQUIRED = CONTENT_KEYS.filter((k) => !(UNSETTABLE as readonly string[]).includes(k));

type Loc = Record<string, string>;

/** Proposta (ou versão) → formulário. */
export function proposalToForm(content: Partial<ProposalContent>): Values {
  const prices = content.scopePrices ?? [];
  const gifts = new Set(content.giftIndexes ?? []);
  const out: Values = {
    clientName: content.clientName,
    title: content.title,
    objective: content.objective,
    scope: (content.scope ?? []).map((text, i) => ({ text, ...(typeof prices[i] === "number" ? { price: prices[i] } : {}), ...(gifts.has(i) ? { gift: true } : {}) })),
    timeline: content.timeline,
    deliveryDate: content.deliveryDate,
    investmentValue: content.investmentValue,
    originalValue: content.originalValue,
    paymentMethods: (content.paymentMethods ?? []).map((text) => ({ text })),
    conditions: (content.conditions ?? []).map((text) => ({ text })),
    rescissionPolicy: content.rescissionPolicy,
    templateId: content.templateId,
  };
  return prune(structuredClone(out));
}

/** Formulário → conteúdo do backend. */
export function formToProposal(form: Values): Record<string, unknown> {
  const scope = (form.scope as { text: Loc; price?: number; gift?: boolean }[] | undefined) ?? [];
  const hasPrices = scope.some((s) => typeof s.price === "number");
  const gifts = scope.flatMap((s, i) => (s.gift ? [i] : []));
  const items = (key: string) => ((form[key] as { text: Loc }[] | undefined) ?? []).map((i) => i.text);
  return prune({
    clientName: form.clientName,
    title: form.title,
    objective: form.objective,
    scope: scope.map((s) => s.text),
    timeline: form.timeline ?? [],
    deliveryDate: form.deliveryDate,
    investmentValue: form.investmentValue,
    scopePrices: hasPrices ? scope.map((s) => (typeof s.price === "number" ? s.price : null)) : undefined,
    originalValue: form.originalValue,
    giftIndexes: gifts.length ? gifts : undefined,
    paymentMethods: items("paymentMethods"),
    conditions: items("conditions"),
    rescissionPolicy: form.rescissionPolicy,
    templateId: form.templateId,
  });
}

export interface ProposalErrors {
  fields: FieldError[];
  /** Erro de desconto/preço (a regra do backend), com o campo onde mostrar. */
  discount?: { path: string; message: string };
}

/** Confere o formulário: campos do schema e as regras de desconto, brinde e preço do backend. */
export function validateProposalForm(form: Values): ProposalErrors {
  const fieldValues: Values = {};
  for (const key of Object.keys(PROPOSAL_FIELDS)) if (form[key] !== undefined) fieldValues[key] = form[key];
  const fields = validateFields(PROPOSAL_FIELDS, fieldValues);
  if (fields.length) return { fields };
  const content = formToProposal(form);
  try {
    validateDiscount({
      investmentValue: content.investmentValue as number,
      originalValue: content.originalValue as number | undefined,
      scopePrices: content.scopePrices as (number | null)[] | undefined,
      giftIndexes: content.giftIndexes as number[] | undefined,
      scopeLength: (content.scope as unknown[]).length,
    });
  } catch (e) {
    const message = (e as Error).message;
    const path = /original/i.test(message) ? "originalValue" : /brinde|soma/i.test(message) ? "scope" : /pre[çc]o/i.test(message) ? "scope" : "investmentValue";
    return { fields: [], discount: { path, message } };
  }
  return { fields: [] };
}

export type ProposalStatus = "accepted" | "expired" | "pending" | "trash";

export function proposalStatus(p: Pick<ProposalDoc, "isAccepted" | "expiresAt" | "deletedAt">, now = Date.now()): ProposalStatus {
  if (p.deletedAt !== undefined) return "trash";
  if (p.isAccepted) return "accepted";
  return p.expiresAt < now ? "expired" : "pending";
}

export const STATUS_LABELS: Record<ProposalStatus, string> = { accepted: "aceita", expired: "expirada", pending: "aguardando", trash: "na lixeira" };

/** Endereço público da proposta (a página da proposta do site). */
export function proposalUrl(siteUrl: string, slug: string): string {
  return `${siteUrl.replace(/\/+$/, "")}/proposta/${slug}`;
}

/** `AAAA-MM-DD` do campo de data ↔ meia-noite do dia, no fuso do navegador. */
export function dateToInput(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
export function inputToDate(value: string): number | undefined {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return undefined;
  // Fim do dia: a proposta vale durante todo o dia escolhido.
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 23, 59, 59).getTime();
}
