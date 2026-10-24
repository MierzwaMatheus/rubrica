import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { MessageSquare, Quote, Star } from "lucide-react";
import { SEO } from "@/components/SEO";
import { TestimonialWizard } from "@/components/TestimonialWizard";
import { usePlugin } from "@/contexts/PluginsContext";
import { useI18n } from "@/i18n/context/I18nContext";
import { groupByCategory } from "@/utils/groupByCategory";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const CARD_GRADIENTS = [
  "from-foreground/5 to-background",
  "from-primary/10 to-background",
  "from-neon-lime/10 to-background",
  "from-foreground/10 to-background",
  "from-primary/5 to-background",
  "from-neon-lime/5 to-background",
];

function SkeletonCard() {
  return (
    <div className="animate-pulse bg-foreground/5 rounded-xl p-6 space-y-4 border border-foreground/5 break-inside-avoid mb-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-foreground/10 flex-shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="h-3 bg-foreground/10 rounded w-1/2" />
          <div className="h-2.5 bg-foreground/5 rounded w-1/3" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-2.5 bg-foreground/5 rounded w-full" />
        <div className="h-2.5 bg-foreground/5 rounded w-5/6" />
        <div className="h-2.5 bg-foreground/5 rounded w-4/6" />
      </div>
    </div>
  );
}

export default function TestimonialsPage() {
  const { locale, t } = useI18n();
  const testimonials = useQuery(api.testimonials.list, {});
  const testimonialsIntakeEnabled = usePlugin("testimonials-intake");
  const [wizardOpen, setWizardOpen] = useState(false);

  const isLoading = testimonials === undefined;
  const isEnglish = locale === "en-US";

  const resolved = (testimonials ?? []).map((t) => ({
    ...t,
    displayRole:
      (isEnglish && t.roleTranslations?.enUS) || t.roleTranslations?.ptBR || t.role,
    displayText:
      (isEnglish && t.textTranslations?.enUS) || t.textTranslations?.ptBR || t.text,
  }));

  return (
    <>
      <SEO
        title={t("testimonials.title")}
        description="Veja o que clientes e colegas dizem sobre o meu trabalho."
        url="/depoimentos"
      />
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-10 pb-12"
      >
        {/* Header */}
        <motion.section variants={item}>
          <h2 className="text-2xl font-bold text-foreground-strong mb-3 flex items-center">
            <MessageSquare className="w-5 h-5 text-neon-purple mr-3" />
            {t("testimonials.title")}
          </h2>
          <p className="text-foreground/65 text-sm">
            {t("testimonials.subtitle")}
            {!isLoading && resolved.length > 0 && (
              <span className="ml-2 text-foreground/25">
                ({resolved.length}{" "}
                {resolved.length === 1 ? "depoimento" : "depoimentos"})
              </span>
            )}
          </p>
        </motion.section>

        {/* Grid */}
        <motion.section variants={item}>
          {isLoading ? (
            <div className="columns-1 md:columns-2 gap-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : resolved.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-14 h-14 rounded-xl bg-foreground/5 border border-foreground/10 flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-foreground/25" />
              </div>
              <p className="text-foreground/42 text-sm">{t("testimonials.empty")}</p>
            </div>
          ) : (
            <div className="space-y-10">
              {groupByCategory(resolved).map(group => (
                <div key={group.category ?? "__none"}>
                  {group.category && (
                    <h3 className="text-sm font-mono uppercase tracking-wider text-neon-purple mb-4">
                      <span className="text-foreground-strong/40 mr-2">//</span>
                      {group.category}
                    </h3>
                  )}
                  <div className="columns-1 md:columns-2 gap-5">
                    {group.items.map((testimonial, idx) => {
                      const gradient = CARD_GRADIENTS[idx % CARD_GRADIENTS.length];
                      const initials = testimonial.name
                        .split(" ")
                        .slice(0, 2)
                        .map((n: string) => n[0])
                        .join("")
                        .toUpperCase();

                      return (
                        <div
                          key={testimonial._id}
                          className={`bg-gradient-to-br ${gradient} border border-foreground/5 rounded-xl p-6 relative overflow-hidden break-inside-avoid mb-5`}
                        >
                          <Quote className="absolute top-5 right-5 w-8 h-8 text-foreground-strong/[0.04]" />
                          <div className="flex items-center mb-4">
                            {testimonial.imageUrl ? (
                              <img
                                src={testimonial.imageUrl}
                                alt={testimonial.name}
                                className="w-12 h-12 rounded-full object-cover border border-foreground/10 mr-4 flex-shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-neon-purple/20 border border-neon-purple/20 flex items-center justify-center text-neon-purple font-semibold text-sm mr-4 flex-shrink-0">
                                {initials}
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-foreground-strong">{testimonial.name}</p>
                              <p className="text-xs text-neon-purple">{testimonial.displayRole}</p>
                            </div>
                          </div>
                          <p className="text-foreground/65 text-sm italic leading-relaxed">
                            &ldquo;{testimonial.displayText}&rdquo;
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.section>

        {/* CTA */}
        {testimonialsIntakeEnabled && !isLoading && (
          <motion.section variants={item} className="text-center">
            <button
              onClick={() => setWizardOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-neon-purple/40 bg-neon-purple/5 text-neon-purple hover:bg-neon-purple/10 hover:border-neon-purple transition-all text-sm font-medium"
            >
              <Star className="w-4 h-4" />
              {t("testimonials.leaveTestimonial")}
            </button>
          </motion.section>
        )}
      </motion.div>

      <TestimonialWizard open={wizardOpen} onClose={() => setWizardOpen(false)} />
    </>
  );
}
