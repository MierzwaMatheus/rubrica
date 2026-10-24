import { SEO } from "@/components/SEO";
import { useAbout } from "@/hooks/useAbout";
import { useHome } from "@/hooks/useHome";
import { useWorkPrinciples } from "@/hooks/useWorkPrinciples";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { splitParagraphs } from "@/utils/aboutContent";
import { aboutRepository, homeRepository } from "@/repositories/instances";
import {
  Highlighted,
  Window,
  WindowCluster,
  WindowStack,
  useDesktopCopy,
} from "@/components/DesktopShared";

export default function DesktopAbout() {
  const { t } = useTranslation();
  const copy = useDesktopCopy();
  const { dailyRoutine, faq, isLoading } = useAbout(aboutRepository);
  const { aboutText, services, contactName, isLoading: homeLoading } = useHome(homeRepository);
  const { principles } = useWorkPrinciples(homeRepository);

  if (isLoading || homeLoading) return null;

  const professional = splitParagraphs(aboutText);
  const personal = splitParagraphs(t("about.aboutMe.text"));
  const interests = services.map((s) => s.title).filter(Boolean);
  const hasPrinciples = principles.length > 0;

  return (
    <>
      <SEO title={t("about.title")} description={t("about.seoDescription")} url="/sobre" />
      <WindowStack>
        {/* Como eu trabalho abre a página: painéis de Preferências do Sistema */}
        {hasPrinciples && (
          <Window title={copy.preferences} titleAs="div" active width={880}>
            <div className="dk-pad dk-hero">
              {contactName && <p className="dk-role">&gt; whoami → {contactName}</p>}
              <h1>{t("about.title")}</h1>
              <h2 className="dk-sr">{t("about.principles.title")}</h2>
            </div>
            <ul className="dk-panels">
              {principles.map((principle, i) => (
                <li key={`${principle.title}-${i}`} className="dk-panel">
                  <span className={`dk-panel-ic${i % 2 ? " alt" : ""}`} aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3>{principle.title}</h3>
                    {principle.description && <p>{principle.description}</p>}
                  </div>
                </li>
              ))}
            </ul>
          </Window>
        )}

        {/* Sobre.txt: resumo profissional (abre a página quando não há princípios) */}
        <Window title={copy.aboutFile} titleAs="div" active={!hasPrinciples} width={700} offset={hasPrinciples ? 120 : undefined}>
          <div className="dk-pad dk-hero">
            {!hasPrinciples && contactName && <p className="dk-role">&gt; whoami → {contactName}</p>}
            {!hasPrinciples && <h1>{t("about.title")}</h1>}
            {professional.length > 0 ? (
              <div className="dk-txt">
                <h2 className={hasPrinciples ? undefined : "dk-sr"}>{t("about.professional.title")}</h2>
                {professional.map((p, i) => (
                  <p key={i}>
                    <Highlighted text={p} />
                  </p>
                ))}
              </div>
            ) : (
              <p className="dk-desc">{t("about.subtitle")}</p>
            )}
          </div>
        </Window>

        {/* Fora do trabalho + interesses, lado a lado */}
        <WindowCluster>
          {personal.length > 0 && (
            <Window title={copy.personalFile} titleAs="div" width={560}>
              <div className="dk-pad dk-txt">
                <h2 className="dk-sr">{t("about.aboutMe.title")}</h2>
                {personal.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </Window>
          )}
          {interests.length > 0 && (
            <Window title={copy.interests} width={340} drop={40}>
              <ul className="dk-chips" style={{ padding: 16 }}>
                {interests.map((name) => (
                  <li key={name} className="dk-chip">
                    {name}
                  </li>
                ))}
              </ul>
            </Window>
          )}
        </WindowCluster>

        {/* Meu dia a dia: uma pasta de fotos, com a legenda sempre visível */}
        {dailyRoutine.length > 0 && (
          <Window title={copy.photos} titleAs="div" width={900} offset={40} status={<span>{copy.items(dailyRoutine.length)}</span>}>
            <h2 className="dk-sr">{t("about.dailyRoutine.title")}</h2>
            <ul className="dk-photos">
              {dailyRoutine.map((item) => (
                <li key={item.id}>
                  <figure>
                    {item.image_url && <img src={item.image_url} alt={item.description || ""} loading="lazy" />}
                    <figcaption>
                      {item.description}
                      {item.tags?.length > 0 && (
                        <span className="dk-chips" style={{ marginTop: 6 }}>
                          {item.tags.map((tag) => (
                            <span key={tag} className="dk-chip dk-mono" style={{ fontSize: 11.5 }}>
                              {tag}
                            </span>
                          ))}
                        </span>
                      )}
                    </figcaption>
                  </figure>
                </li>
              ))}
            </ul>
          </Window>
        )}

        {/* FAQ: a janela de Ajuda */}
        {faq.length > 0 && (
          <Window title={copy.help} titleAs="div" width={760} offset={200}>
            <h2 className="dk-sr">{t("about.faq.title")}</h2>
            <div className="dk-help">
              {faq.map((item) => (
                <details key={item.id}>
                  <summary>
                    <span className="dk-help-q" aria-hidden="true">
                      ?
                    </span>
                    <span>{item.question}</span>
                  </summary>
                  <p className="dk-help-a">{item.answer}</p>
                </details>
              ))}
            </div>
          </Window>
        )}
      </WindowStack>
    </>
  );
}
