import { useAbout } from "@/hooks/useAbout";
import { useHome } from "@/hooks/useHome";
import { useWorkPrinciples } from "@/hooks/useWorkPrinciples";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { aboutRepository, homeRepository } from "@/repositories/instances";
import { splitParagraphs } from "@/utils/aboutContent";
import { highlightNumbers } from "@/utils/homeContent";
import { Dim, Hatch, Num, PageTitleBlock, Sheet, pad2, useBlueprintLabels, wordCount } from "@/components/BlueprintShared";

/** Parágrafo com os números de resultado em destaque. */
function Highlighted({ text }: { text: string }) {
  return (
    <>
      {highlightNumbers(text).map((seg, i) => (seg.highlight ? <strong key={i}>{seg.text}</strong> : <span key={i}>{seg.text}</span>))}
    </>
  );
}

type SheetKey = "standards" | "memo" | "routine" | "interests" | "notes";

export default function BlueprintAbout() {
  const { t } = useTranslation();
  const L = useBlueprintLabels();
  const { dailyRoutine, faq } = useAbout(aboutRepository);
  const { aboutText, services } = useHome(homeRepository);
  const { principles } = useWorkPrinciples(homeRepository);

  const paragraphs = splitParagraphs(aboutText ?? "");
  const rawPersonal = t("about.aboutMe.text");
  const personal = rawPersonal && rawPersonal !== "about.aboutMe.text" ? splitParagraphs(rawPersonal) : [];
  const interests = services.slice(0, 6);

  const visible: SheetKey[] = [
    "standards",
    ...(paragraphs.length > 0 || personal.length > 0 ? (["memo"] as const) : []),
    ...(dailyRoutine.length > 0 ? (["routine"] as const) : []),
    ...(interests.length > 0 ? (["interests"] as const) : []),
    ...(faq.length > 0 ? (["notes"] as const) : []),
  ];
  const total = visible.length;
  const num = (key: SheetKey) => visible.indexOf(key);
  const last = visible[visible.length - 1];
  const endStamp = (key: SheetKey) => (key === last ? <PageTitleBlock page={t("about.title")} sheets={total - 1} /> : null);

  return (
    <div className="bp-page">
      {/* Folha 00 — abre com "Como eu trabalho": os princípios como normas N-01, N-02… */}
      <Sheet
        n={num("standards")}
        total={total}
        title={principles.length > 0 ? L.standards : L.presentation}
        caption={principles.length > 0 ? t("about.principles.title") : undefined}
      >
        <h1 className="bp-h1">{t("about.title")}</h1>
        <p className="bp-lead">{t("about.subtitle")}</p>
        {principles.length > 0 && (
          <>
            <div style={{ marginTop: 26 }}>
              <Dim label={`${principles.length} ${L.standards.toLowerCase()}`} />
            </div>
            <ol className="bp-norms">
              {principles.map((p, i) => (
                <li key={`${p.title}-${i}`}>
                  <span className="bp-norm-code" aria-hidden="true">
                    N-{pad2(i + 1)}
                  </span>
                  <h3>{p.title}</h3>
                  {p.description && <p>{p.description}</p>}
                </li>
              ))}
            </ol>
          </>
        )}
        {endStamp("standards")}
      </Sheet>

      {/* Folha 01 — memorial descritivo: resumo profissional e o lado pessoal */}
      {visible.includes("memo") && (
        <Sheet n={num("memo")} total={total} title={L.memorial} caption={t("about.professional.title")}>
          {paragraphs.length > 0 && (
            <>
              <Dim label={L.paragraphs(paragraphs.length, wordCount(paragraphs.join(" ")))} />
              <div className="bp-memo">
                {paragraphs.map((para, i) => (
                  <p key={i}>
                    <small aria-hidden="true">
                      {num("memo")}.{i + 1}
                    </small>
                    <Highlighted text={para} />
                  </p>
                ))}
              </div>
            </>
          )}
          {personal.length > 0 && (
            <div className="bp-block" style={{ marginTop: paragraphs.length > 0 ? 22 : 0 }}>
              <h3 className="bp-block-title">{t("about.aboutMe.title")}</h3>
              <div className="bp-memo">
                {personal.map((para, i) => (
                  <p key={i}>
                    <small aria-hidden="true">
                      {num("memo")}.{paragraphs.length + i + 1}
                    </small>
                    {para}
                  </p>
                ))}
              </div>
            </div>
          )}
          {endStamp("memo")}
        </Sheet>
      )}

      {/* Folha 02 — dia a dia como cronograma */}
      {dailyRoutine.length > 0 && (
        <Sheet n={num("routine")} total={total} title={L.routine} caption={t("about.dailyRoutine.title")}>
          <ol className="bp-steps">
            {dailyRoutine.map((item, i) => (
              <li key={item.id}>
                {item.image_url && <Hatch src={item.image_url} alt="" />}
                <div className="bp-steps-txt">
                  <Num>{i + 1}</Num>
                  <span>{item.description}</span>
                </div>
              </li>
            ))}
          </ol>
          {endStamp("routine")}
        </Sheet>
      )}

      {/* Folha 03 — interesses (as frentes de trabalho da home) */}
      {interests.length > 0 && (
        <Sheet n={num("interests")} total={total} title={L.interests}>
          <ul className="bp-det">
            {interests.map((s, i) => (
              <li key={s.id ?? s.title}>
                <Num size="lg">D{i + 1}</Num>
                <h3>{s.title}</h3>
                <p>{s.description}</p>
              </li>
            ))}
          </ul>
          {endStamp("interests")}
        </Sheet>
      )}

      {/* Folha 04 — FAQ como notas gerais */}
      {faq.length > 0 && (
        <Sheet n={num("notes")} total={total} title={L.notes} caption={t("about.faq.title")}>
          <Dim label={L.notesCount(faq.length)} />
          <ol className="bp-notes">
            {faq.map((f, i) => (
              <li key={f.id}>
                <Num>{i + 1}</Num>
                <h3>{f.question}</h3>
                <p>{f.answer}</p>
              </li>
            ))}
          </ol>
          {endStamp("notes")}
        </Sheet>
      )}
    </div>
  );
}
