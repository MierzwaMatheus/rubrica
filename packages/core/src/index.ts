/** API pública do núcleo do Rubrica v2: contratos e tipos para temas, plugins e projetos. */
export * from "./i18n";
export { DEFAULT_UI_TEXTS, defaultUiText } from "./i18n/ui-texts";
export * from "./blocks/fields";
export * from "./blocks/define";
export * from "./blocks/media";
export * from "./content/types";
export * from "./theme/contract";
export { CORE_RECIPES, recipeFor } from "./theme/recipes";
export * from "./plugins/contract";
export type { DataSource, SiteSnapshot } from "./data/source";
/** WhatsApp e faixa de aviso do site inteiro: número, `wa.me`, links `whatsapp:` e o período do aviso. */
export {
  WHATSAPP_HREF,
  announcementActive,
  announcementTime,
  isWhatsAppNumber,
  normalizeWhatsAppNumber,
  resolveWhatsAppHref,
  siteWhatsAppNumber,
  whatsAppUrl,
} from "./render/sitewide";
export { SCHEMES, SCHEME_TOKENS, DEFAULT_SCHEME_ID, getScheme, schemeCss, contrastRatio } from "./theme/schemes";
export type { ColorScheme, SchemeMode, SchemeRole } from "./theme/schemes";
export { planFonts, fontWeights, hasItalic, KNOWN_FONTS } from "./theme/fonts";
export type { FontPlan, FontStyle, PlannedFont } from "./theme/fonts";
/** Itens de coleção já resolvidos no idioma (o que os blocos e templates recebem). */
export type {
  CaseSectionItem,
  FaqItem,
  PlanItem,
  PostItem,
  ProjectItem,
  ResolvedSeo,
  ResumeItem,
  RoutineItem,
  ServiceItem,
  TeamItem,
  TestimonialItem,
} from "./render/collections";
