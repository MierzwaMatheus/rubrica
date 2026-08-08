import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { LocaleDetector } from '../interfaces/LocaleDetector';
import { TranslationsRepository } from '../repositories/TranslationsRepository';
import { TranslationService } from '../interfaces/TranslationService';
import { StaticTranslationsRepository } from '../implementations/StaticTranslationsRepository';
import { DynamicTranslationsRepository } from '../implementations/DynamicTranslationsRepository';
import { BrowserLocaleDetector } from '../implementations/BrowserLocaleDetector';
import { NoopTranslationService } from '../implementations/NoopTranslationService';
import { CachedTranslationService } from '../implementations/CachedTranslationService';

type Locale = 'pt-BR' | 'en-US';

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
  tValue: (key: string) => any;
  translationService: TranslationService;
  isLoading: boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

interface I18nProviderProps {
  children: ReactNode;
  localeDetector?: LocaleDetector;
  translationsRepository?: TranslationsRepository;
  translationService?: TranslationService;
}

export function I18nProvider({
  children,
  localeDetector = new BrowserLocaleDetector(),
  translationsRepository,
  translationService,
}: I18nProviderProps) {
  const siteTextsRecords = useQuery(api.siteTexts.getAll);
  const resolvedRepository: TranslationsRepository = translationsRepository
    ?? (siteTextsRecords !== undefined
      ? new DynamicTranslationsRepository(siteTextsRecords)
      : new StaticTranslationsRepository());

  const [locale, setLocaleState] = useState<Locale>('en-US');
  const [isLoading, setIsLoading] = useState(true);

  const cachedTranslationService = useMemo(() => {
    const service = translationService || new NoopTranslationService();
    return new CachedTranslationService(service);
  }, [translationService]);

  useEffect(() => {
    const detectLocale = async () => {
      try {
        const savedLocale = localStorage.getItem('locale') as Locale | null;
        if (savedLocale && (savedLocale === 'pt-BR' || savedLocale === 'en-US')) {
          setLocaleState(savedLocale);
          setIsLoading(false);
          return;
        }

        const detected = await localeDetector.detect();
        setLocaleState(detected as Locale);
      } catch (error) {
        console.error('Error detecting locale:', error);
        setLocaleState(localeDetector.detectSync() as Locale);
      } finally {
        setIsLoading(false);
      }
    };

    detectLocale();
  }, [localeDetector]);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('locale', newLocale);
  };

  const t = (key: string): string => {
    const translation = resolvedRepository.getStaticTranslation(key, locale);
    return translation || key;
  };

  const tValue = (key: string): any => {
    return resolvedRepository.getStaticValue(key, locale);
  };

  return (
    <I18nContext.Provider
      value={{
        locale,
        setLocale,
        t,
        tValue,
        translationService: cachedTranslationService,
        isLoading,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return context;
}
