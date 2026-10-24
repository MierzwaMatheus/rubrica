import { useState } from "react";
import { Link } from "wouter";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { portfolioRepository } from "@/repositories/instances";
import type { Project } from "@/repositories/interfaces/PortfolioRepository";
import { filterByCategory, hasCaseStudy, listCategories } from "@/utils/portfolioContent";
import { Dim, Hatch, Num, PageTitleBlock, Sheet, pad2, useBlueprintLabels } from "@/components/BlueprintShared";

/** Uma ação por prancha: o case quando existe, senão o link do projeto. */
function PlateAction({ project }: { project: Project }) {
  const L = useBlueprintLabels();
  if (hasCaseStudy(project)) {
    return (
      <Link
        href={`/portfolio/${project.slug}`}
        className="bp-btn bp-stretch"
        data-umami-event="portfolio-case"
        data-umami-event-case={project.slug}
      >
        {L.viewPlate} <ArrowRight size={13} aria-hidden="true" />
        <span className="bp-sr">: {project.title}</span>
      </Link>
    );
  }
  const href = project.demo_link || project.github_link;
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noreferrer" className="bp-btn bp-stretch">
      {L.viewProject} <ArrowUpRight size={13} aria-hidden="true" />
      <span className="bp-sr">: {project.title}</span>
    </a>
  );
}

export default function BlueprintPortfolio() {
  const { t } = useTranslation();
  const L = useBlueprintLabels();
  const { projects } = usePortfolio(portfolioRepository);
  const [layer, setLayer] = useState<string | null>(null);

  const categories = listCategories(projects);
  const filtered = filterByCategory(projects, layer);
  const total = projects.length > 0 ? 2 : 1;

  return (
    <div className="bp-page">
      {/* Folha 00 — índice das pranchas e camadas (filtro por categoria) */}
      <Sheet n={0} total={total} title={L.plateGrid}>
        <Dim label={L.plates(projects.length)} />
        <h1 className="bp-h1">{t("portfolio.title")}</h1>
        <p className="bp-lead">{t("portfolio.subtitle")}</p>
        {categories.length > 0 && (
          <div className="bp-layers" role="group" aria-label={L.layers}>
            <span aria-hidden="true">{L.layers}</span>
            <button type="button" className="bp-layer" aria-pressed={layer === null} onClick={() => setLayer(null)}>
              <i aria-hidden="true">{layer === null ? "■" : "□"}</i>
              {L.allLayers}
            </button>
            {categories.map((c, i) => (
              <button
                key={c}
                type="button"
                className="bp-layer"
                aria-pressed={layer === c}
                onClick={() => setLayer(layer === c ? null : c)}
              >
                <i aria-hidden="true">
                  {layer === c ? "■" : "□"} L{i + 1}
                </i>
                {c}
              </button>
            ))}
          </div>
        )}
        {projects.length === 0 && <PageTitleBlock page={t("portfolio.title")} sheets={0} />}
      </Sheet>

      {/* Folha 01 — grid de pranchas numeradas */}
      {projects.length > 0 && (
        <Sheet n={1} total={total} title={layer ? `${L.layers} · ${layer}` : t("portfolio.title")}>
          <Dim label={L.plates(filtered.length)} />
          <div className="bp-plates" aria-live="polite">
            {filtered.map((p) => {
              const index = projects.indexOf(p) + 1;
              const metric = p.case_study?.metrics?.[0];
              return (
                <article key={p.id} className="bp-card">
                  <Hatch src={p.images?.[0]} alt={p.title} />
                  <div className="bp-card-txt">
                    <span className="bp-card-cap">
                      <Num>{index}</Num>
                      {L.plate} {pad2(index)}
                      {p.category ? ` · ${p.category}` : ""}
                    </span>
                    <h3 className="bp-h3">{p.title}</h3>
                    {p.description && <p>{p.description}</p>}
                    {metric && (
                      <span className="bp-metric">
                        <span aria-hidden="true">▲</span>
                        <b>{metric.value}</b> {metric.label}
                      </span>
                    )}
                    {(p.tags?.length ?? 0) > 0 && (
                      <ul className="bp-tags">
                        {p.tags.slice(0, 4).map((tag) => (
                          <li key={tag}>{tag}</li>
                        ))}
                      </ul>
                    )}
                    <PlateAction project={p} />
                  </div>
                </article>
              );
            })}
          </div>
          <PageTitleBlock page={t("portfolio.title")} sheets={1} />
        </Sheet>
      )}
    </div>
  );
}
