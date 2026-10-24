import { useState } from "react";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { hasCaseStudy, listCategories, filterByCategory } from "@/utils/portfolioContent";
import { portfolioRepository } from "@/repositories/instances";
import { SEO } from "@/components/SEO";
import { Crumb, ProjectCard, StageDot, useGardenTexts } from "@/components/GardenShared";

export default function GardenPortfolio() {
  const { t } = useTranslation();
  const tx = useGardenTexts();
  const { projects, isLoading } = usePortfolio(portfolioRepository);
  const [category, setCategory] = useState<string | null>(null);

  if (isLoading) return <div aria-busy="true" style={{ minHeight: "60vh" }} />;

  const categories = listCategories(projects);
  const visible = filterByCategory(projects, category);
  const trees = projects.filter(hasCaseStudy).length;

  return (
    <>
      <SEO title={t("portfolio.title")} description={t("portfolio.subtitle")} url="/portfolio" />

      <section className="gd-hero" aria-labelledby="gd-portfolio">
        <Crumb page={t("navigation.portfolio").toLowerCase()} />
        <h1 id="gd-portfolio" className="gd-h1">
          {tx.portfolioTitle}
        </h1>
        <p className="gd-lead">{t("portfolio.subtitle")}</p>
        <p className="gd-p gd-muted">{tx.portfolioLead}</p>
        {projects.length > 0 && (
          <div className="gd-chips">
            <span className="gd-chip">
              <StageDot stage="tree" />
              {tx.gardenCount(trees, projects.length - trees)}
            </span>
          </div>
        )}
      </section>

      <section className="gd-sec" aria-label={t("portfolio.title")}>
        {categories.length > 0 && (
          <div className="gd-filter" role="group" aria-label={tx.filterBeds}>
            {[null, ...categories].map((c) => (
              <button key={c ?? "__all"} type="button" aria-pressed={category === c} onClick={() => setCategory(c)}>
                {c ?? tx.all}
              </button>
            ))}
          </div>
        )}

        {visible.length === 0 ? (
          <p className="gd-p gd-muted">{tx.empty}</p>
        ) : (
          <div className="gd-cards" aria-live="polite">
            {visible.map((p, i) => (
              <ProjectCard key={p.id} project={p} wide={i === 0 && category === null && visible.length > 2} headingLevel={2} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
