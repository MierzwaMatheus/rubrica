/**
 * Monografia — Blog. "Ensaios": o post em destaque abre o capítulo com sua prancha, e os
 * demais formam o sumário (numeral romano, título, linha pontilhada e tempo de leitura),
 * com o subtítulo em itálico, a data e as tags.
 */
import { Link } from "wouter";
import { Rss } from "lucide-react";
import { SEO } from "@/components/SEO";
import { useBlogPosts } from "@/hooks/useBlog";
import { useI18n } from "@/i18n/context/I18nContext";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { blogRepository } from "@/repositories/instances";
import type { BlogPost } from "@/repositories/interfaces/BlogRepository";
import {
  Leader,
  MnChapter,
  MnMain,
  MnSection,
  RSS_FEED_URL,
  formatLongDate,
  readingMinutes,
  toRoman,
  useMonographText,
} from "@/components/MonographShared";

export default function MonographBlog() {
  const { t } = useTranslation();
  const tx = useMonographText();
  const { locale } = useI18n();
  const { posts, featuredPosts, isLoading } = useBlogPosts(blogRepository);

  if (isLoading) return null;

  const featured = featuredPosts[0] ?? posts[0] ?? null;
  const rest = posts.filter((p) => p.id !== featured?.id);

  const meta = (p: BlogPost, tags = 3) =>
    [formatLongDate(p.published_at || p.created_at, locale), (p.tags ?? []).slice(0, tags).join(", ")]
      .filter(Boolean)
      .join(" · ");

  const entry = (p: BlogPost, n: number, big = false) => {
    const minutes = readingMinutes(p.content ?? "");
    return (
      <>
        <h3>
          <Link
            href={`/blog/${p.slug}`}
            className="mn-entry-link"
            aria-label={`${p.title} — ${minutes} ${t("blog.readTime")}`}
          >
            <Leader big={big} value={`${minutes} min`}>
              <em>{toRoman(n)}.</em>
              {p.title}
            </Leader>
          </Link>
        </h3>
        {p.subtitle ? <p className="mn-entry-sum">{p.subtitle}</p> : null}
        {meta(p) ? <p className="mn-entry-meta">{meta(p)}</p> : null}
      </>
    );
  };

  return (
    <>
      <SEO title={t("blog.title")} description={t("blog.subtitle")} url="/blog" />

      <MnChapter number={5} title={tx.essays} dek={t("blog.subtitle")}>
        <p className="mn-links">
          <a href={RSS_FEED_URL} className="mn-act">
            <Rss size={13} aria-hidden="true" style={{ alignSelf: "center" }} />
            {tx.rss}
          </a>
        </p>
      </MnChapter>

      {!featured ? (
        <MnSection id="ensaios" label={tx.contents} sub={tx.essays}>
          <MnMain>
            <p className="mn-entry-sum">{t("blog.noPosts")}</p>
            <p className="mn-muted">{t("blog.comeBackSoon")}</p>
          </MnMain>
        </MnSection>
      ) : (
        <>
          <MnSection id="destaque" label={t("blog.featured")}>
            <MnMain>
              <article className="mn-entry">
                {featured.image ? (
                  <figure className="mn-fig">
                    <img src={featured.image} alt="" />
                    <figcaption>
                      <b>
                        {tx.plate} {toRoman(1)}
                      </b>
                      {featured.title}
                    </figcaption>
                  </figure>
                ) : null}
                {entry(featured, 1, true)}
                <p className="mn-links mn-links--left">
                  <Link href={`/blog/${featured.slug}`} className="mn-act" tabIndex={-1} aria-hidden="true">
                    {t("blog.readNow")} →
                  </Link>
                </p>
              </article>
            </MnMain>
          </MnSection>

          {rest.length > 0 && (
            <MnSection id="ensaios" label={tx.contents} sub={tx.essays}>
              <MnMain>
                <ol className="mn-toc-list">
                  {rest.map((p, i) => (
                    <li key={p.id} className="mn-entry">
                      {entry(p, i + 2)}
                    </li>
                  ))}
                </ol>
              </MnMain>
            </MnSection>
          )}
        </>
      )}
    </>
  );
}
