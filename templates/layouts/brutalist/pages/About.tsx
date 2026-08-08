import { useAbout } from "@/hooks/useAbout";
import { useHome } from "@/hooks/useHome";
import { aboutRepository, homeRepository } from "@/repositories/instances";

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
  const { aboutText } = useHome(homeRepository);
  const { dailyRoutine, faq } = useAbout(aboutRepository);

  const bio = [aboutText].filter(Boolean);

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
        // personal / non-technical
      </div>
      <h1
        style={{ fontSize: 28, fontWeight: 700, margin: "4px 0 14px" }}
      >
        $ cat about.txt
      </h1>

      <AsciiRule label="bio" />

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
                {p}
              </p>
            ))}
          </div>
        }
      />

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
