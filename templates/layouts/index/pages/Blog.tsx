import { Link } from "wouter";
import { Rss } from "lucide-react";
import { SEO } from "@/components/SEO";
import { useBlogPosts } from "@/hooks/useBlog";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { blogRepository } from "@/repositories/instances";
import type { BlogPost } from "@/repositories/interfaces/BlogRepository";
import {
  IndexSection,
  IndexTableSection,
  RSS_URL,
  formatDate,
  readingMinutes,
  useIndexCopy,
  type IndexColumn,
} from "@/components/IndexShared";

export default function IndexBlog() {
  const { t, locale } = useTranslation();
  const copy = useIndexCopy();
  const { posts, featuredPosts, isLoading } = useBlogPosts(blogRepository);

  if (isLoading) return null;

  const featured: BlogPost | undefined = featuredPosts[0] ?? posts[0];
  const rest = posts.filter((p) => p.id !== featured?.id);
  const dateOf = (p: BlogPost) => formatDate(p.published_at || p.created_at, locale);

  const columns: IndexColumn<BlogPost>[] = [
    { key: "date", header: copy.colDate, width: "120px", cell: (p) => <span className="ix-num">{dateOf(p)}</span> },
    { key: "title", header: copy.colTitle, title: true, width: "46%", cell: (p) => p.title },
    { key: "tags", header: copy.colTags, muted: true, cell: (p) => (p.tags ?? []).join(", ") || copy.noResult },
    {
      key: "reading",
      header: copy.colReading,
      width: "96px",
      muted: true,
      cell: (p) => <span className="ix-num">{copy.minutes(readingMinutes(p.content))}</span>,
    },
  ];

  return (
    <>
      <SEO title={t("blog.title")} description={t("blog.subtitle")} url="/blog" />

      <IndexSection labelAs="div" label={<span className="ix-code">{copy.sheet} 005 — {t("blog.title")}</span>}>
        <h1 className="ix-title">{t("blog.title")}</h1>
        <p className="ix-desc">
          {t("blog.subtitle")}. {copy.posts(posts.length)}.
        </p>
        <p className="ix-links">
          <a href={RSS_URL} className="ix-u" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <Rss size={14} aria-hidden="true" /> {copy.rss}
          </a>
        </p>
      </IndexSection>

      {posts.length === 0 && (
        <IndexSection label={copy.index}>
          <p style={{ margin: 0, fontSize: 16 }}>{t("blog.noPosts")}</p>
          <p className="ix-desc">{t("blog.comeBackSoon")}</p>
        </IndexSection>
      )}

      {/* O destaque no topo, com um resumo */}
      {featured && (
        <IndexSection label={t("blog.featured")}>
          <article className="ix-feat">
            <div>
              <p className="ix-feat-meta">
                {[formatDate(featured.published_at || featured.created_at, locale, "long"), `${readingMinutes(featured.content)} ${t("blog.readTime")}`].filter(Boolean).join(" · ")}
              </p>
              <h3>
                <Link href={`/blog/${featured.slug}`} data-umami-event="blog-featured">
                  {featured.title}
                </Link>
              </h3>
              {featured.subtitle && <p className="ix-desc">{featured.subtitle}</p>}
              {featured.tags?.length > 0 && (
                <ul className="ix-inline ix-muted" style={{ marginTop: 12, fontSize: 13 }}>
                  {featured.tags.map((tag) => (
                    <li key={tag}>{tag}</li>
                  ))}
                </ul>
              )}
              <p className="ix-links">
                <Link href={`/blog/${featured.slug}`} className="ix-u" aria-hidden="true" tabIndex={-1}>
                  {t("blog.readNow")} →
                </Link>
              </p>
            </div>
            {featured.image && (
              <figure className="ix-feat-img">
                <img src={featured.image} alt="" loading="lazy" />
              </figure>
            )}
          </article>
        </IndexSection>
      )}

      {rest.length > 0 && (
        <IndexTableSection
          label={copy.index}
          aside={copy.posts(rest.length)}
          caption={`${t("blog.title")}: ${copy.posts(rest.length)}`}
          rows={rest}
          columns={columns}
          getKey={(p) => String(p.id ?? p.slug)}
          getLink={(p) => ({ href: `/blog/${p.slug}` })}
          getPreview={(p) => ({ image: p.image || undefined, caption: dateOf(p) || p.title })}
        />
      )}
    </>
  );
}
