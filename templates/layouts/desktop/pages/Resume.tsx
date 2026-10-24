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
import { homeRepository, resumeRepository } from "@/repositories/instances";
import {
  Highlighted,
  ICON_COLORS,
  MetricsGrid,
  Window,
  WindowCluster,
  WindowStack,
  useDesktopCopy,
} from "@/components/DesktopShared";

interface ResumeEntry {
  id: string;
  translatedContent?: unknown;
}

/** Lê um campo de texto do conteúdo traduzido (o banco guarda `any`). */
function field(item: ResumeEntry, ...keys: string[]): string {
  const content = item.translatedContent;
  if (typeof content === "string") return content;
  if (!content || typeof content !== "object") return "";
  for (const key of keys) {
    const value = (content as Record<string, unknown>)[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  return "";
}

const EXPERIENCE_COLS = { "--desktop-cols": "120px minmax(0, 1.3fr) minmax(0, 1fr)" } as React.CSSProperties;

export default function DesktopResume() {
  const { t } = useTranslation();
  const copy = useDesktopCopy();
  const { getItemsByType, isLoading } = useResume(resumeRepository);
  const { aboutText, contactName, contactRole } = useHome(homeRepository);
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
  const volunteer = getItemsByType("volunteer");

  const summary = splitParagraphs(aboutText)[0] ?? "";
  const { recent, older } = splitExperiences(experience);
  const visibleExperience = showOlder ? experience : recent;
  const skillGroups = groupSkills(skills, t("resume.stack"));

  return (
    <>
      <SEO title={t("resume.title")} description={t("resume.subtitle")} url="/curriculo" />
      <WindowStack>
        {/* Currículo.txt: resumo e o PDF logo no topo */}
        <Window title={copy.resumeFile} titleAs="div" active width={720}>
          <div className="dk-pad dk-hero">
            {(contactName || contactRole) && (
              <p className="dk-role">
                &gt; {[contactName, contactRole].filter(Boolean).join(" · ")}
              </p>
            )}
            <h1>{t("resume.title")}</h1>
            {summary ? (
              <p className="dk-txt" style={{ display: "block" }}>
                <Highlighted text={summary} />
              </p>
            ) : (
              <p className="dk-desc">{t("resume.subtitle")}</p>
            )}
            <div className="dk-row">
              <button
                type="button"
                className="dk-btn pri def"
                onClick={downloadCV}
                disabled={!canDownload}
                data-umami-event="resume-download-cv"
              >
                <Download size={15} aria-hidden="true" />
                {t("resume.downloadCV")}
              </button>
            </div>
          </div>
        </Window>

        {metrics.length > 0 && (
          <Window title={copy.numbers} width={440} offset={380}>
            <MetricsGrid metrics={metrics} />
          </Window>
        )}

        {/* Experiências: janela em modo lista, as antigas recolhidas */}
        {experience.length > 0 && (
          <Window
            title={t("resume.experience")}
            width={900}
            offset={40}
            status={
              <>
                <span>{copy.items(experience.length)}</span>
                {older.length > 0 && (
                  <button type="button" aria-expanded={showOlder} onClick={() => setShowOlder((v) => !v)}>
                    {showOlder ? t("resume.hideOlder") : `${t("resume.showOlder")} (${older.length})`}
                  </button>
                )}
              </>
            }
          >
            <div className="dk-lh" style={EXPERIENCE_COLS} aria-hidden="true">
              <span>{copy.colPeriod}</span>
              <span>{copy.colRole}</span>
              <span>{copy.colCompany}</span>
            </div>
            <ul className="dk-list">
              {visibleExperience.map((item) => {
                const description = field(item, "description");
                return (
                  <li key={item.id} className="dk-li" style={EXPERIENCE_COLS}>
                    <span className="dk-mono dk-muted">{field(item, "period")}</span>
                    <h3 className="dk-li-name">{field(item, "role")}</h3>
                    <span>{field(item, "company")}</span>
                    {description && (
                      <div
                        className="dk-li-desc dk-li-full"
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(description) }}
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          </Window>
        )}

        {/* Habilidades: Painel de Controle agrupado (sem níveis numéricos) */}
        {(skillGroups.length > 0 || softSkills.length > 0) && (
          <Window title={copy.controlPanel} titleAs="div" width={820} offset={160}>
            <h2 className="dk-sr">{t("resume.skills")}</h2>
            <ul className="dk-panels">
              {skillGroups.map((group, i) => (
                <li key={group.name} className="dk-panel dk-panel-col">
                  <h3 className="dk-panel-head">
                    <span
                      className="dk-sq"
                      aria-hidden="true"
                      style={{ "--desktop-ic": ICON_COLORS[i % ICON_COLORS.length], marginTop: 0 } as React.CSSProperties}
                    />
                    {group.name}
                  </h3>
                  <ul className="dk-chips">
                    {group.items.map((skill) => (
                      <li key={skill.id} className="dk-chip">
                        {field(skill, "name", "text")}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
              {softSkills.length > 0 && (
                <li className="dk-panel dk-panel-col">
                  <h3 className="dk-panel-head">
                    <span
                      className="dk-sq"
                      aria-hidden="true"
                      style={{ "--desktop-ic": ICON_COLORS[skillGroups.length % ICON_COLORS.length], marginTop: 0 } as React.CSSProperties}
                    />
                    {t("resume.softSkills")}
                  </h3>
                  <ul className="dk-chips">
                    {softSkills.map((item) => (
                      <li key={item.id} className="dk-chip">
                        {field(item, "text", "name")}
                      </li>
                    ))}
                  </ul>
                </li>
              )}
            </ul>
          </Window>
        )}

        {/* Janelas menores: idiomas, formação, cursos e voluntariado */}
        {(languages.length > 0 || education.length > 0 || courses.length > 0 || volunteer.length > 0) && (
          <WindowCluster>
            {languages.length > 0 && (
              <Window title={t("resume.languages")} width={300}>
                <ul className="dk-list">
                  {languages.map((item) => (
                    <li key={item.id} className="dk-li" style={{ "--desktop-cols": "minmax(0, 1fr) auto" } as React.CSSProperties}>
                      <span className="dk-li-name">{field(item, "name", "text")}</span>
                      <span className="dk-mono dk-muted">{field(item, "level")}</span>
                    </li>
                  ))}
                </ul>
              </Window>
            )}
            {education.length > 0 && (
              <Window title={t("resume.education")} width={460} drop={36}>
                <ul className="dk-list">
                  {education.map((item) => {
                    const description = field(item, "description");
                    return (
                      <li key={item.id} className="dk-li" style={{ "--desktop-cols": "minmax(0, 1fr)" } as React.CSSProperties}>
                        <h3 className="dk-li-name">{field(item, "degree", "name")}</h3>
                        <span>
                          {field(item, "institution")}
                          {field(item, "period") && <span className="dk-mono dk-muted"> · {field(item, "period")}</span>}
                        </span>
                        {description && (
                          <div
                            className="dk-li-desc"
                            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(description) }}
                          />
                        )}
                      </li>
                    );
                  })}
                </ul>
              </Window>
            )}
            {courses.length > 0 && (
              <Window title={t("resume.courses")} width={420} drop={12}>
                <ul className="dk-list">
                  {courses.map((item) => (
                    <li key={item.id} className="dk-li" style={{ "--desktop-cols": "minmax(0, 1fr)" } as React.CSSProperties}>
                      <span>{field(item, "text", "name")}</span>
                    </li>
                  ))}
                </ul>
              </Window>
            )}
            {volunteer.length > 0 && (
              <Window title={t("resume.volunteer")} width={420} drop={40}>
                <ul className="dk-list">
                  {volunteer.map((item) => (
                    <li key={item.id} className="dk-li" style={{ "--desktop-cols": "minmax(0, 1fr)" } as React.CSSProperties}>
                      <span>{field(item, "text", "name", "description")}</span>
                    </li>
                  ))}
                </ul>
              </Window>
            )}
          </WindowCluster>
        )}
      </WindowStack>
    </>
  );
}
