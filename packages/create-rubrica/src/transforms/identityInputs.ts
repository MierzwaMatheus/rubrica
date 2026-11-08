import type { RubricaIdentity } from "../state/readState.js";
import type { RubricalConfigInput } from "./applyRubricalConfig.js";
import type { IndexHtmlData } from "./applyIndexHtml.js";

/**
 * Entradas de applyRubricalConfig e applyIndexHtml derivadas da identidade.
 * Create, config e update precisam gerar exatamente o mesmo conteúdo; por isso
 * a derivação (SEO, RSS e imagem de compartilhamento) fica num lugar só.
 */
export function rubricaConfigInput(identity: RubricaIdentity, fontSans: string, fontMono: string): RubricalConfigInput {
  return {
    siteName: identity.siteName,
    siteUrl: identity.siteUrl,
    siteDescription: identity.siteDescription,
    authorName: identity.authorName,
    authorEmail: identity.authorEmail,
    twitterHandle: identity.twitterHandle,
    lang: identity.lang,
    seoHomeTitle: identity.siteName,
    seoHomeDescription: identity.siteDescription,
    rssTitle: identity.siteName,
    rssDescription: identity.siteDescription,
    ogImageUrl: `${identity.siteUrl}/og.png`,
    fontSans,
    fontMono,
  };
}

export function indexHtmlInput(identity: RubricaIdentity, fontSans: string, fontMono = ""): IndexHtmlData {
  return {
    fontFamily: fontSans,
    fontMono,
    themeColor: "",
    siteName: identity.siteName,
    siteUrl: identity.siteUrl,
    twitterHandle: identity.twitterHandle,
    authorName: identity.authorName,
  };
}
