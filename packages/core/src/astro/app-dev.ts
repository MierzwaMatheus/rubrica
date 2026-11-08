/**
 * `astro dev`: faz a reescrita que a hospedagem faz no site publicado (`vercel.json`,
 * `_redirects`): `/proposta/<slug>` é servido pela página `/_rubrica/app/proposta`, com o
 * endereço do navegador intacto. Ver `plugins/app-routes.ts`.
 */
import { appShellFor, type AppShell } from "../plugins/app-routes";

type Next = (err?: unknown) => void;

export function appRewriteMiddleware(shells: readonly AppShell[]) {
  return (req: { url?: string }, _res: unknown, next: Next) => {
    if (req.url) {
      const q = req.url.indexOf("?");
      const path = q === -1 ? req.url : req.url.slice(0, q);
      const shell = appShellFor(shells, path);
      if (shell) req.url = shell.shell + (q === -1 ? "" : req.url.slice(q));
    }
    next();
  };
}
