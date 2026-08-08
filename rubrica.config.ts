export interface RubricalConfig {
  // Identidade
  siteName: string;
  siteUrl: string;
  siteDescription: string;
  authorName: string;
  authorEmail: string;
  twitterHandle: string;
  lang: string;

  // SEO por página
  seoHomeTitle: string;
  seoHomeDescription: string;

  // RSS
  rssTitle: string;
  rssDescription: string;

  // OG Image
  ogImageUrl: string;

  // Aparência (espelho do rubrica.json — mantidos em sincronia pela CLI)
  fontSans: string;
  fontMono: string;
}

export const rubricalConfig: RubricalConfig = {
  // Identidade
  siteName: "Portfolio",
  siteUrl: "https://exemplo.com",
  siteDescription: "Portfólio profissional.",
  authorName: "",
  authorEmail: "",
  twitterHandle: "",
  lang: "pt-BR",

  // SEO por página
  seoHomeTitle: "",
  seoHomeDescription: "",

  // RSS
  rssTitle: "Portfolio — Blog",
  rssDescription: "Artigos e publicações.",

  // OG Image
  ogImageUrl: "",

  // Aparência
  fontSans: "Inter",
  fontMono: "JetBrains Mono",
};
