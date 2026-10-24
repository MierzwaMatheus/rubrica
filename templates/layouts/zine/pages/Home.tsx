import { useState } from "react";
import { Link } from "wouter";
import { ArrowRight, MessageSquare, Scissors, Square, SquareCheck } from "lucide-react";
import { useHome } from "@/hooks/useHome";
import { useSidebar } from "@/hooks/useSidebar";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useHomeMetrics } from "@/hooks/useHomeMetrics";
import { useContactWizard } from "@/contexts/ContactWizardContext";
import { usePlugin } from "@/contexts/PluginsContext";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { selectFeaturedCases } from "@/utils/homeContent";
import { splitParagraphs } from "@/utils/aboutContent";
import { TestimonialWizard } from "@/components/TestimonialWizard";
import { homeRepository, portfolioRepository, sidebarRepository } from "@/repositories/instances";
import {
  HandTitle,
  Highlighted,
  Letter,
  Polaroid,
  PostIt,
  Sticker,
  Tape,
  TicketFace,
  firstName,
  stickerValueSize,
  tilt,
  tiltAt,
  truncate,
  useZineCopy,
  type PaperTone,
} from "@/components/ZineShared";

const METRIC_TONES: PaperTone[] = ["primary", "ink", "tape", "paper"];
const SERVICE_TONES: PaperTone[] = ["tape", "paper", "primary", "subtle"];

export default function ZineHome() {
  const { t } = useTranslation();
  const copy = useZineCopy();
  const { contactRole, aboutText, services, testimonials, availability, contactWizardEnabled, isLoading } =
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

  const featuredCases = portfolioEnabled ? selectFeaturedCases(projects) : [];
  const canContact = contactWizardEnabled && wizardPlugin;
  const canLeaveTestimonial = testimonialsEnabled && testimonialsIntakeEnabled;
  const name = contactInfo?.name ?? "";
  const first = firstName(name);
  const aboutParagraphs = splitParagraphs(aboutText ?? "");
  const email = contactInfo?.show_email ? contactInfo.email : "";

  return (
    <div className="zn-wrap">
      {/* Capa: título à mão, etiqueta do cargo, frase de valor numa tira de papel e ingressos */}
      <section className="zn-hero" aria-labelledby="zn-hello">
        <div className="zn-hero-text">
          <h1 id="zn-hello" className="zn-hello zn-tilt" style={tilt(-2)}>
            {copy.hello} {first || name}!
          </h1>
          {contactRole && (
            <p className="zn-tilt" style={tilt(-1, { margin: 0 })}>
              <span className="zn-role">{contactRole}</span>
            </p>
          )}
          <p className="zn-paperstrip zn-tilt" style={tilt(-1.4)}>
            {t("home.hero.headline")}
          </p>
          <p className="zn-lead">{t("home.hero.description")}</p>
          {(featuredCases.length > 0 || canContact) && (
            <div className="zn-actions">
              {featuredCases.length > 0 && (
                <a href="#cases" className="zn-ticket zn-tilt" style={tilt(-2)} data-umami-event="home-hero-ver-cases">
                  <TicketFace tone="primary" stub="Nº 01">
                    {t("home.hero.ctaCases")} <ArrowRight size={16} aria-hidden="true" />
                  </TicketFace>
                </a>
              )}
              {canContact && (
                <button
                  type="button"
                  className="zn-ticket zn-tilt"
                  style={tilt(1.5)}
                  onClick={() => openWizard({ sourceContext: "home-hero" })}
                  data-umami-event="home-hero-fale-comigo"
                >
                  <TicketFace stub="Nº 02">
                    <MessageSquare size={16} aria-hidden="true" /> {t("home.hero.ctaContact")}
                  </TicketFace>
                </button>
              )}
            </div>
          )}
        </div>

        <div className="zn-me">
          <span className="zn-blob a" aria-hidden="true" />
          <span className="zn-blob b" aria-hidden="true" />
          <Polaroid
            as="figure"
            image={contactInfo?.avatar_url || null}
            alt={name ? copy.photoAlt(name) : ""}
            deg={4}
            tape="left"
            halftone
          >
            {name && (
              <figcaption className="zn-pol-title" style={{ fontSize: 26 }}>
                {name}
              </figcaption>
            )}
          </Polaroid>
          {availability?.available && (
            <Sticker tone="tape" deg={12} className="zn-avail">
              <span>{availability.label || t("home.availability.label")}</span>
            </Sticker>
          )}
        </div>
      </section>

      {/* Números como adesivos redondos (a faixa some sem números) */}
      {metrics.length > 0 && (
        <section className="zn-sec" aria-labelledby="zn-numbers">
          <HandTitle id="zn-numbers">{copy.numbers}</HandTitle>
          <ul className="zn-stickers zn-list">
            {metrics.map((m, i) => (
              <Sticker key={`${m.value}-${m.label}`} as="li" tone={METRIC_TONES[i % METRIC_TONES.length]} deg={tiltAt(i, 3)}>
                <b style={{ fontSize: stickerValueSize(m.value) }}>{m.value}</b>
                <small>{m.label}</small>
              </Sticker>
            ))}
          </ul>
        </section>
      )}

      {/* Cases como polaroides presas com fita */}
      {featuredCases.length > 0 && (
        <section id="cases" className="zn-sec" aria-labelledby="zn-cases" style={{ scrollMarginTop: 24 }}>
          <HandTitle id="zn-cases">{copy.cases}</HandTitle>
          <ul className="zn-polgrid">
            {featuredCases.map((p, i) => {
              const metric = p.case_study?.metrics?.[0];
              return (
                <Polaroid key={p.id} as="li" image={p.images?.[0]} alt="" deg={tiltAt(i, 1.4)}>
                  <h3 className="zn-pol-title">{p.title}</h3>
                  {p.category && <p className="zn-pol-meta">{p.category}</p>}
                  <p className="zn-pol-desc">{truncate(p.description, 150)}</p>
                  {metric && (
                    <p className="zn-pol-metric">
                      <mark className="zn-mark">{metric.value}</mark> {metric.label}
                    </p>
                  )}
                  <div className="zn-pol-action">
                    <Link
                      href={`/portfolio/${p.slug}`}
                      className="zn-handlink"
                      data-umami-event="home-case"
                      data-umami-event-case={p.slug}
                    >
                      {copy.readCase} →<span className="zn-sr">: {p.title}</span>
                    </Link>
                  </div>
                </Polaroid>
              );
            })}
          </ul>
          <div className="zn-handlinks">
            <Link href="/portfolio" className="zn-handlink">
              {t("home.cases.viewAll")} →
            </Link>
          </div>
        </section>
      )}

      {/* Sobre: carta datilografada */}
      {aboutParagraphs.length > 0 && (
        <section className="zn-sec" aria-labelledby="zn-about">
          <HandTitle id="zn-about">{copy.about}</HandTitle>
          <Letter>
            <p>{copy.dear}</p>
            {aboutParagraphs.map((para, i) => (
              <p key={i}>
                <Highlighted text={para} />
              </p>
            ))}
            {first && <p className="zn-sign">— {first}</p>}
          </Letter>
          {aboutEnabled && (
            <div className="zn-handlinks">
              <Link href="/sobre" className="zn-handlink">
                {copy.moreAbout} →
              </Link>
            </div>
          )}
        </section>
      )}

      {/* O que eu faço: post-its */}
      {services.length > 0 && (
        <section className="zn-sec" aria-labelledby="zn-services">
          <HandTitle id="zn-services">{copy.services}</HandTitle>
          <ul className="zn-postits">
            {services.map((s, i) => (
              <PostIt key={s.id ?? s.title} as="li" tone={SERVICE_TONES[i % SERVICE_TONES.length]} deg={tiltAt(i, 1.3)}>
                <h3>{s.title}</h3>
                <p>{s.description}</p>
              </PostIt>
            ))}
          </ul>
        </section>
      )}

      {/* Depoimentos: bilhetes colados */}
      {(testimonials.length > 0 || canLeaveTestimonial) && (
        <section className="zn-sec" aria-labelledby="zn-testimonials">
          <HandTitle id="zn-testimonials">{copy.testimonials}</HandTitle>
          {testimonials.length > 0 && (
            <ul className="zn-notes">
              {testimonials.slice(0, 6).map((tm, i) => (
                <li key={tm.id ?? i} className="zn-tilt" style={tilt(tiltAt(i, 1.1))}>
                  <figure className="zn-note" style={{ margin: 0, height: "100%" }}>
                    <Tape pos={i % 2 ? "right" : "center"} />
                    <blockquote>“{truncate(tm.text, 220)}”</blockquote>
                    <figcaption>
                      {tm.name}
                      {tm.role ? ` · ${tm.role}` : ""}
                    </figcaption>
                  </figure>
                </li>
              ))}
            </ul>
          )}
          {testimonialsEnabled && (
            <div className="zn-handlinks">
              <Link href="/depoimentos" className="zn-handlink">
                {t("testimonials.viewAll").replace(/\s*→\s*$/, "")} →
              </Link>
              {testimonialsIntakeEnabled && (
                <button type="button" className="zn-handlink" onClick={() => setTestimonialOpen(true)}>
                  {t("testimonials.leaveTestimonial")}
                </button>
              )}
            </div>
          )}
          {canLeaveTestimonial && <TestimonialWizard open={testimonialOpen} onClose={() => setTestimonialOpen(false)} />}
        </section>
      )}

      {/* Contato: cupom de recortar */}
      {canContact && (
        <section className="zn-sec" aria-labelledby="zn-cta">
          <div className="zn-coupon zn-tilt" style={tilt(-0.8)}>
            <span className="zn-scissors" aria-hidden="true">
              <Scissors size={24} />
            </span>
            <h2 id="zn-cta">{t("home.cta.title")}</h2>
            <p>{t("home.cta.subtitle")}</p>
            <div className="zn-checks">
              <button
                type="button"
                className="zn-check"
                data-tone="primary"
                onClick={() => openWizard({ flowType: "project", sourceContext: "home-cta" })}
                data-umami-event="home-cta-projeto"
              >
                <Square size={18} className="off" aria-hidden="true" />
                <SquareCheck size={18} className="on" aria-hidden="true" />
                {t("home.cta.project")}
              </button>
              <button
                type="button"
                className="zn-check"
                onClick={() => openWizard({ flowType: "job", sourceContext: "home-cta" })}
                data-umami-event="home-cta-vaga"
              >
                <Square size={18} className="off" aria-hidden="true" />
                <SquareCheck size={18} className="on" aria-hidden="true" />
                {t("home.cta.job")}
              </button>
            </div>
            <small>
              {copy.couponNote}
              {email ? ` ${copy.couponTo} ${email}` : ""}
            </small>
          </div>
        </section>
      )}
    </div>
  );
}
