import { useBlogPosts } from "@/hooks/useBlog";
import { blogRepository } from "@/repositories/instances";

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

function readingTime(content: string): string {
  return Math.ceil(content.split(" ").length / 200) + " min";
}

export default function Blog() {
  const { posts, featuredPosts } = useBlogPosts(blogRepository);
  const featured = featuredPosts[0] ?? posts[0];

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
        // thoughts · essays · long-form
      </div>
      <h1
        style={{ fontSize: 28, fontWeight: 700, margin: "4px 0 14px" }}
      >
        $ ls posts/ --sort=date
      </h1>

      {featured && (
        <>
          <AsciiRule label="featured" />
          <BrutPrompt
            cmd={`cat featured/${featured.title.toLowerCase().replace(/\s/g, "-")}.md | head`}
            output={
              <div
                style={{
                  marginTop: 10,
                  border: "2px solid var(--primary)",
                  padding: 20,
                  position: "relative",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    top: -10,
                    left: 16,
                    background: "var(--bg)",
                    color: "var(--primary)",
                    padding: "0 8px",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                  }}
                >
                  ★ DESTAQUE ★
                </span>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 200px",
                    gap: 20,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        opacity: 0.6,
                        marginBottom: 8,
                      }}
                    >
                      <span style={{ color: "var(--accent)" }}>#</span>{" "}
                      {featured.published_at} ·{" "}
                      <span style={{ color: "var(--accent)" }}>⏱</span>{" "}
                      {readingTime(featured.content)}
                    </div>
                    <h2
                      style={{
                        fontSize: 32,
                        fontWeight: 700,
                        margin: "0 0 8px",
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {featured.title}
                    </h2>
                    <p
                      style={{
                        fontSize: 14,
                        opacity: 0.85,
                        margin: "0 0 16px",
                        lineHeight: 1.55,
                      }}
                    >
                      {featured.subtitle}
                    </p>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 4,
                        fontSize: 11,
                      }}
                    >
                      {featured.tags.slice(0, 10).map((t) => (
                        <span
                          key={t}
                          style={{
                            padding: "2px 8px",
                            border: "1px solid var(--text)",
                          }}
                        >
                          {t}
                        </span>
                      ))}
                      {featured.tags.length > 10 && (
                        <span style={{ padding: "2px 8px", opacity: 0.55 }}>
                          +{featured.tags.length - 10}
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        marginTop: 16,
                        display: "inline-block",
                        padding: "6px 14px",
                        background: "var(--primary)",
                        color: "var(--bg)",
                        fontWeight: 700,
                        fontSize: 12,
                      }}
                    >
                      ${" "}
                      open --post=
                      {featured.slug ?? featured.title.toLowerCase().replace(/\s/g, "-")}
                    </div>
                  </div>
                  {featured.image && (
                    <img
                      src={featured.image}
                      alt={featured.title}
                      style={{
                        width: "100%",
                        aspectRatio: "4/5",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  )}
                </div>
              </div>
            }
          />
        </>
      )}

      <AsciiRule label="search" />
      <div
        style={{
          display: "flex",
          gap: 8,
          fontSize: 12,
          alignItems: "center",
          border: "1px solid var(--text)",
          padding: "6px 12px",
        }}
      >
        <span style={{ color: "var(--accent)" }}>$ grep -r</span>
        <span style={{ flex: 1, opacity: 0.55 }}>
          {'"'} | {"'"} buscar artigos…
        </span>
        <span
          style={{ padding: "2px 8px", borderLeft: "1px solid var(--text)" }}
        >
          --tags={posts.flatMap((p) => p.tags).length}
        </span>
        <span
          style={{ padding: "2px 8px", borderLeft: "1px solid var(--text)" }}
        >
          --rss
        </span>
      </div>

      <AsciiRule label="index.posts" />

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr style={{ borderBottom: "2px solid var(--text)" }}>
            {["#", "data", "título", "tags", "tempo"].map((h, i) => (
              <th
                key={h}
                style={{
                  textAlign: i === 4 ? "right" : "left",
                  padding: "8px 10px",
                  fontWeight: 700,
                  fontSize: 11,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  opacity: 0.7,
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {posts.map((p, i) => (
            <tr
              key={p.id}
              style={{
                borderBottom: "1px solid var(--text)",
                background:
                  i % 2 === 1
                    ? "transparent"
                    : "rgba(127,127,127,0.04)",
              }}
            >
              <td
                style={{
                  padding: "10px 10px",
                  opacity: 0.55,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </td>
              <td style={{ padding: "10px 10px", opacity: 0.7 }}>
                {p.published_at}
              </td>
              <td style={{ padding: "10px 10px" }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>
                  <span
                    style={{ color: "var(--primary)", marginRight: 6 }}
                  >
                    ›
                  </span>
                  {p.title}
                </div>
                <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>
                  {p.subtitle}
                </div>
              </td>
              <td style={{ padding: "10px 10px", fontSize: 11 }}>
                {p.tags.slice(0, 2).map((t, j) => (
                  <span key={t}>
                    <span style={{ color: "var(--accent)" }}>#</span>
                    {t.toLowerCase().replace(/\s/g, "-")}
                    {j < Math.min(p.tags.length - 1, 1) && " "}
                  </span>
                ))}
                {p.tags.length > 2 && (
                  <span style={{ opacity: 0.5 }}> +{p.tags.length - 2}</span>
                )}
              </td>
              <td
                style={{
                  padding: "10px 10px",
                  textAlign: "right",
                  color: "var(--accent)",
                }}
              >
                {readingTime(p.content)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: 12, fontSize: 11, opacity: 0.6 }}>
        // {posts.length} posts · type{" "}
        <span style={{ color: "var(--primary)" }}>
          $ open --post=&lt;name&gt;
        </span>{" "}
        to read
      </div>
    </div>
  );
}
