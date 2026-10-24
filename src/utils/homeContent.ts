import type { Project } from "@/repositories/interfaces/PortfolioRepository";

/** Projetos que aparecem na home: só os que têm página de case, na ordem do admin. */
export function selectFeaturedCases(projects: Project[], limit = 3): Project[] {
  return projects.filter(p => p.slug && p.case_study).slice(0, limit);
}

export interface TextSegment {
  text: string;
  highlight: boolean;
}

// Número seguido de uma unidade que indica resultado ("50 skills", "3 horas").
// Anos e versões soltas ("2026", "2.0") não entram porque não têm unidade.
const UNITS = [
  "skills", "automações", "áreas", "chamados", "horas", "minutos", "meses", "anos",
  "iniciativas", "pessoas", "times", "sistemas", "projetos",
  "automations", "areas", "tickets", "hours", "minutes", "months", "years",
  "initiatives", "people", "teams", "systems", "projects",
];
const NUMBER_WITH_UNIT = new RegExp(
  `(?<![\\p{L}\\d.])~?\\d+(?:[.,]\\d+)*\\+?\\s(?:${UNITS.join("|")})(?![\\p{L}])`,
  "gu",
);

/** Quebra o texto em trechos, marcando os números com unidade para destaque visual. */
export function highlightNumbers(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let last = 0;
  const pattern = new RegExp(NUMBER_WITH_UNIT.source, NUMBER_WITH_UNIT.flags);
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    const start = match.index;
    if (start > last) segments.push({ text: text.slice(last, start), highlight: false });
    segments.push({ text: match[0], highlight: true });
    last = start + match[0].length;
  }
  if (last < text.length) segments.push({ text: text.slice(last), highlight: false });
  return segments;
}
