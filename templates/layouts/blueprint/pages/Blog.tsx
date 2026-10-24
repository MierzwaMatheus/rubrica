import { Link } from "wouter";
import { ArrowRight, Rss } from "lucide-react";
import { useBlogPosts } from "@/hooks/useBlog";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { blogRepository } from "@/repositories/instances";
import { Dim, Hatch, PageTitleBlock, Sheet, isoDate, pad2, readingMinutes, useBlueprintLabels } from "@/components/BlueprintShared";

/** Feed RSS gerado no build (arquivo estático, não é rota do app). */
const RSS_FEED_URL = "/rss.xml";

export default function BlueprintBlog() {
  const { t } = useTranslation();
  const L = useBlueprintLabels();
  const { posts, featuredPosts } = useBlogPosts(blogRepository);

  const featured = featuredPosts[0] ?? posts[0];
  const rest = posts.filter((p) => p.id !== featured?.id);
  // Revisões numeradas da mais antiga (REV 01) para a mais nova; a lista vem da mais nova.
  const rev = (index: number) => pad2(posts.length - index);

  return (
    <div className="bp-page">
      <Sheet n={0} total={2} title={L.revisions}>
        <Dim label={L.revisionsCount(posts.length)} />
        <h1 className="bp-h1">{t("blog.title")}</h1>
        <p className="bp-lead">{t("blog.subtitle")}</p>
        <div className="bp-row">
          <a href={RSS_FEED_URL} className="bp-btn bp-rss">
            <Rss size={14} aria-hidden="true" /> RSS
            <span className="bp-sr">: {L.rss}</span>
          </a>
        </div>
      </Sheet>

      <Sheet n={1} total={2} title={featured ? L.featured : L.revisions}>
        {!featured && (
          <>
            <p className="bp-empty">{t("blog.noPosts")}</p>
            <p className="bp-empty">{t("blog.comeBackSoon")}</p>
          </>
        )}

        {/* O destaque como prancha grande no topo */}
        {featured && (
          <article className="bp-feature">
            <Hatch src={featured.image} alt="" tall />
            <div className="bp-feature-txt">
              <span className="bp-card-cap">
                REV. {rev(posts.indexOf(featured))} · {t("blog.featured")}
              </span>
              <h3>{featured.title}</h3>
              {featured.subtitle && <p>{featured.subtitle}</p>}
              <div className="bp-meta">
                {isoDate(featured.published_at) && <time dateTime={isoDate(featured.published_at)}>{isoDate(featured.published_at)}</time>}
                <span>
                  {readingMinutes(featured.content)} {t("blog.readTime")}
                </span>
              </div>
              {(featured.tags?.length ?? 0) > 0 && (
                <ul className="bp-tags">
                  {featured.tags.map((tag) => (
                    <li key={tag}>{tag}</li>
                  ))}
                </ul>
              )}
              <Link href={`/blog/${featured.slug}`} className="bp-btn bp-btn--pri bp-stretch">
                {t("blog.readNow")} <ArrowRight size={13} aria-hidden="true" />
                <span className="bp-sr">: {featured.title}</span>
              </Link>
            </div>
          </article>
        )}

        {/* Registro de revisões: REV | DATA | TÍTULO | LEITURA */}
        {rest.length > 0 && (
          <table className="bp-table bp-table--stack">
            <caption>{L.revisions}</caption>
            <thead>
              <tr>
                <th scope="col">{L.revCol}</th>
                <th scope="col">{L.date}</th>
                <th scope="col">{L.titleCol}</th>
                <th scope="col" className="bp-num">
                  {L.readingCol}
                </th>
              </tr>
            </thead>
            <tbody>
              {rest.map((p) => {
                const date = isoDate(p.published_at);
                return (
                  <tr key={p.id}>
                    <td data-label={L.revCol} className="bp-half">{rev(posts.indexOf(p))}</td>
                    <td data-label={L.date} className="bp-half">{date ? <time dateTime={date}>{date}</time> : "—"}</td>
                    <td data-label={L.titleCol}>
                      <Link href={`/blog/${p.slug}`}>{p.title}</Link>
                      {p.subtitle && <p className="bp-p" style={{ fontSize: 13, margin: "4px 0 0" }}>{p.subtitle}</p>}
                      {(p.tags?.length ?? 0) > 0 && (
                        <ul className="bp-tags" style={{ marginTop: 6 }}>
                          {p.tags.slice(0, 4).map((tag) => (
                            <li key={tag}>{tag}</li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td data-label={L.readingCol} className="bp-num">
                      {readingMinutes(p.content)} min
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        <PageTitleBlock page={t("blog.title")} sheets={1} />
      </Sheet>
    </div>
  );
}
