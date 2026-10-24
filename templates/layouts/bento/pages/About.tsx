import { useAbout } from "@/hooks/useAbout";
import { useHome } from "@/hooks/useHome";
import { useWorkPrinciples } from "@/hooks/useWorkPrinciples";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { aboutRepository, homeRepository } from "@/repositories/instances";
import { splitParagraphs } from "@/utils/aboutContent";
import { highlightNumbers } from "@/utils/homeContent";

function BentoCard({
  children,
  span = "auto",
  tint,
  padding = 22,
  radius = 22,
  style = {},
}: {
  children: React.ReactNode;
  span?: number | "auto";
  tint?: string;
  padding?: number;
  radius?: number;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        gridColumn: span === "auto" ? "auto" : `span ${span}`,
        background: tint || "color-mix(in srgb, var(--text) 10%, var(--bg))",
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

/** Parágrafo com os números de resultado em negrito. */
function Highlighted({ text }: { text: string }) {
  return (
    <>
      {highlightNumbers(text).map((seg, i) =>
        seg.highlight ? (
          <strong key={i} style={{ fontWeight: 700, color: "var(--primary)" }}>
            {seg.text}
          </strong>
        ) : (
          <span key={i}>{seg.text}</span>
        )
      )}
    </>
  );
}

export default function BentoAbout() {
  const { t } = useTranslation();
  const { dailyRoutine, faq } = useAbout(aboutRepository);
  const { aboutText, services } = useHome(homeRepository);
  const { principles } = useWorkPrinciples(homeRepository);
  const paragraphs = splitParagraphs(aboutText ?? "");
  const personalText = t("about.aboutMe.text");

  const gap = 14;

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
      {/* Hero row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(12, 1fr)",
          gap,
          marginBottom: gap,
        }}
      >
        <BentoCard
          span={8}
          padding={32}
          style={{ background: "color-mix(in srgb, var(--text) 10%, transparent)" }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10.5,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "var(--primary)",
              marginBottom: 14,
            }}
          >
            $ cat about.md
          </div>
          <h1
            style={{
              fontSize: 44,
              margin: 0,
              fontWeight: 700,
              letterSpacing: "-0.025em",
              lineHeight: 1.05,
            }}
          >
            Sobre Mim
          </h1>
          <div
            style={{
              fontSize: 11,
              opacity: 0.55,
              margin: "18px 0 8px",
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
            }}
          >
            {t("about.professional.title")}
          </div>
          {paragraphs.map((para, i) => (
            <p
              key={i}
              style={{
                fontSize: i === 0 ? 15 : 13.5,
                lineHeight: 1.6,
                opacity: i === 0 ? 0.95 : 0.78,
                margin: i === 0 ? 0 : "12px 0 0",
              }}
            >
              <Highlighted text={para} />
            </p>
          ))}
        </BentoCard>
        <BentoCard span={4} padding={24}>
          <h3 style={{ fontSize: 15, margin: "0 0 14px", fontWeight: 700 }}>
            Interesses
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {services.slice(0, 4).map((s) => (
              <div
                key={s.title}
                style={{
                  padding: "10px 14px",
                  borderRadius: 12,
                  background: "color-mix(in srgb, var(--text) 20%, transparent)",
                  fontSize: 12,
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{s.title}</div>
                <div style={{ opacity: 0.65, fontSize: 11.5, lineHeight: 1.4 }}>
                  {s.description.length > 80
                    ? s.description.slice(0, 80) + "…"
                    : s.description}
                </div>
              </div>
            ))}
          </div>
        </BentoCard>
      </div>

      {/* Como eu trabalho — metodologia antes do conteúdo pessoal */}
      {principles.length > 0 && (
        <div style={{ marginBottom: gap }}>
          <div
            style={{
              fontSize: 11,
              opacity: 0.55,
              marginBottom: 10,
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
            }}
          >
            {t("about.principles.title")}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${Math.min(principles.length, 4)}, 1fr)`,
              gap,
            }}
            className="bento-principles"
          >
            {principles.map((pr, i) => (
              <BentoCard
                key={pr.title}
                padding={22}
                style={i === 0 ? { background: "var(--primary)", color: "var(--bg)" } : {}}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 11,
                    background: i === 0 ? "var(--bg)" : "var(--primary)",
                    color: i === 0 ? "var(--primary)" : "var(--bg)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: 13,
                    marginBottom: 14,
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </div>
                <h3 style={{ fontSize: 16, margin: "0 0 8px", fontWeight: 700, lineHeight: 1.25 }}>{pr.title}</h3>
                <p style={{ fontSize: 12.5, lineHeight: 1.55, margin: 0, opacity: 0.8 }}>{pr.description}</p>
              </BentoCard>
            ))}
          </div>
          <style>{`@media (max-width: 760px) { .bento-principles { grid-template-columns: 1fr !important; } }`}</style>
        </div>
      )}

      {/* Fora do trabalho — o lado pessoal vem depois */}
      {personalText && personalText !== "about.aboutMe.text" && (
        <div style={{ marginBottom: gap }}>
          <BentoCard padding={28}>
            <div
              style={{
                fontSize: 11,
                opacity: 0.55,
                marginBottom: 10,
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
              }}
            >
              {t("about.aboutMe.title")}
            </div>
            {splitParagraphs(personalText).map((para, i) => (
              <p key={i} style={{ fontSize: 13.5, lineHeight: 1.6, opacity: 0.82, margin: i === 0 ? 0 : "12px 0 0" }}>
                {para}
              </p>
            ))}
          </BentoCard>
        </div>
      )}

      {/* Daily routine as gallery-style bento */}
      {dailyRoutine.length > 0 && (
        <div style={{ marginBottom: gap }}>
          <div
            style={{
              fontSize: 11,
              opacity: 0.55,
              marginBottom: 10,
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
            }}
          >
            Meu dia-a-dia
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(6, 1fr)",
              gridTemplateRows: "repeat(2, 120px)",
              gap,
            }}
          >
            {dailyRoutine.slice(0, 6).map((item, i) => {
              const spans = [3, 2, 1, 1, 2, 2];
              const rowSpans = [2, 1, 1, 1, 1, 1];
              return (
                <BentoCard
                  key={item.id}
                  span={spans[i] ?? 1}
                  padding={16}
                  style={{
                    gridRow: rowSpans[i] > 1 ? `span ${rowSpans[i]}` : undefined,
                    background:
                      i === 0
                        ? "var(--primary)"
                        : i % 3 === 0
                        ? "color-mix(in srgb, var(--text) 10%, transparent)"
                        : "color-mix(in srgb, var(--text) 10%, var(--bg))",
                    color: i === 0 ? "var(--bg)" : undefined,
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.3 }}>
                    {item.description.length > 60
                      ? item.description.slice(0, 60) + "…"
                      : item.description}
                  </div>
                </BentoCard>
              );
            })}
          </div>
        </div>
      )}

      {/* FAQ as 2x2 bento grid */}
      {faq.length > 0 && (
        <div>
          <div
            style={{
              fontSize: 11,
              opacity: 0.55,
              marginBottom: 10,
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
            }}
          >
            FAQ pessoal
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap,
            }}
          >
            {faq.slice(0, 4).map((f, i) => (
              <BentoCard
                key={f.id}
                padding={20}
                style={
                  i === 0
                    ? {
                        background: "var(--primary)",
                        color: "var(--bg)",
                      }
                    : {}
                }
              >
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    opacity: 0.5,
                    marginBottom: 10,
                  }}
                >
                  0{i + 1}
                </div>
                <h3
                  style={{
                    fontSize: 15,
                    margin: "0 0 10px",
                    fontWeight: 700,
                    lineHeight: 1.3,
                  }}
                >
                  {f.question}
                </h3>
                <p style={{ fontSize: 12, lineHeight: 1.6, margin: 0, opacity: 0.78 }}>
                  {f.answer}
                </p>
              </BentoCard>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
