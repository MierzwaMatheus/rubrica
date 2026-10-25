import type { Lang } from "../i18n/routes";

/**
 * Página /novidades: lê o CHANGELOG.md da raiz do repositório no build.
 * Cada "## <versão> — <data>" vira uma versão com âncora própria.
 */

export interface ChangelogVersion {
  /** "1.5.0" ou uma faixa, como "0.2.0 – 0.2.4". */
  version: string;
  /** "2026-10-25", uma faixa ("2026-05-22 a 2026-05-23") ou vazio. */
  date: string;
  /** Âncora da versão: "v1-5-0". */
  id: string;
  /** Markdown da versão, sem o título. */
  body: string;
}

export interface Changelog {
  /** Texto entre o "# Changelog" e a primeira versão. */
  intro: string;
  versions: ChangelogVersion[];
}

const DATE_SEPARATOR = " — ";

export function parseChangelog(md: string): Changelog {
  const [head, ...sections] = md.split(/^## /m);
  const intro = head.replace(/^# .*$/m, "").trim();

  const versions = sections.map((section) => {
    const newline = section.indexOf("\n");
    const title = (newline === -1 ? section : section.slice(0, newline)).trim();
    const body = newline === -1 ? "" : section.slice(newline + 1).trim();
    const cut = title.lastIndexOf(DATE_SEPARATOR);
    const version = cut === -1 ? title : title.slice(0, cut).trim();
    const date = cut === -1 ? "" : title.slice(cut + DATE_SEPARATOR.length).trim();
    return { version, date, id: toId(version), body };
  });

  return { intro, versions };
}

function toId(version: string): string {
  const parts = version.match(/[0-9a-z]+/gi) ?? [];
  return `v${parts.join("-").toLowerCase()}`;
}

/** Links relativos do changelog (./docs/x.md) apontam para o arquivo no GitHub. */
export function resolveLinks(md: string, repo: string): string {
  return md.replace(/\]\((?![a-z][a-z0-9+.-]*:|#|\/)(?:\.\/)?([^)\s]+)\)/gi, `](${repo}/blob/main/$1)`);
}

const MONTHS_EN = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const MONTHS_PT = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

/** "2026-10-25" vira "25 de outubro de 2026" (ou "October 25, 2026"); o resto do texto fica igual. */
export function formatDates(text: string, lang: Lang): string {
  return text.replace(/(\d{4})-(\d{2})-(\d{2})/g, (_, y: string, m: string, d: string) => {
    const day = Number(d);
    const month = Number(m) - 1;
    return lang === "en" ? `${MONTHS_EN[month]} ${day}, ${y}` : `${day} de ${MONTHS_PT[month]} de ${y}`;
  });
}
