/**
 * Monografia — Início. A home é um livro: folha de rosto, "Em números" com linhas
 * pontilhadas, cases como sumário, sobre como prefácio com notas na margem, serviços como
 * ofícios, depoimentos como recepção e o contato como correspondência, com colofão no fim.
 */
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
import {
  Dot,
  Leader,
  MnMain,
  MnNumbers,
  MnPreface,
  MnQuote,
  MnSection,
  projectFolios,
  toRoman,
  useMonographText,
  usePrefaceNotes,
} from "@/components/MonographShared";

export default function MonographHome() {
  const { t } = useTranslation();
  const tx = useMonographText();
  const siteConfig = useSiteConfig();
  const {
    contactName,
    contactRole,
    aboutText,
    services,
    testimonials,
    availability,
    contactWizardEnabled,
    contactInfo,
    isLoading,
  } = useHome(homeRepository);
  const notes = usePrefaceNotes();
  const { projects } = usePortfolio(portfolioRepository);
  const { metrics } = useHomeMetrics(homeRepository);
  const { openWizard } = useContactWizard();
  const portfolioEnabled = usePlugin("portfolio");
  const aboutEnabled = usePlugin("about");
  const testimonialsEnabled = usePlugin("testimonials");
  const intakeEnabled = usePlugin("testimonials-intake");
  const [wizardOpen, setWizardOpen] = useState(false);

  if (isLoading) return null;

  const name = contactName || siteConfig.author_name || "";
  const book = projectFolios(projects);
  // No sumário, os cases seguem a ordem das páginas do livro (a mesma do Portfólio).
  const featuredCases = (portfolioEnabled ? selectFeaturedCases(projects) : []).sort(
    (a, b) => (book.get(a.id)?.n ?? 0) - (book.get(b.id)?.n ?? 0),
  );

  const paragraphs = splitParagraphs(aboutText ?? "");

  const email = contactInfo?.email ?? "";
  const showEmail = !!(contactInfo?.show_email && email);
  const showCorrespondence = contactWizardEnabled || showEmail;

  return (
    <>
      <SEO
        title={siteConfig.seo_home_title || siteConfig.site_title}
        description={siteConfig.seo_home_description || undefined}
        url="/"
      />

      {/* Folha de rosto */}
      <header className="mn-title">
        {availability?.available ? (
          <p className="mn-av">{availability.label || t("home.availability.label")}</p>
        ) : null}
        <h1>{name}</h1>
        {contactRole ? <p className="mn-sc mn-role">{contactRole}</p> : null}
        <hr aria-hidden="true" />
        <p className="mn-dek">{t("home.hero.headline")}</p>
        <p className="mn-desc">{t("home.hero.description")}</p>
        {(featuredCases.length > 0 || contactWizardEnabled) && (
          <p className="mn-links">
            {featuredCases.length > 0 && (
              <a href="#cases" className="mn-act" data-umami-event="home-hero-ver-cases">
                {t("home.hero.ctaCases")}
              </a>
            )}
            {featuredCases.length > 0 && contactWizardEnabled && <Dot />}
            {contactWizardEnabled && (
              <button
                type="button"
                className="mn-act"
                onClick={() => openWizard({ sourceContext: "home-hero" })}
                data-umami-event="home-hero-fale-comigo"
              >
                {t("home.hero.ctaContact")}
              </button>
            )}
          </p>
        )}
      </header>

      {metrics.length > 0 && (
        <MnSection id="numeros" label={tx.numbers}>
          <MnMain>
            <MnNumbers items={metrics} />
          </MnMain>
        </MnSection>
      )}

      {/* Sumário: os cases em destaque como capítulos */}
      {featuredCases.length > 0 && (
        <MnSection id="cases" label={tx.contents} sub={t("home.cases.title").trim()}>
          <MnMain>
            <ol className="mn-toc-list">
              {featuredCases.map((p) => {
                const metric = p.case_study?.metrics?.[0];
                const folio = book.get(p.id);
                return (
                  <li key={p.id} className="mn-entry">
                    <h3>
                      <Link
                        href={`/portfolio/${p.slug}`}
                        className="mn-entry-link"
                        data-umami-event="home-case"
                        data-umami-event-case={p.slug}
                      >
                        <Leader big value={folio ? `${tx.page} ${folio.page}` : undefined}>
                          <em>{toRoman(folio?.n ?? 1)}.</em>
                          {p.title}
                        </Leader>
                      </Link>
                    </h3>
                    {p.description ? <p className="mn-entry-sum">{p.description}</p> : null}
                    {(p.category || metric) && (
                      <p className="mn-entry-meta">
                        {[p.category, metric ? `${metric.value} ${metric.label}` : ""].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </li>
                );
              })}
            </ol>
            <p className="mn-links mn-links--left">
              <Link href="/portfolio" className="mn-act">
                {t("home.cases.viewAll")} →
              </Link>
            </p>
          </MnMain>
        </MnSection>
      )}

      {/* Prefácio */}
      <MnPreface
        id="prefacio"
        label={tx.preface}
        sub={t("home.about.title").trim()}
        paragraphs={paragraphs}
        notes={notes}
        after={
          aboutEnabled ? (
            <p className="mn-links mn-links--left">
              <Link href="/sobre" className="mn-act">
                {t("navigation.about")} →
              </Link>
            </p>
          ) : null
        }
      />

      {/* Ofícios */}
      {services.length > 0 && (
        <MnSection id="oficios" label={tx.crafts} sub={t("home.skills.title")}>
          <MnMain>
            {services.map((s, i) => (
              <p key={s.id ?? i} className="mn-sv">
                <b>{s.title}.</b> {s.description}
              </p>
            ))}
          </MnMain>
        </MnSection>
      )}

      {/* Recepção */}
      {testimonials.length > 0 && (
        <MnSection id="recepcao" label={tx.reception} sub={t("home.testimonials.title")}>
          <MnMain>
            <div className="mn-quotes">
              {testimonials.slice(0, 3).map((q, i) => (
                <MnQuote key={q.id ?? i} text={q.text} name={q.name} role={q.role} />
              ))}
            </div>
            {testimonialsEnabled && (
              <p className="mn-links mn-links--left">
                <Link href="/depoimentos" className="mn-act">
                  {t("testimonials.viewAll")}
                </Link>
                {intakeEnabled && (
                  <>
                    <Dot />
                    <button type="button" className="mn-act" onClick={() => setWizardOpen(true)}>
                      {t("testimonials.leaveTestimonial")}
                    </button>
                  </>
                )}
              </p>
            )}
          </MnMain>
        </MnSection>
      )}
      {testimonialsEnabled && intakeEnabled && (
        <TestimonialWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />
      )}

      {/* Correspondência e colofão */}
      <section className="mn-title mn-title--end" aria-labelledby="correspondencia-titulo">
        {showCorrespondence ? (
          <>
            <p className="mn-av">{tx.correspondence}</p>
            <h2 id="correspondencia-titulo">{t("home.cta.title")}</h2>
            <p className="mn-desc">{t("home.cta.subtitle")}</p>
            {contactWizardEnabled && (
              <p className="mn-btns">
                <button
                  type="button"
                  className="mn-btn mn-btn--pri"
                  onClick={() => openWizard({ flowType: "project", sourceContext: "home-cta" })}
                  data-umami-event="home-cta-projeto"
                >
                  {t("home.cta.project")}
                </button>
                <button
                  type="button"
                  className="mn-btn"
                  onClick={() => openWizard({ flowType: "job", sourceContext: "home-cta" })}
                  data-umami-event="home-cta-vaga"
                >
                  {t("home.cta.job")}
                </button>
              </p>
            )}
          </>
        ) : (
          <h2 id="correspondencia-titulo" className="sr-only">
            {tx.correspondence}
          </h2>
        )}
        <p className="mn-colo">
          {tx.colophon(name, new Date().getFullYear())}
          {showEmail && (
            <>
              {" "}
              {tx.writeTo} <a href={`mailto:${email}`}>{email}</a>.
            </>
          )}
        </p>
      </section>
    </>
  );
}
