/**
 * Novo build do site na Vercel, para o botão "Publicar" do painel.
 *
 * Dois jeitos, nesta ordem:
 * 1. Deploy Hook (VERCEL_DEPLOY_HOOK_URL): só existe em projeto ligado ao GitHub.
 * 2. Token da Vercel (VERCEL_TOKEN + VERCEL_PROJECT_ID, e VERCEL_TEAM_ID quando há time):
 *    refaz o último deploy de produção com os mesmos arquivos. O build roda de novo e busca
 *    o conteúdo atualizado do Convex. É o caminho de quem publicou com `npx create-rubrica publicar`.
 */

export interface VercelDeployEnv {
  hookUrl?: string;
  token?: string;
  projectId?: string;
  teamId?: string;
}

export interface VercelDeployResult {
  ok: boolean;
  statusCode?: number;
  message?: string;
}

type FetchFn = (url: string, init?: RequestInit) => Promise<Response>;

const API = "https://api.vercel.com";

export const NOT_CONFIGURED =
  "O botão Publicar ainda não está configurado. Na pasta do projeto, rode npx create-rubrica publicar.";
const BAD_TOKEN =
  "A Vercel recusou o token da Vercel (venceu ou foi apagado). Na pasta do projeto, rode npx create-rubrica publicar para trocar.";
const NO_DEPLOYMENT =
  "Não achei nenhuma publicação do site na Vercel. Na pasta do projeto, rode npx create-rubrica publicar.";

export function vercelDeployEnv(env: Record<string, string | undefined>): VercelDeployEnv {
  return {
    hookUrl: env.VERCEL_DEPLOY_HOOK_URL || undefined,
    token: env.VERCEL_TOKEN || undefined,
    projectId: env.VERCEL_PROJECT_ID || undefined,
    teamId: env.VERCEL_TEAM_ID || undefined,
  };
}

async function errorMessage(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: { message?: string } };
    if (body?.error?.message) return body.error.message;
  } catch {
    // corpo sem JSON
  }
  return `HTTP ${res.status}`;
}

export async function triggerVercelBuild(env: VercelDeployEnv, fetchFn: FetchFn = fetch): Promise<VercelDeployResult> {
  if (env.hookUrl) {
    const res = await fetchFn(env.hookUrl, { method: "POST" });
    return { ok: res.ok, statusCode: res.status };
  }
  if (!env.token || !env.projectId) return { ok: false, message: NOT_CONFIGURED };

  const team = env.teamId ? `&teamId=${encodeURIComponent(env.teamId)}` : "";
  const headers = { Authorization: `Bearer ${env.token}`, "Content-Type": "application/json" };

  const list = await fetchFn(
    `${API}/v6/deployments?projectId=${encodeURIComponent(env.projectId)}&target=production&state=READY&limit=1${team}`,
    { headers }
  );
  if (list.status === 401 || list.status === 403) return { ok: false, statusCode: list.status, message: BAD_TOKEN };
  if (!list.ok) return { ok: false, statusCode: list.status, message: await errorMessage(list) };
  const last = ((await list.json()) as { deployments?: Array<{ uid: string; name: string }> }).deployments?.[0];
  if (!last) return { ok: false, message: NO_DEPLOYMENT };

  const created = await fetchFn(`${API}/v13/deployments?forceNew=1${team}`, {
    method: "POST",
    headers,
    body: JSON.stringify({ name: last.name, deploymentId: last.uid, target: "production" }),
  });
  if (created.status === 401 || created.status === 403) return { ok: false, statusCode: created.status, message: BAD_TOKEN };
  if (!created.ok) return { ok: false, statusCode: created.status, message: await errorMessage(created) };
  return { ok: true, statusCode: created.status };
}
