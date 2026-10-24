import { useAbout } from "@/hooks/useAbout";
import { useHome } from "@/hooks/useHome";
import { useWorkPrinciples } from "@/hooks/useWorkPrinciples";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { splitParagraphs } from "@/utils/aboutContent";
import { aboutRepository, homeRepository } from "@/repositories/instances";
import { Ask, Bubble, ChatLog, ChatSection, DayChip, Highlighted, useChatText } from "@/components/ChatShared";

export default function ChatAbout() {
  const { t } = useTranslation();
  const text = useChatText();
  const { dailyRoutine, faq, isLoading: aboutLoading } = useAbout(aboutRepository);
  const { aboutText, services, isLoading: homeLoading } = useHome(homeRepository);
  const { principles } = useWorkPrinciples(homeRepository);

  if (aboutLoading || homeLoading) return null;

  const professional = splitParagraphs(aboutText ?? "");
  const personal = splitParagraphs(t("about.aboutMe.text") ?? "");
  const routine = dailyRoutine.filter((d) => d.image_url || d.description);
  const qa = faq.filter((f) => f.question && f.answer);

  return (
    <ChatLog>
      <h1 className="ct-sr">{t("about.title")}</h1>
      <DayChip />

      {/* Como eu trabalho abre a conversa: os princípios, numa resposta só */}
      {principles.length > 0 && (
        <ChatSection title={t("about.principles.title")} ask={text.qPrinciples}>
          <Bubble wide>
            <ol className="ct-list">
              {principles.map((p, i) => (
                <li key={`${i}-${p.title}`}>
                  <b className="ct-t">
                    {i + 1}. {p.title}
                  </b>
                  {p.description && <span>{p.description}</span>}
                </li>
              ))}
            </ol>
          </Bubble>
        </ChatSection>
      )}

      {/* Quem é: o resumo profissional, um balão por parágrafo */}
      {professional.length > 0 && (
        <ChatSection title={t("about.professional.title")} ask={text.qWho}>
          {professional.map((para, i) => (
            <Bubble key={i}>
              <p>
                <Highlighted text={para} />
              </p>
            </Bubble>
          ))}
        </ChatSection>
      )}

      {/* Fora do trabalho: depois da parte profissional */}
      {personal.length > 0 && (
        <ChatSection title={t("about.aboutMe.title")} ask={text.qPersonal}>
          {personal.map((para, i) => (
            <Bubble key={i}>
              <p>{para}</p>
            </Bubble>
          ))}
        </ChatSection>
      )}

      {/* Dia a dia: as fotos chegam como uma galeria na conversa */}
      {routine.length > 0 && (
        <ChatSection title={t("about.dailyRoutine.title")} ask={text.qRoutine}>
          <Bubble wide>
            <ul className="ct-gal">
              {routine.map((d) => (
                <li key={d.id}>
                  <figure>
                    {d.image_url && <img src={d.image_url} alt={d.description} loading="lazy" />}
                    {d.description && <figcaption>{d.description}</figcaption>}
                  </figure>
                </li>
              ))}
            </ul>
          </Bubble>
        </ChatSection>
      )}

      {/* Interesses: as áreas de trabalho (os serviços da home) */}
      {services.length > 0 && (
        <ChatSection title={t("home.skills.title")} ask={text.qInterests}>
          <Bubble>
            <div className="ct-chips">
              {services.map((s) => (
                <span key={s.id || s.title} className="ct-chip">
                  {s.title}
                </span>
              ))}
            </div>
          </Bubble>
        </ChatSection>
      )}

      {/* FAQ: cada pergunta é da visita, cada resposta é da pessoa */}
      {qa.length > 0 && (
        <ChatSection title={t("about.faq.title")}>
          {qa.map((f) => (
            <div key={f.id} className="ct-group">
              <Ask>{f.question}</Ask>
              <Bubble>
                <p>{f.answer}</p>
              </Bubble>
            </div>
          ))}
        </ChatSection>
      )}
    </ChatLog>
  );
}
