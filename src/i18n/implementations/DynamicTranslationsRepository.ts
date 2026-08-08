import { TranslationsRepository } from '../repositories/TranslationsRepository';

type SiteTextRecord = { key: string; ptBR: string; enUS?: string };

export function buildNestedFromRecords(
  records: SiteTextRecord[],
  locale: string,
): Record<string, any> {
  const result: Record<string, any> = {};
  for (const record of records) {
    const value = locale === 'en-US' ? (record.enUS ?? record.ptBR) : record.ptBR;
    const keys = record.key.split('.');
    let node = result;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!node[keys[i]]) node[keys[i]] = {};
      node = node[keys[i]];
    }
    node[keys[keys.length - 1]] = value;
  }
  return result;
}

export class DynamicTranslationsRepository implements TranslationsRepository {
  private nested: Record<string, any>;

  constructor(records: SiteTextRecord[], locale?: string) {
    // Build both locales lazily on access, but pre-build pt-BR and en-US
    this._records = records;
    this._cache = {};
  }

  private _records: SiteTextRecord[];
  private _cache: Record<string, Record<string, any>>;

  private getTree(locale: string): Record<string, any> {
    if (!this._cache[locale]) {
      this._cache[locale] = buildNestedFromRecords(this._records, locale);
    }
    return this._cache[locale];
  }

  getStaticTranslation(key: string, locale: string): string | undefined {
    const value = this.getStaticValue(key, locale);
    return typeof value === 'string' ? value : undefined;
  }

  getStaticValue(key: string, locale: string): any {
    const tree = this.getTree(locale);
    const keys = key.split('.');
    let node: any = tree;
    for (const k of keys) {
      if (!node || typeof node !== 'object') return undefined;
      node = node[k];
    }
    return node;
  }

  getAllStaticTranslations(locale: string): Record<string, string> {
    return this.getTree(locale);
  }
}
