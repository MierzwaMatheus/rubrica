import { useHome } from "@/hooks/useHome";
import { useHomeMetrics } from "@/hooks/useHomeMetrics";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useContactWizard } from "@/contexts/ContactWizardContext";
import { usePlugin } from "@/contexts/PluginsContext";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { homeRepository, portfolioRepository } from "@/repositories/instances";
import { selectFeaturedCases } from "@/utils/homeContent";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import figlet from "figlet";
// @ts-ignore — importable font bundle
import BigFont from "figlet/importable-fonts/Big.js";
figlet.parseFont("Big", BigFont);

function AsciiRule({ char = "─", label }: { char?: string; label?: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        margin: "14px 0",
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        opacity: 0.7,
        color: "var(--text)",
      }}
    >
      {label ? (
        <>
          <span style={{ color: "var(--accent)" }}>{char.repeat(3)}</span>
          <span
            style={{
              color: "var(--primary)",
              textTransform: "uppercase",
              letterSpacing: "0.18em",
              fontWeight: 700,
            }}
          >
            [ {label} ]
          </span>
          <span style={{ flex: 1, color: "var(--accent)", overflow: "hidden" }}>
            {char.repeat(200)}
          </span>
        </>
      ) : (
        <span style={{ flex: 1, overflow: "hidden" }}>{char.repeat(200)}</span>
      )}
    </div>
  );
}

function BrutPrompt({
  cmd,
  output,
  host = "user@rubrica",
}: {
  cmd: string;
  output?: React.ReactNode;
  host?: string;
}) {
  return (
    <div
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: 13,
        lineHeight: 1.55,
        whiteSpace: "pre-wrap",
      }}
    >
      <div>
        <span style={{ color: "var(--accent)" }}>{host}</span>
        <span style={{ opacity: 0.7 }}>:~$ </span>
        <span style={{ color: "var(--primary)", fontWeight: 700 }}>{cmd}</span>
      </div>
      {output && <div style={{ marginTop: 6 }}>{output}</div>}
    </div>
  );
}

function AsciiBanner({ name }: { name: string }) {
  const [art, setArt] = useState<string>("");

  useEffect(() => {
    if (!name) return;
    figlet.text(
      name.toUpperCase(),
      { font: "Big" },
      (err, result) => {
        if (err) { console.error("[AsciiBanner] figlet error:", err); return; }
        if (result) setArt(result);
      }
    );
  }, [name]);

  if (!art) {
    return (
      <div
        style={{
          margin: 0,
          color: "var(--primary)",
          fontSize: "clamp(32px, 6vw, 72px)",
          fontWeight: 900,
          lineHeight: 1.05,
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          overflow: "hidden",
        }}
      >
        {name}
      </div>
    );
  }

  return (
    <pre
      style={{
        margin: 0,
        color: "var(--primary)",
        fontSize: 13,
        fontWeight: 700,
        lineHeight: 1.05,
        fontFamily: "var(--font-mono)",
        overflow: "hidden",
      }}
    >
      {art}
    </pre>
  );
}

export default function Home() {
  const { t } = useTranslation();
  const { contactName, contactRole, aboutText, services, testimonials, contactInfo, contactWizardEnabled } =
    useHome(homeRepository);
  const { metrics } = useHomeMetrics(homeRepository);
  const { projects } = usePortfolio(portfolioRepository);
  const { openWizard } = useContactWizard();
  const portfolioEnabled = usePlugin("portfolio");
  const featuredCases = portfolioEnabled ? selectFeaturedCases(projects) : [];

  const btn = (inverted: boolean): React.CSSProperties => ({
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 16px",
    border: "2px solid var(--text)",
    background: inverted ? "var(--text)" : "transparent",
    color: inverted ? "var(--bg)" : "var(--text)",
    fontFamily: "var(--font-mono)",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    textDecoration: "none",
  });

  return (
    <div
      style={{
        minHeight: "100%",
        background: "var(--bg)",
        color: "var(--text)",
        fontFamily: "var(--font-mono)",
        fontSize: 13,
        lineHeight: 1.55,
        padding: "24px 28px",
      }}
    >
      <AsciiBanner name={contactName} />
      <div style={{ fontSize: 11, opacity: 0.6, marginTop: 6 }}>
        {`// ${contactRole}`}
      </div>

      <AsciiRule label="whoami" />

      <BrutPrompt
        cmd="cat /etc/motd"
        output={
          <div
            style={{ paddingLeft: 14, borderLeft: "2px solid var(--accent)" }}
          >
            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: "var(--text)",
                margin: "6px 0",
              }}
            >
              {t("home.hero.headline")}
            </div>
            <div style={{ opacity: 0.85, marginBottom: 8 }}>{contactRole}</div>
            <div style={{ opacity: 0.7, fontSize: 12, lineHeight: 1.6 }}>
              {aboutText}
            </div>
          </div>
        }
      />

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 18 }}>
        {featuredCases.length > 0 && (
          <a href="#cases" data-umami-event="home-hero-ver-cases" style={btn(true)}>
            <span style={{ color: "var(--accent)" }}>›</span> {t("home.hero.ctaCases")}
          </a>
        )}
        {contactWizardEnabled && (
          <button
            type="button"
            onClick={() => openWizard({ sourceContext: "home-hero" })}
            data-umami-event="home-hero-fale-comigo"
            style={btn(false)}
          >
            <span style={{ color: "var(--accent)" }}>›</span> {t("home.hero.ctaContact")}
          </button>
        )}
      </div>

      {metrics.length > 0 && (
        <>
          <AsciiRule label="stats" />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              border: "1px solid var(--text)",
            }}
          >
            {metrics.map((m, i) => (
              <div
                key={m.label}
                style={{
                  padding: "14px 16px",
                  borderLeft: i === 0 ? "none" : "1px solid var(--text)",
                }}
              >
                <div style={{ fontSize: 24, fontWeight: 700, color: "var(--primary)", lineHeight: 1.1 }}>
                  {m.value}
                </div>
                <div style={{ fontSize: 11, opacity: 0.75, marginTop: 6 }}>{m.label}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {featuredCases.length > 0 && (
        <section id="cases" style={{ scrollMarginTop: 80 }}>
          <AsciiRule label={t("home.cases.title").trim()} />
          <BrutPrompt
            cmd="ls -la cases/ --featured"
            output={
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  gap: 0,
                  border: "1px solid var(--text)",
                  marginTop: 8,
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
                        gap: 8,
                        padding: 16,
                        color: "inherit",
                        textDecoration: "none",
                        borderLeft: i === 0 ? "none" : "1px solid var(--text)",
                      }}
                    >
                      <span style={{ color: "var(--primary)", fontWeight: 700 }}>
                        [{String(i + 1).padStart(2, "0")}] {p.title}
                      </span>
                      <span style={{ fontSize: 12, opacity: 0.8, lineHeight: 1.5 }}>{p.description}</span>
                      {metric && (
                        <span style={{ fontSize: 12 }}>
                          <span style={{ color: "var(--accent)" }}>#</span>{" "}
                          <b style={{ color: "var(--primary)" }}>{metric.value}</b> {metric.label}
                        </span>
                      )}
                      <span style={{ marginTop: "auto", fontSize: 12, color: "var(--accent)" }}>
                        {t("home.cases.read")} →
                      </span>
                    </Link>
                  );
                })}
              </div>
            }
          />
          <div style={{ marginTop: 8, fontSize: 12 }}>
            <Link href="/portfolio" style={{ color: "var(--primary)" }}>
              › {t("home.cases.viewAll")}
            </Link>
          </div>
        </section>
      )}

      <AsciiRule label="capabilities" />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 0,
          border: "1px solid var(--text)",
        }}
      >
        {services.map((c, i) => (
          <div
            key={c.id}
            style={{
              padding: 18,
              borderRight: i % 2 === 0 ? "1px solid var(--text)" : "none",
              borderBottom:
                i < services.length - 2 ? "1px solid var(--text)" : "none",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 8,
                marginBottom: 8,
              }}
            >
              <span style={{ color: "var(--primary)", fontWeight: 700 }}>
                [{String(i + 1).padStart(2, "0")}]
              </span>
              <span style={{ fontWeight: 700, fontSize: 14 }}>
                {c.title.toLowerCase()}
              </span>
            </div>
            <p
              style={{
                margin: 0,
                fontSize: 12,
                lineHeight: 1.55,
                opacity: 0.82,
              }}
            >
              {c.description}
            </p>
          </div>
        ))}
      </div>

      <AsciiRule label="testimonials" />

      <BrutPrompt
        cmd="cat clients/*.txt | head"
        output={
          <div style={{ marginTop: 8 }}>
            {testimonials.map((t, i) => (
              <div
                key={t.id}
                style={{
                  marginBottom: 14,
                  padding: "12px 14px",
                  border: "1px solid var(--text)",
                  background: i === 0 ? "var(--text)" : "transparent",
                  color: i === 0 ? "var(--bg)" : "var(--text)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 11,
                    opacity: 0.7,
                    marginBottom: 6,
                  }}
                >
                  <span>
                    {">"} from: {t.name} &lt;{t.role}&gt;
                  </span>
                  <span>rating: ★★★★★</span>
                </div>
                <p style={{ margin: 0, fontSize: 12, lineHeight: 1.55 }}>
                  &ldquo;{t.text}&rdquo;
                </p>
              </div>
            ))}
          </div>
        }
      />

      {contactWizardEnabled && (
        <>
          <AsciiRule label="contact" />
          <div style={{ border: "2px solid var(--text)", padding: 18 }}>
            <BrutPrompt cmd="./contato.sh" />
            <div style={{ fontSize: 20, fontWeight: 700, margin: "10px 0 4px" }}>{t("home.cta.title")}</div>
            <div style={{ fontSize: 12, opacity: 0.75 }}>{t("home.cta.subtitle")}</div>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 14 }}>
              <button
                type="button"
                onClick={() => openWizard({ flowType: "project", sourceContext: "home-cta" })}
                data-umami-event="home-cta-projeto"
                style={btn(true)}
              >
                › {t("home.cta.project")}
              </button>
              <button
                type="button"
                onClick={() => openWizard({ flowType: "job", sourceContext: "home-cta" })}
                data-umami-event="home-cta-vaga"
                style={btn(false)}
              >
                › {t("home.cta.job")}
              </button>
            </div>
          </div>
        </>
      )}

      <div style={{ marginTop: 16 }}>
        <BrutPrompt
          cmd="echo $CONTACT"
          output={
            contactInfo && (contactInfo.show_email || contactInfo.show_phone) ? (
              <div style={{ display: "flex", gap: 20, marginTop: 4, fontSize: 12 }}>
                {contactInfo.show_email && contactInfo.email && (
                  <span>
                    <span style={{ color: "var(--accent)" }}>email=</span>
                    {contactInfo.email}
                  </span>
                )}
                {contactInfo.show_phone && contactInfo.phone && (
                  <span>
                    <span style={{ color: "var(--accent)" }}>phone=</span>
                    {contactInfo.phone}
                  </span>
                )}
              </div>
            ) : undefined
          }
        />
        <div style={{ marginTop: 8, opacity: 0.5, fontSize: 12 }}>
          <span style={{ color: "var(--accent)" }}>user@rubrica</span>
          <span>:~$ </span>
          <span
            style={{
              display: "inline-block",
              width: 8,
              height: 14,
              background: "var(--text)",
              verticalAlign: "middle",
              animation: "brut-blink 1s steps(1) infinite",
            }}
          />
          <style>{`@keyframes brut-blink { 50% { opacity: 0; } }`}</style>
        </div>
      </div>
    </div>
  );
}
