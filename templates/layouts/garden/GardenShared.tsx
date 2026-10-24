import { Link, useLocation } from "wouter";
import { useI18n } from "@/i18n/context/I18nContext";
import { usePlugins } from "@/contexts/PluginsContext";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useBlogPosts } from "@/hooks/useBlog";
import { useResume } from "@/hooks/useResume";
import { highlightNumbers } from "@/utils/homeContent";
import { hasCaseStudy } from "@/utils/portfolioContent";
import { portfolioRepository, blogRepository, resumeRepository } from "@/repositories/instances";
import type { Project } from "@/repositories/interfaces/PortfolioRepository";
import type { PluginId } from "../../convex/pluginRegistry";

/* =====================================================================================
 * Jardim Digital — peças compartilhadas pelo layout e pelas 5 páginas.
 *
 * Estágios de crescimento (regra documentada em docs/templates/garden.md):
 * - Projeto: com estudo de caso = árvore; sem estudo de caso = broto.
 * - Post: em destaque = árvore; publicado nos últimos 30 dias = semente; demais = broto.
 * - Experiência: a atual (período terminando em "atual", "presente", "hoje"…) = broto,
 *   porque ainda está crescendo; as encerradas = árvore.
 * Nada é inventado: o estágio sai só dos dados que já existem.
 * ===================================================================================== */

export type Stage = "seed" | "sprout" | "tree";

/** Janela, em dias, em que um post recém-publicado ainda conta como semente. */
export const RECENT_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

export function projectStage(project: Project): Stage {
  return hasCaseStudy(project) ? "tree" : "sprout";
}

export function postStage(post: { featured?: boolean; published_at?: string }, now: number = Date.now()): Stage {
  if (post.featured) return "tree";
  const published = post.published_at ? new Date(post.published_at).getTime() : NaN;
  if (Number.isNaN(published)) return "sprout";
  const age = now - published;
  return age >= 0 && age <= RECENT_DAYS * DAY_MS ? "seed" : "sprout";
}

const CURRENT_PERIOD = /(atual|atualmente|presente|hoje|o momento|present|current|now|today)\s*\)?\s*$/i;

export function experienceStage(period: string | undefined): Stage {
  return period && CURRENT_PERIOD.test(period.trim()) ? "sprout" : "tree";
}

/** Minutos de leitura (200 palavras por minuto), ignorando as tags do HTML. */
export function readingMinutes(html: string): number {
  const words = html.replace(/<[^>]*>/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function formatDate(iso: string | undefined, locale: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" });
}

/* ---- termos ligados (estilo wiki) --------------------------------------------------- */

export interface GardenTerm {
  term: string;
  href: string;
}

export interface LinkedSegment {
  text: string;
  href?: string;
  strong?: boolean;
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Liga a primeira ocorrência de cada termo (palavra inteira, sem diferenciar maiúsculas)
 * e destaca os números com unidade no resto do texto.
 */
export function linkTerms(text: string, terms: GardenTerm[]): LinkedSegment[] {
  const found: Array<{ start: number; end: number; href: string }> = [];
  const seen = new Set<string>();
  for (const { term, href } of terms) {
    const key = term.trim().toLowerCase();
    if (key.length < 3 || seen.has(key)) continue;
    seen.add(key);
    const match = new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(term.trim())}(?![\\p{L}\\p{N}])`, "iu").exec(text);
    if (!match) continue;
    const start = match.index;
    const end = start + match[0].length;
    if (found.some((f) => start < f.end && end > f.start)) continue;
    found.push({ start, end, href });
  }
  found.sort((a, b) => a.start - b.start);

  const plain = (chunk: string): LinkedSegment[] =>
    highlightNumbers(chunk).map((s) => ({ text: s.text, strong: s.highlight }));

  const out: LinkedSegment[] = [];
  let last = 0;
  for (const f of found) {
    if (f.start > last) out.push(...plain(text.slice(last, f.start)));
    out.push({ text: text.slice(f.start, f.end), href: f.href });
    last = f.end;
  }
  if (last < text.length) out.push(...plain(text.slice(last)));
  return out;
}

/* ---- textos próprios do layout ------------------------------------------------------ */

const TEXTS = {
  "pt-BR": {
    garden: "jardim",
    gardenOf: (name: string) => (name ? `Jardim de ${name}` : "Jardim digital"),
    skip: "Pular para o conteúdo",
    menu: "Abrir menu",
    navLabel: "Navegação do jardim",
    legend: "Legenda dos estágios",
    map: "Mapa do jardim",
    mapAria: (pages: number, projects: number, here: string) =>
      `Mapa do jardim: ${pages} páginas e ${projects} projetos ligados entre si. Você está em ${here}.`,
    stage: { seed: "semente", sprout: "broto", tree: "árvore" } as Record<Stage, string>,
    page: "página",
    hello: (name: string) => `Oi! Eu sou ${name}.`,
    gardenCount: (trees: number, sprouts: number) =>
      `${trees} ${trees === 1 ? "árvore" : "árvores"} · ${sprouts} ${sprouts === 1 ? "broto" : "brotos"}`,
    state: "Estado do jardim",
    trees: "Árvores do jardim",
    readCase: "ler case",
    seeProject: "ver projeto",
    caretaker: "Quem cuida do jardim",
    linkedTo: "Ligada a",
    beds: "Canteiros",
    bed: "canteiro",
    guestbook: "Livro de visitas",
    visit: "visita",
    plant: "Plante uma conversa",
    timeline: "Linha do tempo do jardim",
    growing: "em crescimento",
    skillBeds: "Canteiros de habilidades",
    portfolioTitle: "Árvores e brotos",
    portfolioLead: "Árvores são projetos com estudo de caso completo; brotos ainda não têm case.",
    filterBeds: "Filtrar por canteiro",
    all: "Todos",
    empty: "Nada plantado aqui ainda.",
    aboutTitle: "Sobre",
    rules: "Regras do jardim",
    interests: "Interesses",
    notesTitle: "Notas do jardim",
    notesCount: (n: number) => `${n} ${n === 1 ? "nota" : "notas"} em diferentes estágios de crescimento.`,
    stageGroup: {
      tree: "Árvores — as notas em destaque",
      seed: `Sementes — plantadas nos últimos ${RECENT_DAYS} dias`,
      sprout: "Brotos — notas crescendo",
    } as Record<Stage, string>,
    subscribe: "Assinar por RSS",
    languageLabel: "Idioma",
  },
  "en-US": {
    garden: "garden",
    gardenOf: (name: string) => (name ? `${name}'s garden` : "Digital garden"),
    skip: "Skip to content",
    menu: "Open menu",
    navLabel: "Garden navigation",
    legend: "Growth stages",
    map: "Garden map",
    mapAria: (pages: number, projects: number, here: string) =>
      `Garden map: ${pages} pages and ${projects} projects linked together. You are at ${here}.`,
    stage: { seed: "seed", sprout: "sprout", tree: "tree" } as Record<Stage, string>,
    page: "page",
    hello: (name: string) => `Hi! I'm ${name}.`,
    gardenCount: (trees: number, sprouts: number) =>
      `${trees} ${trees === 1 ? "tree" : "trees"} · ${sprouts} ${sprouts === 1 ? "sprout" : "sprouts"}`,
    state: "State of the garden",
    trees: "Trees in the garden",
    readCase: "read case",
    seeProject: "see project",
    caretaker: "Who tends this garden",
    linkedTo: "Linked to",
    beds: "Garden beds",
    bed: "bed",
    guestbook: "Guestbook",
    visit: "visit",
    plant: "Plant a conversation",
    timeline: "Garden timeline",
    growing: "growing",
    skillBeds: "Skill beds",
    portfolioTitle: "Trees and sprouts",
    portfolioLead: "Trees are projects with a full case study; sprouts don't have one yet.",
    filterBeds: "Filter by bed",
    all: "All",
    empty: "Nothing planted here yet.",
    aboutTitle: "About",
    rules: "Garden rules",
    interests: "Interests",
    notesTitle: "Garden notes",
    notesCount: (n: number) => `${n} ${n === 1 ? "note" : "notes"} at different stages of growth.`,
    stageGroup: {
      tree: "Trees — featured notes",
      seed: `Seeds — planted in the last ${RECENT_DAYS} days`,
      sprout: "Sprouts — growing notes",
    } as Record<Stage, string>,
    subscribe: "Subscribe via RSS",
    languageLabel: "Language",
  },
};

export type GardenTexts = (typeof TEXTS)["pt-BR"];

export function useGardenTexts(): GardenTexts & { locale: string } {
  const { locale } = useI18n();
  const key = locale === "en-US" ? "en-US" : "pt-BR";
  return { ...TEXTS[key], locale: key };
}

/* ---- navegação (páginas do site) ---------------------------------------------------- */

export interface GardenPage {
  key: "home" | "resume" | "portfolio" | "about" | "blog";
  href: string;
  plugin?: PluginId;
}

export const GARDEN_PAGES: GardenPage[] = [
  { key: "home", href: "/" },
  { key: "resume", href: "/curriculo", plugin: "resume" },
  { key: "portfolio", href: "/portfolio", plugin: "portfolio" },
  { key: "about", href: "/sobre", plugin: "about" },
  { key: "blog", href: "/blog", plugin: "blog" },
];

/** Páginas visíveis conforme os plugins ligados. */
export function useGardenPages(): GardenPage[] {
  const { isEnabled } = usePlugins();
  return GARDEN_PAGES.filter((p) => !p.plugin || isEnabled(p.plugin));
}

export function isActivePath(location: string, href: string): boolean {
  return href === "/" ? location === "/" : location === href || location.startsWith(`${href}/`);
}

/* ---- componentes -------------------------------------------------------------------- */

/** Bolinha do estágio desenhada em CSS: semente ○, broto ◐, árvore ●. */
export function StageDot({ stage, size = 10 }: { stage: Stage; size?: number }) {
  return <span className="gd-st" data-stage={stage} style={{ width: size, height: size }} aria-hidden="true" />;
}

/** Bolinha + nome do estágio (e um complemento opcional, como a categoria). */
export function StageLabel({ stage, extra }: { stage: Stage; extra?: string }) {
  const tx = useGardenTexts();
  return (
    <span className="gd-stl">
      <StageDot stage={stage} />
      <span>
        {tx.stage[stage]}
        {extra ? ` · ${extra}` : ""}
      </span>
    </span>
  );
}

export function StageLegend({ className }: { className?: string }) {
  const tx = useGardenTexts();
  return (
    <ul className={`gd-leg ${className ?? ""}`} aria-label={tx.legend}>
      {(["seed", "sprout", "tree"] as Stage[]).map((s) => (
        <li key={s}>
          <StageDot stage={s} />
          {tx.stage[s]}
        </li>
      ))}
    </ul>
  );
}

/** Migalha "jardim / página". */
export function Crumb({ page }: { page: string }) {
  const tx = useGardenTexts();
  return (
    <nav className="gd-crumb" aria-label="breadcrumb">
      <Link href="/">{tx.garden}</Link>
      <span aria-hidden="true"> / </span>
      <span aria-current="page">{page}</span>
    </nav>
  );
}

/** Parágrafo com termos ligados em pontilhado e números em destaque. */
export function LinkedText({ text, terms }: { text: string; terms: GardenTerm[] }) {
  return (
    <>
      {linkTerms(text, terms).map((seg, i) =>
        seg.href ? (
          <Link key={i} href={seg.href} className="gd-link">
            {seg.text}
          </Link>
        ) : seg.strong ? (
          <strong key={i}>{seg.text}</strong>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </>
  );
}

/** Termos do próprio site que viram links quando aparecem num texto. */
export function useGardenTerms(): GardenTerm[] {
  const { isEnabled } = usePlugins();
  const { projects } = usePortfolio(portfolioRepository);
  const { posts } = useBlogPosts(blogRepository);
  const { getItemsByType } = useResume(resumeRepository);
  const terms: GardenTerm[] = [];
  if (isEnabled("portfolio")) {
    for (const p of projects) {
      terms.push({ term: p.title, href: hasCaseStudy(p) && p.slug ? `/portfolio/${p.slug}` : "/portfolio" });
    }
  }
  if (isEnabled("resume")) {
    for (const s of getItemsByType("skill")) {
      const name = (s.translatedContent as { name?: string } | undefined)?.name;
      if (name) terms.push({ term: name, href: "/curriculo" });
    }
  }
  if (isEnabled("blog")) {
    for (const post of posts) for (const tag of post.tags ?? []) terms.push({ term: tag, href: "/blog" });
  }
  return terms;
}

export interface Backlink {
  href: string;
  title: string;
  kind: string;
  stage?: Stage;
}

/** Ligações reais para outras notas do site (um case, o post mais novo, páginas). */
export function useBacklinks(exclude: string, limit = 3): Backlink[] {
  const tx = useGardenTexts();
  const { isEnabled } = usePlugins();
  const { projects } = usePortfolio(portfolioRepository);
  const { posts } = useBlogPosts(blogRepository);
  const links: Backlink[] = [];
  const firstCase = projects.find(hasCaseStudy);
  if (isEnabled("portfolio") && firstCase?.slug) {
    links.push({ href: `/portfolio/${firstCase.slug}`, title: firstCase.title, kind: tx.stage.tree, stage: "tree" });
  }
  const latest = posts[0];
  if (isEnabled("blog") && latest?.slug) {
    const stage = postStage(latest);
    links.push({ href: `/blog/${latest.slug}`, title: latest.title, kind: tx.stage[stage], stage });
  }
  const names: Record<string, string> =
    tx.locale === "en-US"
      ? { "/sobre": "About", "/curriculo": "Résumé", "/portfolio": "Portfolio", "/blog": "Blog" }
      : { "/sobre": "Sobre", "/curriculo": "Currículo", "/portfolio": "Portfólio", "/blog": "Blog" };
  const pagePlugins: Array<[string, PluginId]> = [
    ["/sobre", "about"],
    ["/curriculo", "resume"],
    ["/portfolio", "portfolio"],
    ["/blog", "blog"],
  ];
  for (const [href, plugin] of pagePlugins) {
    if (isEnabled(plugin)) links.push({ href, title: names[href], kind: tx.page });
  }
  return links.filter((l) => l.href !== exclude && !l.href.startsWith(`${exclude}/`)).slice(0, limit);
}

export function Backlinks({ exclude, title }: { exclude: string; title?: string }) {
  const tx = useGardenTexts();
  const links = useBacklinks(exclude);
  if (!links.length) return null;
  return (
    <div className="gd-back">
      <h3>{title ?? tx.linkedTo}</h3>
      <ul className="gd-bl">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href}>
              <span className="gd-bl-t">{l.title}</span>
              <small>
                {l.stage && <StageDot stage={l.stage} size={8} />}
                {l.kind}
              </small>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Números de destaque como "Estado do jardim". Some quando não há números. */
export function MetricsGrid({ metrics }: { metrics: Array<{ value: string; label: string }> }) {
  if (!metrics.length) return null;
  return (
    <dl className="gd-met">
      {metrics.map((m) => (
        <div key={m.label}>
          <dt className="sr-only">{m.label}</dt>
          <dd className="gd-met-v">{m.value}</dd>
          <dd className="gd-met-l" aria-hidden="true">
            {m.label}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Cartão de projeto: miniatura, estágio, título, primeira métrica e uma ação só. */
export function ProjectCard({ project, wide = false, headingLevel = 3 }: { project: Project; wide?: boolean; headingLevel?: 2 | 3 }) {
  const tx = useGardenTexts();
  const stage = projectStage(project);
  const metric = project.case_study?.metrics?.[0];
  const withCase = hasCaseStudy(project) && !!project.slug;
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const body = (
    <>
      <div className="gd-thumb">
        {project.images?.[0] ? (
          <img src={project.images[0]} alt="" loading="lazy" />
        ) : (
          <span className="gd-thumb-i" aria-hidden="true">
            {project.title.slice(0, 1)}
          </span>
        )}
      </div>
      <StageLabel stage={stage} extra={project.category} />
      <Heading className="gd-card-t">{project.title}</Heading>
      {project.description && <p className="gd-card-d">{project.description}</p>}
      {metric && (
        <span className="gd-mpill">
          <b>{metric.value}</b> {metric.label}
        </span>
      )}
    </>
  );

  if (withCase) {
    return (
      <Link
        href={`/portfolio/${project.slug}`}
        className={`gd-card gd-card-link${wide ? " gd-card-wide" : ""}`}
        data-umami-event="portfolio-case"
        data-umami-event-case={project.slug}
      >
        {body}
        <span className="gd-more">{tx.readCase} →</span>
      </Link>
    );
  }
  return (
    <article className={`gd-card${wide ? " gd-card-wide" : ""}`}>
      {body}
      {project.demo_link && (
        <a href={project.demo_link} target="_blank" rel="noopener noreferrer" className="gd-more gd-link">
          {tx.seeProject} ↗
        </a>
      )}
    </article>
  );
}

export function SectionHead({ id, title, children }: { id?: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="gd-sh">
      <h2 id={id} className="gd-h2">
        {title}
      </h2>
      {children}
    </div>
  );
}

/* ---- mapa de notas ------------------------------------------------------------------ */

interface MapNode {
  id: string;
  x: number;
  y: number;
  r: number;
  label: string;
  kind: "page" | "project";
  stage?: Stage;
  current: boolean;
}

const CX = 100;
const CY = 104;
const RING = 64;
const LEAF = 30;

export interface MapPageInput {
  key: string;
  href: string;
  label: string;
}

/**
 * Monta os nós e as ligações do mapa: o início no centro, as outras páginas em volta e
 * os projetos brotando do portfólio. As ligações são os links que existem no site
 * (início → páginas, portfólio → projetos, início → cases em destaque).
 */
export function buildGardenMap(
  pages: MapPageInput[],
  projects: Project[],
  location: string,
  maxProjects = 6,
): { nodes: MapNode[]; edges: Array<[string, string, boolean]> } {
  const nodes: MapNode[] = [];
  const edges: Array<[string, string, boolean]> = [];
  const home = pages.find((p) => p.href === "/");
  const others = pages.filter((p) => p.href !== "/");
  const projectHere = location.startsWith("/portfolio/");

  if (home) nodes.push({ id: "/", x: CX, y: CY, r: 7, label: home.label, kind: "page", current: location === "/" });

  others.forEach((p, i) => {
    const angle = -Math.PI * 0.75 + (i * (Math.PI * 2)) / Math.max(others.length, 1);
    const x = CX + RING * Math.cos(angle);
    const y = CY + RING * Math.sin(angle);
    const current = !projectHere && isActivePath(location, p.href);
    nodes.push({ id: p.href, x, y, r: 6, label: p.label, kind: "page", current });
    if (home) edges.push(["/", p.href, false]);

    if (p.href === "/portfolio") {
      const list = projects.slice(0, maxProjects);
      const spread = Math.PI * 0.9;
      list.forEach((proj, j) => {
        const a = list.length === 1 ? angle : angle - spread / 2 + (j * spread) / (list.length - 1);
        const id = `project:${proj.id}`;
        nodes.push({
          id,
          x: x + LEAF * Math.cos(a),
          y: y + LEAF * Math.sin(a),
          r: 3.5,
          label: proj.title,
          kind: "project",
          stage: projectStage(proj),
          current: projectHere && !!proj.slug && location === `/portfolio/${proj.slug}`,
        });
        edges.push(["/portfolio", id, false]);
        if (home && hasCaseStudy(proj)) edges.push(["/", id, true]);
      });
    }
  });

  return { nodes, edges };
}

export function GardenMap({ className, pageLabels }: { className?: string; pageLabels: Record<string, string> }) {
  const tx = useGardenTexts();
  const [location] = useLocation();
  const pages = useGardenPages();
  const { isEnabled } = usePlugins();
  const { projects } = usePortfolio(portfolioRepository);
  const { nodes, edges } = buildGardenMap(
    pages.map((p) => ({ key: p.key, href: p.href, label: pageLabels[p.key] ?? p.key })),
    isEnabled("portfolio") ? projects : [],
    location,
  );
  if (!nodes.length) return null;
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const current = nodes.find((n) => n.current);
  const pageCount = nodes.filter((n) => n.kind === "page").length;
  const projectCount = nodes.length - pageCount;
  const label = tx.mapAria(pageCount, projectCount, current?.label ?? tx.garden);
  // Rótulo do nó atual: abaixo dele, ou acima quando o nó está na metade de baixo.
  const labelY = current ? (current.y > CY + 20 ? current.y - 16 : current.y + 24) : 0;

  return (
    <figure className={`gd-mm ${className ?? ""}`}>
      <figcaption>{tx.map}</figcaption>
      <svg viewBox="0 0 200 208" role="img" aria-label={label}>
        <title>{label}</title>
        {edges.map(([a, b, soft]) => {
          const na = byId.get(a);
          const nb = byId.get(b);
          if (!na || !nb) return null;
          return <line key={`${a}-${b}`} x1={na.x} y1={na.y} x2={nb.x} y2={nb.y} className={soft ? "gd-mm-soft" : undefined} />;
        })}
        {nodes.map((n) =>
          n.current ? (
            <g key={n.id}>
              <circle cx={n.x} cy={n.y} r={n.r + 7} className="gd-mm-halo" />
              <circle cx={n.x} cy={n.y} r={n.r + 3} className="gd-mm-cur" />
            </g>
          ) : (
            <circle
              key={n.id}
              cx={n.x}
              cy={n.y}
              r={n.r}
              className={n.kind === "page" ? "gd-mm-page" : n.stage === "tree" ? "gd-mm-tree" : "gd-mm-sprout"}
            />
          ),
        )}
        {current && (
          <text x={Math.min(Math.max(current.x, 40), 160)} y={labelY} textAnchor="middle">
            {current.label.length > 22 ? `${current.label.slice(0, 21)}…` : current.label}
          </text>
        )}
      </svg>
    </figure>
  );
}

/* ---- estilos ------------------------------------------------------------------------ */

/**
 * Folha de estilo do layout. Só usa as variáveis do esquema (e as derivadas --garden-*),
 * para funcionar com qualquer esquema, nos dois modos.
 */
export const GARDEN_CSS = `
.gd-shell, .gd-sheet {
  --garden-ink: color-mix(in srgb, var(--primary) 78%, var(--text));
  --garden-soft: color-mix(in srgb, var(--primary) 14%, transparent);
  --garden-shadow: color-mix(in srgb, var(--text) 14%, transparent);
}
.gd-shell {
  display: grid;
  grid-template-columns: 230px minmax(0, 1fr);
  align-items: start;
  min-height: 100vh;
  /* a coluna da barra lateral vai até o fim da página, mesmo com a barra fixa */
  background: linear-gradient(90deg, var(--surface) 0 229px, var(--line) 229px 230px, var(--bg) 230px);
  color: var(--text);
  font-family: var(--font-sans);
}
:is(.gd-shell, .gd-sheet) :where(a, button, summary, [tabindex]):focus-visible {
  outline: 2px solid var(--text);
  outline-offset: 3px;
  border-radius: 6px;
}
.gd-skip {
  position: absolute; left: 12px; top: -60px; z-index: 60;
  background: var(--primary); color: var(--on-primary);
  padding: 8px 14px; border-radius: 999px; font-weight: 600; text-decoration: none;
}
.gd-skip:focus { top: 12px; }

/* barra lateral */
.gd-side {
  position: sticky; top: 0; height: 100vh; overflow-y: auto;
  background: var(--surface); border-right: 1px solid var(--line); box-sizing: border-box;
  padding: 26px 22px 20px; display: flex; flex-direction: column; gap: 20px;
}
.gd-logo { display: block; font-size: 22px; line-height: 1.08; font-weight: 600; color: var(--text-strong); text-decoration: none; letter-spacing: -0.01em; }
.gd-role { margin-top: 6px; font-size: 12.5px; line-height: 1.4; color: var(--text-muted); }
.gd-nav { display: flex; flex-direction: column; gap: 2px; }
.gd-nav a {
  display: flex; align-items: center; gap: 10px; padding: 7px 10px; margin: 0 -10px;
  border-radius: 8px; font-size: 14.5px; color: var(--text); text-decoration: none;
  transition: background-color .15s ease;
}
.gd-nav a:hover { background: var(--subtle); }
.gd-nav a[aria-current="page"] { font-weight: 600; background: var(--garden-soft); }
.gd-nav a[aria-current="page"]::before { content: ""; width: 3px; height: 16px; border-radius: 2px; background: var(--garden-ink); margin-left: -4px; }
.gd-leg { display: flex; flex-wrap: wrap; gap: 6px 12px; font-size: 12px; color: var(--text-muted); list-style: none; margin: 0; padding: 0; }
.gd-leg li { display: inline-flex; align-items: center; gap: 6px; }
.gd-mm { margin: auto 0 0; display: flex; flex-direction: column; gap: 8px; }
.gd-mm figcaption, .gd-eyebrow, .gd-back h3 {
  font-family: var(--font-mono); font-size: 10.5px; letter-spacing: .12em; text-transform: uppercase; color: var(--text-muted); font-weight: 500; margin: 0;
}
.gd-mm svg { width: 100%; max-width: 186px; height: auto; border: 1px solid var(--line); border-radius: 8px; background: var(--bg); display: block; }
.gd-mm line { stroke: var(--line); stroke-width: 1.6; }
.gd-mm line.gd-mm-soft { stroke-dasharray: 3 3; }
.gd-mm .gd-mm-page { fill: var(--text-muted); }
.gd-mm .gd-mm-tree { fill: var(--accent); }
.gd-mm .gd-mm-sprout { fill: var(--bg); stroke: var(--accent); stroke-width: 1.4; }
.gd-mm .gd-mm-cur { fill: var(--primary); }
.gd-mm .gd-mm-halo { fill: none; stroke: var(--garden-ink); stroke-width: 1.2; opacity: .55; transform-box: fill-box; transform-origin: center; }
.gd-mm text { fill: var(--text); font-size: 12px; font-weight: 600; font-family: var(--font-sans); paint-order: stroke; stroke: var(--bg); stroke-width: 3px; stroke-linejoin: round; }
.gd-tools { display: flex; align-items: center; justify-content: space-between; gap: 12px; font-size: 12.5px; color: var(--text-muted); border-top: 1px solid var(--line); padding-top: 14px; }
.gd-lang { display: inline-flex; gap: 2px; border: 1px solid var(--line); border-radius: 999px; padding: 2px; }
.gd-lang button { font: inherit; font-size: 11.5px; font-weight: 600; padding: 3px 9px; border-radius: 999px; border: 0; background: transparent; color: var(--text-muted); cursor: pointer; }
.gd-lang button[aria-pressed="true"] { background: var(--primary); color: var(--on-primary); }
.gd-mode { padding: 6px; margin: -6px; border-radius: 999px; color: var(--text); }
.gd-mode:hover { background: var(--subtle); }

/* barra do topo (celular e tablet) */
.gd-top { display: none; }
.gd-sheet { background: var(--surface) !important; color: var(--text) !important; border-color: var(--line) !important; padding: 28px 22px !important; display: flex; flex-direction: column; gap: 22px; overflow-y: auto; }

/* coluna de leitura */
.gd-body { min-width: 0; }
.gd-main { padding: 40px 48px 72px; max-width: 790px; margin-inline: auto; display: flex; flex-direction: column; gap: 56px; }
.gd-shared { padding: 36px 40px 64px; max-width: 1120px; margin-inline: auto; }
.gd-mapfoot { display: none; }
.gd-sec { display: flex; flex-direction: column; gap: 16px; scroll-margin-top: 80px; }
.gd-sh { display: flex; justify-content: space-between; align-items: baseline; gap: 6px 16px; flex-wrap: wrap; }
.gd-crumb { font-family: var(--font-mono); font-size: 12px; color: var(--text-muted); }
.gd-crumb a { color: inherit; text-decoration: none; }
.gd-crumb a:hover { color: var(--text); text-decoration: underline dotted; }
.gd-h1 { font-size: clamp(34px, 4.6vw, 50px); line-height: 1.04; letter-spacing: -0.015em; font-weight: 600; color: var(--text-strong); margin: 0; overflow-wrap: anywhere; }
.gd-h2 { font-size: 27px; line-height: 1.12; font-weight: 600; color: var(--text-strong); margin: 0; letter-spacing: -0.01em; }
.gd-h3 { font-size: 18px; line-height: 1.25; font-weight: 600; color: var(--text-strong); margin: 0; }
.gd-lead { font-size: 20px; line-height: 1.4; margin: 0; max-width: 620px; }
.gd-p { font-size: 16px; line-height: 1.65; margin: 0; max-width: 640px; color: var(--text); }
.gd-muted { color: var(--text-muted); }
.gd-hero { display: flex; flex-direction: column; gap: 16px; }
.gd-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.gd-chip { display: inline-flex; align-items: center; gap: 8px; font-size: 12.5px; padding: 4px 11px; border-radius: 999px; background: var(--subtle); color: var(--text); }
.gd-pulse { width: 8px; height: 8px; border-radius: 50%; background: var(--garden-ink); flex: none; }
.gd-row { display: flex; flex-wrap: wrap; gap: 12px 16px; align-items: center; }
.gd-btn {
  display: inline-flex; align-items: center; gap: 8px; padding: 10px 20px; min-height: 44px; box-sizing: border-box;
  border-radius: 999px; border: 1.5px solid var(--garden-ink); background: transparent; color: var(--text);
  font: inherit; font-size: 14.5px; font-weight: 600; line-height: 1.2; cursor: pointer; text-decoration: none;
  transition: background-color .15s ease, transform .15s ease;
}
.gd-btn:hover { background: var(--subtle); }
.gd-btn-pri { background: var(--primary); color: var(--on-primary); border-color: var(--primary); }
.gd-btn-pri:hover { background: color-mix(in srgb, var(--primary) 86%, var(--text)); }
.gd-btn:disabled { opacity: .5; cursor: not-allowed; }
.gd-link {
  color: var(--text); text-decoration: underline; text-decoration-style: dotted; text-decoration-thickness: 1.5px;
  text-decoration-color: var(--garden-ink); text-underline-offset: 3px; cursor: pointer;
  background: none; border: 0; padding: 0; font: inherit;
}
.gd-link:hover { background: var(--garden-soft); border-radius: 3px; }

/* estágios */
.gd-st { display: inline-block; width: 10px; height: 10px; border-radius: 50%; border: 1.5px solid var(--garden-ink); flex: none; box-sizing: border-box; }
.gd-st[data-stage="sprout"] { background: linear-gradient(90deg, var(--garden-ink) 50%, transparent 50%); }
.gd-st[data-stage="tree"] { background: var(--garden-ink); }
.gd-stl { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-muted); }

/* números */
.gd-met { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; margin: 0; }
.gd-met > div { border: 1px solid var(--line); border-radius: 12px; padding: 14px 16px; background: var(--surface); display: flex; flex-direction: column; gap: 6px; }
.gd-met dd { margin: 0; }
.gd-met-v { font-size: 30px; line-height: 1; font-weight: 600; color: var(--text-strong); letter-spacing: -0.02em; }
.gd-met-l { font-size: 12.5px; line-height: 1.4; color: var(--text-muted); }

/* cartões */
.gd-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 14px; }
.gd-card {
  border: 1px solid var(--line); border-radius: 12px; background: var(--surface); padding: 12px;
  display: flex; flex-direction: column; gap: 7px; color: var(--text); text-decoration: none; min-width: 0;
  transition: border-color .2s ease, transform .2s ease, box-shadow .2s ease;
}
.gd-card-link:hover { border-color: var(--garden-ink); transform: translateY(-2px); box-shadow: 0 8px 20px -12px var(--garden-shadow); }
.gd-card-wide { grid-column: 1 / -1; display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr); column-gap: 20px; row-gap: 8px; align-content: start; }
.gd-card-wide > .gd-thumb { grid-column: 1; grid-row: 1 / span 6; margin: 0; aspect-ratio: auto; min-height: 230px; height: 100%; }
.gd-card-wide > :not(.gd-thumb) { grid-column: 2; }
.gd-card-wide > .gd-more { align-self: end; }
.gd-thumb { aspect-ratio: 16 / 10; border-radius: 8px; overflow: hidden; margin-bottom: 4px; background: color-mix(in srgb, var(--accent) 22%, var(--subtle)); display: flex; align-items: center; justify-content: center; }
.gd-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.gd-thumb-i { font-size: 34px; font-weight: 600; color: var(--text-muted); }
.gd-card-t { font-size: 19px; line-height: 1.15; font-weight: 600; margin: 0; color: var(--text-strong); }
.gd-card-d { font-size: 13.5px; line-height: 1.5; color: var(--text-muted); margin: 0; }
.gd-mpill { align-self: flex-start; font-size: 12px; padding: 3px 10px; border-radius: 999px; background: var(--subtle); color: var(--text); line-height: 1.4; }
.gd-mpill b { font-weight: 700; }
.gd-more { margin-top: auto; padding-top: 4px; font-size: 13.5px; font-weight: 600; color: var(--text); text-decoration: underline dotted; text-decoration-color: var(--garden-ink); text-underline-offset: 3px; align-self: flex-start; }

/* nota e backlinks */
.gd-note { display: flex; flex-direction: column; gap: 14px; }
.gd-note p { font-size: 16.5px; line-height: 1.7; margin: 0; max-width: 660px; }
.gd-note strong { font-weight: 700; color: var(--text-strong); }
.gd-back { border-top: 1px solid var(--line); padding-top: 14px; display: flex; flex-direction: column; gap: 10px; }
.gd-bl { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 8px; list-style: none; margin: 0; padding: 0; }
.gd-bl a { border: 1px solid var(--line); border-radius: 8px; padding: 9px 11px; background: var(--surface); display: flex; flex-direction: column; gap: 3px; font-size: 13.5px; color: var(--text); text-decoration: none; height: 100%; box-sizing: border-box; }
.gd-bl a:hover { border-color: var(--garden-ink); }
.gd-bl-t { font-weight: 600; line-height: 1.3; }
.gd-bl small { display: inline-flex; align-items: center; gap: 5px; color: var(--text-muted); font-size: 11.5px; }

/* canteiros */
.gd-beds { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 12px; list-style: none; margin: 0; padding: 0; }
.gd-bed { border: 1px solid var(--line); border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 6px; background: var(--surface); position: relative; overflow: hidden; }
.gd-bed::after { content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 3px; background: repeating-linear-gradient(90deg, var(--garden-ink) 0 6px, transparent 6px 12px); opacity: .5; }
.gd-bed b, .gd-bed h3 { font-size: 16.5px; font-weight: 600; margin: 0; color: var(--text-strong); line-height: 1.25; }
.gd-bed p { font-size: 13.8px; line-height: 1.5; color: var(--text-muted); margin: 0; }
.gd-tags { display: flex; flex-wrap: wrap; gap: 6px; list-style: none; padding: 0; margin: 0; }
.gd-tag { font-size: 12.5px; padding: 3px 10px; border-radius: 999px; border: 1px solid var(--line); background: var(--bg); color: var(--text); line-height: 1.4; }
.gd-filter { display: flex; flex-wrap: wrap; gap: 8px; }
.gd-filter button { font: inherit; font-size: 13px; padding: 6px 14px; min-height: 36px; border-radius: 999px; border: 1px solid var(--line); background: var(--surface); color: var(--text); cursor: pointer; }
.gd-filter button:hover { border-color: var(--garden-ink); }
.gd-filter button[aria-pressed="true"] { background: var(--primary); color: var(--on-primary); border-color: var(--primary); font-weight: 600; }

/* livro de visitas */
.gd-gb { list-style: none; margin: 0; padding: 0; }
.gd-gb li { padding: 16px 0; border-top: 1px solid var(--line); display: grid; grid-template-columns: 96px minmax(0, 1fr); gap: 4px 16px; }
.gd-gb small { grid-row: span 3; color: var(--text-muted); font-size: 11.5px; padding-top: 4px; font-family: var(--font-mono); }
.gd-gb blockquote { margin: 0; font-size: 16px; line-height: 1.55; }
.gd-gb b { font-size: 13.5px; }
.gd-gb span { font-size: 12.5px; color: var(--text-muted); }
.gd-cta { background: var(--subtle); border-radius: 16px; padding: 30px; display: flex; flex-direction: column; gap: 12px; }
.gd-cta .gd-h2 { font-size: 30px; }

/* linha do tempo */
.gd-tl { list-style: none; margin: 0; padding: 0; position: relative; }
.gd-tl::before { content: ""; position: absolute; left: 8px; top: 8px; bottom: 8px; width: 2px; background: var(--line); }
.gd-tl > li { position: relative; padding: 0 0 30px 36px; }
.gd-tl > li:last-child { padding-bottom: 0; }
.gd-ring { position: absolute; left: 0; top: 3px; width: 18px; height: 18px; border-radius: 50%; background: var(--bg); display: flex; align-items: center; justify-content: center; box-shadow: 0 0 0 2px var(--bg); }
.gd-ring[data-stage="tree"] { border: 1.5px solid var(--garden-ink); }
.gd-ring[data-stage="sprout"] { border: 1.5px dashed var(--garden-ink); }
.gd-tl-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 12px; font-family: var(--font-mono); font-size: 12px; color: var(--text-muted); margin-bottom: 4px; }
.gd-tl-org { font-size: 14.5px; color: var(--text-muted); margin: 2px 0 8px; }
.gd-rich { font-size: 14.5px; line-height: 1.6; color: var(--text); max-width: 640px; }
.gd-rich ul { list-style: disc; padding-left: 1.2em; margin: 0; }
.gd-rich ol { list-style: decimal; padding-left: 1.2em; margin: 0; }
.gd-rich li { margin: 3px 0; }
.gd-rich p { margin: 0 0 6px; }
.gd-rich a { color: var(--text); text-decoration: underline dotted; text-decoration-color: var(--garden-ink); }
.gd-two { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 28px; }
.gd-list { list-style: none; margin: 0; padding: 0; }
.gd-list > li { padding: 10px 0; border-top: 1px solid var(--line); font-size: 14.5px; line-height: 1.5; }
.gd-list > li:last-child { border-bottom: 1px solid var(--line); }
.gd-list small { display: block; color: var(--text-muted); font-size: 12.5px; }

/* sobre */
.gd-rules { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; counter-reset: gd-rule; }
.gd-rules li { counter-increment: gd-rule; border: 1px solid var(--line); border-radius: 12px; padding: 16px; background: var(--surface); display: flex; flex-direction: column; gap: 6px; }
.gd-rules li::before { content: counter(gd-rule, decimal-leading-zero); font-family: var(--font-mono); font-size: 11.5px; color: var(--text-muted); }
.gd-rules h3 { font-size: 16.5px; margin: 0; font-weight: 600; color: var(--text-strong); line-height: 1.25; }
.gd-rules p { font-size: 13.8px; line-height: 1.5; margin: 0; color: var(--text-muted); }
.gd-photos { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; list-style: none; margin: 0; padding: 0; }
.gd-photos figure { margin: 0; display: flex; flex-direction: column; gap: 6px; }
.gd-photos img, .gd-photo-ph { width: 100%; aspect-ratio: 4 / 5; object-fit: cover; border-radius: 10px; display: block; background: var(--subtle); }
.gd-photos figcaption { font-size: 12.5px; line-height: 1.4; color: var(--text-muted); }
.gd-faq details { border-top: 1px solid var(--line); padding: 12px 0; }
.gd-faq details:last-child { border-bottom: 1px solid var(--line); }
.gd-faq summary { cursor: pointer; list-style: none; font-weight: 600; font-size: 16px; line-height: 1.4; display: flex; gap: 12px; justify-content: space-between; align-items: baseline; color: var(--text-strong); }
.gd-faq summary::-webkit-details-marker { display: none; }
.gd-faq summary::after { content: "+"; font-family: var(--font-mono); color: var(--text-muted); transition: transform .2s ease; flex: none; }
.gd-faq details[open] summary::after { transform: rotate(45deg); }
.gd-faq details p { margin: 10px 0 2px; font-size: 15px; line-height: 1.6; color: var(--text); max-width: 640px; }

/* blog */
.gd-notes { list-style: none; margin: 0; padding: 0; }
.gd-notes > li { border-top: 1px solid var(--line); padding: 16px 0; display: flex; flex-direction: column; gap: 6px; }
.gd-notes > li:last-child { border-bottom: 1px solid var(--line); }
.gd-note-t { font-size: 19px; line-height: 1.25; font-weight: 600; margin: 0; }
.gd-note-t a { color: var(--text-strong); text-decoration: none; }
.gd-note-t a:hover { text-decoration: underline dotted; text-decoration-color: var(--garden-ink); text-underline-offset: 3px; }
.gd-note-s { font-size: 14.5px; line-height: 1.5; color: var(--text-muted); margin: 0; }
.gd-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 12px; font-family: var(--font-mono); font-size: 12px; color: var(--text-muted); }
.gd-note-row { display: grid; grid-template-columns: minmax(0, 1fr) 120px; gap: 16px; align-items: start; }
.gd-note-img { width: 120px; aspect-ratio: 4 / 3; object-fit: cover; border-radius: 8px; background: var(--subtle); }

@media (prefers-reduced-motion: no-preference) {
  .gd-pulse { animation: gd-pulse 2.6s ease-in-out infinite; }
  .gd-mm .gd-mm-halo { animation: gd-halo 3s ease-in-out infinite; }
}
@keyframes gd-pulse { 0%, 100% { opacity: 1; } 50% { opacity: .35; } }
@keyframes gd-halo { 0%, 100% { transform: scale(1); opacity: .55; } 50% { transform: scale(1.18); opacity: .2; } }
@media (prefers-reduced-motion: reduce) {
  .gd-shell *, .gd-shell *::before, .gd-shell *::after { transition: none !important; animation: none !important; }
  .gd-card-link:hover { transform: none; }
}

@media (max-width: 959px) {
  .gd-shell { grid-template-columns: minmax(0, 1fr); background: var(--bg); }
  .gd-side { display: none; }
  .gd-top {
    display: flex; position: sticky; top: 0; z-index: 40; align-items: center; justify-content: space-between; gap: 12px;
    padding: 10px 16px 10px 20px; background: var(--surface); border-bottom: 1px solid var(--line);
  }
  .gd-top .gd-logo { font-size: 18px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .gd-top-tools { display: flex; align-items: center; gap: 6px; flex: none; }
  .gd-menu { width: 44px; height: 44px; display: inline-flex; align-items: center; justify-content: center; border-radius: 999px; border: 1px solid var(--line); background: transparent; color: var(--text); cursor: pointer; }
  .gd-top .gd-mode { width: 44px; height: 44px; margin: 0; padding: 0; justify-content: center; }
  .gd-main { padding: 26px 20px 48px; gap: 44px; }
  .gd-shared { padding: 24px 20px 48px; }
  .gd-mapfoot { display: block; padding: 0 20px 40px; }
  .gd-mapfoot .gd-mm { margin: 0; border-top: 1px solid var(--line); padding-top: 20px; }
  .gd-mapfoot .gd-leg { margin-top: 10px; }
}
@media (max-width: 600px) {
  .gd-card-wide { display: flex; }
  .gd-card-wide > .gd-thumb { aspect-ratio: 16 / 10; min-height: 0; height: auto; margin-bottom: 4px; }
  .gd-gb li { grid-template-columns: minmax(0, 1fr); }
  .gd-gb small { grid-row: auto; }
  .gd-lead { font-size: 18px; }
  .gd-h2 { font-size: 24px; }
  .gd-cta { padding: 22px; }
  .gd-cta .gd-h2 { font-size: 25px; }
  .gd-note-row { grid-template-columns: minmax(0, 1fr); }
  .gd-note-img { display: none; }
  .gd-met { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .gd-met-v { font-size: 26px; }
}
`;

export function GardenStyles() {
  return <style>{GARDEN_CSS}</style>;
}
