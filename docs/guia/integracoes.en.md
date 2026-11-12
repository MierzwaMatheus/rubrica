# Integrations

No integration is mandatory: without a service key, the feature stays off and the panel says what is missing.

**Secrets** (keys and tokens) live only in the **Convex environment variables**, once in each deployment (development and production). Never in the code, in `rubrica.config.ts` or in the database. Everything that isn't secret (recipients, webhook URL, enabled destinations) is configured in the panel.

`npx create-rubrica setup` asks for the main ones and writes them for you. To set one by hand: Convex dashboard, Settings, Environment Variables, or:

```bash
npx convex env set NAME value            # on the development Convex
```

> Before any `npx convex ...` command, check the `CONVEX_DEPLOYMENT` in `.env.local`: it says whether it goes to development or production.

## Public submissions (contact and testimonial)

| Variable | What for | Default |
|---|---|---|
| `RUBRICA_IP_SALT` | Salt for the IP and email hashes (submission limit and consent record). A long random value; don't change it later, since that resets the limits. `setup` writes it | The deployment address, which is public: **set it in production** |
| `RUBRICA_ALLOWED_ORIGINS` | Extra origins that may submit, comma separated (`https://www.example.com`). The site URL already counts | |
| `RUBRICA_ALLOW_LOCALHOST` | `true` allows `localhost`. **Development only** | off |
| `RUBRICA_CONTACT_RETENTION_DAYS` | Days a contact request is kept before being deleted (minimum 30). Shown in the privacy policy | `730` |

## Contact destinations

The panel always receives the requests. The other destinations are turned on in the panel and need these variables:

| Destination | Variables |
|---|---|
| **Telegram** | `TELEGRAM_BOT_TOKEN` (the bot token, created with @BotFather) and `TELEGRAM_CHAT_ID` (the chat that receives the alerts) |
| **Email** (Resend) | `RESEND_API_KEY`, `RUBRICA_EMAIL_FROM` (a sender on a verified domain, like `Site <alerts@example.com>`) and, for another provider, `RUBRICA_EMAIL_PROVIDER`. `Reply-To` is the sender's email |
| **Webhook** (CRM) | `RUBRICA_WEBHOOK_SECRET`: each delivery carries `X-Rubrica-Timestamp` and `X-Rubrica-Signature: sha256=<hex>`, the HMAC-SHA256 of `<timestamp>.<body>`. Verify the signature and reject old timestamps |

Deliveries that fail retry after 1 min, 5 min, 30 min and 2 h; after that they show as failed in the panel and can be resent. The same Telegram variables alert on accepted proposals, confirmed payments and refunds.

## Publishing

| Variable | What for |
|---|---|
| `RUBRICA_DEPLOY_HOOK_URL` | The host's deploy hook URL. The panel's **Publish** button makes a body-less `POST` to it. Vercel, Netlify and Cloudflare Pages have a "deploy hook" or "build hook" |
| `RUBRICA_DEPLOY_CALLBACK_SECRET` | Optional. Secret for the end-of-build notice (`POST <CONVEX_SITE_URL>/rubrica/publicacao/concluida`, with the `X-Rubrica-Secret` header). `setup` creates it on Convex and `publicar` copies it to the Vercel build; with it in the build environment, Rubrica itself tells the panel when the build finishes. Without it, the "publishing" state ends on its own 5 minutes after the click |

## AI translation (`translation` plugin)

| Variable | What for | Default |
|---|---|---|
| `OPENROUTER_API_KEY` | OpenRouter key | |
| `OPENROUTER_MODELS` | Models in order of preference, comma separated | `google/gemini-2.0-flash-001`, `google/gemini-2.5-flash-lite`, `openai/gpt-4o-mini`, `anthropic/claude-haiku-4.5` |

## Sales: proposals, payments and AI résumés

| Variable | When | What for |
|---|---|---|
| `ASAAS_API_KEY` | `payments` plugin | Asaas key. The environment comes from the prefix: `$aact_prod_` is production; any other is sandbox. Without it, checkout answers `NOT_CONFIGURED` |
| `ASAAS_ENV` | Optional | `production` or `sandbox`, to force the environment |
| `ASAAS_WEBHOOK_TOKEN` | `payments` plugin | Token Asaas sends in the `asaas-access-token` header. `setup` generates and shows it: register the **same value** in the Asaas dashboard. Without it, no payment is confirmed |
| `OPENROUTER_API_KEY` | `ai-resumes` plugin | Key used by the per-job résumé (can be the same as translation) |
| `OPENROUTER_RESUME_MODELS` | Optional | Three models, comma separated (job analysis, comparison, writing) |
| `SITE_URL` | Optional | Live site address. Goes into CORS and the payment return |

The Asaas webhook is at `<CONVEX_SITE_URL>/webhooks/asaas`, with the charge events. `CONVEX_SITE_URL` is the deployment's `.convex.site` address.

## Analytics (Umami)

These do **not** live in Convex: they go in the host's **build** variables (Vercel, Settings, Environment Variables), because the site is generated at build time.

| Variable | What for |
|---|---|
| `PUBLIC_UMAMI_SCRIPT_URL` | Script address (`https://cloud.umami.is/script.js`). https only |
| `PUBLIC_UMAMI_WEBSITE_ID` | Site id in Umami |

Turn on the **Analytics** plugin (off by default). Without the plugin, the script or the id, no page carries the script. The script origin must be allowed in the site's security policy: the command below adjusts `vercel.json` and `public/_headers`.

```bash
npx create-rubrica config --analytics https://cloud.umami.is/script.js --analytics-id <id>
```

## Privacy (LGPD/GDPR)

The forms (contact, testimonial, proposal) have explicit consent, recorded with the submission. The privacy policy is built from the company data and the plugins that are on, and is editable in the **Privacy** screen, which also exports and deletes a person's data. The policy also says whether any feature that is on uses cookies (Umami does not).
