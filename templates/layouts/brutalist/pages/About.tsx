import { useAbout } from "@/hooks/useAbout";
import { useHome } from "@/hooks/useHome";
import { useWorkPrinciples } from "@/hooks/useWorkPrinciples";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { aboutRepository, homeRepository } from "@/repositories/instances";
import { splitParagraphs } from "@/utils/aboutContent";
import { highlightNumbers } from "@/utils/homeContent";

function Highlighted({ text }: { text: string }) {
  return (
    <>
      {highlightNumbers(text).map((seg, i) =>
        seg.highlight ? (
          <b key={i} style={{ color: "var(--primary)" }}>{seg.text}</b>
        ) : (
          <span key={i}>{seg.text}</span>
        ),
      )}
    </>
  );
}

function AsciiRule({ char = "─", label }: { char?: string; label?: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        margin: "14px 0",
        fontFamily: "var(--font-mono)",
        fontSize: 11,
        opacity: 0.7,
        color: "var(--text)",
      }}
    >
      {label ? (
        <>
          <span style={{ color: "var(--accent)" }}>{char.repeat(3)}</span>
          <span
            style={{
              color: "var(--primary)",
              textTransform: "uppercase",
              letterSpacing: "0.18em",
              fontWeight: 700,
            }}
          >
            [ {label} ]
          </span>
          <span style={{ flex: 1, color: "var(--accent)", overflow: "hidden" }}>
            {char.repeat(200)}
          </span>
        </>
      ) : (
        <span style={{ flex: 1, overflow: "hidden" }}>{char.repeat(200)}</span>
      )}
    </div>
  );
}

function BrutPrompt({
  cmd,
  output,
  host = "user@rubrica",
}: {
  cmd: string;
  output?: React.ReactNode;
  host?: string;
}) {
  return (
    <div
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: 13,
        lineHeight: 1.55,
        whiteSpace: "pre-wrap",
      }}
    >
      <div>
        <span style={{ color: "var(--accent)" }}>{host}</span>
        <span style={{ opacity: 0.7 }}>:~$ </span>
        <span style={{ color: "var(--primary)", fontWeight: 700 }}>{cmd}</span>
      </div>
      {output && <div style={{ marginTop: 6 }}>{output}</div>}
    </div>
  );
}

export default function About() {
  const { t } = useTranslation();
  const { aboutText } = useHome(homeRepository);
  const { dailyRoutine, faq } = useAbout(aboutRepository);
  const { principles } = useWorkPrinciples(homeRepository);

  const bio = splitParagraphs(aboutText ?? "");
  const personal = splitParagraphs(t("about.aboutMe.text"));

  return (
    <div
      style={{
        minHeight: "100%",
        background: "var(--bg)",
        color: "var(--text)",
        fontFamily: "var(--font-mono)",
        fontSize: 13,
        lineHeight: 1.55,
        padding: "24px 28px",
      }}
    >
      <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 8 }}>
        // professional · method · personal
      </div>
      <h1
        style={{ fontSize: "clamp(22px, 6.5vw, 28px)", overflowWrap: "anywhere", fontWeight: 700, margin: "4px 0 14px" }}
      >
        $ cat about.txt
      </h1>

      <AsciiRule label={t("about.professional.title")} />

      <BrutPrompt
        cmd="head -n 30 ~/about.txt"
        output={
          <div
            style={{
              marginTop: 8,
              paddingLeft: 14,
              borderLeft: "2px solid var(--primary)",
            }}
          >
            {bio.map((p, i) => (
              <p
                key={i}
                style={{
                  fontSize: 13,
                  lineHeight: 1.7,
                  margin: "0 0 14px",
                }}
              >
                <span
                  style={{ color: "var(--accent)", marginRight: 8 }}
                >
                  {String(i + 1).padStart(2, "0")}|
                </span>
                <Highlighted text={p} />
              </p>
            ))}
          </div>
        }
      />

      {principles.length > 0 && (
        <>
          <AsciiRule label={t("about.principles.title")} />
          <BrutPrompt
            cmd="cat ~/method.md"
            output={
              <div
                style={{
                  marginTop: 8,
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                  border: "1px solid var(--text)",
                }}
              >
                {principles.map((pr, i) => (
                  <div
                    key={pr.title}
                    style={{
                      padding: 16,
                      borderLeft: i === 0 ? "none" : "1px solid var(--text)",
                      whiteSpace: "normal",
                    }}
                  >
                    <div style={{ fontWeight: 700, marginBottom: 6 }}>
                      <span style={{ color: "var(--primary)" }}>[{String(i + 1).padStart(2, "0")}]</span> {pr.title}
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.82, lineHeight: 1.6 }}>{pr.description}</div>
                  </div>
                ))}
              </div>
            }
          />
        </>
      )}

      {personal.length > 0 && (
        <>
          <AsciiRule label={t("about.aboutMe.title")} />
          <BrutPrompt
            cmd="cat ~/offline.txt"
            output={
              <div style={{ marginTop: 8, paddingLeft: 14, borderLeft: "2px solid var(--accent)" }}>
                {personal.map((p, i) => (
                  <p key={i} style={{ fontSize: 13, lineHeight: 1.7, margin: "0 0 14px" }}>{p}</p>
                ))}
              </div>
            }
          />
        </>
      )}

      <AsciiRule label="daily.snapshots" />

      <BrutPrompt
        cmd="find ~/photos -type f -name '*.jpg'"
        output={
          <div
            style={{ marginTop: 10, border: "1px solid var(--text)" }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
              }}
            >
              {dailyRoutine.map((g, i) => (
                <div
                  key={g.id}
                  style={{
                    borderRight:
                      (i + 1) % 3 !== 0 ? "1px solid var(--text)" : "none",
                    borderBottom:
                      i < dailyRoutine.length - 3
                        ? "1px solid var(--text)"
                        : "none",
                  }}
                >
                  <img
                    src={g.image_url}
                    alt={g.description}
                    style={{
                      width: "100%",
                      aspectRatio: "4/3",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                  <div
                    style={{
                      padding: "6px 10px",
                      fontSize: 11,
                      opacity: 0.7,
                      borderTop: "1px dashed var(--text)",
                    }}
                  >
                    <span style={{ color: "var(--primary)" }}>›</span>{" "}
                    img_{String(i + 1).padStart(3, "0")}.jpg
                    <span style={{ opacity: 0.55, float: "right" }}>
                      {g.description}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        }
      />

      <AsciiRule label="faq.txt" />

      <BrutPrompt
        cmd="cat faq.txt | less"
        output={
          <div style={{ marginTop: 10 }}>
            {faq.map((f, i) => (
              <details
                key={f.id}
                open={i === 0}
                style={{
                  border: "1px solid var(--text)",
                  marginBottom: 6,
                  padding: "10px 14px",
                  background: i === 0 ? "var(--text)" : "transparent",
                  color: i === 0 ? "var(--bg)" : "var(--text)",
                }}
              >
                <summary
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "default",
                    listStyle: "none",
                    display: "flex",
                    alignItems: "baseline",
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      color:
                        i === 0 ? "var(--accent)" : "var(--primary)",
                    }}
                  >
                    Q{String(i + 1).padStart(2, "0")}.
                  </span>
                  <span style={{ flex: 1 }}>{f.question}</span>
                  <span style={{ opacity: 0.5 }}>
                    [{i === 0 ? "−" : "+"}]
                  </span>
                </summary>
                <p
                  style={{
                    fontSize: 12,
                    lineHeight: 1.7,
                    margin: "10px 0 0 30px",
                    opacity: i === 0 ? 0.95 : 0.85,
                  }}
                >
                  <span
                    style={{
                      color:
                        i === 0 ? "var(--accent)" : "var(--primary)",
                      marginRight: 8,
                    }}
                  >
                    A.
                  </span>
                  {f.answer}
                </p>
              </details>
            ))}
          </div>
        }
      />
    </div>
  );
}
