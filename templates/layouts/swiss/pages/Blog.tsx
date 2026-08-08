import { Search } from "lucide-react";
import { useBlogPosts } from "@/hooks/useBlog";
import { blogRepository } from "@/repositories/instances";
import { SwissShell, SwissGridLines } from "@/components/SwissShared";

export default function SwissBlog() {
  const { posts, featuredPosts, isLoading } = useBlogPosts(blogRepository);

  if (isLoading) return null;

  const featuredPost = featuredPosts[0] ?? null;

  return (
    <SwissShell page="Blog" idx={5}>
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
            alignItems: "end",
          }}
        >
          <div style={{ gridColumn: "span 8" }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "var(--accent)",
                marginBottom: 14,
              }}
            >
              .16 — Edição Editorial
            </div>
            <h1
              style={{
                fontSize: 96,
                fontWeight: 900,
                letterSpacing: "-0.05em",
                margin: 0,
                lineHeight: 0.88,
              }}
            >
              Blog —
              <br />
              <span
                style={{
                  background: "var(--text)",
                  color: "var(--bg)",
                  padding: "0 12px",
                }}
              >
                {posts.length}
              </span>{" "}
              ensaios.
            </h1>
          </div>
          <div style={{ gridColumn: "span 4" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                border: "1px solid var(--text)",
                fontSize: 11,
                fontWeight: 600,
                marginBottom: 8,
              }}
            >
              <Search size={13} />
              <span
                style={{
                  opacity: 0.65,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                Buscar artigos…
              </span>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <span
                style={{
                  flex: 1,
                  padding: "6px 10px",
                  background: "var(--accent)",
                  color: "var(--bg)",
                  fontSize: 10.5,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  textAlign: "center",
                }}
              >
                Filtrar por tag
              </span>
              <span
                style={{
                  padding: "6px 12px",
                  background: "var(--text)",
                  color: "var(--bg)",
                  fontSize: 10.5,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                }}
              >
                RSS
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Featured */}
      {featuredPost && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "5fr 7fr",
            borderBottom: "2px solid var(--text)",
          }}
        >
          <div style={{ borderRight: "1px solid var(--text)", padding: 0 }}>
            {featuredPost.image ? (
              <img
                src={featuredPost.image}
                alt={featuredPost.title}
                style={{
                  width: "100%",
                  aspectRatio: "4/3",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  aspectRatio: "4/3",
                  background: "color-mix(in oklab, var(--text) 12%, transparent)",
                }}
              />
            )}
          </div>
          <div
            style={{
              padding: 28,
              background: "var(--primary)",
              color: "var(--bg)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                marginBottom: 16,
              }}
            >
              <span>★ Destaque · Edição .{String(posts.length).padStart(2, "0")}</span>
              <span>{new Date(featuredPost.published_at).toLocaleDateString("pt-BR")}</span>
            </div>
            <h2
              style={{
                fontSize: 56,
                fontWeight: 900,
                letterSpacing: "-0.04em",
                margin: "0 0 12px",
                lineHeight: 0.9,
              }}
            >
              {featuredPost.title}
            </h2>
            <p
              style={{
                fontSize: 17,
                lineHeight: 1.45,
                margin: "0 0 20px",
                fontWeight: 500,
              }}
            >
              {featuredPost.subtitle}
            </p>
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 4,
                marginBottom: 24,
              }}
            >
              {featuredPost.tags.slice(0, 8).map((t) => (
                <span
                  key={t}
                  style={{
                    padding: "2px 7px",
                    background: "var(--bg)",
                    color: "var(--primary)",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  {t}
                </span>
              ))}
              {featuredPost.tags.length > 8 && (
                <span style={{ padding: "2px 7px", fontSize: 10, opacity: 0.7 }}>
                  + {featuredPost.tags.length - 8}
                </span>
              )}
            </div>
            <div
              style={{
                padding: "10px 18px",
                background: "var(--bg)",
                color: "var(--primary)",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                display: "inline-block",
              }}
            >
              Ler agora →
            </div>
          </div>
        </div>
      )}

      {/* Posts grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          borderBottom: "2px solid var(--text)",
        }}
      >
        {posts.map((p, i) => (
          <article
            key={p.id}
            style={{
              padding: 18,
              borderRight: (i + 1) % 3 !== 0 ? "1px solid var(--text)" : "none",
              borderBottom:
                i < posts.length - 3 ? "1px solid var(--text)" : "none",
              background: i === 4 ? "var(--accent)" : "transparent",
              color: i === 4 ? "var(--bg)" : "var(--text)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: 12,
              }}
            >
              <span
                style={{
                  fontSize: 36,
                  fontWeight: 900,
                  lineHeight: 0.85,
                  letterSpacing: "-0.04em",
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                }}
              >
                {new Date(p.published_at).toLocaleDateString("pt-BR")}
              </span>
            </div>
            <h3
              style={{
                fontSize: 18,
                fontWeight: 800,
                letterSpacing: "-0.01em",
                lineHeight: 1.2,
                margin: "0 0 6px",
              }}
            >
              {p.title}
            </h3>
            <p
              style={{
                fontSize: 11.5,
                lineHeight: 1.5,
                margin: "0 0 12px",
                opacity: i === 4 ? 0.95 : 0.78,
              }}
            >
              {p.subtitle}
            </p>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                borderTop: "1px solid currentColor",
                paddingTop: 8,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
              }}
            >
              <span>{p.tags.slice(0, 2).join(" · ")}</span>
            </div>
          </article>
        ))}
      </div>
    </SwissShell>
  );
}
