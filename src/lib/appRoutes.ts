/**
 * Rotas do app (painel, login, playground, propostas, checkout): não são pré-renderizadas,
 * caem no app.html (vercel.json) e ficam fora do robots.txt.
 */
const APP_ROUTE = /^(?:\/en)?\/(?:admin|login|playground|proposta|checkout|payment-success)(?:\/|$)/;

export function isAppRoute(pathname: string): boolean {
  return APP_ROUTE.test(pathname);
}

/**
 * Seções dos textos do site que só as rotas do app usam. No build elas vão para
 * site-texts-app.json, carregado só nessas rotas, e ficam fora do HTML das páginas públicas.
 */
export const APP_TEXT_SECTIONS = ["admin", "auth", "proposals"] as const;

export function isAppTextKey(key: string): boolean {
  return (APP_TEXT_SECTIONS as readonly string[]).includes(key.split(".")[0]);
}
