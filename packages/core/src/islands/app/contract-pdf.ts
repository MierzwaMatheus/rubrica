/**
 * Contrato aceito em PDF, como o currículo (`curriculo-pdf.ts`) e a v1: um HTML simples
 * numa aba nova e a impressão do navegador, que salva em PDF. Leva o texto do contrato,
 * o registro do aceite (nome, documento, data, IP, versão, hash) e a assinatura desenhada.
 */
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export interface ContractDocument {
  locale: string;
  title: string;
  /** Contrato já em HTML (de `markdownToHtml`, escapado). */
  contractHtml: string;
  recordTitle: string;
  record: { label: string; value: string }[];
  signatureLabel?: string;
  /** URL (`https:` ou `data:image/…`) da assinatura. */
  signatureUrl?: string | null;
}

export function contractHtmlDocument(doc: ContractDocument): string {
  const signature =
    doc.signatureUrl && /^(https:|data:image\/)/.test(doc.signatureUrl)
      ? `<div class="sig"><img src="${esc(doc.signatureUrl)}" alt="${esc(doc.signatureLabel ?? "")}"></div>`
      : "";
  return `<!doctype html><html lang="${esc(doc.locale)}"><head><meta charset="utf-8"><title>${esc(doc.title)}</title><style>
body{font-family:Georgia,"Times New Roman",serif;color:#111;max-width:46rem;margin:2rem auto;padding:0 1.5rem;line-height:1.55;font-size:11.5pt}
h1{font-size:18pt;margin:0 0 1rem}h2,h3,h4{font-size:12.5pt;margin:1.4rem 0 .5rem}hr{border:0;border-top:1px solid #999;margin:1.2rem 0}
ul,ol{padding-left:1.4rem}.record{margin-top:2rem;border-top:2px solid #111;padding-top:1rem;font-family:Arial,sans-serif;font-size:10pt}
.record dt{font-weight:bold}.record dd{margin:0 0 .4rem;word-break:break-all}.sig img{max-height:90px;margin-top:.5rem}
@media print{body{margin:0}}
</style></head><body><h1>${esc(doc.title)}</h1>${doc.contractHtml}<section class="record"><h2>${esc(doc.recordTitle)}</h2><dl>${doc.record
    .map((r) => `<dt>${esc(r.label)}</dt><dd>${esc(r.value)}</dd>`)
    .join("")}</dl>${signature}</section></body></html>`;
}

/** Abre a aba e chama a impressão. `false` se o navegador bloqueou a aba. */
export function openContractPdf(doc: ContractDocument): boolean {
  const win = window.open("", "_blank");
  if (!win) return false;
  win.document.open();
  win.document.write(contractHtmlDocument(doc));
  win.document.close();
  const print = () => {
    win.focus();
    win.print();
  };
  // Espera a assinatura (imagem) carregar antes de imprimir.
  const img = win.document.querySelector("img");
  if (img && !img.complete) img.addEventListener("load", print, { once: true });
  else setTimeout(print, 50);
  return true;
}
