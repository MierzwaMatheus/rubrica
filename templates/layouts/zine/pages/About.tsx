import { useAbout } from "@/hooks/useAbout";
import { useHome } from "@/hooks/useHome";
import { useSidebar } from "@/hooks/useSidebar";
import { useWorkPrinciples } from "@/hooks/useWorkPrinciples";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { splitParagraphs } from "@/utils/aboutContent";
import { aboutRepository, homeRepository, sidebarRepository } from "@/repositories/instances";
import {
  HandTitle,
  Highlighted,
  Letter,
  Polaroid,
  PostIt,
  Sticker,
  firstName,
  tilt,
  tiltAt,
  useZineCopy,
  type PaperTone,
} from "@/components/ZineShared";

const PRINCIPLE_TONES: PaperTone[] = ["primary", "ink", "tape", "paper"];

export default function ZineAbout() {
  const { t } = useTranslation();
  const copy = useZineCopy();
  const { dailyRoutine, faq, isLoading: aboutLoading } = useAbout(aboutRepository);
  const { aboutText, services, isLoading: homeLoading } = useHome(homeRepository);
  const { principles } = useWorkPrinciples(homeRepository);
  const { contactInfo } = useSidebar(sidebarRepository);

  if (aboutLoading || homeLoading) return null;

  const professional = splitParagraphs(aboutText ?? "");
  const personal = splitParagraphs(t("about.aboutMe.text") ?? "");
  const first = firstName(contactInfo?.name);

  // Interesses: as etiquetas do dia a dia; sem elas, os temas de trabalho (serviços).
  const routineTags = Array.from(new Set(dailyRoutine.flatMap((d) => d.tags ?? []).map((tag) => tag.trim()).filter(Boolean)));
  const interests = routineTags.length > 0 ? routineTags : services.map((s) => s.title).filter(Boolean);

  return (
    <div className="zn-wrap">
      <header className="zn-pagehead">
        <div>
          <p className="zn-kicker">{copy.aboutKicker}</p>
          <HandTitle as="h1">{t("about.title")}</HandTitle>
        </div>
      </header>

      {/* Como eu trabalho: princípios como adesivos numerados, abrindo a página */}
      {principles.length > 0 && (
        <section className="zn-sec" aria-labelledby="zn-principles">
          <HandTitle id="zn-principles">{t("about.principles.title")}</HandTitle>
          <ol className="zn-principles">
            {principles.map((p, i) => (
              <li key={`${p.title}-${i}`} className="zn-principle">
                <Sticker as="span" hidden tone={PRINCIPLE_TONES[i % PRINCIPLE_TONES.length]} deg={tiltAt(i, 4)}>
                  <b>{String(i + 1).padStart(2, "0")}</b>
                </Sticker>
                <div style={{ minWidth: 0 }}>
                  <h3>{p.title}</h3>
                  {p.description && <p>{p.description}</p>}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Resumo profissional: carta datilografada */}
      {professional.length > 0 && (
        <section className="zn-sec" aria-labelledby="zn-professional">
          <HandTitle id="zn-professional">{t("about.professional.title")}</HandTitle>
          <Letter>
            <p>{copy.dear}</p>
            {professional.map((para, i) => (
              <p key={i}>
                <Highlighted text={para} />
              </p>
            ))}
            {first && <p className="zn-sign">— {first}</p>}
          </Letter>
        </section>
      )}

      {/* Fora do trabalho + interesses */}
      {(personal.length > 0 || interests.length > 0) && (
        <section className="zn-sec" aria-labelledby="zn-personal">
          <HandTitle id="zn-personal">{t("about.aboutMe.title")}</HandTitle>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "36px 48px", alignItems: "flex-start" }}>
            {personal.length > 0 && (
              <PostIt tone="tape" deg={-1.5} className="zn-personal">
                {personal.map((para, i) => (
                  <p key={i} style={{ fontSize: 15.5, lineHeight: 1.6 }}>
                    {para}
                  </p>
                ))}
              </PostIt>
            )}
            {interests.length > 0 && (
              <div style={{ flex: "1 1 260px", minWidth: 0 }}>
                <h3 className="zn-kicker" style={{ marginBottom: 14 }}>
                  {copy.interests}
                </h3>
                <ul className="zn-chips">
                  {interests.map((it, i) => (
                    <li key={it} className="zn-chip zn-tilt" style={tilt(tiltAt(i, 0.8))}>
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Dia a dia: polaroides */}
      {dailyRoutine.length > 0 && (
        <section className="zn-sec" aria-labelledby="zn-routine">
          <HandTitle id="zn-routine">{t("about.dailyRoutine.title")}</HandTitle>
          <ul className="zn-polgrid zn-routine">
            {dailyRoutine.map((d, i) => (
              <Polaroid key={d.id} as="li" image={d.image_url} alt={d.description} deg={tiltAt(i, 1.5)} tape={i % 2 ? "right" : "center"}>
                {d.description && <p>{d.description}</p>}
              </Polaroid>
            ))}
          </ul>
        </section>
      )}

      {/* FAQ: bilhetes dobrados */}
      {faq.length > 0 && (
        <section className="zn-sec" aria-labelledby="zn-faq">
          <HandTitle id="zn-faq">{t("about.faq.title")}</HandTitle>
          <ul className="zn-folds">
            {faq.map((f, i) => (
              <li key={f.id} className="zn-tilt" style={tilt(tiltAt(i, 0.5))}>
                <details className="zn-fold">
                  <summary>{f.question}</summary>
                  <p>{f.answer}</p>
                </details>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
