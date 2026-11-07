import type { SidebarContactInfo } from "@/repositories/interfaces/SidebarRepository";
import type { ResumeItem } from "@/repositories/interfaces/ResumeRepository";
import type { Project } from "@/repositories/interfaces/PortfolioRepository";

type Locale = "pt-BR" | "en-US";
type TranslatedResumeItem = ResumeItem & { translatedContent?: any };

const LABELS = {
  "pt-BR": {
    summary: "Resumo Profissional",
    skills: "Habilidades Técnicas",
    softSkills: "Soft Skills",
    experience: "Experiência Profissional",
    education: "Educação",
    courses: "Cursos e Certificações",
    projects: "Projetos",
    languages: "Idiomas",
    volunteer: "Trabalho Voluntário",
    technologies: "Tecnologias",
  },
  "en-US": {
    summary: "Professional Summary",
    skills: "Technical Skills",
    softSkills: "Soft Skills",
    experience: "Professional Experience",
    education: "Education",
    courses: "Courses & Certifications",
    projects: "Projects",
    languages: "Languages",
    volunteer: "Volunteer Work",
    technologies: "Technologies",
  },
};

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function htmlToAtsHtml(raw: string): string {
  const liRegex = /<li[^>]*>([\s\S]*?)<\/li>/gi;
  const liMatches: RegExpExecArray[] = [];
  let m: RegExpExecArray | null;
  while ((m = liRegex.exec(raw)) !== null) liMatches.push(m);
  if (liMatches.length > 0) {
    const items = liMatches.map(match => `<li>${match[1].replace(/<[^>]+>/g, "").trim()}</li>`).join("");
    return `<ul>${items}</ul>`;
  }
  const plain = raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return plain ? `<p>${esc(plain)}</p>` : "";
}

function descriptionToHtml(text: string): string {
  if (!text) return "";
  if (/<[a-z][\s\S]*>/i.test(text)) return htmlToAtsHtml(text);
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const items = lines.filter(l => l.startsWith("- ") || l.startsWith("• "));
  if (items.length > 0) {
    const bullets = items.map(l => `<li>${esc(l.replace(/^[-•]\s*/, ""))}</li>`).join("");
    return `<ul>${bullets}</ul>`;
  }
  return `<p>${esc(lines.join(" "))}</p>`;
}

function stripHtml(raw: string): string {
  return raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function sectionHtml(title: string, body: string): string {
  if (!body.trim()) return "";
  return `
    <div class="section">
      <h2>${esc(title)}</h2>
      <hr/>
      ${body}
    </div>`;
}

function summaryHtml(raw: string): string {
  if (!raw) return "";
  const text = /<[a-z][\s\S]*>/i.test(raw) ? stripHtml(raw) : raw.trim();
  return `<p class="summary-text">${esc(text)}</p>`;
}

function skillsHtml(items: TranslatedResumeItem[]): string {
  const names = items.map(item => {
    const c = item.translatedContent ?? item.content ?? {};
    return c.name ? esc(c.name) : "";
  }).filter(Boolean);
  if (!names.length) return "";
  return `<p class="skills-list">${names.join(", ")}</p>`;
}

function softSkillsHtml(items: TranslatedResumeItem[]): string {
  const texts = items.map(item => {
    const c = item.translatedContent ?? item.content ?? {};
    if (typeof c === "string") return esc(c);
    if (c.text) return esc(c.text);
    return "";
  }).filter(Boolean);
  if (!texts.length) return "";
  return `<p class="skills-list">${texts.join(", ")}</p>`;
}

function experienceHtml(items: TranslatedResumeItem[]): string {
  return items.map(item => {
    const c = item.translatedContent ?? item.content ?? {};
    const company = c.company ? esc(c.company) : "";
    const role = c.role ? esc(c.role) : "";
    const period = c.period ? esc(c.period) : "";
    const description = c.description ? descriptionToHtml(c.description) : "";
    return `
      <div class="entry">
        <div class="entry-header">
          <span class="entry-title">${role}${company && role ? " — " : ""}${company}</span>
          <span class="entry-period">${period}</span>
        </div>
        ${description}
      </div>`;
  }).join("");
}

function educationHtml(items: TranslatedResumeItem[]): string {
  return items.map(item => {
    const c = item.translatedContent ?? item.content ?? {};
    const institution = c.institution ? esc(c.institution) : "";
    const degree = c.degree ? esc(c.degree) : "";
    const period = c.period ? esc(c.period) : "";
    const description = c.description ? descriptionToHtml(c.description) : "";
    return `
      <div class="entry">
        <div class="entry-header">
          <span class="entry-title">${degree}${institution && degree ? " — " : ""}${institution}</span>
          <span class="entry-period">${period}</span>
        </div>
        ${description}
      </div>`;
  }).join("");
}

function simpleListHtml(items: TranslatedResumeItem[]): string {
  const texts = items.map(item => {
    const c = item.translatedContent ?? item.content ?? {};
    if (typeof c === "string") return esc(c);
    if (c.text) return esc(c.text);
    return "";
  }).filter(Boolean);
  if (!texts.length) return "";
  return `<ul>${texts.map(t => `<li>${t}</li>`).join("")}</ul>`;
}

function languagesHtml(items: TranslatedResumeItem[]): string {
  return items.map(item => {
    const c = item.translatedContent ?? item.content ?? {};
    const name = c.name ? esc(c.name) : "";
    const level = c.level ? esc(c.level) : "";
    return `<p><strong>${name}</strong>${level ? ": " + level : ""}</p>`;
  }).join("");
}

function projectsHtml(projects: Project[], label: string): string {
  return projects.map(p => {
    const tags = p.tags?.length
      ? `<p class="entry-tech"><strong>${label}:</strong> ${p.tags.map(esc).join(", ")}</p>`
      : "";
    return `
      <div class="entry">
        <div class="entry-header">
          <span class="entry-title">${esc(p.title)}</span>
        </div>
        ${p.description ? `<p>${esc(p.description)}</p>` : ""}
        ${tags}
      </div>`;
  }).join("");
}

function buildContactLine(ci: SidebarContactInfo): string {
  const parts: string[] = [];
  if (ci.email) parts.push(esc(ci.email));
  if (ci.phone) parts.push(esc(ci.phone));
  if (ci.linkedin_url) parts.push(esc(ci.linkedin_url.replace(/^https?:\/\/(www\.)?/, "")));
  if (ci.github_url) parts.push(esc(ci.github_url.replace(/^https?:\/\/(www\.)?/, "")));
  return parts.join(" &nbsp;|&nbsp; ");
}

export function generateCV(
  contactInfo: SidebarContactInfo,
  resumeItems: (ResumeItem & { translatedContent?: any })[],
  projects: Project[],
  locale: Locale,
  summary: string,
  topProjectsCount = 3,
  /**
   * Aba já aberta no clique (para os dados chegarem depois sem o navegador bloquear o
   * pop-up). Sem ela, abre uma aba nova aqui.
   */
  target?: Window | null
): void {
  const L = LABELS[locale];
  const lang = locale === "pt-BR" ? "pt-BR" : "en-US";

  const byType = (type: string) =>
    resumeItems.filter(i => i.type === type).sort((a, b) => a.order_index - b.order_index);

  const topProjects = projects.slice(0, topProjectsCount);
  const contactLine = buildContactLine(contactInfo);

  const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8"/>
  <title>${esc(contactInfo.name)} — CV</title>
  <style>
    /* 1 inch margins as per ATS guide */
    @page { size: A4; margin: 25mm; }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 11pt;
      color: #111;
      background: #fff;
      line-height: 1.5;
    }

    /* ── HEADER ── */
    .header-name {
      font-size: 20pt;
      font-weight: bold;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      text-align: left;
      margin-bottom: 2px;
    }

    .header-role {
      font-size: 12pt;
      font-style: italic;
      color: #333;
      margin-bottom: 5px;
    }

    .header-contact {
      font-size: 10pt;
      color: #333;
      margin-bottom: 16px;
    }

    /* ── SECTIONS ── */
    .section {
      margin-bottom: 14px;
    }

    /* 12pt headings as per ATS guide */
    .section h2 {
      font-size: 12pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 2px;
    }

    .section hr {
      border: none;
      border-top: 1.5px solid #111;
      margin-bottom: 7px;
    }

    /* ── SUMMARY ── */
    .summary-text {
      font-size: 10.5pt;
      color: #222;
      line-height: 1.55;
    }

    /* ── SKILLS ── */
    .skills-list {
      font-size: 10.5pt;
      color: #222;
      line-height: 1.5;
    }

    /* ── ENTRIES (experience / education / projects) ── */
    .entry {
      margin-bottom: 10px;
    }

    .entry-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
    }

    .entry-title {
      font-weight: bold;
      font-size: 10.5pt;
    }

    /* Italic dates as per ATS guide */
    .entry-period {
      font-size: 10pt;
      font-style: italic;
      color: #444;
      white-space: nowrap;
      margin-left: 8px;
    }

    .entry-tech {
      font-size: 10pt;
      color: #333;
      margin-top: 2px;
    }

    p {
      margin-top: 3px;
      font-size: 10.5pt;
    }

    /* Simple bullet points (• via disc) */
    ul {
      list-style-type: disc;
      padding-left: 18px;
      margin-top: 3px;
    }

    li {
      font-size: 10.5pt;
      margin-bottom: 2px;
      text-align: left;
    }

    @media print {
      body { margin: 0; }
    }
  </style>
</head>
<body>

  <!-- CONTACT INFORMATION (in body, never header/footer) -->
  <div class="header-name">${esc(contactInfo.name)}</div>
  <div class="header-role">${esc(contactInfo.role)}</div>
  <div class="header-contact">${contactLine}</div>

  <!-- ORDER per ATS guide: Summary → Skills → Soft Skills → Experience → Education → Courses → Projects → Languages → Volunteer -->

  ${summary ? sectionHtml(L.summary, summaryHtml(summary)) : ""}
  ${sectionHtml(L.skills, skillsHtml(byType("skill")))}
  ${sectionHtml(L.softSkills, softSkillsHtml(byType("soft_skill")))}
  ${sectionHtml(L.experience, experienceHtml(byType("experience")))}
  ${sectionHtml(L.education, educationHtml(byType("education")))}
  ${sectionHtml(L.courses, simpleListHtml(byType("course")))}
  ${topProjects.length ? sectionHtml(L.projects, projectsHtml(topProjects, L.technologies)) : ""}
  ${sectionHtml(L.languages, languagesHtml(byType("language")))}
  ${sectionHtml(L.volunteer, simpleListHtml(byType("volunteer")))}

</body>
</html>`;

  if (target && !target.closed) {
    target.document.open();
    target.document.write(html);
    target.document.close();
    target.focus();
    setTimeout(() => target.print(), 400);
    return;
  }

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (!win) {
    URL.revokeObjectURL(url);
    throw new Error("Popup bloqueado. Permita popups para gerar o CV.");
  }
  win.onload = () => {
    setTimeout(() => {
      win.print();
      URL.revokeObjectURL(url);
    }, 400);
  };
}
