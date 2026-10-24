import { useState } from "react";
import { Link } from "wouter";
import { ArrowDown, Star } from "lucide-react";
import { SEO } from "@/components/SEO";
import { TestimonialWizard } from "@/components/TestimonialWizard";
import { useHome } from "@/hooks/useHome";
import { useHomeMetrics } from "@/hooks/useHomeMetrics";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useSiteConfig } from "@/hooks/useSiteConfig";
import { useContactWizard } from "@/contexts/ContactWizardContext";
import { usePlugin } from "@/contexts/PluginsContext";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { homeRepository, portfolioRepository } from "@/repositories/instances";
import { splitParagraphs } from "@/utils/aboutContent";
import { selectFeaturedCases } from "@/utils/homeContent";
import {
  BigNumbers,
  BodyText,
  PosterRow,
  Seal,
  Section,
  SectionLabel,
  Statement,
  Ticker,
  fit,
  usePosterLabels,
} from "@/components/PosterShared";

/** Tamanho da citação conforme o comprimento: frases curtas ficam do tamanho de um cartaz. */
const quoteSize = (text: string) => (text.length <= 140 ? "l" : text.length <= 280 ? "m" : "s");

const HERO_CSS = `
.poster-hero { border-bottom: var(--poster-rule) solid var(--text); padding-block: clamp(28px, 4vw, 56px) clamp(36px, 5vw, 64px); }
.poster-hero-grid {
  display: grid; grid-template-columns: minmax(0, 1fr) minmax(220px, 330px);
  grid-template-areas: "nome deco" "acoes texto"; align-items: end;
  gap: clamp(28px, 4vw, 48px) clamp(24px, 4vw, 56px);
}
.poster-hero-name { grid-area: nome; align-self: start; }
.poster-hero-name h1 { margin: 0; }
.poster-hero-deco { grid-area: deco; position: relative; align-self: start; width: 100%; aspect-ratio: 1; }
.poster-hero-deco .poster-disc { inset: 6%; }
.poster-hero-deco .poster-seal { left: -4%; top: -2%; }
.poster-hero-text { grid-area: texto; }
.poster-hero-text strong { display: block; font-size: clamp(21px, 1.9vw, 27px); font-weight: 800; line-height: 1.12; letter-spacing: -.015em; }
.poster-hero-text p { margin: 12px 0 0; font-size: 16px; line-height: 1.5; }
.poster-hero-role { display: block; margin-top: 16px; padding-top: 12px; border-top: 2px solid var(--text); font-family: var(--font-mono); font-size: 12px; letter-spacing: .1em; text-transform: uppercase; }
.poster-hero-acts { grid-area: acoes; }
.poster-cta h2 { line-height: .88; }
.poster-cta-sub { margin: 24px 0 32px; max-width: 46ch; font-size: clamp(17px, 1.6vw, 20px); line-height: 1.45; }
.poster-tm-acts { display: flex; flex-wrap: wrap; align-items: center; gap: 16px 28px; margin-top: 40px; }
@media (max-width: 860px) {
  .poster-hero-grid { grid-template-columns: minmax(0, 1fr); grid-template-areas: "nome" "deco" "texto" "acoes"; }
  .poster-hero-deco { aspect-ratio: auto; height: 170px; }
  .poster-hero-deco .poster-disc { inset: 0 0 0 auto; width: 170px; height: 170px; }
  .poster-hero-deco .poster-seal { left: 0; top: 18px; }
}
`;

export default function PosterHome() {
  const { t } = useTranslation();
  const labels = usePosterLabels();
  const siteConfig = useSiteConfig();
  const { contactName, contactRole, aboutText, services, testimonials, availability, contactWizardEnabled, isLoading } =
    useHome(homeRepository);
  const { metrics } = useHomeMetrics(homeRepository);
  const { projects } = usePortfolio(portfolioRepository);
  const { openWizard } = useContactWizard();
  const portfolioEnabled = usePlugin("portfolio");
  const aboutEnabled = usePlugin("about");
  const testimonialsEnabled = usePlugin("testimonials");
  const testimonialsIntakeEnabled = usePlugin("testimonials-intake");
  const [wizardOpen, setWizardOpen] = useState(false);

  if (isLoading) return null;

  const featuredCases = portfolioEnabled ? selectFeaturedCases(projects) : [];
  const tickerNames = portfolioEnabled ? projects.map((p) => p.title).filter(Boolean) : [];
  const fullName = (contactName || siteConfig.author_name || "").trim();
  const [firstName = "", ...rest] = fullName.split(/\s+/);
  const surname = rest.join(" ");
  const paragraphs = splitParagraphs(aboutText);
  const [lead, ...others] = testimonials;

  return (
    <>
      <SEO
        title={siteConfig.seo_home_title || siteConfig.site_title}
        description={siteConfig.seo_home_description || undefined}
        url="/"
      />
      <style>{HERO_CSS}</style>

      {/* Hero: nome gigante, disco e selo em coluna própria (nunca sobre o texto) */}
      <section className="poster-hero" aria-label={fullName || undefined}>
        <div className="poster-wrap poster-hero-grid">
          <div className="poster-hero-name poster-fit">
            <h1>
              <span className="poster-giant poster-up" style={{ ...fit(firstName, 280), lineHeight: 0.84 }}>
                {firstName}
              </span>{" "}
              {surname && (
                <span
                  className="poster-giant poster-up poster-outline"
                  style={{ ...fit(surname, 168, 0.86), lineHeight: 0.9, letterSpacing: "-0.01em", marginTop: "0.08em" }}
                >
                  {surname}
                </span>
              )}
            </h1>
          </div>

          <div className="poster-hero-deco">
            <span className="poster-disc" aria-hidden="true" />
            {availability?.available && <Seal label={availability.label || t("home.availability.label")} />}
          </div>

          <div className="poster-hero-text">
            <strong>{t("home.hero.headline")}</strong>
            <p>{t("home.hero.description")}</p>
            {contactRole && <span className="poster-hero-role">{contactRole}</span>}
          </div>

          {(featuredCases.length > 0 || contactWizardEnabled) && (
            <div className="poster-hero-acts poster-btns">
              {featuredCases.length > 0 && (
                <a href="#cases" className="poster-btn poster-btn--pri" data-umami-event="home-hero-ver-cases">
                  {t("home.hero.ctaCases")} <ArrowDown size={18} strokeWidth={3} aria-hidden="true" />
                </a>
              )}
              {contactWizardEnabled && (
                <button
                  type="button"
                  className="poster-btn"
                  onClick={() => openWizard({ sourceContext: "home-hero" })}
                  data-umami-event="home-hero-fale-comigo"
                >
                  {t("home.hero.ctaContact")}
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      <Ticker items={tickerNames} />

      {/* Números gigantes */}
      {metrics.length > 0 && (
        <Section labelledBy="poster-numeros">
          <SectionLabel id="poster-numeros" title={labels.emNumeros} />
          <BigNumbers items={metrics} />
        </Section>
      )}

      {/* Cases como linhas de cartaz */}
      {featuredCases.length > 0 && (
        <Section id="cases" labelledBy="poster-cases">
          <SectionLabel
            id="poster-cases"
            title={t("home.cases.title").trim()}
            action={<Link href="/portfolio">{t("home.cases.viewAll")} →</Link>}
          />
          <ul className="poster-rows">
            {featuredCases.map((p, i) => {
              const metric = p.case_study?.metrics?.[0];
              return (
                <PosterRow
                  key={p.id}
                  index={i + 1}
                  title={p.title}
                  tag={p.category || p.tags?.[0]}
                  meta={
                    metric ? (
                      <>
                        <b>{metric.value}</b>
                        <span>{metric.label}</span>
                      </>
                    ) : undefined
                  }
                  action={labels.lerCase}
                  href={`/portfolio/${p.slug}`}
                  umamiEvent="home-case"
                  umamiCase={p.slug}
                />
              );
            })}
          </ul>
        </Section>
      )}

      {/* Sobre: uma declaração grande com marca-texto */}
      {paragraphs.length > 0 && (
        <Section labelledBy="poster-sobre">
          <SectionLabel
            id="poster-sobre"
            title={t("home.about.title").trim()}
            action={aboutEnabled ? <Link href="/sobre">{labels.maisSobreMim} →</Link> : undefined}
          />
          <Statement text={paragraphs[0]} />
          {paragraphs.slice(1).map((p, i) => (
            <BodyText key={i} text={p} />
          ))}
        </Section>
      )}

      {/* Serviços em caixa alta gigante */}
      {services.length > 0 && (
        <Section labelledBy="poster-servicos">
          <SectionLabel id="poster-servicos" title={t("home.skills.title")} />
          <div>
            {services.map((s, i) => (
              <div key={s.id || i} className="poster-sv">
                <div className="poster-fit">
                  <h3 className="poster-giant poster-up" style={{ ...fit(s.title, 64), lineHeight: 1 }}>
                    {s.title}
                  </h3>
                </div>
                {s.description && <p>{s.description}</p>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Depoimentos: uma citação enorme e duas menores */}
      {lead && (
        <Section labelledBy="poster-depoimentos">
          <SectionLabel
            id="poster-depoimentos"
            title={t("home.testimonials.title")}
            action={testimonialsEnabled ? <Link href="/depoimentos">{t("testimonials.viewAll")}</Link> : undefined}
          />
          <figure style={{ margin: 0 }}>
            <blockquote className={`poster-q poster-q--${quoteSize(lead.text)}`}>“{lead.text}”</blockquote>
            <figcaption className="poster-cite">
              {lead.name}
              {lead.role ? ` · ${lead.role}` : ""}
            </figcaption>
          </figure>
          {others.length > 0 && (
            <div className="poster-qs">
              {others.slice(0, 2).map((q, i) => (
                <figure key={q.id || i} style={{ margin: 0 }}>
                  <blockquote>
                    <p>“{q.text}”</p>
                  </blockquote>
                  <figcaption className="poster-cite" style={{ marginTop: 10 }}>
                    {q.name}
                    {q.role ? ` · ${q.role}` : ""}
                  </figcaption>
                </figure>
              ))}
            </div>
          )}
          {testimonialsEnabled && testimonialsIntakeEnabled && (
            <div className="poster-tm-acts">
              <button type="button" className="poster-btn" onClick={() => setWizardOpen(true)}>
                <Star size={16} strokeWidth={2.5} aria-hidden="true" /> {t("testimonials.leaveTestimonial")}
              </button>
            </div>
          )}
          <TestimonialWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />
        </Section>
      )}

      {/* Chamada final em tamanho de cartaz */}
      {contactWizardEnabled && (
        <Section className="poster-cta" labelledBy="poster-cta">
          <div className="poster-fit">
            <h2 id="poster-cta" className="poster-giant poster-up" style={fit(t("home.cta.title"), 150)}>
              {t("home.cta.title")}
            </h2>
          </div>
          <p className="poster-cta-sub">{t("home.cta.subtitle")}</p>
          <div className="poster-btns">
            <button
              type="button"
              className="poster-btn poster-btn--pri"
              onClick={() => openWizard({ flowType: "project", sourceContext: "home-cta" })}
              data-umami-event="home-cta-projeto"
            >
              {t("home.cta.project")}
            </button>
            <button
              type="button"
              className="poster-btn"
              onClick={() => openWizard({ flowType: "job", sourceContext: "home-cta" })}
              data-umami-event="home-cta-vaga"
            >
              {t("home.cta.job")}
            </button>
          </div>
        </Section>
      )}
    </>
  );
}
