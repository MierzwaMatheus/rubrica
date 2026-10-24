/**
 * Monografia — peças compartilhadas pelo layout: textos próprios (pt-BR e en-US), a folha de
 * estilo do livro, a grade de 3 colunas (rótulo | leitura | margem), linhas pontilhadas,
 * citações, capítulos e pequenos utilitários (numerais romanos, fólios, tempo de leitura).
 *
 * Todas as cores vêm do esquema (`var(--bg)`, `var(--primary)`…). As variáveis próprias do
 * layout começam com `--monograph-` e são derivadas do esquema.
 */
import type { ReactNode } from "react";
import { useI18n } from "@/i18n/context/I18nContext";
import { highlightNumbers } from "@/utils/homeContent";
import { useResume } from "@/hooks/useResume";
import { resumeRepository } from "@/repositories/instances";
import { listCategories } from "@/utils/portfolioContent";
import type { Project } from "@/repositories/interfaces/PortfolioRepository";

// ---- textos próprios do layout ---------------------------------------------------------

const TEXT = {
  "pt-BR": {
    skip: "Pular para o conteúdo",
    contents: "Sumário",
    openContents: "Abrir o sumário",
    closeContents: "Fechar o sumário",
    numbers: "Em números",
    preface: "Prefácio",
    crafts: "Ofícios",
    reception: "Recepção",
    correspondence: "Correspondência",
    chapter: "Capítulo",
    part: "Parte",
    page: "p.",
    notes: "Notas",
    currently: "Hoje",
    at: "em",
    trainedIn: "Formação",
    theses: "Teses",
    qa: "Perguntas e respostas",
    question: "P.",
    answer: "R.",
    plates: "Pranchas",
    plate: "Prancha",
    interests: "Interesses",
    essays: "Ensaios",
    works: "Obras",
    allParts: "Todas as partes",
    parts: "Partes",
    noProjects: "Nenhum projeto publicado ainda.",
    readCase: "ler o case",
    viewProject: "ver o projeto",
    externalLink: "(abre em outra aba)",
    rss: "Assinar por RSS",
    skills: "Habilidades",
    record: "Registro",
    otherNotes: "Outras notas",
    and: "e",
    colophon: (name: string, year: number) =>
      `Composto para a web${name ? ` por ${name}` : ""}, ${year}.`,
    end: "fim",
    writeTo: "Escreva para",
  },
  "en-US": {
    skip: "Skip to content",
    contents: "Contents",
    openContents: "Open the contents",
    closeContents: "Close the contents",
    numbers: "By the numbers",
    preface: "Preface",
    crafts: "Crafts",
    reception: "Reception",
    correspondence: "Correspondence",
    chapter: "Chapter",
    part: "Part",
    page: "p.",
    notes: "Notes",
    currently: "Currently",
    at: "at",
    trainedIn: "Education",
    theses: "Theses",
    qa: "Questions and answers",
    question: "Q.",
    answer: "A.",
    plates: "Plates",
    plate: "Plate",
    interests: "Interests",
    essays: "Essays",
    works: "Works",
    allParts: "All parts",
    parts: "Parts",
    noProjects: "No projects published yet.",
    readCase: "read the case",
    viewProject: "view the project",
    externalLink: "(opens in a new tab)",
    rss: "Subscribe via RSS",
    skills: "Skills",
    record: "Record",
    otherNotes: "Other notes",
    and: "and",
    colophon: (name: string, year: number) =>
      `Typeset for the web${name ? ` by ${name}` : ""}, ${year}.`,
    end: "the end",
    writeTo: "Write to",
  },
} as const;

export type MonographText = (typeof TEXT)[keyof typeof TEXT];

/** Textos próprios do layout no idioma atual (cai para o português). */
export function useMonographText(): MonographText {
  const { locale } = useI18n();
  return locale === "en-US" ? TEXT["en-US"] : TEXT["pt-BR"];
}

/** Feed RSS gerado no build (`scripts/generate-rss-feed.ts`): é arquivo estático, não rota do app. */
export const RSS_FEED_URL = "/rss.xml";

// ---- utilitários ---------------------------------------------------------------------

const ROMAN: Array<[number, string]> = [
  [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"],
  [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
];

/** Numeral romano (1 → "I"). Zero ou negativo devolve string vazia. */
export function toRoman(n: number): string {
  let rest = Math.floor(n);
  let out = "";
  for (const [value, glyph] of ROMAN) {
    while (rest >= value) {
      out += glyph;
      rest -= value;
    }
  }
  return out;
}

/**
 * Fólios decorativos do sumário: cada item "ocupa" páginas proporcionais ao tamanho do texto,
 * e o sumário mostra em que página ele começa. Determinístico: o mesmo projeto cai na mesma
 * página na Home e no Portfólio.
 */
export function folios(lengths: number[], firstPage = 3): number[] {
  const pages: number[] = [];
  let page = firstPage;
  for (const len of lengths) {
    pages.push(page);
    page += Math.max(2, Math.ceil(len / 500));
  }
  return pages;
}

/**
 * Ordem do livro: os projetos agrupados por categoria (as "Partes", na ordem em que aparecem)
 * e, no fim, os sem categoria. Numerais e fólios seguem esta ordem na Home e no Portfólio.
 */
export function bookOrder(projects: Project[]): Project[] {
  const categories = listCategories(projects);
  return [
    ...categories.flatMap((c) => projects.filter((p) => p.category?.trim() === c)),
    ...projects.filter((p) => !p.category?.trim()),
  ];
}

/** Numeral e página de cada projeto no sumário, pela ordem do livro. */
export function projectFolios(projects: Project[]): Map<Project["id"], { n: number; page: number }> {
  const ordered = bookOrder(projects);
  const pages = folios(ordered.map((p) => (p.long_description?.length ?? 0) + (p.description?.length ?? 0)));
  return new Map(ordered.map((p, i) => [p.id, { n: i + 1, page: pages[i] }]));
}

/** Remove HTML e conta palavras para o tempo de leitura (mínimo 1 minuto). */
export function readingMinutes(content: string): number {
  const words = content.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

/** Data por extenso no idioma atual; string vazia se a data for inválida. */
export function formatLongDate(value: string | undefined, locale: string): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
}

/** Ano de uma data (para a margem); string vazia se inválida. */
export function yearOf(value: string | undefined): string {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : String(d.getFullYear());
}

/** Junta itens como numa frase: "a, b e c". */
export function joinAsSentence(items: string[], and: string): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} ${and} ${items[items.length - 1]}`;
}

/** Texto de um item simples do currículo (curso, idioma, soft skill…), venha como string ou objeto. */
export function itemText(content: unknown): string {
  if (typeof content === "string") return content;
  if (content && typeof content === "object") {
    const c = content as { text?: unknown; name?: unknown };
    if (typeof c.text === "string") return c.text;
    if (typeof c.name === "string") return c.name;
  }
  return "";
}

// ---- componentes ------------------------------------------------------------------------

/** Parágrafo com os números de resultado em destaque (negrito discreto, sem caixa). */
export function Highlighted({ text }: { text: string }) {
  return (
    <>
      {highlightNumbers(text).map((seg, i) =>
        seg.highlight ? (
          <strong key={i} className="mn-hl">
            {seg.text}
          </strong>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </>
  );
}

/**
 * Seção do livro na grade de 3 colunas: rótulo à direita (h2), coluna de leitura e margem.
 * Os filhos devem ser `MnMain` (coluna de leitura) e `MnNote` (margem); cada `MnNote` fica na
 * mesma linha do `MnMain` anterior. No celular, a margem vira nota no fluxo do texto.
 */
export function MnSection({
  id,
  label,
  sub,
  children,
  className,
}: {
  id: string;
  label: ReactNode;
  sub?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const headingId = `${id}-titulo`;
  return (
    <section id={id} className={`mn-s${className ? ` ${className}` : ""}`} aria-labelledby={headingId}>
      <h2 className="mn-k" id={headingId}>
        {label}
        {sub ? <small>{sub}</small> : null}
      </h2>
      {children}
    </section>
  );
}

export function MnMain({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={`mn-m${className ? ` ${className}` : ""}`}>{children}</div>;
}

export function MnNote({ children, label, className }: { children: ReactNode; label?: string; className?: string }) {
  return (
    <aside className={`mn-n${className ? ` ${className}` : ""}`} aria-label={label}>
      {children}
    </aside>
  );
}

/** Linha de sumário: texto ……… valor. */
export function Leader({
  children,
  value,
  big = false,
}: {
  children: ReactNode;
  value?: ReactNode;
  big?: boolean;
}) {
  return (
    <span className={`mn-ld${big ? " mn-ld--big" : ""}`}>
      <span className="mn-ld-t">{children}</span>
      <span className="mn-ld-dots" aria-hidden="true" />
      {value !== undefined && value !== "" ? <span className="mn-ld-v">{value}</span> : null}
    </span>
  );
}

/**
 * Notas de margem do prefácio, tiradas do currículo: o cargo atual e a formação.
 * Lista vazia quando o currículo não tem esses itens.
 */
export function usePrefaceNotes(): string[] {
  const tx = useMonographText();
  const { getItemsByType } = useResume(resumeRepository);
  const job = getItemsByType("experience")[0]?.translatedContent as
    | { role?: string; company?: string; period?: string }
    | undefined;
  const school = getItemsByType("education")[0]?.translatedContent as
    | { degree?: string; institution?: string }
    | undefined;
  return [
    job?.role
      ? `${tx.currently}: ${job.role}${job.company ? ` ${tx.at} ${job.company}` : ""}${job.period ? ` (${job.period})` : ""}.`
      : "",
    school?.degree ? `${tx.trainedIn}: ${school.degree}${school.institution ? `, ${school.institution}` : ""}.` : "",
  ].filter(Boolean);
}

/**
 * Prefácio: parágrafos com capitular e números em destaque, chamadas de nota (¹ ²) e as notas
 * na margem. A nota n vai no parágrafo n; as que sobram ficam no último.
 */
export function MnPreface({
  id,
  label,
  sub,
  paragraphs,
  notes,
  after,
}: {
  id: string;
  label: ReactNode;
  sub?: ReactNode;
  paragraphs: string[];
  notes: string[];
  after?: ReactNode;
}) {
  const tx = useMonographText();
  if (!paragraphs.length) return null;
  const last = paragraphs.length - 1;
  const notesOf = (i: number) => notes.map((_, n) => n).filter((n) => (i === last ? n >= i : n === i));
  return (
    <MnSection id={id} label={label} sub={sub}>
      <MnMain>
        {paragraphs.map((para, i) => (
          <p key={i} className={`mn-p${i === 0 ? " mn-dc" : ""}`}>
            <Highlighted text={para} />
            {notesOf(i).map((n) => (
              <sup key={n} className="mn-fn">
                {n + 1}
              </sup>
            ))}
          </p>
        ))}
        {after}
      </MnMain>
      {notes.length > 0 && (
        <MnNote label={tx.notes}>
          {notes.map((note, n) => (
            <p key={n}>
              <sup>{n + 1}</sup> {note}
            </p>
          ))}
        </MnNote>
      )}
    </MnSection>
  );
}

/** Números de destaque como linhas pontilhadas: rótulo ……… número. Some sem números. */
export function MnNumbers({ items }: { items: Array<{ label: string; value: string }> }) {
  if (!items.length) return null;
  return (
    <dl className="mn-nums">
      {items.map((m) => (
        <div key={`${m.label}-${m.value}`} className="mn-ld">
          <dt>
            <span className="mn-ld-t">{m.label}</span>
            <span className="mn-ld-dots" aria-hidden="true" />
          </dt>
          <dd className="mn-ld-v">{m.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Citação com aspas grandes na margem. */
export function MnQuote({ text, name, role }: { text: string; name: string; role?: string }) {
  return (
    <figure className="mn-q">
      <blockquote>
        <p>{text}</p>
      </blockquote>
      <figcaption>
        — {name}
        {role ? `, ${role}` : ""}
      </figcaption>
    </figure>
  );
}

/** Abertura de capítulo das páginas internas: "Capítulo II", título, fio e subtítulo itálico. */
export function MnChapter({
  number,
  title,
  dek,
  children,
}: {
  number: number;
  title: ReactNode;
  dek?: ReactNode;
  children?: ReactNode;
}) {
  const tx = useMonographText();
  return (
    <header className="mn-title mn-title--ch">
      <p className="mn-sc mn-ch-n">
        {tx.chapter} {toRoman(number)}
      </p>
      <h1>{title}</h1>
      <hr aria-hidden="true" />
      {dek ? <p className="mn-dek">{dek}</p> : null}
      {children}
    </header>
  );
}

/** Ponto separador entre ações em versalete. */
export function Dot() {
  return (
    <span className="mn-sep" aria-hidden="true">
      ·
    </span>
  );
}

// ---- folha de estilo ---------------------------------------------------------------------

/**
 * O livro inteiro numa folha só (renderizada uma vez pelo Layout). Versalete é simulado com
 * caixa-alta pequena e espaçada, e a capitular usa `initial-letter` quando o navegador tem:
 * os dois funcionam em Fraunces e em fontes sem serifa.
 */
export const MONOGRAPH_CSS = `
.mn-root {
  --monograph-dots: color-mix(in srgb, var(--text-muted) 75%, transparent);
  --monograph-wash: color-mix(in srgb, var(--primary) 7%, var(--bg));
  --monograph-head: 57px;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-sans);
  font-size: 16px;
  line-height: 1.6;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  overflow-x: clip;
  font-feature-settings: "kern", "liga";
}
.mn-root main { flex: 1; }
.mn-root main:focus { outline: none; }
.mn-root [id] { scroll-margin-top: calc(var(--monograph-head) + 16px); }
.mn-root a { color: inherit; }
.mn-root :where(a, button):focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 3px;
  border-radius: 2px;
}
.mn-root h1, .mn-root h2, .mn-root h3 { color: var(--text-strong); }
.mn-root p { margin: 0; }
.mn-skip {
  position: absolute; left: 12px; top: -80px; z-index: 70;
  background: var(--primary); color: var(--on-primary);
  padding: 8px 14px; font-size: 13px; text-decoration: none;
}
.mn-skip:focus { top: 12px; }

/* versalete simulado: funciona em qualquer fonte */
.mn-sc { text-transform: uppercase; letter-spacing: .14em; font-size: 12px; font-weight: 500; }
.mn-hl { font-weight: 650; color: var(--text-strong); }
.mn-sep { color: var(--text-muted); padding: 0 2px; }
.mn-muted { color: var(--text-muted); }
.mn-it { font-style: italic; }

/* ---- cabeçalho corrido ---- */
.mn-run {
  position: sticky; top: 0; z-index: 50;
  background: var(--bg);
  border-bottom: 1px solid var(--line);
}
.mn-run-in {
  max-width: 1180px; margin: 0 auto;
  min-height: var(--monograph-head);
  display: flex; align-items: center; justify-content: space-between; gap: 20px;
  padding: 0 32px;
  font-size: 11px; letter-spacing: .14em; text-transform: uppercase;
  color: var(--text-muted);
}
.mn-run-id { display: flex; align-items: baseline; gap: 8px; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mn-run-id a { text-decoration: none; color: var(--text); font-weight: 600; }
.mn-run-id a:hover { color: var(--primary); }
.mn-run-sec { font-style: italic; text-transform: none; letter-spacing: .02em; font-size: 13px; overflow: hidden; text-overflow: ellipsis; }
.mn-run-tools { display: flex; align-items: center; gap: 18px; flex: none; }
.mn-run-nav ul { display: flex; gap: 18px; list-style: none; margin: 0; padding: 0; }
.mn-run-nav a { text-decoration: none; padding: 6px 0; transition: color .15s ease; }
.mn-run-nav a:hover { color: var(--text); }
.mn-run-nav a[aria-current="page"] { color: var(--primary); text-decoration: underline; text-underline-offset: 6px; text-decoration-thickness: 1px; }
.mn-run-mode { color: var(--text-muted); padding: 6px !important; margin: -6px; transition: color .15s ease; }
.mn-run-mode:hover { color: var(--primary); }
.mn-run-btn {
  display: none; align-items: center; gap: 8px;
  background: none; border: 0; padding: 6px 0; cursor: pointer;
  font: inherit; letter-spacing: inherit; text-transform: inherit; color: var(--text);
}
.mn-toc {
  border-top: 1px solid var(--line);
  padding: 18px 20px 24px;
  background: var(--bg);
}
.mn-toc ol { list-style: none; margin: 0 auto; padding: 0; max-width: 520px; display: flex; flex-direction: column; gap: 4px; }
.mn-toc a { display: block; text-decoration: none; padding: 8px 0; font-size: 18px; }
.mn-toc a[aria-current="page"] { color: var(--primary); }
.mn-toc em { font-style: normal; color: var(--primary); margin-right: 6px; }
@media (max-width: 899px) {
  .mn-run-in { padding: 0 20px; }
  .mn-run-nav { display: none; }
  .mn-run-btn { display: inline-flex; }
}
@media (min-width: 900px) { .mn-toc { display: none; } }

/* ---- folha de rosto ---- */
.mn-title {
  text-align: center;
  padding: 96px 24px 80px;
  border-bottom: 3px double var(--line);
  display: flex; flex-direction: column; align-items: center; gap: 16px;
}
.mn-title--end { border-bottom: 0; padding-bottom: 64px; }
.mn-av { font-style: italic; color: var(--text-muted); font-size: 16px; }
.mn-title h1 {
  margin: 0;
  font-size: clamp(46px, 9vw, 108px);
  line-height: .98; letter-spacing: -.02em; font-weight: 600;
  max-width: 14ch; text-wrap: balance; overflow-wrap: anywhere;
}
.mn-title--ch h1 { font-size: clamp(40px, 7vw, 84px); max-width: 16ch; }
.mn-title h2 {
  margin: 0;
  font-size: clamp(32px, 4.6vw, 52px);
  line-height: 1.08; font-weight: 600; letter-spacing: -.01em;
  max-width: 18ch; text-wrap: balance;
}
.mn-title hr { width: 80px; border: 0; border-top: 1px solid var(--text); margin: 6px 0; }
.mn-role { color: var(--text); }
.mn-ch-n { color: var(--primary); }
.mn-dek { font-style: italic; font-size: clamp(20px, 2.4vw, 26px); line-height: 1.35; max-width: 30ch; text-wrap: balance; }
.mn-title--ch .mn-dek { max-width: 40ch; font-size: clamp(18px, 2vw, 22px); color: var(--text-muted); }
.mn-desc { color: var(--text-muted); max-width: 520px; font-size: 16px; }
.mn-links {
  display: flex; flex-wrap: wrap; align-items: baseline; justify-content: center;
  gap: 8px 12px; margin-top: 10px;
}
.mn-links--left { justify-content: flex-start; margin-top: 6px; }

/* ação em versalete: botão que parece link de livro */
.mn-act {
  display: inline-flex; align-items: baseline; gap: 6px;
  background: none; border: 0; padding: 4px 0; margin: 0; cursor: pointer;
  font: inherit; font-size: 12px; font-weight: 500; letter-spacing: .14em; text-transform: uppercase;
  color: var(--text);
  text-decoration: underline; text-decoration-color: var(--primary);
  text-decoration-thickness: 1px; text-underline-offset: 5px;
  transition: color .15s ease, text-decoration-thickness .15s ease;
}
.mn-act:hover { color: var(--primary); text-decoration-thickness: 2px; }
.mn-act:disabled { opacity: .5; cursor: not-allowed; }

/* botões da correspondência */
.mn-btns { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; margin-top: 8px; }
.mn-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  border: 1px solid var(--text); background: transparent; color: var(--text);
  padding: 11px 20px; cursor: pointer;
  font: inherit; font-size: 12px; font-weight: 500; letter-spacing: .14em; text-transform: uppercase;
  transition: background-color .15s ease, color .15s ease, border-color .15s ease;
}
.mn-btn:hover { background: var(--subtle); }
.mn-btn--pri { background: var(--primary); color: var(--on-primary); border-color: var(--primary); }
.mn-btn--pri:hover { background: color-mix(in srgb, var(--primary) 86%, var(--text)); }
.mn-colo { font-style: italic; font-size: 13px; color: var(--text-muted); margin-top: 22px; }
.mn-colo a { text-decoration-color: var(--primary); text-underline-offset: 3px; }

/* ---- grade do livro: rótulo | leitura | margem ---- */
.mn-s {
  display: grid;
  grid-template-columns: 170px minmax(0, 540px) 190px;
  column-gap: 32px; row-gap: 20px;
  justify-content: center;
  padding: 56px 24px;
  border-bottom: 1px solid var(--line);
}
.mn-s:last-child { border-bottom: 0; }
.mn-k {
  grid-column: 1; grid-row: 1;
  margin: 0; text-align: right;
  font-family: var(--font-sans);
  font-size: 12px; letter-spacing: .14em; text-transform: uppercase;
  font-weight: 600; line-height: 1.5; color: var(--primary);
  padding-top: 4px;
}
.mn-k small {
  display: block; margin-top: 2px;
  font-weight: 400; font-style: italic; letter-spacing: .01em; text-transform: none;
  font-size: 13.5px; color: var(--text-muted);
}
.mn-m { grid-column: 2; min-width: 0; display: flex; flex-direction: column; gap: 14px; }
.mn-n {
  grid-column: 3; align-self: start; min-width: 0;
  font-size: 13px; line-height: 1.5; color: var(--text-muted);
  border-left: 1px solid var(--line); padding-left: 14px;
  display: flex; flex-direction: column; gap: 12px;
}
.mn-n sup, .mn-root sup.mn-fn { color: var(--primary); font-weight: 600; font-size: .68em; margin-right: 2px; }
.mn-n-date { font-style: italic; color: var(--text); font-size: 14px; }

/* texto corrido */
.mn-p { font-size: 17px; line-height: 1.7; hyphens: auto; }
@media (min-width: 720px) { .mn-p { text-align: justify; } }
.mn-p + .mn-p { text-indent: 1.5em; }
.mn-dc::first-letter {
  float: left;
  font-size: 3.55em; line-height: .82; font-weight: 600;
  padding: .06em .1em 0 0;
  color: var(--primary);
}
@supports (initial-letter: 3) or (-webkit-initial-letter: 3) {
  .mn-dc::first-letter {
    float: none; font-size: inherit; line-height: inherit; padding: 0 .14em 0 0;
    -webkit-initial-letter: 3; initial-letter: 3;
  }
}

/* linhas pontilhadas guia */
.mn-ld {
  display: flex; align-items: flex-end; align-items: last baseline;
  gap: 10px; font-size: 17px; line-height: 1.4;
}
.mn-ld-t { min-width: 0; overflow-wrap: anywhere; }
.mn-ld-dots {
  flex: 1 1 24px; min-width: 24px;
  border-bottom: 2px dotted var(--monograph-dots);
  transform: translateY(-.3em);
}
.mn-ld-v { flex: none; white-space: nowrap; font-variant-numeric: tabular-nums lining-nums; }
.mn-ld--big { font-size: clamp(21px, 2.2vw, 26px); line-height: 1.25; font-weight: 600; }
.mn-ld--big .mn-ld-v { font-size: 15px; font-weight: 400; color: var(--text-muted); }
.mn-ld em { font-style: normal; color: var(--primary); margin-right: 4px; font-weight: 600; }
.mn-nums { margin: 0; display: flex; flex-direction: column; gap: 10px; }
.mn-nums dt {
  flex: 1; min-width: 0;
  display: flex; align-items: flex-end; align-items: last baseline; gap: 10px;
}
.mn-nums dd { margin: 0; }
.mn-nums .mn-ld-v { font-size: 20px; font-weight: 600; color: var(--text-strong); }

/* entradas do sumário */
.mn-toc-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 26px; }
.mn-entry { display: flex; flex-direction: column; gap: 6px; }
.mn-entry :is(h3, h4) { margin: 0; font-size: inherit; font-weight: inherit; }
.mn-entry-desc { color: var(--text-muted); font-size: 16px; line-height: 1.6; }
.mn-entry-link { text-decoration: none; display: block; transition: color .15s ease; }
.mn-entry-link:hover .mn-ld-t { color: var(--primary); }
.mn-entry-link:hover .mn-ld-dots { border-bottom-color: var(--primary); }
.mn-entry-sum { font-style: italic; color: var(--text-muted); font-size: 16px; }
.mn-entry-meta { color: var(--text-muted); font-size: 11.5px; letter-spacing: .12em; text-transform: uppercase; }
.mn-entry-metric { font-style: italic; color: var(--text); font-size: 16px; }
.mn-entry-metric b { font-style: normal; font-weight: 650; color: var(--primary); margin-right: 6px; font-variant-numeric: lining-nums; }

/* ofícios, teses, perguntas */
.mn-sv { font-size: 17px; line-height: 1.6; }
.mn-sv b { font-variant-caps: small-caps; letter-spacing: .04em; font-size: 1.06em; font-weight: 650; color: var(--text-strong); }
.mn-theses { gap: 20px; }
.mn-fig-tags { font-style: normal; }
.mn-sv-n { color: var(--primary); font-weight: 600; margin-right: 8px; font-variant-numeric: lining-nums; }
.mn-qa { margin: 0; display: flex; flex-direction: column; gap: 22px; }
.mn-qa dt { font-weight: 650; font-size: 17px; color: var(--text-strong); display: flex; gap: 10px; }
.mn-qa dd { margin: 6px 0 0; font-size: 16.5px; line-height: 1.65; display: flex; gap: 10px; }
.mn-qa-m { flex: none; width: 1.6em; color: var(--primary); font-weight: 600; font-style: normal; }
.mn-qa dd .mn-qa-m { color: var(--text-muted); }

/* citações */
.mn-q { margin: 0; padding-left: 28px; position: relative; }
.mn-q::before {
  content: "“"; position: absolute; left: -4px; top: -.18em;
  font-family: var(--font-sans); font-size: 60px; line-height: 1; color: var(--primary);
}
.mn-q blockquote { margin: 0; }
.mn-q blockquote p { font-size: 19px; font-style: italic; line-height: 1.5; }
.mn-q figcaption { margin-top: 8px; font-size: 13.5px; color: var(--text-muted); }
.mn-quotes { display: flex; flex-direction: column; gap: 30px; }

/* currículo */
.mn-cv-role { margin: 0; font-size: 20px; line-height: 1.3; font-weight: 600; }
.mn-cv-org { font-style: italic; color: var(--text-muted); }
.mn-cv-date { display: none; }
.mn-n--date { border-left: 0; padding-left: 0; padding-top: 3px; }
.mn-s--entries { row-gap: 36px; }
.mn-cv { gap: 10px; }
.mn-plain { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.mn-list { margin: 0; padding-left: 1.4em; display: flex; flex-direction: column; gap: 6px; font-size: 16.5px; line-height: 1.55; }
ol.mn-list { list-style: decimal; }
ul.mn-list { list-style: "– "; }
.mn-list li { padding-left: 4px; }
.mn-list li::marker { color: var(--primary); font-variant-numeric: lining-nums; }
.mn-rich { font-size: 16px; line-height: 1.65; }
.mn-rich ul, .mn-rich ol { margin: 6px 0 0; padding-left: 1.2em; }
.mn-rich ul { list-style: disc; }
.mn-rich ol { list-style: decimal; }
.mn-rich li { margin: 2px 0; }
.mn-rich li::marker { color: var(--primary); }
.mn-rich p + p { margin-top: 8px; }

/* figuras (pranchas) */
.mn-fig { margin: 0; }
.mn-fig img { display: block; width: 100%; height: auto; aspect-ratio: 3 / 2; object-fit: cover; border: 1px solid var(--line); background: var(--subtle); }
.mn-fig figcaption { margin-top: 8px; font-size: 13.5px; font-style: italic; color: var(--text-muted); }
.mn-fig figcaption b { font-style: normal; font-weight: 500; letter-spacing: .12em; text-transform: uppercase; font-size: 11px; color: var(--text); margin-right: 6px; }
.mn-plates { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 22px 18px; }
.mn-plates .mn-fig img { aspect-ratio: 1 / 1; }

/* filtro das partes */
.mn-parts { display: flex; flex-wrap: wrap; justify-content: center; gap: 2px 20px; list-style: none; margin: 8px 0 0; padding: 0; max-width: 760px; }
.mn-part-btn { text-decoration: none; color: var(--text-muted); }
.mn-part-btn[aria-pressed="true"] { color: var(--primary); text-decoration: underline; text-decoration-color: var(--primary); }
.mn-part-h { margin: 6px 0 0; font-size: 12px; letter-spacing: .14em; text-transform: uppercase; font-weight: 600; color: var(--text-muted); }
.mn-part-h span { color: var(--primary); margin-right: 8px; }
.mn-part-h + .mn-toc-list { margin-top: 4px; }
.mn-part { display: flex; flex-direction: column; gap: 14px; }
.mn-part + .mn-part { margin-top: 18px; padding-top: 22px; border-top: 1px solid var(--line); }

/* rodapé com fólio */
.mn-foot {
  border-top: 1px solid var(--line);
  padding: 22px 24px 30px;
  text-align: center;
  font-size: 13px; font-style: italic; color: var(--text-muted);
}
.mn-foot b { display: block; font-style: normal; font-weight: 500; font-size: 11px; letter-spacing: .3em; text-transform: uppercase; margin-bottom: 4px; color: var(--text); }

/* página de conteúdo do app (post, case, depoimentos…) */
.mn-shared { max-width: 72rem; margin: 0 auto; width: 100%; padding: 40px 16px 64px; }
@media (min-width: 768px) { .mn-shared { padding: 48px 32px 80px; } }

/* ---- telas médias: margem vira nota na coluna de leitura ---- */
@media (max-width: 1099px) {
  .mn-s { grid-template-columns: 150px minmax(0, 600px); column-gap: 28px; }
  .mn-n { grid-column: 2; }
  .mn-n--date { display: none; }
  .mn-cv-date { display: block; }
}
/* ---- celular: uma coluna, rótulo em cima, notas no fluxo ---- */
@media (max-width: 719px) {
  .mn-title { padding: 64px 20px 56px; gap: 14px; }
  .mn-s { grid-template-columns: minmax(0, 1fr); padding: 44px 20px; row-gap: 16px; }
  .mn-k { grid-column: 1; text-align: left; padding-top: 0; }
  .mn-m, .mn-n { grid-column: 1; }
  .mn-n { border-left-width: 2px; background: var(--monograph-wash); padding: 10px 12px; }
  .mn-p { font-size: 16.5px; }
  .mn-ld { font-size: 16px; }
  .mn-ld--big { font-size: 20px; }
  .mn-q blockquote p { font-size: 17.5px; }
  .mn-plates { grid-template-columns: minmax(0, 1fr); }
  .mn-links--left { flex-direction: column; align-items: flex-start; gap: 6px; }
  .mn-links--left .mn-sep { display: none; }
}

@media (prefers-reduced-motion: no-preference) {
  html:has(.mn-root) { scroll-behavior: smooth; }
}
@media (prefers-reduced-motion: reduce) {
  .mn-root *, .mn-root *::before, .mn-root *::after { transition: none !important; animation: none !important; }
}
`;

export function MonographStyles() {
  return <style>{MONOGRAPH_CSS}</style>;
}
