/**
 * Peças do jardim (como o `GardenShared` da v1), todas puras: estágios de crescimento,
 * migalha, cabeçalho de seção, legenda e o mapa de notas.
 *
 * Estágios de crescimento (nada é inventado: saem só dos dados que já existem):
 * - Projeto: com estudo de caso (texto ou seções) = árvore; sem = broto.
 * - Post: publicado nos últimos 30 dias = semente; os demais = broto. A v1 também
 *   chamava de árvore o post em destaque, mas o contrato não traz esse campo no post.
 * - Experiência: a atual (sem data de fim) = broto, porque ainda cresce; as encerradas = árvore.
 *
 * "Últimos 30 dias" é contado a partir da data do BUILD: no site estático não há relógio
 * do navegador (a v1 usava `useRenderNow`). A cada publicação do site os estágios se renovam.
 */
import type { ReactNode } from "react";
import { splitLocale, type RenderContext } from "@rubrica/core";
import { Heading } from "@rubrica/core/components";

export type Stage = "seed" | "sprout" | "tree";

/** Janela, em dias, em que um post recém-publicado ainda conta como semente. */
export const RECENT_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

export function projectStage(project: { content?: string; sections: unknown[] }): Stage {
  return project.content || project.sections.length > 0 ? "tree" : "sprout";
}

export function postStage(post: { publishedAt: string }, now: number = Date.now()): Stage {
  const published = new Date(post.publishedAt).getTime();
  if (Number.isNaN(published)) return "sprout";
  const age = now - published;
  return age >= 0 && age <= RECENT_DAYS * DAY_MS ? "seed" : "sprout";
}

export function experienceStage(item: { end?: string }): Stage {
  return item.end ? "tree" : "sprout";
}

export const cls = (...names: (string | false | undefined)[]) => names.filter(Boolean).join(" ");

/** Caminho sem o prefixo do idioma ("/en/blog" → "/blog"), sem barra final. */
export function barePath(ctx: RenderContext, path: string): string {
  const p = splitLocale(path, ctx.locales).path;
  return p.length > 1 ? p.replace(/\/+$/, "") : "/";
}

/** Nome do dono do site: a pessoa no site pessoal, a marca na empresa. */
export function ownerName(ctx: RenderContext): string {
  return ctx.site.kind === "pessoal" ? (ctx.site.person?.name ?? ctx.site.name) : ctx.site.name;
}

/** Bolinha do estágio desenhada em CSS: semente ○, broto ◐, árvore ●. */
export function StageDot({ stage, size = 10 }: { stage: Stage; size?: number }) {
  return <span className="gd-st" data-stage={stage} style={{ width: size, height: size }} aria-hidden="true" />;
}

/** Bolinha + nome do estágio (e um complemento opcional, como a categoria). */
export function StageLabel({ ctx, stage, extra }: { ctx: RenderContext; stage: Stage; extra?: string }) {
  return (
    <span className="gd-stl">
      <StageDot stage={stage} />
      <span>
        {ctx.t(`garden.stage.${stage}`)}
        {extra ? ` · ${extra}` : ""}
      </span>
    </span>
  );
}

export function StageLegend({ ctx, className }: { ctx: RenderContext; className?: string }) {
  return (
    <ul className={cls("gd-leg", className)} aria-label={ctx.t("garden.legend")}>
      {(["seed", "sprout", "tree"] as Stage[]).map((s) => (
        <li key={s}>
          <StageDot stage={s} />
          {ctx.t(`garden.stage.${s}`)}
        </li>
      ))}
    </ul>
  );
}

/** Migalha "jardim / página", só no bloco que leva o h1. */
export function Crumb({ ctx, page }: { ctx: RenderContext; page: string }) {
  return (
    <nav className="gd-crumb" aria-label={ctx.t("garden.map")}>
      <a href={ctx.href("/")}>{ctx.t("garden.garden")}</a>
      <span aria-hidden="true"> / </span>
      <span aria-current="page">{page}</span>
    </nav>
  );
}

/** Título da página atual na navegação (a migalha usa), em minúsculas pelo CSS. */
export function currentLabel(ctx: RenderContext): string {
  return ctx.site.navigation.find((n) => n.current)?.label ?? ctx.site.name;
}

/** Cabeçalho de seção: título (h2) e, ao lado, um complemento como "ver todos →". */
export function SectionHead({ title, level = 2, children }: { title?: string; level?: 1 | 2; children?: ReactNode }) {
  if (!title && !children) return null;
  return (
    <div className="gd-sh">
      {title && (
        <Heading level={level} className="gd-h2">
          {title}
        </Heading>
      )}
      {children}
    </div>
  );
}

// ---- mapa de notas -------------------------------------------------------------------

const CX = 100;
const CY = 104;
const RING = 70;

interface MapNode {
  href: string;
  label: string;
  x: number;
  y: number;
  r: number;
  current: boolean;
}

/**
 * Monta os nós do mapa a partir da navegação: o início no centro e as outras páginas em
 * volta, ligadas ao início. Na v1 os projetos brotavam do portfólio, mas a casca não
 * recebe as coleções; o mapa mostra só as páginas.
 */
export function buildMap(ctx: RenderContext, pageType: string): MapNode[] {
  const items = ctx.site.navigation.map((n) => ({ ...n, bare: barePath(ctx, n.href) }));
  const here = barePath(ctx, ctx.path);
  // Em post e case, o nó "atual" é a listagem a que a página pertence (/blog/x → /blog).
  const parent = pageType === "post" || pageType === "case" ? items.find((n) => n.bare !== "/" && here.startsWith(`${n.bare}/`)) : undefined;
  const home = items.find((n) => n.bare === "/");
  const others = items.filter((n) => n.bare !== "/");
  const nodes: MapNode[] = [];
  if (home) nodes.push({ href: home.href, label: home.label, x: CX, y: CY, r: 7, current: home.current });
  others.forEach((n, i) => {
    const angle = -Math.PI * 0.75 + (i * Math.PI * 2) / Math.max(others.length, 1);
    nodes.push({
      href: n.href,
      label: n.label,
      x: CX + RING * Math.cos(angle),
      y: CY + RING * Math.sin(angle),
      r: 6,
      current: n.current || parent === n,
    });
  });
  return nodes;
}

export function GardenMap({ ctx, pageType, className }: { ctx: RenderContext; pageType: string; className?: string }) {
  const nodes = buildMap(ctx, pageType);
  if (nodes.length < 2) return null;
  const center = nodes[0]!;
  const current = nodes.find((n) => n.current);
  const label = ctx.t("garden.mapAria", { pages: nodes.length, here: current?.label ?? ctx.t("garden.garden") });
  // Rótulo do nó atual: abaixo dele, ou acima quando o nó está na metade de baixo.
  const labelY = current ? (current.y > CY + 20 ? current.y - 16 : current.y + 24) : 0;
  return (
    <figure className={cls("gd-mm", className)}>
      <figcaption>{ctx.t("garden.map")}</figcaption>
      <svg viewBox="0 0 200 208" role="img" aria-label={label}>
        <title>{label}</title>
        {nodes.slice(1).map((n) => (
          <line key={n.href} x1={center.x} y1={center.y} x2={n.x} y2={n.y} />
        ))}
        {nodes.map((n) =>
          n.current ? (
            <g key={n.href}>
              <circle cx={n.x} cy={n.y} r={n.r + 7} className="gd-mm-halo" />
              <circle cx={n.x} cy={n.y} r={n.r + 3} className="gd-mm-cur" />
            </g>
          ) : (
            <circle key={n.href} cx={n.x} cy={n.y} r={n.r} className="gd-mm-page" />
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
