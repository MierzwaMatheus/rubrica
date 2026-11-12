# Publishing the site

The public site is a set of static files generated at **build time**: the build reads the content from the production Convex and writes every page. So the way to publish is the same on any host: **run the build again**.

> Saving in the panel changes the database immediately, but the live site only changes at the next build. The panel's **Publish** button triggers that build.

## Two databases

| | Development | Production |
|---|---|---|
| Where it lives | In Convex, tied to `.env.local` | In Convex, address under `producao` in `rubrica.json` |
| Who uses it | The site on your computer (`pnpm dev`) | The live site |
| How to change content | Panel at `localhost:4321/admin` | Panel at `https://yoursite.com/admin` |

Content from one does **not** go to the other. Production starts with the theme's initial pages.

## Vercel: the automatic path

Vercel is the official host; only it has publishing automated by the CLI. It needs a free account.

```bash
npx create-rubrica publicar
```

The first time, the command shows the plan and asks for confirmation before writing to production. It:

1. signs in to your Vercel account (opens the browser);
2. creates the project on Vercel;
3. creates the **production** deployment on Convex, sends the backend, writes the login keys and variables;
4. creates the production `root` user (you pick the password) and builds the initial pages;
5. carries the integrations you turned on locally to production (Telegram, email, OpenRouter);
6. writes the build variables on Vercel (`CONVEX_DEPLOY_KEY`, `CONVEX_URL`, `SITE_URL`...);
7. configures the panel's **Publish** button (deploy hook);
8. publishes.

The Vercel build runs `convex deploy` and then `npm run build`, so **every build sends the current backend along** and generates the site from the production content. The command prints the site and panel (`/admin`) addresses at the end.

After the first time, `npx create-rubrica publicar` just publishes again. If Vercel is connected to your GitHub repository, the usual way is **merging into the production branch**: Vercel builds on its own.

### Custom domain

On Vercel: Settings, Domains. Then tell Rubrica about the new address:

```bash
npx create-rubrica config --url mysite.com
npx create-rubrica config --url mysite.com --producao   # also writes to the production database
```

The address goes into the canonical, sitemap, RSS, form CORS and the payment return.

## Other hosts

Netlify, Cloudflare Pages or any static hosting works: the output is neutral. The project already ships, from the same configuration, `vercel.json`, `public/_redirects` and `public/_headers` (redirects, security headers and cache). Netlify and Cloudflare Pages read the last two on their own.

On the chosen host:

| Setting | Value |
|---|---|
| Build command | `npm run build` |
| Published folder | `dist` |
| `CONVEX_URL` variable | The **production** Convex address (`https://<name>.convex.cloud`; it is in `producao.convexUrl` in `rubrica.json` once production is prepared) |
| `SITE_URL` variable | The site address |

The production backend must exist before the first build on another host. The simplest way is to run `npx create-rubrica publicar` once: it prepares the production Convex (backend, login keys, `root` and initial pages) together with Vercel, and you can switch the Vercel project off afterwards. If you prefer the host to send the backend on every build, use `npx convex deploy --cmd-url-env-var-name CONVEX_URL --cmd "npm run build"` as the build command, with the `CONVEX_DEPLOY_KEY` variable (as `vercel.json` does). Remember: `convex deploy` always publishes to production.

The panel's **Publish** button triggers any host: create a **deploy hook** (Vercel: Settings, Git, Deploy Hooks; Netlify and Cloudflare: Build hooks) and save the URL in the Convex variable `RUBRICA_DEPLOY_HOOK_URL`. See [Integrations](./integracoes.md#publishing). When the build finishes, Rubrica notifies the panel at `/rubrica/publicacao/concluida`, and the "publishing" notice goes away at once. For that, the build needs the `RUBRICA_DEPLOY_CALLBACK_SECRET` variable with the same value as on Convex: on Vercel, `publicar` sets it on its own; on another host, copy the Convex value (`npx convex env get RUBRICA_DEPLOY_CALLBACK_SECRET --prod`) to the build variables. Without it, "publishing" goes away on its own 5 minutes after the click.

When switching hosts, check that the domain and `SITE_URL` match, and that the `Content-Security-Policy` in `_headers` or `vercel.json` allows what your site uses (the analytics script, for example: `npx create-rubrica config --analytics <script> --analytics-id <id>` already adjusts both files).

## Before publishing

- `pnpm check`, `pnpm test` and `pnpm build` pass.
- The site URL (`config --url`) is the final one.
- `RUBRICA_IP_SALT` is set in production (`setup` and `publicar` write it; see [Integrations](./integracoes.md)).
- The site forms need the site origin allowed in Convex: the site URL already counts, and `RUBRICA_ALLOWED_ORIGINS` accepts others.
