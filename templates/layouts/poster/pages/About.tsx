import { Plus } from "lucide-react";
import { SEO } from "@/components/SEO";
import { useAbout } from "@/hooks/useAbout";
import { useHome } from "@/hooks/useHome";
import { useWorkPrinciples } from "@/hooks/useWorkPrinciples";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { splitParagraphs } from "@/utils/aboutContent";
import { aboutRepository, homeRepository } from "@/repositories/instances";
import {
  BodyText,
  PageHead,
  Section,
  SectionLabel,
  Statement,
  fit,
  pad2,
  usePosterLabels,
} from "@/components/PosterShared";

const ABOUT_CSS = `
.poster-pr { margin: 0; padding: 0; list-style: none; }
.poster-pr li {
  display: grid; grid-template-columns: clamp(80px, 12vw, 180px) minmax(0, 1fr); gap: 12px clamp(20px, 3vw, 44px);
  align-items: start; padding-block: clamp(22px, 3vw, 36px); border-top: var(--poster-rule) solid var(--text);
}
.poster-pr li:last-child { border-bottom: var(--poster-rule) solid var(--text); }
.poster-pr-n { font-size: clamp(56px, 9vw, 150px); font-weight: 800; line-height: .82; letter-spacing: -.04em; }
.poster-pr p { margin: 14px 0 0; max-width: 60ch; font-size: clamp(16px, 1.4vw, 18px); line-height: 1.55; }
.poster-day { margin: 0; padding: 0; list-style: none; }
.poster-day li {
  display: grid; grid-template-columns: 56px minmax(0, 1fr) 96px; gap: 16px clamp(16px, 3vw, 36px); align-items: center;
  padding-block: 16px; border-top: 2px solid var(--text);
}
.poster-day li:last-child { border-bottom: 2px solid var(--text); }
.poster-day-n { font-family: var(--font-mono); font-size: 13px; letter-spacing: .1em; }
.poster-day-t { font-size: clamp(20px, 2.4vw, 32px); font-weight: 700; line-height: 1.15; letter-spacing: -.015em; overflow-wrap: anywhere; }
.poster-day img { width: 96px; height: 96px; object-fit: cover; display: block; border: 2px solid var(--text); }
.poster-faq details { border-top: var(--poster-rule) solid var(--text); }
.poster-faq details:last-child { border-bottom: var(--poster-rule) solid var(--text); }
.poster-faq summary {
  display: flex; justify-content: space-between; align-items: center; gap: 20px; padding-block: 22px; cursor: pointer; list-style: none;
  font-size: clamp(22px, 2.8vw, 40px); font-weight: 800; line-height: 1.08; letter-spacing: -.02em; overflow-wrap: anywhere;
}
.poster-faq summary::-webkit-details-marker { display: none; }
.poster-faq summary svg { flex-shrink: 0; transition: transform .2s ease; }
.poster-faq details[open] summary svg { transform: rotate(45deg); }
.poster-faq details p { margin: 0 0 26px; max-width: 64ch; font-size: clamp(16px, 1.4vw, 19px); line-height: 1.55; }
@media (max-width: 600px) {
  .poster-day li { grid-template-columns: 28px minmax(0, 1fr) 64px; gap: 12px; }
  .poster-day img { width: 64px; height: 64px; }
}
`;

export default function PosterAbout() {
  const { t } = useTranslation();
  const labels = usePosterLabels();
  const { dailyRoutine, faq, isLoading: aboutLoading } = useAbout(aboutRepository);
  const { aboutText, services, isLoading: homeLoading } = useHome(homeRepository);
  const { principles } = useWorkPrinciples(homeRepository);

  if (aboutLoading || homeLoading) return null;

  const professional = splitParagraphs(aboutText ?? "");
  const personal = splitParagraphs(t("about.aboutMe.text") ?? "");
  const interests = services.map((s) => s.title).filter(Boolean);

  return (
    <>
      <SEO title={t("about.title")} description={t("about.seoDescription")} url="/sobre" />
      <style>{ABOUT_CSS}</style>

      <PageHead kicker={t("about.subtitle")} title={t("about.title")} />

      {/* Como eu trabalho: princípios numerados em tamanho de cartaz, abrindo a página */}
      {principles.length > 0 && (
        <Section labelledBy="poster-principios">
          <SectionLabel id="poster-principios" title={t("about.principles.title")} />
          <ol className="poster-pr">
            {principles.map((p, i) => (
              <li key={`${p.title}-${i}`}>
                <span className="poster-pr-n poster-outline" aria-hidden="true">
                  {pad2(i + 1)}
                </span>
                <div className="poster-fit">
                  <h3 className="poster-giant poster-up" style={{ ...fit(p.title, 72), lineHeight: 0.98 }}>
                    {p.title}
                  </h3>
                  {p.description && <p>{p.description}</p>}
                </div>
              </li>
            ))}
          </ol>
        </Section>
      )}

      {/* Resumo profissional: declaração grande com marca-texto */}
      {professional.length > 0 && (
        <Section labelledBy="poster-profissional">
          <SectionLabel id="poster-profissional" title={t("about.professional.title")} />
          <Statement text={professional[0]} />
          {professional.slice(1).map((p, i) => (
            <BodyText key={i} text={p} />
          ))}
        </Section>
      )}

      {/* Fora do trabalho */}
      {personal.length > 0 && (
        <Section labelledBy="poster-pessoal">
          <SectionLabel id="poster-pessoal" title={t("about.aboutMe.title")} />
          <p className="poster-stmt poster-stmt--m">{personal[0]}</p>
          {personal.slice(1).map((p, i) => (
            <BodyText key={i} text={p} />
          ))}
        </Section>
      )}

      {/* Meu dia a dia */}
      {dailyRoutine.length > 0 && (
        <Section labelledBy="poster-dia">
          <SectionLabel id="poster-dia" title={t("about.dailyRoutine.title")} />
          <ol className="poster-day">
            {dailyRoutine.map((item, i) => (
              <li key={item.id}>
                <span className="poster-day-n" aria-hidden="true">
                  {pad2(i + 1)}
                </span>
                <span className="poster-day-t">{item.description}</span>
                {item.image_url ? <img src={item.image_url} alt="" loading="lazy" /> : <span aria-hidden="true" />}
              </li>
            ))}
          </ol>
        </Section>
      )}

      {/* Interesses */}
      {interests.length > 0 && (
        <Section labelledBy="poster-interesses">
          <SectionLabel id="poster-interesses" title={labels.interesses} />
          <ul className="poster-words">
            {interests.map((name, i) => (
              <li key={`${name}-${i}`}>
                {name}
                {i < interests.length - 1 && (
                  <span className="poster-sep" aria-hidden="true">
                    {" "}
                    ✶
                  </span>
                )}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* FAQ */}
      {faq.length > 0 && (
        <Section labelledBy="poster-faq">
          <SectionLabel id="poster-faq" title={t("about.faq.title")} />
          <div className="poster-faq">
            {faq.map((f) => (
              <details key={f.id}>
                <summary>
                  {f.question}
                  <Plus size={30} strokeWidth={3} aria-hidden="true" />
                </summary>
                <p>{f.answer}</p>
              </details>
            ))}
          </div>
        </Section>
      )}
    </>
  );
}
