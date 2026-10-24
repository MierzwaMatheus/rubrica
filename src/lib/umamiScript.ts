/**
 * Tag do script do Umami, injetada no index.html no build (vite.config.ts).
 * Sem as duas variáveis, nada é injetado: o site não tenta carregar um script inexistente.
 *
 * - VITE_UMAMI_SCRIPT_URL: URL do script (Umami Cloud: https://cloud.umami.is/script.js)
 * - VITE_UMAMI_WEBSITE_ID: ID do site no Umami
 *
 * Compatibilidade: VITE_ANALYTICS_ENDPOINT + VITE_ANALYTICS_WEBSITE_ID (script em `<endpoint>/umami`).
 *
 * O tracker envia os eventos para a mesma origem do script; ela precisa estar
 * liberada em script-src e connect-src do CSP (vercel.json).
 */
export function umamiScriptTag(env: Record<string, string | undefined>): string | null {
  const legacyEndpoint = env.VITE_ANALYTICS_ENDPOINT?.trim().replace(/\/+$/, "");
  const src = env.VITE_UMAMI_SCRIPT_URL?.trim() || (legacyEndpoint ? `${legacyEndpoint}/umami` : "");
  const websiteId = (env.VITE_UMAMI_WEBSITE_ID || env.VITE_ANALYTICS_WEBSITE_ID)?.trim();
  if (!src || !websiteId) return null;

  let url: URL;
  try {
    url = new URL(src);
  } catch {
    return null;
  }
  if (url.protocol !== "https:") return null;

  const attr = (value: string) => value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  return `<script defer src="${attr(url.href)}" data-website-id="${attr(websiteId)}"></script>`;
}
