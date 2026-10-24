import { useHome } from "@/hooks/useHome";
import { useSidebar } from "@/hooks/useSidebar";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useHomeMetrics } from "@/hooks/useHomeMetrics";
import { useContactWizard } from "@/contexts/ContactWizardContext";
import { usePlugin } from "@/contexts/PluginsContext";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { homeRepository, sidebarRepository, portfolioRepository } from "@/repositories/instances";
import { selectFeaturedCases } from "@/utils/homeContent";
import { ArrowRight, Github, Linkedin, Mail, MessageSquare, Phone, Quote } from "lucide-react";
import { Link } from "wouter";

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

export default function BentoHome() {
  const { t } = useTranslation();
  const { contactRole, services, testimonials, contactWizardEnabled } = useHome(homeRepository);
  const { contactInfo } = useSidebar(sidebarRepository);
  const { projects } = usePortfolio(portfolioRepository);
  const { metrics } = useHomeMetrics(homeRepository);
  const { openWizard } = useContactWizard();
  const portfolioEnabled = usePlugin("portfolio");
  const featuredCases = portfolioEnabled ? selectFeaturedCases(projects) : [];

  const email = contactInfo?.email ?? "";
  const phone = contactInfo?.phone ?? "";
  const showEmail = !!(contactInfo?.show_email && email);
  const showPhone = !!(contactInfo?.show_phone && phone);
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
      <style>{`
        @media (max-width: 760px) {
          .bento-metrics { grid-template-columns: repeat(2, 1fr) !important; }
          .bento-cases { grid-template-columns: 1fr !important; }
          .bento-hero-row { grid-template-columns: 1fr !important; }
          .bento-hero-row > * { grid-column: auto !important; grid-row: auto !important; }
          .bento-hero-title { font-size: 38px !important; }
        }
      `}</style>

      {/* Row 1 — Hero (large) + profile sidebar */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(12, 1fr)",
          gridAutoRows: "minmax(80px, auto)",
          gap,
          marginBottom: gap,
        }}
        className="bento-hero-row"
      >
        {/* Hero card */}
        <BentoCard
          span={8}
          padding={36}
          style={{
            gridRow: "span 2",
            background:
              "linear-gradient(135deg, var(--primary) 0%, var(--accent) 200%)",
            color: "var(--bg)",
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              opacity: 0.7,
              marginBottom: 14,
            }}
          >
            $ whoami → {contactInfo?.name ?? ""}
          </div>
          <h1
            className="bento-hero-title"
            style={{
              fontSize: 56,
              lineHeight: 1,
              margin: 0,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              maxWidth: 640,
            }}
          >
            {t("home.hero.headline")}
          </h1>
          <div
            style={{
              marginTop: 22,
              fontSize: 17,
              fontWeight: 500,
              opacity: 0.95,
              maxWidth: 520,
            }}
          >
            {contactRole}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: "auto", paddingTop: 26 }}>
            {featuredCases.length > 0 && (
              <a
                href="#cases"
                data-umami-event="home-hero-ver-cases"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "11px 18px",
                  borderRadius: 14,
                  background: "var(--bg)",
                  color: "var(--primary)",
                  fontWeight: 700,
                  fontSize: 14,
                  textDecoration: "none",
                }}
              >
                {t("home.hero.ctaCases")} <ArrowRight size={15} />
              </a>
            )}
            {contactWizardEnabled && (
              <button
                type="button"
                onClick={() => openWizard({ sourceContext: "home-hero" })}
                data-umami-event="home-hero-fale-comigo"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "11px 18px",
                  borderRadius: 14,
                  background: "color-mix(in srgb, var(--bg) 18%, transparent)",
                  border: "1px solid color-mix(in srgb, var(--bg) 45%, transparent)",
                  color: "var(--bg)",
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                <MessageSquare size={15} /> {t("home.hero.ctaContact")}
              </button>
            )}
          </div>
        </BentoCard>

        {/* Profile card */}
        <BentoCard span={4} padding={24} style={{ alignItems: "center", textAlign: "center" }}>
          <div
            style={{
              width: 92,
              height: 92,
              borderRadius: "50%",
              background: "var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
              fontWeight: 700,
              color: "var(--bg)",
            }}
          >
            {contactInfo?.name
              ?.split(" ")
              .slice(0, 2)
              .map((n) => n[0])
              .join("") ?? ""}
          </div>
          <div style={{ marginTop: 14, fontSize: 18, fontWeight: 700 }}>
            {contactInfo?.name ?? ""}
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 16 }}>
            {contactInfo?.github_url && (
              <a
                href={contactInfo.github_url}
                target="_blank"
                rel="noreferrer"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 12,
                  background: "color-mix(in srgb, var(--text) 20%, transparent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Github size={15} />
              </a>
            )}
            {contactInfo?.linkedin_url && (
              <a
                href={contactInfo.linkedin_url}
                target="_blank"
                rel="noreferrer"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 12,
                  background: "color-mix(in srgb, var(--text) 20%, transparent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Linkedin size={15} />
              </a>
            )}
          </div>
        </BentoCard>

        {/* Contact cards */}
        {showEmail && (
          <BentoCard
            span={2}
            padding={18}
            tint="var(--accent)"
            style={{ color: "var(--text)" }}
          >
            <Mail size={18} />
            <div style={{ fontSize: 10.5, marginTop: 8, opacity: 0.75 }}>contato</div>
            <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2 }}>{email}</div>
          </BentoCard>
        )}
        {showPhone && (
          <BentoCard span={2} padding={18}>
            <Phone size={18} />
            <div style={{ fontSize: 10.5, marginTop: 8, opacity: 0.6 }}>whatsapp</div>
            <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2 }}>{phone}</div>
          </BentoCard>
        )}
      </div>

      {/* Números de prova — logo abaixo do hero */}
      {metrics.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${metrics.length}, 1fr)`,
            gap,
            marginBottom: gap,
          }}
          className="bento-metrics"
        >
          {metrics.map((m, i) => (
            <BentoCard
              key={m.label}
              padding={22}
              tint={i === 0 ? "var(--primary)" : undefined}
              style={i === 0 ? { color: "var(--bg)" } : {}}
            >
              <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1 }}>{m.value}</div>
              <div style={{ fontSize: 12.5, lineHeight: 1.4, marginTop: 10, opacity: 0.75 }}>{m.label}</div>
            </BentoCard>
          ))}
        </div>
      )}

      {/* Cases em destaque — o melhor trabalho logo na chegada */}
      {featuredCases.length > 0 && (
        <div id="cases" style={{ scrollMarginTop: 90, marginBottom: gap }}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: 12,
              margin: "8px 4px 14px",
            }}
          >
            <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em", margin: 0 }}>
              {t("home.cases.title").trim()}
            </h2>
            <Link
              to="/portfolio"
              style={{ fontFamily: "var(--font-mono)", fontSize: 12, opacity: 0.7, textDecoration: "none" }}
            >
              {t("home.cases.viewAll")} →
            </Link>
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap }}
            className="bento-cases"
          >
            {featuredCases.map((project, i) => {
              const metric = project.case_study?.metrics?.[0];
              return (
                <Link
                  key={project.id}
                  to={`/portfolio/${project.slug}`}
                  data-umami-event="home-case"
                  data-umami-event-case={project.slug}
                  style={{ textDecoration: "none", color: "inherit", display: "flex" }}
                >
                  <BentoCard padding={0} style={{ flex: 1 }}>
                    <div
                      style={{
                        aspectRatio: "16 / 9",
                        background: i === 0 ? "var(--primary)" : "color-mix(in srgb, var(--text) 14%, var(--bg))",
                        overflow: "hidden",
                      }}
                    >
                      {project.images?.[0] && (
                        <img
                          src={project.images[0]}
                          alt={project.title}
                          loading="lazy"
                          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        />
                      )}
                    </div>
                    <div style={{ padding: 20, display: "flex", flexDirection: "column", flex: 1 }}>
                      <div style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.25 }}>{project.title}</div>
                      <p style={{ fontSize: 12.5, lineHeight: 1.5, margin: "8px 0 0", opacity: 0.72 }}>
                        {project.description}
                      </p>
                      {metric && (
                        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 14 }}>
                          <span style={{ fontSize: 22, fontWeight: 700, color: "var(--primary)" }}>{metric.value}</span>
                          <span style={{ fontSize: 11.5, opacity: 0.7 }}>{metric.label}</span>
                        </div>
                      )}
                      <span
                        style={{
                          marginTop: "auto",
                          paddingTop: 14,
                          fontFamily: "var(--font-mono)",
                          fontSize: 12,
                          color: "var(--primary)",
                        }}
                      >
                        {t("home.cases.read")} →
                      </span>
                    </div>
                  </BentoCard>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Services / Capabilities — grid 2x2 */}
      {services.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap,
            marginBottom: gap,
          }}
        >
          {services.slice(0, 4).map((s, i) => (
            <BentoCard
              key={s.title}
              padding={26}
              style={i === 0 ? { background: "color-mix(in srgb, var(--text) 10%, transparent)" } : {}}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
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
                    fontSize: 14,
                  }}
                >
                  {i + 1}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    opacity: 0.5,
                  }}
                >
                  0{i + 1} / {String(services.slice(0, 4).length).padStart(2, "0")}
                </div>
              </div>
              <h3
                style={{
                  fontSize: 19,
                  margin: "0 0 10px",
                  fontWeight: 700,
                  letterSpacing: "-0.01em",
                }}
              >
                {s.title}
              </h3>
              <p style={{ fontSize: 12.8, lineHeight: 1.55, margin: 0, opacity: 0.78 }}>
                {s.description}
              </p>
            </BentoCard>
          ))}
        </div>
      )}

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(12, 1fr)",
            gap,
          }}
        >
          <BentoCard
            span={6}
            padding={28}
            tint="var(--primary)"
            style={{ color: "var(--bg)" }}
          >
            <Quote size={26} />
            <p
              style={{
                fontSize: 15,
                lineHeight: 1.5,
                margin: "14px 0 18px",
                fontStyle: "italic",
              }}
            >
              "{testimonials[0].text.slice(0, 220)}
              {testimonials[0].text.length > 220 ? "…" : ""}"
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginTop: "auto",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "color-mix(in srgb, var(--bg) 20%, transparent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                {testimonials[0].name[0]}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{testimonials[0].name}</div>
                <div style={{ fontSize: 11, opacity: 0.8 }}>{testimonials[0].role}</div>
              </div>
            </div>
          </BentoCard>
          {testimonials.slice(1, 4).map((t) => (
            <BentoCard key={t.name} span={2} padding={18}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: "50%",
                    background: "color-mix(in srgb, var(--primary) 15%, transparent)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {t.name[0]}
                </div>
                <div style={{ fontSize: 11.5, fontWeight: 700 }}>{t.name}</div>
              </div>
              <p style={{ fontSize: 11.5, lineHeight: 1.45, margin: "10px 0 0", opacity: 0.75 }}>
                "{t.text.slice(0, 110)}
                {t.text.length > 110 ? "…" : ""}"
              </p>
            </BentoCard>
          ))}
        </div>
      )}

      {/* Navigation links */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 8,
          marginTop: gap * 2,
        }}
      >
        {[
          { label: "Currículo", to: "/curriculo" },
          { label: "Portfólio", to: "/portfolio" },
          { label: "Sobre Mim", to: "/sobre" },
          { label: "Blog", to: "/blog" },
        ].map((item) => (
          <Link
            key={item.to}
            to={item.to}
            style={{
              padding: "8px 16px",
              borderRadius: 999,
              border: "1px solid color-mix(in srgb, var(--text) 20%, transparent)",
              fontSize: 13,
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
