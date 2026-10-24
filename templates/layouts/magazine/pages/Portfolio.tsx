import { useState } from "react";
import { Link } from "wouter";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { portfolioRepository } from "@/repositories/instances";
import { filterByCategory, hasCaseStudy, listCategories } from "@/utils/portfolioContent";

const mono = { fontFamily: "var(--font-mono)", textTransform: "uppercase" as const };

export default function Portfolio() {
  const { t } = useTranslation();
  const { projects, isLoading } = usePortfolio(portfolioRepository);
  const [category, setCategory] = useState<string | null>(null);
  if (isLoading) return null;
  const pad = 48;
  const categories = listCategories(projects);
  const visible = filterByCategory(projects, category);
  const filters: Array<{ label: string; value: string | null }> = [{ label: t("portfolio.all"), value: null }, ...categories.map((c) => ({ label: c, value: c }))];

  return (
    <div style={{ background: "var(--bg)", color: "var(--text)", fontFamily: "var(--font-sans)", minHeight: "100%" }}>
      <div style={{ padding: `${pad}px ${pad}px ${pad - 12}px`, textAlign: "center" }}>
        <h1 style={{ fontFamily: "var(--font-sans)", fontSize: "clamp(56px, 8vw, 96px)", fontWeight: 500, letterSpacing: "-0.02em", margin: 0, lineHeight: 0.95 }}><em style={{ color: "var(--primary)" }}>Obras</em> Selecionadas</h1>
        <p style={{ fontFamily: "var(--font-sans)", fontStyle: "italic", fontSize: 19, opacity: 0.7, marginTop: 14 }}>{projects.length} projetos · Curadoria pessoal</p>
      </div>

      {/* Seções da edição: filtro por categoria (some quando nenhum projeto tem categoria) */}
      {categories.length > 0 && (
        <div style={{ padding: `0 ${pad}px ${pad - 24}px`, borderBottom: "0.5px solid var(--text)" }}>
          <div style={{ ...mono, fontSize: 10, letterSpacing: "0.2em", opacity: 0.55, marginBottom: 12 }}>Seções desta edição ↓</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 20px", ...mono, fontSize: 11, letterSpacing: "0.14em" }}>
            {filters.map((f) => {
              const active = category === f.value;
              return (
                <button
                  key={f.label}
                  onClick={() => setCategory(f.value)}
                  aria-pressed={active}
                  style={{ padding: "4px 0", background: "none", border: "none", borderBottom: active ? "2px solid var(--primary)" : "2px solid transparent", color: active ? "var(--primary)" : "var(--text)", opacity: active ? 1 : 0.7, cursor: "pointer", font: "inherit", letterSpacing: "inherit", textTransform: "inherit" }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ padding: `${pad}px ${pad}px 0` }}>
        {visible.map((p, i) => {
          const flip = i % 2 === 1;
          const metric = p.case_study?.metrics?.[0];
          const withCase = hasCaseStudy(p);
          return (
            <article key={p.id} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 48, paddingBottom: 56, marginBottom: 56, borderBottom: i < visible.length - 1 ? "0.5px solid var(--text)" : "none", alignItems: "center" }}>
              <div style={{ order: flip ? 2 : 1, aspectRatio: "4/3", position: "relative", overflow: "hidden" }}>
                {p.images?.[0] ? (
                  <img src={p.images[0]} alt={p.title} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                ) : (
                  <div style={{ position: "absolute", inset: 0, background: "var(--text)", opacity: 0.08 }} />
                )}
              </div>
              <div style={{ order: flip ? 1 : 2 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginBottom: 8 }}>
                  <span style={{ fontFamily: "var(--font-sans)", fontSize: 64, lineHeight: 0.9, color: "var(--primary)", fontWeight: 500 }}>{String(i + 1).padStart(2, "0")}</span>
                  <span style={{ ...mono, fontSize: 10, letterSpacing: "0.22em", opacity: 0.55 }}>{p.category || `Edição ${String(i + 1).padStart(2, "0")}`}</span>
                </div>
                <h2 style={{ fontFamily: "var(--font-sans)", fontSize: 44, fontWeight: 500, margin: "4px 0 14px", letterSpacing: "-0.01em", lineHeight: 1.05 }}>{p.title}</h2>
                <p style={{ fontFamily: "var(--font-sans)", fontStyle: "italic", fontSize: 17, lineHeight: 1.5, opacity: 0.88, margin: "0 0 20px" }}>{p.description}</p>
                {metric && (
                  <p style={{ margin: "0 0 20px", display: "flex", alignItems: "baseline", gap: 12 }}>
                    <span style={{ fontFamily: "var(--font-sans)", fontSize: 34, fontWeight: 500, color: "var(--primary)", whiteSpace: "nowrap" }}>{metric.value}</span>
                    <span style={{ ...mono, fontSize: 10.5, letterSpacing: "0.12em", opacity: 0.75 }}>{metric.label}</span>
                  </p>
                )}
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "4px 14px", ...mono, fontSize: 10.5, letterSpacing: "0.14em", borderTop: "0.5px solid var(--text)", paddingTop: 14 }}>
                  {withCase ? (
                    <Link href={`/portfolio/${p.slug}`} data-umami-event="portfolio-case" data-umami-event-case={p.slug} style={{ color: "var(--accent)", textDecoration: "none", marginRight: 8 }}>
                      Ler a reportagem →
                    </Link>
                  ) : p.demo_link ? (
                    <a href={p.demo_link} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)", textDecoration: "none", marginRight: 8 }}>
                      Ver o projeto ↗
                    </a>
                  ) : null}
                  {(p.tags ?? []).slice(0, 4).map((tag) => <span key={tag} style={{ opacity: 0.6 }}>{tag}</span>)}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
