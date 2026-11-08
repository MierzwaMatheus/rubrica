/**
 * Conteúdo cru → props do tema, num idioma. Funções puras: rodam no build (Astro),
 * na prévia do painel e nos testes.
 */
import { localizedPath, pick, type Locale, type LocaleConfig, type Localized } from "../i18n";
import type { FieldDef, FieldMap, RawImage, RawLink, ResolvedImage, ResolvedLink } from "../blocks/fields";

export interface ResolveOptions {
  locale: Locale;
  locales: LocaleConfig;
  /** Capa dos posts sem capa própria (`SiteSettings.defaultPostCover`). */
  defaultPostCover?: RawImage;
}

const EXTERNAL = /^(https?:|mailto:|tel:|\/\/)/i;

export function resolveImage(raw: RawImage | undefined, opts: ResolveOptions): ResolvedImage | undefined {
  if (!raw?.url) return undefined;
  const img: ResolvedImage = { src: raw.url, alt: pick(raw.alt, opts.locale) ?? "" };
  if (raw.width) img.width = raw.width;
  if (raw.height) img.height = raw.height;
  return img;
}

/** Link interno ganha o prefixo do idioma; âncora (`#x`) e externo ficam como estão. */
export function resolveHref(href: string, opts: ResolveOptions): { href: string; external: boolean } {
  if (EXTERNAL.test(href)) return { href, external: /^(https?:|\/\/)/i.test(href) };
  if (href.startsWith("#")) return { href, external: false };
  const [path = "/", hash] = href.split("#");
  const localized = localizedPath(path || "/", opts.locale, opts.locales);
  return { href: hash ? `${localized}#${hash}` : localized, external: false };
}

export function resolveLink(raw: RawLink | undefined, opts: ResolveOptions): ResolvedLink | undefined {
  if (!raw?.href) return undefined;
  const label = pick(raw.label, opts.locale);
  if (!label) return undefined;
  return { label, ...resolveHref(raw.href, opts) };
}

export function resolveText(raw: Localized<string> | string | undefined, opts: ResolveOptions): string | undefined {
  if (raw === undefined) return undefined;
  if (typeof raw === "string") return raw.trim() ? raw : undefined;
  return pick(raw, opts.locale);
}

function resolveValue(def: FieldDef, raw: unknown, opts: ResolveOptions): unknown {
  if (raw === undefined || raw === null) return undefined;
  switch (def.kind) {
    case "text":
    case "richText":
      return resolveText(raw as Localized<string> | string, opts);
    case "number":
    case "boolean":
    case "select":
      return raw;
    case "image":
      return resolveImage(raw as RawImage, opts);
    case "link":
      return resolveLink(raw as RawLink, opts);
    case "list": {
      if (!Array.isArray(raw)) return undefined;
      const items = raw
        .map((item) => resolveFields(def.of, item as Record<string, unknown>, opts))
        // Item sem nenhum campo obrigatório traduzido some da lista no idioma.
        .filter((item) => requiredPresent(def.of, item));
      return items;
    }
  }
}

function requiredPresent(fields: FieldMap, resolved: Record<string, unknown>): boolean {
  return Object.entries(fields).every(([key, def]) => !def.required || resolved[key] !== undefined);
}

/** Campos resolvidos no idioma. Booleanos e seleções sem valor recebem o padrão do schema. */
export function resolveFields(fields: FieldMap, raw: Record<string, unknown> | undefined, opts: ResolveOptions): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, def] of Object.entries(fields)) {
    let value = resolveValue(def, raw?.[key], opts);
    if (value === undefined && (def.kind === "boolean" || def.kind === "select") && def.default !== undefined) value = def.default;
    if (value !== undefined) out[key] = value;
  }
  return out;
}
