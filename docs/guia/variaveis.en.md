# Environment variables

Almost everything in Rubrica is set up in the panel. What is left out are the **environment variables**: secret keys and addresses the system needs to know before the panel even exists. This page lists all of them, where each one lives and whether you need it.

**None is required for the site to open.** Without the variable for a feature, that feature stays off and the panel tells you what is missing. And you almost never write anything by hand: `npx create-rubrica setup` writes the ones for your computer and `npx create-rubrica publicar` writes the ones for the live site.

## Where they live

| Place | What it holds | Who writes it |
|---|---|---|
| **Convex** (the backend) | The secrets: service keys, tokens, the forms salt. Once in the **development** database and once in the **production** one | `setup` (development) and `publicar` (production). By hand: Convex dashboard, Settings, Environment Variables |
| **Host** (Vercel or another) | What the build needs to generate the site: the production Convex address and the site address | `publicar`, on Vercel. On another host, you, in the project settings |
| **`.env.local`** (on your computer) | The development Convex address | Convex itself. Do not edit it, show it or commit it |

To write a variable to Convex from the terminal:

```bash
npx convex env set NAME value            # in the development database
npx convex env set NAME value --prod     # in the production database
```

> Before any `npx convex ...` command, check the `CONVEX_DEPLOYMENT` in `.env.local`: it tells you which database the command will run on.

## In Convex

### Basics (the CLI writes them)

| Variable | What for |
|---|---|
| `JWT_PRIVATE_KEY` and `JWKS` | The panel login keys. `setup` and `publicar` create them; leave them alone |
| `SITE_URL` | The live site address. Used for the payment return and in the list of addresses allowed to send forms |
| `RUBRICA_IP_SALT` | A random value used to store IPs and emails from the forms in a protected way. **Set it in production** and do not change it later: changing it resets the submission limits |
| `RUBRICA_ALLOW_LOCALHOST` | `true` lets the site on your computer send forms. **Development database only** |
| `RUBRICA_DEPLOY_CALLBACK_SECRET` | Optional. Secret for the "build finished" notice, so the panel's "publishing" state ends right away |

### Forms and contacts

| Variable | What for |
|---|---|
| `RUBRICA_ALLOWED_ORIGINS` | Other addresses allowed to send forms, separated by commas. The site address already counts |
| `RUBRICA_CONTACT_RETENTION_DAYS` | How many days a contact request is kept (minimum 30; default 730). It shows in the privacy policy |
| `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` | Telegram notices: contact requests, accepted proposals and payments |
| `RESEND_API_KEY` and `RUBRICA_EMAIL_FROM` | Email notices (through Resend), with a sender from your own domain |
| `RUBRICA_EMAIL_PROVIDER` | Another email provider. Today only `resend` exists, and it is the default |
| `RUBRICA_WEBHOOK_SECRET` | Signature for submissions sent to a webhook (a CRM, for example) |

### Publishing

| Variable | What for |
|---|---|
| `RUBRICA_DEPLOY_HOOK_URL` | The address the panel's **Publicar** (Publish) button calls to rebuild the site. With Vercel, `publicar` sets it up on its own; on another host, copy its "deploy hook" or "build hook" |

### AI features

| Variable | What for |
|---|---|
| `OPENROUTER_API_KEY` | OpenRouter key, for AI translation and the AI résumé per job |
| `OPENROUTER_MODELS` | Optional. The translation models, in order of preference |
| `OPENROUTER_RESUME_MODELS` | Optional. The three models for the résumé per job |

### Payments (Asaas)

| Variable | What for |
|---|---|
| `ASAAS_API_KEY` | Asaas key. Without it, checkout does not work |
| `ASAAS_WEBHOOK_TOKEN` | Code Asaas sends to confirm payments. `setup` creates it: register the **same value** in the Asaas dashboard |
| `ASAAS_ENV` | Optional. `production` or `sandbox`, to choose the Asaas environment (without it, the environment comes from the key) |

## On the host (build)

| Variable | What for |
|---|---|
| `CONVEX_URL` | The **production** Convex address (ends in `.convex.cloud`). The build reads the content from here |
| `PUBLIC_RUBRICA_API` | Only needed if the forms API lives at another address. By default it comes from `CONVEX_SITE_URL` (which `convex dev` writes to `.env.local`) or from `CONVEX_URL` (`x.convex.cloud` becomes `x.convex.site`). In demo mode (fixtures) the forms do not send |
| `SITE_URL` | The site address |
| `CONVEX_DEPLOY_KEY` | Key that lets the build send the backend to the production Convex. Only needed when the build runs `convex deploy`, as the Vercel one does |
| `PUBLIC_UMAMI_SCRIPT_URL` and `PUBLIC_UMAMI_WEBSITE_ID` | Umami script address and site id, for the Analytics plugin. What is in the panel's Configurações (Settings) wins |

## v1 names

If you come from v1 you do not need to rename anything: Rubrica accepts the old names `TELEGRAM_ADMIN_CHAT_ID`, `VERCEL_DEPLOY_HOOK_URL`, `VITE_CONVEX_URL`, `VITE_UMAMI_SCRIPT_URL`, `VITE_UMAMI_WEBSITE_ID`, `VITE_ANALYTICS_ENDPOINT` and `VITE_ANALYTICS_WEBSITE_ID`.

The details of each service (the Telegram bot, the Asaas webhook, the webhook signature format) are in [Integrations](./integracoes.md). To put the site online on another host, see [Publishing the site](./publicar.md#other-hosts).
