import { useAbout } from "@/hooks/useAbout";
import { useHome } from "@/hooks/useHome";
import { useWorkPrinciples } from "@/hooks/useWorkPrinciples";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { splitParagraphs } from "@/utils/aboutContent";
import { aboutRepository, homeRepository } from "@/repositories/instances";
import { SEO } from "@/components/SEO";
import { Backlinks, Crumb, LinkedText, SectionHead, useGardenTerms, useGardenTexts } from "@/components/GardenShared";

export default function GardenAbout() {
  const { t } = useTranslation();
  const tx = useGardenTexts();
  const { dailyRoutine, faq, isLoading: aboutLoading } = useAbout(aboutRepository);
  const { aboutText, services, isLoading: homeLoading } = useHome(homeRepository);
  const { principles } = useWorkPrinciples(homeRepository);
  const terms = useGardenTerms();

  if (aboutLoading || homeLoading) return <div aria-busy="true" style={{ minHeight: "60vh" }} />;

  const professional = splitParagraphs(aboutText ?? "");
  const personal = splitParagraphs(t("about.aboutMe.text") ?? "");
  const interests = services.map((s) => s.title).filter(Boolean);

  return (
    <>
      <SEO title={t("about.title")} description={t("about.seoDescription")} url="/sobre" />

      <section className="gd-hero" aria-labelledby="gd-about">
        <Crumb page={t("navigation.about").toLowerCase()} />
        <h1 id="gd-about" className="gd-h1">
          {t("about.title")}
        </h1>
        <p className="gd-lead">{t("about.subtitle")}</p>
      </section>

      {/* Como eu trabalho: abre a página */}
      {principles.length > 0 && (
        <section className="gd-sec" aria-labelledby="gd-rules">
          <span className="gd-eyebrow">{t("about.principles.title")}</span>
          <SectionHead id="gd-rules" title={tx.rules} />
          <ol className="gd-rules">
            {principles.map((p) => (
              <li key={p.title}>
                <h3>{p.title}</h3>
                {p.description && <p>{p.description}</p>}
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* A nota "Sobre": resumo profissional com termos ligados */}
      {professional.length > 0 && (
        <section className="gd-sec gd-note" aria-labelledby="gd-pro">
          <SectionHead id="gd-pro" title={t("about.professional.title")} />
          {professional.map((para, i) => (
            <p key={i}>
              <LinkedText text={para} terms={terms} />
            </p>
          ))}
        </section>
      )}

      {personal.length > 0 && (
        <section className="gd-sec gd-note" aria-labelledby="gd-personal">
          <SectionHead id="gd-personal" title={t("about.aboutMe.title")} />
          {personal.map((para, i) => (
            <p key={i}>
              <LinkedText text={para} terms={terms} />
            </p>
          ))}
        </section>
      )}

      {dailyRoutine.length > 0 && (
        <section className="gd-sec" aria-labelledby="gd-daily">
          <SectionHead id="gd-daily" title={t("about.dailyRoutine.title")} />
          <ul className="gd-photos">
            {dailyRoutine.map((item) => (
              <li key={item.id}>
                <figure>
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.description || ""} loading="lazy" />
                  ) : (
                    <span className="gd-photo-ph" aria-hidden="true" />
                  )}
                  {item.description && <figcaption>{item.description}</figcaption>}
                </figure>
              </li>
            ))}
          </ul>
        </section>
      )}

      {interests.length > 0 && (
        <section className="gd-sec" aria-labelledby="gd-interests">
          <SectionHead id="gd-interests" title={tx.interests} />
          <ul className="gd-tags">
            {interests.map((name) => (
              <li key={name} className="gd-tag">
                {name}
              </li>
            ))}
          </ul>
        </section>
      )}

      {faq.length > 0 && (
        <section className="gd-sec gd-faq" aria-labelledby="gd-faq">
          <SectionHead id="gd-faq" title={t("about.faq.title")} />
          <div>
            {faq.map((f) => (
              <details key={f.id}>
                <summary>{f.question}</summary>
                <p>{f.answer}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      <Backlinks exclude="/sobre" />
    </>
  );
}
