/**
 * Peças compartilhadas do layout Blueprint: folhas técnicas numeradas sobre papel
 * quadriculado, linhas de cota, números em círculo, carimbos e tabelas.
 *
 * Regra de ouro do layout: carimbos, cotas e números em círculo ficam SEMPRE no fluxo
 * do documento (nunca posicionados por cima do conteúdo), então não cobrem texto em
 * nenhuma largura.
 *
 * Todas as cores vêm do esquema (var(--…)); as variáveis próprias começam com --blueprint-.
 */
import type { ReactNode } from "react";
import { useI18n } from "@/i18n/context/I18nContext";
import { useSidebar } from "@/hooks/useSidebar";
import { useSiteConfig } from "@/hooks/useSiteConfig";
import { sidebarRepository } from "@/repositories/instances";

// ---- textos próprios do layout --------------------------------------------------------

const LABELS = {
  "pt-BR": {
    sheet: "Folha",
    skip: "Pular para o conteúdo",
    nav: "Navegação principal",
    presentation: "Apresentação",
    hello: "Oi! Eu sou",
    characters: (n: number) => `${n} ${n === 1 ? "caractere" : "caracteres"}`,
    specs: "Especificações",
    plates: (n: number) => `${n} ${n === 1 ? "prancha" : "pranchas"}`,
    plate: "Prancha",
    viewPlate: "Ver prancha",
    viewProject: "Ver projeto",
    memorial: "Memorial descritivo",
    paragraphs: (n: number, w: number) => `${n} ${n === 1 ? "parágrafo" : "parágrafos"} · ${w} palavras`,
    details: "Detalhes",
    detailsCount: (n: number) => `${n} ${n === 1 ? "detalhe" : "detalhes"}`,
    opinions: "Pareceres",
    opinionsCount: (n: number) => `${n} ${n === 1 ? "parecer" : "pareceres"}`,
    serviceOrder: "Ordem de serviço",
    stampLabel: "Carimbo da folha",
    client: "Cliente",
    toBeDefined: "a definir",
    project: "Projeto",
    drawing: "Desenho",
    scale: "Escala",
    date: "Data",
    rev: "Rev.",
    sheetCount: "Folha",
    portfolioTitle: "Portfólio pessoal",
    techSheet: "Ficha técnica",
    timeline: "Linha do tempo",
    years: (n: number) => `${n} ${n === 1 ? "ano" : "anos"}`,
    experiencesCount: (n: number) => `${n} ${n === 1 ? "experiência" : "experiências"}`,
    skillsSpec: "Especificação de habilidades",
    group: "Grupo",
    items: "Itens",
    qty: "Qtd.",
    language: "Idioma",
    level: "Nível",
    education: "Formação e cursos",
    course: "Curso",
    institution: "Instituição",
    period: "Período",
    plateGrid: "Pranchas",
    layers: "Camadas",
    allLayers: "Todas",
    standards: "Normas",
    routine: "Cronograma",
    interests: "Áreas de interesse",
    notes: "Notas gerais",
    notesCount: (n: number) => `${n} ${n === 1 ? "nota" : "notas"}`,
    revisions: "Registro de revisões",
    revisionsCount: (n: number) => `${n} ${n === 1 ? "revisão" : "revisões"}`,
    revCol: "Rev.",
    titleCol: "Título",
    readingCol: "Leitura",
    featured: "Destaque",
    rss: "Assinar o RSS",
    end: "Fim do conjunto",
    madeWith: "Desenhado com o Rubrica",
  },
  "en-US": {
    sheet: "Sheet",
    skip: "Skip to content",
    nav: "Main navigation",
    presentation: "Presentation",
    hello: "Hi! I am",
    characters: (n: number) => `${n} ${n === 1 ? "character" : "characters"}`,
    specs: "Specifications",
    plates: (n: number) => `${n} ${n === 1 ? "plate" : "plates"}`,
    plate: "Plate",
    viewPlate: "View plate",
    viewProject: "View project",
    memorial: "Descriptive memorial",
    paragraphs: (n: number, w: number) => `${n} ${n === 1 ? "paragraph" : "paragraphs"} · ${w} words`,
    details: "Details",
    detailsCount: (n: number) => `${n} ${n === 1 ? "detail" : "details"}`,
    opinions: "Reviews",
    opinionsCount: (n: number) => `${n} ${n === 1 ? "review" : "reviews"}`,
    serviceOrder: "Work order",
    stampLabel: "Title block",
    client: "Client",
    toBeDefined: "to be defined",
    project: "Project",
    drawing: "Drawn by",
    scale: "Scale",
    date: "Date",
    rev: "Rev.",
    sheetCount: "Sheet",
    portfolioTitle: "Personal portfolio",
    techSheet: "Technical sheet",
    timeline: "Timeline",
    years: (n: number) => `${n} ${n === 1 ? "year" : "years"}`,
    experiencesCount: (n: number) => `${n} ${n === 1 ? "position" : "positions"}`,
    skillsSpec: "Skills specification",
    group: "Group",
    items: "Items",
    qty: "Qty.",
    language: "Language",
    level: "Level",
    education: "Education and courses",
    course: "Course",
    institution: "Institution",
    period: "Period",
    plateGrid: "Plates",
    layers: "Layers",
    allLayers: "All",
    standards: "Standards",
    routine: "Schedule",
    interests: "Areas of interest",
    notes: "General notes",
    notesCount: (n: number) => `${n} ${n === 1 ? "note" : "notes"}`,
    revisions: "Revision log",
    revisionsCount: (n: number) => `${n} ${n === 1 ? "revision" : "revisions"}`,
    revCol: "Rev.",
    titleCol: "Title",
    readingCol: "Reading",
    featured: "Featured",
    rss: "Subscribe via RSS",
    end: "End of set",
    madeWith: "Drawn with Rubrica",
  },
} as const;

export type BlueprintLabels = (typeof LABELS)["pt-BR"];

/** Textos próprios do layout no idioma atual. */
export function useBlueprintLabels(): BlueprintLabels {
  const { locale } = useI18n();
  return LABELS[locale === "en-US" ? "en-US" : "pt-BR"] as BlueprintLabels;
}

// ---- utilitários ----------------------------------------------------------------------

/** "02" a partir de 2. */
export const pad2 = (n: number) => String(n).padStart(2, "0");

/** Data em formato técnico (ISO): 2026-10-24. Vazio se a data for inválida. */
export function isoDate(value: string | number | undefined | null): string {
  if (value === undefined || value === null || value === "") return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** Mês e ano atuais, como num carimbo: 10.2026. */
export function stampDate(): string {
  const d = new Date();
  return `${pad2(d.getMonth() + 1)}.${d.getFullYear()}`;
}

/** Minutos de leitura de um texto (HTML ou não), 200 palavras por minuto, mínimo 1. */
export function readingMinutes(content: string | undefined): number {
  const words = wordCount((content ?? "").replace(/<[^>]*>/g, " "));
  return Math.max(1, Math.ceil(words / 200));
}

export function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

/** Texto simples de um item do currículo (habilidade, curso, voluntariado…). */
export function itemText(content: unknown): string {
  if (typeof content === "string") return content;
  if (content && typeof content === "object") {
    const c = content as { name?: unknown; text?: unknown; description?: unknown };
    for (const v of [c.name, c.text, c.description]) if (typeof v === "string" && v.trim()) return v;
  }
  return "";
}

/** Iniciais + sobrenome para o campo "Desenho" do carimbo: "A. Rocha". */
export function drawnBy(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length < 2) return parts[0] ?? "";
  return `${parts[0][0]}. ${parts[parts.length - 1]}`;
}

/** Nome de quem é dono do portfólio (sidebar, com o config do site como reserva). */
export function useOwnerName(): string {
  const { contactInfo } = useSidebar(sidebarRepository);
  const site = useSiteConfig();
  return contactInfo?.name || site.author_name || "";
}

// ---- componentes ----------------------------------------------------------------------

interface SheetProps {
  /** Número da folha (0, 1, 2…). */
  n: number;
  /** Total de folhas da página, para a referência "02/06". */
  total: number;
  /** Nome da folha na etiqueta ("Especificações"). */
  title: string;
  /** Legenda curta ao lado da etiqueta (ex.: o título da seção no app). */
  caption?: string;
  id?: string;
  className?: string;
  children: ReactNode;
}

/**
 * Uma folha técnica: moldura, etiqueta "FOLHA 0X · TÍTULO" (é o h2 da seção) e a
 * referência da folha no canto. A etiqueta e a referência ficam numa linha própria
 * (flex com quebra), então nunca cobrem o conteúdo.
 */
export function Sheet({ n, total, title, caption, id, className, children }: SheetProps) {
  const L = useBlueprintLabels();
  return (
    <section id={id} className={`bp-sheet${className ? ` ${className}` : ""}`} aria-labelledby={id ? `${id}-tag` : undefined}>
      <div className="bp-sheet-head">
        <h2 className="bp-tag" id={id ? `${id}-tag` : undefined}>
          {L.sheet} {pad2(n)} · {title}
        </h2>
        {caption && <p className="bp-caption">{caption}</p>}
        <span className="bp-ref" aria-hidden="true">
          A{n} · {pad2(n)}/{pad2(Math.max(total - 1, 0))}
        </span>
      </div>
      <div className="bp-sheet-body">{children}</div>
    </section>
  );
}

/** Linha de cota: traço com as duas pontas e a medida no meio. A medida é informação real. */
export function Dim({ label, className }: { label: string; className?: string }) {
  return (
    <div className={`bp-dim${className ? ` ${className}` : ""}`}>
      <i aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

/** Número em círculo (legenda de desenho). Decorativo por padrão: o texto ao lado diz o mesmo. */
export function Num({ children, decorative = true, size }: { children: ReactNode; decorative?: boolean; size?: "lg" }) {
  return (
    <span className={`bp-n${size === "lg" ? " bp-n--lg" : ""}`} aria-hidden={decorative || undefined}>
      {children}
    </span>
  );
}

export interface StampCell {
  label: string;
  value: ReactNode;
  span?: number;
}

/** Carimbo (tabela de título) no fim da página. É uma tabela de verdade, no fluxo. */
export function TitleBlock({ rows, className }: { rows: StampCell[][]; className?: string }) {
  const L = useBlueprintLabels();
  return (
    <table className={`bp-tb${className ? ` ${className}` : ""}`} aria-label={L.stampLabel}>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            {row.map((cell) => (
              <td key={cell.label} colSpan={cell.span}>
                <small>{cell.label}</small>
                {cell.value}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * Carimbo padrão do fim de cada página: projeto (nome da página), folha, escala, data
 * e quem desenhou.
 */
export function PageTitleBlock({ page, sheets }: { page: string; sheets: number }) {
  const L = useBlueprintLabels();
  const owner = useOwnerName();
  return (
    <div className="bp-end">
      <TitleBlock
        rows={[
          [
            { label: L.project, value: page, span: 2 },
            { label: L.sheetCount, value: `${pad2(sheets)}/${pad2(sheets)}` },
          ],
          [
            { label: L.scale, value: "1:1" },
            { label: L.date, value: stampDate() },
            { label: L.drawing, value: drawnBy(owner) || "—" },
          ],
        ]}
      />
    </div>
  );
}

/** Área hachurada de uma prancha, com a imagem do projeto (se houver) emoldurada dentro. */
export function Hatch({ src, alt = "", tall }: { src?: string; alt?: string; tall?: boolean }) {
  return (
    <div className={`bp-hatch${tall ? " bp-hatch--tall" : ""}`}>
      {src ? <img src={src} alt={alt} loading="lazy" decoding="async" /> : <span className="bp-hatch-mark" aria-hidden="true" />}
    </div>
  );
}

// ---- estilos --------------------------------------------------------------------------

/**
 * Folha de estilo do layout. Só variáveis do esquema; o que é decoração some ou
 * simplifica no celular, o conteúdo nunca.
 */
export const BLUEPRINT_CSS = `
.bp-root {
  --blueprint-g1: color-mix(in srgb, var(--text) 6%, transparent);
  --blueprint-g2: color-mix(in srgb, var(--text) 13%, transparent);
  --blueprint-ink: color-mix(in srgb, var(--primary) 42%, var(--text));
  --blueprint-mark: color-mix(in srgb, var(--primary) 72%, var(--text));
  --blueprint-hatch: color-mix(in srgb, var(--text) 24%, transparent);
  --blueprint-rule: color-mix(in srgb, var(--text) 28%, transparent);
  --blueprint-paper: color-mix(in srgb, var(--bg) 72%, transparent);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  color: var(--text);
  background-color: var(--bg);
  background-image:
    linear-gradient(var(--blueprint-g2) 1px, transparent 1px),
    linear-gradient(90deg, var(--blueprint-g2) 1px, transparent 1px),
    linear-gradient(var(--blueprint-g1) 1px, transparent 1px),
    linear-gradient(90deg, var(--blueprint-g1) 1px, transparent 1px);
  background-size: 120px 120px, 120px 120px, 24px 24px, 24px 24px;
  font-family: var(--font-sans);
}
.bp-root *, .bp-root *::before, .bp-root *::after { box-sizing: border-box; }
.bp-mono, .bp-page, .bp-header { font-family: var(--font-mono); }
.bp-sans { font-family: var(--font-sans); }
.bp-root :focus-visible { outline: 2px dashed var(--text); outline-offset: 3px; }
.bp-sr { position: absolute !important; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }

.bp-skip { position: absolute; left: 12px; top: -60px; z-index: 60; background: var(--text); color: var(--bg); padding: 8px 12px; font-family: var(--font-mono); font-size: 12px; text-decoration: none; }
.bp-skip:focus { top: 12px; }

/* ---- cabeçalho ---- */
.bp-header { position: sticky; top: 0; z-index: 40; background: var(--bg); border-bottom: 1.5px solid var(--text); display: flex; align-items: center; flex-wrap: wrap; gap: 8px 18px; padding: 12px 30px; font-size: 11px; letter-spacing: .05em; }
.bp-header-id { display: flex; align-items: baseline; gap: 12px; min-width: 0; flex: 1 1 auto; }
.bp-header-name { font-size: 16px; font-weight: 700; letter-spacing: .03em; text-transform: uppercase; color: var(--text); text-decoration: none; white-space: nowrap; }
.bp-header-role { color: var(--text-muted); text-transform: uppercase; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
.bp-nav ul { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 4px 6px; }
.bp-nav a { display: inline-flex; gap: 6px; padding: 3px 7px; color: var(--text); text-decoration: none; text-transform: uppercase; border: 1px solid transparent; }
.bp-nav a b { font-weight: 500; color: var(--text-muted); }
.bp-nav a:hover { border-color: var(--text); }
.bp-nav a[aria-current="page"] { background: var(--text); color: var(--bg); }
.bp-nav a[aria-current="page"] b { color: var(--bg); }
.bp-toggle { width: 30px; height: 30px; justify-content: center; border: 1px solid var(--text) !important; }
.bp-toggle:hover { background: var(--subtle) !important; }

/* ---- páginas e folhas ---- */
.bp-main { flex: 1; width: 100%; }
.bp-page { max-width: 1200px; margin: 0 auto; padding: 28px 30px 40px; display: flex; flex-direction: column; gap: 28px; font-size: 13px; }
.bp-shared { flex: 1; width: calc(100% - 60px); max-width: 1140px; margin: 28px auto 40px; padding: 28px 34px; background: var(--bg); border: 1.5px solid var(--text); }
.bp-sheet { position: relative; border: 1.5px solid var(--text); background: var(--blueprint-paper); scroll-margin-top: 80px; }
.bp-sheet-head { display: flex; flex-wrap: wrap; align-items: flex-start; gap: 6px 14px; }
.bp-tag { margin: -1.5px 0 0 -1.5px; background: var(--text); color: var(--bg); font-family: var(--font-mono); font-size: 11px; font-weight: 500; letter-spacing: .08em; text-transform: uppercase; padding: 4px 10px; line-height: 1.4; }
.bp-caption { margin: 0; padding-top: 5px; font-size: 11px; color: var(--text-muted); text-transform: uppercase; letter-spacing: .08em; flex: 1 1 auto; }
.bp-ref { margin-left: auto; padding: 5px 10px 0; font-size: 10px; color: var(--text-muted); letter-spacing: .08em; white-space: nowrap; }
.bp-sheet-body { padding: 26px 34px 30px; }

.bp-h1 { font-family: var(--font-sans); font-weight: 600; font-size: clamp(36px, 6vw, 64px); line-height: 1; letter-spacing: -.02em; margin: 0; color: var(--text-strong, var(--text)); overflow-wrap: anywhere; }
.bp-h3 { font-family: var(--font-sans); font-weight: 600; font-size: 20px; line-height: 1.15; margin: 0; color: var(--text-strong, var(--text)); }
.bp-small { font-size: 10.5px; letter-spacing: .1em; text-transform: uppercase; color: var(--text-muted); }
.bp-lead { font-family: var(--font-sans); font-size: clamp(18px, 2.2vw, 22px); line-height: 1.35; margin: 18px 0 0; max-width: 620px; }
.bp-p { font-family: var(--font-sans); font-size: 14.5px; line-height: 1.6; color: var(--text-muted); margin: 10px 0 0; max-width: 620px; }
.bp-row { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 22px; }
.bp-link { color: var(--text); text-decoration: underline; text-underline-offset: 3px; text-transform: uppercase; font-size: 11.5px; letter-spacing: .06em; }
.bp-link:hover { color: var(--blueprint-ink); }
.bp-all { display: flex; flex-wrap: wrap; justify-content: flex-end; align-items: center; gap: 10px 18px; margin-top: 18px; }
.bp-empty { font-family: var(--font-sans); color: var(--text-muted); margin: 0; }

/* ---- botões ---- */
.bp-btn { display: inline-flex; align-items: center; gap: 8px; border: 1.5px solid var(--text); padding: 9px 14px; font-family: var(--font-mono); font-size: 12px; letter-spacing: .06em; text-transform: uppercase; background: var(--bg); color: var(--text); text-decoration: none; cursor: pointer; line-height: 1.2; }
.bp-btn:hover { background: var(--subtle); }
.bp-btn--pri { background: var(--primary); color: var(--on-primary); border-color: var(--primary); }
.bp-btn--pri:hover { background: color-mix(in srgb, var(--primary) 82%, var(--text)); }
.bp-btn[disabled] { opacity: .5; cursor: default; }

/* ---- cota ---- */
.bp-dim { position: relative; height: 16px; display: flex; align-items: center; justify-content: center; font-size: 10.5px; letter-spacing: .08em; text-transform: uppercase; margin: 4px 0 12px; }
.bp-dim i { position: absolute; left: 0; right: 0; top: 8px; border-top: 1px solid var(--text); }
.bp-dim::before, .bp-dim::after { content: ""; position: absolute; top: 0; height: 16px; border-left: 1px solid var(--text); }
.bp-dim::before { left: 0; }
.bp-dim::after { right: 0; }
.bp-dim span { position: relative; background: var(--bg); padding: 0 8px; white-space: nowrap; max-width: calc(100% - 20px); overflow: hidden; text-overflow: ellipsis; }

/* ---- número em círculo ---- */
.bp-n { display: inline-flex; align-items: center; justify-content: center; min-width: 24px; height: 24px; padding: 0 5px; border-radius: 999px; border: 1.5px solid var(--blueprint-mark); color: var(--blueprint-ink); background: var(--bg); font-family: var(--font-mono); font-size: 11px; font-style: normal; font-weight: 600; flex: none; line-height: 1; justify-self: start; align-self: start; }
.bp-axis-row .bp-n { align-self: center; }
.bp-n--lg { min-width: 34px; height: 34px; font-size: 12px; }

/* ---- apresentação (home) ---- */
.bp-hero { display: grid; grid-template-columns: minmax(0, 1fr) 220px; gap: 30px; align-items: center; }
.bp-hero--solo { grid-template-columns: minmax(0, 1fr); }
.bp-hero-name { display: inline-block; max-width: 100%; }
.bp-role { font-size: 12px; letter-spacing: .08em; text-transform: uppercase; margin: 10px 0 0; }
.bp-stamp { width: 200px; height: 200px; border-radius: 50%; border: 4px double var(--blueprint-mark); color: var(--blueprint-ink); display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; font-weight: 700; font-size: 12.5px; letter-spacing: .06em; text-transform: uppercase; line-height: 1.35; padding: 26px; gap: 8px; transform: rotate(-12deg); justify-self: center; overflow-wrap: anywhere; overflow: hidden; }
.bp-stamp small { font-size: 10px; font-weight: 500; }
.bp-stamp-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--blueprint-mark); }

/* ---- especificações (números) ---- */
.bp-spec { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(130px, 100%), 1fr)); gap: 1.5px; background: var(--text); border: 1.5px solid var(--text); margin: 0; }
.bp-spec > div { background: var(--bg); padding: 14px 16px; display: flex; flex-direction: column; gap: 6px; }
.bp-spec dt { display: contents; }
.bp-spec dd { margin: 0; order: 2; }
.bp-spec .bp-spec-code { order: 1; font-size: 10px; color: var(--text-muted); letter-spacing: .1em; }
.bp-spec .bp-spec-l { order: 3; }
.bp-spec .bp-spec-v { font-family: var(--font-sans); font-size: 34px; font-weight: 600; line-height: 1; letter-spacing: -.02em; color: var(--text-strong, var(--text)); }
.bp-spec .bp-spec-l { font-family: var(--font-sans); font-size: 12.5px; line-height: 1.4; color: var(--text-muted); }

/* ---- pranchas (cases) ---- */
.bp-cases { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; }
.bp-card { position: relative; border: 1.5px solid var(--text); background: var(--bg); display: flex; flex-direction: column; min-width: 0; }
.bp-card:hover { border-color: var(--blueprint-ink); }
.bp-card:hover .bp-hatch { border-color: var(--blueprint-ink); }
.bp-hatch { position: relative; height: 150px; padding: 10px; overflow: hidden; border-bottom: 1.5px solid var(--text); background-image: repeating-linear-gradient(45deg, var(--blueprint-hatch) 0 1px, transparent 1px 9px); }
.bp-hatch--tall { height: 280px; }
.bp-root .bp-hatch img { display: block; width: 100%; height: 100% !important; object-fit: cover; border: 1px solid var(--text); background: var(--bg); }
.bp-hatch-mark { position: absolute; left: 50%; top: 50%; width: 46px; height: 46px; margin: -23px 0 0 -23px; border: 1.5px solid var(--text); border-radius: 50%; background: var(--bg); }
.bp-hatch-mark::before, .bp-hatch-mark::after { content: ""; position: absolute; background: var(--text); }
.bp-hatch-mark::before { left: -10px; right: -10px; top: 50%; height: 1px; }
.bp-hatch-mark::after { top: -10px; bottom: -10px; left: 50%; width: 1px; }
.bp-card-txt { padding: 16px; display: flex; flex-direction: column; gap: 8px; flex: 1; }
.bp-card-cap { display: flex; align-items: center; gap: 8px; font-size: 10px; letter-spacing: .08em; text-transform: uppercase; color: var(--text-muted); }
.bp-card-txt p { font-family: var(--font-sans); font-size: 13px; line-height: 1.5; color: var(--text-muted); margin: 0; }
.bp-metric { font-size: 12px; color: var(--blueprint-ink); display: flex; flex-wrap: wrap; gap: 4px 8px; align-items: baseline; }
.bp-metric b { font-family: var(--font-sans); font-size: 18px; font-weight: 600; }
.bp-tags { display: flex; flex-wrap: wrap; gap: 4px 10px; font-size: 10.5px; color: var(--text-muted); list-style: none; margin: 0; padding: 0; }
.bp-tags li::before { content: "· "; }
.bp-card .bp-btn { margin-top: auto; align-self: flex-start; }
.bp-stretch::after { content: ""; position: absolute; inset: 0; }

/* ---- memorial ---- */
.bp-memo { columns: 2; column-gap: 40px; font-family: var(--font-sans); font-size: 15px; line-height: 1.65; }
.bp-memo p { break-inside: avoid; margin: 0 0 14px; }
.bp-memo small { display: block; font-family: var(--font-mono); font-size: 10.5px; color: var(--blueprint-ink); letter-spacing: .08em; }
.bp-memo strong { color: var(--blueprint-ink); font-weight: 600; }

/* ---- detalhes (serviços) ---- */
.bp-det { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; list-style: none; margin: 0; padding: 0; }
.bp-det > li { border: 1.5px dashed var(--text); padding: 16px; display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 4px 14px; background: var(--bg); align-items: start; }
.bp-det .bp-n { grid-row: span 2; }
.bp-det h3 { font-family: var(--font-sans); font-size: 18px; font-weight: 600; margin: 4px 0 0; }
.bp-det p { font-family: var(--font-sans); font-size: 13.5px; line-height: 1.55; color: var(--text-muted); margin: 0; }

/* ---- pareceres ---- */
.bp-par { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 18px; }
.bp-par figure { margin: 0; border: 1.5px solid var(--text); padding: 18px; background: var(--bg); display: flex; flex-direction: column; gap: 6px; }
.bp-par blockquote { margin: 0; flex: 1; }
.bp-par blockquote p { font-family: var(--font-sans); font-size: 14px; line-height: 1.55; margin: 0; }
.bp-sig { display: block; height: 26px; border-bottom: 1px solid var(--text); margin-bottom: 4px; }
.bp-par figcaption b { display: block; font-size: 12.5px; }
.bp-par figcaption small { display: block; font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: .08em; margin-top: 2px; }

/* ---- ordem de serviço ---- */
.bp-os { display: grid; grid-template-columns: minmax(0, 1fr) 320px; gap: 30px; align-items: end; }
.bp-os h3 { font-family: var(--font-sans); font-size: clamp(28px, 3.4vw, 38px); line-height: 1.05; font-weight: 600; margin: 0; }

/* ---- carimbo (tabela de título) ---- */
.bp-tb { width: 100%; border-collapse: collapse; font-size: 11px; font-family: var(--font-mono); }
.bp-tb td { border: 1px solid var(--text); padding: 5px 8px; background: var(--bg); vertical-align: top; overflow-wrap: anywhere; }
.bp-tb small { display: block; color: var(--text-muted); font-size: 9px; letter-spacing: .1em; text-transform: uppercase; }
.bp-end { display: flex; justify-content: flex-end; margin-top: 26px; }
.bp-end .bp-tb { max-width: 340px; }

/* ---- tabelas de dados ---- */
.bp-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
.bp-table caption { text-align: left; font-size: 10.5px; letter-spacing: .1em; text-transform: uppercase; color: var(--text-muted); padding-bottom: 8px; }
.bp-table th { text-align: left; font-size: 10px; font-weight: 500; letter-spacing: .1em; text-transform: uppercase; color: var(--text-muted); border-bottom: 1.5px solid var(--text); padding: 8px 10px; }
.bp-table td { border-bottom: 1px solid var(--blueprint-rule); padding: 10px; vertical-align: top; }
.bp-table td.bp-num, .bp-table th.bp-num { text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
.bp-table .bp-sans { font-size: 14px; }
.bp-table a { color: var(--text); text-decoration: none; font-family: var(--font-sans); font-size: 15px; font-weight: 600; }
.bp-table a:hover { text-decoration: underline; text-underline-offset: 3px; }
.bp-inline-list { display: flex; flex-wrap: wrap; gap: 4px 14px; list-style: none; margin: 0; padding: 0; font-family: var(--font-sans); font-size: 13.5px; }

/* ---- currículo: eixo cotado ---- */
.bp-axis { margin: 6px 0 26px; }
.bp-axis-row { display: grid; grid-template-columns: 34px minmax(0, 1fr); align-items: center; height: 30px; }
.bp-axis-track { position: relative; height: 100%; border-left: 1px dashed var(--blueprint-rule); }
.bp-axis-bar { position: absolute; top: 9px; height: 12px; min-width: 6px; border: 1.5px solid var(--primary); background-image: repeating-linear-gradient(45deg, color-mix(in srgb, var(--primary) 55%, transparent) 0 1px, transparent 1px 6px); }
.bp-axis-scale { display: grid; grid-template-columns: 34px minmax(0, 1fr); }
.bp-axis-ticks { position: relative; height: 30px; border-top: 1px solid var(--text); }
.bp-axis-tick { position: absolute; top: 0; font-size: 10px; color: var(--text-muted); white-space: nowrap; }
.bp-axis-tick::before { content: ""; position: absolute; top: 0; left: 0; height: 7px; border-left: 1px solid var(--text); }
.bp-axis-tick span { position: absolute; top: 10px; left: 0; transform: translateX(-50%); }
.bp-axis-tick--first span { transform: none; }
.bp-axis-tick--last span { transform: translateX(-100%); }
.bp-exp { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }
.bp-exp > li { display: grid; grid-template-columns: 34px minmax(0, 1fr) auto; gap: 6px 14px; padding: 16px 0; border-top: 1px solid var(--blueprint-rule); }
.bp-exp-period { font-size: 11px; color: var(--text-muted); letter-spacing: .06em; white-space: nowrap; text-align: right; }
.bp-exp-company { font-size: 11.5px; letter-spacing: .06em; text-transform: uppercase; color: var(--blueprint-ink); margin: 4px 0 0; }
.bp-rich { font-family: var(--font-sans); font-size: 13.5px; line-height: 1.6; color: var(--text-muted); margin-top: 8px; }
.bp-rich ul { margin: 0; padding-left: 18px; list-style: square; }
.bp-rich p { margin: 0 0 6px; }
.bp-split { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 26px 34px; }
.bp-split > * { min-width: 0; }
.bp-block + .bp-block { margin-top: 26px; }
.bp-block-title { font-size: 10.5px; letter-spacing: .1em; text-transform: uppercase; color: var(--text-muted); margin: 0 0 10px; font-weight: 500; }
.bp-codes { list-style: none; margin: 0; padding: 0; font-family: var(--font-sans); font-size: 14px; }
.bp-codes li { display: grid; grid-template-columns: 52px minmax(0, 1fr); gap: 10px; padding: 8px 0; border-bottom: 1px solid var(--blueprint-rule); }
.bp-codes li > span:first-child { font-family: var(--font-mono); font-size: 11px; color: var(--blueprint-ink); padding-top: 2px; }

/* ---- portfólio ---- */
.bp-layers { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-top: 22px; }
.bp-layers > span { font-size: 10.5px; letter-spacing: .1em; text-transform: uppercase; color: var(--text-muted); margin-right: 4px; }
.bp-layer { display: inline-flex; align-items: center; gap: 8px; border: 1px solid var(--text); background: var(--bg); color: var(--text); padding: 6px 10px; font-family: var(--font-mono); font-size: 11.5px; letter-spacing: .04em; cursor: pointer; }
.bp-layer i { font-style: normal; color: var(--text-muted); }
.bp-layer:hover { background: var(--subtle); }
.bp-layer[aria-pressed="true"] { background: var(--text); color: var(--bg); }
.bp-layer[aria-pressed="true"] i { color: var(--bg); }
.bp-plates { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; }
.bp-plates > .bp-card:first-child { grid-column: span 2; }
.bp-plates > .bp-card:first-child .bp-hatch { height: 260px; }

/* ---- sobre ---- */
.bp-norms { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; }
.bp-norms > li { border: 1.5px solid var(--text); background: var(--bg); padding: 16px 18px; }
.bp-norm-code { display: inline-block; font-size: 11px; letter-spacing: .08em; padding: 2px 8px; border: 1px solid var(--blueprint-mark); color: var(--blueprint-ink); margin-bottom: 10px; }
.bp-norms h3 { font-family: var(--font-sans); font-size: 17px; font-weight: 600; margin: 0 0 6px; }
.bp-norms p { font-family: var(--font-sans); font-size: 13.5px; line-height: 1.55; color: var(--text-muted); margin: 0; }
.bp-steps { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
.bp-steps > li { border: 1.5px dashed var(--text); background: var(--bg); display: flex; flex-direction: column; }
.bp-steps .bp-hatch { height: 120px; }
.bp-steps-txt { padding: 12px 14px; display: flex; gap: 10px; align-items: flex-start; font-family: var(--font-sans); font-size: 14px; line-height: 1.45; }
.bp-notes { list-style: none; margin: 0; padding: 0; counter-reset: bp-note; }
.bp-notes > li { display: grid; grid-template-columns: 34px minmax(0, 1fr); gap: 4px 14px; padding: 16px 0; border-top: 1px solid var(--blueprint-rule); }
.bp-notes h3 { font-family: var(--font-sans); font-size: 16px; font-weight: 600; margin: 3px 0 0; }
.bp-notes p { grid-column: 2; font-family: var(--font-sans); font-size: 14px; line-height: 1.6; color: var(--text-muted); margin: 0; }

/* ---- blog ---- */
.bp-feature { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); border: 1.5px solid var(--text); background: var(--bg); position: relative; margin-bottom: 26px; }
.bp-feature .bp-hatch { height: auto; min-height: 260px; border-bottom: 0; border-right: 1.5px solid var(--text); }
.bp-feature-txt { padding: 22px 24px; display: flex; flex-direction: column; gap: 10px; }
.bp-feature-txt h3 { font-family: var(--font-sans); font-size: clamp(24px, 2.6vw, 32px); line-height: 1.1; font-weight: 600; margin: 0; }
.bp-feature-txt p { font-family: var(--font-sans); font-size: 14.5px; line-height: 1.55; color: var(--text-muted); margin: 0; }
.bp-feature .bp-btn { margin-top: auto; align-self: flex-start; }
.bp-meta { display: flex; flex-wrap: wrap; gap: 4px 14px; font-size: 11px; color: var(--text-muted); letter-spacing: .06em; text-transform: uppercase; }
.bp-rss { display: inline-flex; align-items: center; gap: 6px; }

/* ---- rodapé ---- */
.bp-footer { border-top: 1.5px solid var(--text); background: var(--bg); padding: 12px 30px; display: flex; flex-wrap: wrap; justify-content: space-between; gap: 6px 18px; font-family: var(--font-mono); font-size: 10.5px; letter-spacing: .08em; text-transform: uppercase; color: var(--text-muted); }

/* ---- movimento (só para quem não pediu menos movimento) ---- */
@media (prefers-reduced-motion: no-preference) {
  .bp-stamp { animation: bp-stamp-in .55s cubic-bezier(.2, .9, .3, 1.2) both .15s; }
  .bp-card, .bp-hatch, .bp-btn, .bp-layer, .bp-nav a { transition: background-color .15s, border-color .15s, color .15s; }
  @keyframes bp-stamp-in { from { opacity: 0; transform: rotate(-30deg) scale(1.35); } to { opacity: 1; transform: rotate(-12deg) scale(1); } }
}

/* ---- telas médias ---- */
@media (max-width: 1023px) {
  .bp-cases, .bp-plates { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .bp-cases > :last-child:nth-child(odd) { grid-column: span 2; }
  .bp-os { grid-template-columns: minmax(0, 1fr); }
  .bp-os .bp-tb { max-width: 420px; }
}

/* ---- celular: folhas em coluna, cotas simplificadas, tabelas viram listas ---- */
@media (max-width: 767px) {
  .bp-header { position: static; padding: 12px 16px; }
  .bp-header-id { flex-basis: calc(100% - 48px); flex-wrap: wrap; row-gap: 2px; }
  .bp-header-role { white-space: normal; flex-basis: 100%; }
  .bp-nav { order: 3; flex-basis: 100%; }
  .bp-page { padding: 16px 12px 28px; gap: 18px; }
  .bp-shared { width: calc(100% - 24px); margin: 16px auto 28px; padding: 18px 16px; }
  .bp-sheet-body { padding: 18px 14px 20px; }
  .bp-ref { display: none; }
  .bp-caption { flex-basis: 100%; padding: 0 12px; }
  .bp-hero { grid-template-columns: minmax(0, 1fr); gap: 18px; }
  .bp-stamp { width: 150px; height: 150px; padding: 18px; font-size: 11px; justify-self: start; margin-left: 16px; }
  .bp-cases, .bp-plates, .bp-det, .bp-split, .bp-feature { grid-template-columns: minmax(0, 1fr); }
  .bp-cases > :last-child:nth-child(odd), .bp-plates > .bp-card:first-child { grid-column: auto; }
  .bp-plates > .bp-card:first-child .bp-hatch, .bp-hatch--tall { height: 180px; }
  .bp-feature .bp-hatch { min-height: 180px; border-right: 0; border-bottom: 1.5px solid var(--text); }
  .bp-memo { columns: 1; }
  .bp-end { justify-content: stretch; }
  .bp-end .bp-tb { max-width: none; }
  .bp-exp > li { grid-template-columns: 34px minmax(0, 1fr); }
  .bp-exp-period { grid-column: 2; grid-row: 1; text-align: left; }
  .bp-exp > li > div { grid-column: 2; grid-row: 2; }
  .bp-exp > li > .bp-n { grid-column: 1; grid-row: 1; }
  .bp-axis-tick--mid span { display: none; }
  .bp-dim { font-size: 9.5px; }

  /* tabelas de dados viram listas: cada linha é um bloco, cada célula traz o rótulo */
  .bp-table--stack thead { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
  .bp-table--stack, .bp-table--stack tbody, .bp-table--stack tr, .bp-table--stack td { display: block; width: 100%; }
  .bp-table--stack tr { border: 1.5px solid var(--text); background: var(--bg); padding: 8px 12px; margin-bottom: 10px; }
  .bp-table--stack td { border: 0; padding: 4px 0; text-align: left !important; }
  .bp-table--stack caption { display: block; width: 100%; }
  .bp-table--stack td.bp-half { display: inline-block; width: 50%; vertical-align: top; }
  .bp-table--stack td[data-label]::before { content: attr(data-label); display: block; font-family: var(--font-mono); font-size: 9.5px; letter-spacing: .1em; text-transform: uppercase; color: var(--text-muted); }
}
`;

/** Injeta a folha de estilo do layout (uma vez, pelo Layout). */
export function BlueprintStyles() {
  return <style>{BLUEPRINT_CSS}</style>;
}
