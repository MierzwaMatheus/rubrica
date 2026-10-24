import { PageSkeleton } from "@/components/PageSkeleton";
import { SEO } from "@/components/SEO";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Terminal,
  Cpu,
  Zap,
  Layout as LayoutIcon,
  MessageSquare,
  Quote,
  Star,
  ArrowRight,
  Briefcase,
  FolderOpen,
} from "lucide-react";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { useI18n } from "@/i18n/context/I18nContext";
import { useHome } from "@/hooks/useHome";
import { useSiteConfig } from "@/hooks/useSiteConfig";
import { useHomeMetrics } from "@/hooks/useHomeMetrics";
import { homeRepository, portfolioRepository } from "@/repositories/instances";
import { usePortfolio } from "@/hooks/usePortfolio";
import { useContactWizard } from "@/contexts/ContactWizardContext";
import { selectFeaturedCases, highlightNumbers } from "@/utils/homeContent";
import { useMatrixText } from "@/hooks/useMatrixText";
import { AvailabilityBadge } from "@/components/AvailabilityBadge";
import { TestimonialWizard } from "@/components/TestimonialWizard";
import { usePlugin } from "@/contexts/PluginsContext";
import { Link } from "wouter";

export default function Home() {
  const { t } = useTranslation();
  const { isLoading: i18nLoading } = useI18n();
  const siteConfig = useSiteConfig();
  const { contactName, contactRole, aboutText, services, testimonials, availability, contactWizardEnabled, isLoading } =
    useHome(homeRepository);
  const { projects } = usePortfolio(portfolioRepository);
  const { openWizard } = useContactWizard();
  const portfolioEnabled = usePlugin("portfolio");
  const featuredCases = portfolioEnabled ? selectFeaturedCases(projects) : [];
  const { metrics } = useHomeMetrics(homeRepository);
  const [wizardOpen, setWizardOpen] = useState(false);
  const testimonialsEnabled = usePlugin("testimonials");
  const testimonialsIntakeEnabled = usePlugin("testimonials-intake");

  const matrixAboutText = useMatrixText({
    text: t("home.loading"),
    speed: 30,
    chars: "!@#$%^&*()_+-=[]{}|;:,.<>?~ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
  });

  const matrixTestimonialText = useMatrixText({
    text: t("home.loadingTestimonial"),
    speed: 30,
    chars: "!@#$%^&*()_+-=[]{}|;:,.<>?~ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
  });

  // Fallback para contactRole se não houver dados
  const displayContactRole = contactRole || t("home.subtitle");

  if (isLoading || i18nLoading) {
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
        title={siteConfig.seo_home_title || siteConfig.site_title}
        description={siteConfig.seo_home_description || undefined}
        url="/"
      />
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-16 pb-12"
      >
        {/* Hero: quem sou, o que entrego, prova e próximos passos na primeira tela */}
        <motion.section variants={item}>
          {availability?.available && (
            <AvailabilityBadge label={availability.label} />
          )}

          <div className="inline-flex items-center px-4 py-1.5 mb-6 bg-foreground/5 border border-foreground/10 rounded-full backdrop-blur-sm">
            <Terminal className="w-3 h-3 text-neon-purple mr-2" />
            <p className="text-sm font-medium text-neon-purple font-mono">
              <span className="text-foreground-strong mr-2">$</span>
              {t("home.greeting")}
              <span className="text-foreground/42 mx-2">→</span>
              <span className="text-foreground-strong">{contactName}</span>
              <span className="inline-block w-2 h-0.5 bg-neon-lime ml-1 animate-pulse align-middle" aria-hidden="true" />
            </p>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground-strong leading-[1.08] tracking-tight max-w-4xl">
            {t("home.hero.headline")}
          </h1>

          <h2 className="text-xl md:text-2xl mt-6 text-neon-lime font-light">
            {displayContactRole}
          </h2>

          <p className="max-w-2xl mt-4 text-foreground/90 text-lg leading-relaxed border-l-2 border-neon-purple/50 pl-6">
            {t("home.hero.description")}
          </p>

          <div className="flex flex-wrap gap-3 mt-8">
            {featuredCases.length > 0 && (
              <a
                href="#cases"
                data-umami-event="home-hero-ver-cases"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-neon-purple text-primary-foreground font-semibold hover:bg-neon-purple/90 transition-colors"
              >
                <FolderOpen className="w-4 h-4" />
                {t("home.hero.ctaCases")}
              </a>
            )}
            {contactWizardEnabled && (
              <button
                onClick={() => openWizard({ sourceContext: "home-hero" })}
                data-umami-event="home-hero-fale-comigo"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-neon-purple/50 bg-neon-purple/10 text-neon-purple font-semibold hover:bg-neon-purple/20 hover:border-neon-purple transition-all"
              >
                <MessageSquare className="w-4 h-4" />
                {t("home.hero.ctaContact")}
              </button>
            )}
          </div>

          {metrics.length > 0 && (
            <dl className="grid grid-cols-2 lg:grid-cols-4 gap-px mt-12 rounded-xl overflow-hidden border border-foreground/10 bg-foreground/10">
              {metrics.map(metric => (
                <div key={metric.label} className="bg-background p-5">
                  <dt className="sr-only">{metric.label}</dt>
                  <dd className="text-2xl md:text-3xl font-bold text-foreground-strong tracking-tight">
                    {metric.value}
                  </dd>
                  <dd className="text-sm text-foreground/65 mt-2 leading-snug">{metric.label}</dd>
                </div>
              ))}
            </dl>
          )}
        </motion.section>

        {/* Cases em destaque: o melhor trabalho logo depois da primeira tela */}
        {featuredCases.length > 0 && (
          <motion.section variants={item} id="cases" className="scroll-mt-8">
            <div className="flex flex-wrap items-baseline justify-between gap-4 mb-8">
              <h2 className="text-2xl font-bold text-foreground-strong flex items-center font-mono">
                <span className="text-neon-purple mr-2">/*</span>
                {t("home.cases.title")}
                <span className="text-neon-purple ml-2">*/</span>
              </h2>
              <Link
                href="/portfolio"
                className="text-sm text-foreground/65 hover:text-foreground-strong transition-colors font-mono inline-flex items-center gap-1"
              >
                {t("home.cases.viewAll")} <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredCases.map(project => {
                const metric = project.case_study?.metrics?.[0];
                return (
                  <Link
                    key={project.id}
                    href={`/portfolio/${project.slug}`}
                    data-umami-event="home-case"
                    data-umami-event-case={project.slug}
                    className="group flex flex-col rounded-xl overflow-hidden border border-foreground/5 bg-gradient-to-br from-foreground/5 to-background hover:border-neon-purple/40 transition-all duration-300 hover:-translate-y-1"
                  >
                    <div className="aspect-[16/9] overflow-hidden bg-foreground/10">
                      {project.images?.[0] && (
                        <img
                          src={project.images[0]}
                          alt={project.title}
                          loading="lazy"
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                        />
                      )}
                    </div>
                    <div className="flex flex-col flex-1 p-6">
                      <h3 className="font-bold text-lg text-foreground-strong leading-snug">{project.title}</h3>
                      <p className="text-sm text-foreground/65 leading-relaxed mt-2 line-clamp-2">
                        {project.description}
                      </p>
                      {metric && (
                        <p className="mt-4 flex items-baseline gap-2">
                          <span className="text-xl font-bold text-neon-purple">{metric.value}</span>
                          <span className="text-xs text-foreground/65">{metric.label}</span>
                        </p>
                      )}
                      <span className="mt-auto pt-5 text-sm font-mono text-neon-lime inline-flex items-center gap-2">
                        {t("home.cases.read")}
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </motion.section>
        )}

        {/* Sobre: parágrafos curtos com os números em destaque, para leitura em varredura */}
        <motion.section variants={item}>
          <h2 className="text-2xl font-bold text-foreground-strong mb-8 flex items-center font-mono">
            <span className="text-neon-purple mr-2">/*</span>{" "}
            {t("home.about.title")}{" "}
            <span className="text-neon-purple ml-2">*/</span>
          </h2>

          <div className="rounded-xl border border-foreground/10 bg-card/50 backdrop-blur-sm p-8 max-w-4xl">
            {aboutText ? (
              <div className="space-y-5 leading-relaxed">
                {aboutText
                  .split(/\n\s*\n/)
                  .map(paragraph => paragraph.trim())
                  .filter(Boolean)
                  .map((paragraph, idx) => (
                    <p
                      key={idx}
                      className={idx === 0 ? "text-lg text-foreground" : "text-base text-foreground/65"}
                    >
                      {highlightNumbers(paragraph).map((segment, i) =>
                        segment.highlight ? (
                          <strong key={i} className="text-foreground-strong font-semibold">
                            {segment.text}
                          </strong>
                        ) : (
                          <span key={i}>{segment.text}</span>
                        )
                      )}
                    </p>
                  ))}
              </div>
            ) : (
              <p className="whitespace-pre-wrap text-neon-lime font-mono">
                {isLoading ? matrixAboutText : t("home.about.loading")}
              </p>
            )}
          </div>
        </motion.section>

        {/* O que eu faço */}
        <motion.section variants={item}>
          <h2 className="text-2xl font-bold text-foreground-strong mb-8 flex items-center font-mono">
            <span className="text-neon-purple mr-2">/*</span> {t("home.skills.title")}{" "}
            <span className="text-neon-purple ml-2">*/</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {services.map((skill, idx) => {
              const icons = [Zap, Terminal, LayoutIcon, Cpu];
              const Icon = icons[idx % icons.length];
              const isLastItem = idx === services.length - 1;
              const isOddCount = services.length % 2 !== 0;
              const shouldSpanFull =
                services.length === 1 || (isLastItem && isOddCount);

              return (
                <div
                  key={skill.id || idx}
                  className={`bg-gradient-to-br from-foreground/5 to-background p-8 rounded-xl border border-foreground/5 hover:border-neon-purple/30 transition-all duration-300 group hover:-translate-y-1 ${shouldSpanFull ? "md:col-span-2" : ""}`}
                >
                  <div className="mb-4 p-3 bg-foreground/5 rounded-lg w-fit group-hover:bg-neon-purple/10 transition-colors">
                    <Icon className="w-6 h-6 text-neon-lime" />
                  </div>
                  {isLoading ? (
                    <>
                      <div className="h-6 w-3/4 bg-gray-600/30 rounded mb-3 animate-pulse"></div>
                      <div className="space-y-2 animate-pulse">
                        {Array.from({ length: 3 }).map((_, i) => (
                          <div
                            key={i}
                            className="h-3 bg-gray-600/30 rounded w-full"
                          ></div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 className="font-bold text-lg text-neon-lime mb-3 group-hover:text-foreground-strong transition-colors">
                        {skill.title}
                      </h3>
                      <p className="text-sm text-foreground/65 leading-relaxed">
                        {skill.description}
                      </p>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </motion.section>

        {/* Testimonials */}
        <motion.section variants={item}>
          <h3 className="text-xl font-bold text-foreground-strong mb-8 flex items-center">
            <MessageSquare className="w-5 h-5 text-neon-purple mr-3" />
            {t("home.testimonials.title")}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {testimonials.map((testimonial, idx) => (
              <div
                key={testimonial.id || idx}
                className="bg-gradient-to-br from-foreground/5 to-background p-6 rounded-xl border border-foreground/5 relative"
              >
                <Quote className="absolute top-6 right-6 w-8 h-8 text-foreground-strong/5" />
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden border border-foreground/10 mr-4">
                    <img
                      src={testimonial.image_url}
                      alt={testimonial.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground-strong">
                      {testimonial.name}
                    </p>
                    <p className="text-xs text-neon-purple">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
                {isLoading ? (
                  <p className="text-neon-lime font-mono text-sm italic leading-relaxed">
                    {matrixTestimonialText}
                  </p>
                ) : (
                  <p className="text-foreground/65 text-sm italic leading-relaxed">
                    "{testimonial.text}"
                  </p>
                )}
              </div>
            ))}
          </div>

          {testimonialsEnabled && (
            <div className="text-center mt-8 flex flex-col items-center gap-3">
              <Link
                href="/depoimentos"
                className="text-sm text-foreground/42 hover:text-foreground/90 transition-colors underline underline-offset-4"
              >
                {t("testimonials.viewAll")}
              </Link>
              {testimonialsIntakeEnabled && (
                <button
                  onClick={() => setWizardOpen(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-neon-purple/40 bg-neon-purple/5 text-neon-purple hover:bg-neon-purple/10 hover:border-neon-purple transition-all text-sm font-medium"
                >
                  <Star className="w-4 h-4" />
                  {t("testimonials.leaveTestimonial")}
                </button>
              )}
            </div>
          )}

          <TestimonialWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />
        </motion.section>

        {/* Fechamento: um caminho para quem tem projeto e outro para quem tem vaga */}
        {contactWizardEnabled && (
          <motion.section variants={item}>
            <div className="rounded-xl border border-neon-purple/30 bg-gradient-to-br from-neon-purple/10 to-transparent p-8 md:p-10">
              <p className="text-sm font-mono text-neon-purple mb-3">
                <span className="text-foreground-strong mr-2">$</span>./contato.sh
              </p>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground-strong">{t("home.cta.title")}</h2>
              <p className="text-foreground/65 mt-2">{t("home.cta.subtitle")}</p>
              <div className="flex flex-wrap gap-3 mt-6">
                <button
                  onClick={() => openWizard({ flowType: "project", sourceContext: "home-cta" })}
                  data-umami-event="home-cta-projeto"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-neon-purple text-primary-foreground font-semibold hover:bg-neon-purple/90 transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  {t("home.cta.project")}
                </button>
                <button
                  onClick={() => openWizard({ flowType: "job", sourceContext: "home-cta" })}
                  data-umami-event="home-cta-vaga"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-neon-lime/50 text-neon-lime font-semibold hover:bg-neon-lime/10 transition-colors"
                >
                  <Briefcase className="w-4 h-4" />
                  {t("home.cta.job")}
                </button>
              </div>
            </div>
          </motion.section>
        )}
      </motion.div>
    </>
  );
}
