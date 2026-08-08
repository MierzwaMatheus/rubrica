import { Code, Terminal, Cpu, Palette, Zap, Layout, MessageSquare, Layers } from "lucide-react";
import { useHome } from "@/hooks/useHome";
import { useResume } from "@/hooks/useResume";
import { useSidebar } from "@/hooks/useSidebar";
import { homeRepository, resumeRepository, sidebarRepository } from "@/repositories/instances";
import { SwissShell, SwissGridLines } from "@/components/SwissShared";

const SERVICE_ICONS = [
  <Code size={26} strokeWidth={2.5} />,
  <Terminal size={26} strokeWidth={2.5} />,
  <Cpu size={26} strokeWidth={2.5} />,
  <Palette size={26} strokeWidth={2.5} />,
  <Zap size={26} strokeWidth={2.5} />,
  <Layout size={26} strokeWidth={2.5} />,
  <MessageSquare size={26} strokeWidth={2.5} />,
  <Layers size={26} strokeWidth={2.5} />,
];

export default function SwissHome() {
  const { contactRole, aboutText, services, testimonials, isLoading } = useHome(homeRepository);
  const { getItemsByType } = useResume(resumeRepository);
  const { contactInfo } = useSidebar(sidebarRepository);

  if (isLoading) return null;

  const topSkills = getItemsByType("skill").slice(0, 4).map(
    (i) => (i.translatedContent as { name?: string })?.name ?? String(i.translatedContent)
  );
  const authorFirstName = (contactInfo?.name ?? "").split(" ")[0] || "";

  return (
    <SwissShell page="Início" idx={1}>
      {/* Hero band */}
      <div
        style={{
          position: "relative",
          padding: "40px 18px",
          minHeight: 480,
          borderBottom: "2px solid var(--text)",
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
            minHeight: 400,
          }}
        >
          <div style={{ gridColumn: "span 8" }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                marginBottom: 18,
                color: "var(--primary)",
              }}
            >
              .01 — Reportagem de Capa
            </div>
            <h1
              style={{
                fontSize: 132,
                fontWeight: 900,
                letterSpacing: "-0.05em",
                margin: 0,
                lineHeight: 0.85,
              }}
            >
              Oi! Eu
              <br />
              sou o
              <br />
              <span
                style={{
                  background: "var(--primary)",
                  color: "var(--bg)",
                  padding: "0 12px",
                  display: "inline-block",
                }}
              >
                {authorFirstName}.
              </span>
            </h1>
          </div>
          <div style={{ gridColumn: "span 4" }}>
            {contactInfo?.avatar_url ? (
              <img
                src={contactInfo.avatar_url}
                alt={contactInfo.name}
                style={{ width: 120, height: 120, objectFit: "cover", borderRadius: "50%" }}
              />
            ) : (
              <div
                style={{
                  width: 120,
                  height: 120,
                  background: "var(--text)",
                  color: "var(--bg)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 40,
                  fontWeight: 900,
                  borderRadius: "50%",
                }}
              >
                {(contactInfo?.name ?? "?")[0]}
              </div>
            )}
            <div
              style={{
                marginTop: 16,
                fontSize: 12,
                fontWeight: 500,
                lineHeight: 1.5,
                opacity: 0.85,
              }}
            >
              {aboutText}
            </div>
          </div>
        </div>
      </div>

      {/* Stack band */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `3fr ${topSkills.map(() => "2.25fr").join(" ")}`,
          borderBottom: "2px solid var(--text)",
        }}
      >
        <div
          style={{
            padding: "20px 18px",
            background: "var(--text)",
            color: "var(--bg)",
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 500,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              opacity: 0.65,
              marginBottom: 4,
            }}
          >
            Stack
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.02em" }}>
            Principal
          </div>
        </div>
        {topSkills.map((s, i) => (
          <div
            key={s}
            style={{
              padding: "20px 14px",
              borderLeft: "1px solid var(--text)",
              background: i === 1 ? "var(--accent)" : "transparent",
              color: i === 1 ? "var(--bg)" : "var(--text)",
            }}
          >
            <div
              style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.14em", opacity: 0.7 }}
            >
              .{String(i + 2).padStart(2, "0")}
            </div>
            <div
              style={{ fontSize: 17, fontWeight: 700, marginTop: 4, letterSpacing: "-0.01em" }}
            >
              {s}
            </div>
          </div>
        ))}
      </div>

      {/* Capabilities */}
      <div
        style={{
          padding: "40px 18px",
          borderBottom: "2px solid var(--text)",
          position: "relative",
        }}
      >
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
              paddingTop: 6,
            }}
          >
            Capítulo .02
          </div>
          <h2
            style={{
              gridColumn: "span 10",
              fontSize: 44,
              fontWeight: 900,
              letterSpacing: "-0.03em",
              margin: 0,
              lineHeight: 1,
            }}
          >
            O que faço — quatro capacidades, uma obsessão.
          </h2>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 0,
            border: "1px solid var(--text)",
          }}
        >
          {services.slice(0, 4).map((c, i) => (
            <div
              key={c.id}
              style={{
                padding: 20,
                borderRight: i < 3 ? "1px solid var(--text)" : "none",
                background: i === 0 ? "var(--primary)" : "transparent",
                color: i === 0 ? "var(--bg)" : "var(--text)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 16,
                }}
              >
                {SERVICE_ICONS[i % SERVICE_ICONS.length]}
                <span
                  style={{
                    fontSize: 30,
                    fontWeight: 900,
                    lineHeight: 0.85,
                    letterSpacing: "-0.03em",
                  }}
                >
                  0{i + 1}
                </span>
              </div>
              <h3
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  margin: "0 0 8px",
                  letterSpacing: "-0.01em",
                  lineHeight: 1.2,
                }}
              >
                {c.title}
              </h3>
              <p
                style={{ fontSize: 11, lineHeight: 1.55, margin: 0, opacity: 0.85 }}
              >
                {c.description.slice(0, 180)}…
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <div
          style={{ padding: "40px 18px", borderBottom: "2px solid var(--text)" }}
        >
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
                paddingTop: 6,
              }}
            >
              Capítulo .03
            </div>
            <h2
              style={{
                gridColumn: "span 10",
                fontSize: 44,
                fontWeight: 900,
                letterSpacing: "-0.03em",
                margin: 0,
                lineHeight: 1,
              }}
            >
              Vozes — o que dizem os clientes.
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "7fr 5fr", gap: 16 }}>
            <div
              style={{
                padding: 32,
                background: "var(--text)",
                color: "var(--bg)",
              }}
            >
              <div
                style={{
                  fontSize: 76,
                  fontWeight: 900,
                  lineHeight: 0.5,
                  opacity: 0.4,
                }}
              >
                "
              </div>
              <p
                style={{
                  fontSize: 17,
                  lineHeight: 1.5,
                  margin: "0 0 20px",
                  fontWeight: 500,
                }}
              >
                {testimonials[0].text}
              </p>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                }}
              >
                — {testimonials[0].name} / {testimonials[0].role}
              </div>
            </div>
            <div style={{ border: "1px solid var(--text)" }}>
              {testimonials.slice(1).map((t, i) => (
                <div
                  key={t.id}
                  style={{
                    padding: 16,
                    borderBottom:
                      i < testimonials.length - 2 ? "1px solid var(--text)" : "none",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 6,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                      }}
                    >
                      {t.name}
                    </span>
                    <span style={{ fontSize: 10, opacity: 0.6 }}>
                      .{String(i + 2).padStart(2, "0")}
                    </span>
                  </div>
                  <p
                    style={{
                      fontSize: 11,
                      lineHeight: 1.5,
                      opacity: 0.85,
                      margin: 0,
                    }}
                  >
                    "{t.text.slice(0, 180)}…"
                  </p>
                  <div style={{ fontSize: 10, opacity: 0.55, marginTop: 6 }}>
                    {t.role}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </SwissShell>
  );
}
