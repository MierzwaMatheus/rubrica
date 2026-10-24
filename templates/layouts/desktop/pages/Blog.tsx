import { Link } from "wouter";
import { Rss, Star } from "lucide-react";
import { SEO } from "@/components/SEO";
import { useBlogPosts } from "@/hooks/useBlog";
import { useI18n } from "@/i18n/context/I18nContext";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { blogRepository } from "@/repositories/instances";
import {
  Window,
  WindowStack,
  formatDate,
  readingMinutes,
  shorten,
  useDesktopCopy,
} from "@/components/DesktopShared";

/** Feed gerado no build (scripts/generate-rss-feed.ts): arquivo estático, não uma rota do app. */
const RSS_FEED = "/rss.xml";

export default function DesktopBlog() {
  const { t } = useTranslation();
  const { locale } = useI18n();
  const copy = useDesktopCopy();
  const { posts, featuredPosts, isLoading } = useBlogPosts(blogRepository);

  if (isLoading) return null;

  // O destaque abre à direita; a lista começa por ele.
  const open = featuredPosts[0] ?? posts[0];
  const ordered = open ? [open, ...posts.filter((p) => p.id !== open.id)] : [];

  return (
    <>
      <SEO title={t("blog.title")} description={t("blog.subtitle")} url="/blog" />
      <WindowStack>
        <Window
          title={`${copy.notes} — ${t("blog.title")}`}
          titleAs="div"
          active
          status={
            <>
              <span>{copy.notesCount(posts.length)}</span>
              <a href={RSS_FEED} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Rss size={13} aria-hidden="true" />
                {copy.rss}
              </a>
            </>
          }
        >
          <div className="dk-toolbar">
            <h1 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{t("blog.title")}</h1>
            <span className="dk-muted">{t("blog.subtitle")}</span>
          </div>

          {!open ? (
            <p className="dk-empty">
              {t("blog.noPosts")} {t("blog.comeBackSoon")}
            </p>
          ) : (
            <div className="dk-notes">
              {/* Lista de notas: cada uma abre o post */}
              <ul className="dk-notes-list">
                {ordered.map((post) => {
                  const isOpen = post.id === open.id;
                  return (
                    <li key={post.id}>
                      <Link href={`/blog/${post.slug}`} className={`dk-note${isOpen ? " on" : ""}`}>
                        <span className="dk-note-title">
                          {post.featured && <Star size={12} aria-hidden="true" style={{ display: "inline", marginRight: 5, verticalAlign: -1 }} />}
                          {post.title}
                        </span>
                        <span className="dk-note-meta dk-muted">
                          {formatDate(post.published_at || post.created_at, locale)} · {readingMinutes(post.content)} {t("blog.readTime")}
                        </span>
                        {post.subtitle && <span className="dk-muted" style={{ fontSize: 12.5 }}>{shorten(post.subtitle, 80)}</span>}
                        {post.tags?.length > 0 && (
                          <span className="dk-note-meta dk-muted">{post.tags.slice(0, 3).map((tag) => `#${tag}`).join(" ")}</span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>

              {/* O post em destaque, aberto */}
              <article className="dk-view" aria-label={copy.open}>
                {open.image && (
                  <div className="dk-cover">
                    <img src={open.image} alt="" loading="lazy" />
                  </div>
                )}
                <p className="dk-note-meta dk-muted">
                  {open.featured && <>★ {t("blog.featured")} · </>}
                  {formatDate(open.published_at || open.created_at, locale)} · {readingMinutes(open.content)} {t("blog.readTime")}
                </p>
                <h2>{open.title}</h2>
                {open.subtitle && <p className="dk-desc">{open.subtitle}</p>}
                {open.tags?.length > 0 && (
                  <ul className="dk-chips" aria-label="Tags">
                    {open.tags.map((tag) => (
                      <li key={tag} className="dk-chip dk-mono" style={{ fontSize: 11.5 }}>
                        #{tag}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="dk-row">
                  <Link href={`/blog/${open.slug}`} className="dk-btn pri def">
                    {t("blog.readNow")}
                  </Link>
                </div>
              </article>
            </div>
          )}
        </Window>
      </WindowStack>
    </>
  );
}
