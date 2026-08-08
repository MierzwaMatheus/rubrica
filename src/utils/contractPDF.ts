import { generateContractContent, type ProposalData, type AcceptanceData } from "./contractGenerator";

export interface PDFAcceptanceData extends AcceptanceData {
  ip_address?: string | null;
  user_agent?: string | null;
  content_hash?: string;
  proposal_version?: string;
}

export interface ContactInfo {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedinUrl?: string;
  githubUrl?: string;
}

export function formatClauseContent(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/^#{1,6}\s+(.+)$/gm, "<strong>$1</strong>")
    .replace(/^\d+\. (.+)$/gm, "<oli>$1</oli>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>[^]*?<\/li>\n?)+/gm, (match) => `<ul>${match.replace(/\n/g, "")}</ul>`)
    .replace(/(<oli>[^]*?<\/oli>\n{0,2})+/g, (match) =>
      `<ol>${match.replace(/<oli>/g, "<li>").replace(/<\/oli>/g, "</li>").replace(/\n/g, "")}</ol>`,
    )
    .replace(/---/g, "")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br/>")
    .replace(/^/, "<p>")
    .replace(/$/, "</p>")
    .replace(/<p><\/p>/g, "")
    .replace(/<p>(<ul>)/g, "$1")
    .replace(/(<\/ul>)<\/p>/g, "$1")
    .replace(/<p>(<ol>)/g, "$1")
    .replace(/(<\/ol>)<\/p>/g, "$1");
}

function extractClauseTitle(clause: string): { title: string; body: string } {
  const match = clause.match(/^#{1,6}\s+(CLÁUSULA[^:\n]+(?::[^\n]*)?)?\n?([\s\S]*)/i)
    ?? clause.match(/^(CLÁUSULA[^\n]+)\n?([\s\S]*)/i);
  if (match) {
    return { title: (match[1] ?? "").replace(/^#{1,6}\s+/, "").trim(), body: (match[2] ?? "").trim() };
  }
  return { title: "", body: clause.trim() };
}

export function parseTemplateContent(content: string): { header: string; clauses: string[] } {
  const parts = content.split(/(?=### )/);
  const header = parts[0] ?? '';
  const clauses = parts.slice(1).map(c => c.trim() + '\n');
  return { header, clauses };
}

export function generateContractHTML(
  proposal: ProposalData,
  acceptanceData: PDFAcceptanceData,
  signatureDataUrl: string,
  contactInfo?: ContactInfo,
  templateContent?: string,
): string {
  const contractContent = templateContent !== undefined
    ? parseTemplateContent(templateContent)
    : generateContractContent(proposal, acceptanceData);
  const signedAt = new Date(acceptanceData.accepted_at).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const contractId = (proposal as any).slug?.toUpperCase() ?? "—";
  const contractVersion = (proposal as any).version ?? 1;

  const ci = contactInfo ?? {};
  const displayName = ci.name || "";
  const displayEmail = ci.email || "";
  const displayLocation = ci.location || "";
  const displayLinkedin = ci.linkedinUrl ? ci.linkedinUrl.replace(/^https?:\/\/(www\.)?/, "") : "";
  const displayGithub = ci.githubUrl ? ci.githubUrl.replace(/^https?:\/\/(www\.)?/, "") : "";

  const clausesHTML = contractContent.clauses
    .map((clause) => {
      const { title, body } = extractClauseTitle(clause);
      const bodyHTML = formatClauseContent(body);
      return `
        <div class="clause">
          ${title ? `<div class="clause-title">${title.replace(/\*\*/g, "")}</div>` : ""}
          <div class="clause-body">${bodyHTML}</div>
        </div>
      `;
    })
    .join("");

  const headerClean = contractContent.header
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/---/g, "<hr/>")
    .replace(/\n/g, "<br/>");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Contrato Eletrônico — ${contractId}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    @page {
      size: A4;
      margin: 15mm 18mm;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Inter', Arial, sans-serif;
      font-size: 10pt;
      color: #1a1a1a;
      background: #fff;
      line-height: 1.6;
    }

    /* ─── HEADER ─── */
    .header {
      background: #8b5cf6;
      color: #fff;
      padding: 14px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0;
      border-radius: 4px 4px 0 0;
    }
    .header-left h1 {
      font-size: 15pt;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    .header-left p {
      font-size: 8.5pt;
      opacity: 0.85;
      margin-top: 2px;
    }
    .header-right {
      text-align: right;
      font-size: 8pt;
      opacity: 0.85;
      line-height: 1.5;
    }

    /* ─── TITLE BAND ─── */
    .title-band {
      background: #f5f3ff;
      border-left: 5px solid #8b5cf6;
      padding: 12px 20px;
      margin-bottom: 18px;
    }
    .title-band h2 {
      font-size: 12pt;
      font-weight: 700;
      color: #5b21b6;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }
    .title-band .meta {
      font-size: 8pt;
      color: #6b7280;
      margin-top: 3px;
    }

    /* ─── PARTIES ─── */
    .parties {
      border: 1px solid #e5e7eb;
      border-radius: 4px;
      padding: 14px 18px;
      margin-bottom: 20px;
      font-size: 9.5pt;
      line-height: 1.7;
    }
    .parties strong { color: #5b21b6; }
    .parties hr { border: none; border-top: 1px solid #e5e7eb; margin: 10px 0; }

    /* ─── CLAUSES ─── */
    .clause {
      margin-bottom: 16px;
      page-break-inside: avoid;
    }
    .clause-title {
      font-size: 10pt;
      font-weight: 700;
      color: #5b21b6;
      border-left: 4px solid #8b5cf6;
      padding-left: 10px;
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    .clause-body {
      padding-left: 14px;
      font-size: 9.5pt;
      color: #374151;
    }
    .clause-body p { margin-bottom: 6px; }
    .clause-body ul { padding-left: 16px; margin: 4px 0 8px; }
    .clause-body li { margin-bottom: 3px; }

    /* ─── SIGNATURE BLOCK ─── */
    .signature-block {
      margin-top: 24px;
      border: 2px solid #8b5cf6;
      border-radius: 6px;
      padding: 18px 20px;
      page-break-inside: avoid;
    }
    .signature-block h3 {
      font-size: 11pt;
      font-weight: 700;
      color: #5b21b6;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .signature-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px 20px;
      font-size: 9pt;
      margin-bottom: 14px;
    }
    .signature-info span { color: #6b7280; }
    .signature-info strong { color: #1a1a1a; }
    .signature-canvas-area {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      margin-top: 10px;
    }
    .signature-canvas-area img {
      max-width: 300px;
      max-height: 100px;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      background: #fafafa;
      padding: 4px;
    }
    .signature-line {
      width: 300px;
      border-top: 1.5px solid #1a1a1a;
      margin-top: 6px;
    }
    .signature-label {
      font-size: 8pt;
      color: #6b7280;
      margin-top: 3px;
    }

    /* ─── TECHNICAL EVIDENCE ─── */
    .evidence {
      margin-top: 20px;
      background: #f3f4f6;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
      padding: 14px 18px;
      page-break-inside: avoid;
    }
    .evidence h4 {
      font-size: 9pt;
      font-weight: 700;
      color: #374151;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    .evidence table {
      width: 100%;
      border-collapse: collapse;
      font-size: 7.5pt;
      font-family: 'Courier New', monospace;
    }
    .evidence td {
      padding: 3px 6px;
      vertical-align: top;
      color: #374151;
    }
    .evidence td:first-child {
      font-weight: 700;
      color: #6b7280;
      white-space: nowrap;
      width: 130px;
    }
    .evidence .hash-value {
      word-break: break-all;
      color: #4f46e5;
    }

    /* ─── FOOTER ─── */
    .footer {
      margin-top: 16px;
      text-align: center;
      font-size: 7.5pt;
      color: #9ca3af;
      border-top: 1px solid #e5e7eb;
      padding-top: 8px;
    }

    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>

  <div class="header">
    <div class="header-left">
      ${displayName ? `<h1>${displayName.toUpperCase()}</h1>` : ""}
      ${displayLocation ? `<p>${displayLocation}</p>` : ""}
    </div>
    <div class="header-right">
      ${displayEmail ? `<div>${displayEmail}</div>` : ""}
      ${displayLinkedin ? `<div>${displayLinkedin}</div>` : ""}
      ${displayGithub ? `<div>${displayGithub}</div>` : ""}
    </div>
  </div>

  <div class="title-band">
    <h2>Contrato de Prestação de Serviços de Desenvolvimento${(proposal as any).title ? ` — ${(proposal as any).title}` : ""}</h2>
    <div class="meta">
      Cliente: <strong>${proposal.client_name}</strong> &nbsp;·&nbsp;
      Versão <strong>${contractVersion}</strong> &nbsp;·&nbsp;
      ${new Date(acceptanceData.accepted_at).toLocaleDateString("pt-BR")}
    </div>
  </div>

  <div class="parties">
    ${headerClean}
  </div>

  ${clausesHTML}

  <div class="signature-block">
    <h3>Assinatura Digital</h3>
    <div class="signature-info">
      <div><span>Assinado em:</span><br/><strong>${signedAt} (BRT)</strong></div>
      <div><span>Nome:</span><br/><strong>${acceptanceData.client_name}</strong></div>
      <div><span>Documento:</span><br/><strong>${acceptanceData.client_document}</strong></div>
      <div><span>E-mail:</span><br/><strong>${acceptanceData.client_email}</strong></div>
      ${acceptanceData.client_role ? `<div><span>Cargo/Função:</span><br/><strong>${acceptanceData.client_role}</strong></div>` : ""}
      ${acceptanceData.client_declaration ? `<div style="grid-column: span 2"><span>Declaração:</span><br/><strong>${acceptanceData.client_declaration}</strong></div>` : ""}
    </div>
    <div class="signature-canvas-area">
      <img src="${signatureDataUrl}" alt="Assinatura manuscrita do contratante" />
      <div class="signature-line"></div>
      <div class="signature-label">Assinatura Eletrônica — ${acceptanceData.client_name}</div>
    </div>
  </div>

  <div class="evidence">
    <h4>Evidências Técnicas de Autenticidade</h4>
    <table>
      <tr>
        <td>Hash SHA-256:</td>
        <td class="hash-value">${acceptanceData.content_hash ?? "—"}</td>
      </tr>
      <tr>
        <td>IP de Origem:</td>
        <td>${acceptanceData.ip_address ?? "N/A"}</td>
      </tr>
      <tr>
        <td>User-Agent:</td>
        <td>${acceptanceData.user_agent ?? "N/A"}</td>
      </tr>
      <tr>
        <td>Versão da Proposta:</td>
        <td>${acceptanceData.proposal_version ?? "1"}</td>
      </tr>
      <tr>
        <td>Ref. Interna:</td>
        <td>${contractId}</td>
      </tr>
      <tr>
        <td>Gerado em (UTC):</td>
        <td>${new Date(acceptanceData.accepted_at).toISOString()}</td>
      </tr>
    </table>
  </div>

  <div class="footer">
    Este documento é um contrato eletrônico com validade jurídica nos termos do Código Civil Brasileiro (Art. 107) e da
    Medida Provisória 2.200-2/2001. O hash SHA-256 acima garante a integridade do conteúdo assinado.
  </div>

</body>
</html>`;
}

export async function printContractPDF(
  proposal: ProposalData,
  acceptanceData: PDFAcceptanceData,
  signatureDataUrl: string,
  contactInfo?: ContactInfo,
  templateContent?: string,
): Promise<void> {
  const html = generateContractHTML(proposal, acceptanceData, signatureDataUrl, contactInfo, templateContent);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (!win) {
    URL.revokeObjectURL(url);
    throw new Error("Popup bloqueado. Permita popups para gerar o PDF.");
  }
  win.onload = () => {
    setTimeout(() => {
      win.print();
      URL.revokeObjectURL(url);
    }, 400);
  };
}
