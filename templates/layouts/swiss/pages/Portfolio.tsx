import { useState } from "react";
import { Link } from "wouter";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { hasCaseStudy, listCategories, filterByCategory } from "@/utils/portfolioContent";
import { portfolioRepository } from "@/repositories/instances";
import { SwissShell, SwissGridLines } from "@/components/SwissShared";

export default function SwissPortfolio() {
  const { t } = useTranslation();
  const { projects, isLoading } = usePortfolio(portfolioRepository);
  const [category, setCategory] = useState<string | null>(null);

  if (isLoading) return null;

  const categories = listCategories(projects);
  const visible = filterByCategory(projects, category);

  return (
    <SwissShell page="Portfólio" idx={3}>
      {/* Header */}
      <div
        style={{
          padding: "40px 18px",
          borderBottom: "2px solid var(--text)",
          position: "relative",
        }}
      >
        <SwissGridLines cols={12} />
        <div
          style={{
            position: "relative",
            display: "grid",
            gridTemplateColumns: "repeat(12, 1fr)",
            gap: 12,
            alignItems: "end",
          }}
        >
          <div style={{ gridColumn: "span 8" }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                marginBottom: 14,
                color: "var(--accent)",
              }}
            >
              .11 — Index of Works
            </div>
            <h1
              style={{
                fontSize: "clamp(46px, 13.3vw, 96px)",
                fontWeight: 900,
                letterSpacing: "-0.05em",
                margin: 0,
                lineHeight: 0.88,
              }}
            >
              <span
                style={{
                  background: "var(--primary)",
                  color: "var(--bg)",
                  padding: "0 12px",
                }}
              >
                {projects.length}
              </span>{" "}
              obras
              <br />
              selecionadas.
            </h1>
          </div>
          <div style={{ gridColumn: "span 4", fontSize: 13, lineHeight: 1.5 }}>
            Uma curadoria pessoal dos meus trabalhos recentes. Cada item abre um estudo
            de caso completo, em ordem cronológica reversa.
          </div>
        </div>
      </div>

      {/* Filtros por categoria (escondidos quando nenhum projeto tem categoria) */}
      {categories.length > 0 && (
        <div
          style={{
            padding: "20px 18px",
            borderBottom: "2px solid var(--text)",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "baseline",
            gap: "6px 4px",
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              marginRight: 14,
              opacity: 0.6,
            }}
          >
            .filtros
          </span>
          {[null, ...categories].map((c) => {
            const active = category === c;
            return (
              <button
                key={c ?? "__all"}
                type="button"
                onClick={() => setCategory(c)}
                aria-pressed={active}
                style={{
                  padding: "6px 12px",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  background: active ? "var(--primary)" : "transparent",
                  color: active ? "var(--bg)" : "var(--text)",
                  border: active
                    ? "1px solid var(--primary)"
                    : "1px solid color-mix(in oklab, var(--text) 25%, transparent)",
                  letterSpacing: "-0.005em",
                }}
              >
                {c ?? t("portfolio.all")}
              </button>
            );
          })}
        </div>
      )}

      {/* Project grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          borderBottom: "2px solid var(--text)",
        }}
      >
        {visible.map((p, i) => {
          const metric = p.case_study?.metrics?.[0];
          const withCase = hasCaseStudy(p);
          return (
          <article
            key={p.id}
            style={{
              padding: 20,
              borderRight: i % 2 === 0 ? "1px solid var(--text)" : "none",
              borderBottom: i < visible.length - 2 ? "1px solid var(--text)" : "none",
              background: i === 0 ? "var(--accent)" : "transparent",
              color: i === 0 ? "var(--bg)" : "var(--text)",
            }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 16 }}>
              <div>
                {p.images[0] ? (
                  <img
                    src={p.images[0]}
                    alt={p.title}
                    style={{
                      width: "100%",
                      aspectRatio: "4/3",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      aspectRatio: "4/3",
                      background:
                        "color-mix(in oklab, var(--text) 15%, transparent)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      opacity: 0.5,
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                    }}
                  >
                    {p.title.split(" ")[0].toLowerCase()}
                  </div>
                )}
                <div
                  style={{
                    marginTop: 10,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                  }}
                >
                  <span
                    style={{
                      fontSize: 48,
                      fontWeight: 900,
                      lineHeight: 0.85,
                      letterSpacing: "-0.05em",
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
              </div>
              <div>
                <h3
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    margin: "0 0 8px",
                    letterSpacing: "-0.02em",
                    lineHeight: 1.05,
                  }}
                >
                  {p.title}
                </h3>
                <p
                  style={{
                    fontSize: 12,
                    lineHeight: 1.5,
                    margin: "0 0 12px",
                    opacity: i === 0 ? 0.9 : 0.8,
                  }}
                >
                  {p.description.length > 180 ? `${p.description.slice(0, 180)}…` : p.description}
                </p>
                {metric && (
                  <div style={{ marginBottom: 12 }}>
                    <span
                      style={{
                        background: i === 0 ? "var(--bg)" : "var(--primary)",
                        color: i === 0 ? "var(--accent)" : "var(--bg)",
                        padding: "2px 8px",
                        fontSize: 18,
                        fontWeight: 900,
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {metric.value}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        marginLeft: 8,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                      }}
                    >
                      {metric.label}
                    </span>
                  </div>
                )}
                <div
                  style={{ display: "flex", flexWrap: "wrap", gap: 3, marginBottom: 12 }}
                >
                  {p.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      style={{
                        padding: "2px 6px",
                        background:
                          i === 0
                            ? "var(--bg)"
                            : "color-mix(in oklab, var(--bg) 75%, var(--text) 25%)",
                        color: i === 0 ? "var(--accent)" : "var(--text)",
                        fontSize: 9.5,
                        fontWeight: 700,
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                {(withCase || p.demo_link) && (() => {
                  const ctaStyle: React.CSSProperties = {
                    display: "block",
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    borderTop: "1px solid currentColor",
                    paddingTop: 8,
                    color: "inherit",
                    textDecoration: "none",
                  };
                  return withCase ? (
                    <Link
                      href={`/portfolio/${p.slug}`}
                      data-umami-event="portfolio-case"
                      data-umami-event-case={p.slug}
                      style={ctaStyle}
                    >
                      {t("portfolio.viewCase")} →
                    </Link>
                  ) : (
                    <a href={p.demo_link} target="_blank" rel="noopener noreferrer" style={ctaStyle}>
                      Ver projeto ↗
                    </a>
                  );
                })()}
              </div>
            </div>
          </article>
          );
        })}
      </div>
    </SwissShell>
  );
}
