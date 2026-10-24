import { Rss } from "lucide-react";
import { SEO } from "@/components/SEO";
import { useBlogPosts } from "@/hooks/useBlog";
import { useI18n } from "@/i18n/context/I18nContext";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { blogRepository } from "@/repositories/instances";
import { PageHead, PosterRow, Section, formatDate, readingMinutes, usePosterLabels } from "@/components/PosterShared";

/** Feed gerado no build (scripts/generate-rss-feed.ts); é arquivo estático, não rota do app. */
const RSS_FEED = "/rss.xml";

const BLOG_CSS = `
.poster-rss {
  display: inline-flex; align-items: center; gap: 8px; margin-top: 4px; padding: 8px 12px;
  border: 2px solid var(--text); color: inherit; text-decoration: none;
  font-family: var(--font-mono); font-size: 12px; letter-spacing: .12em; text-transform: uppercase;
}
.poster-rss:hover { background: var(--text); color: var(--bg); }
.poster-post-meta { display: block; font-family: var(--font-mono); font-size: 12px; letter-spacing: .08em; text-transform: uppercase; }
.poster-post-tags { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 6px; margin-top: 10px; }
.poster-post-tags span { padding: 2px 8px; border: 1.5px solid currentColor; font-family: var(--font-mono); font-size: 11px; letter-spacing: .06em; }
@media (max-width: 760px) { .poster-post-tags { justify-content: flex-start; } }
.poster-empty { margin: 0; padding-block: 40px; font-size: 20px; }
`;

export default function PosterBlog() {
  const { t } = useTranslation();
  const { locale } = useI18n();
  const labels = usePosterLabels();
  const { posts, featuredPosts, isLoading } = useBlogPosts(blogRepository);

  if (isLoading) return null;

  // O destaque abre a lista; os demais seguem na ordem do admin.
  const featured = featuredPosts[0];
  const ordered = featured ? [featured, ...posts.filter((p) => p.id !== featured.id)] : posts;

  return (
    <>
      <SEO title={t("blog.title")} description={t("blog.subtitle")} url="/blog" />
      <style>{BLOG_CSS}</style>

      <PageHead kicker={labels.textos(posts.length)} title={t("blog.title")}>
        <p>{t("blog.subtitle")}</p>
        <a className="poster-rss" href={RSS_FEED} target="_blank" rel="noopener noreferrer">
          <Rss size={14} aria-hidden="true" /> RSS
        </a>
      </PageHead>

      <Section>
        {ordered.length > 0 ? (
          <ul className="poster-rows">
            {ordered.map((post, i) => {
              const isFeatured = featured ? post.id === featured.id : false;
              const date = formatDate(post.published_at || post.created_at, locale);
              return (
                <PosterRow
                  key={post.id}
                  index={i + 1}
                  title={post.title}
                  max={isFeatured ? 104 : 60}
                  description={post.subtitle}
                  tag={isFeatured ? t("blog.featured") : undefined}
                  meta={
                    <>
                      <span className="poster-post-meta">
                        {date && <time dateTime={post.published_at || post.created_at}>{date}</time>}
                        {date && " · "}
                        {readingMinutes(post.content)} {t("blog.readTime")}
                      </span>
                      {post.tags?.length > 0 && (
                        <span className="poster-post-tags">
                          {post.tags.slice(0, 3).map((tag) => (
                            <span key={tag}>#{tag}</span>
                          ))}
                        </span>
                      )}
                    </>
                  }
                  action={t("blog.readMore")}
                  href={`/blog/${post.slug}`}
                />
              );
            })}
          </ul>
        ) : (
          <div>
            <p className="poster-empty">{t("blog.noPosts")}</p>
            <p style={{ margin: 0 }}>{t("blog.comeBackSoon")}</p>
          </div>
        )}
      </Section>
    </>
  );
}
