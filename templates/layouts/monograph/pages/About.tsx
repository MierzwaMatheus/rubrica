/**
 * Monografia — Sobre. Um prefácio em capítulo: os princípios abrem a página como teses
 * numeradas (§ 1, § 2…), depois o resumo profissional com capitular e notas na margem, o
 * texto pessoal, o dia a dia como pranchas, os interesses e o FAQ como perguntas e respostas.
 */
import { SEO } from "@/components/SEO";
import { useAbout } from "@/hooks/useAbout";
import { useHome } from "@/hooks/useHome";
import { useWorkPrinciples } from "@/hooks/useWorkPrinciples";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { splitParagraphs } from "@/utils/aboutContent";
import { aboutRepository, homeRepository } from "@/repositories/instances";
import {
  MnChapter,
  MnMain,
  MnPreface,
  MnSection,
  joinAsSentence,
  toRoman,
  useMonographText,
  usePrefaceNotes,
} from "@/components/MonographShared";

export default function MonographAbout() {
  const { t } = useTranslation();
  const tx = useMonographText();
  const { dailyRoutine, faq, isLoading: aboutLoading } = useAbout(aboutRepository);
  const { aboutText, services, isLoading: homeLoading } = useHome(homeRepository);
  const { principles } = useWorkPrinciples(homeRepository);
  const notes = usePrefaceNotes();

  if (aboutLoading || homeLoading) return null;

  const professional = splitParagraphs(aboutText ?? "");
  const personal = splitParagraphs(t("about.aboutMe.text") ?? "");
  const interests = services.map((s) => s.title).filter(Boolean);

  return (
    <>
      <SEO title={t("about.title")} description={t("about.seoDescription")} url="/sobre" />

      <MnChapter number={4} title={tx.preface} dek={t("about.subtitle")} />

      {principles.length > 0 && (
        <MnSection id="teses" label={tx.theses} sub={t("about.principles.title")}>
          <MnMain>
            <ol className="mn-plain mn-theses">
              {principles.map((p, i) => (
                <li key={`${p.title}-${i}`} className="mn-sv">
                  <span className="mn-sv-n">§ {i + 1}</span>
                  <b>{p.title}.</b> {p.description}
                </li>
              ))}
            </ol>
          </MnMain>
        </MnSection>
      )}

      <MnPreface
        id="resumo"
        label={t("about.professional.title")}
        paragraphs={professional}
        notes={notes}
      />

      {personal.length > 0 && (
        <MnSection id="fora-do-trabalho" label={t("about.aboutMe.title")}>
          <MnMain>
            {personal.map((para, i) => (
              <p key={i} className="mn-p">
                {para}
              </p>
            ))}
          </MnMain>
        </MnSection>
      )}

      {dailyRoutine.length > 0 && (
        <MnSection id="dia-a-dia" label={tx.plates} sub={t("about.dailyRoutine.title")}>
          <MnMain>
            <div className="mn-plates">
              {dailyRoutine.map((item, i) => (
                <figure key={item.id} className="mn-fig">
                  {item.image_url ? <img src={item.image_url} alt="" loading="lazy" /> : null}
                  <figcaption>
                    <b>
                      {tx.plate} {toRoman(i + 1)}
                    </b>
                    {item.description}
                    {item.tags?.length ? <span className="mn-fig-tags"> — {item.tags.join(", ")}</span> : null}
                  </figcaption>
                </figure>
              ))}
            </div>
          </MnMain>
        </MnSection>
      )}

      {interests.length > 0 && (
        <MnSection id="interesses" label={tx.interests}>
          <MnMain>
            <p className="mn-sv">{joinAsSentence(interests, tx.and)}.</p>
          </MnMain>
        </MnSection>
      )}

      {faq.length > 0 && (
        <MnSection id="perguntas" label={tx.qa} sub={t("about.faq.title")}>
          <MnMain>
            <dl className="mn-qa">
              {faq.map((f) => (
                <div key={f.id}>
                  <dt>
                    <span className="mn-qa-m" aria-hidden="true">
                      {tx.question}
                    </span>
                    <span>{f.question}</span>
                  </dt>
                  <dd>
                    <span className="mn-qa-m" aria-hidden="true">
                      {tx.answer}
                    </span>
                    <span>{f.answer}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </MnMain>
        </MnSection>
      )}
    </>
  );
}
