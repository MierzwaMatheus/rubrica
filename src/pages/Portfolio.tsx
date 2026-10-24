import { PageSkeleton } from "@/components/PageSkeleton";
import { SEO } from "@/components/SEO";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FolderOpen,
  ExternalLink,
  Github,
  Layers,
  ZoomIn,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Link } from "wouter";
import { useI18n } from "@/i18n/context/I18nContext";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { usePortfolio } from "@/hooks/usePortfolio";
import { portfolioRepository } from "@/repositories/instances";
import { Project } from "@/repositories/interfaces/PortfolioRepository";
import { listCategories, filterByCategory, hasCaseStudy } from "@/utils/portfolioContent";

export default function Portfolio() {
  const { t } = useTranslation();
  const { isLoading: i18nLoading } = useI18n();
  const { projects, isLoading } = usePortfolio(portfolioRepository);
  // null = todas as categorias
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [expandedImage, setExpandedImage] = useState<{
    url: string;
    index: number;
    images: string[];
  } | null>(null);

  // Navegação por teclado para as imagens expandidas
  useEffect(() => {
    if (!expandedImage || expandedImage.images.length <= 1) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        const prevIndex =
          expandedImage.index > 0
            ? expandedImage.index - 1
            : expandedImage.images.length - 1;
        setExpandedImage({
          ...expandedImage,
          url: expandedImage.images[prevIndex],
          index: prevIndex,
        });
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        const nextIndex =
          expandedImage.index < expandedImage.images.length - 1
            ? expandedImage.index + 1
            : 0;
        setExpandedImage({
          ...expandedImage,
          url: expandedImage.images[nextIndex],
          index: nextIndex,
        });
      } else if (e.key === "Escape") {
        setExpandedImage(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [expandedImage]);

  // Filtros por categoria (definida no admin), não por tecnologia
  const categories = useMemo(() => listCategories(projects), [projects]);
  const filteredProjects = filterByCategory(projects, activeCategory);

  // Resetar filtro se a categoria selecionada não existir mais
  useEffect(() => {
    if (activeCategory && !categories.includes(activeCategory)) {
      setActiveCategory(null);
    }
  }, [activeCategory, categories]);

  if (isLoading || i18nLoading) {
    return <PageSkeleton />;
  }

  return (
    <>
      <SEO
        title="Portfólio de Projetos"
        description="Confira meus projetos de desenvolvimento front-end e full-stack. Cases com React, TypeScript e tecnologias modernas."
        url="/portfolio"
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-8 pb-12"
      >
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-foreground-strong">
            {t("portfolio.title")}
          </h1>
          <p className="text-foreground/65 mt-2">{t("portfolio.subtitle")}</p>
        </header>

        {/* Filters */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {[null, ...categories].map(category => (
              <button
                key={category ?? "__all"}
                onClick={() => setActiveCategory(category)}
                className={`
                  inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-all duration-300
                  ${
                    activeCategory === category
                      ? "bg-neon-purple text-primary-foreground shadow-[0_0_10px_color-mix(in_srgb,var(--primary)_40%,transparent)]"
                      : "bg-foreground/5 text-foreground/65 hover:bg-foreground/10 hover:text-foreground-strong border border-foreground/5"
                  }
                `}
              >
                {category ?? t("portfolio.all")}
              </button>
            ))}
          </div>
        )}

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredProjects.map(project => (
              <motion.div
                key={project.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="group rounded-xl bg-card border border-foreground/5 overflow-hidden hover:border-neon-purple/50 transition-all duration-300 hover:shadow-[0_0_20px_color-mix(in_srgb,var(--primary)_15%,transparent)] flex flex-col h-full"
              >
                <div className="relative h-48 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent z-10 opacity-60 group-hover:opacity-40 transition-opacity" />
                  {project.images && project.images.length > 0 ? (
                    <img
                      src={project.images[0]}
                      alt={project.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full bg-foreground/5 flex items-center justify-center text-foreground/42">
                      {t("portfolio.noImage")}
                    </div>
                  )}
                  <div className="absolute top-3 right-3 z-20 flex gap-2">
                    <div className="bg-background/60 backdrop-blur-md p-2 rounded-full border border-foreground/10 text-foreground-strong opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
                      <Layers className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                <div className="p-6 flex flex-col flex-grow">
                  <h3 className="text-xl font-bold text-foreground-strong mb-2 group-hover:text-neon-purple transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-foreground/65 text-sm mb-4 line-clamp-2 flex-grow">
                    {project.description}
                  </p>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {project.tags?.slice(0, 3).map((tag: string) => (
                      <span
                        key={tag}
                        className="text-[10px] uppercase tracking-wider px-2 py-1 rounded bg-foreground/5 text-foreground/90 border border-foreground/5"
                      >
                        {tag}
                      </span>
                    ))}
                    {project.tags?.length > 3 && (
                      <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded bg-foreground/5 text-foreground/90 border border-foreground/5">
                        +{project.tags.length - 3}
                      </span>
                    )}
                  </div>

                  {project.case_study?.metrics?.[0] && (
                    <p className="mb-5 flex items-baseline gap-2">
                      <span className="text-xl font-bold text-neon-purple">
                        {project.case_study.metrics[0].value}
                      </span>
                      <span className="text-xs text-foreground/65">
                        {project.case_study.metrics[0].label}
                      </span>
                    </p>
                  )}

                  {/* Uma ação por cartão: o case quando existe, senão os detalhes */}
                  <div className="mt-auto">
                    {hasCaseStudy(project) ? (
                      <Link
                        href={`/portfolio/${project.slug}`}
                        className="block"
                        data-umami-event="portfolio-case"
                        data-umami-event-case={project.slug}
                      >
                        <Button className="w-full bg-neon-purple/10 hover:bg-neon-purple text-neon-purple hover:text-primary-foreground border border-neon-purple/30 transition-all duration-300 font-mono">
                          {t("portfolio.viewCase")}
                        </Button>
                      </Link>
                    ) : (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        className="w-full bg-foreground/5 hover:bg-neon-purple hover:text-primary-foreground text-neon-lime border border-foreground/10 transition-all duration-300 group-hover:border-neon-purple/50"
                        onClick={() => setSelectedProject(project)}
                      >
                        {t("portfolio.details")}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl bg-background border-foreground/10 text-foreground-strong p-0 overflow-hidden max-h-[90vh] flex flex-col">
                      <VisuallyHidden>
                        <DialogTitle>{project.title}</DialogTitle>
                      </VisuallyHidden>

                      <div className="overflow-y-auto flex-1">
                        {/* Carousel Section */}
                        <div className="bg-background/50 p-6 flex items-center justify-center relative min-h-[250px]">
                          {project.images && project.images.length > 0 ? (
                            <Carousel className="w-full max-w-md mx-auto">
                              <CarouselContent>
                                {project.images.map(
                                  (img: string, idx: number) => (
                                    <CarouselItem key={idx}>
                                      <div className="aspect-video rounded-lg overflow-hidden border border-foreground/10 relative group/carousel">
                                        <img
                                          src={img}
                                          alt={`${project.title} - ${idx + 1}`}
                                          className="w-full h-full object-cover"
                                        />
                                        <button
                                          onClick={e => {
                                            e.stopPropagation();
                                            setExpandedImage({
                                              url: img,
                                              index: idx,
                                              images: project.images,
                                            });
                                          }}
                                          className="absolute inset-0 bg-background/40 opacity-0 group-hover/carousel:opacity-100 transition-opacity flex items-center justify-center hover:bg-background/50"
                                          aria-label={t(
                                            "portfolio.expandImage"
                                          )}
                                        >
                                          <div className="bg-background/80 backdrop-blur-sm p-3 rounded-full border border-foreground/20 hover:border-neon-purple transition-colors">
                                            <ZoomIn className="w-5 h-5 text-foreground-strong" />
                                          </div>
                                        </button>
                                      </div>
                                    </CarouselItem>
                                  )
                                )}
                              </CarouselContent>
                              <CarouselPrevious className="left-2 bg-background/50 border-foreground/10 text-foreground-strong hover:bg-neon-purple hover:text-primary-foreground hover:border-neon-purple" />
                              <CarouselNext className="right-2 bg-background/50 border-foreground/10 text-foreground-strong hover:bg-neon-purple hover:text-primary-foreground hover:border-neon-purple" />
                            </Carousel>
                          ) : (
                            <div className="text-foreground/42">
                              {t("portfolio.noImages")}
                            </div>
                          )}
                        </div>

                        {/* Details Section */}
                        <div className="p-6 lg:p-8 space-y-6 bg-card">
                          <div>
                            <div className="text-2xl font-bold text-foreground-strong mb-2">
                              {project.title}
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {project.tags?.map((tag: string) => (
                                <Badge
                                  key={tag}
                                  variant="outline"
                                  className="bg-neon-purple/10 text-neon-purple border-neon-purple/20 hover:bg-neon-purple/20"
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <DialogDescription className="text-foreground/90 text-base leading-relaxed whitespace-pre-line">
                            {project.long_description || project.description}
                          </DialogDescription>

                          <div className="space-y-3 pt-4 border-t border-foreground/5">
                            <h4 className="text-sm font-medium text-foreground/65 uppercase tracking-wider mb-3">
                              {t("portfolio.projectLinks")}
                            </h4>
                            <div className="grid grid-cols-2 gap-3">
                              {project.demo_link && (
                                <a
                                  href={project.demo_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-full"
                                >
                                  <Button className="w-full bg-neon-purple hover:bg-neon-purple/80 text-primary-foreground">
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    {t("portfolio.liveDemo")}
                                  </Button>
                                </a>
                              )}
                              {project.github_link && (
                                <a
                                  href={project.github_link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-full"
                                >
                                  <Button
                                    variant="outline"
                                    className="w-full border-foreground/20 text-foreground-strong hover:bg-foreground/10 hover:text-foreground-strong"
                                  >
                                    <Github className="mr-2 h-4 w-4" />
                                    {t("portfolio.code")}
                                  </Button>
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Dialog para imagem expandida */}
        <Dialog
          open={!!expandedImage}
          onOpenChange={open => !open && setExpandedImage(null)}
        >
          <DialogContent
            className="!max-w-[98vw] !w-[98vw] !h-[98vh] !max-h-[98vh] bg-card border-foreground/10 p-0 overflow-hidden flex flex-col !translate-x-[-50%] !translate-y-[-50%] !top-[50%] !left-[50%]"
            showCloseButton={false}
          >
            {expandedImage && (
              <>
                <DialogHeader className="p-4 border-b border-foreground/10 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <DialogTitle className="text-foreground-strong">
                      {t("portfolio.image")} {expandedImage.index + 1}{" "}
                      {t("portfolio.of")} {expandedImage.images.length}
                    </DialogTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setExpandedImage(null)}
                      className="text-foreground-strong hover:bg-foreground/10"
                      aria-label={t("common.close")}
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                </DialogHeader>
                <div className="relative flex-1 flex items-center justify-center bg-background/50 overflow-hidden min-h-0">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={expandedImage.url}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="w-full h-full flex items-center justify-center p-4"
                    >
                      <img
                        src={expandedImage.url}
                        alt={`Imagem expandida ${expandedImage.index + 1}`}
                        className="w-auto h-auto max-w-full max-h-full object-contain rounded-lg"
                        style={{ maxHeight: "calc(98vh - 100px)" }}
                      />
                    </motion.div>
                  </AnimatePresence>
                  {expandedImage.images.length > 1 && (
                    <>
                      <Button
                        variant="outline"
                        size="icon"
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/80 border-foreground/20 text-foreground-strong hover:bg-neon-purple hover:text-primary-foreground hover:border-neon-purple z-10"
                        onClick={() => {
                          const prevIndex =
                            expandedImage.index > 0
                              ? expandedImage.index - 1
                              : expandedImage.images.length - 1;
                          setExpandedImage({
                            ...expandedImage,
                            url: expandedImage.images[prevIndex],
                            index: prevIndex,
                          });
                        }}
                        aria-label={t("portfolio.previousImage")}
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/80 border-foreground/20 text-foreground-strong hover:bg-neon-purple hover:text-primary-foreground hover:border-neon-purple z-10"
                        onClick={() => {
                          const nextIndex =
                            expandedImage.index <
                            expandedImage.images.length - 1
                              ? expandedImage.index + 1
                              : 0;
                          setExpandedImage({
                            ...expandedImage,
                            url: expandedImage.images[nextIndex],
                            index: nextIndex,
                          });
                        }}
                        aria-label={t("portfolio.nextImage")}
                      >
                        <ChevronRight className="w-6 h-6" />
                      </Button>
                    </>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </motion.div>
    </>
  );
}
