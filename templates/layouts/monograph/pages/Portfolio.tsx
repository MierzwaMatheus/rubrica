/**
 * Monografia — Portfólio. O sumário de todas as obras: numeral romano, título, linha
 * pontilhada e página. As categorias viram "Partes" do livro (e o filtro), a primeira
 * métrica do case aparece em itálico abaixo e cada obra tem uma ação só: o título leva ao
 * case quando existe, senão ao link do projeto.
 */
import { useState } from "react";
import { Link } from "wouter";
import { SEO } from "@/components/SEO";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { hasCaseStudy, listCategories, filterByCategory } from "@/utils/portfolioContent";
import { portfolioRepository } from "@/repositories/instances";
import type { Project } from "@/repositories/interfaces/PortfolioRepository";
import {
  Leader,
  MnChapter,
  MnMain,
  MnSection,
  projectFolios,
  toRoman,
  useMonographText,
} from "@/components/MonographShared";

/** Quantas obras abrem o sumário em corpo maior. */
const FEATURED = 3;

interface Part {
  key: string;
  title: string | null;
  number: number;
  items: Project[];
}

export default function MonographPortfolio() {
  const { t } = useTranslation();
  const tx = useMonographText();
  const { projects, isLoading } = usePortfolio(portfolioRepository);
  const [category, setCategory] = useState<string | null>(null);

  if (isLoading) return null;

  const categories = listCategories(projects);
  const book = projectFolios(projects);

  // Sem filtro, o sumário se divide em partes (uma por categoria, na ordem em que aparecem);
  // os projetos sem categoria ficam no fim, sem título de parte.
  const parts: Part[] = category
    ? [{ key: category, title: category, number: categories.indexOf(category) + 1, items: filterByCategory(projects, category) }]
    : categories.length > 0
      ? [
          ...categories.map((c, i) => ({ key: c, title: c, number: i + 1, items: filterByCategory(projects, c) })),
          { key: "__sem", title: null, number: 0, items: projects.filter((p) => !p.category?.trim()) },
        ].filter((p) => p.items.length > 0)
      : [{ key: "__todas", title: null, number: 0, items: projects }];

  const renderEntry = (p: Project, Heading: "h3" | "h4") => {
    const { n, page } = book.get(p.id) ?? { n: 0, page: 0 };
    const metric = p.case_study?.metrics?.[0];
    const withCase = hasCaseStudy(p);
    const big = n <= FEATURED;
    const leader = (
      <Leader big={big} value={`${tx.page} ${page}`}>
        <em>{toRoman(n)}.</em>
        {p.title}
        {withCase ? " →" : p.demo_link ? " ↗" : ""}
      </Leader>
    );
    return (
      <li key={p.id} className="mn-entry">
        <Heading>
          {withCase ? (
            <Link
              href={`/portfolio/${p.slug}`}
              className="mn-entry-link"
              data-umami-event="portfolio-case"
              data-umami-event-case={p.slug}
              aria-label={`${p.title} — ${tx.readCase}`}
            >
              {leader}
            </Link>
          ) : p.demo_link ? (
            <a
              href={p.demo_link}
              target="_blank"
              rel="noopener noreferrer"
              className="mn-entry-link"
              aria-label={`${p.title} — ${tx.viewProject} ${tx.externalLink}`}
            >
              {leader}
            </a>
          ) : (
            leader
          )}
        </Heading>
        {n === 1 && p.images?.[0] ? (
          <figure className="mn-fig">
            <img src={p.images[0]} alt="" loading="lazy" />
            <figcaption>
              <b>
                {tx.plate} {toRoman(1)}
              </b>
              {p.title}
            </figcaption>
          </figure>
        ) : null}
        {p.description ? <p className="mn-entry-desc">{p.description}</p> : null}
        {metric ? (
          <p className="mn-entry-metric">
            <b>{metric.value}</b>
            {metric.label}
          </p>
        ) : null}
        {p.tags?.length ? <p className="mn-entry-meta">{p.tags.slice(0, 3).join(" · ")}</p> : null}
      </li>
    );
  };

  return (
    <>
      <SEO title={t("portfolio.title")} description={t("portfolio.subtitle")} url="/portfolio" />

      <MnChapter number={3} title={t("portfolio.title")} dek={t("portfolio.subtitle")}>
        {categories.length > 0 && (
          <nav aria-label={tx.parts} className="mn-parts-nav">
            <ul className="mn-parts">
              {[null, ...categories].map((c) => (
                <li key={c ?? "__todas"}>
                  <button
                    type="button"
                    className="mn-act mn-part-btn"
                    aria-pressed={category === c}
                    onClick={() => setCategory(c)}
                  >
                    {c ? `${tx.part} ${toRoman(categories.indexOf(c) + 1)} · ${c}` : tx.allParts}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </MnChapter>

      <MnSection id="obras" label={tx.contents} sub={tx.works}>
        <MnMain>
          {projects.length === 0 ? (
            <p className="mn-entry-sum">{tx.noProjects}</p>
          ) : (
            parts.map((part) => (
              <div key={part.key} className="mn-part">
                {part.title ? (
                  <h3 className="mn-part-h">
                    <span>
                      {tx.part} {toRoman(part.number)}
                    </span>
                    {part.title}
                  </h3>
                ) : null}
                <ol className="mn-toc-list">{part.items.map((p) => renderEntry(p, part.title ? "h4" : "h3"))}</ol>
              </div>
            ))
          )}
        </MnMain>
      </MnSection>
    </>
  );
}
