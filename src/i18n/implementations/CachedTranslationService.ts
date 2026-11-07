import { TranslationService } from '../interfaces/TranslationService';

export class CachedTranslationService implements TranslationService {
  private cache: Map<string, string>;

  constructor(
    private translationService: TranslationService
  ) {
    this.cache = new Map();
    this.loadCacheFromStorage();
  }
  
  private getCacheKey(text: string, targetLocale: string, sourceLocale: string): string {
    return `${sourceLocale}:${targetLocale}:${text}`;
  }
  
  async translate(text: string, targetLocale: string, sourceLocale = 'pt-BR'): Promise<string> {
    if (sourceLocale === targetLocale || !text) return text;
    
    const cacheKey = this.getCacheKey(text, targetLocale, sourceLocale);
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }
    
    const translated = await this.translationService.translate(text, targetLocale, sourceLocale);
    this.cache.set(cacheKey, translated);
    this.saveCacheToStorage();
    
    return translated;
  }
  
  async translateBatch(texts: string[], targetLocale: string, sourceLocale = 'pt-BR'): Promise<string[]> {
    if (sourceLocale === targetLocale || texts.length === 0) return texts;
    
    // Verifica cache primeiro
    const cached: (string | null)[] = [];
    const toTranslate: { index: number; text: string }[] = [];
    
    texts.forEach((text, index) => {
      const cacheKey = this.getCacheKey(text, targetLocale, sourceLocale);
      if (this.cache.has(cacheKey)) {
        cached[index] = this.cache.get(cacheKey)!;
      } else {
        toTranslate.push({ index, text });
      }
    });
    
    if (toTranslate.length > 0) {
      const translations = await this.translationService.translateBatch(
        toTranslate.map(t => t.text),
        targetLocale,
        sourceLocale
      );
      
      translations.forEach((translated, i) => {
        const { index, text } = toTranslate[i];
        const cacheKey = this.getCacheKey(text, targetLocale, sourceLocale);
        this.cache.set(cacheKey, translated);
        cached[index] = translated;
      });
      
      this.saveCacheToStorage();
    }
    
    return cached as string[];
  }
  
  private saveCacheToStorage() {
    try {
      const cacheObj = Object.fromEntries(this.cache);
      localStorage.setItem('translation_cache', JSON.stringify(cacheObj));
    } catch (error) {
      console.error('Error saving cache:', error);
    }
  }
  
  private loadCacheFromStorage() {
    // Sem localStorage na pré-renderização (build): começa com o cache vazio.
    if (typeof localStorage === 'undefined') return;
    try {
      const stored = localStorage.getItem('translation_cache');
      if (stored) {
        const cacheObj = JSON.parse(stored);
        this.cache = new Map(Object.entries(cacheObj));
      }
    } catch (error) {
      console.error('Error loading cache:', error);
    }
  }
  
  clearCache() {
    this.cache.clear();
    localStorage.removeItem('translation_cache');
  }
}


