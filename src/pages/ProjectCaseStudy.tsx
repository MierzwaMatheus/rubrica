import { PageSkeleton } from "@/components/PageSkeleton";
import { SEO } from "@/components/SEO";
import { useState, useEffect } from "react";
import { useRoute, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import * as LucideIcons from "lucide-react";
import {
  ArrowLeft,
  ExternalLink,
  Github,
  AlertTriangle,
  Lightbulb,
  TrendingUp,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
  Quote,
  UserCog,
  History,
  GitBranch,
  GraduationCap,
  ArrowRight,
  Languages,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useI18n } from "@/i18n/context/I18nContext";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { useProjectBySlug, usePortfolio } from "@/hooks/usePortfolio";
import { nextCase } from "@/utils/portfolioContent";
import { portfolioRepository } from "@/repositories/instances";
import type { CaseStudyTestimonial } from "@/repositories/interfaces/PortfolioRepository";
import { useContactWizard } from "@/contexts/ContactWizardContext";
import { usePlugin } from "@/contexts/PluginsContext";
import { MessageSquare } from "lucide-react";

function DynamicIcon({ name, className }: { name?: string; className?: string }) {
  if (!name) return null;
  const Icon = (LucideIcons as any)[name] as React.ComponentType<{ className?: string }>;
  if (!Icon) return null;
  return <Icon className={className} />;
}

// Ordem da narrativa: antes → problema → solução → decisões → resultados.
// Seções opcionais (context, decisions) só aparecem quando preenchidas.
const narrativeSections = [
  {
    key: "context" as const,
    icon: History,
    iconColor: "text-foreground/90",
    borderColor: "border-foreground/15",
    bgColor: "bg-foreground/[0.03]",
    labelKey: "portfolio.before",
  },
  {
    key: "problem" as const,
    icon: AlertTriangle,
    iconColor: "text-red-600 dark:text-red-400",
    borderColor: "border-red-600/30 dark:border-red-400/30",
    bgColor: "bg-red-600/5 dark:bg-red-400/5",
    labelKey: "portfolio.problem",
  },
  {
    key: "solution" as const,
    icon: Lightbulb,
    iconColor: "text-neon-lime",
    borderColor: "border-neon-lime/30",
    bgColor: "bg-neon-lime/5",
    labelKey: "portfolio.solution",
  },
  {
    key: "decisions" as const,
    icon: GitBranch,
    iconColor: "text-neon-purple",
    borderColor: "border-neon-purple/30",
    bgColor: "bg-neon-purple/5",
    labelKey: "portfolio.decisions",
  },
  {
    key: "results" as const,
    icon: TrendingUp,
    iconColor: "text-green-700 dark:text-green-400",
    borderColor: "border-green-700/30 dark:border-green-400/30",
    bgColor: "bg-green-700/5 dark:bg-green-400/5",
    labelKey: "portfolio.results",
  },
];

export default function ProjectCaseStudy() {
  const { t } = useTranslation();
  const { isLoading: i18nLoading } = useI18n();
  const [, params] = useRoute("/portfolio/:slug");
  const { project, isLoading } = useProjectBySlug(portfolioRepository, params?.slug);
  const { projects } = usePortfolio(portfolioRepository);
  const next = nextCase(projects, params?.slug);
  const { openWizard } = useContactWizard();
  const wizardEnabled = usePlugin('contact-wizard');
  const [expandedImage, setExpandedImage] = useState<{
    url: string;
    index: number;
    images: string[];
  } | null>(null);

  useEffect(() => {
    if (!expandedImage || expandedImage.images.length <= 1) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        const prev = expandedImage.index > 0 ? expandedImage.index - 1 : expandedImage.images.length - 1;
        setExpandedImage({ ...expandedImage, index: prev, url: expandedImage.images[prev] });
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        const next = expandedImage.index < expandedImage.images.length - 1 ? expandedImage.index + 1 : 0;
        setExpandedImage({ ...expandedImage, index: next, url: expandedImage.images[next] });
      } else if (e.key === "Escape") {
        setExpandedImage(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [expandedImage]);

  if (isLoading || i18nLoading) return <PageSkeleton />;

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <h1 className="text-3xl font-bold text-foreground-strong">{t("portfolio.projectNotFound")}</h1>
        <p className="text-foreground/65">{t("portfolio.projectNotFoundDescription")}</p>
        <Link href="/portfolio">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("portfolio.backToPortfolio")}
          </Button>
        </Link>
      </div>
    );
  }

  const cs = project.case_study;

  return (
    <>
      <SEO
        title={`${project.title} — ${t("portfolio.caseStudy")}`}
        description={project.description}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto pb-16 space-y-12"
      >
        {/* Back link */}
        <Link href="/portfolio">
          <Button variant="ghost" className="text-foreground/65 hover:text-foreground-strong -ml-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("portfolio.backToPortfolio")}
          </Button>
        </Link>

        {/* Hero */}
        <div className="relative rounded-2xl overflow-hidden border border-foreground/10">
          {project.images && project.images.length > 0 ? (
            <img
              src={project.images[0]}
              alt={project.title}
              className="w-full h-64 md:h-80 object-cover"
            />
          ) : (
            <div className="w-full h-64 md:h-80 bg-foreground/5 flex items-center justify-center text-foreground/42">
              {t("portfolio.noImage")}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/50 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
            <h1 className="text-3xl md:text-5xl font-bold text-foreground-strong mb-3">{project.title}</h1>
            <div className="flex flex-wrap gap-2 mb-4">
              {project.tags?.map((tag: string) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="bg-neon-purple/20 text-neon-purple border-neon-purple/30"
                >
                  {tag}
                </Badge>
              ))}
            </div>
            <div className="flex gap-3">
              {project.demo_link && (
                <a href={project.demo_link} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" className="bg-neon-purple hover:bg-neon-purple/80 text-primary-foreground">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    {t("portfolio.liveDemo")}
                  </Button>
                </a>
              )}
              {project.github_link && (
                <a href={project.github_link} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="border-foreground/20 text-foreground-strong hover:bg-foreground/10">
                    <Github className="mr-2 h-4 w-4" />
                    {t("portfolio.code")}
                  </Button>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Meu papel */}
        {cs?.role && (
          <div className="rounded-xl border border-neon-purple/30 bg-gradient-to-br from-neon-purple/10 to-transparent p-6">
            <div className="flex items-center gap-3 mb-3">
              <UserCog className="h-5 w-5 text-neon-purple shrink-0" />
              <h2 className="text-lg font-semibold text-foreground-strong">{t("portfolio.myRole")}</h2>
            </div>
            <p className="text-foreground leading-relaxed whitespace-pre-line">{cs.role}</p>
          </div>
        )}

        {/* Narrative sections */}
        {cs && (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
            className="space-y-6"
          >
            {narrativeSections.filter(({ key }) => cs[key]?.trim()).map(({ key, icon: Icon, iconColor, borderColor, bgColor, labelKey }) => (
              <motion.div
                key={key}
                variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }}
                className={`rounded-xl border ${borderColor} ${bgColor} p-6`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <Icon className={`h-5 w-5 ${iconColor} shrink-0`} />
                  <h2 className="text-lg font-semibold text-foreground-strong">{t(labelKey)}</h2>
                </div>
                <p className="text-foreground/90 leading-relaxed whitespace-pre-line">{cs[key]}</p>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Metrics */}
        {cs && cs.metrics && cs.metrics.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-foreground-strong mb-4">{t("portfolio.metrics")}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {cs.metrics.map((metric, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.07 }}
                  className="bg-foreground/5 border border-foreground/10 rounded-xl p-4 flex flex-col items-center justify-center text-center gap-2 min-h-[100px]"
                >
                  {metric.icon && (
                    <DynamicIcon name={metric.icon} className="h-5 w-5 text-neon-purple shrink-0" />
                  )}
                  <div className="text-2xl font-bold text-neon-purple leading-tight break-words w-full">{metric.value}</div>
                  <div className="text-xs text-foreground/65 leading-snug">{metric.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Aprendizados */}
        {cs?.learnings?.trim() && (
          <div className="rounded-xl border border-foreground/15 bg-foreground/[0.03] p-6">
            <div className="flex items-center gap-3 mb-3">
              <GraduationCap className="h-5 w-5 text-neon-lime shrink-0" />
              <h2 className="text-lg font-semibold text-foreground-strong">{t("portfolio.learnings")}</h2>
            </div>
            <p className="text-foreground/90 leading-relaxed whitespace-pre-line">{cs.learnings}</p>
          </div>
        )}

        {/* Screenshots carousel */}
        {project.images && project.images.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-foreground-strong mb-4">{t("portfolio.screenshots")}</h2>
            <Carousel className="w-full">
              <CarouselContent>
                {project.images.map((img: string, idx: number) => (
                  <CarouselItem key={idx} className="md:basis-1/2">
                    <div className="aspect-video rounded-lg overflow-hidden border border-foreground/10 relative group">
                      <img
                        src={img}
                        alt={`${project.title} - ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => setExpandedImage({ url: img, index: idx, images: project.images })}
                        className="absolute inset-0 bg-background/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        aria-label={t("portfolio.expandImage")}
                      >
                        <div className="bg-background/80 backdrop-blur-sm p-3 rounded-full border border-foreground/20 hover:border-neon-purple transition-colors">
                          <ZoomIn className="w-5 h-5 text-foreground-strong" />
                        </div>
                      </button>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-2 bg-background/50 border-foreground/10 text-foreground-strong hover:bg-neon-purple hover:border-neon-purple hover:text-primary-foreground" />
              <CarouselNext className="right-2 bg-background/50 border-foreground/10 text-foreground-strong hover:bg-neon-purple hover:border-neon-purple hover:text-primary-foreground" />
            </Carousel>
          </div>
        )}

        {/* Testimonial */}
        {cs?.testimonial && <CaseTestimonial testimonial={cs.testimonial} />}

        {/* CTA específico + próximo case */}
        {(wizardEnabled || next) && (
          <div className="mt-10 rounded-xl border border-neon-purple/30 bg-gradient-to-br from-neon-purple/10 to-transparent p-6 md:p-8">
            <p className="text-sm font-mono text-neon-purple mb-2">
              <span className="text-foreground-strong mr-2">$</span>./contato.sh --projeto
            </p>
            <h2 className="text-xl md:text-2xl font-bold text-foreground-strong">{t("portfolio.ctaTitle")}</h2>
            <p className="text-foreground/65 text-sm mt-1">{t("portfolio.ctaSubtitle")}</p>
            <div className="flex flex-wrap gap-3 mt-5">
              {wizardEnabled && (
                <Button
                  onClick={() => openWizard({ flowType: "project", sourceContext: `case-${params?.slug ?? ""}` })}
                  data-umami-event="case-cta-projeto"
                  data-umami-event-case={params?.slug}
                  className="bg-neon-purple hover:bg-neon-purple/80 text-primary-foreground font-semibold"
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  {t("portfolio.ctaProject")}
                </Button>
              )}
              {next && (
                <Link
                  href={`/portfolio/${next.slug}`}
                  data-umami-event="case-next"
                  data-umami-event-case={next.slug}
                  className="inline-flex items-center gap-2 h-9 px-4 rounded-md border border-foreground/15 text-foreground hover:border-neon-lime/50 hover:text-neon-lime transition-colors text-sm"
                >
                  {t("portfolio.nextCase")}: <span className="font-semibold">{next.title}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>
        )}
      </motion.div>

      {/* Fullscreen image — ocupa quase toda a tela */}
      <AnimatePresence>
        {expandedImage && (
          <Dialog open onOpenChange={() => setExpandedImage(null)}>
            <DialogContent
              showCloseButton={false}
              className="!fixed !inset-2 !max-w-none !w-auto !h-auto !translate-x-0 !translate-y-0 !top-0 !left-0 bg-background/97 border-border p-0 flex flex-col"
            >
              <VisuallyHidden>
                <span>{t("portfolio.expandImage")}</span>
              </VisuallyHidden>

              {/* Controls bar */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-foreground/10 shrink-0">
                <span className="text-foreground/65 text-sm">
                  {expandedImage.index + 1} {t("portfolio.of")} {expandedImage.images.length}
                </span>
                <button
                  onClick={() => setExpandedImage(null)}
                  className="bg-foreground/10 hover:bg-foreground/20 text-foreground-strong p-2 rounded-full transition-colors"
                  aria-label="Fechar"
                >
                  <LucideIcons.X className="w-5 h-5" />
                </button>
              </div>

              {/* Image area */}
              <div className="relative flex-1 flex items-center justify-center overflow-hidden p-4">
                <img
                  src={expandedImage.url}
                  alt=""
                  className="max-w-full max-h-full object-contain rounded-lg"
                />

                {expandedImage.images.length > 1 && (
                  <>
                    <button
                      onClick={() => {
                        const prev = expandedImage.index > 0 ? expandedImage.index - 1 : expandedImage.images.length - 1;
                        setExpandedImage({ ...expandedImage, index: prev, url: expandedImage.images[prev] });
                      }}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/60 hover:bg-background/80 text-foreground-strong p-3 rounded-full transition-colors"
                      aria-label={t("portfolio.previousImage")}
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button
                      onClick={() => {
                        const next = expandedImage.index < expandedImage.images.length - 1 ? expandedImage.index + 1 : 0;
                        setExpandedImage({ ...expandedImage, index: next, url: expandedImage.images[next] });
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/60 hover:bg-background/80 text-foreground-strong p-3 rounded-full transition-colors"
                      aria-label={t("portfolio.nextImage")}
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </>
  );
}

/** Depoimento do case. Quando o texto é uma tradução, avisa e deixa ver o original. */
function CaseTestimonial({ testimonial }: { testimonial: CaseStudyTestimonial }) {
  const { t } = useTranslation();
  const [showOriginal, setShowOriginal] = useState(false);
  const original = testimonial.original;
  const shown = original && showOriginal ? original : testimonial;

  return (
    <div className="border-l-4 border-neon-purple bg-foreground/5 rounded-r-xl p-6">
      <h2 className="text-lg font-semibold text-foreground-strong mb-3 flex items-center gap-2">
        <Quote className="h-5 w-5 text-neon-purple" />
        {t("portfolio.testimonial")}
      </h2>
      <p
        className="text-foreground/90 italic leading-relaxed mb-3"
        lang={original && showOriginal ? original.lang : undefined}
      >
        "{shown.text}"
      </p>
      <p className="text-neon-purple font-medium">{testimonial.author}</p>
      {shown.role && <p className="text-foreground/42 text-sm">{shown.role}</p>}
      {original && (
        <p className="mt-4 text-xs text-foreground/55 flex flex-wrap items-center gap-x-2 gap-y-1">
          <Languages className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>
            {t(original.lang === "en-US" ? "portfolio.testimonialTranslatedFromEn" : "portfolio.testimonialTranslatedFromPt")}
          </span>
          <button
            type="button"
            onClick={() => setShowOriginal(v => !v)}
            aria-pressed={showOriginal}
            className="underline underline-offset-2 text-neon-purple hover:text-neon-purple/80"
          >
            {t(showOriginal ? "portfolio.showTranslation" : "portfolio.showOriginal")}
          </button>
        </p>
      )}
    </div>
  );
}
