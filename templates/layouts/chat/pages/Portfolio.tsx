import { useState } from "react";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { hasCaseStudy, listCategories, filterByCategory } from "@/utils/portfolioContent";
import { portfolioRepository } from "@/repositories/instances";
import type { Project } from "@/repositories/interfaces/PortfolioRepository";
import { Ask, Bubble, ChatLog, ChatSection, DayChip, LinkCard, MetricLine, useChatText } from "@/components/ChatShared";

/** Uma ação só: o case quando existe, senão o link do projeto (demo ou código). */
function projectHref(p: Project): string | undefined {
  if (hasCaseStudy(p)) return `/portfolio/${p.slug}`;
  return p.demo_link || p.github_link || undefined;
}

export default function ChatPortfolio() {
  const { t } = useTranslation();
  const text = useChatText();
  const { projects, isLoading } = usePortfolio(portfolioRepository);
  const [category, setCategory] = useState<string | null>(null);

  if (isLoading) return null;

  const categories = listCategories(projects);
  const visible = filterByCategory(projects, category);

  return (
    <ChatLog>
      <h1 className="ct-sr">{t("portfolio.title")}</h1>
      <DayChip />

      <ChatSection title={t("portfolio.title")} ask={text.qProjects}>
        {projects.length === 0 ? (
          <Bubble>
            <p>{text.noProjects}</p>
          </Bubble>
        ) : (
          <Bubble>
            <p>{text.projectsIntro(projects.length)}</p>
            {categories.length > 0 && (
              <div className="ct-acts" role="group" aria-label={text.filterLabel}>
                {[null, ...categories].map((c) => (
                  <button
                    key={c ?? "__all"}
                    type="button"
                    className="ct-pill"
                    aria-pressed={category === c}
                    onClick={() => setCategory(c)}
                  >
                    {c ?? t("portfolio.all")}
                  </button>
                ))}
              </div>
            )}
          </Bubble>
        )}

        {/* O filtro vira uma pergunta na conversa e a resposta traz só os projetos da área */}
        {category && <Ask>{text.filterAsk(category)}</Ask>}

        {visible.length > 0 && (
          <Bubble wide>
            {category && <p>{text.filterAnswer(visible.length)}</p>}
            <div className="ct-cards" aria-live="polite">
              {visible.map((p, i) => {
                const href = projectHref(p);
                const withCase = hasCaseStudy(p);
                const featured = i === 0 && !category && visible.length > 2;
                return (
                  <LinkCard
                    key={p.id}
                    href={href}
                    image={p.images?.[0]}
                    title={p.title}
                    big={featured}
                    badge={featured ? text.featured : undefined}
                    umamiEvent={withCase ? "portfolio-case" : undefined}
                    umamiCase={withCase ? p.slug : undefined}
                  >
                    {p.category && <small>{p.category}</small>}
                    {p.description && <p>{p.description}</p>}
                    <MetricLine metric={p.case_study?.metrics?.[0]} />
                    {href && <span className="ct-act">{withCase ? text.readCase : text.openProject}</span>}
                  </LinkCard>
                );
              })}
            </div>
          </Bubble>
        )}
      </ChatSection>
    </ChatLog>
  );
}
