import { usePortfolio } from "@/hooks/usePortfolio";
import { portfolioRepository } from "@/repositories/instances";
import { SwissShell, SwissGridLines } from "@/components/SwissShared";

export default function SwissPortfolio() {
  const { projects, isLoading } = usePortfolio(portfolioRepository);

  if (isLoading) return null;

  const portfolioFilters = Array.from(new Set(projects.flatMap((p) => p.tags)));

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
                fontSize: 96,
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

      {/* Filters */}
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
        {portfolioFilters.map((f, i) => (
          <span
            key={f}
            style={{
              padding: "4px 10px",
              fontSize: 11,
              fontWeight: 600,
              background: i === 0 ? "var(--primary)" : "transparent",
              color: i === 0 ? "var(--bg)" : "var(--text)",
              border:
                i === 0
                  ? "none"
                  : "1px solid color-mix(in oklab, var(--text) 25%, transparent)",
              letterSpacing: "-0.005em",
            }}
          >
            {f}
          </span>
        ))}
      </div>

      {/* Project grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          borderBottom: "2px solid var(--text)",
        }}
      >
        {projects.map((p, i) => (
          <article
            key={p.id}
            style={{
              padding: 20,
              borderRight: i % 2 === 0 ? "1px solid var(--text)" : "none",
              borderBottom: i < projects.length - 2 ? "1px solid var(--text)" : "none",
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
                  {p.description.slice(0, 180)}…
                </p>
                <div
                  style={{ display: "flex", flexWrap: "wrap", gap: 3, marginBottom: 12 }}
                >
                  {p.tags.slice(0, 5).map((t) => (
                    <span
                      key={t}
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
                      {t}
                    </span>
                  ))}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    borderTop: "1px solid currentColor",
                    paddingTop: 8,
                    opacity: 0.8,
                  }}
                >
                  Estudo de caso →
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </SwissShell>
  );
}
