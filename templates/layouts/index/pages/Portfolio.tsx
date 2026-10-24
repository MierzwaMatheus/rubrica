import { useMemo, useState } from "react";
import { Link } from "wouter";
import { SEO } from "@/components/SEO";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { hasCaseStudy, listCategories, filterByCategory } from "@/utils/portfolioContent";
import { portfolioRepository } from "@/repositories/instances";
import type { Project } from "@/repositories/interfaces/PortfolioRepository";
import {
  IndexSection,
  IndexTableSection,
  catalogNumber,
  useIndexCopy,
  type IndexColumn,
  type IndexCopy,
  type IndexRowLink,
} from "@/components/IndexShared";

type SortKey = "num" | "name";
type SortDir = "asc" | "desc";

/** A ação única de cada projeto: o case quando existe, senão o link do projeto. */
function projectLink(p: Project): IndexRowLink | null {
  if (hasCaseStudy(p)) return { href: `/portfolio/${p.slug}` };
  if (p.demo_link) return { href: p.demo_link, external: true };
  return null;
}

function ProjectAction({ project, copy }: { project: Project; copy: IndexCopy }) {
  const link = projectLink(project);
  if (!link) return null;
  if (link.external) {
    return (
      <a href={link.href} target="_blank" rel="noopener noreferrer" className="ix-u">
        {copy.viewProject} ↗<span className="ix-sr"> {copy.opensNewTab}</span>
      </a>
    );
  }
  return (
    <Link
      href={link.href}
      className="ix-u"
      data-umami-event="portfolio-case"
      data-umami-event-case={project.slug}
    >
      {copy.readCase} →
    </Link>
  );
}

export default function IndexPortfolio() {
  const { t, locale } = useTranslation();
  const copy = useIndexCopy();
  const { projects, isLoading } = usePortfolio(portfolioRepository);
  const [category, setCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: "num", dir: "asc" });

  // Nº de catálogo fixo: a posição no portfólio inteiro (ordem do admin), mesmo filtrando.
  const numbers = useMemo(() => new Map(projects.map((p, i) => [p.id, i + 1])), [projects]);
  const numberOf = (p: Project) => numbers.get(p.id) ?? 0;

  const categories = listCategories(projects);
  const filtered = useMemo(() => filterByCategory(projects, category), [projects, category]);
  const rows = useMemo(() => {
    const list = [...filtered];
    const factor = sort.dir === "asc" ? 1 : -1;
    list.sort((a, b) =>
      sort.key === "num"
        ? ((numbers.get(a.id) ?? 0) - (numbers.get(b.id) ?? 0)) * factor
        : a.title.localeCompare(b.title, locale, { sensitivity: "base" }) * factor
    );
    return list;
  }, [filtered, sort, numbers, locale]);

  if (isLoading) return null;

  const toggleSort = (key: SortKey) => () =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  const dirOf = (key: SortKey) => (sort.key === key ? sort.dir : null);

  const featured = filtered[0];
  const featuredMetric = featured?.case_study?.metrics?.[0];

  const columns: IndexColumn<Project>[] = [
    {
      key: "num",
      header: copy.colNumber,
      width: "76px",
      sort: { direction: dirOf("num"), onToggle: toggleSort("num") },
      cell: (p) => <span className="ix-num">{catalogNumber(numberOf(p))}</span>,
    },
    {
      key: "title",
      header: copy.colProject,
      title: true,
      width: "28%",
      sort: { direction: dirOf("name"), onToggle: toggleSort("name") },
      cell: (p) => p.title,
    },
    { key: "type", header: copy.colType, muted: true, cell: (p) => p.category || copy.noResult },
    { key: "field", header: copy.colField, muted: true, cell: (p) => p.tags.slice(0, 2).join(", ") || copy.noResult },
    {
      key: "result",
      header: copy.colResult,
      width: "24%",
      cell: (p) => {
        const m = p.case_study?.metrics?.[0];
        return m ? (
          <span>
            {m.value} <span className="ix-muted">{m.label}</span>
          </span>
        ) : (
          copy.noResult
        );
      },
    },
    {
      key: "action",
      header: <span className="ix-sr">{copy.colAction}</span>,
      cardLabel: copy.colAction,
      action: true,
      width: "120px",
      cell: (p) => <ProjectAction project={p} copy={copy} />,
    },
  ];

  return (
    <>
      <SEO title={t("portfolio.title")} description={t("portfolio.subtitle")} url="/portfolio" />

      <IndexSection labelAs="div" label={<span className="ix-code">{copy.sheet} 003 — {t("portfolio.title")}</span>}>
        <h1 className="ix-title">{t("portfolio.title")}</h1>
        <p className="ix-desc">
          {t("portfolio.subtitle")}. {copy.projects(projects.length)}.
        </p>
      </IndexSection>

      {/* Filtro de categoria como links de texto (some sem categorias) */}
      {categories.length > 0 && (
        <IndexSection label={copy.category}>
          <ul className="ix-filter">
            {[null, ...categories].map((c) => {
              const count = filterByCategory(projects, c).length;
              return (
                <li key={c ?? "__todos"}>
                  <button type="button" aria-pressed={category === c} onClick={() => setCategory(c)}>
                    {c ?? t("portfolio.all")}
                    <sup>{count}</sup>
                  </button>
                </li>
              );
            })}
          </ul>
        </IndexSection>
      )}

      {/* Destaque: o primeiro projeto da seleção atual, como uma ficha */}
      {featured && (
        <IndexSection label={copy.featured}>
          <article className="ix-feat">
            <div>
              <p className="ix-feat-meta">
                {copy.sheet} {catalogNumber(numberOf(featured))}
                {featured.category ? ` · ${featured.category}` : ""}
              </p>
              <h3>{featured.title}</h3>
              <p className="ix-desc">{featured.description}</p>
              {featuredMetric && (
                <p className="ix-links">
                  <span>
                    <span className="ix-hl">{featuredMetric.value}</span>{" "}
                    <span className="ix-muted">{featuredMetric.label}</span>
                  </span>
                </p>
              )}
              <p className="ix-links">
                <ProjectAction project={featured} copy={copy} />
              </p>
            </div>
            {featured.images?.[0] && (
              <figure className="ix-feat-img">
                <img src={featured.images[0]} alt={featured.title} loading="lazy" />
              </figure>
            )}
          </article>
        </IndexSection>
      )}

      {/* O índice completo, ordenável por número e por nome */}
      <IndexTableSection
        label={copy.index}
        aside={
          <>
            {copy.projects(rows.length)}
            {rows.length > 1 && (
              <>
                <br />
                {copy.sortHint}
              </>
            )}
          </>
        }
        caption={`${t("portfolio.title")}: ${copy.projects(rows.length)}. ${copy.sortBy} ${sort.key === "num" ? copy.colNumber : copy.colProject}, ${sort.dir === "asc" ? copy.sortAsc : copy.sortDesc}.`}
        rows={rows}
        columns={columns}
        getKey={(p) => String(p.id)}
        getLink={projectLink}
        getPreview={(p) => ({ image: p.images?.[0], caption: `${catalogNumber(numberOf(p))} · ${p.title}` })}
        empty={<p className="ix-muted">{copy.emptyCategory}</p>}
      />
    </>
  );
}
