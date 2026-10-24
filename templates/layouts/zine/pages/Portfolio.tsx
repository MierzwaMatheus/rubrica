import { useState } from "react";
import { Link } from "wouter";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { filterByCategory, hasCaseStudy, listCategories } from "@/utils/portfolioContent";
import { portfolioRepository } from "@/repositories/instances";
import type { Project } from "@/repositories/interfaces/PortfolioRepository";
import { HandTitle, Polaroid, tilt, tiltAt, truncate, useZineCopy } from "@/components/ZineShared";

/** Quantos projetos do topo ganham o destaque (polaroide em duas colunas). */
const FEATURED = 1;

function ProjectAction({ project }: { project: Project }) {
  const copy = useZineCopy();
  if (hasCaseStudy(project)) {
    return (
      <Link
        href={`/portfolio/${project.slug}`}
        className="zn-handlink"
        data-umami-event="portfolio-case"
        data-umami-event-case={project.slug}
      >
        {copy.readCase} →<span className="zn-sr">: {project.title}</span>
      </Link>
    );
  }
  if (project.demo_link) {
    return (
      <a href={project.demo_link} target="_blank" rel="noopener noreferrer" className="zn-handlink">
        {copy.seeProject} ↗<span className="zn-sr">: {project.title}</span>
      </a>
    );
  }
  return null;
}

export default function ZinePortfolio() {
  const { t } = useTranslation();
  const copy = useZineCopy();
  const { projects, isLoading } = usePortfolio(portfolioRepository);
  const [category, setCategory] = useState<string | null>(null);

  if (isLoading) return null;

  const categories = listCategories(projects);
  const visible = filterByCategory(projects, category);

  return (
    <div className="zn-wrap">
      <header className="zn-pagehead">
        <div>
          <p className="zn-kicker">{copy.portfolioKicker}</p>
          <HandTitle as="h1">{t("portfolio.title")}</HandTitle>
          <p className="zn-lead" style={{ marginTop: 10 }}>
            {copy.projectsCount(projects.length)}
          </p>
        </div>
      </header>

      <section className="zn-sec" aria-label={t("portfolio.title")} style={{ paddingTop: 32 }}>
        {/* Categorias como pedaços de fita (o filtro some sem categorias) */}
        {categories.length > 0 && (
          <ul className="zn-tabs" aria-label={copy.filter}>
            {[null, ...categories].map((c, i) => (
              <li key={c ?? "__all"}>
                <button
                  type="button"
                  className="zn-tab zn-tilt"
                  style={tilt(i % 2 ? 1.5 : -1.5)}
                  aria-pressed={category === c}
                  onClick={() => setCategory(c)}
                >
                  {c ?? t("portfolio.all")}
                </button>
              </li>
            ))}
          </ul>
        )}

        {visible.length === 0 ? (
          <p className="zn-lead">{copy.noProjects}</p>
        ) : (
          <ul className="zn-polgrid">
            {visible.map((p, i) => {
              const metric = p.case_study?.metrics?.[0];
              const featured = category === null && i < FEATURED;
              return (
                <Polaroid
                  key={p.id}
                  as="li"
                  image={p.images?.[0]}
                  alt=""
                  deg={tiltAt(i, featured ? 0.5 : 1.3)}
                  tape={i % 3 === 1 ? "right" : "center"}
                  className={featured ? "zn-featured" : undefined}
                >
                  {featured && <span className="zn-badge">★ {copy.featured}</span>}
                  <h2 className="zn-pol-title">{p.title}</h2>
                  {p.category && <p className="zn-pol-meta">{p.category}</p>}
                  <p className="zn-pol-desc">{truncate(p.description, featured ? 260 : 160)}</p>
                  {metric && (
                    <p className="zn-pol-metric">
                      <mark className="zn-mark">{metric.value}</mark> {metric.label}
                    </p>
                  )}
                  {p.tags?.length > 0 && (
                    <ul className="zn-tags" aria-label="Tags">
                      {p.tags.slice(0, 4).map((tag) => (
                        <li key={tag}>#{tag}</li>
                      ))}
                    </ul>
                  )}
                  <div className="zn-pol-action">
                    <ProjectAction project={p} />
                  </div>
                </Polaroid>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
