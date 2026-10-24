import { useState } from "react";
import { Link } from "wouter";
import { SEO } from "@/components/SEO";
import { TestimonialWizard } from "@/components/TestimonialWizard";
import { useHome } from "@/hooks/useHome";
import { useHomeMetrics } from "@/hooks/useHomeMetrics";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useSiteConfig } from "@/hooks/useSiteConfig";
import { useContactWizard } from "@/contexts/ContactWizardContext";
import { usePlugin } from "@/contexts/PluginsContext";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { selectFeaturedCases } from "@/utils/homeContent";
import { splitParagraphs } from "@/utils/aboutContent";
import { homeRepository, portfolioRepository } from "@/repositories/instances";
import {
  Highlighted,
  ICON_COLORS,
  Led,
  MetricsGrid,
  Window,
  WindowStack,
  shorten,
  useDesktopCopy,
} from "@/components/DesktopShared";

const INBOX_LIMIT = 6;

export default function DesktopHome() {
  const { t } = useTranslation();
  const copy = useDesktopCopy();
  const siteConfig = useSiteConfig();
  const { contactName, contactRole, aboutText, services, testimonials, availability, contactWizardEnabled, isLoading } =
    useHome(homeRepository);
  const { metrics } = useHomeMetrics(homeRepository);
  const { projects } = usePortfolio(portfolioRepository);
  const { openWizard } = useContactWizard();
  const portfolioEnabled = usePlugin("portfolio");
  const wizardPlugin = usePlugin("contact-wizard");
  const testimonialsEnabled = usePlugin("testimonials");
  const intakeEnabled = usePlugin("testimonials-intake");
  const [openMessage, setOpenMessage] = useState(0);
  const [testimonialWizardOpen, setTestimonialWizardOpen] = useState(false);

  if (isLoading) return null;

  const featuredCases = portfolioEnabled ? selectFeaturedCases(projects) : [];
  const wizardOn = wizardPlugin && contactWizardEnabled;
  const paragraphs = splitParagraphs(aboutText);
  const inbox = testimonialsEnabled ? testimonials.slice(0, INBOX_LIMIT) : [];
  const showInbox = testimonialsEnabled && (inbox.length > 0 || intakeEnabled);
  const message = inbox[Math.min(openMessage, inbox.length - 1)];

  return (
    <>
      <SEO
        title={siteConfig.seo_home_title || siteConfig.site_title}
        description={siteConfig.seo_home_description || undefined}
        url="/"
      />
      <WindowStack>
        {/* Leia-me.txt: quem sou, o que entrego e os próximos passos */}
        <Window title={copy.readme} titleAs="div" active width={680}>
          <div className="dk-pad dk-hero">
            {availability?.available && <Led label={availability.label || t("home.availability.label")} />}
            {contactName && (
              <p className="dk-hi">
                {copy.hello} <b>{contactName}</b>.
              </p>
            )}
            {contactRole && <p className="dk-role">&gt; {contactRole}</p>}
            <h1>{t("home.hero.headline")}</h1>
            <p className="dk-desc">
              {t("home.hero.description")}
              <span className="dk-caret" aria-hidden="true" />
            </p>
            {(featuredCases.length > 0 || wizardOn) && (
              <div className="dk-row">
                {featuredCases.length > 0 && (
                  <a href="#cases" className="dk-btn pri def" data-umami-event="home-hero-ver-cases">
                    {t("home.hero.ctaCases")}
                  </a>
                )}
                {wizardOn && (
                  <button
                    type="button"
                    className="dk-btn"
                    onClick={() => openWizard({ sourceContext: "home-hero" })}
                    data-umami-event="home-hero-fale-comigo"
                  >
                    {t("home.hero.ctaContact")}
                  </button>
                )}
              </div>
            )}
          </div>
        </Window>

        {/* Números.app: a prova logo abaixo do topo */}
        {metrics.length > 0 && (
          <Window title={copy.numbers} width={440} offset={360}>
            <MetricsGrid metrics={metrics} />
          </Window>
        )}

        {/* Cases em destaque: uma pasta no modo ícones */}
        {featuredCases.length > 0 && (
          <Window
            id="cases"
            title={t("home.cases.title").trim()}
            width={860}
            offset={40}
            status={
              <>
                <span>{copy.items(featuredCases.length)}</span>
                <Link href="/portfolio">{t("home.cases.viewAll")} →</Link>
              </>
            }
          >
            <ul className="dk-icongrid">
              {featuredCases.map((project, i) => {
                const metric = project.case_study?.metrics?.[0];
                return (
                  <li key={project.id}>
                    <Link
                      href={`/portfolio/${project.slug}`}
                      className="dk-file"
                      data-umami-event="home-case"
                      data-umami-event-case={project.slug}
                    >
                      <span
                        className="dk-thumb"
                        aria-hidden="true"
                        style={{ "--desktop-ic": ICON_COLORS[i % ICON_COLORS.length] } as React.CSSProperties}
                      >
                        {project.images?.[0] ? (
                          <img src={project.images[0]} alt="" loading="lazy" />
                        ) : (
                          project.title.charAt(0)
                        )}
                      </span>
                      <h3>{project.title}</h3>
                      {project.category && <p className="dk-muted">{project.category}</p>}
                      {metric && (
                        <span className="dk-tag">
                          <b>{metric.value}</b> {metric.label}
                        </span>
                      )}
                      <span className="dk-link">{copy.openCase}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Window>
        )}

        {/* Sobre.txt */}
        {paragraphs.length > 0 && (
          <Window title={copy.aboutFile} titleAs="div" width={580}>
            <div className="dk-pad dk-txt">
              <h2 className="dk-sr">{t("home.about.title").trim()}</h2>
              {paragraphs.map((p, i) => (
                <p key={i}>
                  <Highlighted text={p} />
                </p>
              ))}
            </div>
          </Window>
        )}

        {/* O que eu faço: lista do Finder */}
        {services.length > 0 && (
          <Window title={t("home.skills.title")} width={720} offset={240} status={<span>{copy.items(services.length)}</span>}>
            <div className="dk-lh" aria-hidden="true">
              <span>{copy.colName}</span>
              <span>{copy.colDescription}</span>
            </div>
            <ul className="dk-list">
              {services.map((service, i) => (
                <li key={service.id ?? service.title} className="dk-li">
                  <h3 className="dk-li-name">
                    <span
                      className="dk-sq"
                      aria-hidden="true"
                      style={{ "--desktop-ic": ICON_COLORS[i % ICON_COLORS.length] } as React.CSSProperties}
                    />
                    {service.title}
                  </h3>
                  <p className="dk-li-desc" style={{ margin: 0 }}>
                    {service.description}
                  </p>
                </li>
              ))}
            </ul>
          </Window>
        )}

        {/* Depoimentos: caixa de entrada com a mensagem aberta */}
        {showInbox && (
          <Window title={copy.inbox(testimonials.length)} width={820} offset={70}>
            {message ? (
              <div className="dk-mail">
                <ul className="dk-mail-list">
                  {inbox.map((item, i) => (
                    <li key={item.id ?? i}>
                      <button
                        type="button"
                        className="dk-mail-item"
                        aria-pressed={item === message}
                        aria-controls="dk-message"
                        onClick={() => setOpenMessage(i)}
                      >
                        <b>{item.name}</b>
                        <small>{shorten(item.text, 52)}</small>
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="dk-msg" id="dk-message" aria-live="polite">
                  <p className="dk-msg-from">
                    {copy.from}: {message.name}
                    {message.role ? ` · ${message.role}` : ""}
                  </p>
                  <blockquote>“{message.text}”</blockquote>
                  <InboxActions intake={intakeEnabled} onLeave={() => setTestimonialWizardOpen(true)} />
                </div>
              </div>
            ) : (
              <div className="dk-msg">
                <p className="dk-empty" style={{ padding: 0 }}>
                  {copy.inboxEmpty}
                </p>
                <InboxActions intake={intakeEnabled} onLeave={() => setTestimonialWizardOpen(true)} />
              </div>
            )}
          </Window>
        )}

        {/* Novo projeto?: a caixa de diálogo do fechamento */}
        {wizardOn && (
          <Window title={copy.newProject} width={560} offset={200}>
            <div className="dk-dlg">
              <i className="dk-bang" aria-hidden="true">
                !
              </i>
              <div>
                <h2 className="dk-dlg-title">{t("home.cta.title")}</h2>
                <p>{t("home.cta.subtitle")}</p>
                <div className="dk-row end">
                  <button
                    type="button"
                    className="dk-btn"
                    onClick={() => openWizard({ flowType: "job", sourceContext: "home-cta" })}
                    data-umami-event="home-cta-vaga"
                  >
                    {t("home.cta.job")}
                  </button>
                  <button
                    type="button"
                    className="dk-btn pri def"
                    onClick={() => openWizard({ flowType: "project", sourceContext: "home-cta" })}
                    data-umami-event="home-cta-projeto"
                  >
                    {t("home.cta.project")}
                  </button>
                </div>
              </div>
            </div>
          </Window>
        )}
      </WindowStack>
      <TestimonialWizard open={testimonialWizardOpen} onClose={() => setTestimonialWizardOpen(false)} />
    </>
  );
}

function InboxActions({ intake, onLeave }: { intake: boolean; onLeave: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="dk-row">
      <Link href="/depoimentos" className="dk-btn">
        {t("testimonials.viewAll").replace(/\s*→\s*$/, "")}
      </Link>
      {intake && (
        <button type="button" className="dk-btn" onClick={onLeave}>
          {t("testimonials.leaveTestimonial")}
        </button>
      )}
    </div>
  );
}
