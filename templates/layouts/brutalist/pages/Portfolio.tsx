import { useState } from "react";
import { usePortfolio } from "@/hooks/usePortfolio";
import { portfolioRepository } from "@/repositories/instances";

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

export default function Portfolio() {
  const { projects } = usePortfolio(portfolioRepository);
  const [activeFilter, setActiveFilter] = useState("todos");

  const allTags = Array.from(
    new Set(projects.flatMap((p) => p.tags))
  );
  const filters = ["todos", ...allTags];

  const filteredProjects = activeFilter === "todos"
    ? projects
    : projects.filter((p) => p.tags?.includes(activeFilter));

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
        // repository of works · public
      </div>
      <h1
        style={{
          fontSize: 28,
          fontWeight: 700,
          margin: "4px 0 14px",
        }}
      >
        $ ls -la portfolio/
      </h1>

      <AsciiRule label="filtros" />
      <BrutPrompt
        cmd="grep -E 'stack:'"
        output={
          <div
            style={{
              marginTop: 8,
              display: "flex",
              flexWrap: "wrap",
              gap: 4,
              fontSize: 11.5,
            }}
          >
            {filters.map((f) => (
              <span
                key={f}
                onClick={() => setActiveFilter(f)}
                style={{
                  padding: "3px 8px",
                  border: "1px solid var(--text)",
                  background: activeFilter === f ? "var(--primary)" : "transparent",
                  color: activeFilter === f ? "var(--bg)" : "var(--text)",
                  fontWeight: activeFilter === f ? 700 : 400,
                  cursor: "pointer",
                }}
              >
                <span style={{ opacity: i === 0 ? 0.8 : 0.6 }}>--</span>
                {f.toLowerCase()}
              </span>
            ))}
          </div>
        }
      />

      <AsciiRule label="index" />

      <pre
        style={{
          fontSize: 11.5,
          lineHeight: 1.85,
          margin: 0,
          whiteSpace: "pre",
          overflow: "hidden",
          border: "1px solid var(--text)",
          padding: 14,
        }}
      >
        {"total " + filteredProjects.length + " projects\n"}
        {filteredProjects.map((p) => (
          <span key={p.id}>
            <span style={{ opacity: 0.55 }}>drwxr-xr-x  </span>
            <span style={{ opacity: 0.65 }}>
              {String(p.tags.length).padStart(2, "0")}k{"  "}
            </span>
            <span style={{ color: "var(--primary)", fontWeight: 700 }}>
              {(p.title.toLowerCase().replace(/\s/g, "-") + "/").padEnd(
                28,
                " "
              )}
            </span>
            <span style={{ opacity: 0.7 }}>
              [{p.tags.slice(0, 4).join(", ")}
              {p.tags.length > 4 ? ", …" : ""}]
            </span>
            {"\n"}
          </span>
        ))}
      </pre>

      <AsciiRule label="details" />

      {filteredProjects.map((p, i) => (
        <div
          key={p.id}
          style={{ marginBottom: 24, border: "1px solid var(--text)" }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "8px 14px",
              borderBottom: "1px solid var(--text)",
              background: "var(--text)",
              color: "var(--bg)",
              fontSize: 12,
            }}
          >
            <span>
              <span style={{ opacity: 0.65 }}>
                [{String(i + 1).padStart(2, "0")}]
              </span>{" "}
              <span style={{ fontWeight: 700 }}>
                ./{p.title.toLowerCase().replace(/\s/g, "-")}/README.md
              </span>
            </span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "280px 1fr" }}>
            {p.images[0] && (
              <div
                style={{ borderRight: "1px solid var(--text)", padding: 0 }}
              >
                <img
                  src={p.images[0]}
                  alt={p.title}
                  style={{
                    width: "100%",
                    aspectRatio: "4/3",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              </div>
            )}
            <div style={{ padding: 18 }}>
              <h3
                style={{ fontSize: 20, fontWeight: 700, margin: "0 0 10px" }}
              >
                # {p.title}
              </h3>
              <p
                style={{
                  fontSize: 12.5,
                  lineHeight: 1.6,
                  margin: "0 0 14px",
                  opacity: 0.85,
                }}
              >
                {p.description}
              </p>
              <div style={{ fontSize: 11.5, fontFamily: "var(--font-mono)" }}>
                <span style={{ color: "var(--accent)" }}>stack=</span>
                <span style={{ opacity: 0.5 }}>[</span>
                {p.tags.map((t, j) => (
                  <span key={t}>
                    <span style={{ color: "var(--primary)" }}>
                      &ldquo;{t}&rdquo;
                    </span>
                    {j < p.tags.length - 1 && (
                      <span style={{ opacity: 0.5 }}>, </span>
                    )}
                  </span>
                ))}
                <span style={{ opacity: 0.5 }}>]</span>
              </div>
              <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
                {p.demo_link && (
                  <a
                    href={p.demo_link}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      padding: "3px 10px",
                      border: "1px solid var(--text)",
                      fontSize: 11,
                      fontWeight: 700,
                      textDecoration: "none",
                      color: "var(--text)",
                    }}
                  >
                    $ view --details
                  </a>
                )}
                {p.github_link && (
                  <a
                    href={p.github_link}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      padding: "3px 10px",
                      border: "1px solid var(--accent)",
                      color: "var(--accent)",
                      fontSize: 11,
                      fontWeight: 700,
                      textDecoration: "none",
                    }}
                  >
                    $ contact
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
