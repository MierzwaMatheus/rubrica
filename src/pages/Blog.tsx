import { PageSkeleton } from "@/components/PageSkeleton";
import { SEO } from "@/components/SEO";
import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  ChevronRight,
  ChevronLeft,
  Clock,
  X,
  Rss,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { BlogCoverFallback } from "@/components/BlogCoverFallback";
import { Link } from "wouter";
import { useI18n } from "@/i18n/context/I18nContext";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { useBlogPosts } from "@/hooks/useBlog";
import { blogRepository } from "@/repositories/instances";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export default function Blog() {
  const { t } = useTranslation();
  const { isLoading: i18nLoading } = useI18n();
  const { posts, featuredPosts, isLoading } = useBlogPosts(blogRepository);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Preload da primeira imagem crítica (featured post)
  useEffect(() => {
    if (featuredPosts.length > 0 && featuredPosts[0]?.image) {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = featuredPosts[0].image;
      document.head.appendChild(link);

      return () => {
        if (document.head.contains(link)) {
          document.head.removeChild(link);
        }
      };
    }
  }, [featuredPosts]);

  // Coletar todas as tags únicas dos posts
  const allTags = useMemo(() => {
    const tagsSet = new Set<string>();
    posts.forEach(post => {
      post.tags?.forEach((tag: string) => tagsSet.add(tag));
    });
    return Array.from(tagsSet).sort();
  }, [posts]);

  const filteredPosts = posts.filter(post => {
    // Filtro por termo de busca
    const matchesSearch =
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.subtitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.tags?.some((tag: string) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      );

    // Filtro por tags selecionadas
    const matchesTags =
      selectedTags.length === 0 ||
      selectedTags.some(tag => post.tags?.includes(tag));

    return matchesSearch && matchesTags;
  });

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const clearTagFilters = () => {
    setSelectedTags([]);
  };

  if (isLoading) {
    return <PageSkeleton />;
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <>
      <SEO
        title="Blog"
        description="Artigos sobre desenvolvimento web, React, TypeScript e tecnologia. Compartilhando conhecimento e experiências."
        url="/blog"
      />
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-12 pb-12"
      >
        <header className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold text-foreground-strong">
                {t("blog.title")}
              </h1>
              <p className="text-foreground/65">{t("blog.subtitle")}</p>
            </div>
            <a
              href="/rss.xml"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-foreground/5 hover:bg-foreground/10 border border-foreground/10 transition-colors text-foreground-strong/80 hover:text-foreground-strong"
              aria-label="Subscribe to RSS feed"
            >
              <Rss className="w-5 h-5" />
              <span className="hidden sm:inline">RSS</span>
            </a>
          </div>
        </header>

        {/* Featured Posts Carousel */}
        {featuredPosts.length > 0 && (
          <motion.section variants={item} className="space-y-6">
            <h2 className="text-xl font-bold text-foreground-strong">
              {t("blog.featured")}
            </h2>

            {featuredPosts.length === 1 ? (
              <Link href={`/blog/${featuredPosts[0].slug}`}>
                <div className="relative rounded-2xl overflow-hidden group cursor-pointer border border-foreground/5 shadow-2xl h-[400px]">
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent z-10"></div>
                  {featuredPosts[0].image ? (
                  <img
                    src={featuredPosts[0].image}
                    alt={featuredPosts[0].title}
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                    width="800"
                    height="400"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                  ) : (
                    <BlogCoverFallback tag={featuredPosts[0].tags?.[0]} />
                  )}

                  <div className="absolute bottom-0 left-0 right-0 p-8 z-20">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {featuredPosts[0].tags?.map((tag: string) => (
                        <Badge
                          key={tag}
                          className="bg-foreground/10 hover:bg-foreground/20 text-foreground-strong border-none backdrop-blur-sm"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <h3 className="text-2xl md:text-4xl font-bold text-foreground-strong mb-4 leading-tight max-w-4xl">
                      {featuredPosts[0].title}
                    </h3>

                    <p className="text-foreground/90 text-lg mb-6 max-w-3xl line-clamp-2">
                      {featuredPosts[0].subtitle}
                    </p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-foreground/65 space-x-4">
                        <span>
                          {new Date(
                            featuredPosts[0].published_at
                          ).toLocaleDateString("pt-BR")}
                        </span>
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {Math.ceil(
                            featuredPosts[0].content.split(" ").length / 200
                          )}{" "}
                          {t("blog.readTime")}
                        </span>
                      </div>

                      <Button className="bg-neon-purple hover:bg-neon-purple/90 text-primary-foreground">
                        {t("blog.readNow")}
                      </Button>
                    </div>
                  </div>
                </div>
              </Link>
            ) : (
              <Carousel className="w-full" opts={{ loop: true }}>
                <CarouselContent className="-ml-2 md:-ml-4">
                  {featuredPosts.map((post, index) => (
                    <CarouselItem
                      key={post.id}
                      className="pl-2 md:pl-4 basis-full"
                    >
                      <Link href={`/blog/${post.slug}`}>
                        <div className="relative rounded-2xl overflow-hidden group cursor-pointer border border-foreground/5 shadow-2xl h-[400px]">
                          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent z-10"></div>
                          {post.image ? (
                          <img
                            src={post.image}
                            alt={post.title}
                            loading={index === 0 ? "eager" : "lazy"}
                            fetchPriority={index === 0 ? "high" : "auto"}
                            decoding="async"
                            width="800"
                            height="400"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                    />
                          ) : (
                            <BlogCoverFallback tag={post.tags?.[0]} />
                          )}

                          <div className="absolute bottom-0 left-0 right-0 p-8 z-20">
                            <div className="flex flex-wrap gap-2 mb-4">
                              {post.tags?.map((tag: string) => (
                                <Badge
                                  key={tag}
                                  className="bg-foreground/10 hover:bg-foreground/20 text-foreground-strong border-none backdrop-blur-sm"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>

                            <h3 className="text-2xl md:text-4xl font-bold text-foreground-strong mb-4 leading-tight max-w-4xl">
                              {post.title}
                            </h3>

                            <p className="text-foreground/90 text-lg mb-6 max-w-3xl line-clamp-2">
                              {post.subtitle}
                            </p>

                            <div className="flex items-center justify-between">
                              <div className="flex items-center text-sm text-foreground/65 space-x-4">
                                <span>
                                  {new Date(
                                    post.published_at
                                  ).toLocaleDateString("pt-BR")}
                                </span>
                                <span className="flex items-center">
                                  <Clock className="w-4 h-4 mr-1" />
                                  {Math.ceil(
                                    post.content.split(" ").length / 200
                                  )}{" "}
                                  {t("blog.readTime")}
                                </span>
                              </div>

                              <Button className="bg-neon-purple hover:bg-neon-purple/90 text-primary-foreground">
                                {t("blog.readNow")}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-4 border-foreground/20 bg-background/50 hover:bg-background/70 text-foreground-strong hover:text-foreground-strong" />
                <CarouselNext className="right-4 border-foreground/20 bg-background/50 hover:bg-background/70 text-foreground-strong hover:text-foreground-strong" />
              </Carousel>
            )}
          </motion.section>
        )}

        {/* Search and Filter */}
        <motion.div variants={item} className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/42" />
            <Input
              placeholder={t("blog.searchPlaceholder")}
              className="pl-10 bg-foreground/5 border-foreground/10 text-foreground-strong placeholder:text-foreground/42 focus:border-neon-purple/50 focus:ring-neon-purple/20"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={`border-foreground/10 text-foreground/90 hover:text-foreground-strong hover:bg-foreground/5 ${
                  selectedTags.length > 0
                    ? "border-neon-purple/50 bg-neon-purple/10"
                    : ""
                }`}
              >
                <Filter className="mr-2 h-4 w-4" />
                {t("blog.filterByTags")}
                {selectedTags.length > 0 && (
                  <Badge className="ml-2 bg-neon-purple text-primary-foreground border-none">
                    {selectedTags.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 bg-background/95 border-foreground/10 backdrop-blur-sm">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-foreground-strong">{t("blog.filterByTags")}</h4>
                  {selectedTags.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearTagFilters}
                      className="h-7 px-2 text-xs text-foreground/65 hover:text-foreground-strong"
                    >
                      <X className="h-3 w-3 mr-1" />
                      {t("blog.clear")}
                    </Button>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {allTags.length === 0 ? (
                    <p className="text-sm text-foreground/65">{t("blog.noTags")}</p>
                  ) : (
                    allTags.map(tag => (
                      <div
                        key={tag}
                        className="flex items-center space-x-2 cursor-pointer hover:bg-foreground/5 rounded-md p-2 transition-colors"
                        onClick={() => handleTagToggle(tag)}
                      >
                        <Checkbox
                          checked={selectedTags.includes(tag)}
                          onCheckedChange={() => handleTagToggle(tag)}
                          className="border-foreground/20 data-[state=checked]:bg-neon-purple data-[state=checked]:border-neon-purple"
                        />
                        <label className="text-sm text-foreground/90 cursor-pointer flex-1">
                          {tag}
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </motion.div>

        {/* Posts Grid */}
        <motion.div variants={item} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredPosts.length === 0 ? (
              <div className="col-span-2 text-center py-12">
                <p className="text-foreground/65 text-lg">{t("blog.noPosts")}</p>
                <p className="text-foreground/42 text-sm mt-2">
                  {t("blog.comeBackSoon")}
                </p>
              </div>
            ) : (
              filteredPosts.map(post => (
                <Link key={post.id} href={`/blog/${post.slug}`}>
                  <div className="group rounded-xl bg-card border border-foreground/5 overflow-hidden hover:border-neon-purple/30 transition-all duration-300 flex flex-col h-full cursor-pointer">
                    <div className="relative h-48 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent z-10"></div>
                      {post.image ? (
                      <img
                        src={post.image}
                        alt={post.title}
                        loading="lazy"
                        decoding="async"
                        width="400"
                        height="200"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            />
                      ) : (
                        <BlogCoverFallback tag={post.tags?.[0]} />
                      )}
                    </div>

                    <div className="p-6 flex flex-col flex-1">
                      <div className="flex items-center text-xs text-foreground/42 mb-3 space-x-3">
                        <span>
                          {new Date(post.published_at).toLocaleDateString(
                            "pt-BR"
                          )}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                        <span>
                          {Math.ceil(post.content.split(" ").length / 200)}{" "}
                          {t("blog.readTime")}
                        </span>
                      </div>

                      <h3 className="text-xl font-bold text-foreground-strong mb-3 group-hover:text-neon-purple transition-colors">
                        {post.title}
                      </h3>

                      <p className="text-foreground/65 text-sm mb-6 line-clamp-2 flex-1">
                        {post.subtitle}
                      </p>

                      <div className="flex flex-wrap gap-2 mb-6">
                        {post.tags?.slice(0, 3).map((tag: string) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="bg-foreground/5 hover:bg-foreground/10 text-foreground/90 border border-foreground/5 text-[10px]"
                          >
                            {tag}
                          </Badge>
                        ))}
                        {post.tags?.length > 3 && (
                          <Badge
                            variant="secondary"
                            className="bg-foreground/5 text-foreground/90 border border-foreground/5 text-[10px]"
                          >
                            +{post.tags.length - 3}
                          </Badge>
                        )}
                      </div>

                      <span className="inline-flex items-center text-sm text-neon-purple hover:text-neon-lime transition-colors mt-auto">
                        {t("blog.readMore")}{" "}
                        <ChevronRight className="ml-1 w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}
