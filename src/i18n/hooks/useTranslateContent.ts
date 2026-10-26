import { useState } from 'react';
import { useI18n } from '../context/I18nContext';

export function useTranslateContent() {
  const { translationService } = useI18n();
  const [isTranslating, setIsTranslating] = useState(false);

  const translateFields = async (
    fields: Record<string, string>,
    targetLocale = 'en-US',
    sourceLocale = 'pt-BR'
  ): Promise<Record<string, string>> => {
    const toTranslate: { key: string; value: string }[] = [];
    const result: Record<string, string> = {};

    for (const [key, value] of Object.entries(fields)) {
      if (!value || value.trim() === '') {
        result[key] = value;
      } else {
        toTranslate.push({ key, value });
      }
    }

    if (toTranslate.length === 0) return result;

    setIsTranslating(true);
    try {
      const translated = await translationService.translateBatch(
        toTranslate.map(({ value }) => value),
        targetLocale,
        sourceLocale
      );
      toTranslate.forEach(({ key }, i) => {
        result[key] = translated[i];
      });
      return result;
    } finally {
      setIsTranslating(false);
    }
  };

  return { translateFields, isTranslating };
}
