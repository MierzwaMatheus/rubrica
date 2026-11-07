import { createContext, useContext, useMemo, ReactNode } from 'react';
import { useQuery } from 'convex/react';
import { useQuery as useReactQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { api } from '../../../convex/_generated/api';
import { TranslationsRepository } from '../repositories/TranslationsRepository';
import { TranslationService } from '../interfaces/TranslationService';
import { StaticTranslationsRepository } from '../implementations/StaticTranslationsRepository';
import { DynamicTranslationsRepository } from '../implementations/DynamicTranslationsRepository';
import { NoopTranslationService } from '../implementations/NoopTranslationService';
import { CachedTranslationService } from '../implementations/CachedTranslationService';
import { Locale, localeFromPath, localizedPath } from '../localePath';
import { isAppRoute } from '@/lib/appRoutes';

export type { Locale };

/** Onde fica a escolha explícita de idioma de quem visita (usada pelo aviso de idioma). */
export const LOCALE_STORAGE_KEY = 'locale';

type SiteTextRecord = { key: string; ptBR: string; enUS?: string };

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
  translationsRepository?: TranslationsRepository;
  translationService?: TranslationService;
}

/** Desenvolvimento: textos ao vivo do Convex. */
function useConvexSiteTexts(): SiteTextRecord[] | undefined {
  return useQuery(api.siteTexts.getAll) as SiteTextRecord[] | undefined;
}

/**
 * Produção: textos do JSON gerado no build (como o resto do conteúdo publicado), para que
 * entrem no HTML pré-renderizado. Mudanças nos textos chegam ao site na próxima publicação.
 */
async function fetchSiteTexts(file: string): Promise<SiteTextRecord[]> {
  try {
    const response = await fetch(`/data/${file}`);
    if (!response.ok) return [];
    const raw = await response.json();
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function useStaticSiteTexts(): SiteTextRecord[] | undefined {
  const [location] = useLocation();
  const { data } = useReactQuery({
    queryKey: ['siteTexts'],
    queryFn: () => fetchSiteTexts('site-texts.json'),
    staleTime: Infinity,
  });
  // Textos do painel, do login e das propostas: só nessas rotas (fora do HTML das páginas públicas).
  const { data: appTexts } = useReactQuery({
    queryKey: ['siteTexts', 'app'],
    queryFn: () => fetchSiteTexts('site-texts-app.json'),
    staleTime: Infinity,
    enabled: isAppRoute(location),
  });
  return useMemo(() => (data && appTexts?.length ? [...data, ...appTexts] : data), [data, appTexts]);
}

const useSiteTexts = import.meta.env.PROD ? useStaticSiteTexts : useConvexSiteTexts;

export function I18nProvider({
  children,
  translationsRepository,
  translationService,
}: I18nProviderProps) {
  const siteTextsRecords = useSiteTexts();
  // Use Dynamic apenas quando há records de tradução.
  // Quando siteTextsRecords é undefined (loading) ou [] (vazio, ex.: plugin i18n
  // desabilitado), usa Static (pt-BR/en-US hardcoded) para evitar que t() retorne
  // a chave literal como fallback.
  const staticRepository = useMemo(() => new StaticTranslationsRepository(), []);
  const resolvedRepository: TranslationsRepository = useMemo(
    () =>
      translationsRepository ??
      (siteTextsRecords && siteTextsRecords.length > 0
        ? new DynamicTranslationsRepository(siteTextsRecords)
        : staticRepository),
    [translationsRepository, siteTextsRecords, staticRepository],
  );

  // A URL decide o idioma: /en/... é inglês, o resto é pt-BR.
  const [location, navigate] = useLocation();
  const locale = localeFromPath(location);
  const isLoading = false;

  const cachedTranslationService = useMemo(() => {
    const service = translationService || new NoopTranslationService();
    return new CachedTranslationService(service);
  }, [translationService]);

  // Trocar o idioma é navegar para a mesma página no outro idioma.
  const setLocale = (newLocale: Locale) => {
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
    } catch {
      // sem localStorage (modo privado): só navega
    }
    if (newLocale === locale) return;
    const { search, hash } = window.location;
    navigate(`~${localizedPath(location, newLocale)}${search}${hash}`);
  };

  // Chave que ainda não está no banco (chegou numa atualização do Rubrica depois do
  // setup): usa o texto do código em vez de mostrar a chave.
  const t = (key: string): string => {
    const translation = resolvedRepository.getStaticTranslation(key, locale)
      || staticRepository.getStaticTranslation(key, locale);
    return translation || key;
  };

  const tValue = (key: string): any => {
    return resolvedRepository.getStaticValue(key, locale)
      ?? staticRepository.getStaticValue(key, locale);
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
