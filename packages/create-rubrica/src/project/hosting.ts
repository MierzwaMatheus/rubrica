/**
 * Saída neutra de hospedagem (RFC v2, decisão 21): redirecionamentos e cabeçalhos
 * descritos uma vez e gerados como `vercel.json` (Vercel, a oficial) e como
 * `public/_redirects` e `public/_headers` (Netlify e Cloudflare Pages, que leem esses
 * arquivos da pasta publicada; o Astro copia o `public/` para o `dist/`).
 *
 * Os padrões usam `*` no fim para "tudo abaixo" (`/_astro/*`); na Vercel viram `(.*)`.
 * Reescritas (`rewrites`) usam `:parâmetro` (um segmento), que os três entendem.
 */
import { appRewrites } from "@rubrica/core/plugins/app-routes";
import { CORE_PLUGINS } from "@rubrica/core/plugins";
import { BLOCK_FRAME_SOURCES } from "@rubrica/core/blocks";

export interface Redirect {
  from: string;
  to: string;
  /** 301 (permanente) ou 302. */
  status: 301 | 302;
}

/** Reescrita: serve `to` no endereço `from`, sem redirecionar (status 200). */
export interface Rewrite {
  from: string;
  to: string;
}

export interface HeaderRule {
  source: string;
  headers: Record<string, string>;
  /**
   * A regra traz o conjunto completo de cabeçalhos para esse caminho e substitui o da regra
   * `/*`, em vez de somar a ele. Na Vercel, a regra `/*` passa a excluir esse caminho (todas as
   * regras que casam são aplicadas, e dois valores do mesmo cabeçalho conflitam); no `_headers`,
   * a regra começa com `! Cabeçalho` (destacar) para soltar o valor herdado da `/*`.
   */
  replaces?: boolean;
}

export interface HostingConfig {
  redirects: Redirect[];
  /** Rotas do app (proposta, checkout): caminhos com parâmetro servidos pela página estática da rota. */
  rewrites?: Rewrite[];
  headers: HeaderRule[];
}

/**
 * CSP do site público. As ilhas do Astro (`<astro-island>`) se montam com um script
 * inline que o Astro põe na página, e o `<head>` do núcleo traz JSON-LD e os tokens
 * do tema inline: daí o `'unsafe-inline'` em script-src e style-src. O JavaScript das
 * ilhas vem de `/_astro/` (self). Os formulários (contato e depoimento) falam com o
 * Convex (`*.convex.site`), e o painel com `*.convex.cloud` (inclusive por WebSocket).
 *
 * No painel (`/admin*`, `scope: "admin"`), `frame-ancestors` é `'self'`, porque a prévia ao
 * vivo (`/admin/preview`) é um iframe da mesma origem, e o Google Fonts fica liberado: a
 * prévia carrega a fonte escolhida na Aparência antes do build (o site usa fontes próprias).
 *
 * Com o plugin `analytics`, a origem do script do Umami entra em script-src (o script) e
 * connect-src (os eventos vão para a mesma origem), como na v1.
 *
 * `frame-src` libera os iframes dos blocos do núcleo: o mapa do Google, os players de vídeo
 * (YouTube sem cookies e Vimeo) e os provedores do bloco de incorporação. A lista vem do
 * núcleo (`BLOCK_FRAME_SOURCES`), a mesma que valida os endereços dos blocos. As miniaturas
 * do YouTube (`i.ytimg.com`) já cabem em `img-src https:`.
 */
export function contentSecurityPolicy(analyticsOrigin?: string, scope: "site" | "admin" = "site"): string {
  const extra = analyticsOrigin ? ` ${analyticsOrigin}` : "";
  const admin = scope === "admin";
  const frameAncestors = admin ? "'self'" : "'none'";
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${extra}`,
    `style-src 'self' 'unsafe-inline'${admin ? " https://fonts.googleapis.com" : ""}`,
    "img-src 'self' data: blob: https:",
    `font-src 'self' data:${admin ? " https://fonts.gstatic.com" : ""}`,
    `connect-src 'self'${extra} https://*.convex.cloud wss://*.convex.cloud https://*.convex.site`,
    `frame-src ${frameSources().join(" ")}`,
    `frame-ancestors ${frameAncestors}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "upgrade-insecure-requests",
  ].join("; ");
}

/** Origens de `frame-src`: a própria, o mapa do Google e as dos blocos do núcleo, sem repetir. */
export function frameSources(): string[] {
  return [...new Set(["'self'", "https://www.google.com", "https://maps.google.com", ...BLOCK_FRAME_SOURCES])];
}

export const CONTENT_SECURITY_POLICY = contentSecurityPolicy();

export interface HostingOptions {
  /** Origem do script de analytics (`https://cloud.umami.is`), liberada na CSP. */
  analyticsOrigin?: string;
}

export function defaultHosting(options: HostingOptions = {}): HostingConfig {
  const common = {
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  };
  return {
    redirects: [],
    rewrites: appRewrites(CORE_PLUGINS),
    headers: [
      {
        source: "/*",
        headers: {
          ...common,
          "X-Frame-Options": "DENY",
          "Content-Security-Policy": contentSecurityPolicy(options.analyticsOrigin),
        },
      },
      // O painel mostra a prévia ao vivo num iframe da mesma origem (/admin/preview).
      {
        source: "/admin*",
        replaces: true,
        headers: {
          ...common,
          "X-Frame-Options": "SAMEORIGIN",
          "Content-Security-Policy": contentSecurityPolicy(options.analyticsOrigin, "admin"),
        },
      },
      // Arquivos com hash no nome: nunca mudam.
      { source: "/_astro/*", headers: { "Cache-Control": "public, max-age=31536000, immutable" } },
    ],
  };
}

/**
 * Troca a origem do analytics numa CSP existente (script-src e connect-src), sem mexer
 * no resto: tira a anterior (`from`) e põe a nova (`to`). Sem `to`, só tira.
 */
export function swapCspOrigin(csp: string, from: string | undefined, to: string | undefined): string {
  return csp
    .split(";")
    .map((part) => {
      const directive = part.trim();
      const [name, ...sources] = directive.split(/\s+/);
      if (name !== "script-src" && name !== "connect-src") return directive;
      const kept = sources.filter((s) => s !== from && s !== to);
      if (to) kept.splice(name === "script-src" ? kept.length : Math.min(1, kept.length), 0, to);
      return [name, ...kept].join(" ");
    })
    .filter(Boolean)
    .join("; ");
}

/**
 * Aplica `swapCspOrigin` aos arquivos de hospedagem que já estão no projeto
 * (`vercel.json` e `public/_headers`), preservando o que a pessoa mudou neles. Devolve
 * só os arquivos que mudaram.
 */
export function patchHostingCsp(files: Record<string, string | undefined>, from: string | undefined, to: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  const vercel = files["vercel.json"];
  if (vercel) {
    const json = JSON.parse(vercel) as { headers?: { source: string; headers: { key: string; value: string }[] }[] };
    for (const rule of json.headers ?? []) for (const h of rule.headers) if (h.key.toLowerCase() === "content-security-policy") h.value = swapCspOrigin(h.value, from, to);
    const next = `${JSON.stringify(json, null, 2)}\n`;
    if (next !== vercel) out["vercel.json"] = next;
  }
  const headers = files["public/_headers"];
  if (headers) {
    const next = headers.replace(/^(\s*Content-Security-Policy:\s*)(.*)$/gim, (_m, key: string, value: string) => `${key}${swapCspOrigin(value, from, to)}`);
    if (next !== headers) out["public/_headers"] = next;
  }
  return out;
}

const toVercel = (pattern: string) => (pattern.endsWith("*") ? `${pattern.slice(0, -1)}(.*)` : pattern);

/**
 * Origem de uma regra de cabeçalhos na Vercel. A `/*` exclui os caminhos das regras que a
 * substituem (`/((?!admin).*)`), para que o painel não receba os cabeçalhos do site junto com os seus.
 */
function vercelHeaderSource(rule: HeaderRule, all: HeaderRule[]): string {
  if (rule.source !== "/*") return toVercel(rule.source);
  const excluded = all.filter((r) => r.replaces).map((r) => r.source.replace(/^\//, "").replace(/\*$/, ""));
  return excluded.length ? `/((?!${excluded.join("|")}).*)` : toVercel(rule.source);
}

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
    ...(config.rewrites?.length && { rewrites: config.rewrites.map((r) => ({ source: r.from, destination: r.to })) }),
    headers: config.headers.map((h) => ({ source: vercelHeaderSource(h, config.headers), headers: Object.entries(h.headers).map(([key, value]) => ({ key, value })) })),
  };
  return `${JSON.stringify(json, null, 2)}\n`;
}

const NOTE = "# Gerado pelo Rubrica (mesma configuração do vercel.json). Para Netlify e Cloudflare Pages.";

/** `_redirects` (Netlify, Cloudflare Pages). */
export function redirectsFile(config: HostingConfig): string {
  const lines = [...config.redirects.map((r) => `${r.from} ${r.to} ${r.status}`), ...(config.rewrites ?? []).map((r) => `${r.from} ${r.to} 200`)];
  return `${[NOTE, ...lines].join("\n")}\n`;
}

/** `_headers` (Netlify, Cloudflare Pages). */
export function headersFile(config: HostingConfig): string {
  const catchAll = config.headers.find((h) => h.source === "/*");
  const blocks = config.headers.map((h) => {
    // Regra que substitui a `/*`: solta primeiro os cabeçalhos herdados, depois define os seus.
    const detach = h.replaces && catchAll ? Object.keys(catchAll.headers).filter((k) => k in h.headers).map((k) => `  ! ${k}`) : [];
    return [h.source, ...detach, ...Object.entries(h.headers).map(([k, v]) => `  ${k}: ${v}`)].join("\n");
  });
  return `${[NOTE, ...blocks].join("\n")}\n`;
}

export function hostingFiles(config: HostingConfig = defaultHosting()): Record<string, string> {
  return {
    "vercel.json": vercelJson(config),
    "public/_redirects": redirectsFile(config),
    "public/_headers": headersFile(config),
  };
}
