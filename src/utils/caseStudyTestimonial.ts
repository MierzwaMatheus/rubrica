import type { CaseStudyTestimonial } from "@/repositories/interfaces/PortfolioRepository";

export type TestimonialLocale = "pt-BR" | "en-US";

/** Texto do depoimento no idioma para o qual ele foi traduzido. O autor não se traduz. */
export interface TestimonialText {
  text: string;
  role?: string;
}

/** Depoimento pronto para exibir. `original` só existe quando o texto exibido é uma tradução. */
export type LocalizedTestimonial = CaseStudyTestimonial;

const originalLocale = (t: CaseStudyTestimonial): TestimonialLocale => t.lang ?? "pt-BR";

export function testimonialTargetLocale(lang: TestimonialLocale | undefined): TestimonialLocale {
  return lang === "en-US" ? "pt-BR" : "en-US";
}

export function localizeTestimonial(
  testimonial: CaseStudyTestimonial | undefined,
  translations: Record<string, { testimonial?: TestimonialText } | undefined> | undefined,
  locale: string,
): LocalizedTestimonial | undefined {
  if (!testimonial) return undefined;
  const lang = originalLocale(testimonial);
  if (locale === lang) return testimonial;
  const translated = translations?.[locale]?.testimonial;
  if (!translated?.text?.trim()) return testimonial;
  return {
    ...testimonial,
    text: translated.text,
    role: translated.role || testimonial.role,
    original: { text: testimonial.text, role: testimonial.role, lang },
  };
}

function savedField(
  field: keyof TestimonialText,
  current: CaseStudyTestimonial,
  previous?: CaseStudyTestimonial,
  previousTranslation?: TestimonialText,
): string | undefined {
  if (!previous || originalLocale(previous) !== originalLocale(current)) return undefined;
  if ((previous[field] ?? "").trim() !== (current[field] ?? "").trim()) return undefined;
  return previousTranslation?.[field] || undefined;
}

const FIELD_KEYS = { text: "testimonialText", role: "testimonialRole" } as const;

/** Campos do depoimento que precisam ir para o tradutor. */
export function testimonialFieldsToTranslate(
  current: CaseStudyTestimonial,
  previous?: CaseStudyTestimonial,
  previousTranslation?: TestimonialText,
): Record<string, string> {
  const fields: Record<string, string> = {};
  (["text", "role"] as const).forEach((field) => {
    const value = current[field];
    if (!value?.trim()) return;
    if (savedField(field, current, previous, previousTranslation)) return;
    fields[FIELD_KEYS[field]] = value;
  });
  return fields;
}

/** Monta a tradução do depoimento: tradução nova, senão a salva, senão o original. */
export function buildTranslatedTestimonial(
  current: CaseStudyTestimonial,
  translated: Record<string, string>,
  previous?: CaseStudyTestimonial,
  previousTranslation?: TestimonialText,
): TestimonialText {
  const pick = (field: keyof TestimonialText) =>
    translated[FIELD_KEYS[field]] ?? savedField(field, current, previous, previousTranslation) ?? current[field];
  const role = pick("role");
  return { text: pick("text") ?? current.text, ...(role ? { role } : {}) };
}
