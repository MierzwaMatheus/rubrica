import { Link } from "wouter";
import { Rss } from "lucide-react";
import { useBlogPosts } from "@/hooks/useBlog";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { blogRepository } from "@/repositories/instances";
import { SEO } from "@/components/SEO";
import {
  Crumb,
  SectionHead,
  StageLabel,
  formatDate,
  postStage,
  readingMinutes,
  useGardenTexts,
  type Stage,
} from "@/components/GardenShared";

/** Feed gerado no build (scripts/generate-rss-feed.ts); não é uma rota do app. */
const RSS_URL = "/rss.xml";

/** Ordem dos grupos: o destaque primeiro, depois o que acabou de ser plantado. */
const STAGE_ORDER: Stage[] = ["tree", "seed", "sprout"];

export default function GardenBlog() {
  const { t } = useTranslation();
  const tx = useGardenTexts();
  const { posts, isLoading } = useBlogPosts(blogRepository);

  if (isLoading) return <div aria-busy="true" style={{ minHeight: "60vh" }} />;

  const now = Date.now();
  const groups = STAGE_ORDER.map((stage) => ({
    stage,
    items: posts.filter((p) => postStage(p, now) === stage),
  })).filter((g) => g.items.length > 0);

  return (
    <>
      <SEO title={t("blog.title")} description={t("blog.subtitle")} url="/blog" />

      <section className="gd-hero" aria-labelledby="gd-blog">
        <Crumb page={t("navigation.blog").toLowerCase()} />
        <h1 id="gd-blog" className="gd-h1">
          {tx.notesTitle}
        </h1>
        <p className="gd-lead">{t("blog.subtitle")}</p>
        <div className="gd-row">
          {posts.length > 0 && <span className="gd-p gd-muted">{tx.notesCount(posts.length)}</span>}
          <a href={RSS_URL} className="gd-btn" aria-label={tx.subscribe}>
            <Rss size={16} aria-hidden="true" /> RSS
          </a>
        </div>
      </section>

      {groups.length === 0 && (
        <section className="gd-sec">
          <p className="gd-p">{t("blog.noPosts")}</p>
          <p className="gd-p gd-muted">{t("blog.comeBackSoon")}</p>
        </section>
      )}

      {groups.map(({ stage, items }) => (
        <section key={stage} className="gd-sec" aria-labelledby={`gd-stage-${stage}`}>
          <SectionHead id={`gd-stage-${stage}`} title={tx.stageGroup[stage]} />
          <ul className="gd-notes">
            {items.map((post) => {
              const date = formatDate(post.published_at, tx.locale);
              return (
                <li key={post.id ?? post.slug}>
                  <div className="gd-note-row">
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}>
                      <div className="gd-meta">
                        <StageLabel stage={stage} />
                        {date && <time dateTime={post.published_at}>{date}</time>}
                        <span>
                          {readingMinutes(post.content)} {t("blog.readTime")}
                        </span>
                      </div>
                      <h3 className="gd-note-t">
                        <Link href={`/blog/${post.slug}`}>{post.title}</Link>
                      </h3>
                      {post.subtitle && <p className="gd-note-s">{post.subtitle}</p>}
                      {post.tags?.length > 0 && (
                        <ul className="gd-tags" aria-label={tx.beds}>
                          {post.tags.map((tag) => (
                            <li key={tag} className="gd-tag">
                              {tag}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    {post.image && <img className="gd-note-img" src={post.image} alt="" loading="lazy" />}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </>
  );
}
