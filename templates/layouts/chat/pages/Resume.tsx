import { useId, useState } from "react";
import { useResume } from "@/hooks/useResume";
import { useHome } from "@/hooks/useHome";
import { useHomeMetrics } from "@/hooks/useHomeMetrics";
import { useDownloadCV } from "@/hooks/useDownloadCV";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { splitParagraphs } from "@/utils/aboutContent";
import { groupSkills, splitExperiences } from "@/utils/resumeContent";
import { resumeRepository, homeRepository } from "@/repositories/instances";
import {
  Bubble,
  ChatLog,
  ChatSection,
  DayChip,
  FileCard,
  Highlighted,
  MetricGrid,
  useChatText,
} from "@/components/ChatShared";

type Experience = { role?: string; company?: string; period?: string; description?: string };
type Education = {
  degree?: string;
  institution?: string;
  school?: string;
  period?: string;
  description?: string;
  items?: string[];
};
type Named = { name?: string; text?: string; level?: string };

/** Texto de um item simples do currículo (curso, voluntariado, soft skill…). */
function labelOf(content: unknown): string {
  if (typeof content === "string") return content;
  const c = (content ?? {}) as Named;
  return c.text ?? c.name ?? "";
}

export default function ChatResume() {
  const { t } = useTranslation();
  const text = useChatText();
  const { getItemsByType, isLoading } = useResume(resumeRepository);
  const { aboutText } = useHome(homeRepository);
  const { metrics } = useHomeMetrics(homeRepository);
  const { downloadCV, canDownload } = useDownloadCV();
  const [showOlder, setShowOlder] = useState(false);
  const olderId = useId();

  if (isLoading) return null;

  const experience = getItemsByType("experience");
  const skills = getItemsByType("skill");
  const softSkills = getItemsByType("soft_skill").map((s) => ({ id: s.id, label: labelOf(s.translatedContent) })).filter((s) => s.label);
  const languages = getItemsByType("language");
  const education = getItemsByType("education");
  const courses = getItemsByType("course").map((c) => ({ id: c.id, label: labelOf(c.translatedContent) })).filter((c) => c.label);
  const volunteering = getItemsByType("volunteer").map((v) => ({ id: v.id, label: labelOf(v.translatedContent) })).filter((v) => v.label);
  const summary = splitParagraphs(aboutText ?? "")[0] ?? "";
  const { recent, older } = splitExperiences(experience);
  const skillGroups = groupSkills(skills, t("resume.stack"));

  const renderExperience = (exp: (typeof experience)[number]) => {
    const c = exp.translatedContent as Experience;
    return (
      <Bubble key={exp.id} as="article">
        <b className="ct-t">{c.role}</b>
        <span className="ct-sub">{[c.company, c.period].filter(Boolean).join(" · ")}</span>
        {c.description && <div className="ct-html" dangerouslySetInnerHTML={{ __html: c.description }} />}
      </Bubble>
    );
  };

  return (
    <ChatLog>
      <h1 className="ct-sr">{t("resume.title")}</h1>
      <DayChip />

      {/* Resumo + anexo do CV */}
      <ChatSection title={t("resume.summary")} ask={text.qResume}>
        {summary && (
          <Bubble>
            <p>
              <Highlighted text={summary} />
            </p>
          </Bubble>
        )}
        <Bubble>
          <p>{text.cvIntro}</p>
          <FileCard
            name={text.cvFile}
            hint={text.cvHint}
            label={text.cvDownload}
            onClick={downloadCV}
            disabled={!canDownload}
          />
        </Bubble>
      </ChatSection>

      {metrics.length > 0 && (
        <ChatSection title={text.sectionNumbers} ask={text.qResumeNumbers}>
          <Bubble>
            <MetricGrid metrics={metrics.slice(0, 4)} />
          </Bubble>
        </ChatSection>
      )}

      {/* Experiências: as recentes à vista, as anteriores expandem na própria conversa */}
      {experience.length > 0 && (
        <ChatSection title={t("resume.experience")} ask={text.qExperience}>
          {recent.map(renderExperience)}
          {older.length > 0 && (
            <>
              <div id={olderId} className="ct-group" hidden={!showOlder}>
                {showOlder && older.map(renderExperience)}
              </div>
              <button
                type="button"
                className="ct-pill"
                style={{ alignSelf: "flex-start" }}
                aria-expanded={showOlder}
                aria-controls={olderId}
                onClick={() => setShowOlder((v) => !v)}
              >
                {showOlder ? t("resume.hideOlder") : `${t("resume.showOlder")} (${older.length})`}
              </button>
            </>
          )}
        </ChatSection>
      )}

      {/* Habilidades agrupadas (sem níveis numéricos) */}
      {skillGroups.length > 0 && (
        <ChatSection title={t("resume.skills")} ask={text.qSkills}>
          <Bubble wide>
            {skillGroups.map((g) => (
              <div key={g.name} className="ct-grp">
                <span className="ct-lb">{g.name}</span>
                <div className="ct-chips">
                  {g.items.map((s) => (
                    <span key={s.id} className="ct-chip">
                      {labelOf(s.translatedContent)}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </Bubble>
        </ChatSection>
      )}

      {softSkills.length > 0 && (
        <ChatSection title={t("resume.softSkills")} ask={text.qSoft}>
          <Bubble>
            <div className="ct-chips">
              {softSkills.map((s) => (
                <span key={s.id} className="ct-chip">
                  {s.label}
                </span>
              ))}
            </div>
          </Bubble>
        </ChatSection>
      )}

      {languages.length > 0 && (
        <ChatSection title={t("resume.languages")} ask={text.qLanguages}>
          <Bubble>
            <ul className="ct-list row">
              {languages.map((l) => {
                const c = (l.translatedContent ?? {}) as Named;
                return (
                  <li key={l.id}>
                    <b className="ct-t">{c.name}</b>
                    {c.level && <span>{c.level}</span>}
                  </li>
                );
              })}
            </ul>
          </Bubble>
        </ChatSection>
      )}

      {education.length > 0 && (
        <ChatSection title={t("resume.education")} ask={text.qEducation}>
          {education.map((e) => {
            const c = (e.translatedContent ?? {}) as Education;
            return (
              <Bubble key={e.id} as="article">
                <b className="ct-t">{c.degree}</b>
                <span className="ct-sub">{[c.institution ?? c.school, c.period].filter(Boolean).join(" · ")}</span>
                {c.description && <div className="ct-html" dangerouslySetInnerHTML={{ __html: c.description }} />}
                {(c.items ?? []).length > 0 && (
                  <ul>
                    {(c.items ?? []).map((it, j) => (
                      <li key={j}>{it}</li>
                    ))}
                  </ul>
                )}
              </Bubble>
            );
          })}
        </ChatSection>
      )}

      {courses.length > 0 && (
        <ChatSection title={t("resume.courses")} ask={text.qCourses}>
          <Bubble>
            <ul className="ct-list">
              {courses.map((c) => (
                <li key={c.id}>{c.label}</li>
              ))}
            </ul>
          </Bubble>
        </ChatSection>
      )}

      {volunteering.length > 0 && (
        <ChatSection title={t("resume.volunteer")} ask={text.qVolunteer}>
          <Bubble>
            <ul className="ct-list">
              {volunteering.map((v) => (
                <li key={v.id}>{v.label}</li>
              ))}
            </ul>
          </Bubble>
        </ChatSection>
      )}
    </ChatLog>
  );
}
