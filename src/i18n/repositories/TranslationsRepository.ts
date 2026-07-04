export interface TranslationsRepository {
  getStaticTranslation(key: string, locale: string): string | undefined;
  getStaticValue(key: string, locale: string): any; // Para arrays, objetos, etc
  getAllStaticTranslations(locale: string): Record<string, any>;
}


