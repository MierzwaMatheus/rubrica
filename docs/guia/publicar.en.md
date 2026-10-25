# Publishing the site

Puts your portfolio online on Vercel, with a production database separate from your computer's and a `<projeto>.vercel.app` address. Then you connect your domain. The Vercel and Convex accounts are free.

## Before publishing

- The project needs to be running on your computer. If it isn't yet, see [Getting started](./comecando.md).
- Commit `rubrica.json` with the project. It's how `publicar` and `setup` recognize, on another computer, that the site is already online.

## The first time

In the project folder:

```bash
npx create-rubrica publicar
```

After you confirm, the CLI:

1. logs in to your Vercel account (the login opens in the browser, if needed);
2. creates the project on Vercel with the folder name and uses the `<projeto>.vercel.app` address;
3. prepares the production database on Convex: it sends the backend, generates the login keys and copies from your computer the Telegram and OpenRouter integrations, the profession and the AI context;
4. creates the admin of the published site (you choose the password) and the initial data;
5. turns on the panel's **Publicar** (publish) button (see below);
6. saves the variables on Vercel and publishes;
7. writes to `rubrica.json`, under `producao`, the addresses of the published database and site.

The published site starts with the sample data and is edited through its own panel, at `<seu-site>/login`. What you entered in the panel on your computer doesn't go with it: your computer and the live site have separate databases.

## Publishing again

Run the same command:

```bash
npx create-rubrica publicar
```

From then on, it only publishes the current version of the project: the Vercel build also sends the backend changes to the production database. Before that, it copies to production the Telegram and OpenRouter integrations you turned on on your computer after the first time (only the ones missing there).

When to use each path:

- **You changed the code** (layout, components, colors in `src/index.css`, a new version of Rubrica): `npx create-rubrica publicar`.
- **You changed the content** in the published site's panel: the panel's **Publicar** button.

## The panel's Publicar button

The site is generated in the build: new posts, projects and texts only show up after publishing. The panel's **Publicar** button reruns the build without you opening the terminal.

On the first publish, the CLI opens Vercel's tokens page. Create a token named Rubrica, with no expiration, and paste it into the terminal (it doesn't show on screen). The CLI checks that the token can access the project and saves it in the production database. With it, the panel redeploys the latest production deployment, and the build fetches the new content.

Skipped this step, or the panel says the button isn't configured or the token isn't valid? Run `npx create-rubrica publicar` again: it offers to turn on the button and asks for a new token.

If your Vercel project is connected to GitHub, you can also use a Vercel Deploy Hook instead of the token.

## On another computer

In a fresh clone of the project (the `.vercel` folder stays out of git), `publicar` sees from `rubrica.json` that the site is already published, links the folder to the same Vercel project and just publishes. It doesn't generate new login keys or rewrite the panel data.

If the computer is connected to another Convex project, not the one of the live site, `publicar` stops before writing anything, so it doesn't swap the site's database for an empty one. Run `npx create-rubrica setup` and pick the Convex project where the site lives.

Have more than one Vercel account on the computer? Choose which one to use:

```bash
RUBRICA_VERCEL_GLOBAL_CONFIG=<pasta de config da conta> npx create-rubrica publicar
```

## Custom domain

1. On Vercel, open the project and go to **Settings → Domains → Add Domain**.
2. Add `seudominio.com` and `www.seudominio.com`.
3. At your domain registrar (Registro.br, Cloudflare, GoDaddy…), set up the DNS:
   - root (`seudominio.com`): an **A** record pointing to `76.76.21.21`;
   - `www`: a **CNAME** record pointing to `cname.vercel-dns.com`.
4. Wait for propagation (from minutes to a few hours). The HTTPS certificate is issued on its own.
5. On Vercel, in **Settings → Environment Variables**, change `SITE_URL` to the final address.
6. Publish again (`npx create-rubrica publicar`) to rebuild `sitemap.xml` and `rss.xml` with the new address.

## Payments in production

The Asaas production key and the payments webhook are set up separately: `publicar` doesn't copy the key from your computer, which is usually the sandbox one. See "Configurando os pagamentos (Asaas)" (in Portuguese) in the [README](../../README.md).

## Common problems

| Symptom | What to do |
|---|---|
| The Publicar button says it isn't configured or the token isn't valid | Run `npx create-rubrica publicar` and paste a new Vercel token |
| I changed something in the panel and the site didn't change | Use the panel's **Publicar** button: the site is generated in the build |
| A plugin that's off still shows on the site | Publish again: the plugin list is generated in the build |
| `publicar` stopped saying the Convex project is a different one | Run `npx create-rubrica setup` and pick the Convex project of the live site |
| I forgot the panel password of the live site | `npx create-rubrica senha` and pick the published site |
| Broken images after switching databases | Images live in each environment's database: upload them again through the published site's panel |
