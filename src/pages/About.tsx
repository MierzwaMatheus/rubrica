import { useState } from "react";
import { SEO } from "@/components/SEO";
import { motion } from "framer-motion";
import { Code, HelpCircle } from "lucide-react";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { useI18n } from "@/i18n/context/I18nContext";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/useMobile";
import { useAbout } from "@/hooks/useAbout";
import { aboutRepository, homeRepository } from "@/repositories/instances";
import { useHome } from "@/hooks/useHome";
import { useWorkPrinciples } from "@/hooks/useWorkPrinciples";
import { highlightNumbers } from "@/utils/homeContent";
import { splitParagraphs } from "@/utils/aboutContent";

/** Parágrafo com os números de resultado em destaque, igual à home. */
function HighlightedParagraph({ text, className }: { text: string; className?: string }) {
  return (
    <p className={className}>
      {highlightNumbers(text).map((segment, i) =>
        segment.highlight ? (
          <strong key={i} className="text-foreground-strong font-semibold">
            {segment.text}
          </strong>
        ) : (
          <span key={i}>{segment.text}</span>
        )
      )}
    </p>
  );
}

/** Marcador em V, o chevron do símbolo da marca. */
function ChevronMark() {
  return (
    <svg viewBox="0 0 28 20" className="w-7 h-5 mb-4" aria-hidden="true">
      <path d="M0 0H8L14 6L20 0H28L14 14Z" fill="currentColor" className="text-neon-purple" />
    </svg>
  );
}

export default function About() {
  const { t } = useTranslation();
  const { isLoading: i18nLoading } = useI18n();
  const isMobile = useIsMobile();
  const { dailyRoutine, faq, isLoading } = useAbout(aboutRepository);
  const { aboutText } = useHome(homeRepository);
  const { principles } = useWorkPrinciples(homeRepository);
  const professionalParagraphs = splitParagraphs(aboutText);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const getSpanClasses = (spanSize: string) => {
    switch (spanSize) {
      case "1x2":
        return "row-span-2";
      case "2x1":
        return "col-span-2";
      case "2x2":
        return "col-span-2 row-span-2";
      default:
        return "";
    }
  };

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
        title="Sobre Mim"
        description="Conheça minha trajetória, dia-a-dia e respostas para perguntas frequentes sobre meu trabalho como desenvolvedor."
        url="/sobre"
      />
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-16 pb-12"
      >
        {/* Resumo profissional: o mesmo texto do "Sobre mim" da home, editado no admin */}
        {professionalParagraphs.length > 0 && (
          <motion.section variants={item}>
            <h2 className="text-2xl font-bold text-foreground-strong mb-8 flex items-center font-mono">
              <span className="text-neon-purple mr-2">/*</span>{" "}
              {t("about.professional.title")}{" "}
              <span className="text-neon-purple ml-2">*/</span>
            </h2>
            <div className="rounded-xl border border-foreground/10 bg-card/50 backdrop-blur-sm p-8 max-w-4xl space-y-5 leading-relaxed">
              {professionalParagraphs.map((paragraph, idx) => (
                <HighlightedParagraph
                  key={idx}
                  text={paragraph}
                  className={idx === 0 ? "text-lg text-foreground" : "text-base text-foreground/65"}
                />
              ))}
            </div>
          </motion.section>
        )}

        {/* Como eu trabalho: princípios editados no admin (homeContent work_principles) */}
        {principles.length > 0 && (
          <motion.section variants={item}>
            <h2 className="text-2xl font-bold text-foreground-strong mb-8 flex items-center font-mono">
              <span className="text-neon-purple mr-2">/*</span>{" "}
              {t("about.principles.title")}{" "}
              <span className="text-neon-purple ml-2">*/</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {principles.map((principle, idx) => (
                <div
                  key={idx}
                  className="bg-gradient-to-br from-foreground/5 to-background p-6 rounded-xl border border-foreground/5 hover:border-neon-purple/30 transition-colors"
                >
                  <ChevronMark />
                  <h3 className="font-bold text-lg text-foreground-strong mb-2">{principle.title}</h3>
                  {principle.description && (
                    <p className="text-sm text-foreground/65 leading-relaxed">{principle.description}</p>
                  )}
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Fora do trabalho: lado pessoal, depois do profissional */}
        <motion.section variants={item}>
          <h2 className="text-2xl font-bold text-foreground-strong mb-8 flex items-center font-mono">
            <span className="text-neon-purple mr-2">/*</span>{" "}
            {t("about.aboutMe.title")}{" "}
            <span className="text-neon-purple ml-2">*/</span>
          </h2>

          <div className="rounded-xl border border-foreground/10 bg-card/50 backdrop-blur-sm p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Code className="w-24 h-24 text-neon-purple" />
            </div>

            <div className="relative z-10 space-y-6 text-foreground/90 leading-relaxed text-lg">
              <p className="whitespace-pre-wrap">{t("about.aboutMe.text")}</p>
            </div>
          </div>
        </motion.section>

        {/* Meu Dia-a-Dia Section */}
        <motion.section variants={item}>
          <h2 className="text-2xl font-bold text-foreground-strong mb-8 flex items-center font-mono">
            <span className="text-neon-purple mr-2">/*</span>{" "}
            {t("about.dailyRoutine.title")}{" "}
            <span className="text-neon-purple ml-2">*/</span>
          </h2>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 auto-rows-[200px]">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-foreground/5 border border-foreground/10 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : dailyRoutine.length === 0 ? (
            <div className="rounded-xl border border-foreground/10 bg-card/50 backdrop-blur-sm p-8 text-center text-foreground/65">
              {t("about.dailyRoutine.empty")}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 auto-rows-[200px]">
              {dailyRoutine.map(routineItem => (
                <motion.div
                  key={routineItem.id}
                  className={cn(
                    "relative group cursor-pointer rounded-xl border border-foreground/10 overflow-hidden",
                    "bg-gradient-to-br from-foreground/5 to-background",
                    "hover:border-neon-purple/50 transition-all duration-300",
                    getSpanClasses(routineItem.span_size || "1x1")
                  )}
                  onMouseEnter={() => setHoveredItem(routineItem.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  onClick={() =>
                    setHoveredItem(
                      hoveredItem === routineItem.id ? null : routineItem.id
                    )
                  }
                  variants={item}
                >
                  {/* Image */}
                  <div className="absolute inset-0">
                    <img
                      src={routineItem.image_url}
                      alt={routineItem.description || ""}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/40 to-transparent" />
                  </div>

                  {/* Tags */}
                  <div className="absolute top-4 left-4 right-4 flex flex-wrap gap-2 z-10">
                    {routineItem.tags?.map((tag: string, idx: number) => (
                      <Badge
                        key={idx}
                        className="bg-neon-purple/80 text-primary-foreground border-none text-xs backdrop-blur-sm"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  {/* Overlay com descrição */}
                  <div
                    className={cn(
                      "absolute inset-0 bg-background/90 backdrop-blur-sm transition-all duration-300 z-20",
                      "flex items-center justify-center p-6",
                      hoveredItem === routineItem.id
                        ? "opacity-100 pointer-events-auto"
                        : "opacity-0 pointer-events-none"
                    )}
                  >
                    <p className="text-foreground-strong text-sm md:text-base leading-relaxed text-center">
                      {routineItem.description}
                    </p>
                  </div>

                  {/* Indicador de hover (mobile) */}
                  {isMobile && hoveredItem !== routineItem.id && (
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
                      <div className="bg-foreground/20 backdrop-blur-sm text-center px-3 py-1 rounded-full text-xs text-foreground-strong">
                        {t("about.tapToKnowMore")}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>

        {/* FAQ Section */}
        <motion.section variants={item}>
          <h2 className="text-2xl font-bold text-foreground-strong mb-8 flex items-center font-mono">
            <span className="text-neon-purple mr-2">/*</span>{" "}
            {t("about.faq.title")}{" "}
            <span className="text-neon-purple ml-2">*/</span>
          </h2>

          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-foreground/5 border border-foreground/10 rounded-xl p-6 animate-pulse"
                >
                  <div className="h-6 bg-gray-600/30 rounded w-3/4 mb-4" />
                  <div className="h-4 bg-gray-600/30 rounded w-full" />
                </div>
              ))}
            </div>
          ) : faq.length === 0 ? (
            <div className="rounded-xl border border-foreground/10 bg-card/50 backdrop-blur-sm p-8 text-center text-foreground/65">
              {t("about.faq.empty")}
            </div>
          ) : (
            <div className="rounded-xl border border-foreground/10 bg-card/50 backdrop-blur-sm overflow-hidden">
              <Accordion type="single" collapsible className="w-full">
                {faq.map((faqItem, index) => (
                  <AccordionItem
                    key={faqItem.id}
                    value={`faq-${faqItem.id}`}
                    className={cn(
                      "border-foreground/10",
                      index !== faq.length - 1 && "border-b"
                    )}
                  >
                    <AccordionTrigger className="text-foreground-strong hover:text-neon-purple px-6 py-4 hover:no-underline">
                      <div className="flex items-center gap-3">
                        <HelpCircle className="w-5 h-5 text-neon-purple shrink-0" />
                        <span className="text-left font-medium">
                          {faqItem.question}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-4 text-foreground/90 leading-relaxed">
                      <p className="whitespace-pre-wrap">{faqItem.answer}</p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          )}
        </motion.section>
      </motion.div>
    </>
  );
}
