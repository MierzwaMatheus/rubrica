import { useId, useState } from "react";
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
import type { ResumeItem } from "@/repositories/interfaces/ResumeRepository";
import {
  Highlighted,
  IndexMetrics,
  IndexSection,
  RichText,
  catalogNumber,
  firstBullet,
  useIndexCopy,
} from "@/components/IndexShared";

type Item = ResumeItem & { translatedContent?: unknown };

/** Campo de texto do conteúdo traduzido, tolerando strings soltas e campos ausentes. */
function field(item: Item, key: string): string {
  const c = item.translatedContent ?? item.content;
  if (typeof c === "string") return key === "text" || key === "name" ? c : "";
  if (c && typeof c === "object") {
    const v = (c as Record<string, unknown>)[key];
    return typeof v === "string" ? v : "";
  }
  return "";
}

/** Texto de itens simples (curso, voluntariado, soft skill): `text` ou `name`. */
const label = (item: Item) => field(item, "text") || field(item, "name");

/** Uma ficha de experiência: período | cargo | empresa | resumo, expandindo para os marcadores. */
function ExperienceRow({ item }: { item: Item }) {
  const copy = useIndexCopy();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const description = field(item, "description");
  const summary = firstBullet(description);
  const role = field(item, "role");
  const company = field(item, "company");

  const cells = (
    <>
      <span className="ix-num ix-muted">{field(item, "period")}</span>
      <span className="ix-xp-role">{role}</span>
      <span>{company}</span>
      <span className="ix-xp-sum ix-muted">{summary}</span>
    </>
  );

  if (!description.trim()) {
    return (
      <li>
        <div className="ix-xp-static ix-xp-grid">
          {cells}
          <span />
        </div>
      </li>
    );
  }

  return (
    <li>
      <button
        type="button"
        className="ix-xp-row ix-xp-grid"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        {cells}
        <span className="ix-xp-sign" aria-hidden="true">
          {open ? "−" : "+"}
        </span>
        <span className="ix-sr">{copy.showDetails}</span>
      </button>
      <div id={panelId} className="ix-xp-panel" hidden={!open}>
        <RichText html={description} />
      </div>
    </li>
  );
}

export default function IndexResume() {
  const { t } = useTranslation();
  const copy = useIndexCopy();
  const { getItemsByType, isLoading } = useResume(resumeRepository);
  const { aboutText } = useHome(homeRepository);
  const { metrics } = useHomeMetrics(homeRepository);
  const { downloadCV, canDownload } = useDownloadCV();
  const [showOlder, setShowOlder] = useState(false);

  if (isLoading) return null;

  const experience = getItemsByType("experience") as Item[];
  const skills = getItemsByType("skill") as Item[];
  const softSkills = getItemsByType("soft_skill") as Item[];
  const languages = getItemsByType("language") as Item[];
  const education = getItemsByType("education") as Item[];
  const courses = getItemsByType("course") as Item[];
  const volunteering = getItemsByType("volunteer") as Item[];

  const summary = splitParagraphs(aboutText ?? "")[0] ?? "";
  const { recent, older } = splitExperiences(experience);
  const visibleExperience = showOlder ? experience : recent;
  const skillGroups = groupSkills(skills, t("resume.stack"));

  return (
    <>
      <SEO title={t("resume.title")} description={t("resume.subtitle")} url="/curriculo" />

      <IndexSection labelAs="div" label={<span className="ix-code">{copy.sheet} 002 — {t("resume.title")}</span>}>
        <h1 className="ix-title">{t("resume.title")}</h1>
        <p className="ix-desc">{summary ? <Highlighted text={summary} /> : t("resume.subtitle")}</p>
        <p className="ix-links">
          <button
            type="button"
            className="ix-btn"
            onClick={downloadCV}
            disabled={!canDownload}
            data-umami-event="resume-download-cv"
          >
            <Download size={15} aria-hidden="true" /> {t("resume.downloadCV")}
          </button>
        </p>
      </IndexSection>

      {metrics.length > 0 && (
        <IndexSection label={copy.inNumbers}>
          <IndexMetrics metrics={metrics} />
        </IndexSection>
      )}

      {experience.length > 0 && (
        <IndexSection label={t("resume.experience")}>
          <div className="ix-xp-head ix-xp-grid" aria-hidden="true">
            <span>{copy.period}</span>
            <span>{copy.role}</span>
            <span>{copy.company}</span>
            <span>{copy.summary}</span>
            <span />
          </div>
          <ol className="ix-xp">
            {visibleExperience.map((item) => (
              <ExperienceRow key={item.id} item={item} />
            ))}
          </ol>
          {older.length > 0 && (
            <p className="ix-more">
              <button type="button" className="ix-u" aria-expanded={showOlder} onClick={() => setShowOlder((v) => !v)}>
                {showOlder ? t("resume.hideOlder") : `${t("resume.showOlder")} (${older.length})`}
              </button>
            </p>
          )}
        </IndexSection>
      )}

      {skillGroups.length > 0 && (
        <IndexSection label={t("resume.skills")}>
          <dl style={{ margin: 0 }}>
            {skillGroups.map((g) => (
              <div key={g.name} className="ix-sv">
                <dt>{g.name}</dt>
                <dd>
                  <ul className="ix-inline">
                    {g.items.map((s) => (
                      <li key={s.id}>{label(s)}</li>
                    ))}
                  </ul>
                </dd>
              </div>
            ))}
          </dl>
        </IndexSection>
      )}

      {softSkills.length > 0 && (
        <IndexSection label={t("resume.softSkills")}>
          <ul className="ix-inline" style={{ fontSize: 15 }}>
            {softSkills.map((s) => (
              <li key={s.id}>{label(s)}</li>
            ))}
          </ul>
        </IndexSection>
      )}

      {languages.length > 0 && (
        <IndexSection label={t("resume.languages")}>
          <dl style={{ margin: 0 }}>
            {languages.map((l) => (
              <div key={l.id} className="ix-sv">
                <dt>{label(l)}</dt>
                <dd>{field(l, "level")}</dd>
              </div>
            ))}
          </dl>
        </IndexSection>
      )}

      {education.length > 0 && (
        <IndexSection label={t("resume.education")}>
          <ol className="ix-xp">
            {education.map((e) => (
              <li key={e.id} className="ix-xp-static">
                <div className="ix-xp-grid">
                  <span className="ix-num ix-muted">{field(e, "period")}</span>
                  <span className="ix-xp-role">{field(e, "degree")}</span>
                  <span>{field(e, "institution") || field(e, "school")}</span>
                  <div className="ix-muted">
                    <RichText html={field(e, "description")} />
                  </div>
                  <span />
                </div>
              </li>
            ))}
          </ol>
        </IndexSection>
      )}

      {courses.length > 0 && (
        <IndexSection label={t("resume.courses")}>
          <ol className="ix-cols" style={{ margin: 0, padding: 0, listStyle: "none", fontSize: 14.5 }}>
            {courses.map((c, i) => (
              <li key={c.id} style={{ display: "flex", gap: 12, breakInside: "avoid", padding: "4px 0" }}>
                <span className="ix-num ix-muted" style={{ fontFamily: "var(--font-mono)", fontSize: 12, paddingTop: 2 }}>
                  {catalogNumber(i + 1)}
                </span>
                <span>{label(c)}</span>
              </li>
            ))}
          </ol>
        </IndexSection>
      )}

      {volunteering.length > 0 && (
        <IndexSection label={t("resume.volunteer")}>
          <ol style={{ margin: 0, padding: 0, listStyle: "none", fontSize: 15 }}>
            {volunteering.map((v, i) => (
              <li key={v.id} style={{ display: "flex", gap: 12, padding: "4px 0" }}>
                <span className="ix-muted" style={{ fontFamily: "var(--font-mono)", fontSize: 12, paddingTop: 3 }}>
                  {catalogNumber(i + 1)}
                </span>
                <span>{label(v)}</span>
              </li>
            ))}
          </ol>
        </IndexSection>
      )}
    </>
  );
}
