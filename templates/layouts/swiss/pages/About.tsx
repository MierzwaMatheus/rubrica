import { useAbout } from "@/hooks/useAbout";
import { useHome } from "@/hooks/useHome";
import { aboutRepository, homeRepository } from "@/repositories/instances";
import { SwissShell, SwissGridLines } from "@/components/SwissShared";

export default function SwissAbout() {
  const { dailyRoutine, faq, isLoading: aboutLoading } = useAbout(aboutRepository);
  const { aboutText, isLoading: homeLoading } = useHome(homeRepository);

  if (aboutLoading || homeLoading) return null;

  const introSections = aboutText.split("\n\n").filter(Boolean).slice(0, 3);
  while (introSections.length < 3) {
    introSections.push("");
  }

  return (
    <SwissShell page="Sobre Mim" idx={4}>
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
          }}
        >
          <div
            style={{
              gridColumn: "span 2",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
            }}
          >
            .12 — Sobre
            <br />
            Mim
          </div>
          <h1
            style={{
              gridColumn: "span 10",
              fontSize: 88,
              fontWeight: 900,
              letterSpacing: "-0.04em",
              margin: 0,
              lineHeight: 0.92,
            }}
          >
            O cara da tecnologia,
            <br />
            fora do{" "}
            <span
              style={{
                background: "var(--primary)",
                color: "var(--bg)",
                padding: "0 10px",
              }}
            >
              computador.
            </span>
          </h1>
        </div>
      </div>

      {/* Bio */}
      <div style={{ padding: "40px 18px", borderBottom: "2px solid var(--text)" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
            }}
          >
            .13 — Manifesto
            <br />
            Pessoal
          </div>
          {introSections.map((para, i) => (
            <p key={i} style={{ fontSize: 12.5, lineHeight: 1.65, margin: 0 }}>
              {i === 0 && para.length > 0 ? (
                <>
                  <span
                    style={{
                      fontSize: 38,
                      fontWeight: 900,
                      lineHeight: 0.85,
                      float: "left",
                      marginRight: 8,
                      marginTop: 4,
                      color: "var(--primary)",
                    }}
                  >
                    {para[0]}
                  </span>
                  {para.slice(1)}
                </>
              ) : (
                para
              )}
            </p>
          ))}
        </div>
      </div>

      {/* Gallery */}
      {dailyRoutine.length > 0 && (
        <div style={{ padding: "40px 18px", borderBottom: "2px solid var(--text)" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(12, 1fr)",
              gap: 12,
              marginBottom: 28,
            }}
          >
            <div
              style={{
                gridColumn: "span 2",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
              }}
            >
              .14 — Meu
              <br />
              dia-a-dia
            </div>
            <h3
              style={{
                gridColumn: "span 10",
                fontSize: 36,
                fontWeight: 900,
                letterSpacing: "-0.02em",
                margin: 0,
                lineHeight: 1,
              }}
            >
              {dailyRoutine.length} fotos do arquivo pessoal.
            </h3>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(6, 1fr)",
              gap: 4,
              border: "1px solid var(--text)",
            }}
          >
            {dailyRoutine.map((g, i) => {
              const label = g.tags?.[0] ?? g.description.slice(0, 15);
              return (
                <div
                  key={g.id}
                  style={{
                    borderRight:
                      (i + 1) % 6 !== 0 && i < dailyRoutine.length - 1
                        ? "1px solid var(--text)"
                        : "none",
                  }}
                >
                  {g.image_url ? (
                    <img
                      src={g.image_url}
                      alt={label}
                      style={{
                        width: "100%",
                        aspectRatio: "4/5",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        aspectRatio: "4/5",
                        background:
                          "color-mix(in oklab, var(--text) 12%, transparent)",
                      }}
                    />
                  )}
                  <div
                    style={{
                      padding: "6px 8px",
                      borderTop: "1px solid var(--text)",
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 9.5,
                      fontWeight: 600,
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}
                  >
                    <span>.{String(i + 1).padStart(2, "0")}</span>
                    <span style={{ opacity: 0.6 }}>{label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* FAQ */}
      {faq.length > 0 && (
        <div style={{ padding: "40px 18px", borderBottom: "2px solid var(--text)" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(12, 1fr)",
              gap: 12,
              marginBottom: 28,
            }}
          >
            <div
              style={{
                gridColumn: "span 2",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
              }}
            >
              .15 — FAQ
              <br />
              Pessoal
            </div>
            <h3
              style={{
                gridColumn: "span 10",
                fontSize: 36,
                fontWeight: 900,
                letterSpacing: "-0.02em",
                margin: 0,
                lineHeight: 1,
              }}
            >
              {faq.length} perguntas. {faq.length} respostas.
            </h3>
          </div>
          <div style={{ border: "1px solid var(--text)" }}>
            {faq.map((f, i) => (
              <div
                key={f.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "80px 1fr 2fr",
                  gap: 16,
                  padding: 18,
                  borderBottom:
                    i < faq.length - 1 ? "1px solid var(--text)" : "none",
                  background: i === 0 ? "var(--text)" : "transparent",
                  color: i === 0 ? "var(--bg)" : "var(--text)",
                }}
              >
                <div
                  style={{
                    fontSize: 48,
                    fontWeight: 900,
                    lineHeight: 0.85,
                    letterSpacing: "-0.04em",
                  }}
                >
                  0{i + 1}
                </div>
                <h4
                  style={{
                    fontSize: 15,
                    fontWeight: 800,
                    letterSpacing: "-0.01em",
                    lineHeight: 1.25,
                    margin: 0,
                  }}
                >
                  {f.question}
                </h4>
                <p
                  style={{
                    fontSize: 12,
                    lineHeight: 1.55,
                    margin: 0,
                    opacity: i === 0 ? 0.95 : 0.85,
                  }}
                >
                  {f.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </SwissShell>
  );
}
