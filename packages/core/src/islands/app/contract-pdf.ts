/**
 * Contrato aceito em PDF, como o currículo (`curriculo-pdf.ts`) e a v1: um HTML numa aba
 * nova e a impressão do navegador, que salva em PDF (A4). Leva o cabeçalho de quem
 * contrata, a faixa do título, o contrato, o quadro da assinatura (dados de quem aceitou,
 * a assinatura desenhada e a linha), as evidências técnicas e o rodapé jurídico.
 */
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export interface ContractDocument {
  locale: string;
  title: string;
  /** Cor de destaque (a do tema do site); só aceita cor hexadecimal ou `rgb()`. */
  accent?: string;
  /** Quem contrata o serviço: nome e linhas de contato (cidade, e-mail…). */
  contractor?: { name: string; lines: string[] };
  /** Linha acima do título ("Contrato de prestação de serviços"). */
  kicker?: string;
  /** Linha abaixo do título (cliente · versão · data). */
  subtitle?: string;
  /** Contrato já em HTML (de `markdownToHtml`, escapado). */
  contractHtml: string;
  signature?: {
    title: string;
    rows: { label: string; value: string }[];
    /** URL (`https:` ou `data:image/…`) da assinatura desenhada. */
    url?: string | null;
    alt: string;
    caption: string;
  };
  evidence?: { title: string; rows: { label: string; value: string }[] };
  /** Rodapé jurídico. */
  legal?: string;
}

const DEFAULT_ACCENT = "#5b21b6";
const safeColor = (c?: string) => (c && /^(#[0-9a-f]{3,8}|rgba?\([\d\s.,%]+\)|oklch\([\d\s.,%/]+\))$/i.test(c.trim()) ? c.trim() : DEFAULT_ACCENT);
const safeImage = (url?: string | null) => (url && /^(https:|data:image\/)/.test(url) ? url : null);
const rowsHtml = (rows: { label: string; value: string }[]) => rows.map((r) => `<dt>${esc(r.label)}</dt><dd>${esc(r.value)}</dd>`).join("");

export function contractHtmlDocument(doc: ContractDocument): string {
  const accent = safeColor(doc.accent);
  const header = doc.contractor
    ? `<header class="brand"><p class="brand__name">${esc(doc.contractor.name)}</p>${
        doc.contractor.lines.length ? `<p class="brand__lines">${doc.contractor.lines.map(esc).join(" · ")}</p>` : ""
      }</header>`
    : "";
  const band = `<section class="band">${doc.kicker ? `<p class="band__kicker">${esc(doc.kicker)}</p>` : ""}<h1>${esc(doc.title)}</h1>${
    doc.subtitle ? `<p class="band__sub">${esc(doc.subtitle)}</p>` : ""
  }</section>`;

  let signature = "";
  if (doc.signature) {
    const img = safeImage(doc.signature.url);
    signature = `<section class="sign"><h2>${esc(doc.signature.title)}</h2><dl class="facts">${rowsHtml(doc.signature.rows)}</dl><div class="sign__area">${
      img ? `<img src="${esc(img)}" alt="${esc(doc.signature.alt)}">` : ""
    }<div class="sign__line"></div><p class="sign__caption">${esc(doc.signature.caption)}</p></div></section>`;
  }
  const evidence = doc.evidence ? `<section class="evidence"><h2>${esc(doc.evidence.title)}</h2><dl class="facts facts--mono">${rowsHtml(doc.evidence.rows)}</dl></section>` : "";
  const legal = doc.legal ? `<footer class="legal">${esc(doc.legal)}</footer>` : "";

  return `<!doctype html><html lang="${esc(doc.locale)}"><head><meta charset="utf-8"><title>${esc(doc.title)}</title><style>
@page{size:A4;margin:15mm 18mm}
*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
:root{--accent:color-mix(in srgb,${accent} 62%,#000)}
body{font-family:Inter,"Segoe UI",system-ui,-apple-system,Arial,sans-serif;color:#1a1a1a;max-width:48rem;margin:2rem auto;padding:0 1.5rem;line-height:1.6;font-size:10.5pt}
.brand{background:var(--accent);color:#fff;border-radius:8px;padding:14px 18px;margin-bottom:14px}
.brand__name{margin:0;font-weight:700;letter-spacing:.06em;text-transform:uppercase;font-size:12pt}
.brand__lines{margin:4px 0 0;font-size:9pt;opacity:.9}
.band{border-left:4px solid var(--accent);padding:4px 0 4px 14px;margin:0 0 22px}
.band__kicker{margin:0;color:var(--accent);font-size:8.5pt;font-weight:700;letter-spacing:.1em;text-transform:uppercase}
.band h1{margin:2px 0 0;font-size:17pt;line-height:1.25}
.band__sub{margin:4px 0 0;color:#555;font-size:9.5pt}
.contract h2,.contract h3,.contract h4{color:var(--accent);text-transform:uppercase;letter-spacing:.03em;font-size:10.5pt;margin:20px 0 6px;padding-left:8px;border-left:3px solid var(--accent);page-break-after:avoid;break-after:avoid}
.contract p,.contract li{orphans:3;widows:3}
.contract ul,.contract ol{padding-left:1.3rem}
.contract hr{border:0;border-top:1px solid #ddd;margin:16px 0}
section.sign,section.evidence{margin-top:26px;border:1px solid #ddd;border-radius:8px;padding:14px 18px;page-break-inside:avoid;break-inside:avoid}
section.sign h2,section.evidence h2{margin:0 0 10px;font-size:10.5pt;text-transform:uppercase;letter-spacing:.05em;color:var(--accent)}
.facts{display:grid;grid-template-columns:max-content 1fr;gap:4px 14px;margin:0;font-size:9.5pt}
.facts dt{font-weight:600;color:#444}.facts dd{margin:0;word-break:break-word}
.facts--mono dd{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:8.5pt;word-break:break-all}
.sign__area{margin-top:16px;max-width:20rem}
.sign__area img{display:block;max-height:90px;max-width:100%}
.sign__line{border-top:1px solid #1a1a1a;margin-top:4px}
.sign__caption{margin:4px 0 0;font-size:8.5pt;color:#555}
.legal{margin-top:22px;padding-top:10px;border-top:1px solid #ddd;color:#666;font-size:8pt;text-align:center}
@media print{body{margin:0;max-width:none;padding:0}}
</style></head><body>${header}${band}<div class="contract">${doc.contractHtml}</div>${signature}${evidence}${legal}</body></html>`;
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
