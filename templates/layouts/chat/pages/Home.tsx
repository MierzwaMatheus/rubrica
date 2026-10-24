import { useState } from "react";
import { Link } from "wouter";
import { useHome } from "@/hooks/useHome";
import { useSidebar } from "@/hooks/useSidebar";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useHomeMetrics } from "@/hooks/useHomeMetrics";
import { useContactWizard } from "@/contexts/ContactWizardContext";
import { usePlugin } from "@/contexts/PluginsContext";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { homeRepository, sidebarRepository, portfolioRepository } from "@/repositories/instances";
import { selectFeaturedCases } from "@/utils/homeContent";
import { splitParagraphs } from "@/utils/aboutContent";
import { TestimonialWizard } from "@/components/TestimonialWizard";
import {
  Bubble,
  ChatLog,
  ChatSection,
  DayChip,
  Forwarded,
  Highlighted,
  LinkCard,
  MetricGrid,
  MetricLine,
  Typing,
  useChatText,
} from "@/components/ChatShared";

export default function ChatHome() {
  const { t } = useTranslation();
  const text = useChatText();
  const { contactName, contactRole, aboutText, services, testimonials, contactWizardEnabled, isLoading } =
    useHome(homeRepository);
  const { contactInfo } = useSidebar(sidebarRepository);
  const { projects } = usePortfolio(portfolioRepository);
  const { metrics } = useHomeMetrics(homeRepository);
  const { openWizard } = useContactWizard();
  const portfolioEnabled = usePlugin("portfolio");
  const aboutEnabled = usePlugin("about");
  const wizardPlugin = usePlugin("contact-wizard");
  const testimonialsEnabled = usePlugin("testimonials");
  const testimonialsIntakeEnabled = usePlugin("testimonials-intake");
  const [testimonialOpen, setTestimonialOpen] = useState(false);

  if (isLoading) return null;

  const name = contactInfo?.name || contactName;
  const featuredCases = portfolioEnabled ? selectFeaturedCases(projects) : [];
  const canContact = contactWizardEnabled && wizardPlugin;
  const aboutParagraphs = splitParagraphs(aboutText ?? "");
  const headline = t("home.hero.headline");
  const description = t("home.hero.description");

  return (
    <ChatLog>
      <DayChip />

      {/* Apresentação: quem é, a frase de valor e os dois caminhos */}
      <ChatSection title={text.sectionIntro}>
        <Bubble>
          <h1 className="ct-hi">{text.hello(name)}</h1>
          <p>
            {contactRole && <>{contactRole}. </>}
            {headline}
          </p>
        </Bubble>
        {(description || featuredCases.length > 0 || canContact) && (
          <Bubble>
            {description && <p>{description}</p>}
            {(featuredCases.length > 0 || canContact) && (
              <div className="ct-acts">
                {featuredCases.length > 0 && (
                  <a href="#cases" className="ct-pill pri" data-umami-event="home-hero-ver-cases">
                    {t("home.hero.ctaCases")}
                  </a>
                )}
                {canContact && (
                  <button
                    type="button"
                    className="ct-pill"
                    onClick={() => openWizard({ sourceContext: "home-hero" })}
                    data-umami-event="home-hero-fale-comigo"
                  >
                    {t("home.hero.ctaContact")}
                  </button>
                )}
              </div>
            )}
          </Bubble>
        )}
      </ChatSection>

      {/* Números de destaque (somem sem números) */}
      {metrics.length > 0 && (
        <ChatSection title={text.sectionNumbers} ask={text.qNumbers}>
          <Bubble>
            <MetricGrid metrics={metrics.slice(0, 4)} />
          </Bubble>
        </ChatSection>
      )}

      {/* Cases em destaque */}
      {featuredCases.length > 0 && (
        <ChatSection id="cases" title={t("home.cases.title").trim()} ask={text.qCases}>
          <Bubble wide>
            <p>{text.casesIntro(featuredCases.length)}</p>
            <div className="ct-cards">
              {featuredCases.map((p) => (
                <LinkCard
                  key={p.id}
                  href={`/portfolio/${p.slug}`}
                  image={p.images?.[0]}
                  title={p.title}
                  umamiEvent="home-case"
                  umamiCase={p.slug}
                >
                  <small>{[p.category, p.description].filter(Boolean).join(" · ")}</small>
                  <MetricLine metric={p.case_study?.metrics?.[0]} />
                </LinkCard>
              ))}
            </div>
            <Link href="/portfolio" className="ct-a">
              {t("home.cases.viewAll")} →
            </Link>
          </Bubble>
        </ChatSection>
      )}

      {/* Sobre: um balão por parágrafo, com os números em destaque */}
      {aboutParagraphs.length > 0 && (
        <ChatSection title={t("home.about.title").trim()} ask={text.qAbout}>
          {aboutParagraphs.map((para, i) => (
            <Bubble key={i}>
              <p>
                <Highlighted text={para} />
              </p>
              {aboutEnabled && i === aboutParagraphs.length - 1 && (
                <Link href="/sobre" className="ct-a">
                  {text.moreAbout} →
                </Link>
              )}
            </Bubble>
          ))}
        </ChatSection>
      )}

      {/* O que eu faço */}
      {services.length > 0 && (
        <ChatSection title={t("home.skills.title")} ask={text.qServices}>
          <Bubble>
            <ul className="ct-list">
              {services.map((s) => (
                <li key={s.id || s.title}>
                  <b className="ct-t">{s.title}</b>
                  {s.description && <span>{s.description}</span>}
                </li>
              ))}
            </ul>
          </Bubble>
        </ChatSection>
      )}

      {/* Depoimentos como mensagens encaminhadas */}
      {testimonials.length > 0 && (
        <ChatSection title={t("home.testimonials.title")} ask={text.qTestimonials}>
          <Bubble wide>
            <p>{text.testimonialsIntro}</p>
            {testimonials.map((tm) => (
              <Forwarded key={tm.id || tm.name} text={tm.text} name={tm.name} role={tm.role} />
            ))}
            {testimonialsEnabled && (
              <div className="ct-acts">
                <Link href="/depoimentos" className="ct-pill">
                  {t("testimonials.viewAll").replace(/\s*→\s*$/, "")}
                </Link>
                {testimonialsIntakeEnabled && (
                  <button type="button" className="ct-pill" onClick={() => setTestimonialOpen(true)}>
                    {t("testimonials.leaveTestimonial")}
                  </button>
                )}
              </div>
            )}
          </Bubble>
          {testimonialsEnabled && testimonialsIntakeEnabled && (
            <TestimonialWizard open={testimonialOpen} onClose={() => setTestimonialOpen(false)} />
          )}
        </ChatSection>
      )}

      {/* Fechamento: um caminho para quem tem projeto e outro para quem tem vaga */}
      {canContact && (
        <ChatSection title={t("home.cta.title")}>
          <Bubble wide>
            <p className="ct-hi">{t("home.cta.title")}</p>
            <p>{t("home.cta.subtitle")}</p>
            <div className="ct-acts big">
              <button
                type="button"
                className="ct-pill pri"
                onClick={() => openWizard({ flowType: "project", sourceContext: "home-cta" })}
                data-umami-event="home-cta-projeto"
              >
                {t("home.cta.project")}
              </button>
              <button
                type="button"
                className="ct-pill"
                onClick={() => openWizard({ flowType: "job", sourceContext: "home-cta" })}
                data-umami-event="home-cta-vaga"
              >
                {t("home.cta.job")}
              </button>
            </div>
          </Bubble>
        </ChatSection>
      )}

      <Typing />
    </ChatLog>
  );
}
