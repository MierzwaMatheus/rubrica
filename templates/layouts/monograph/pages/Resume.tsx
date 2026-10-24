/**
 * Monografia — Currículo. "Curriculum Vitae" como capítulo: experiências como entradas com
 * as datas na margem, habilidades por grupo em parágrafos corridos e o PDF como link em
 * versalete. Cada bloco some quando está vazio.
 */
import { useState } from "react";
import DOMPurify from "dompurify";
import { Download } from "lucide-react";
import { SEO } from "@/components/SEO";
import { useResume } from "@/hooks/useResume";
import { useHome } from "@/hooks/useHome";
import { useHomeMetrics } from "@/hooks/useHomeMetrics";
import { useDownloadCV } from "@/hooks/useDownloadCV";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { splitParagraphs } from "@/utils/aboutContent";
import { groupSkills, splitExperiences } from "@/utils/resumeContent";
import { resumeRepository, homeRepository } from "@/repositories/instances";
import {
  Leader,
  MnChapter,
  MnMain,
  MnNote,
  MnNumbers,
  MnSection,
  itemText,
  joinAsSentence,
  useMonographText,
} from "@/components/MonographShared";

interface DatedContent {
  role?: string;
  company?: string;
  degree?: string;
  institution?: string;
  school?: string;
  period?: string;
  description?: string;
}

/** Uma entrada do currículo: título, instituição e texto, com a data na margem. */
function Entry({ title, org, period, html }: { title?: string; org?: string; period?: string; html?: string }) {
  return (
    <>
      <MnMain className="mn-cv">
        {period ? <p className="mn-cv-date mn-n-date">{period}</p> : null}
        <div>
          <h3 className="mn-cv-role">{title}</h3>
          {org ? <p className="mn-cv-org">{org}</p> : null}
        </div>
        {html ? <div className="mn-rich" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} /> : null}
      </MnMain>
      {period ? (
        <MnNote className="mn-n--date">
          <p className="mn-n-date">{period}</p>
        </MnNote>
      ) : null}
    </>
  );
}

export default function MonographResume() {
  const { t } = useTranslation();
  const tx = useMonographText();
  const { getItemsByType, isLoading } = useResume(resumeRepository);
  const { aboutText } = useHome(homeRepository);
  const { metrics } = useHomeMetrics(homeRepository);
  const { downloadCV, canDownload } = useDownloadCV();
  const [showOlder, setShowOlder] = useState(false);

  if (isLoading) return null;

  const experience = getItemsByType("experience");
  const education = getItemsByType("education");
  const skills = getItemsByType("skill");
  const softSkills = getItemsByType("soft_skill").map((i) => itemText(i.translatedContent)).filter(Boolean);
  const languages = getItemsByType("language");
  const courses = getItemsByType("course").map((i) => ({ id: i.id, text: itemText(i.translatedContent) })).filter((c) => c.text);
  const volunteer = getItemsByType("volunteer").map((i) => ({ id: i.id, text: itemText(i.translatedContent) })).filter((v) => v.text);
  const summary = splitParagraphs(aboutText ?? "")[0] ?? "";
  const { recent, older } = splitExperiences(experience);
  const visibleExperience = showOlder ? experience : recent;
  const skillGroups = groupSkills(skills, t("resume.stack"));

  return (
    <>
      <SEO title={t("resume.title")} description={summary || t("resume.subtitle")} url="/curriculo" />

      <MnChapter number={2} title="Curriculum Vitae" dek={summary || t("resume.subtitle")}>
        <p className="mn-links">
          <button
            type="button"
            className="mn-act"
            onClick={downloadCV}
            disabled={!canDownload}
            data-umami-event="resume-download-cv"
          >
            <Download size={13} aria-hidden="true" style={{ alignSelf: "center" }} />
            {t("resume.downloadCV")}
          </button>
        </p>
      </MnChapter>

      {metrics.length > 0 && (
        <MnSection id="numeros" label={tx.numbers}>
          <MnMain>
            <MnNumbers items={metrics} />
          </MnMain>
        </MnSection>
      )}

      {experience.length > 0 && (
        <MnSection id="experiencia" label={t("resume.experience")} className="mn-s--entries">
          {visibleExperience.map((item) => {
            const c = item.translatedContent as DatedContent;
            return <Entry key={item.id} title={c.role} org={c.company} period={c.period} html={c.description} />;
          })}
          {older.length > 0 && (
            <MnMain>
              <p className="mn-links mn-links--left">
                <button
                  type="button"
                  className="mn-act"
                  aria-expanded={showOlder}
                  onClick={() => setShowOlder((v) => !v)}
                >
                  {showOlder ? t("resume.hideOlder") : `${t("resume.showOlder")} (${older.length})`}
                </button>
              </p>
            </MnMain>
          )}
        </MnSection>
      )}

      {skillGroups.length > 0 && (
        <MnSection id="habilidades" label={t("resume.skills")}>
          <MnMain>
            {skillGroups.map((g) => (
              <p key={g.name} className="mn-sv">
                <b>{g.name}.</b>{" "}
                {joinAsSentence(
                  g.items.map((s) => itemText(s.translatedContent)).filter(Boolean),
                  tx.and,
                )}
                .
              </p>
            ))}
          </MnMain>
        </MnSection>
      )}

      {softSkills.length > 0 && (
        <MnSection id="soft-skills" label={t("resume.softSkills")}>
          <MnMain>
            <p className="mn-sv">{joinAsSentence(softSkills, tx.and)}.</p>
          </MnMain>
        </MnSection>
      )}

      {languages.length > 0 && (
        <MnSection id="idiomas" label={t("resume.languages")}>
          <MnMain>
            <ul className="mn-plain">
              {languages.map((l) => {
                const c = l.translatedContent as { name?: string; level?: string } | string;
                const label = itemText(c);
                const level = typeof c === "object" && c ? c.level ?? "" : "";
                return (
                  <li key={l.id}>
                    <Leader value={<span className="mn-it">{level}</span>}>{label}</Leader>
                  </li>
                );
              })}
            </ul>
          </MnMain>
        </MnSection>
      )}

      {education.length > 0 && (
        <MnSection id="formacao" label={t("resume.education")} className="mn-s--entries">
          {education.map((item) => {
            const c = item.translatedContent as DatedContent;
            return (
              <Entry
                key={item.id}
                title={c.degree}
                org={c.institution ?? c.school}
                period={c.period}
                html={c.description}
              />
            );
          })}
        </MnSection>
      )}

      {courses.length > 0 && (
        <MnSection id="cursos" label={t("resume.courses")}>
          <MnMain>
            <ol className="mn-list">
              {courses.map((c) => (
                <li key={c.id}>{c.text}</li>
              ))}
            </ol>
          </MnMain>
        </MnSection>
      )}

      {volunteer.length > 0 && (
        <MnSection id="voluntariado" label={t("resume.volunteer")}>
          <MnMain>
            <ul className="mn-list">
              {volunteer.map((v) => (
                <li key={v.id}>{v.text}</li>
              ))}
            </ul>
          </MnMain>
        </MnSection>
      )}
    </>
  );
}
