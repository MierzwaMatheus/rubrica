/** Variáveis públicas que o Vite substitui no build das ilhas. */
interface ImportMetaEnv {
  /** Endereço base do backend (ex.: https://projeto.convex.site). Sem ele, o envio fica desativado. */
  readonly PUBLIC_RUBRICA_API?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
