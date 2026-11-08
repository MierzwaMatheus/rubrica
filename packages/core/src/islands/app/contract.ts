/**
 * Proposta pública (`proposals.getPublic`) e o contrato dela: as variáveis `{{nome}}` do
 * modelo (lista no painel: `admin/lib/format.ts`, `CONTRACT_VARIABLES`) preenchidas com a
 * proposta, quem contrata (dados do site) e quem aceita. O modelo padrão é em português,
 * então as linhas montadas aqui ("inscrito no CPF sob nº…") também são.
 */
import type { Localized } from "../../i18n";
import { summarizeDiscount } from "../../convex/commerce/lib/proposalDiscount";
import { formatDocument, onlyDigits, pickText } from "./format";

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

/** Textos da proposta no idioma (com a reserva de `pickText`). */
export function proposalTexts(p: OpenProposal, locale: string, fallback: string) {
  const text = (v: Localized<string> | undefined) => pickText(v, locale, fallback);
  return {
    title: text(p.title),
    objective: text(p.objective),
    scope: p.scope.map(text),
    timeline: p.timeline.map((t) => ({ step: text(t.step), period: text(t.period) })),
    paymentMethods: p.paymentMethods.map(text).filter(Boolean),
    conditions: p.conditions.map(text).filter(Boolean),
    rescissionPolicy: text(p.rescissionPolicy),
  };
}

export function contractVariables(p: OpenProposal, client: ClientData | null, locale: string, fallback: string): Record<string, string> {
  const texts = proposalTexts(p, locale, fallback);
  const discount = summarizeDiscount(p);
  const org = p.contractor.organization;
  const contractorDoc = org?.taxId ? onlyDigits(org.taxId) : "";
  const address = org?.address ? [org.address.street, org.address.locality, org.address.region, org.address.postalCode, org.address.country].filter(Boolean).join(", ") : "";
  const jurisdiction = org?.address?.locality ? [org.address.locality, org.address.region].filter(Boolean).join(" – ") : "";
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
