/**
 * Geração do currículo em PDF, no clique (módulo carregado por `import()`: não pesa na página).
 * Mesmo método da v1 (`cvPDF.ts`): monta um HTML de uma coluna, sem tabelas nem imagens (legível
 * por sistemas de triagem, ATS), abre numa aba e chama a impressão do navegador, que salva em PDF.
 * Sem biblioteca: o peso é só este texto.
 */
import type { ResumeItem } from "../render/collections";

export interface ResumeDocument {
  name: string;
  jobTitle?: string;
  /** E-mail, telefone, perfis: uma linha de contato. */
  contact: string[];
  locale: string;
  items: ResumeItem[];
  /** Títulos das seções, por tipo de item, e o texto de "atual". */
  labels: Record<"experience" | "education" | "skill" | "certification" | "language" | "present", string> &
    Partial<Record<"volunteer" | "soft-skill", string>>;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function period(item: ResumeItem, present: string): string {
  if (!item.start && !item.end) return "";
  return `${item.start ?? ""} – ${item.end ?? present}`;
}

/** Texto rico (HTML) em texto de PDF legível por ATS: a lista vira lista, o resto, um parágrafo. */
function htmlDescription(raw: string): string {
  const strip = (s: string) => s.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
  const items = [...raw.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map((m) => strip(m[1] ?? "")).filter(Boolean);
  const text = strip(raw.replace(/<(ul|ol)[^>]*>[\s\S]*?<\/\1>/gi, " "));
  // O HTML já vem sanitizado; aqui ele vira texto, então as entidades voltam a ser escapadas.
  const unescape = (s: string) => s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");
  return `${text ? `<p>${esc(unescape(text))}</p>` : ""}${items.length ? `<ul>${items.map((i) => `<li>${esc(unescape(i))}</li>`).join("")}</ul>` : ""}`;
}

function description(text: string | undefined): string {
  if (!text) return "";
  if (/<[a-z][\s\S]*>/i.test(text)) return htmlDescription(text);
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  const bullets = lines.filter((l) => /^[-•]\s/.test(l));
  if (bullets.length && bullets.length === lines.length) return `<ul>${bullets.map((l) => `<li>${esc(l.replace(/^[-•]\s+/, ""))}</li>`).join("")}</ul>`;
  return `<p>${esc(lines.join(" "))}</p>`;
}

function section(title: string, body: string): string {
  return body ? `<div class="section"><h2>${esc(title)}</h2><hr/>${body}</div>` : "";
}

function entries(items: ResumeItem[], present: string): string {
  return items
    .map(
      (i) =>
        `<div class="entry"><div class="entry-header"><span class="entry-title">${esc([i.title, i.organization].filter(Boolean).join(" — "))}</span><span class="entry-period">${esc(period(i, present))}</span></div>${i.location ? `<p>${esc(i.location)}</p>` : ""}${description(i.description)}</div>`,
    )
    .join("");
}

/** HTML completo do currículo (função pura, testável sem navegador). */
export function buildResumeHtml(doc: ResumeDocument): string {
  const by = (kind: ResumeItem["kind"]) => doc.items.filter((i) => i.kind === kind);
  const skills = by("skill").map((i) => esc(i.title));
  const softSkills = by("soft-skill").map((i) => esc(i.title));
  const languages = by("language")
    .map((i) => `<p><strong>${esc(i.title)}</strong>${i.description ? `: ${esc(i.description)}` : ""}</p>`)
    .join("");
  const certs = by("certification")
    .map((i) => `<li>${esc([i.title, i.organization].filter(Boolean).join(" — "))}</li>`)
    .join("");
  return `<!DOCTYPE html>
<html lang="${esc(doc.locale)}">
<head>
<meta charset="UTF-8"/>
<title>${esc(doc.name)} — CV</title>
<style>
@page { size: A4; margin: 25mm; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; color: #111; background: #fff; line-height: 1.5; }
.header-name { font-size: 20pt; font-weight: bold; letter-spacing: .5px; text-transform: uppercase; }
.header-role { font-size: 12pt; font-style: italic; color: #333; margin-bottom: 5px; }
.header-contact { font-size: 10pt; color: #333; margin-bottom: 16px; }
.section { margin-bottom: 14px; }
.section h2 { font-size: 12pt; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2px; }
.section hr { border: none; border-top: 1.5px solid #111; margin-bottom: 7px; }
.entry { margin-bottom: 10px; }
.entry-header { display: flex; justify-content: space-between; align-items: baseline; }
.entry-title { font-weight: bold; font-size: 10.5pt; }
.entry-period { font-size: 10pt; font-style: italic; color: #444; white-space: nowrap; margin-left: 8px; }
p { margin-top: 3px; font-size: 10.5pt; }
ul { list-style-type: disc; padding-left: 18px; margin-top: 3px; }
li { font-size: 10.5pt; margin-bottom: 2px; }
</style>
</head>
<body>
<div class="header-name">${esc(doc.name)}</div>
${doc.jobTitle ? `<div class="header-role">${esc(doc.jobTitle)}</div>` : ""}
<div class="header-contact">${doc.contact.map(esc).join(" &nbsp;|&nbsp; ")}</div>
${section(doc.labels.skill, skills.length ? `<p>${skills.join(", ")}</p>` : "")}
${section(doc.labels["soft-skill"] ?? doc.labels.skill, softSkills.length ? `<p>${softSkills.join(", ")}</p>` : "")}
${section(doc.labels.experience, entries(by("experience"), doc.labels.present))}
${section(doc.labels.education, entries(by("education"), doc.labels.present))}
${section(doc.labels.certification, certs ? `<ul>${certs}</ul>` : "")}
${section(doc.labels.language, languages)}
${section(doc.labels.volunteer ?? doc.labels.experience, entries(by("volunteer"), doc.labels.present))}
</body>
</html>`;
}

/**
 * Escreve o documento na aba já aberta no clique (o navegador só libera a aba se ela
 * nasce no gesto do usuário) e abre a impressão.
 */
export function printResume(doc: ResumeDocument, target: Window): void {
  target.document.open();
  target.document.write(buildResumeHtml(doc));
  target.document.close();
  target.focus();
  setTimeout(() => target.print(), 400);
}
