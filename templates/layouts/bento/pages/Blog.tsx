import { useBlogPosts } from "@/hooks/useBlog";
import { blogRepository } from "@/repositories/instances";
import { Link } from "wouter";
import { ArrowRight, Rss } from "lucide-react";

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

export default function BentoBlog() {
  const { posts, featuredPosts } = useBlogPosts(blogRepository);

  const gap = 14;
  const featured = featuredPosts[0] ?? posts[0];
  const remaining = posts.filter((p) => p.id !== featured?.id).slice(0, 10);

  const spanMap = [2, 2, 2, 3, 3, 2, 2, 2, 2, 2];

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
      {/* Title + featured */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(12, 1fr)",
          gap,
          marginBottom: gap,
        }}
      >
        <BentoCard span={5} padding={28}>
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
            $ less blog/
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
            Blog
          </h1>
          <p style={{ fontSize: 13, lineHeight: 1.5, opacity: 0.7, margin: "12px 0 22px" }}>
            Compartilhando conhecimento sobre desenvolvimento e design.
          </p>
          <div style={{ display: "flex", gap: 8 }}>
            <div
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: 10,
                background: "color-mix(in srgb, var(--text) 20%, transparent)",
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12,
                opacity: 0.7,
              }}
            >
              <span>{posts.length} artigos</span>
            </div>
            <div
              style={{
                padding: "8px 12px",
                borderRadius: 10,
                background: "var(--accent)",
                color: "var(--text)",
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              <Rss size={13} />
              RSS
            </div>
          </div>
        </BentoCard>

        {/* Featured post */}
        {featured && (
          <BentoCard
            span={7}
            padding={0}
            tint="var(--primary)"
            style={{
              color: "var(--bg)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "row",
            }}
          >
            <div style={{ flex: 1, padding: 28, display: "flex", flexDirection: "column" }}>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 10.5,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  opacity: 0.8,
                  marginBottom: 10,
                }}
              >
                ★ Em Destaque
              </div>
              <h2
                style={{
                  fontSize: 32,
                  margin: "0 0 8px",
                  fontWeight: 700,
                  letterSpacing: "-0.025em",
                }}
              >
                {featured.title}
              </h2>
              {featured.subtitle && (
                <p
                  style={{
                    fontSize: 13.5,
                    lineHeight: 1.5,
                    opacity: 0.92,
                    margin: "0 0 16px",
                  }}
                >
                  {featured.subtitle}
                </p>
              )}
              <div
                style={{
                  display: "flex",
                  gap: 14,
                  fontSize: 11,
                  fontFamily: "var(--font-mono)",
                  opacity: 0.85,
                }}
              >
                {featured.published_at && <span>{featured.published_at}</span>}
              </div>
              <div style={{ marginTop: "auto", paddingTop: 24 }}>
                <Link
                  to={`/blog/${featured.slug}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    background: "var(--bg)",
                    color: "var(--primary)",
                    padding: "10px 18px",
                    borderRadius: 10,
                    fontSize: 12,
                    fontWeight: 700,
                    textDecoration: "none",
                  }}
                >
                  Ler agora <ArrowRight size={14} />
                </Link>
              </div>
            </div>
            {featured.image && (
              <div style={{ width: 200, flexShrink: 0 }}>
                <img
                  src={featured.image}
                  alt={featured.title}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </div>
            )}
          </BentoCard>
        )}
      </div>

      {/* Post grid — varied bento sizes */}
      {remaining.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, 1fr)",
            gridAutoRows: "minmax(180px, auto)",
            gap,
          }}
        >
          {remaining.map((p, i) => {
            const span = spanMap[i] ?? 2;
            const isBig = i === 3 || i === 4;
            return (
              <BentoCard
                key={p.id}
                span={span}
                padding={isBig ? 24 : 18}
                style={i % 5 === 2 ? { background: "color-mix(in srgb, var(--text) 10%, transparent)" } : {}}
              >
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    opacity: 0.5,
                    marginBottom: 10,
                    letterSpacing: "0.1em",
                  }}
                >
                  {p.published_at}
                </div>
                <h3
                  style={{
                    fontSize: isBig ? 20 : 15,
                    fontWeight: 700,
                    margin: "0 0 6px",
                    lineHeight: 1.2,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {p.title}
                </h3>
                {p.subtitle && (
                  <p
                    style={{
                      fontSize: 12,
                      lineHeight: 1.5,
                      opacity: 0.7,
                      margin: "0 0 10px",
                      flex: 1,
                    }}
                  >
                    {isBig
                      ? p.subtitle
                      : p.subtitle.length > 80
                      ? p.subtitle.slice(0, 80) + "…"
                      : p.subtitle}
                  </p>
                )}
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {(p.tags ?? []).slice(0, 3).map((t) => (
                    <span
                      key={t}
                      style={{
                        padding: "2px 8px",
                        borderRadius: 6,
                        background: "color-mix(in srgb, var(--text) 20%, transparent)",
                        fontSize: 10,
                      }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </BentoCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
