import { useState } from "react";
import { useResume } from "@/hooks/useResume";
import { useHome } from "@/hooks/useHome";
import { useHomeMetrics } from "@/hooks/useHomeMetrics";
import { useDownloadCV } from "@/hooks/useDownloadCV";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { resumeRepository, homeRepository } from "@/repositories/instances";
import { splitParagraphs } from "@/utils/aboutContent";
import { groupSkills, splitExperiences } from "@/utils/resumeContent";
import { Award, Download, Heart, Languages } from "lucide-react";

function BentoCard({
  children,
  span = "auto",
  tint,
  padding = 22,
  radius = 22,
  style = {},
}: {
  children: React.ReactNode;
  span?: number | "auto";
  tint?: string;
  padding?: number;
  radius?: number;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        gridColumn: span === "auto" ? "auto" : `span ${span}`,
        background: tint || "color-mix(in srgb, var(--text) 10%, var(--bg))",
        borderRadius: radius,
        padding,
        border: "0.5px solid color-mix(in srgb, var(--text) 20%, transparent)",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export default function BentoResume() {
  const { t } = useTranslation();
  const { getItemsByType } = useResume(resumeRepository);
  const { aboutText } = useHome(homeRepository);
  const { metrics } = useHomeMetrics(homeRepository);
  const { downloadCV, canDownload } = useDownloadCV();
  const [showOlder, setShowOlder] = useState(false);
  const summary = splitParagraphs(aboutText ?? "")[0] ?? "";

  const experiences = getItemsByType("experience");
  const skills = getItemsByType("skill");
  const softSkills = getItemsByType("soft_skill");
  const languages = getItemsByType("language");
  const education = getItemsByType("education");
  const certs = getItemsByType("certification");
  const volunteering = getItemsByType("volunteering");
  const skillGroups = groupSkills(skills, t("resume.stack"));
  const { recent, older } = splitExperiences(experiences, 3);
  const visibleExperiences = showOlder ? experiences : recent;

  const gap = 14;

  return (
    <div
      style={{
        paddingTop: 84,
        paddingBottom: 110,
        paddingLeft: 28,
        paddingRight: 28,
        boxSizing: "border-box",
      }}
    >
      {/* Header stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(12, 1fr)",
          gap,
          marginBottom: gap,
        }}
      >
        <BentoCard span={6} padding={28}>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10.5,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "var(--text)",
              marginBottom: 12,
            }}
          >
            $ cat resume.md
          </div>
          <h1
            style={{
              fontSize: 52,
              margin: 0,
              fontWeight: 700,
              letterSpacing: "-0.03em",
              lineHeight: 0.95,
            }}
          >
            Trajetória
          </h1>
          {summary && (
            <p style={{ fontSize: 13.5, lineHeight: 1.55, opacity: 0.8, margin: "14px 0 0", maxWidth: 560 }}>
              {summary}
            </p>
          )}
          <div style={{ marginTop: "auto", paddingTop: 18 }}>
            <button
              type="button"
              onClick={downloadCV}
              disabled={!canDownload}
              data-umami-event="resume-download-cv"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 16px",
                borderRadius: 14,
                background: "var(--primary)",
                color: "var(--bg)",
                fontWeight: 700,
                fontSize: 13,
                border: "none",
                cursor: canDownload ? "pointer" : "default",
                opacity: canDownload ? 1 : 0.5,
              }}
            >
              <Download size={15} /> {t("resume.downloadCV")}
            </button>
          </div>
        </BentoCard>
        <BentoCard
          span={2}
          padding={22}
          tint="var(--primary)"
          style={{ color: "var(--bg)" }}
        >
          <div style={{ fontSize: 56, fontWeight: 700, lineHeight: 0.9 }}>
            {experiences.length}+
          </div>
          <div style={{ fontSize: 12, marginTop: 6, opacity: 0.85 }}>
            experiências
            <br />
            profissionais
          </div>
        </BentoCard>
        <BentoCard span={2} padding={20}>
          <Award size={18} />
          <div style={{ fontSize: 30, fontWeight: 700, marginTop: 8 }}>{certs.length}</div>
          <div style={{ fontSize: 11, opacity: 0.6 }}>certificações</div>
        </BentoCard>
        <BentoCard
          span={2}
          padding={20}
          tint="var(--accent)"
          style={{ color: "var(--text)" }}
        >
          <Languages size={18} />
          <div style={{ fontSize: 30, fontWeight: 700, marginTop: 8 }}>{languages.length}</div>
          <div style={{ fontSize: 11, opacity: 0.85 }}>idiomas</div>
        </BentoCard>
      </div>

      {/* Números de prova (os mesmos da home) */}
      {metrics.length > 0 && (
        <div data-m-cols="2"
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${metrics.length}, 1fr)`,
            gap,
            marginBottom: gap,
          }}
        >
          {metrics.map((m) => (
            <BentoCard key={m.label} padding={20}>
              <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1 }}>{m.value}</div>
              <div style={{ fontSize: 12, lineHeight: 1.4, marginTop: 8, opacity: 0.72 }}>{m.label}</div>
            </BentoCard>
          ))}
        </div>
      )}

      {/* Experience cards */}
      {experiences.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap,
            marginBottom: gap,
          }}
        >
          {visibleExperiences.map((exp, idx) => {
            const c = exp.translatedContent as {
              role?: string;
              company?: string;
              period?: string;
              items?: string[];
              groups?: { items: string[] }[];
            };
            const bulletPoints = c.groups
              ? c.groups.flatMap((g) => g.items)
              : c.items ?? [];
            return (
              <BentoCard
                key={exp.id}
                padding={22}
                style={idx === 0 ? { background: "color-mix(in srgb, var(--text) 10%, transparent)" } : {}}
              >
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    letterSpacing: "0.14em",
                    opacity: 0.55,
                    marginBottom: 6,
                  }}
                >
                  {c.period}
                </div>
                <h3
                  style={{
                    fontSize: 17,
                    margin: "0 0 4px",
                    fontWeight: 700,
                    lineHeight: 1.2,
                  }}
                >
                  {c.role}
                </h3>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--primary)",
                    fontWeight: 600,
                    marginBottom: 12,
                  }}
                >
                  @ {c.company}
                </div>
                <div
                  style={{
                    fontSize: 11.5,
                    lineHeight: 1.55,
                    opacity: 0.78,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  {bulletPoints.slice(0, 3).map((item, i) => (
                    <div key={i} style={{ paddingLeft: 12, position: "relative" }}>
                      <span
                        style={{
                          position: "absolute",
                          left: 0,
                          color: "var(--text)",
                        }}
                      >
                        ▸
                      </span>
                      {typeof item === "string" && item.length > 140
                        ? item.slice(0, 140) + "…"
                        : item}
                    </div>
                  ))}
                </div>
              </BentoCard>
            );
          })}
        </div>
      )}

      {older.length > 0 && (
        <div style={{ display: "flex", justifyContent: "center", marginBottom: gap }}>
          <button
            type="button"
            onClick={() => setShowOlder((v) => !v)}
            style={{
              padding: "8px 16px",
              borderRadius: 999,
              border: "1px solid color-mix(in srgb, var(--text) 20%, transparent)",
              background: "transparent",
              color: "var(--text)",
              fontSize: 12.5,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            {showOlder ? t("resume.hideOlder") : `${t("resume.showOlder")} (${older.length})`}
          </button>
        </div>
      )}

      {/* Skills + soft skills + languages */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(12, 1fr)",
          gap,
          marginBottom: gap,
        }}
      >
        {skills.length > 0 && (
          <BentoCard span={8} padding={24}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: 14,
              }}
            >
              <h3 style={{ fontSize: 16, margin: 0, fontWeight: 700 }}>Stack técnico</h3>
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  opacity: 0.55,
                }}
              >
                {skillGroups.length} {skillGroups.length === 1 ? "grupo" : "grupos"}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {skillGroups.map((group, gi) => (
                <div key={group.name}>
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 10.5,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      opacity: 0.55,
                      marginBottom: 8,
                    }}
                  >
                    {group.name}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {group.items.map((s) => {
                      const c = s.translatedContent as { name?: string };
                      return (
                        <span
                          key={s.id}
                          style={{
                            padding: "6px 11px",
                            borderRadius: 10,
                            background: gi === 0 ? "var(--primary)" : "color-mix(in srgb, var(--text) 20%, transparent)",
                            color: gi === 0 ? "var(--bg)" : "var(--text)",
                            fontSize: 11.5,
                            fontWeight: 500,
                          }}
                        >
                          {c.name}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </BentoCard>
        )}
        <BentoCard span={4} padding={22}>
          {softSkills.length > 0 && (
            <>
              <h3 style={{ fontSize: 16, margin: "0 0 12px", fontWeight: 700 }}>
                Soft Skills
              </h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {softSkills.map((s) => {
                  const c = s.translatedContent as { name?: string; text?: string } | string;
                  const name = typeof c === "string" ? c : c?.name ?? c?.text ?? "";
                  return (
                    <span
                      key={s.id}
                      style={{
                        padding: "5px 10px",
                        borderRadius: 999,
                        background: "color-mix(in srgb, var(--text) 20%, transparent)",
                        fontSize: 10.5,
                        fontWeight: 500,
                      }}
                    >
                      {name}
                    </span>
                  );
                })}
              </div>
            </>
          )}
          {languages.length > 0 && (
            <div
              style={{
                marginTop: 18,
                paddingTop: 16,
                borderTop: "0.5px solid color-mix(in srgb, var(--text) 20%, transparent)",
              }}
            >
              <h4 style={{ fontSize: 14, margin: "0 0 10px", fontWeight: 700 }}>Idiomas</h4>
              {languages.map((l) => {
                const c = l.translatedContent as { name?: string; level?: string };
                return (
                  <div
                    key={l.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      padding: "4px 0",
                      fontSize: 12,
                    }}
                  >
                    <span>{c.name}</span>
                    <span
                      style={{ opacity: 0.6, fontFamily: "var(--font-mono)" }}
                    >
                      {c.level}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </BentoCard>
      </div>

      {/* Education + Certs + Volunteering */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(12, 1fr)",
          gap,
        }}
      >
        {education.length > 0 && (
          <BentoCard span={5} padding={22}>
            <h3 style={{ fontSize: 16, margin: "0 0 14px", fontWeight: 700 }}>Formação</h3>
            {education.map((e) => {
              const c = e.translatedContent as {
                degree?: string;
                institution?: string;
                period?: string;
              };
              return (
                <div
                  key={e.id}
                  style={{
                    marginBottom: 14,
                    paddingBottom: 14,
                    borderBottom: "0.5px solid color-mix(in srgb, var(--text) 20%, transparent)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{c.degree}</span>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 10,
                        opacity: 0.55,
                      }}
                    >
                      {c.period}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--text)",
                      marginTop: 2,
                    }}
                  >
                    {c.institution}
                  </div>
                </div>
              );
            })}
          </BentoCard>
        )}
        {certs.length > 0 && (
          <BentoCard span={4} padding={22}>
            <h3 style={{ fontSize: 16, margin: "0 0 12px", fontWeight: 700 }}>
              Cursos &amp; Certs
            </h3>
            <div
              style={{
                fontSize: 11.5,
                lineHeight: 1.6,
                opacity: 0.85,
                maxHeight: 240,
                overflow: "hidden",
                position: "relative",
              }}
            >
              {certs.map((c) => {
                const content = c.translatedContent as { name?: string } | string;
                const name = typeof content === "string" ? content : content?.name ?? "";
                return (
                  <div
                    key={c.id}
                    style={{
                      padding: "3px 0",
                      borderBottom: "0.5px dotted color-mix(in srgb, var(--text) 20%, transparent)",
                    }}
                  >
                    <span
                      style={{
                        color: "var(--primary)",
                        marginRight: 6,
                      }}
                    >
                      ◆
                    </span>
                    {name}
                  </div>
                );
              })}
            </div>
          </BentoCard>
        )}
        {volunteering.length > 0 && (
          <BentoCard span={3} padding={22} style={{ background: "color-mix(in srgb, var(--text) 10%, transparent)" }}>
            <Heart size={18} />
            <h3 style={{ fontSize: 14, margin: "10px 0 10px", fontWeight: 700 }}>
              Voluntariado
            </h3>
            {volunteering.map((v, i) => {
              const c = v.translatedContent as { name?: string; description?: string } | string;
              const text = typeof c === "string" ? c : c?.description ?? c?.name ?? "";
              return (
                <div
                  key={v.id}
                  style={{
                    fontSize: 11,
                    lineHeight: 1.5,
                    opacity: 0.85,
                    padding: "6px 0",
                    borderTop: i > 0 ? "0.5px dotted color-mix(in srgb, var(--text) 20%, transparent)" : "none",
                  }}
                >
                  {text}
                </div>
              );
            })}
          </BentoCard>
        )}
      </div>
    </div>
  );
}
