/**
 * Conteúdo inicial a partir da receita (RFC v2, decisão 24): as páginas fixas montadas
 * com os blocos da receita do tema (ou do núcleo), nos idiomas do site. Funções puras,
 * usadas pela mutation interna `rubrica/seed:apply` e pelo `migrar` do CLI.
 */
import type { LocaleConfig, Locale } from "../../i18n";
import type { BlockInstance, NavItem } from "../../content/types";
import type { Recipe, RecipeBlock } from "../../theme/contract";

const LOCALE_KEY = /^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/;
const base = (locale: string) => locale.split("-")[0]!.toLowerCase();

/** Objeto não vazio em que toda chave é um código de idioma e todo valor é texto. */
export function isLocalizedValue(value: unknown): value is Record<Locale, string> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const entries = Object.entries(value);
  return entries.length > 0 && entries.every(([k, v]) => LOCALE_KEY.test(k) && typeof v === "string");
}

/**
 * Texto da receita no idioma do site: o código exato, senão um com a mesma língua
 * (`en-US` aceita `en`; `pt` aceita `pt-BR`). Sem nenhum, o idioma fica de fora.
 */
export function pickRecipeText(value: Record<Locale, string>, locale: Locale): string | undefined {
  if (value[locale]?.trim()) return value[locale];
  const same = Object.keys(value).find((k) => base(k) === base(locale) && value[k]?.trim());
  return same ? value[same] : undefined;
}

/** Converte, em qualquer nível, os textos da receita para os idiomas do site. */
export function localizeRecipeValue(value: unknown, locales: readonly Locale[]): unknown {
  if (isLocalizedValue(value)) {
    const out: Record<Locale, string> = {};
    for (const locale of locales) {
      const text = pickRecipeText(value, locale);
      if (text !== undefined) out[locale] = text;
    }
    return out;
  }
  if (Array.isArray(value)) return value.map((v) => localizeRecipeValue(v, locales));
  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, localizeRecipeValue(v, locales)]));
  }
  return value;
}

export interface SeedPage {
  path: string;
  title: Record<Locale, string>;
  blocks: BlockInstance[];
  system: true;
  published: true;
}

export interface PagesFromRecipeOptions {
  locales: LocaleConfig;
  /** O bloco pode entrar no site (tipo existe, vale para o tipo do site, plugin ligado)? */
  allowBlock?: (type: string) => boolean;
}

/** Id estável do bloco na página: o tipo, e `tipo-2`, `tipo-3` quando repete. */
export function blockIds(blocks: readonly Pick<RecipeBlock, "type">[]): string[] {
  const count = new Map<string, number>();
  return blocks.map((b) => {
    const n = (count.get(b.type) ?? 0) + 1;
    count.set(b.type, n);
    const safe = b.type.replace(/[^A-Za-z0-9_-]/g, "-").slice(0, 60);
    return n === 1 ? safe : `${safe}-${n}`;
  });
}

/**
 * Páginas da receita no formato do banco. Blocos que o site não aceita (plugin
 * desligado, bloco do outro tipo de site) ficam de fora; página sem bloco nenhum
 * também, e o mesmo vale para página sem título em nenhum idioma do site.
 */
export function pagesFromRecipe(recipe: Recipe, options: PagesFromRecipeOptions): SeedPage[] {
  const locales = options.locales.locales;
  const allow = options.allowBlock ?? (() => true);
  const pages: SeedPage[] = [];
  for (const page of recipe) {
    const kept = page.blocks.filter((b) => allow(b.type));
    if (kept.length === 0) continue;
    const title = localizeRecipeValue(page.title, locales) as Record<Locale, string>;
    if (Object.keys(title).length === 0) continue;
    const ids = blockIds(kept);
    pages.push({
      path: page.path,
      title,
      system: true,
      published: true,
      blocks: kept.map((b, i) => ({
        id: ids[i]!,
        type: b.type,
        ...(b.variant && { variant: b.variant }),
        visible: true,
        fields: (localizeRecipeValue(b.fields ?? {}, locales) as Record<string, unknown>) ?? {},
        ...(b.source && { source: b.source }),
      })),
    });
  }
  return pages;
}

/** Caminhos que não entram no menu principal (rodapé e páginas legais). */
const OFF_MENU = new Set(["/privacidade"]);

/** Menu a partir das páginas: a ordem da receita, sem as páginas legais. */
export function navigationFromPages(pages: readonly Pick<SeedPage, "path" | "title">[]): NavItem[] {
  return pages.filter((p) => !OFF_MENU.has(p.path)).map((p) => ({ label: p.title, href: p.path }));
}
