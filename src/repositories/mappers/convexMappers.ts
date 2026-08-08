import type { Project } from "../interfaces/PortfolioRepository";
import type { BlogPost } from "../interfaces/BlogRepository";
import type {
  ContactInfo,
  Service,
  Testimonial,
} from "../interfaces/HomeRepository";
import type { SidebarContactInfo } from "../interfaces/SidebarRepository";
import type {
  DailyRoutineItem,
  FAQItem,
} from "../interfaces/AboutRepository";
import type { ResumeItem } from "../interfaces/ResumeRepository";

type LocaleKey = "enUS" | "ptBR";
type AnyTranslations =
  | Partial<Record<LocaleKey, string>>
  | Record<string, string>
  | undefined
  | null;

export function mapTranslations(
  source: AnyTranslations
): Record<string, string> | undefined {
  if (!source) return undefined;
  const result: Record<string, string> = {};
  if ("enUS" in source && source.enUS != null) result["en-US"] = source.enUS as string;
  if ("ptBR" in source && source.ptBR != null) result["pt-BR"] = source.ptBR as string;
  if ("en-US" in source && (source as any)["en-US"] != null) result["en-US"] = (source as any)["en-US"];
  if ("pt-BR" in source && (source as any)["pt-BR"] != null) result["pt-BR"] = (source as any)["pt-BR"];
  return Object.keys(result).length > 0 ? result : undefined;
}

function mapTranslationsObj(source: any): Record<string, any> | undefined {
  if (!source) return undefined;
  const result: Record<string, any> = {};
  if (source.enUS != null) result["en-US"] = source.enUS;
  if (source.ptBR != null) result["pt-BR"] = source.ptBR;
  if (source["en-US"] != null) result["en-US"] = source["en-US"];
  if (source["pt-BR"] != null) result["pt-BR"] = source["pt-BR"];
  return Object.keys(result).length > 0 ? result : undefined;
}

export function mapProject(c: any): Project {
  const images: string[] = Array.isArray(c.images)
    ? c.images
        .map((img: any) => (typeof img === "string" ? img : img?.url))
        .filter(Boolean)
    : [];
  return {
    id: c._id ?? c.id,
    title: c.title ?? "",
    description: c.description ?? "",
    long_description: c.longDescription ?? c.long_description ?? "",
    tags: c.tags ?? [],
    images,
    demo_link: c.demoLink ?? c.demo_link ?? "",
    github_link: c.githubLink ?? c.github_link ?? "",
    title_translations: mapTranslations(c.titleTranslations ?? c.title_translations),
    description_translations: mapTranslations(
      c.descriptionTranslations ?? c.description_translations
    ),
    long_description_translations: mapTranslations(
      c.longDescriptionTranslations ?? c.long_description_translations
    ),
    order_index: c.orderIndex ?? c.order_index,
    slug: c.slug ?? undefined,
    case_study: c.caseStudy ?? c.case_study ?? undefined,
    case_study_translations: mapTranslationsObj(c.caseStudyTranslations ?? c.case_study_translations),
  } as Project;
}

export function mapBlogPost(c: any): BlogPost {
  const image: string =
    typeof c.image === "string"
      ? c.image
      : c.image?.url ?? c.imageUrl ?? "";
  return {
    id: c._id ?? c.id,
    title: c.title ?? "",
    subtitle: c.subtitle ?? "",
    content: c.content ?? "",
    image,
    featured: !!c.featured,
    status: c.status ?? "",
    created_at: c.createdAt
      ? typeof c.createdAt === "number"
        ? new Date(c.createdAt).toISOString()
        : c.createdAt
      : c.created_at ?? "",
    published_at: c.publishedAt
      ? typeof c.publishedAt === "number"
        ? new Date(c.publishedAt).toISOString()
        : c.publishedAt
      : c.published_at ?? "",
    tags: c.tags ?? [],
    slug: c.slug ?? "",
    title_translations: mapTranslations(c.titleTranslations ?? c.title_translations),
    subtitle_translations: mapTranslations(
      c.subtitleTranslations ?? c.subtitle_translations
    ),
    content_translations: mapTranslations(c.contentTranslations ?? c.content_translations),
  } as BlogPost;
}

export function mapContactInfo(c: any): ContactInfo {
  return {
    name: c?.name ?? "",
    role: c?.role ?? "",
    role_translations: mapTranslations(c?.roleTranslations ?? c?.role_translations),
    email: c?.email ?? "",
    show_email: c?.showEmail ?? c?.show_email ?? false,
    phone: c?.phone ?? "",
    show_phone: c?.showPhone ?? c?.show_phone ?? false,
  };
}

export function mapSidebarContactInfo(c: any): SidebarContactInfo {
  return {
    name: c?.name ?? "",
    role: c?.role ?? "",
    role_translations: mapTranslations(c?.roleTranslations ?? c?.role_translations),
    email: c?.email ?? "",
    show_email: c?.showEmail ?? c?.show_email ?? false,
    phone: c?.phone ?? "",
    show_phone: c?.showPhone ?? c?.show_phone ?? false,
    avatar_url: c?.avatarUrl ?? c?.avatar_url ?? c?.avatar?.url ?? "",
    linkedin_url: c?.linkedinUrl ?? c?.linkedin_url ?? "",
    github_url: c?.githubUrl ?? c?.github_url ?? "",
    behance_url: c?.behanceUrl ?? c?.behance_url ?? "",
  };
}

export function mapService(c: any): Service {
  return {
    id: c._id ?? c.id,
    title: c.title ?? "",
    description: c.description ?? "",
    title_translations: mapTranslations(c.titleTranslations ?? c.title_translations),
    description_translations: mapTranslations(
      c.descriptionTranslations ?? c.description_translations
    ),
  };
}

export function mapTestimonial(c: any): Testimonial {
  return {
    id: c._id ?? c.id,
    name: c.name ?? "",
    role: c.role ?? "",
    text: c.text ?? "",
    image_url: c.imageUrl ?? c.image_url ?? c.image?.url ?? "",
    role_translations: mapTranslations(c.roleTranslations ?? c.role_translations),
    text_translations: mapTranslations(c.textTranslations ?? c.text_translations),
  };
}

export function mapDailyRoutineItem(c: any): DailyRoutineItem {
  return {
    id: c._id ?? c.id,
    image_url: c.image?.url ?? c.imageUrl ?? c.image_url ?? "",
    tags: c.tags ?? [],
    description: c.description ?? "",
    description_translations: mapTranslations(
      c.descriptionTranslations ?? c.description_translations
    ),
    span_size: c.spanSize ?? c.span_size ?? "1x1",
    display_order: c.displayOrder ?? c.display_order ?? 0,
  };
}

export function mapFAQItem(c: any): FAQItem {
  return {
    id: c._id ?? c.id,
    question: c.question ?? "",
    question_translations: mapTranslations(
      c.questionTranslations ?? c.question_translations
    ),
    answer: c.answer ?? "",
    answer_translations: mapTranslations(
      c.answerTranslations ?? c.answer_translations
    ),
    display_order: c.displayOrder ?? c.display_order ?? 0,
  };
}

export function mapResumeItem(c: any): ResumeItem {
  return {
    id: c._id ?? c.id,
    type: c.type ?? "",
    content: c.content,
    content_translations: mapTranslationsObj(
      c.contentTranslations ?? c.content_translations
    ),
    order_index: c.orderIndex ?? c.order_index ?? 0,
  };
}
