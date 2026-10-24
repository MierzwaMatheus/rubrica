import { useState } from "react";
import DOMPurify from "dompurify";
import { Download } from "lucide-react";
import { useResume } from "@/hooks/useResume";
import { useHome } from "@/hooks/useHome";
import { useHomeMetrics } from "@/hooks/useHomeMetrics";
import { useDownloadCV } from "@/hooks/useDownloadCV";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { splitParagraphs } from "@/utils/aboutContent";
import { groupSkills, splitExperiences } from "@/utils/resumeContent";
import { resumeRepository, homeRepository } from "@/repositories/instances";
import { SEO } from "@/components/SEO";
import {
  Crumb,
  MetricsGrid,
  SectionHead,
  StageDot,
  StageLabel,
  experienceStage,
  useGardenTexts,
} from "@/components/GardenShared";

/** Texto de um item simples do currículo (curso, voluntariado, soft skill). */
function itemText(content: unknown): string {
  if (typeof content === "string") return content;
  const c = content as { text?: string; name?: string } | undefined;
  return c?.text ?? c?.name ?? "";
}

function Rich({ html }: { html?: string }) {
  if (!html) return null;
  return <div className="gd-rich" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />;
}

export default function GardenResume() {
  const { t } = useTranslation();
  const tx = useGardenTexts();
  const { getItemsByType, isLoading } = useResume(resumeRepository);
  const { aboutText } = useHome(homeRepository);
  const { metrics } = useHomeMetrics(homeRepository);
  const { downloadCV, canDownload } = useDownloadCV();
  const [showOlder, setShowOlder] = useState(false);

  if (isLoading) return <div aria-busy="true" style={{ minHeight: "60vh" }} />;

  const experience = getItemsByType("experience");
  const skills = getItemsByType("skill");
  const courses = getItemsByType("course");
  const education = getItemsByType("education");
  const languages = getItemsByType("language");
  const softSkills = getItemsByType("soft_skill");
  const volunteering = getItemsByType("volunteer");
  const summary = splitParagraphs(aboutText ?? "")[0] ?? "";
  const { recent, older } = splitExperiences(experience);
  const visibleExperience = showOlder ? experience : recent;
  const skillGroups = groupSkills(skills, t("resume.stack"));

  return (
    <>
      <SEO title={t("resume.title")} description={t("resume.subtitle")} url="/curriculo" />

      <section className="gd-hero" aria-labelledby="gd-resume">
        <Crumb page={t("navigation.resume").toLowerCase()} />
        <h1 id="gd-resume" className="gd-h1">
          {t("resume.title")}
        </h1>
        {summary && <p className="gd-lead">{summary}</p>}
        <div className="gd-row">
          <button
            type="button"
            className="gd-btn gd-btn-pri"
            onClick={downloadCV}
            disabled={!canDownload}
            data-umami-event="resume-download-cv"
          >
            <Download size={16} aria-hidden="true" /> {t("resume.downloadCV")}
          </button>
        </div>
      </section>

      {metrics.length > 0 && (
        <section className="gd-sec" aria-labelledby="gd-state">
          <SectionHead id="gd-state" title={tx.state} />
          <MetricsGrid metrics={metrics} />
        </section>
      )}

      {experience.length > 0 && (
        <section className="gd-sec" aria-labelledby="gd-timeline">
          <SectionHead id="gd-timeline" title={tx.timeline} />
          <p className="gd-p gd-muted">{t("resume.experience")}</p>
          <ol className="gd-tl">
            {visibleExperience.map((exp) => {
              const c = exp.translatedContent as { role?: string; company?: string; period?: string; description?: string };
              const stage = experienceStage(c.period);
              return (
                <li key={exp.id}>
                  <span className="gd-ring" data-stage={stage} aria-hidden="true">
                    <StageDot stage={stage} size={8} />
                  </span>
                  <div className="gd-tl-meta">
                    {c.period && <span>{c.period}</span>}
                    <StageLabel stage={stage} extra={stage === "sprout" ? tx.growing : undefined} />
                  </div>
                  <h3 className="gd-h3">{c.role}</h3>
                  {c.company && <p className="gd-tl-org">{c.company}</p>}
                  <Rich html={c.description} />
                </li>
              );
            })}
          </ol>
          {older.length > 0 && (
            <div className="gd-row">
              <button type="button" className="gd-btn" aria-expanded={showOlder} onClick={() => setShowOlder((v) => !v)}>
                {showOlder ? t("resume.hideOlder") : `${t("resume.showOlder")} (${older.length})`}
              </button>
            </div>
          )}
        </section>
      )}

      {skillGroups.length > 0 && (
        <section className="gd-sec" aria-labelledby="gd-skills">
          <SectionHead id="gd-skills" title={tx.skillBeds} />
          <p className="gd-p gd-muted">{t("resume.skills")}</p>
          <ul className="gd-beds">
            {skillGroups.map((g) => (
              <li key={g.name} className="gd-bed">
                <h3>{g.name}</h3>
                <ul className="gd-tags">
                  {g.items.map((s) => (
                    <li key={s.id} className="gd-tag">
                      {(s.translatedContent as { name?: string } | undefined)?.name}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </section>
      )}

      {(softSkills.length > 0 || languages.length > 0) && (
        <div className="gd-two">
          {softSkills.length > 0 && (
            <section className="gd-sec" aria-labelledby="gd-soft">
              <h2 id="gd-soft" className="gd-h2">
                {t("resume.softSkills")}
              </h2>
              <ul className="gd-tags">
                {softSkills.map((s) => (
                  <li key={s.id} className="gd-tag">
                    {itemText(s.translatedContent)}
                  </li>
                ))}
              </ul>
            </section>
          )}
          {languages.length > 0 && (
            <section className="gd-sec" aria-labelledby="gd-langs">
              <h2 id="gd-langs" className="gd-h2">
                {t("resume.languages")}
              </h2>
              <ul className="gd-list">
                {languages.map((l) => {
                  const lc = l.translatedContent as { name?: string; level?: string } | string;
                  const name = typeof lc === "string" ? lc : lc?.name;
                  const level = typeof lc === "string" ? "" : lc?.level;
                  return (
                    <li key={l.id}>
                      {name}
                      {level && <small>{level}</small>}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>
      )}

      {education.length > 0 && (
        <section className="gd-sec" aria-labelledby="gd-edu">
          <SectionHead id="gd-edu" title={t("resume.education")} />
          <ul className="gd-list">
            {education.map((e) => {
              const ec = e.translatedContent as { degree?: string; institution?: string; period?: string; description?: string };
              return (
                <li key={e.id}>
                  <h3 className="gd-h3">{ec.degree}</h3>
                  <small>{[ec.institution, ec.period].filter(Boolean).join(" · ")}</small>
                  <Rich html={ec.description} />
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {courses.length > 0 && (
        <section className="gd-sec" aria-labelledby="gd-courses">
          <SectionHead id="gd-courses" title={t("resume.courses")} />
          <ul className="gd-list">
            {courses.map((c) => (
              <li key={c.id}>{itemText(c.translatedContent)}</li>
            ))}
          </ul>
        </section>
      )}

      {volunteering.length > 0 && (
        <section className="gd-sec" aria-labelledby="gd-vol">
          <SectionHead id="gd-vol" title={t("resume.volunteer")} />
          <ul className="gd-list">
            {volunteering.map((v) => (
              <li key={v.id}>{itemText(v.translatedContent)}</li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
