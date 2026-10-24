import { Fragment, useState } from "react";
import DOMPurify from "dompurify";
import { ChevronDown, Download } from "lucide-react";
import { SEO } from "@/components/SEO";
import { useResume } from "@/hooks/useResume";
import { useHome } from "@/hooks/useHome";
import { useHomeMetrics } from "@/hooks/useHomeMetrics";
import { useDownloadCV } from "@/hooks/useDownloadCV";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { splitParagraphs } from "@/utils/aboutContent";
import { highlightNumbers } from "@/utils/homeContent";
import { groupSkills, splitExperiences } from "@/utils/resumeContent";
import { resumeRepository, homeRepository } from "@/repositories/instances";
import {
  BigNumbers,
  PageHead,
  Section,
  SectionLabel,
  K_NUM,
  fit,
  usePosterLabels,
  yearOf,
} from "@/components/PosterShared";

interface TimelineContent {
  role?: string;
  company?: string;
  degree?: string;
  institution?: string;
  period?: string;
  description?: string;
}
interface TextContent {
  text?: string;
  name?: string;
  level?: string;
}

const RESUME_CSS = `
.poster-tl { margin: 0; padding: 0; list-style: none; }
.poster-tl-item {
  display: grid; grid-template-columns: minmax(150px, 0.8fr) minmax(0, 2fr); gap: 16px clamp(20px, 4vw, 56px);
  padding-block: clamp(22px, 3vw, 36px); border-top: var(--poster-rule) solid var(--text);
}
.poster-tl-item:last-child { border-bottom: var(--poster-rule) solid var(--text); }
.poster-tl-period { display: block; margin-top: 10px; font-family: var(--font-mono); font-size: 12px; letter-spacing: .1em; text-transform: uppercase; }
.poster-tl-role { margin: 0; font-size: clamp(24px, 2.8vw, 40px); font-weight: 800; line-height: 1.05; letter-spacing: -.02em; overflow-wrap: anywhere; }
.poster-tl-org { display: block; margin-top: 6px; font-size: 14px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; }
.poster-more { width: 100%; justify-content: space-between; margin-top: 20px; }
.poster-more svg { transition: transform .2s ease; }
.poster-more[aria-expanded="true"] svg { transform: rotate(180deg); }
.poster-groups { display: grid; gap: 0; }
.poster-group { display: grid; grid-template-columns: minmax(120px, 220px) minmax(0, 1fr); gap: 12px clamp(20px, 4vw, 56px); padding-block: 22px; border-top: var(--poster-rule) solid var(--text); }
.poster-group:last-child { border-bottom: var(--poster-rule) solid var(--text); }
.poster-group h3 { margin: 6px 0 0; font-family: var(--font-mono); font-size: 12px; font-weight: 500; letter-spacing: .14em; text-transform: uppercase; }
.poster-cols { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: clamp(40px, 6vw, 80px); }
.poster-lang { margin: 0; padding: 0; list-style: none; }
.poster-lang li { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: baseline; gap: 4px 16px; padding-block: 14px; border-top: 2px solid var(--text); }
.poster-lang li:last-child { border-bottom: 2px solid var(--text); }
.poster-lang b { font-size: clamp(24px, 2.6vw, 36px); font-weight: 800; letter-spacing: -.02em; text-transform: uppercase; }
.poster-lang span { font-family: var(--font-mono); font-size: 12px; letter-spacing: .1em; text-transform: uppercase; }
.poster-list { margin: 0; padding: 0; list-style: none; }
.poster-list li { padding-block: 14px; border-top: 2px solid var(--text); font-size: clamp(17px, 1.6vw, 21px); line-height: 1.35; }
.poster-list li:last-child { border-bottom: 2px solid var(--text); }
@media (max-width: 760px) {
  .poster-tl-item, .poster-group, .poster-cols { grid-template-columns: minmax(0, 1fr); }
}
`;

/** Um item da linha do tempo: o ano gigante como âncora, cargo e empresa ao lado. */
function TimelineItem({ title, org, period, html }: { title: string; org?: string; period?: string; html?: string }) {
  const year = yearOf(period);
  const anchor = year ?? period ?? "";
  return (
    <li className="poster-tl-item">
      <div className="poster-fit">
        {anchor && (
          <span className="poster-giant" style={{ ...fit(anchor, 140, K_NUM), lineHeight: 0.85 }} aria-hidden={year ? true : undefined}>
            {anchor}
          </span>
        )}
        {period && <span className="poster-tl-period">{period}</span>}
      </div>
      <div>
        <h3 className="poster-tl-role">{title}</h3>
        {org && <span className="poster-tl-org">{org}</span>}
        {html && <div className="poster-prose" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />}
      </div>
    </li>
  );
}

/** Lista simples de textos (cursos, certificações, voluntariado). */
function TextList({ items }: { items: Array<{ id: string; translatedContent: unknown }> }) {
  return (
    <ul className="poster-list">
      {items.map((item) => {
        const c = item.translatedContent as TextContent | string;
        const text = typeof c === "string" ? c : c?.text ?? c?.name ?? "";
        return text ? <li key={item.id}>{text}</li> : null;
      })}
    </ul>
  );
}

export default function PosterResume() {
  const { t } = useTranslation();
  const labels = usePosterLabels();
  const { getItemsByType, isLoading } = useResume(resumeRepository);
  const { aboutText } = useHome(homeRepository);
  const { metrics } = useHomeMetrics(homeRepository);
  const { downloadCV, canDownload } = useDownloadCV();
  const [showOlder, setShowOlder] = useState(false);

  if (isLoading) return null;

  const experience = getItemsByType("experience");
  const education = getItemsByType("education");
  const skills = getItemsByType("skill");
  const softSkills = getItemsByType("soft_skill");
  const languages = getItemsByType("language");
  const courses = getItemsByType("course");
  const certifications = getItemsByType("certification");
  const volunteer = [...getItemsByType("volunteer"), ...getItemsByType("volunteering")];

  const summary = splitParagraphs(aboutText ?? "")[0] ?? "";
  const { recent, older } = splitExperiences(experience);
  const skillGroups = groupSkills(skills, t("resume.stack"));

  const renderTimeline = (item: (typeof experience)[number], kind: "experience" | "education") => {
    const c = (item.translatedContent ?? {}) as TimelineContent;
    return (
      <TimelineItem
        key={item.id}
        title={(kind === "experience" ? c.role : c.degree) ?? ""}
        org={kind === "experience" ? c.company : c.institution}
        period={c.period}
        html={c.description}
      />
    );
  };

  return (
    <>
      <SEO title={t("resume.title")} description={t("resume.subtitle")} url="/curriculo" />
      <style>{RESUME_CSS}</style>

      <PageHead kicker={t("resume.subtitle")} title={t("resume.title")}>
        {summary && (
          <p>
            {highlightNumbers(summary).map((s, i) =>
              s.highlight ? <strong key={i}>{s.text}</strong> : <Fragment key={i}>{s.text}</Fragment>,
            )}
          </p>
        )}
        <button
          type="button"
          className="poster-btn poster-btn--pri"
          onClick={downloadCV}
          disabled={!canDownload}
          data-umami-event="resume-download-cv"
          style={{ width: "100%" }}
        >
          <Download size={18} strokeWidth={3} aria-hidden="true" /> {t("resume.downloadCV")}
        </button>
      </PageHead>

      {metrics.length > 0 && (
        <Section labelledBy="poster-cv-numeros">
          <SectionLabel id="poster-cv-numeros" title={labels.emNumeros} />
          <BigNumbers items={metrics} />
        </Section>
      )}

      {experience.length > 0 && (
        <Section labelledBy="poster-cv-exp">
          <SectionLabel id="poster-cv-exp" title={t("resume.experience")} />
          <ol className="poster-tl">
            {recent.map((item) => renderTimeline(item, "experience"))}
            {showOlder && older.map((item) => renderTimeline(item, "experience"))}
          </ol>
          {older.length > 0 && (
            <button
              type="button"
              className="poster-btn poster-more"
              aria-expanded={showOlder}
              onClick={() => setShowOlder((v) => !v)}
            >
              {showOlder ? t("resume.hideOlder") : `${t("resume.showOlder")} (${older.length})`}
              <ChevronDown size={20} strokeWidth={3} aria-hidden="true" />
            </button>
          )}
        </Section>
      )}

      {skillGroups.length > 0 && (
        <Section labelledBy="poster-cv-skills">
          <SectionLabel id="poster-cv-skills" title={t("resume.skills")} />
          <div className="poster-groups">
            {skillGroups.map((group) => (
              <div key={group.name} className="poster-group">
                <h3>{group.name}</h3>
                <ul className="poster-words">
                  {group.items.map((skill, i) => (
                    <li key={skill.id}>
                      {(skill.translatedContent as TextContent)?.name ?? ""}
                      {i < group.items.length - 1 && (
                        <span className="poster-sep" aria-hidden="true">
                          {" "}
                          /
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Section>
      )}

      {(softSkills.length > 0 || languages.length > 0) && (
        <Section>
          <div className="poster-cols">
            {softSkills.length > 0 && (
              <div>
                <SectionLabel id="poster-cv-soft" title={t("resume.softSkills")} />
                <ul className="poster-words poster-words--m">
                  {softSkills.map((item, i) => (
                    <li key={item.id}>
                      {(item.translatedContent as TextContent)?.text ?? ""}
                      {i < softSkills.length - 1 && (
                        <span className="poster-sep" aria-hidden="true">
                          {" "}
                          ✶
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {languages.length > 0 && (
              <div>
                <SectionLabel id="poster-cv-lang" title={t("resume.languages")} />
                <ul className="poster-lang">
                  {languages.map((item) => {
                    const c = (item.translatedContent ?? {}) as TextContent;
                    return (
                      <li key={item.id}>
                        <b>{c.name}</b>
                        {c.level && <span>{c.level}</span>}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </Section>
      )}

      {education.length > 0 && (
        <Section labelledBy="poster-cv-edu">
          <SectionLabel id="poster-cv-edu" title={t("resume.education")} />
          <ol className="poster-tl">{education.map((item) => renderTimeline(item, "education"))}</ol>
        </Section>
      )}

      {(courses.length > 0 || certifications.length > 0) && (
        <Section>
          <div className="poster-cols">
            {courses.length > 0 && (
              <div>
                <SectionLabel id="poster-cv-cursos" title={t("resume.courses")} />
                <TextList items={courses} />
              </div>
            )}
            {certifications.length > 0 && (
              <div>
                <SectionLabel id="poster-cv-certs" title={labels.certificacoes} />
                <TextList items={certifications} />
              </div>
            )}
          </div>
        </Section>
      )}

      {volunteer.length > 0 && (
        <Section labelledBy="poster-cv-vol">
          <SectionLabel id="poster-cv-vol" title={t("resume.volunteer")} />
          <TextList items={volunteer} />
        </Section>
      )}
    </>
  );
}
