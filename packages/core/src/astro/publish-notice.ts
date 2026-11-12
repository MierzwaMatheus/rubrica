/**
 * Aviso de fim de build (`astro:build:done`): chama `POST <CONVEX_SITE_URL>/rubrica/publicacao/concluida`
 * para o "publicando" do painel acabar na hora, sem esperar a janela de `PUBLISHING_WINDOW_MS`.
 *
 * Só avisa com o segredo `RUBRICA_DEPLOY_CALLBACK_SECRET` no ambiente do processo (a
 * hospedagem; o `publicar` grava na Vercel), e não lê os `.env*`: um build no computador
 * não marca a produção como publicada. Pula também os builds de prévia (Vercel, Netlify).
 * Nunca falha o build: sem o que precisa, não faz nada; com erro, só avisa no log.
 */

/** O mesmo `PUBLISH_CALLBACK_PATH` de `convex/httpRoutes.ts` (sem importar o backend no build; o teste confere). */
export const CALLBACK_PATH = "/rubrica/publicacao/concluida";
const TIMEOUT_MS = 5_000;

type Env = Record<string, string | undefined>;

/** Endereço `.convex.site` do backend: `CONVEX_SITE_URL` ou o derivado do `.convex.cloud`. */
export function convexSiteUrl(convexUrl: string | undefined, env: Env): string | undefined {
  const clean = (v: string | undefined) => v?.trim().replace(/\/+$/, "") || undefined;
  const explicit = clean(env.CONVEX_SITE_URL);
  if (explicit) return explicit;
  const cloud = clean(convexUrl);
  const m = cloud && /^(https?:\/\/[^/]+)\.convex\.cloud$/.exec(cloud);
  return m ? `${m[1]}.convex.site` : undefined;
}

/** Build de prévia (não é o site no ar): o aviso diria que a produção terminou. */
export function isPreviewBuild(env: Env): boolean {
  if (env.VERCEL_ENV && env.VERCEL_ENV !== "production") return true;
  if (env.NETLIFY && env.CONTEXT && env.CONTEXT !== "production") return true;
  return false;
}

export type PublishNoticeResult = "sent" | "skipped" | "failed";

export interface PublishNoticeOptions {
  /** Endereço `.convex.cloud` que o build usou. */
  convexUrl: string | undefined;
  /** Ambiente do processo (padrão: `process.env`). */
  env?: Env;
  fetch?: typeof fetch;
  logger?: { info(message: string): void; warn(message: string): void };
}

export async function notifyBuildDone(options: PublishNoticeOptions): Promise<PublishNoticeResult> {
  const env = options.env ?? process.env;
  const secret = env.RUBRICA_DEPLOY_CALLBACK_SECRET?.trim();
  const site = convexSiteUrl(options.convexUrl, env);
  if (!secret || !site || isPreviewBuild(env)) return "skipped";
  const doFetch = options.fetch ?? fetch;
  try {
    const res = await doFetch(`${site}${CALLBACK_PATH}`, {
      method: "POST",
      headers: { "X-Rubrica-Secret": secret },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      options.logger?.warn(`o aviso de fim de build não foi aceito (HTTP ${res.status}): o painel sai de "publicando" sozinho em alguns minutos.`);
      return "failed";
    }
    options.logger?.info("painel avisado: build concluído.");
    return "sent";
  } catch (e) {
    options.logger?.warn(`não foi possível avisar o painel do fim do build (${(e as Error).message}): ele sai de "publicando" sozinho em alguns minutos.`);
    return "failed";
  }
}
