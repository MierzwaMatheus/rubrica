import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { LayoutGrid, List } from "lucide-react";
import { SEO } from "@/components/SEO";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { filterByCategory, hasCaseStudy, listCategories } from "@/utils/portfolioContent";
import { portfolioRepository } from "@/repositories/instances";
import type { Project } from "@/repositories/interfaces/PortfolioRepository";
import { ICON_COLORS, Window, WindowStack, shorten, useDesktopCopy } from "@/components/DesktopShared";

type ViewMode = "icons" | "list";

const LIST_COLS = { "--desktop-cols": "minmax(0, 1.4fr) minmax(0, 0.8fr) minmax(0, 1fr) auto" } as React.CSSProperties;

/** A ação única de cada projeto: o case quando existe, senão o link do projeto. */
function ProjectAction({ project, className }: { project: Project; className?: string }) {
  const copy = useDesktopCopy();
  if (hasCaseStudy(project)) {
    return (
      <Link
        href={`/portfolio/${project.slug}`}
        className={className}
        data-umami-event="portfolio-case"
        data-umami-event-case={project.slug}
      >
        {copy.openCase}
        <span className="dk-sr">: {project.title}</span>
      </Link>
    );
  }
  const external = project.demo_link || project.github_link;
  if (!external) return null;
  return (
    <a href={external} target="_blank" rel="noopener noreferrer" className={className}>
      {copy.openProject} ↗<span className="dk-sr">: {project.title}</span>
    </a>
  );
}

function MetricTag({ project }: { project: Project }) {
  const metric = project.case_study?.metrics?.[0];
  if (!metric) return null;
  return (
    <span className="dk-tag">
      <b>{metric.value}</b> {metric.label}
    </span>
  );
}

export default function DesktopPortfolio() {
  const { t } = useTranslation();
  const copy = useDesktopCopy();
  const { projects, isLoading } = usePortfolio(portfolioRepository);
  const [category, setCategory] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>("icons");

  const categories = useMemo(() => listCategories(projects), [projects]);
  // Volta para "Todos" se a categoria escolhida deixar de existir.
  useEffect(() => {
    if (category && !categories.includes(category)) setCategory(null);
  }, [category, categories]);

  if (isLoading) return null;

  const visible = filterByCategory(projects, category);

  return (
    <>
      <SEO title={t("portfolio.title")} description={t("portfolio.subtitle")} url="/portfolio" />
      <WindowStack>
        <Window
          title={t("portfolio.title")}
          titleAs="h1"
          active
          status={
            <>
              <span>{copy.items(visible.length)}</span>
              <span>{category ?? t("portfolio.all")}</span>
            </>
          }
        >
          <div className="dk-toolbar">
            <span className="dk-muted">{t("portfolio.subtitle")}</span>
            <div className="dk-seg" role="group" aria-label={copy.viewMode}>
              <button type="button" aria-pressed={view === "icons"} onClick={() => setView("icons")}>
                <LayoutGrid size={14} aria-hidden="true" />
                {copy.viewIcons}
              </button>
              <button type="button" aria-pressed={view === "list"} onClick={() => setView("list")}>
                <List size={14} aria-hidden="true" />
                {copy.viewList}
              </button>
            </div>
          </div>

          <div className="dk-folder" style={categories.length === 0 ? { gridTemplateColumns: "minmax(0, 1fr)" } : undefined}>
            {/* Locais: as categorias viram a barra lateral da janela (filtro) */}
            {categories.length > 0 && (
              <nav className="dk-places" aria-label={copy.places}>
                <p className="dk-places-title" aria-hidden="true">
                  {copy.places}
                </p>
                <ul>
                  {[null, ...categories].map((c, i) => (
                    <li key={c ?? "__all"}>
                      <button
                        type="button"
                        className="dk-place"
                        aria-pressed={category === c}
                        onClick={() => setCategory(c)}
                      >
                        <span
                          className="dk-sq"
                          aria-hidden="true"
                          style={{ "--desktop-ic": c ? ICON_COLORS[(i - 1) % ICON_COLORS.length] : "var(--surface)" } as React.CSSProperties}
                        />
                        {c ?? t("portfolio.all")}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            )}

            <div style={{ minWidth: 0 }}>
              {visible.length === 0 ? (
                <p className="dk-empty">{copy.noProjects}</p>
              ) : view === "icons" ? (
                <ul className="dk-grid">
                  {visible.map((project, i) => {
                    const featured = i === 0 && visible.length > 2;
                    return (
                      <li key={project.id} className={featured ? "big" : undefined}>
                        <article className="dk-file">
                          <span
                            className="dk-thumb"
                            aria-hidden="true"
                            style={{ "--desktop-ic": ICON_COLORS[i % ICON_COLORS.length] } as React.CSSProperties}
                          >
                            {project.images?.[0] ? <img src={project.images[0]} alt="" loading="lazy" /> : project.title.charAt(0)}
                            {featured && <span className="dk-badge">★ {copy.featured}</span>}
                          </span>
                          <h2>{project.title}</h2>
                          <p className="dk-muted">{project.category || copy.noCategory}</p>
                          {project.description && <p>{shorten(project.description, featured ? 220 : 130)}</p>}
                          <MetricTag project={project} />
                          <ProjectAction project={project} className="dk-link" />
                        </article>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <>
                  <div className="dk-lh" style={LIST_COLS} aria-hidden="true">
                    <span>{copy.colName}</span>
                    <span>{copy.colCategory}</span>
                    <span>{copy.colResult}</span>
                    <span>{copy.colAction}</span>
                  </div>
                  <ul className="dk-list">
                    {visible.map((project, i) => (
                      <li key={project.id} className="dk-li" style={LIST_COLS}>
                        <h2 className="dk-li-name">
                          <span
                            className="dk-sq"
                            aria-hidden="true"
                            style={{ "--desktop-ic": ICON_COLORS[i % ICON_COLORS.length] } as React.CSSProperties}
                          />
                          {project.title}
                        </h2>
                        <span className="dk-muted">{project.category || copy.noCategory}</span>
                        <span>
                          <MetricTag project={project} />
                        </span>
                        <ProjectAction project={project} className="dk-link" />
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>
        </Window>
      </WindowStack>
    </>
  );
}
