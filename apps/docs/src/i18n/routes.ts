/**
 * Idiomas do site. Português fica na raiz e inglês em /en. Cada página tem um
 * endereço por idioma: é por aqui que o seletor de idioma e os hreflang acham a outra versão.
 */
export type Lang = "pt" | "en";

export const LANGS: Lang[] = ["pt", "en"];

/** Valor do <html lang> e do hreflang. */
export const HTML_LANG: Record<Lang, string> = { pt: "pt-BR", en: "en" };

export const ROUTES = {
  home: { pt: "/", en: "/en/" },
  changelog: { pt: "/novidades", en: "/en/changelog" },
  voz: { pt: "/voz", en: "/en/voice" },
} as const satisfies Record<string, Record<Lang, string>>;

export type PageKey = keyof typeof ROUTES;

/** Endereço de uma página por idioma, para páginas fora de ROUTES (ex.: os docs). */
export type Paths = Readonly<Record<Lang, string>>;

/** Uma página fixa (chave de ROUTES) ou os endereços dela em cada idioma. */
export type PageRef = PageKey | Paths;

export function route(page: PageRef, lang: Lang): string {
  return typeof page === "string" ? ROUTES[page][lang] : page[lang];
}
