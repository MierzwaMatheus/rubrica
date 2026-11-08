/** Variáveis públicas que o Vite substitui no build das ilhas. */
interface ImportMetaEnv {
  /** Endereço base do backend (ex.: https://projeto.convex.site). A integração o preenche (PUBLIC_RUBRICA_API > CONVEX_SITE_URL > derivado do CONVEX_URL). Vazio, o envio fica desativado. */
  readonly PUBLIC_RUBRICA_API?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
