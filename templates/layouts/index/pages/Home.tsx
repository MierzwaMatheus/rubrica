import { useState } from "react";
import { Link } from "wouter";
import { SEO } from "@/components/SEO";
import { TestimonialWizard } from "@/components/TestimonialWizard";
import { useHome } from "@/hooks/useHome";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useHomeMetrics } from "@/hooks/useHomeMetrics";
import { useSiteConfig } from "@/hooks/useSiteConfig";
import { useContactWizard } from "@/contexts/ContactWizardContext";
import { usePlugin } from "@/contexts/PluginsContext";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { selectFeaturedCases } from "@/utils/homeContent";
import { splitParagraphs } from "@/utils/aboutContent";
import { homeRepository, portfolioRepository } from "@/repositories/instances";
import type { Project } from "@/repositories/interfaces/PortfolioRepository";
import {
  Highlighted,
  IndexMetrics,
  IndexSection,
  IndexTableSection,
  catalogNumber,
  useIndexCopy,
  type IndexColumn,
} from "@/components/IndexShared";

export default function IndexHome() {
  const { t } = useTranslation();
  const copy = useIndexCopy();
  const siteConfig = useSiteConfig();
  const { aboutText, services, testimonials, availability, contactWizardEnabled, isLoading } = useHome(homeRepository);
  const { projects } = usePortfolio(portfolioRepository);
  const { metrics } = useHomeMetrics(homeRepository);
  const { openWizard } = useContactWizard();
  const portfolioEnabled = usePlugin("portfolio");
  const wizardPlugin = usePlugin("contact-wizard");
  const testimonialsEnabled = usePlugin("testimonials");
  const testimonialsIntakeEnabled = usePlugin("testimonials-intake");
  const [wizardOpen, setWizardOpen] = useState(false);

  if (isLoading) return null;

  const featuredCases = portfolioEnabled ? selectFeaturedCases(projects) : [];
  const canContact = contactWizardEnabled && wizardPlugin;
  const aboutParagraphs = splitParagraphs(aboutText ?? "");
  const showTestimonials = testimonials.length > 0 || (testimonialsEnabled && testimonialsIntakeEnabled);
  // Nº de catálogo = posição no portfólio inteiro, igual à página de portfólio.
  const numberOf = (p: Project) => projects.findIndex((x) => x.id === p.id) + 1;

  const columns: IndexColumn<Project>[] = [
    { key: "num", header: copy.colNumber, width: "64px", cell: (p) => <span className="ix-num">{catalogNumber(numberOf(p))}</span> },
    { key: "title", header: copy.colProject, title: true, width: "30%", cell: (p) => p.title },
    { key: "type", header: copy.colType, muted: true, cell: (p) => p.category || p.tags[0] || copy.noResult },
    { key: "field", header: copy.colField, muted: true, cell: (p) => p.tags.slice(0, 2).join(", ") || copy.noResult },
    {
      key: "result",
      header: copy.colResult,
      width: "26%",
      cell: (p) => {
        const m = p.case_study?.metrics?.[0];
        return m ? (
          <span>
            {m.value} <span className="ix-muted">{m.label}</span>
          </span>
        ) : (
          copy.noResult
        );
      },
    },
  ];

  return (
    <>
      <SEO
        title={siteConfig.seo_home_title || siteConfig.site_title}
        description={siteConfig.seo_home_description || undefined}
        url="/"
      />

      {/* Abertura: a frase de valor é o único momento de tipografia grande */}
      <IndexSection
        labelAs="div"
        label={
          availability?.available ? (
            <span className="ix-av">
              <i aria-hidden="true" />
              {availability.label || t("home.availability.label")}
            </span>
          ) : (
            <span className="ix-code">
              {copy.sheet} 001 — {copy.intro}
            </span>
          )
        }
      >
        <h1 className="ix-lede">{t("home.hero.headline")}</h1>
        <p className="ix-desc">{t("home.hero.description")}</p>
        {(featuredCases.length > 0 || canContact) && (
          <p className="ix-links">
            {featuredCases.length > 0 && (
              <a href="#index-casos" className="ix-u" data-umami-event="home-hero-ver-cases">
                {t("home.hero.ctaCases")} ↓
              </a>
            )}
            {canContact && (
              <button
                type="button"
                className="ix-u"
                onClick={() => openWizard({ sourceContext: "home-hero" })}
                data-umami-event="home-hero-fale-comigo"
              >
                {t("home.hero.ctaContact")} →
              </button>
            )}
          </p>
        )}
      </IndexSection>

      {metrics.length > 0 && (
        <IndexSection label={copy.inNumbers}>
          <IndexMetrics metrics={metrics} />
        </IndexSection>
      )}

      {/* Cases em destaque como linhas de um índice */}
      {featuredCases.length > 0 && (
        <IndexTableSection
          id="index-casos"
          label={t("home.cases.title").trim()}
          caption={t("home.cases.title").trim()}
          rows={featuredCases}
          columns={columns}
          getKey={(p) => String(p.id)}
          getLink={(p) => ({ href: `/portfolio/${p.slug}` })}
          getPreview={(p) => ({ image: p.images?.[0], caption: `${catalogNumber(numberOf(p))} · ${p.title}` })}
          footer={
            <p className="ix-more">
              <Link href="/portfolio" className="ix-u" data-umami-event="home-cases-ver-todos">
                {t("home.cases.viewAll")} ({projects.length}) →
              </Link>
            </p>
          }
        />
      )}

      {aboutParagraphs.length > 0 && (
        <IndexSection label={t("home.about.title").trim()}>
          <div className="ix-cols">
            {aboutParagraphs.map((p, i) => (
              <p key={i}>
                <Highlighted text={p} />
              </p>
            ))}
          </div>
        </IndexSection>
      )}

      {services.length > 0 && (
        <IndexSection label={t("home.skills.title")}>
          <div>
            {services.map((s) => (
              <div key={s.id || s.title} className="ix-sv">
                <h3>{s.title}</h3>
                <p>{s.description}</p>
              </div>
            ))}
          </div>
        </IndexSection>
      )}

      {showTestimonials && (
        <IndexSection label={t("home.testimonials.title")}>
          {testimonials.length > 0 && (
            <div className="ix-tq">
              {testimonials.slice(0, 3).map((item) => (
                <figure key={item.id || item.name}>
                  <blockquote>“{item.text}”</blockquote>
                  <figcaption>
                    <b>{item.name}</b>
                    {item.role && <span>{item.role}</span>}
                  </figcaption>
                </figure>
              ))}
            </div>
          )}
          {testimonialsEnabled && (
            <p className="ix-links">
              <Link href="/depoimentos" className="ix-u">
                {t("testimonials.viewAll")}
              </Link>
              {testimonialsIntakeEnabled && (
                <button type="button" className="ix-u" onClick={() => setWizardOpen(true)}>
                  {t("testimonials.leaveTestimonial")}
                </button>
              )}
            </p>
          )}
          <TestimonialWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />
        </IndexSection>
      )}

      {/* Fechamento: um caminho para quem tem projeto e outro para quem tem vaga */}
      {canContact && (
        <IndexSection label={copy.contact}>
          <h3 className="ix-lede ix-lede--cta">{t("home.cta.title")}</h3>
          <p className="ix-desc">{t("home.cta.subtitle")}</p>
          <p className="ix-links ix-links--big">
            <button
              type="button"
              className="ix-u"
              onClick={() => openWizard({ flowType: "project", sourceContext: "home-cta" })}
              data-umami-event="home-cta-projeto"
            >
              {t("home.cta.project")} →
            </button>
            <button
              type="button"
              className="ix-u"
              onClick={() => openWizard({ flowType: "job", sourceContext: "home-cta" })}
              data-umami-event="home-cta-vaga"
            >
              {t("home.cta.job")} →
            </button>
          </p>
        </IndexSection>
      )}
    </>
  );
}
