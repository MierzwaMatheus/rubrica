import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useI18n } from "@/i18n/context/I18nContext";
import { countWords, minutesFromWords } from "@/utils/readingTime";
import {
  BlogRepository,
  BlogPost,
} from "@/repositories/interfaces/BlogRepository";

export function useBlogPosts(repository: BlogRepository) {
  const { locale } = useI18n();

  const {
    data: postsRaw,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["blog", "posts"],
    queryFn: () => repository.list(),
    staleTime: Infinity,
  });

  // Deriva posts traduzidos baseados no locale atual (sem refetch)
  const posts = useMemo(() => {
    if (!postsRaw) return [];

    return postsRaw.map(post => withReadingMinutes({
      ...post,
      title:
        (post.title_translations?.[locale] &&
          post.title_translations[locale].trim()) ||
        (post.title_translations?.["pt-BR"] &&
          post.title_translations["pt-BR"].trim()) ||
        post.title ||
        "",
      subtitle:
        (post.subtitle_translations?.[locale] &&
          post.subtitle_translations[locale].trim()) ||
        (post.subtitle_translations?.["pt-BR"] &&
          post.subtitle_translations["pt-BR"].trim()) ||
        post.subtitle ||
        "",
      content:
        (post.content_translations?.[locale] &&
          post.content_translations[locale].trim()) ||
        (post.content_translations?.["pt-BR"] &&
          post.content_translations["pt-BR"].trim()) ||
        post.content ||
        "",
    }, locale));
  }, [postsRaw, locale]);

  const featuredPosts = useMemo(() => {
    return posts.filter(p => p.featured === true);
  }, [posts]);

  return {
    posts,
    featuredPosts,
    isLoading,
    error,
  };
}

function pickLocalized(
  translations: Record<string, string> | undefined,
  locale: string,
  fallback: string | undefined,
): string {
  return translations?.[locale]?.trim() || translations?.["pt-BR"]?.trim() || fallback?.trim() || "";
}

/**
 * Minutos de leitura do post no idioma da página: da contagem de palavras do build quando
 * existe (o índice do blog não leva o texto), senão do próprio texto (Convex, em desenvolvimento).
 */
function withReadingMinutes<T extends BlogPost>(post: T, locale: string): T {
  const words = post.word_count?.[locale] ?? post.word_count?.["pt-BR"] ?? countWords(post.content);
  return { ...post, reading_minutes: minutesFromWords(words) };
}

export function useBlogPost(repository: BlogRepository, slug: string) {
  const { locale } = useI18n();

  const {
    data: postRaw,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["blog", "post", slug],
    queryFn: () => repository.getBySlug(slug),
    enabled: !!slug,
    staleTime: Infinity,
  });

  // Deriva post traduzido baseado no locale atual (sem refetch)
  const post = useMemo(() => {
    if (!postRaw) return null;

    return {
      ...postRaw,
      title:
        (postRaw.title_translations?.[locale] &&
          postRaw.title_translations[locale].trim()) ||
        (postRaw.title_translations?.["pt-BR"] &&
          postRaw.title_translations["pt-BR"].trim()) ||
        postRaw.title ||
        "",
      subtitle:
        (postRaw.subtitle_translations?.[locale] &&
          postRaw.subtitle_translations[locale].trim()) ||
        (postRaw.subtitle_translations?.["pt-BR"] &&
          postRaw.subtitle_translations["pt-BR"].trim()) ||
        postRaw.subtitle ||
        "",
      content:
        (postRaw.content_translations?.[locale] &&
          postRaw.content_translations[locale].trim()) ||
        (postRaw.content_translations?.["pt-BR"] &&
          postRaw.content_translations["pt-BR"].trim()) ||
        postRaw.content ||
        "",
      // SEO: no idioma da página; sem tradução, o texto em pt-BR; vazio, a página usa os padrões.
      seo_title: pickLocalized(postRaw.seo_title_translations, locale, postRaw.seo_title),
      seo_description: pickLocalized(postRaw.seo_description_translations, locale, postRaw.seo_description),
    };
  }, [postRaw, locale]);

  return {
    post,
    isLoading,
    error,
  };
}
