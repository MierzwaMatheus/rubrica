/**
 * Rotas do app (`kind: "app"` no registro de plugins): proposta, aceite, checkout,
 * pagamento concluído. O site é estático (`output: "static"`) e esses caminhos têm
 * parâmetro (`/proposta/:slug`), então:
 *
 * 1. o build gera **uma página por rota e idioma** em `/_rubrica/app/[<prefixo>/]<ilha>`
 *    (casca do tema + a ilha da rota), só para os plugins ligados;
 * 2. a hospedagem **reescreve** (sem redirecionar) o caminho público para essa página:
 *    `rewrites` no `vercel.json` e linhas com status 200 no `_redirects` (Netlify e
 *    Cloudflare Pages), geradas de `appRewrites` para todos os plugins (a hospedagem não
 *    sabe quais estão ligados; plugin desligado = página que não existe = 404);
 * 3. no `astro dev`, um middleware faz a mesma reescrita (`appShellFor`);
 * 4. a ilha lê os parâmetros de `location.pathname` com `matchPath`.
 *
 * Arquivo puro: o CLI (hospedagem), a integração do Astro e as ilhas usam.
 */
import type { PluginDefinition } from "./contract";

/** Onde ficam as páginas das rotas do app no build. */
export const APP_SHELL_BASE = "/_rubrica/app";

export interface AppRoute {
  plugin: string;
  /** Caminho sem idioma, com parâmetros (`/proposta/:slug`). */
  path: string;
  island: string;
}

/** Rotas do app dos plugins (só dos ligados, quando `enabled` vem). */
export function appRoutes(plugins: readonly PluginDefinition[], enabled?: ReadonlySet<string>): AppRoute[] {
  const out: AppRoute[] = [];
  for (const plugin of plugins) {
    if (enabled && !enabled.has(plugin.id)) continue;
    for (const route of plugin.routes ?? []) {
      if (route.kind === "app") out.push({ plugin: plugin.id, path: route.path, island: route.island });
    }
  }
  return out;
}

/** Página da rota no build: `/_rubrica/app/proposta`, `/_rubrica/app/en/proposta`. */
export function appShellPath(island: string, prefix = ""): string {
  return `${APP_SHELL_BASE}${prefix ? `/${prefix}` : ""}/${island}`;
}

/** Caminho público no idioma: `/proposta/:slug` → `/en/proposta/:slug`. */
export function localizedPattern(path: string, prefix = ""): string {
  return prefix ? `/${prefix}${path}` : path;
}

export interface AppShell extends AppRoute {
  locale: string;
  /** Prefixo do idioma na URL (`""` no principal). */
  prefix: string;
  /** Caminho público com o prefixo do idioma (`/en/proposta/:slug`). */
  pattern: string;
  /** Página gerada no build. */
  shell: string;
}

/** Uma página por rota do app e idioma do site. `prefixOf` dá o prefixo de URL de cada idioma. */
export function appShells(routes: readonly AppRoute[], locales: readonly string[], prefixOf: (locale: string) => string): AppShell[] {
  return locales.flatMap((locale) => {
    const prefix = prefixOf(locale);
    return routes.map((r) => ({ ...r, locale, prefix, pattern: localizedPattern(r.path, prefix), shell: appShellPath(r.island, prefix) }));
  });
}

const segments = (path: string) => path.split("/").filter(Boolean);

/**
 * Parâmetros do caminho, se ele casa com o padrão (`:nome` = um segmento). Barra no fim
 * não conta. Os valores saem decodificados.
 */
export function matchPath(pattern: string, pathname: string): Record<string, string> | null {
  const want = segments(pattern);
  const got = segments(pathname);
  if (want.length !== got.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < want.length; i++) {
    const w = want[i]!;
    const g = got[i]!;
    if (w.startsWith(":")) {
      try {
        params[w.slice(1)] = decodeURIComponent(g);
      } catch {
        return null;
      }
    } else if (w !== g) return null;
  }
  return params;
}

/** Preenche o padrão: `/proposta/:slug` + `{ slug: "a b" }` → `/proposta/a%20b`. */
export function fillPath(pattern: string, params: Record<string, string>): string {
  return pattern.replace(/:([A-Za-z_][A-Za-z0-9_]*)/g, (m, name: string) => (name in params ? encodeURIComponent(params[name]!) : m));
}

/** Página do build que atende o caminho público (o middleware do `astro dev` usa). */
export function appShellFor(shells: readonly AppShell[], pathname: string): AppShell | undefined {
  return shells.find((s) => matchPath(s.pattern, pathname));
}

export interface AppRewrite {
  /** Caminho público, com `:parâmetros`. */
  from: string;
  /** Página do build; pode usar os mesmos `:parâmetros`. */
  to: string;
}

/**
 * Reescritas da hospedagem para todas as rotas do app: a do idioma principal e a dos
 * outros idiomas (`/:locale/...`, o prefixo vira parte da página de destino). Sintaxe
 * comum à Vercel, ao Netlify e ao Cloudflare Pages. Os arquivos que existem continuam
 * vencendo, então `/:locale/...` não cobre páginas de verdade.
 */
export function appRewrites(plugins: readonly PluginDefinition[]): AppRewrite[] {
  return appRoutes(plugins).flatMap((r) => [
    { from: r.path, to: appShellPath(r.island) },
    { from: localizedPattern(r.path, ":locale"), to: appShellPath(r.island, ":locale") },
  ]);
}
