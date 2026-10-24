import { useState } from "react";
import { Link } from "wouter";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { portfolioRepository } from "@/repositories/instances";
import type { Project } from "@/repositories/interfaces/PortfolioRepository";
import { filterByCategory, hasCaseStudy, listCategories } from "@/utils/portfolioContent";
import { ArrowUpRight } from "lucide-react";

function BentoCard({
  children,
  span = "auto",
  padding = 22,
  radius = 22,
  style = {},
}: {
  children: React.ReactNode;
  span?: number | "auto";
  padding?: number;
  radius?: number;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        gridColumn: span === "auto" ? "auto" : `span ${span}`,
        background: "color-mix(in srgb, var(--text) 10%, var(--bg))",
        borderRadius: radius,
        padding,
        border: "0.5px solid color-mix(in srgb, var(--text) 20%, transparent)",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** Primeira métrica do case, em destaque no cartão. */
function CardMetric({ project, size = 20 }: { project: Project; size?: number }) {
  const metric = project.case_study?.metrics?.[0];
  if (!metric) return null;
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 8, margin: "0 0 12px" }}>
      <span style={{ fontSize: size, fontWeight: 700, color: "var(--primary)" }}>{metric.value}</span>
      <span style={{ fontSize: 11.5, opacity: 0.7 }}>{metric.label}</span>
    </div>
  );
}

/** Uma ação por cartão: o case quando existe, senão o link do projeto. */
function CardAction({ project, label }: { project: Project; label: string }) {
  const style: React.CSSProperties = {
    marginTop: "auto",
    paddingTop: 12,
    fontFamily: "var(--font-mono)",
    fontSize: 12,
    color: "var(--primary)",
    textDecoration: "none",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
  };
  if (hasCaseStudy(project)) {
    return (
      <Link to={`/portfolio/${project.slug}`} data-umami-event="portfolio-case" data-umami-event-case={project.slug} style={style}>
        {label} →
      </Link>
    );
  }
  if (project.demo_link) {
    return (
      <a href={project.demo_link} target="_blank" rel="noreferrer" style={style}>
        ver projeto <ArrowUpRight size={13} />
      </a>
    );
  }
  return null;
}

export default function BentoPortfolio() {
  const { t } = useTranslation();
  const { projects } = usePortfolio(portfolioRepository);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const categories = listCategories(projects);
  const filtered = filterByCategory(projects, activeFilter);
  const caseLabel = t("portfolio.viewCase");

  const gap = 14;
  const featured = filtered[0];
  const secondary = filtered.slice(1, 3);
  const rest = filtered.slice(3);

  return (
    <div
      style={{
        paddingTop: 84,
        paddingBottom: 110,
        paddingLeft: 28,
        paddingRight: 28,
        boxSizing: "border-box",
      }}
    >
      {/* Header + filter dock */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(12, 1fr)",
          gap,
          marginBottom: gap,
        }}
      >
        <BentoCard span={categories.length > 0 ? 6 : 12} padding={28}>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10.5,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "var(--text)",
              marginBottom: 12,
            }}
          >
            $ ls -la projects/
          </div>
          <h1
            style={{
              fontSize: 52,
              margin: 0,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              lineHeight: 0.95,
            }}
          >
            Portfólio
          </h1>
          <p style={{ fontSize: 13, lineHeight: 1.5, opacity: 0.7, margin: "10px 0 0" }}>
            Uma seleção dos meus trabalhos recentes — {projects.length} projetos.
          </p>
        </BentoCard>
        {categories.length > 0 && (
        <BentoCard span={6} padding={22}>
          <div
            style={{
              fontSize: 11,
              opacity: 0.55,
              marginBottom: 10,
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
          >
            Filtrar
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            <span
              onClick={() => setActiveFilter(null)}
              style={{
                padding: "4px 10px",
                borderRadius: 999,
                fontSize: 10.5,
                fontWeight: 500,
                cursor: "pointer",
                background: !activeFilter
                  ? "var(--primary)"
                  : "color-mix(in srgb, var(--text) 20%, transparent)",
                color: !activeFilter ? "var(--bg)" : "var(--text)",
              }}
            >
              Todos
            </span>
            {categories.map((f) => (
              <span
                key={f}
                onClick={() => setActiveFilter(f === activeFilter ? null : f)}
                style={{
                  padding: "4px 10px",
                  borderRadius: 999,
                  fontSize: 10.5,
                  fontWeight: 500,
                  cursor: "pointer",
                  background:
                    f === activeFilter
                      ? "var(--primary)"
                      : "color-mix(in srgb, var(--text) 20%, transparent)",
                  color: f === activeFilter ? "var(--bg)" : "var(--text)",
                }}
              >
                {f}
              </span>
            ))}
          </div>
        </BentoCard>
        )}
      </div>

      {/* Project grid — asymmetric bento */}
      {filtered.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(12, 1fr)",
            gridAutoRows: "minmax(220px, auto)",
            gap,
          }}
        >
          {/* Featured project */}
          {featured && (
            <BentoCard
              span={7}
              padding={0}
              style={{ gridRow: "span 2", overflow: "hidden" }}
            >
              <div
                style={{
                  height: 320,
                  background: "color-mix(in srgb, var(--text) 10%, transparent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                }}
              >
                {featured.images?.[0] ? (
                  <img
                    src={featured.images?.[0]}
                    alt={featured.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <span style={{ fontSize: 48, opacity: 0.2 }}>{featured.title[0]}</span>
                )}
                <div
                  style={{
                    position: "absolute",
                    top: 14,
                    left: 14,
                    padding: "5px 10px",
                    borderRadius: 999,
                    background: "var(--accent)",
                    color: "var(--bento-on-accent)",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                  }}
                >
                  ★ Destaque
                </div>
              </div>
              <div style={{ padding: 28, flex: 1 }}>
                <h2
                  style={{
                    fontSize: 30,
                    fontWeight: 700,
                    margin: 0,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {featured.title}
                </h2>
                <p
                  style={{
                    fontSize: 14,
                    lineHeight: 1.55,
                    opacity: 0.78,
                    margin: "12px 0 16px",
                  }}
                >
                  {featured.description}
                </p>
                <CardMetric project={featured} size={26} />
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {(featured.tags ?? []).map((tag) => (
                    <span
                      key={tag}
                      style={{
                        padding: "4px 10px",
                        borderRadius: 8,
                        background: "color-mix(in srgb, var(--text) 20%, transparent)",
                        fontSize: 10.5,
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div style={{ display: "flex" }}>
                  <CardAction project={featured} label={caseLabel} />
                </div>
              </div>
            </BentoCard>
          )}

          {/* Two top-right cards */}
          {secondary.map((p) => (
            <BentoCard key={p.id} span={5} padding={0} style={{ overflow: "hidden" }}>
              <div
                style={{
                  height: 140,
                  background: "color-mix(in srgb, var(--text) 10%, transparent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {p.images?.[0] ? (
                  <img
                    src={p.images?.[0]}
                    alt={p.title}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <span style={{ fontSize: 32, opacity: 0.2 }}>{p.title[0]}</span>
                )}
              </div>
              <div style={{ padding: 18, display: "flex", flexDirection: "column", flex: 1 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{p.title}</h3>
                <p
                  style={{
                    fontSize: 11.5,
                    lineHeight: 1.5,
                    opacity: 0.7,
                    margin: "6px 0 10px",
                  }}
                >
                  {p.description && p.description.length > 110
                    ? p.description.slice(0, 110) + "…"
                    : p.description}
                </p>
                <CardMetric project={p} />
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {(p.tags ?? []).slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      style={{
                        padding: "2px 8px",
                        borderRadius: 6,
                        background: "color-mix(in srgb, var(--text) 20%, transparent)",
                        fontSize: 10,
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <CardAction project={p} label={caseLabel} />
              </div>
            </BentoCard>
          ))}

          {/* Remaining cards */}
          {rest.map((p) => (
            <BentoCard key={p.id} span={4} padding={20}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 11,
                    background: "var(--primary)",
                    color: "var(--bg)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                  }}
                >
                  {p.title[0]}
                </div>
                <ArrowUpRight size={16} style={{ opacity: 0.4 }} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{p.title}</h3>
              <p
                style={{
                  fontSize: 11.5,
                  lineHeight: 1.55,
                  opacity: 0.72,
                  margin: "8px 0 14px",
                  flex: 1,
                }}
              >
                {p.description && p.description.length > 120
                  ? p.description.slice(0, 120) + "…"
                  : p.description}
              </p>
              <CardMetric project={p} />
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {(p.tags ?? []).slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    style={{
                      padding: "2px 8px",
                      borderRadius: 6,
                      background: "color-mix(in srgb, var(--text) 20%, transparent)",
                      fontSize: 10,
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <CardAction project={p} label={caseLabel} />
            </BentoCard>
          ))}
        </div>
      )}
    </div>
  );
}
