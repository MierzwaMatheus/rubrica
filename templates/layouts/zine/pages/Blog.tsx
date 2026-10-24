import { Link } from "wouter";
import { Rss } from "lucide-react";
import { useBlogPosts } from "@/hooks/useBlog";
import { useI18n } from "@/i18n/context/I18nContext";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { blogRepository } from "@/repositories/instances";
import type { BlogPost } from "@/repositories/interfaces/BlogRepository";
import { HandTitle, Tape, formatDate, readingMinutes, tilt, tiltAt, truncate, useZineCopy } from "@/components/ZineShared";

/** Feed gerado no build (scripts/generate-rss-feed.ts): arquivo estático, não é rota do app. */
const RSS_FEED = `${import.meta.env.BASE_URL ?? "/"}rss.xml`;

function Meta({ post }: { post: BlogPost }) {
  const { t } = useTranslation();
  const { locale } = useI18n();
  const date = formatDate(post.published_at || post.created_at, locale);
  return (
    <p className="zn-clip-meta">
      {date && <time dateTime={post.published_at || post.created_at}>{date}</time>}
      <span>
        {readingMinutes(post.content)} {t("blog.readTime")}
      </span>
    </p>
  );
}

function Tags({ tags }: { tags: string[] }) {
  if (!tags?.length) return null;
  return (
    <ul className="zn-tags" aria-label="Tags">
      {tags.slice(0, 5).map((tag) => (
        <li key={tag}>#{tag}</li>
      ))}
    </ul>
  );
}

export default function ZineBlog() {
  const { t } = useTranslation();
  const copy = useZineCopy();
  const { posts, featuredPosts, isLoading } = useBlogPosts(blogRepository);

  if (isLoading) return null;

  const featured = featuredPosts[0] ?? posts[0] ?? null;
  const rest = posts.filter((p) => p.id !== featured?.id);

  return (
    <div className="zn-wrap">
      <header className="zn-pagehead">
        <div>
          <p className="zn-kicker">{copy.blogKicker}</p>
          <HandTitle as="h1">{t("blog.title")}</HandTitle>
          <p className="zn-lead" style={{ marginTop: 10 }}>
            {copy.postsCount(posts.length)}
          </p>
        </div>
        <div className="zn-pagehead-aside">
          <a href={RSS_FEED} className="zn-rss zn-tilt" style={tilt(-2)}>
            <Rss size={15} aria-hidden="true" /> {copy.rss}
          </a>
        </div>
      </header>

      {!featured ? (
        <section className="zn-sec">
          <p className="zn-lead">{t("blog.noPosts")}</p>
        </section>
      ) : (
        <>
          {/* Recorte em destaque, maior */}
          <section className="zn-sec" aria-label={t("blog.featured")} style={{ paddingBottom: 24 }}>
            <article className="zn-clip zn-clip-feature zn-tilt" style={tilt(-0.6)}>
              <Tape pos="left" />
              <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
                <span className="zn-badge">★ {t("blog.featured")}</span>
                <h2>
                  <Link href={`/blog/${featured.slug}`} className="zn-clip-link">
                    {featured.title}
                  </Link>
                </h2>
                <Meta post={featured} />
                {featured.subtitle && <p className="zn-clip-cols">{featured.subtitle}</p>}
                <Tags tags={featured.tags} />
                <div style={{ marginTop: "auto", paddingTop: 6 }}>
                  <Link href={`/blog/${featured.slug}`} className="zn-handlink" data-umami-event="blog-featured">
                    {t("blog.readNow")} →<span className="zn-sr">: {featured.title}</span>
                  </Link>
                </div>
              </div>
              {featured.image && (
                <div className="zn-clip-img">
                  <img src={featured.image} alt="" loading="lazy" />
                </div>
              )}
            </article>
          </section>

          {/* Demais recortes colados */}
          {rest.length > 0 && (
            <section className="zn-sec" aria-label={t("blog.title")} style={{ paddingTop: 24 }}>
              <ul className="zn-clips">
                {rest.map((post, i) => (
                  <li key={post.id}>
                    <article className="zn-clip zn-tilt" style={tilt(tiltAt(i, 0.8))}>
                      {i % 3 === 1 && <Tape />}
                      {post.image && (
                        <div className="zn-clip-img">
                          <img src={post.image} alt="" loading="lazy" />
                        </div>
                      )}
                      <h3>
                        <Link href={`/blog/${post.slug}`} className="zn-clip-link">
                          {post.title}
                        </Link>
                      </h3>
                      <Meta post={post} />
                      {post.subtitle && <p>{truncate(post.subtitle, 180)}</p>}
                      <Tags tags={post.tags} />
                    </article>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
