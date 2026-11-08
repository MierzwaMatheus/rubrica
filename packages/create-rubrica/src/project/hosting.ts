/**
 * Saída neutra de hospedagem (RFC v2, decisão 21): redirecionamentos e cabeçalhos
 * descritos uma vez e gerados como `vercel.json` (Vercel, a oficial) e como
 * `public/_redirects` e `public/_headers` (Netlify e Cloudflare Pages, que leem esses
 * arquivos da pasta publicada; o Astro copia o `public/` para o `dist/`).
 *
 * Os padrões usam `*` no fim para "tudo abaixo" (`/_astro/*`); na Vercel viram `(.*)`.
 */

export interface Redirect {
  from: string;
  to: string;
  /** 301 (permanente) ou 302. */
  status: 301 | 302;
}

export interface HeaderRule {
  source: string;
  headers: Record<string, string>;
}

export interface HostingConfig {
  redirects: Redirect[];
  headers: HeaderRule[];
}

/**
 * CSP do site público. As ilhas do Astro (`<astro-island>`) se montam com um script
 * inline que o Astro põe na página, e o `<head>` do núcleo traz JSON-LD e os tokens
 * do tema inline: daí o `'unsafe-inline'` em script-src e style-src. O JavaScript das
 * ilhas vem de `/_astro/` (self). Os formulários (contato e depoimento) falam com o
 * Convex (`*.convex.site`), e o painel com `*.convex.cloud` (inclusive por WebSocket).
 */
export const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.convex.cloud wss://*.convex.cloud https://*.convex.site",
  "frame-src 'self' https://www.google.com https://maps.google.com",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "upgrade-insecure-requests",
].join("; ");

export function defaultHosting(): HostingConfig {
  return {
    redirects: [],
    headers: [
      {
        source: "/*",
        headers: {
          "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
          "X-Content-Type-Options": "nosniff",
          "X-Frame-Options": "DENY",
          "Referrer-Policy": "strict-origin-when-cross-origin",
          "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
          "Content-Security-Policy": CONTENT_SECURITY_POLICY,
        },
      },
      // Arquivos com hash no nome: nunca mudam.
      { source: "/_astro/*", headers: { "Cache-Control": "public, max-age=31536000, immutable" } },
    ],
  };
}

const toVercel = (pattern: string) => (pattern.endsWith("*") ? `${pattern.slice(0, -1)}(.*)` : pattern);

/** `vercel.json`. O build envia o backend ao Convex de produção e gera o site. */
export function vercelJson(config: HostingConfig): string {
  const json = {
    $schema: "https://openapi.vercel.sh/vercel.json",
    framework: "astro",
    // `convex deploy` publica o backend com a CONVEX_DEPLOY_KEY e roda o build do site
    // com CONVEX_URL apontando para a produção.
    buildCommand: "npx convex deploy --cmd-url-env-var-name CONVEX_URL --cmd \"npm run build\"",
    trailingSlash: false,
    redirects: config.redirects.map((r) => ({ source: toVercel(r.from), destination: r.to, permanent: r.status === 301 })),
    headers: config.headers.map((h) => ({ source: toVercel(h.source), headers: Object.entries(h.headers).map(([key, value]) => ({ key, value })) })),
  };
  return `${JSON.stringify(json, null, 2)}\n`;
}

const NOTE = "# Gerado pelo Rubrica (mesma configuração do vercel.json). Para Netlify e Cloudflare Pages.";

/** `_redirects` (Netlify, Cloudflare Pages). */
export function redirectsFile(config: HostingConfig): string {
  const lines = config.redirects.map((r) => `${r.from} ${r.to} ${r.status}`);
  return `${[NOTE, ...lines].join("\n")}\n`;
}

/** `_headers` (Netlify, Cloudflare Pages). */
export function headersFile(config: HostingConfig): string {
  const blocks = config.headers.map((h) => [h.source, ...Object.entries(h.headers).map(([k, v]) => `  ${k}: ${v}`)].join("\n"));
  return `${[NOTE, ...blocks].join("\n")}\n`;
}

export function hostingFiles(config: HostingConfig = defaultHosting()): Record<string, string> {
  return {
    "vercel.json": vercelJson(config),
    "public/_redirects": redirectsFile(config),
    "public/_headers": headersFile(config),
  };
}
