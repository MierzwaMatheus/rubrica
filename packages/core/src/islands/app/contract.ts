/**
 * Proposta pública (`proposals.getPublic`) e o contrato dela: as variáveis `{{nome}}` do
 * modelo (lista no painel: `admin/lib/format.ts`, `CONTRACT_VARIABLES`) preenchidas com a
 * proposta, quem contrata (dados do site) e quem aceita. O modelo padrão é em português,
 * então as linhas montadas aqui ("inscrito no CPF sob nº…") também são.
 */
import type { Localized } from "../../i18n";
import { summarizeDiscount } from "../../convex/commerce/lib/proposalDiscount";
import { formatDocument, money, onlyDigits, pickText } from "./format";

/** Tradução dos textos de interface (`makeT`), para os padrões da proposta. */
type Translate = (key: string, vars?: Record<string, string | number>) => string;

export interface ProposalStatus {
  slug: string;
  requiresPassword: boolean;
  hasValidSession: boolean;
  isExpired: boolean;
  isAccepted: boolean;
  expiresAt: number;
}

export interface Contractor {
  name: Localized<string>;
  person: { name: string; email?: string } | null;
  organization: {
    legalName?: string;
    taxId?: string;
    email?: string;
    address?: { street?: string; locality?: string; region?: string; postalCode?: string; country?: string };
  } | null;
}

export interface OpenProposal extends ProposalStatus {
  locked: false;
  clientName: string;
  title: Localized<string>;
  objective: Localized<string>;
  scope: Localized<string>[];
  timeline: { step: Localized<string>; period: Localized<string> }[];
  deliveryDate: string;
  investmentValue: number;
  scopePrices?: (number | null)[];
  originalValue?: number;
  giftIndexes?: number[];
  paymentMethods: Localized<string>[];
  conditions: Localized<string>[];
  rescissionPolicy: Localized<string>;
  version: number;
  acceptedAt?: number;
  createdAt: number;
  contract: string | null;
  contractor: Contractor;
}

export type PublicProposal = (ProposalStatus & { locked: true }) | OpenProposal;

export interface Acceptance {
  clientName: string;
  clientDocument: string;
  clientEmail: string;
  clientRole?: string;
  clientDeclaration?: string;
  acceptedAt: number;
  proposalVersion: number;
  contentHash: string;
  ipAddress?: string;
  userAgent?: string;
  signatureUrl?: string | null;
}

export interface ClientData {
  clientName: string;
  clientDocument: string;
  clientEmail: string;
  clientRole?: string;
  clientDeclaration?: string;
  acceptedAt?: number;
}

const brl = (value: number) => `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const list = (items: string[]) => items.filter(Boolean).map((i) => `- ${i}`).join("\n");
/** Preenchimento das variáveis sem valor: um traço para completar à mão. */
const BLANK = "________";

/** Desconto do PIX e parcelas das formas de pagamento geradas (as da v1). */
export const PAYMENT_DEFAULTS = { pixDiscountPercent: 10, installmentsNoInterest: 3, installmentsWithInterest: 12 };

/**
 * Formas de pagamento de quando a proposta não traz as suas (como a v1): PIX com desconto,
 * 50/50 e cartão. Os textos são de interface (`proposal.pay.*`), o site pode trocar.
 */
export function defaultPaymentMethods(t: Translate, value: number, locale: string): string[] {
  const { pixDiscountPercent, installmentsNoInterest, installmentsWithInterest } = PAYMENT_DEFAULTS;
  if (!(value > 0)) return [];
  return [
    t("proposal.pay.pix", { value: money(value * (1 - pixDiscountPercent / 100), locale), percent: pixDiscountPercent }),
    t("proposal.pay.split"),
    t("proposal.pay.installments", { count: installmentsNoInterest, value: money(value / installmentsNoInterest, locale) }),
    t("proposal.pay.installmentsInterest", { count: installmentsWithInterest }),
  ];
}

/** Cidade do foro (a da empresa do site), ou `""` sem endereço. */
export function jurisdictionCity(p: OpenProposal): string {
  const addr = p.contractor.organization?.address;
  return addr?.locality ? [addr.locality, addr.region].filter(Boolean).join(" – ") : "";
}

/**
 * Textos da proposta no idioma (com a reserva de `pickText`). Sem formas de pagamento ou
 * sem política de rescisão, entram os padrões (como na v1); `defaults` diz quais entraram.
 */
export function proposalTexts(p: OpenProposal, locale: string, fallback: string, t: Translate) {
  const text = (v: Localized<string> | undefined) => pickText(v, locale, fallback);
  const paymentMethods = p.paymentMethods.map(text).filter(Boolean);
  const rescissionPolicy = text(p.rescissionPolicy).trim();
  const city = jurisdictionCity(p);
  const jurisdiction = city ? t("proposal.jurisdictionCity", { city }) : t("proposal.jurisdictionDefault");
  return {
    title: text(p.title),
    objective: text(p.objective),
    scope: p.scope.map(text),
    timeline: p.timeline.map((s) => ({ step: text(s.step), period: text(s.period) })),
    paymentMethods: paymentMethods.length ? paymentMethods : defaultPaymentMethods(t, p.investmentValue, locale),
    conditions: p.conditions.map(text).filter(Boolean),
    rescissionPolicy: rescissionPolicy || t("proposal.rescissionDefault", { jurisdiction }),
    defaults: { paymentMethods: !paymentMethods.length, rescissionPolicy: !rescissionPolicy },
  };
}

export function contractVariables(p: OpenProposal, client: ClientData | null, locale: string, fallback: string, t: Translate): Record<string, string> {
  const texts = proposalTexts(p, locale, fallback, t);
  const discount = summarizeDiscount(p);
  const org = p.contractor.organization;
  const contractorDoc = org?.taxId ? onlyDigits(org.taxId) : "";
  const address = org?.address ? [org.address.street, org.address.locality, org.address.region, org.address.postalCode, org.address.country].filter(Boolean).join(", ") : "";
  const jurisdiction = jurisdictionCity(p);
  const doc = client?.clientDocument ? formatDocument(client.clientDocument) : "";
  const docType = onlyDigits(doc).length === 14 ? "CNPJ" : "CPF";
  const scope = texts.scope.map((item, i) => {
    const price = discount.priceOf(i);
    if (price === undefined) return item;
    return discount.isGift(i) ? `${item} (brinde, sem custo; valor original ${brl(price)})` : `${item} (${brl(price)})`;
  });
  return {
    client_name: client?.clientName || p.clientName,
    client_document_line: doc ? `, inscrito(a) no ${docType} sob nº ${doc}` : "",
    client_email_line: client?.clientEmail ? `, com e-mail ${client.clientEmail}` : "",
    contractor_name: org?.legalName || p.contractor.person?.name || pickText(p.contractor.name, locale, fallback) || BLANK,
    contractor_document: contractorDoc ? formatDocument(contractorDoc) : BLANK,
    contractor_document_type: contractorDoc.length === 11 ? "CPF" : "CNPJ",
    contractor_address: address || BLANK,
    objective: texts.objective,
    scope: list(scope),
    timeline: list(texts.timeline.map((t) => (t.period ? `${t.step} – ${t.period}` : t.step))),
    delivery_date_line: p.deliveryDate.trim() ? `\n\nEntrega prevista: ${p.deliveryDate.trim()}` : "",
    investment_value: brl(p.investmentValue),
    discount: discount.hasDiscount
      ? `Sobre o valor original de ${brl(discount.originalValue)} foi concedido desconto de ${brl(discount.discountAmount)} (${discount.discountPercent}%).`
      : "",
    payment_methods: list(texts.paymentMethods),
    conditions: list(texts.conditions),
    rescission_policy: texts.rescissionPolicy,
    jurisdiction: jurisdiction || BLANK,
    accepted_at: client?.acceptedAt ? new Date(client.acceptedAt).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }) : BLANK,
  };
}

/** Troca as variáveis conhecidas; as desconhecidas ficam como estão (o painel avisa delas). */
export function fillContract(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key: string) => (key in vars ? vars[key]! : match));
}
