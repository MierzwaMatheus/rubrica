import { Code, Terminal, Cpu, Palette, Zap, Layout, MessageSquare, Layers, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { useHome } from "@/hooks/useHome";
import { useResume } from "@/hooks/useResume";
import { useSidebar } from "@/hooks/useSidebar";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useHomeMetrics } from "@/hooks/useHomeMetrics";
import { useContactWizard } from "@/contexts/ContactWizardContext";
import { usePlugin } from "@/contexts/PluginsContext";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { selectFeaturedCases } from "@/utils/homeContent";
import { homeRepository, resumeRepository, sidebarRepository, portfolioRepository } from "@/repositories/instances";
import { SwissShell, SwissGridLines } from "@/components/SwissShared";

const chapterLabel: React.CSSProperties = {
  gridColumn: "span 2",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  paddingTop: 6,
};
const chapterTitle: React.CSSProperties = {
  gridColumn: "span 10",
  fontSize: 44,
  fontWeight: 900,
  letterSpacing: "-0.03em",
  margin: 0,
  lineHeight: 1,
};
const btnBase: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "12px 18px",
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  border: "2px solid var(--text)",
  cursor: "pointer",
  textDecoration: "none",
};

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
  const { t } = useTranslation();
  const { contactRole, aboutText, services, testimonials, contactWizardEnabled, isLoading } = useHome(homeRepository);
  const { getItemsByType } = useResume(resumeRepository);
  const { contactInfo } = useSidebar(sidebarRepository);
  const { projects } = usePortfolio(portfolioRepository);
  const { metrics } = useHomeMetrics(homeRepository);
  const { openWizard } = useContactWizard();
  const portfolioEnabled = usePlugin("portfolio");
  const featuredCases = portfolioEnabled ? selectFeaturedCases(projects) : [];

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
                fontSize: "clamp(48px, 7vw, 96px)",
                fontWeight: 900,
                letterSpacing: "-0.05em",
                margin: 0,
                lineHeight: 0.92,
              }}
            >
              {t("home.hero.headline")}
            </h1>
            <div
              style={{
                marginTop: 18,
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              <span style={{ background: "var(--primary)", color: "var(--bg)", padding: "2px 8px" }}>
                {authorFirstName}
              </span>{" "}
              — {contactRole}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 24 }}>
              {featuredCases.length > 0 && (
                <a
                  href="#cases"
                  data-umami-event="home-hero-ver-cases"
                  style={{ ...btnBase, background: "var(--text)", color: "var(--bg)" }}
                >
                  {t("home.hero.ctaCases")} <ArrowRight size={14} strokeWidth={3} />
                </a>
              )}
              {contactWizardEnabled && (
                <button
                  type="button"
                  onClick={() => openWizard({ sourceContext: "home-hero" })}
                  data-umami-event="home-hero-fale-comigo"
                  style={{ ...btnBase, background: "transparent", color: "var(--text)" }}
                >
                  {t("home.hero.ctaContact")}
                </button>
              )}
            </div>
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

      {/* Metrics band: prova logo abaixo do topo (cai para a stack quando não há números) */}
      {metrics.length > 0 ? (
        <div data-m-cols="2"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            borderBottom: "2px solid var(--text)",
          }}
        >
          {metrics.map((m, i) => (
            <div
              key={m.label}
              style={{
                padding: "22px 18px",
                borderLeft: i > 0 ? "1px solid var(--text)" : "none",
                background: i === 0 ? "var(--text)" : "transparent",
                color: i === 0 ? "var(--bg)" : "var(--text)",
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.14em", opacity: 0.7 }}>
                .{String(i + 1).padStart(2, "0")}
              </div>
              <div style={{ fontSize: 40, fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1, marginTop: 6 }}>
                {m.value}
              </div>
              <div style={{ fontSize: 11, fontWeight: 500, lineHeight: 1.4, marginTop: 8, opacity: 0.85 }}>
                {m.label}
              </div>
            </div>
          ))}
        </div>
      ) : (
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
      )}

      {/* Cases em destaque */}
      {featuredCases.length > 0 && (
        <div id="cases" style={{ padding: "40px 18px", borderBottom: "2px solid var(--text)", scrollMarginTop: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 12, marginBottom: 28 }}>
            <div style={chapterLabel}>Capítulo .02</div>
            <h2 style={{ ...chapterTitle, gridColumn: "span 8" }}>{t("home.cases.title").trim()}.</h2>
            <Link
              href="/portfolio"
              style={{
                gridColumn: "span 2",
                alignSelf: "end",
                textAlign: "right",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--text)",
              }}
            >
              {t("home.cases.viewAll")} →
            </Link>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: 1,
              background: "var(--text)",
              border: "1px solid var(--text)",
            }}
          >
            {featuredCases.map((p, i) => {
              const metric = p.case_study?.metrics?.[0];
              return (
                <Link
                  key={p.id}
                  href={`/portfolio/${p.slug}`}
                  data-umami-event="home-case"
                  data-umami-event-case={p.slug}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    background: "var(--bg)",
                    color: "var(--text)",
                    textDecoration: "none",
                  }}
                >
                  <div style={{ aspectRatio: "16 / 10", overflow: "hidden", borderBottom: "1px solid var(--text)", background: "var(--text)" }}>
                    {p.images?.[0] && (
                      <img src={p.images[0]} alt={p.title} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(1)" }} />
                    )}
                  </div>
                  <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                    <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.14em", opacity: 0.7 }}>
                      .{String(i + 1).padStart(2, "0")} {p.category ? `/ ${p.category}` : ""}
                    </span>
                    <h3 style={{ fontSize: 20, fontWeight: 900, letterSpacing: "-0.02em", margin: 0, lineHeight: 1.1 }}>{p.title}</h3>
                    <p style={{ fontSize: 11, lineHeight: 1.55, margin: 0, opacity: 0.85 }}>{p.description}</p>
                    {metric && (
                      <div style={{ marginTop: 6 }}>
                        <span style={{ background: "var(--primary)", color: "var(--bg)", padding: "2px 8px", fontSize: 18, fontWeight: 900 }}>
                          {metric.value}
                        </span>
                        <span style={{ fontSize: 10, fontWeight: 600, marginLeft: 8, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                          {metric.label}
                        </span>
                      </div>
                    )}
                    <span style={{ marginTop: "auto", paddingTop: 10, fontSize: 11, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                      {t("portfolio.viewCase")} →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

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
              Capítulo .04
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
                  fontSize: "clamp(36px, 10.6vw, 76px)",
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

      {/* Fechamento: um caminho para quem tem projeto e outro para quem tem vaga */}
      {contactWizardEnabled && (
        <div style={{ padding: "40px 18px", background: "var(--primary)", color: "var(--bg)" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 24, alignItems: "flex-end", justifyContent: "space-between" }}>
            <div style={{ flex: "1 1 420px" }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 12 }}>
                Capítulo .05
              </div>
              <h2 style={{ fontSize: "clamp(32px, 5vw, 44px)", fontWeight: 900, letterSpacing: "-0.03em", margin: 0, lineHeight: 1 }}>{t("home.cta.title")}</h2>
              <p style={{ fontSize: 13, margin: "10px 0 0", opacity: 0.85 }}>{t("home.cta.subtitle")}</p>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              <button
                type="button"
                onClick={() => openWizard({ flowType: "project", sourceContext: "home-cta" })}
                data-umami-event="home-cta-projeto"
                style={{ ...btnBase, background: "var(--bg)", color: "var(--text)", borderColor: "var(--bg)" }}
              >
                {t("home.cta.project")}
              </button>
              <button
                type="button"
                onClick={() => openWizard({ flowType: "job", sourceContext: "home-cta" })}
                data-umami-event="home-cta-vaga"
                style={{ ...btnBase, background: "transparent", color: "var(--bg)", borderColor: "var(--bg)" }}
              >
                {t("home.cta.job")}
              </button>
            </div>
          </div>
        </div>
      )}
    </SwissShell>
  );
}
