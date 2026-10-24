import { useState } from "react";
import { SEO } from "@/components/SEO";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { hasCaseStudy, listCategories, filterByCategory } from "@/utils/portfolioContent";
import { portfolioRepository } from "@/repositories/instances";
import { PageHead, PosterRow, Section, usePosterLabels } from "@/components/PosterShared";

const PORTFOLIO_CSS = `
.poster-filter { display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px 10px; margin: 0; padding: 0; list-style: none; }
.poster-filter button {
  padding: 2px 10px 6px; border: 0; background: none; color: var(--text-muted); cursor: pointer;
  font: inherit; font-size: clamp(24px, 3.6vw, 52px); font-weight: 800; line-height: 1; letter-spacing: -.02em;
  text-transform: uppercase; overflow-wrap: anywhere; text-align: left;
}
.poster-filter button:hover { color: var(--text); text-decoration: underline; text-decoration-thickness: 4px; text-underline-offset: 8px; }
.poster-filter button[aria-pressed="true"] { background: var(--text); color: var(--bg); text-decoration: none; }
.poster-filter-label { display: block; margin-bottom: 14px; font-family: var(--font-mono); font-size: 12px; letter-spacing: .14em; text-transform: uppercase; }
.poster-empty { margin: 0; padding-block: 40px; font-size: 20px; }
`;

export default function PosterPortfolio() {
  const { t } = useTranslation();
  const labels = usePosterLabels();
  const { projects, isLoading } = usePortfolio(portfolioRepository);
  const [category, setCategory] = useState<string | null>(null);

  if (isLoading) return null;

  const categories = listCategories(projects);
  const visible = filterByCategory(projects, category);

  return (
    <>
      <SEO title={t("portfolio.title")} description={t("portfolio.subtitle")} url="/portfolio" />
      <style>{PORTFOLIO_CSS}</style>

      <PageHead kicker={labels.projetos(projects.length)} title={t("portfolio.title")}>
        <p>{t("portfolio.subtitle")}</p>
      </PageHead>

      {/* Filtro: categorias como palavras grandes (some sem categorias) */}
      {categories.length > 0 && (
        <Section>
          <span className="poster-filter-label" id="poster-filtro">
            {labels.categorias}
          </span>
          <ul className="poster-filter" aria-labelledby="poster-filtro">
            {[null, ...categories].map((c) => (
              <li key={c ?? "__todos"}>
                <button type="button" aria-pressed={category === c} onClick={() => setCategory(c)}>
                  {c ?? t("portfolio.all")}
                </button>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section>
        {visible.length > 0 ? (
          <ul className="poster-rows" aria-live="polite">
            {visible.map((p, i) => {
              const metric = p.case_study?.metrics?.[0];
              const withCase = hasCaseStudy(p);
              const featured = !category && i < 3;
              return (
                <PosterRow
                  key={p.id}
                  index={i + 1}
                  title={p.title}
                  max={featured ? 96 : 64}
                  description={p.description}
                  tag={[featured ? labels.destaque : null, p.category].filter(Boolean).join(" · ") || undefined}
                  meta={
                    metric ? (
                      <>
                        <b>{metric.value}</b>
                        <span>{metric.label}</span>
                      </>
                    ) : undefined
                  }
                  action={withCase ? labels.lerCase : p.demo_link ? labels.verProjeto : undefined}
                  href={withCase ? `/portfolio/${p.slug}` : undefined}
                  external={!withCase && p.demo_link ? p.demo_link : undefined}
                  umamiEvent={withCase ? "portfolio-case" : undefined}
                  umamiCase={withCase ? p.slug : undefined}
                />
              );
            })}
          </ul>
        ) : (
          <p className="poster-empty">{labels.semProjetos}</p>
        )}
      </Section>
    </>
  );
}
