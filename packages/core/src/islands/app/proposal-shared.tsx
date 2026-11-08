/** O que a página da proposta e a do aceite dividem: sessão da senha, contrato e o PDF. */
import { useCallback, useEffect, useState } from "react";
import { contractVariables, fillContract, type Acceptance, type ClientData, type OpenProposal } from "./contract";
import { openContractPdf } from "./contract-pdf";
import { dateTimeText, formatDocument, pickText } from "./format";
import { markdownToHtml } from "./markdown";
import type { T } from "./ui";

const tokenKey = (slug: string) => `rubrica:proposta:${slug}`;

/**
 * Token da sessão aberta com a senha, guardado na aba (`sessionStorage`, como na v1) para
 * a página do aceite reaproveitar. `ready` só depois de ler o que já estava guardado.
 */
export function useProposalToken(slug: string | undefined) {
  const [state, setState] = useState<{ slug?: string; token?: string; ready: boolean }>({ ready: false });
  useEffect(() => {
    if (!slug) return;
    let token: string | undefined;
    try {
      token = sessionStorage.getItem(tokenKey(slug)) ?? undefined;
    } catch {
      /* armazenamento bloqueado: pede a senha de novo */
    }
    setState({ slug, token, ready: true });
  }, [slug]);
  const set = useCallback(
    (token: string | null) => {
      if (!slug) return;
      try {
        if (token) sessionStorage.setItem(tokenKey(slug), token);
        else sessionStorage.removeItem(tokenKey(slug));
      } catch {
        /* sem armazenamento: vale só nesta página */
      }
      setState({ slug, token: token ?? undefined, ready: true });
    },
    [slug],
  );
  const ready = state.ready && state.slug === slug;
  return { ready, token: ready ? state.token : undefined, setToken: set };
}

/** Argumentos de `getPublic`: só depois de ler o token guardado (evita piscar a tela da senha). */
export function proposalArgs(slug: string | undefined, session: { ready: boolean; token?: string }) {
  if (!slug || !session.ready) return null;
  return session.token ? { slug, token: session.token } : { slug };
}

/** Contrato preenchido, em HTML escapado. `null` se a proposta não tem contrato. */
export function contractHtml(p: OpenProposal, client: ClientData | null, locale: string, fallback: string, baseLevel = 3): string | null {
  if (!p.contract?.trim()) return null;
  return markdownToHtml(fillContract(p.contract, contractVariables(p, client, locale, fallback)), baseLevel);
}

export function ContractText({ html }: { html: string }) {
  // HTML gerado por `markdownToHtml`, que escapa todo o texto (nada do conteúdo vira tag).
  return <div className="rb-app__contract rb-prose" dangerouslySetInnerHTML={{ __html: html }} />;
}

/** Abre o contrato aceito para salvar em PDF. `false` se o navegador bloqueou a aba. */
export function downloadContract(t: T, p: OpenProposal, acceptance: Acceptance, locale: string, fallback: string, signatureUrl?: string | null): boolean {
  const client: ClientData = { ...acceptance };
  const html = contractHtml(p, client, locale, fallback, 2) ?? "";
  const record = [
    { label: t("accept.name"), value: acceptance.clientName },
    { label: t("accept.document"), value: formatDocument(acceptance.clientDocument) },
    { label: t("form.email"), value: acceptance.clientEmail },
    ...(acceptance.clientRole ? [{ label: t("accept.role"), value: acceptance.clientRole }] : []),
    ...(acceptance.clientDeclaration ? [{ label: t("accept.declaration"), value: acceptance.clientDeclaration }] : []),
    { label: t("contract.acceptedAt"), value: dateTimeText(acceptance.acceptedAt, locale) },
    { label: t("contract.version"), value: String(acceptance.proposalVersion) },
    ...(acceptance.ipAddress ? [{ label: t("contract.ip"), value: acceptance.ipAddress }] : []),
    { label: t("contract.hash"), value: acceptance.contentHash },
  ];
  return openContractPdf({
    locale,
    title: pickText(p.title, locale, fallback) || t("contract.title"),
    contractHtml: html,
    recordTitle: t("contract.record"),
    record,
    signatureLabel: t("accept.signature"),
    signatureUrl: signatureUrl ?? acceptance.signatureUrl,
  });
}
