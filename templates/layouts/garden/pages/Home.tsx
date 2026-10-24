import { useState } from "react";
import { Link } from "wouter";
import { useHome } from "@/hooks/useHome";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useHomeMetrics } from "@/hooks/useHomeMetrics";
import { useSiteConfig } from "@/hooks/useSiteConfig";
import { useContactWizard } from "@/contexts/ContactWizardContext";
import { usePlugin } from "@/contexts/PluginsContext";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { selectFeaturedCases } from "@/utils/homeContent";
import { splitParagraphs } from "@/utils/aboutContent";
import { hasCaseStudy } from "@/utils/portfolioContent";
import { homeRepository, portfolioRepository } from "@/repositories/instances";
import { SEO } from "@/components/SEO";
import { TestimonialWizard } from "@/components/TestimonialWizard";
import {
  Backlinks,
  Crumb,
  LinkedText,
  MetricsGrid,
  ProjectCard,
  SectionHead,
  StageDot,
  useGardenTerms,
  useGardenTexts,
} from "@/components/GardenShared";

export default function GardenHome() {
  const { t } = useTranslation();
  const tx = useGardenTexts();
  const siteConfig = useSiteConfig();
  const { contactName, contactRole, aboutText, services, testimonials, availability, contactWizardEnabled, isLoading } =
    useHome(homeRepository);
  const { projects } = usePortfolio(portfolioRepository);
  const { metrics } = useHomeMetrics(homeRepository);
  const { openWizard } = useContactWizard();
  const portfolioEnabled = usePlugin("portfolio");
  const testimonialsEnabled = usePlugin("testimonials");
  const testimonialsIntakeEnabled = usePlugin("testimonials-intake");
  const terms = useGardenTerms();
  const [wizardOpen, setWizardOpen] = useState(false);

  if (isLoading) return <div aria-busy="true" style={{ minHeight: "60vh" }} />;

  const featuredCases = portfolioEnabled ? selectFeaturedCases(projects) : [];
  const trees = portfolioEnabled ? projects.filter(hasCaseStudy).length : 0;
  const sprouts = portfolioEnabled ? projects.length - trees : 0;
  const about = splitParagraphs(aboutText ?? "");

  return (
    <>
      <SEO
        title={siteConfig.seo_home_title || siteConfig.site_title}
        description={siteConfig.seo_home_description || undefined}
        url="/"
      />

      {/* Entrada do jardim */}
      <section className="gd-hero" aria-labelledby="gd-hello">
        <Crumb page={t("navigation.home").toLowerCase()} />
        {(projects.length > 0 && portfolioEnabled) || availability?.available ? (
          <div className="gd-chips">
            {portfolioEnabled && projects.length > 0 && (
              <span className="gd-chip">
                <StageDot stage="tree" />
                {tx.gardenCount(trees, sprouts)}
              </span>
            )}
            {availability?.available && (
              <span className="gd-chip">
                <span className="gd-pulse" aria-hidden="true" />
                {availability.label || t("home.availability.label")}
              </span>
            )}
          </div>
        ) : null}
        <h1 id="gd-hello" className="gd-h1">
          {contactName ? tx.hello(contactName) : t("home.hero.headline")}
        </h1>
        {contactName && <p className="gd-lead">{t("home.hero.headline")}</p>}
        {contactRole && <p className="gd-p gd-muted">{contactRole}</p>}
        <p className="gd-p">{t("home.hero.description")}</p>
        {(featuredCases.length > 0 || contactWizardEnabled) && (
          <div className="gd-row">
            {featuredCases.length > 0 && (
              <a href="#cases" className="gd-btn gd-btn-pri" data-umami-event="home-hero-ver-cases">
                {t("home.hero.ctaCases")}
              </a>
            )}
            {contactWizardEnabled && (
              <button
                type="button"
                className="gd-btn"
                onClick={() => openWizard({ sourceContext: "home-hero" })}
                data-umami-event="home-hero-fale-comigo"
              >
                {t("home.hero.ctaContact")}
              </button>
            )}
          </div>
        )}
      </section>

      {/* Números de destaque */}
      {metrics.length > 0 && (
        <section className="gd-sec" aria-labelledby="gd-state">
          <SectionHead id="gd-state" title={tx.state} />
          <MetricsGrid metrics={metrics} />
        </section>
      )}

      {/* Cases em destaque */}
      {featuredCases.length > 0 && (
        <section id="cases" className="gd-sec" aria-labelledby="gd-trees">
          <SectionHead id="gd-trees" title={tx.trees}>
            <Link href="/portfolio" className="gd-link">
              {t("home.cases.viewAll")} →
            </Link>
          </SectionHead>
          <div className="gd-cards">
            {featuredCases.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        </section>
      )}

      {/* Sobre */}
      {about.length > 0 && (
        <section className="gd-sec gd-note" aria-labelledby="gd-about">
          <SectionHead id="gd-about" title={tx.caretaker} />
          {about.map((para, i) => (
            <p key={i}>
              <LinkedText text={para} terms={terms} />
            </p>
          ))}
          <Backlinks exclude="/" />
        </section>
      )}

      {/* Serviços */}
      {services.length > 0 && (
        <section className="gd-sec" aria-labelledby="gd-beds">
          <SectionHead id="gd-beds" title={tx.beds} />
          <p className="gd-p gd-muted">{t("home.skills.title")}</p>
          <ul className="gd-beds">
            {services.map((s, i) => (
              <li key={s.id || s.title} className="gd-bed">
                <span className="gd-eyebrow">
                  {tx.bed} {String(i + 1).padStart(2, "0")}
                </span>
                <h3>{s.title}</h3>
                {s.description && <p>{s.description}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Depoimentos */}
      {testimonials.length > 0 && (
        <section className="gd-sec" aria-labelledby="gd-guests">
          <SectionHead id="gd-guests" title={tx.guestbook} />
          <ul className="gd-gb">
            {testimonials.map((tm, i) => (
              <li key={tm.id || tm.name}>
                <small>
                  {tx.visit} {String(i + 1).padStart(2, "0")}
                </small>
                <blockquote>“{tm.text}”</blockquote>
                <b>{tm.name}</b>
                {tm.role && <span>{tm.role}</span>}
              </li>
            ))}
          </ul>
          {testimonialsEnabled && (
            <div className="gd-row">
              <Link href="/depoimentos" className="gd-link">
                {t("testimonials.viewAll")}
              </Link>
              {testimonialsIntakeEnabled && (
                <button type="button" className="gd-btn" onClick={() => setWizardOpen(true)}>
                  {t("testimonials.leaveTestimonial")}
                </button>
              )}
            </div>
          )}
        </section>
      )}
      {testimonialsEnabled && testimonialsIntakeEnabled && (
        <TestimonialWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />
      )}

      {/* Chamada final */}
      {contactWizardEnabled && (
        <section className="gd-cta" aria-labelledby="gd-plant">
          <span className="gd-eyebrow">{tx.plant}</span>
          <h2 id="gd-plant" className="gd-h2">
            {t("home.cta.title")}
          </h2>
          <p className="gd-p">{t("home.cta.subtitle")}</p>
          <div className="gd-row">
            <button
              type="button"
              className="gd-btn gd-btn-pri"
              onClick={() => openWizard({ flowType: "project", sourceContext: "home-cta" })}
              data-umami-event="home-cta-projeto"
            >
              {t("home.cta.project")}
            </button>
            <button
              type="button"
              className="gd-btn"
              onClick={() => openWizard({ flowType: "job", sourceContext: "home-cta" })}
              data-umami-event="home-cta-vaga"
            >
              {t("home.cta.job")}
            </button>
          </div>
        </section>
      )}
    </>
  );
}
