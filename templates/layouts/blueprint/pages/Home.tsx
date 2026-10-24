import { useState } from "react";
import { Link } from "wouter";
import { ArrowRight, MessageSquare, Square, Star } from "lucide-react";
import { useHome } from "@/hooks/useHome";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useHomeMetrics } from "@/hooks/useHomeMetrics";
import { useContactWizard } from "@/contexts/ContactWizardContext";
import { usePlugin } from "@/contexts/PluginsContext";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { TestimonialWizard } from "@/components/TestimonialWizard";
import { homeRepository, portfolioRepository } from "@/repositories/instances";
import { highlightNumbers, selectFeaturedCases } from "@/utils/homeContent";
import { splitParagraphs } from "@/utils/aboutContent";
import {
  Dim,
  Hatch,
  Num,
  PageTitleBlock,
  Sheet,
  TitleBlock,
  drawnBy,
  pad2,
  stampDate,
  useBlueprintLabels,
  useOwnerName,
  wordCount,
} from "@/components/BlueprintShared";

type SheetKey = "hero" | "specs" | "cases" | "memo" | "details" | "opinions" | "order";

export default function BlueprintHome() {
  const { t } = useTranslation();
  const L = useBlueprintLabels();
  const { contactRole, aboutText, services, testimonials, availability, contactWizardEnabled } = useHome(homeRepository);
  const { projects } = usePortfolio(portfolioRepository);
  const { metrics } = useHomeMetrics(homeRepository);
  const { openWizard } = useContactWizard();
  const portfolioEnabled = usePlugin("portfolio");
  const testimonialsEnabled = usePlugin("testimonials");
  const intakeEnabled = usePlugin("testimonials-intake");
  const [wizardOpen, setWizardOpen] = useState(false);
  const name = useOwnerName();

  const featuredCases = portfolioEnabled ? selectFeaturedCases(projects) : [];
  const paragraphs = splitParagraphs(aboutText ?? "");
  const shownServices = services.slice(0, 4);
  const shownTestimonials = testimonialsEnabled ? testimonials.slice(0, 3) : testimonials;
  const showOpinions = shownTestimonials.length > 0 || (testimonialsEnabled && intakeEnabled);

  // As folhas são numeradas na ordem em que aparecem: se uma some, as seguintes sobem.
  const visible: SheetKey[] = [
    "hero",
    ...(metrics.length > 0 ? (["specs"] as const) : []),
    ...(featuredCases.length > 0 ? (["cases"] as const) : []),
    ...(paragraphs.length > 0 ? (["memo"] as const) : []),
    ...(shownServices.length > 0 ? (["details"] as const) : []),
    ...(showOpinions ? (["opinions"] as const) : []),
    ...(contactWizardEnabled ? (["order"] as const) : []),
  ];
  const total = visible.length;
  const num = (key: SheetKey) => visible.indexOf(key);
  const stamped = availability?.available;

  return (
    <div className="bp-page">
      {/* Folha 00 — apresentação */}
      <Sheet n={num("hero")} total={total} title={L.presentation} id="apresentacao">
        <div className={`bp-hero${stamped ? "" : " bp-hero--solo"}`}>
          <div>
            <p className="bp-small" style={{ margin: 0 }}>
              {L.hello}
            </p>
            <div className="bp-hero-name">
              {name && <Dim label={L.characters(Array.from(name).length)} />}
              <h1 className="bp-h1">{name}</h1>
            </div>
            {contactRole && <p className="bp-role">{contactRole}</p>}
            <p className="bp-lead">{t("home.hero.headline")}</p>
            <p className="bp-p">{t("home.hero.description")}</p>
            <div className="bp-row">
              {featuredCases.length > 0 && (
                <a href="#cases" className="bp-btn bp-btn--pri" data-umami-event="home-hero-ver-cases">
                  {t("home.hero.ctaCases")} <ArrowRight size={14} aria-hidden="true" />
                </a>
              )}
              {contactWizardEnabled && (
                <button
                  type="button"
                  className="bp-btn"
                  onClick={() => openWizard({ sourceContext: "home-hero" })}
                  data-umami-event="home-hero-fale-comigo"
                >
                  <MessageSquare size={14} aria-hidden="true" /> {t("home.hero.ctaContact")}
                </button>
              )}
            </div>
          </div>
          {stamped && (
            <p className="bp-stamp">
              <span className="bp-stamp-dot" aria-hidden="true" />
              {availability?.label || t("home.availability.label")}
              <small>
                {L.rev} {stampDate()}
              </small>
            </p>
          )}
        </div>
      </Sheet>

      {/* Folha 01 — especificações (números de destaque) */}
      {metrics.length > 0 && (
        <Sheet n={num("specs")} total={total} title={L.specs}>
          <dl className="bp-spec">
            {metrics.map((m, i) => (
              <div key={`${m.label}-${i}`}>
                <dt>
                  <span className="bp-spec-code" aria-hidden="true">
                    E{i + 1}
                  </span>
                  <span className="bp-spec-l">{m.label}</span>
                </dt>
                <dd className="bp-spec-v">{m.value}</dd>
              </div>
            ))}
          </dl>
        </Sheet>
      )}

      {/* Folha 02 — cases em destaque como pranchas */}
      {featuredCases.length > 0 && (
        <Sheet n={num("cases")} total={total} title={t("home.cases.title").trim()} id="cases">
          <Dim label={L.plates(featuredCases.length)} />
          <div className="bp-cases">
            {featuredCases.map((p, i) => {
              const metric = p.case_study?.metrics?.[0];
              return (
                <article key={p.id} className="bp-card">
                  <Hatch src={p.images?.[0]} alt={p.title} />
                  <div className="bp-card-txt">
                    <span className="bp-card-cap">
                      <Num>{i + 1}</Num>
                      {L.plate} {pad2(i + 1)}
                      {p.category ? ` · ${p.category}` : ""}
                    </span>
                    <h3 className="bp-h3">{p.title}</h3>
                    {p.description && <p>{p.description}</p>}
                    {metric && (
                      <span className="bp-metric">
                        <span aria-hidden="true">▲</span>
                        <b>{metric.value}</b> {metric.label}
                      </span>
                    )}
                    <Link
                      href={`/portfolio/${p.slug}`}
                      className="bp-btn bp-stretch"
                      data-umami-event="home-case"
                      data-umami-event-case={p.slug}
                    >
                      {L.viewPlate} <ArrowRight size={13} aria-hidden="true" />
                      <span className="bp-sr">: {p.title}</span>
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
          <div className="bp-all">
            <Link href="/portfolio" className="bp-link">
              {t("home.cases.viewAll")} →
            </Link>
          </div>
        </Sheet>
      )}

      {/* Folha 03 — sobre como memorial descritivo */}
      {paragraphs.length > 0 && (
        <Sheet n={num("memo")} total={total} title={L.memorial} caption={t("home.about.title").trim()}>
          <Dim label={L.paragraphs(paragraphs.length, wordCount(paragraphs.join(" ")))} />
          <div className="bp-memo">
            {paragraphs.map((para, i) => (
              <p key={i}>
                <small aria-hidden="true">
                  {num("memo")}.{i + 1}
                </small>
                {highlightNumbers(para).map((seg, j) => (seg.highlight ? <strong key={j}>{seg.text}</strong> : <span key={j}>{seg.text}</span>))}
              </p>
            ))}
          </div>
        </Sheet>
      )}

      {/* Folha 04 — serviços como detalhes D1–D4 */}
      {shownServices.length > 0 && (
        <Sheet n={num("details")} total={total} title={L.details} caption={t("home.skills.title")}>
          <Dim label={L.detailsCount(shownServices.length)} />
          <ul className="bp-det">
            {shownServices.map((s, i) => (
              <li key={s.id ?? s.title}>
                <Num size="lg">D{i + 1}</Num>
                <h3>{s.title}</h3>
                <p>{s.description}</p>
              </li>
            ))}
          </ul>
        </Sheet>
      )}

      {/* Folha 05 — depoimentos como pareceres */}
      {showOpinions && (
        <Sheet n={num("opinions")} total={total} title={L.opinions} caption={t("home.testimonials.title")}>
          {shownTestimonials.length > 0 && (
            <>
              <Dim label={L.opinionsCount(shownTestimonials.length)} />
              <div className="bp-par">
                {shownTestimonials.map((tm, i) => (
                  <figure key={tm.id ?? i}>
                    <blockquote>
                      <p>“{tm.text}”</p>
                    </blockquote>
                    <span className="bp-sig" aria-hidden="true" />
                    <figcaption>
                      <b>{tm.name}</b>
                      {tm.role && <small>{tm.role}</small>}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </>
          )}
          {testimonialsEnabled && (
            <div className="bp-all">
              <Link href="/depoimentos" className="bp-link">
                {t("testimonials.viewAll")}
              </Link>
              {intakeEnabled && (
                <button type="button" className="bp-btn" onClick={() => setWizardOpen(true)}>
                  <Star size={13} aria-hidden="true" /> {t("testimonials.leaveTestimonial")}
                </button>
              )}
            </div>
          )}
          {intakeEnabled && <TestimonialWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />}
        </Sheet>
      )}

      {/* Folha 06 — contato como ordem de serviço, com o carimbo */}
      {contactWizardEnabled ? (
        <Sheet n={num("order")} total={total} title={L.serviceOrder}>
          <div className="bp-os">
            <div>
              <h3>{t("home.cta.title")}</h3>
              <p className="bp-p">{t("home.cta.subtitle")}</p>
              <div className="bp-row">
                <button
                  type="button"
                  className="bp-btn bp-btn--pri"
                  onClick={() => openWizard({ flowType: "project", sourceContext: "home-cta" })}
                  data-umami-event="home-cta-projeto"
                >
                  <Square size={14} aria-hidden="true" /> {t("home.cta.project")}
                </button>
                <button
                  type="button"
                  className="bp-btn"
                  onClick={() => openWizard({ flowType: "job", sourceContext: "home-cta" })}
                  data-umami-event="home-cta-vaga"
                >
                  <Square size={14} aria-hidden="true" /> {t("home.cta.job")}
                </button>
              </div>
            </div>
            <TitleBlock
              rows={[
                [
                  { label: L.client, value: L.toBeDefined, span: 2 },
                  { label: L.sheetCount, value: `${pad2(total - 1)}/${pad2(total - 1)}` },
                ],
                [
                  { label: L.scale, value: "1:1" },
                  { label: L.date, value: stampDate() },
                  { label: L.drawing, value: drawnBy(name) || "—" },
                ],
              ]}
            />
          </div>
        </Sheet>
      ) : (
        <PageTitleBlock page={L.portfolioTitle} sheets={total - 1} />
      )}
    </div>
  );
}
