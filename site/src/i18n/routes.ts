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

export function route(page: PageKey, lang: Lang): string {
  return ROUTES[page][lang];
}
