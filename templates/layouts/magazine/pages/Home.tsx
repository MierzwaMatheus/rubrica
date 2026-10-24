import { Link } from "wouter";
import { useIsMobile } from "@/hooks/useMobile";
import { useHome } from "@/hooks/useHome";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useHomeMetrics } from "@/hooks/useHomeMetrics";
import { useContactWizard } from "@/contexts/ContactWizardContext";
import { usePlugin } from "@/contexts/PluginsContext";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { homeRepository, portfolioRepository } from "@/repositories/instances";
import { selectFeaturedCases } from "@/utils/homeContent";

const mono = { fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase" as const };
const sectionLabel = { ...mono, letterSpacing: "0.3em", textAlign: "center" as const, color: "var(--text)", opacity: 0.5 };

export default function Home() {
  const isMobile = useIsMobile();
  const { t } = useTranslation();
  const { contactRole, services, testimonials, contactWizardEnabled, isLoading } = useHome(homeRepository);
  const { projects } = usePortfolio(portfolioRepository);
  const { metrics } = useHomeMetrics(homeRepository);
  const { openWizard } = useContactWizard();
  const portfolioEnabled = usePlugin("portfolio");
  const featured = portfolioEnabled ? selectFeaturedCases(projects) : [];

  if (isLoading) return null;

  // No celular: 24px de margem, compensando o padding do <main> (data-m-bleed).
  const pad = isMobile ? 24 : 48;

  return (
    <div data-m-bleed style={{ background: "var(--bg)", color: "var(--text)", fontFamily: "var(--font-sans)", minHeight: "100%" }}>

      {/* Capa: quem sou, o que entrego e os próximos passos */}
      <div style={{ padding: `${pad + 12}px ${pad}px ${pad}px`, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: pad, alignItems: "end" }}>
        <div style={{ gridColumn: "1 / -1" }}>
          <div style={{ ...mono, color: "var(--primary)", marginBottom: 14 }}>
            ↘ Reportagem de Capa · {contactRole}
          </div>
          <h1 style={{ fontFamily: "var(--font-sans)", fontSize: "clamp(48px, 7vw, 104px)", lineHeight: 0.95, margin: 0, letterSpacing: "-0.03em", fontWeight: 500 }}>
            {t("home.hero.headline")}
          </h1>
        </div>
        <div>
          <p style={{ fontFamily: "var(--font-sans)", fontStyle: "italic", fontSize: 22, lineHeight: 1.35, margin: 0, color: "var(--text)", borderLeft: "2px solid var(--accent)", paddingLeft: 18 }}>
            {t("home.hero.description")}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 24 }}>
            {featured.length > 0 && (
              <a
                href="#cases"
                data-umami-event="home-hero-ver-cases"
                style={{ ...mono, letterSpacing: "0.16em", padding: "12px 20px", background: "var(--primary)", color: "var(--bg)", textDecoration: "none" }}
              >
                {t("home.hero.ctaCases")} ↓
              </a>
            )}
            {contactWizardEnabled && (
              <button
                onClick={() => openWizard({ sourceContext: "home-hero" })}
                data-umami-event="home-hero-fale-comigo"
                style={{ ...mono, letterSpacing: "0.16em", padding: "12px 20px", background: "transparent", color: "var(--text)", border: "1px solid var(--text)", cursor: "pointer" }}
              >
                {t("home.hero.ctaContact")} →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Números de prova logo abaixo da capa */}
      {metrics.length > 0 && (
        <div data-m-cols="2" style={{ margin: `0 ${pad}px`, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 1, background: "color-mix(in srgb, var(--text) 45%, transparent)", borderTop: "2px solid var(--text)", borderBottom: "0.5px solid var(--text)" }}>
          {metrics.map((m) => (
            <div key={m.label} style={{ padding: "22px 20px 20px", background: "var(--bg)" }}>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: 44, lineHeight: 1, fontWeight: 500, color: "var(--primary)", letterSpacing: "-0.02em" }}>{m.value}</div>
              <div style={{ ...mono, fontSize: 10, letterSpacing: "0.16em", marginTop: 10, opacity: 0.75 }}>{m.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Cases em destaque */}
      {featured.length > 0 && (
        <>
          <div id="cases" style={{ ...sectionLabel, padding: `${pad + 8}px 0 ${pad - 16}px`, scrollMarginTop: 24 }}>
            ✦ ✦ ✦ &nbsp; {t("home.cases.title").trim()} &nbsp; ✦ ✦ ✦
          </div>
          <div style={{ padding: `0 ${pad}px`, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 36 }}>
            {featured.map((p, i) => {
              const metric = p.case_study?.metrics?.[0];
              return (
                <Link
                  key={p.id}
                  href={`/portfolio/${p.slug}`}
                  data-umami-event="home-case"
                  data-umami-event-case={p.slug}
                  style={{ color: "inherit", textDecoration: "none", display: "flex", flexDirection: "column", borderTop: "0.5px solid var(--text)", paddingTop: 18 }}
                >
                  <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                    <span style={{ fontFamily: "var(--font-sans)", fontSize: 40, lineHeight: 0.9, color: "var(--primary)", fontWeight: 500 }}>{String(i + 1).padStart(2, "0")}</span>
                    <span style={{ ...mono, fontSize: 10, opacity: 0.55 }}>{p.category || "Case"}</span>
                  </div>
                  <h3 style={{ fontFamily: "var(--font-sans)", fontSize: 28, margin: "12px 0 8px", lineHeight: 1.1, fontWeight: 500 }}>{p.title}</h3>
                  <p style={{ fontStyle: "italic", fontSize: 14, lineHeight: 1.55, margin: 0, opacity: 0.85 }}>{p.description}</p>
                  {metric && (
                    <p style={{ margin: "16px 0 0", display: "flex", alignItems: "baseline", gap: 10 }}>
                      <span style={{ fontFamily: "var(--font-sans)", fontSize: 26, fontWeight: 500, color: "var(--primary)", whiteSpace: "nowrap" }}>{metric.value}</span>
                      <span style={{ ...mono, fontSize: 10, letterSpacing: "0.12em", opacity: 0.7 }}>{metric.label}</span>
                    </p>
                  )}
                  <span style={{ ...mono, fontSize: 10.5, color: "var(--accent)", marginTop: 18 }}>Ler a reportagem →</span>
                </Link>
              );
            })}
          </div>
          <div style={{ padding: `20px ${pad}px 0`, textAlign: "right" }}>
            <Link href="/portfolio" style={{ ...mono, fontSize: 10.5, color: "var(--text)", opacity: 0.7, textDecoration: "none" }}>
              {t("home.cases.viewAll")} →
            </Link>
          </div>
        </>
      )}

      {/* Capabilities / Services */}
      <div style={{ ...sectionLabel, padding: `${pad + 8}px 0 ${pad - 12}px` }}>
        ✦ ✦ ✦ &nbsp; Dossiê de Capacidades &nbsp; ✦ ✦ ✦
      </div>

      <div style={{ padding: `0 ${pad}px`, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 40 }}>
        {services.map((s, i) => (
          <article key={s.id} style={{ display: "grid", gridTemplateColumns: "64px 1fr", gap: 16, paddingBottom: 32, borderBottom: "0.5px solid var(--text)" }}>
            <div style={{ fontFamily: "var(--font-sans)", fontSize: 56, lineHeight: 0.9, color: "var(--primary)", fontWeight: 500 }}>{String(i + 1).padStart(2, "0")}</div>
            <div>
              <h3 style={{ fontFamily: "var(--font-sans)", fontSize: 24, margin: "0 0 8px", lineHeight: 1.15, fontWeight: 500 }}>{s.title}</h3>
              <p style={{ fontSize: 13.5, lineHeight: 1.6, margin: 0, opacity: 0.85 }}>{s.description}</p>
            </div>
          </article>
        ))}
      </div>

      {/* Testimonials */}
      <div style={{ ...sectionLabel, padding: `${pad + 8}px 0 ${pad - 8}px` }}>
        ✦ ✦ ✦ &nbsp; Vozes do Campo &nbsp; ✦ ✦ ✦
      </div>

      {testimonials[0] && (
        <div style={{ padding: `${pad - 8}px ${isMobile ? pad : pad + 40}px`, textAlign: "center" }}>
          <div style={{ fontFamily: "var(--font-sans)", fontStyle: "italic", fontSize: "clamp(22px, 5.5vw, 34px)", lineHeight: 1.3, color: "var(--text)" }}>
            "{testimonials[0].text}"
          </div>
          <div style={{ ...mono, marginTop: 24, color: "var(--accent)" }}>
            — {testimonials[0].name}, {testimonials[0].role}
          </div>
        </div>
      )}

      <div style={{ padding: `${pad - 8}px ${pad}px 0`, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 28, borderTop: "0.5px solid var(--text)", paddingTop: 32 }}>
        {testimonials.slice(1).map((tm) => (
          <div key={tm.id}>
            <div style={{ fontFamily: "var(--font-sans)", fontSize: 28, lineHeight: 0.9, color: "var(--primary)", marginBottom: 8 }}>"</div>
            <p style={{ fontSize: 12.5, lineHeight: 1.5, margin: "0 0 14px", opacity: 0.85, fontStyle: "italic" }}>{tm.text.length > 220 ? `${tm.text.slice(0, 220)}…` : tm.text}</p>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", borderTop: "0.5px solid var(--text)", paddingTop: 10 }}>
              <div style={{ color: "var(--text)" }}>{tm.name}</div>
              <div style={{ opacity: 0.55, marginTop: 2 }}>{tm.role}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Fechamento: um caminho para quem tem projeto e outro para quem tem vaga */}
      {contactWizardEnabled && (
        <div style={{ margin: `${pad + 16}px ${pad}px 0`, padding: `${pad - 8}px 0`, borderTop: "2px solid var(--text)", textAlign: "center" }}>
          <div style={{ ...mono, color: "var(--primary)", marginBottom: 14 }}>↘ Carta ao Leitor</div>
          <h2 style={{ fontFamily: "var(--font-sans)", fontSize: "clamp(32px, 4.5vw, 56px)", fontWeight: 500, margin: 0, letterSpacing: "-0.02em", lineHeight: 1.05 }}>{t("home.cta.title")}</h2>
          <p style={{ fontStyle: "italic", fontSize: 17, opacity: 0.75, marginTop: 12 }}>{t("home.cta.subtitle")}</p>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12, marginTop: 24 }}>
            <button
              onClick={() => openWizard({ flowType: "project", sourceContext: "home-cta" })}
              data-umami-event="home-cta-projeto"
              style={{ ...mono, letterSpacing: "0.16em", padding: "12px 20px", background: "var(--primary)", color: "var(--bg)", border: "none", cursor: "pointer" }}
            >
              {t("home.cta.project")}
            </button>
            <button
              onClick={() => openWizard({ flowType: "job", sourceContext: "home-cta" })}
              data-umami-event="home-cta-vaga"
              style={{ ...mono, letterSpacing: "0.16em", padding: "12px 20px", background: "transparent", color: "var(--text)", border: "1px solid var(--text)", cursor: "pointer" }}
            >
              {t("home.cta.job")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
