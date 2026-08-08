import { useResume } from "@/hooks/useResume";
import { resumeRepository } from "@/repositories/instances";
import { SwissShell, SwissGridLines } from "@/components/SwissShared";

export default function SwissResume() {
  const { getItemsByType, isLoading } = useResume(resumeRepository);

  if (isLoading) return null;

  const experience = getItemsByType("experience");
  const skills = getItemsByType("skill");
  const courses = getItemsByType("course");
  const education = getItemsByType("education");
  const languages = getItemsByType("language");
  const softSkills = getItemsByType("soft_skill");
  const volunteering = getItemsByType("volunteer");

  return (
    <SwissShell page="Currículo" idx={2}>
      {/* Header */}
      <div
        style={{
          padding: "40px 18px",
          borderBottom: "2px solid var(--text)",
          position: "relative",
        }}
      >
        <SwissGridLines cols={12} />
        <div
          style={{
            position: "relative",
            display: "grid",
            gridTemplateColumns: "repeat(12, 1fr)",
            gap: 12,
          }}
        >
          <div
            style={{
              gridColumn: "span 2",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
            }}
          >
            Folha 02
            <br />
            de 05
          </div>
          <h1
            style={{
              gridColumn: "span 7",
              fontSize: 92,
              fontWeight: 900,
              letterSpacing: "-0.05em",
              margin: 0,
              lineHeight: 0.9,
            }}
          >
            Curriculum
            <br />
            <span
              style={{
                background: "var(--accent)",
                color: "var(--bg)",
                padding: "0 8px",
              }}
            >
              Vitæ.
            </span>
          </h1>
          <div
            style={{
              gridColumn: "span 3",
              fontSize: 13,
              lineHeight: 1.5,
              alignSelf: "end",
            }}
          >
            {experience.length} cargos, {skills.length} habilidades e {courses.length}{" "}
            certificações.
          </div>
        </div>
      </div>

      {/* Stats band */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          borderBottom: "2px solid var(--text)",
        }}
      >
        {[
          { n: String(experience.length), label: "cargos", tint: "var(--primary)" as string | null },
          { n: String(skills.length), label: "skills", tint: "var(--accent)" as string | null },
          { n: String(courses.length), label: "certs", tint: null },
        ].map((s, i) => (
          <div
            key={i}
            style={{
              padding: "24px 18px",
              borderRight: i < 2 ? "1px solid var(--text)" : "none",
              background: s.tint ?? "transparent",
              color: s.tint ? "var(--bg)" : "var(--text)",
            }}
          >
            <div
              style={{
                fontSize: 60,
                fontWeight: 900,
                lineHeight: 0.85,
                letterSpacing: "-0.04em",
              }}
            >
              {s.n}
            </div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                marginTop: 6,
              }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Experience */}
      <div style={{ padding: "40px 18px", borderBottom: "2px solid var(--text)" }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            marginBottom: 24,
          }}
        >
          .04 — Experiência Profissional
        </div>
        {experience.map((exp, i) => {
          const c = exp.translatedContent as {
            role?: string;
            company?: string;
            period?: string;
            description?: string;
          };
          return (
            <div
              key={exp.id}
              style={{
                display: "grid",
                gridTemplateColumns: "120px 200px 1fr",
                gap: 18,
                padding: "24px 0",
                borderTop: "1px solid var(--text)",
                borderBottom:
                  i === experience.length - 1 ? "1px solid var(--text)" : "none",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 44,
                    fontWeight: 900,
                    lineHeight: 0.85,
                    color: "var(--primary)",
                  }}
                >
                  0{i + 1}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 500,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    marginTop: 8,
                    opacity: 0.7,
                  }}
                >
                  {c.period}
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    letterSpacing: "-0.01em",
                    lineHeight: 1.2,
                  }}
                >
                  {c.role}
                </div>
                <div style={{ fontSize: 13, marginTop: 4, opacity: 0.7 }}>
                  @ {c.company}
                </div>
              </div>
              <div
                dangerouslySetInnerHTML={{ __html: c.description ?? "" }}
                style={{ fontSize: 12, lineHeight: 1.55, opacity: 0.85 }}
              />
            </div>
          );
        })}
      </div>

      {/* Skills */}
      <div style={{ padding: "40px 18px", borderBottom: "2px solid var(--text)" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 3fr",
            gap: 24,
            marginBottom: 28,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
            }}
          >
            .05 — Stack
          </div>
          <h3
            style={{
              fontSize: 34,
              fontWeight: 900,
              letterSpacing: "-0.02em",
              margin: 0,
              lineHeight: 1,
            }}
          >
            {skills.length} ferramentas, ordenadas por afinidade.
          </h3>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, 1fr)",
            gap: 4,
          }}
        >
          {[...skills]
            .sort((a, b) => {
              const la = (a.translatedContent as { level?: number })?.level ?? 0;
              const lb = (b.translatedContent as { level?: number })?.level ?? 0;
              return lb - la;
            })
            .map((s) => {
              const sc = s.translatedContent as { name?: string; level?: number };
              const level = sc.level ?? 0;
              return (
                <div
                  key={s.id}
                  style={{
                    padding: "10px 12px",
                    background:
                      level >= 90
                        ? "var(--primary)"
                        : level >= 80
                        ? "var(--text)"
                        : "transparent",
                    color: level >= 80 ? "var(--bg)" : "var(--text)",
                    border:
                      level < 80
                        ? "1px solid color-mix(in oklab, var(--text) 30%, transparent)"
                        : "none",
                    opacity: level >= 80 ? 1 : 0.85,
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {sc.name}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 500,
                      opacity: 0.7,
                      marginTop: 2,
                    }}
                  >
                    {level}/100
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Formação + Idiomas + Soft */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr 1fr",
          borderBottom: "2px solid var(--text)",
        }}
      >
        <div style={{ padding: "30px 18px", borderRight: "1px solid var(--text)" }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              marginBottom: 16,
            }}
          >
            .06 — Formação
          </div>
          {education.map((e, i) => {
            const ec = e.translatedContent as {
              degree?: string;
              period?: string;
              school?: string;
              items?: string[];
            };
            return (
              <div
                key={e.id}
                style={{
                  marginBottom: 20,
                  paddingBottom: 16,
                  borderBottom:
                    i < education.length - 1
                      ? "1px solid color-mix(in oklab, var(--text) 20%, transparent)"
                      : "none",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    marginBottom: 6,
                  }}
                >
                  <span
                    style={{
                      fontSize: 20,
                      fontWeight: 800,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {ec.degree}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                      opacity: 0.6,
                    }}
                  >
                    {ec.period}
                  </span>
                </div>
                <div style={{ fontSize: 12, opacity: 0.75 }}>{ec.school}</div>
                {(ec.items ?? []).map((it, j) => (
                  <p
                    key={j}
                    style={{
                      fontSize: 11,
                      lineHeight: 1.5,
                      opacity: 0.7,
                      margin: "6px 0 0",
                    }}
                  >
                    {it}
                  </p>
                ))}
              </div>
            );
          })}
        </div>

        <div style={{ padding: "30px 18px", borderRight: "1px solid var(--text)" }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              marginBottom: 16,
            }}
          >
            .07 — Idiomas
          </div>
          {languages.map((l) => {
            const lc = l.translatedContent as { name?: string; level?: string };
            return (
              <div
                key={l.id}
                style={{
                  padding: "8px 0",
                  borderBottom:
                    "1px solid color-mix(in oklab, var(--text) 18%, transparent)",
                }}
              >
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 800,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {lc.name}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    opacity: 0.6,
                  }}
                >
                  {lc.level}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ padding: "30px 18px" }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              marginBottom: 16,
            }}
          >
            .08 — Soft Skills
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {softSkills.map((s) => {
              const sc = s.translatedContent as { text?: string } | string;
              const label = typeof sc === "string" ? sc : sc.text ?? "";
              return (
                <span
                  key={s.id}
                  style={{
                    padding: "3px 8px",
                    background:
                      "color-mix(in oklab, var(--bg) 75%, var(--text) 25%)",
                    fontSize: 10,
                    fontWeight: 600,
                  }}
                >
                  {label}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Cursos + Voluntariado */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          borderBottom: "2px solid var(--text)",
        }}
      >
        <div style={{ padding: "30px 18px", borderRight: "1px solid var(--text)" }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              marginBottom: 16,
            }}
          >
            .09 — Cursos &amp; Certs ({courses.length})
          </div>
          <div
            style={{ columns: 2, columnGap: 18, fontSize: 11, lineHeight: 1.75 }}
          >
            {courses.map((c, i) => {
              const label =
                typeof c.translatedContent === "string"
                  ? c.translatedContent
                  : (c.translatedContent as { text?: string; name?: string })?.text ??
                    (c.translatedContent as { text?: string; name?: string })?.name ??
                    "";
              return (
                <div
                  key={c.id}
                  style={{ breakInside: "avoid", display: "flex", gap: 8 }}
                >
                  <span
                    style={{
                      fontWeight: 700,
                      opacity: 0.5,
                      fontVariantNumeric: "tabular-nums",
                      minWidth: 24,
                    }}
                  >
                    .{String(i + 1).padStart(2, "0")}
                  </span>
                  <span>{label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ padding: "30px 18px" }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              marginBottom: 16,
            }}
          >
            .10 — Voluntariado
          </div>
          {volunteering.map((v, i) => {
            const label =
              typeof v.translatedContent === "string"
                ? v.translatedContent
                : (v.translatedContent as { text?: string })?.text ?? "";
            return (
              <div
                key={v.id}
                style={{
                  padding: "10px 0",
                  borderBottom:
                    i < volunteering.length - 1
                      ? "1px solid color-mix(in oklab, var(--text) 18%, transparent)"
                      : "none",
                }}
              >
                <div style={{ display: "flex", gap: 8 }}>
                  <span style={{ fontWeight: 700, opacity: 0.6 }}>
                    .{String(i + 1).padStart(2, "0")}
                  </span>
                  <span style={{ fontSize: 11.5, lineHeight: 1.5 }}>{label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </SwissShell>
  );
}
