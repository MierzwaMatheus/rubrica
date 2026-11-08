/** API pública do núcleo do Rubrica v2: contratos e tipos para temas, plugins e projetos. */
export * from "./i18n";
export { DEFAULT_UI_TEXTS, defaultUiText } from "./i18n/ui-texts";
export * from "./blocks/fields";
export * from "./blocks/define";
export * from "./content/types";
export * from "./theme/contract";
export { CORE_RECIPES, recipeFor } from "./theme/recipes";
export * from "./plugins/contract";
export type { DataSource, SiteSnapshot } from "./data/source";
export { SCHEMES, SCHEME_TOKENS, DEFAULT_SCHEME_ID, getScheme, schemeCss, contrastRatio } from "./theme/schemes";
export type { ColorScheme, SchemeMode, SchemeRole } from "./theme/schemes";
export { planFonts, fontWeights, KNOWN_FONTS } from "./theme/fonts";
export type { FontPlan, PlannedFont } from "./theme/fonts";
