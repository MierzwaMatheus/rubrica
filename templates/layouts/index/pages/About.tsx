import { SEO } from "@/components/SEO";
import { useAbout } from "@/hooks/useAbout";
import { useHome } from "@/hooks/useHome";
import { useWorkPrinciples } from "@/hooks/useWorkPrinciples";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { splitParagraphs } from "@/utils/aboutContent";
import { aboutRepository, homeRepository } from "@/repositories/instances";
import { Highlighted, IndexSection, useIndexCopy } from "@/components/IndexShared";

const pad2 = (n: number) => String(n).padStart(2, "0");

export default function IndexAbout() {
  const { t } = useTranslation();
  const copy = useIndexCopy();
  const { dailyRoutine, faq, isLoading: aboutLoading } = useAbout(aboutRepository);
  const { aboutText, services, isLoading: homeLoading } = useHome(homeRepository);
  const { principles } = useWorkPrinciples(homeRepository);

  if (aboutLoading || homeLoading) return null;

  const professional = splitParagraphs(aboutText ?? "");
  const personal = splitParagraphs(t("about.aboutMe.text") ?? "");
  // Interesses: as tags do dia a dia; sem tags, os serviços da Home.
  const routineTags = Array.from(new Set(dailyRoutine.flatMap((d) => d.tags ?? []).map((tag) => tag.trim()).filter(Boolean)));
  const interests = routineTags.length > 0 ? routineTags : services.map((s) => s.title).filter(Boolean);

  return (
    <>
      <SEO title={t("about.title")} description={t("about.seoDescription")} url="/sobre" />

      <IndexSection labelAs="div" label={<span className="ix-code">{copy.sheet} 004 — {t("about.title")}</span>}>
        <h1 className="ix-title">{t("about.title")}</h1>
        <p className="ix-desc">{t("about.subtitle")}</p>
      </IndexSection>

      {/* Como eu trabalho abre a página, como lista de princípios */}
      {principles.length > 0 && (
        <IndexSection label={t("about.principles.title")}>
          <ol className="ix-pr">
            {principles.map((p, i) => (
              <li key={`${p.title}-${i}`}>
                <span className="ix-num ix-muted" style={{ fontFamily: "var(--font-mono)", fontSize: 12, paddingTop: 3 }}>
                  {pad2(i + 1)}
                </span>
                <h3>{p.title}</h3>
                {p.description && <p>{p.description}</p>}
              </li>
            ))}
          </ol>
        </IndexSection>
      )}

      {professional.length > 0 && (
        <IndexSection label={t("about.professional.title")}>
          <div className="ix-cols">
            {professional.map((p, i) => (
              <p key={i}>
                <Highlighted text={p} />
              </p>
            ))}
          </div>
        </IndexSection>
      )}

      {personal.length > 0 && (
        <IndexSection label={t("about.aboutMe.title")}>
          <div className="ix-cols">
            {personal.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </IndexSection>
      )}

      {dailyRoutine.length > 0 && (
        <IndexSection label={t("about.dailyRoutine.title")}>
          <ul className="ix-figs">
            {dailyRoutine.map((item, i) => (
              <li key={item.id}>
                <figure>
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.description} loading="lazy" />
                  ) : (
                    <div className="ix-fig-ph" aria-hidden="true" />
                  )}
                  <figcaption>
                    <span className="ix-muted" style={{ fontFamily: "var(--font-mono)", fontSize: 11.5 }}>
                      {copy.figure} {pad2(i + 1)} —{" "}
                    </span>
                    {item.description}
                    {item.tags?.length > 0 && <small>{item.tags.join(", ")}</small>}
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
        </IndexSection>
      )}

      {interests.length > 0 && (
        <IndexSection label={copy.interests}>
          <ul className="ix-inline" style={{ fontSize: 15 }}>
            {interests.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
        </IndexSection>
      )}

      {faq.length > 0 && (
        <IndexSection label={t("about.faq.title")}>
          <dl style={{ margin: 0 }}>
            {faq.map((f) => (
              <div key={f.id} className="ix-sv">
                <dt>{f.question}</dt>
                <dd>{f.answer}</dd>
              </div>
            ))}
          </dl>
        </IndexSection>
      )}
    </>
  );
}
