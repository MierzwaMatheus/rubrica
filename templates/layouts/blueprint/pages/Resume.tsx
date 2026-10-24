import { useState } from "react";
import { Download } from "lucide-react";
import { useResume } from "@/hooks/useResume";
import { useHome } from "@/hooks/useHome";
import { useHomeMetrics } from "@/hooks/useHomeMetrics";
import { useDownloadCV } from "@/hooks/useDownloadCV";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { resumeRepository, homeRepository } from "@/repositories/instances";
import { splitParagraphs } from "@/utils/aboutContent";
import { groupSkills, splitExperiences } from "@/utils/resumeContent";
import { Dim, Num, PageTitleBlock, Sheet, itemText, pad2, useBlueprintLabels } from "@/components/BlueprintShared";

interface ExperienceContent {
  role?: string;
  company?: string;
  period?: string;
  description?: string;
  items?: string[];
  groups?: { items: string[] }[];
}

interface EducationContent {
  degree?: string;
  institution?: string;
  period?: string;
}

interface Span {
  start: number;
  end: number;
}

/** Anos de um período como "2019 - 2023" ou "2024 - atual". Null se não houver ano. */
function parseSpan(period: string | undefined, now: number): Span | null {
  if (!period) return null;
  const years = (period.match(/\b(19|20)\d{2}\b/g) ?? []).map(Number);
  if (!years.length) return null;
  const ongoing = /atual|presente|hoje|present|current|now/i.test(period);
  const start = Math.min(...years);
  const end = ongoing ? Math.max(now, ...years) : Math.max(...years);
  return { start, end };
}

/** Marcas do eixo: todos os anos, ou de 2 em 2 / 5 em 5 quando o período é longo. */
function axisTicks(min: number, max: number): number[] {
  const span = max - min;
  const step = span > 24 ? 5 : span > 12 ? 2 : 1;
  const ticks: number[] = [];
  for (let y = min; y <= max; y += step) ticks.push(y);
  if (ticks[ticks.length - 1] !== max) ticks.push(max);
  return ticks;
}

type SheetKey = "sheet" | "specs" | "timeline" | "skills" | "education";

export default function BlueprintResume() {
  const { t } = useTranslation();
  const L = useBlueprintLabels();
  const { getItemsByType } = useResume(resumeRepository);
  const { aboutText } = useHome(homeRepository);
  const { metrics } = useHomeMetrics(homeRepository);
  const { downloadCV, canDownload } = useDownloadCV();
  const [showOlder, setShowOlder] = useState(false);

  const experiences = getItemsByType("experience");
  const skills = getItemsByType("skill");
  const softSkills = getItemsByType("soft_skill");
  const languages = getItemsByType("language");
  const education = getItemsByType("education");
  const courses = [...getItemsByType("course"), ...getItemsByType("certification")];
  const volunteering = [...getItemsByType("volunteer"), ...getItemsByType("volunteering")];
  const skillGroups = groupSkills(skills, t("resume.stack"));
  const { recent, older } = splitExperiences(experiences, 3);
  const visibleExperiences = showOlder ? experiences : recent;
  const summary = splitParagraphs(aboutText ?? "")[0] ?? "";

  // Eixo cotado: só entra quando os períodos têm ano.
  const now = new Date().getFullYear();
  const spans = visibleExperiences.map((e) => parseSpan((e.translatedContent as ExperienceContent)?.period, now));
  const known = spans.filter((s): s is Span => s !== null);
  const min = known.length ? Math.min(...known.map((s) => s.start)) : 0;
  const max = known.length ? Math.max(...known.map((s) => s.end)) : 0;
  const range = Math.max(max - min, 1);
  const ticks = known.length ? axisTicks(min, max) : [];
  const pct = (year: number) => ((year - min) / range) * 100;

  const hasSkills = skillGroups.length > 0 || softSkills.length > 0 || languages.length > 0;
  const hasEducation = education.length > 0 || courses.length > 0 || volunteering.length > 0;

  const visible: SheetKey[] = [
    "sheet",
    ...(metrics.length > 0 ? (["specs"] as const) : []),
    ...(experiences.length > 0 ? (["timeline"] as const) : []),
    ...(hasSkills ? (["skills"] as const) : []),
    ...(hasEducation ? (["education"] as const) : []),
  ];
  const total = visible.length;
  const num = (key: SheetKey) => visible.indexOf(key);

  return (
    <div className="bp-page">
      {/* Folha 00 — ficha técnica */}
      <Sheet n={num("sheet")} total={total} title={L.techSheet}>
        <Dim label={`${L.experiencesCount(experiences.length)} · ${skills.length} skills`} />
        <h1 className="bp-h1">{t("resume.title")}</h1>
        <p className="bp-lead">{summary || t("resume.subtitle")}</p>
        <div className="bp-row">
          <button
            type="button"
            className="bp-btn bp-btn--pri"
            onClick={downloadCV}
            disabled={!canDownload}
            data-umami-event="resume-download-cv"
          >
            <Download size={14} aria-hidden="true" /> {t("resume.downloadCV")}
          </button>
        </div>
      </Sheet>

      {/* Folha 01 — números de destaque */}
      {metrics.length > 0 && (
        <Sheet n={num("specs")} total={total} title={L.specs}>
          <dl className="bp-spec">
            {metrics.map((m, i) => (
              <div key={`${m.label}-${i}`}>
                <dt>
                  <span className="bp-spec-code" aria-hidden="true">
                    E{i + 1}
                  </span>
                  <span className="bp-spec-l">{m.label}</span>
                </dt>
                <dd className="bp-spec-v">{m.value}</dd>
              </div>
            ))}
          </dl>
        </Sheet>
      )}

      {/* Folha 02 — experiências num eixo cotado */}
      {experiences.length > 0 && (
        <Sheet n={num("timeline")} total={total} title={L.timeline} caption={t("resume.experience")}>
          {known.length > 0 && (
            <div className="bp-axis" aria-hidden="true">
              <Dim label={`${min} — ${max} · ${L.years(max - min)}`} />
              {spans.map((s, i) => (
                <div className="bp-axis-row" key={visibleExperiences[i].id}>
                  <Num>{i + 1}</Num>
                  <div className="bp-axis-track">
                    {s && (
                      <span
                        className="bp-axis-bar"
                        style={{ left: `${pct(s.start)}%`, width: `${Math.max(pct(s.end) - pct(s.start), 1.5)}%` }}
                      />
                    )}
                  </div>
                </div>
              ))}
              <div className="bp-axis-scale">
                <span />
                <div className="bp-axis-ticks">
                  {ticks.map((y, i) => (
                    <span
                      key={y}
                      className={`bp-axis-tick ${i === 0 ? "bp-axis-tick--first" : i === ticks.length - 1 ? "bp-axis-tick--last" : "bp-axis-tick--mid"}`}
                      style={{ left: `${pct(y)}%` }}
                    >
                      <span>{y}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          <ol className="bp-exp">
            {visibleExperiences.map((exp, i) => {
              const c = (exp.translatedContent ?? {}) as ExperienceContent;
              const bullets = c.groups ? c.groups.flatMap((g) => g.items) : c.items ?? [];
              return (
                <li key={exp.id}>
                  <Num>{i + 1}</Num>
                  <div>
                    <h3 className="bp-h3">{c.role}</h3>
                    {c.company && <p className="bp-exp-company">{c.company}</p>}
                    {c.description ? (
                      <div className="bp-rich" dangerouslySetInnerHTML={{ __html: c.description }} />
                    ) : (
                      bullets.length > 0 && (
                        <div className="bp-rich">
                          <ul>
                            {bullets.map((b, j) => (
                              <li key={j}>{b}</li>
                            ))}
                          </ul>
                        </div>
                      )
                    )}
                  </div>
                  {c.period && <span className="bp-exp-period">{c.period}</span>}
                </li>
              );
            })}
          </ol>
          {older.length > 0 && (
            <div className="bp-all">
              <button type="button" className="bp-btn" onClick={() => setShowOlder((v) => !v)} aria-expanded={showOlder}>
                {showOlder ? t("resume.hideOlder") : `${t("resume.showOlder")} (${older.length})`}
              </button>
            </div>
          )}
          {!hasSkills && !hasEducation && <PageTitleBlock page={t("resume.title")} sheets={total - 1} />}
        </Sheet>
      )}

      {/* Folha 03 — habilidades por grupo como tabela de especificação */}
      {hasSkills && (
        <Sheet n={num("skills")} total={total} title={L.skillsSpec} caption={t("resume.skills")}>
          {skillGroups.length > 0 && (
            <table className="bp-table bp-table--stack">
              <caption className="bp-sr">{t("resume.skills")}</caption>
              <thead>
                <tr>
                  <th scope="col">{L.group}</th>
                  <th scope="col">{L.items}</th>
                  <th scope="col" className="bp-num">
                    {L.qty}
                  </th>
                </tr>
              </thead>
              <tbody>
                {skillGroups.map((g) => (
                  <tr key={g.name}>
                    <td data-label={L.group}>{g.name}</td>
                    <td data-label={L.items}>
                      <ul className="bp-inline-list">
                        {g.items.map((s) => (
                          <li key={s.id}>{itemText(s.translatedContent)}</li>
                        ))}
                      </ul>
                    </td>
                    <td data-label={L.qty} className="bp-num">
                      {pad2(g.items.length)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {(softSkills.length > 0 || languages.length > 0) && (
            <div className="bp-split" style={{ marginTop: skillGroups.length > 0 ? 28 : 0 }}>
              {softSkills.length > 0 && (
                <div>
                  <h3 className="bp-block-title">{t("resume.softSkills")}</h3>
                  <ul className="bp-codes">
                    {softSkills.map((s, i) => (
                      <li key={s.id}>
                        <span aria-hidden="true">S-{pad2(i + 1)}</span>
                        <span>{itemText(s.translatedContent)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {languages.length > 0 && (
                <div>
                  <h3 className="bp-block-title">{t("resume.languages")}</h3>
                  <table className="bp-table">
                    <thead>
                      <tr>
                        <th scope="col">{L.language}</th>
                        <th scope="col" className="bp-num">
                          {L.level}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {languages.map((l) => {
                        const c = (l.translatedContent ?? {}) as { name?: string; level?: string };
                        return (
                          <tr key={l.id}>
                            <td className="bp-sans">{c.name ?? itemText(l.translatedContent)}</td>
                            <td className="bp-num">{c.level}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          {!hasEducation && <PageTitleBlock page={t("resume.title")} sheets={total - 1} />}
        </Sheet>
      )}

      {/* Folha 04 — formação, cursos e voluntariado */}
      {hasEducation && (
        <Sheet n={num("education")} total={total} title={L.education}>
          {education.length > 0 && (
            <div className="bp-block">
              <h3 className="bp-block-title">{t("resume.education")}</h3>
              <table className="bp-table bp-table--stack">
                <thead>
                  <tr>
                    <th scope="col">{L.course}</th>
                    <th scope="col">{L.institution}</th>
                    <th scope="col" className="bp-num">
                      {L.period}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {education.map((e) => {
                    const c = (e.translatedContent ?? {}) as EducationContent;
                    return (
                      <tr key={e.id}>
                        <td data-label={L.course} className="bp-sans">
                          {c.degree}
                        </td>
                        <td data-label={L.institution}>{c.institution}</td>
                        <td data-label={L.period} className="bp-num">
                          {c.period}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {(courses.length > 0 || volunteering.length > 0) && (
            <div className="bp-split bp-block">
              {courses.length > 0 && (
                <div>
                  <h3 className="bp-block-title">{t("resume.courses")}</h3>
                  <ul className="bp-codes">
                    {courses.map((c, i) => (
                      <li key={c.id}>
                        <span aria-hidden="true">C-{pad2(i + 1)}</span>
                        <span>{itemText(c.translatedContent)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {volunteering.length > 0 && (
                <div>
                  <h3 className="bp-block-title">{t("resume.volunteer")}</h3>
                  <ul className="bp-codes">
                    {volunteering.map((v, i) => (
                      <li key={v.id}>
                        <span aria-hidden="true">V-{pad2(i + 1)}</span>
                        <span>{itemText(v.translatedContent)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
          <PageTitleBlock page={t("resume.title")} sheets={total - 1} />
        </Sheet>
      )}

      {/* Sem nenhuma folha de conteúdo, o carimbo fecha a ficha técnica */}
      {total === 1 || (total === 2 && metrics.length > 0) ? <PageTitleBlock page={t("resume.title")} sheets={total - 1} /> : null}
    </div>
  );
}
