/**
 * Validadores do comercial (propostas, contratos, checkouts, currículos com IA).
 * Os textos que a v1 traduzia com `ptBR`/`enUS` viram mapas por idioma (decisão 26).
 */
import { v } from "convex/values";
import { vLocalized } from "../validators";

export const vTimelineItem = v.object({ step: vLocalized, period: vLocalized });

/** Preço de cada item do escopo, na mesma ordem (`null` = sem preço). */
export const vScopePrices = v.array(v.union(v.number(), v.null()));

/** Conteúdo editável de uma proposta (o que o painel envia e o que vai para o histórico de versões). */
export const proposalContentFields = {
  clientName: v.string(),
  title: vLocalized,
  objective: vLocalized,
  scope: v.array(vLocalized),
  timeline: v.array(vTimelineItem),
  /** Texto livre ("15/03/2027", "6 semanas após o aceite"). */
  deliveryDate: v.string(),
  /** Valor final, em reais. */
  investmentValue: v.number(),
  scopePrices: v.optional(vScopePrices),
  /** Valor antes do desconto, em reais. */
  originalValue: v.optional(v.number()),
  giftIndexes: v.optional(v.array(v.number())),
  paymentMethods: v.array(vLocalized),
  conditions: v.array(vLocalized),
  rescissionPolicy: vLocalized,
  templateId: v.optional(v.id("contractTemplates")),
};

export const vBillingType = v.union(v.literal("PIX"), v.literal("BOLETO"), v.literal("CREDIT_CARD"));

export const vCheckoutStatus = v.union(
  v.literal("pending"),
  v.literal("payment_selected"),
  v.literal("payment_confirmed"),
  v.literal("paid"),
  v.literal("expired"),
  v.literal("failed"),
  v.literal("refunded"),
);

/** Dados do pagador. CPF/CNPJ e telefone nunca vão para o navegador depois de gravados. */
export const customerFields = {
  customerName: v.string(),
  customerEmail: v.string(),
  customerCpfCnpj: v.string(),
  customerMobilePhone: v.optional(v.string()),
  customerCompany: v.optional(v.string()),
  customerPhone: v.optional(v.string()),
};
