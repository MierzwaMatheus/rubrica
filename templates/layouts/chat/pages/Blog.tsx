import { Rss } from "lucide-react";
import { useBlogPosts } from "@/hooks/useBlog";
import { useI18n } from "@/i18n/context/I18nContext";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { blogRepository } from "@/repositories/instances";
import {
  Bubble,
  ChatLog,
  ChatSection,
  DayChip,
  LinkCard,
  formatChatDate,
  readingMinutes,
  useChatText,
} from "@/components/ChatShared";

/** Feed RSS gerado no build (scripts/generate-rss-feed.ts): é um arquivo estático, não uma rota do app. */
const RSS_FEED = "/rss.xml";

export default function ChatBlog() {
  const { t } = useTranslation();
  const { locale } = useI18n();
  const text = useChatText();
  const { posts, featuredPosts, isLoading } = useBlogPosts(blogRepository);

  if (isLoading) return null;

  // Destaque primeiro, depois os demais na ordem do admin.
  const featured = featuredPosts[0] ?? null;
  const ordered = featured ? [featured, ...posts.filter((p) => p.id !== featured.id)] : posts;

  return (
    <ChatLog>
      <h1 className="ct-sr">{t("blog.title")}</h1>
      <DayChip />

      <ChatSection title={t("blog.title")} ask={text.qBlog}>
        {ordered.length === 0 ? (
          <Bubble>
            <p>{t("blog.noPosts")}</p>
            <p>{t("blog.comeBackSoon")}</p>
          </Bubble>
        ) : (
          <Bubble wide>
            <p>{text.blogIntro(ordered.length)}</p>
            <div className="ct-cards">
              {ordered.map((post, i) => {
                const meta = [
                  formatChatDate(post.published_at || post.created_at, locale),
                  `${readingMinutes(post.content ?? "")} ${t("blog.readTime")}`,
                ]
                  .filter(Boolean)
                  .join(" · ");
                const isFeatured = i === 0 && !!featured;
                return (
                  <LinkCard key={post.id} href={`/blog/${post.slug}`} image={post.image || undefined} title={post.title} big={isFeatured} badge={isFeatured ? t("blog.featured") : undefined}>
                    {post.subtitle && <p>{post.subtitle}</p>}
                    <small>{meta}</small>
                    {post.tags?.length > 0 && (
                      <span className="ct-tags">
                        {post.tags.slice(0, 4).map((tag) => (
                          <span key={tag}>{tag}</span>
                        ))}
                      </span>
                    )}
                  </LinkCard>
                );
              })}
            </div>
            <a href={RSS_FEED} className="ct-a">
              <Rss size={14} aria-hidden="true" /> {text.rss}
            </a>
          </Bubble>
        )}
      </ChatSection>
    </ChatLog>
  );
}
