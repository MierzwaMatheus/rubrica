# Changelog

What changed in each version of Rubrica (template and `create-rubrica` CLI). Details for each one are in the [release notes](https://github.com/MierzwaMatheus/rubrica/releases). To update an existing project, see [Atualizando o seu Rubrica](./docs/atualizacao.md) (in Portuguese).

## 1.8.0 — 2026-10-26

Case metric cards and the case testimonial now have an English version.

**Coming from 1.7:**
- Update with `npx create-rubrica@latest update`. No new CLI version is needed.
- The backend changed (`convex/`): push it to your computer's Convex with `npx convex dev --once` and, for the live site, with `npx create-rubrica publicar`. The new fields are optional: existing cases stay the same.
- Cases you already saved stay in Portuguese on `/en/` until you open each project at `/admin/projects` and save it again. The translation happens then.

### Cases
- **Metrics in English:** when you save the project, the label and value of each card are translated. Numbers ("365", "7 GB → 400 MB") stay the same; text ("Entrada + saída") is translated. The card metric on the home and portfolio pages is translated too.
- **Testimonial with its original language:** pick the language the person wrote the testimonial in (Portuguese or English). In the other language, the site shows the translation with a "Machine translation of the original" notice and a button to see the original.
- The prompt for importing a case as JSON asks for the translated metrics and testimonial.

### Skills
- The `rubrica` and `rubrica-case` skills know how to translate the metrics and set the testimonial's original language.

## 1.7.0 — 2026-10-25

Proposals with per-item prices, discounts and gifts. The skills now open an issue when Rubrica can't do what was asked, and projects get instructions for AI agents.

**Coming from 1.6:**
- Update with `npx create-rubrica@latest update`. No new CLI version is needed.
- The backend changed (`convex/`): push it to your computer's Convex with `npx convex dev --once` and, for the live site, with `npx create-rubrica publicar`. The new fields are optional: existing proposals stay the same.
- For the discount to show up in contracts from templates you already saved, add `{{discount}}` to the template at `/admin/contracts`.

### Proposals
- **Per-item price:** each scope item can have a price, shown next to it in the proposal and in the contract.
- **Discount:** optional original value (before the discount). The proposal shows the original value struck through, the discount in R$ and %, and the final value. The admin suggests the original value from the sum of the items and warns when the sum doesn't add up.
- **Gift:** mark a priced item as a gift. In the proposal it shows the "Brinde" badge, the price struck through and R$ 0,00.
- The project value is still the final value, used in the contract and the payment options. The contract mentions the discount and the gifts, and contract templates get the `{{original_value}}` and `{{discount}}` variables.

### Skills and agents
- **Opening issues:** when someone asks for something Rubrica doesn't support, or something breaks, the skills decide whether it's a bug or a feature request, look for a similar issue and, once the person says ok, open it on Rubrica's GitHub (with `gh` or a prefilled link), without private data.
- The `rubrica` skill knows how to handle proposal prices, discounts and gifts.
- **`AGENTS.md` and `CLAUDE.md`** at the project root: they teach agents such as Claude Code, Codex and Cursor how to update Rubrica (including the `.rubrica-new` files), what they can run in the CLI and what stays with you. See "With an AI agent" in [CLI commands](./docs/guia/cli.md).

## 1.6.0 — 2026-10-25

The Rubrica site gets an English version, a changelog page and the documentation, with three new guides: getting started, CLI commands and publishing.

**Coming from 1.5:**
- Update with `npx create-rubrica@latest update` to get the `rubrica-voz` skill that understands the interview in English. No new CLI version is needed, and nothing has to be pushed to Convex.

### Rubrica site
- **In English**, at [userubrica.vercel.app/en](https://userubrica.vercel.app/en/), with a language switch at the top. Builder, "Create yours", layouts and schemes, all translated. The page notes that the CLI and the admin panel are in Portuguese.
- **Changelog** at `/en/changelog` (and `/novidades`): this changelog on the site itself, with a version index.
- **Documentation** at `/en/docs` (and `/docs`): the template guide, the 13 layouts, the color schemes, creating a layout and updating become site pages, with navigation and an index. Links on the site no longer send you to GitHub.

### New guides
- [Getting started](./docs/guia/comecando.md): from zero to the site running on your computer, and what to fill in on each panel screen.
- [CLI commands](./docs/guia/cli.md): every question, option and file of `create`, and the other commands.
- [Publishing the site](./docs/guia/publicar.md): the first publish, the panel's Publish button, another computer, custom domain and common problems.
- The README and the CLI README are shorter and point to these guides.

### Voice interview in English
- At [/en/voice](https://userubrica.vercel.app/en/voice), with dictation in English and answers saved apart from the Portuguese ones. The `rubrica-voz` skill recognizes the English interview and observes the voice in the language of the answers.

## 1.5.0 — 2026-10-25

The admin panel's **Publish** button (**Publicar**) now works without GitHub, the AI agent can work on the published site, and `publicar` is safe to run on another computer.

**Coming from 1.4:**
- Update with `npx create-rubrica@latest update` and run `npx create-rubrica@latest publicar`. It records the published site's address in `rubrica.json` and offers to turn on the panel's Publish button (you create a Vercel token and paste it in the terminal, only once).
- Commit `rubrica.json` with the project: `setup` and `publicar` use it to recognize, on another computer, that the site is already live.

### Panel Publish button
- **No GitHub needed.** Vercel only creates Deploy Hooks for projects linked to GitHub, and `publicar` deploys from the terminal. Now the panel uses a Vercel token to redeploy the latest production deployment: the build runs again and fetches the updated content. If you have a Deploy Hook, the panel keeps using the hook.
- `publicar` opens Vercel's tokens page, explains what to fill in, takes the token without showing it on screen, checks that it can access the project and saves it to the production database.
- The panel shows why publishing failed (button not configured, expired token). Before, it said "Deploy started successfully!" ("Deploy iniciado com sucesso!") even on errors.

### AI agent on the published site
- The `rubrica` skill gains `--producao` (or `RUBRICA_AMBIENTE=producao`) to work on the live site. The default is still the site on your computer.
- In a project that is already published, login asks whether you want to sign in to the published site or the one on your computer. `status` shows both addresses.

### `publicar` and `setup` on another computer
- `publicar` saves the published database and site addresses under `producao` in `rubrica.json` (1.4 projects get this when they publish again).
- Without the `.vercel` folder (fresh clone, another computer), `publicar` notices the site is already published, links the folder to the same Vercel project and just publishes. Before, it redid the first-time flow: it generated new login keys (everyone was signed out of the panel) and rewrote the panel data.
- If the computer is linked to a different Convex project, `publicar` stops before writing anything, so it doesn't swap the live site's database for an empty one. `setup`, in a clone of a published site, links to an existing Convex project instead of creating a new one.
- When you publish again, Telegram and OpenRouter set up on your computer after the first time are sent to production (only the ones missing there).

### `create`
- Git starts on the `main` branch, with a first commit of the generated project. Before, the branch name depended on the computer (usually `master`) and the branch only existed after the person's first commit.

## 1.4.1 — 2026-10-24

Layouts adjusted for wide screens (1920px monitors and up). Nothing changes on screens up to 1600px.

**Coming from 1.4:**
- Update with `npx create-rubrica@latest update`. No new CLI version is needed, and nothing needs to be pushed to Convex. If the site is already published, publish again after updating.

### Wide screens
- **Jardim Digital:** content sat against the sidebar, with a huge empty space on the right. Now the column is centered.
- **Bento:** the grid only stopped at the screen edge, and the cards got huge. Now it stops at 1600px and is centered.
- **Suíço:** menu and content stop together at 1600px and, beyond that, get side borders in the layout's line style, like a centered sheet.

## 1.4.0 — 2026-10-24

`npx create-rubrica publicar` puts the site live on Vercel without copying anything by hand, and the template now works when published from a CLI project.

**Coming from 1.3:**
- Update with `npx create-rubrica@latest update`. It brings the `domain/` folder (without it `npm run build` fails), `public/color-mode.js` and the fixed `build:i18n`.

### Publishing
- `npx create-rubrica publicar`: signs in to Vercel (login in the browser), creates the project, prepares the Convex production database (key, backend, login keys, Telegram and OpenRouter integrations, profession), creates the published site's admin and initial data, saves the variables on Vercel and publishes. Running it again just publishes.
- `setup` ends by explaining how to put the site live.

### Fixes for the published site
- Projects created by the CLI failed on `npm run build`: the `domain/` folder, used by the RSS generator, was left out of the release package.
- The Vercel build wiped the site's translations when the translation plugin was off (the menu showed `navigation.home`). Now the texts from the database are merged over the repository's translations.
- The light/dark mode script was blocked by the published site's security policy (CSP). It moved to `public/color-mode.js`.

## 1.3.0 — 2026-10-24

Skills for the AI agent to write the site's content with a method and in the owner's voice, plus the voice interview on the site. Nothing changes on the site or the panel for people on 1.2.

**Coming from 1.2:**
- Update with `npx create-rubrica@latest update`. It brings the `.agents/skills/rubrica-*` folders (and the shortcuts in `.claude/skills/`) and the `.rubrica/` line in `.gitignore`. Nothing needs to be pushed to Convex.
- The first time you ask the agent for a site text (introduction, case, resume, post), it will send you to the voice interview at https://userubrica.vercel.app/voz. It takes about 20 minutes.

### Content skills
- **Six new skills** for the AI agent to write the site's content with a method and in the owner's voice: `rubrica-voz`, `rubrica-apresentacao`, `rubrica-case`, `rubrica-curriculo`, `rubrica-blog` and `rubrica-pilar`. The introduction, case and resume techniques come from research with sources (included with each skill in `references/pesquisa.md`).
- **Voice comes first.** Without a voice profile, the skills send the person to the voice interview on the site (`/voz`, hidden from search engines): 21 questions, answered by speaking (browser dictation) or typing, with a button that copies everything as Markdown for the agent. `rubrica-voz` measures the style with a script, builds the profile with verbatim excerpts, runs a blind calibration with the person and proposes the personal side of the About page.
- The strategist skills don't save anything: they deliver a plan in `.rubrica/planos/`, reviewed by `rubrica-pilar`, which the `rubrica` skill applies.
- New `aplicar-plano` command in the `rubrica` skill's script: validates the plan before saving (structure, files, text keys, duplicate slug, contrast, missing English, functions that don't exist), shows the before → after (`--verificar`), refuses plans made for a different Convex and resumes where it stopped if something fails (`--retomar`).

## 1.2.0 — 2026-10-24

A CLI designed for non-technical people: fewer questions, nothing asked twice, straight from the site to the terminal, and changing the panel password from the terminal. Nothing breaks for people on 1.1.

**Coming from 1.1:**
- Update with `npx create-rubrica@latest update`. It brings the function used by `npx create-rubrica senha`. If the site is already published, publish again after updating.
- The panel password now follows the same rules everywhere: 12 or more characters, with uppercase, lowercase and a number. Old passwords still work; the rule applies to future changes.

### Straight from the site to the terminal
- The site's **Create yours** section (**Crie o seu**), below the builder, builds a command with `--receita`. It carries the chosen look, the plugins, the identity, the profession and the specialties. Nothing leaves the browser.
- With the recipe, the CLI shows a summary, confirms and only asks for what is missing. The project is created on Convex without Convex's questions, and the terminal asks for **only the panel password**. Telegram and Vercel are left for a later `setup`.
- Readable options for those who prefer them: `--layout`, `--esquema`, `--modo`, `--textura`, `--fonte`, `--mono`, `--plugins`, `--alternancia`.

### Fewer questions in `create`
- It starts by asking **Quick** (**Rápido**) or **Custom** (**Personalizado**). In quick mode, colors, texture and fonts come from the layout, and the language is Portuguese.
- Plugins come in **ready-made bundles** (Completo, Para vender serviços, Só o portfólio — complete, for selling services, portfolio only), with the one-by-one list as an option. Names and descriptions in plain language, also in `config`.
- Site address **without typing `https://`**: `meusite.com/` becomes `https://meusite.com`. An `@` handle and an X profile link are also accepted. If you don't have a domain, you can keep the suggested `<projeto>.vercel.app`.
- Git and dependency install **with no questions**: with pnpm if create came from `pnpm create`, with npm otherwise.
- Offers to set up the panel right away: connects Convex and runs `setup` in the same flow, with no second terminal.

### `setup`, `config` and password
- `setup` connects Convex on its own when `.env.local` is missing, **doesn't ask again** for the site address and pre-fills the admin email. Telegram and Vercel sit behind a yes/no, and the questions no longer show environment variable names.
- The profession entered in `setup` now appears below the name on the site. Before, it was saved by a function that required login and failed silently.
- Running `setup` again no longer asks for the password when the panel already has an admin.
- **`npx create-rubrica senha`**: changes the panel password from the terminal, on the published site or the one on your computer, and unlocks a login blocked by wrong attempts.
- `config` → Identity (Identidade) opens the questions with the saved values, instead of asking for everything again.
- [CLI maintenance](./docs/cli/manutencao.md) guide (in Portuguese): what to change in the CLI when a new layout, color scheme, font or plugin comes in, and the recipe rules.

## 1.1.0 — 2026-10-24

8 new layouts, 15 color schemes with light and dark modes, visitor mode toggle, textures, and admin colors split by mode. Nothing breaks for people on 1.0.

**Coming from 1.0:**
- Update with `npx create-rubrica@latest update` and then run `npx create-rubrica@latest config` → **Appearance** (**Aparência**) to choose the scheme, mode, toggle and texture. Before `update`, `config` warns that the new layouts and light/dark mode don't exist in the project yet.
- Colors changed earlier in the admin keep applying to both modes until the appearance is saved again.

### 8 new layouts
- **Desktop Retrô**, **Índice**, **Monografia**, **Zine**, **Blueprint**, **Jardim Digital**, **Conversa** and **Pôster Cinético**, each with the 5 pages (Home, Resume, Portfolio, About, Blog), working on mobile and in both modes. See the [templates guide](./docs/templates/README.md) (in Portuguese).

### Color schemes, light/dark mode and texture
- **15 color schemes**, each with light and dark modes and 11 color roles: the 4 original presets (now also in the other mode), Neon (the original look) and 10 new ones (Riso, Cianotipia, Tropicália, Azulejo, Sumi, Fósforo, Crepúsculo, Concreto, Sorbet, Alto Contraste). The 5 original layouts still use only the usual 4 colors; the new ones use the full scheme.
- **Light, dark or automatic mode** (follows the visitor's system), with an option to show a button so visitors can switch. All 13 layouts have the button.
- Optional **textures**: film grain, paper and scanlines.
- `create-rubrica` and `create-rubrica config` → Appearance ask for scheme, mode, toggle and texture, with each layout's recommended option marked.
- Shared pages (post, case study, testimonials, proposals, checkout, 404 and the forms) now work in light mode. The admin panel is always dark.
- **Admin colors per mode:** in Site & Appearance (Site & Aparência), each mode has its own 4 colors. The fields start with the scheme's colors, only what you change is saved, and "Use the scheme colors" ("Usar as cores do esquema") undoes the customization. Before, saving the appearance (even just changing the font) locked the 4 colors on top of the scheme.
- The Google Fonts link now also loads the mono font, which wasn't loaded before.

## 1.0.0 — 2026-10-24

First stable version. From here on, within 1.x, updating doesn't break your customizations or your data: new database fields are always optional, and changes that need a migration only come in a new major version, with a guide.

**Coming from 0.x:**
- Update with `npx create-rubrica@latest update`. Projects created with the CLI up to v0.3.18 pass their starting version with `--from` (see [Atualizando o seu Rubrica](./docs/atualizacao.md), in Portuguese); fork projects use `git merge v1.0.0`.
- Payments are now real: set `ASAAS_API_KEY` and register the Asaas webhook (README → "Configurando os pagamentos"). The Stripe integration was removed.
- The Umami script now uses `VITE_UMAMI_SCRIPT_URL` and `VITE_UMAMI_WEBSITE_ID` (the old variables are still accepted).

### Update without losing customizations
- `create-rubrica update` was rewritten. Before, it extracted the new version over the project (losing any hand-edited file) and reset the identity in `rubrica.config.ts`. Now it merges Rubrica's changes with yours, file by file; when both changed the same part, your file stays intact and the new version goes to `<arquivo>.rubrica-new`. New options: `--dry-run`, `--from`, `--to`, `--yes`.
- `create` now saves the version actually downloaded in `rubrica.json` (before, it always saved `0.1.0`). Older projects pass their starting version with `--from` or by answering `update`'s question.

### Real payments (Asaas)
- Checkout now creates real charges on Asaas: **PIX** (QR code and copy-and-paste code), **boleto** (bank slip with line code and PDF) and **card in up to 12 installments**, through Asaas's secure page. The site never receives card data.
- **Serious fix:** card payments were marked as confirmed without any charge. Now a checkout only becomes paid when the Asaas webhook confirms it.
- The installment price with interest is calculated on the server; before, it came from the browser and could be tampered with.
- Switching payment method cancels the previous charge (before, two open charges were left), including every installment of an installment plan. Expired or deleted links cancel the PIX/card charge.
- A boleto that was already generated can't be switched to another method: it may have been paid and still be clearing.
- Protection against double payment and abuse: a lock against two simultaneous clicks, a limit of charges per link, and an expired PIX QR code that can be regenerated.
- Asaas refunds and chargebacks mark the checkout as refunded and send a Telegram alert; payment of a charge other than the current one, on a deleted link or for a lower amount also triggers an alert.
- Payment error messages reach the customer in production (before, they became "Server Error").
- Checkout with a minimum of R$ 5, at most 2 decimal places and a valid due date; installments under R$ 5 aren't offered; the payment method restricted on the checkout is respected.
- Payments admin working: Asaas customers, charges and invoices, with audit log. Checkout links generated with cryptographic randomness.
- The checkout page no longer breaks on open (it tried to format the CPF and phone number that the server hides on purpose). `/payment-success` shows "confirming" ("confirmando") until the payment is confirmed.
- New Convex variables: `ASAAS_API_KEY` (sandbox or production, detected from the key) and, optionally, `ASAAS_ENV`. `setup` asks for the key, generates `ASAAS_WEBHOOK_TOKEN` and shows how to register the webhook.
- **Removed:** the Stripe integration, which never worked (unused stubs in the interface), the `/webhooks/stripe` webhook and the `STRIPE_WEBHOOK_SECRET` variable.

### Layouts on mobile
- Swiss, Magazine, Brutalist and Bento fixed on phone screens: grids that didn't stack (content overflowing the screen), giant titles cut off, name broken in the middle in the Magazine header, excessive margins, squeezed testimonials and mosaics, the Brutalist blog table. Checked at 390, 768 and 1280px in all 5 layouts.
- New `src/components/MobileLayoutStyles.tsx`: on mobile, grids built with inline styles become a single column; exceptions by attribute (`data-m-cols="2"`, `data-m-keep`, `data-m-hide`, `data-m-scroll`, `data-m-bleed`).
- Cyberpunk: the top of the pages is no longer hidden behind the fixed mobile header.
- Swiss and Bento: post, case study and testimonials get side margins (before, they touched the edge).
- Post dates formatted in Bento and Brutalist (they showed as `2026-01-15T00:00:00.000Z`).
- Sample posts (seed and demo data) in HTML, the way the editor saves them; before, they showed raw `#` and `**`. Sample case slug fixed to `lumen-saude`.

### Security and cleanup
- Login: explicit limit of 5 wrong passwords per account per hour.
- Umami: the script is only added to the site when `VITE_UMAMI_SCRIPT_URL` and `VITE_UMAMI_WEBSITE_ID` are set (before, it loaded a URL with the literal placeholder); Umami Cloud allowed in the CSP. `VITE_ANALYTICS_ENDPOINT`/`VITE_ANALYTICS_WEBSITE_ID` are still accepted.
- `.env.example` rewritten with the variables the code actually reads.
- Removed leftovers from an old setup: `vite-plugin-manus-runtime`, `ManusDialog`, `Map.tsx` (unused Google Maps), `@shared`/`@assets` aliases and monorepo paths in the scripts.

### Fixes
- `npx create-rubrica <nome>` and `pnpm create rubrica <nome>` create the project again (before, they only showed the list of commands).
- `config`, identity: no longer resets SEO, RSS and the share image, updates the meta tags in `index.html` and saves the identity in `rubrica.json`.
- `config`, appearance: changing palette or font no longer deletes the meta tags in `index.html`.
- `config`, layout: works in projects created by the CLI (downloads the layouts for the project's version) and includes the Magazine layout.
- Vercel build: the `build:i18n` script, called by `vercel.json`, had gone missing from `package.json`. Removed the daily cron for `/api/cron-deploy`, a route that doesn't exist.
- The release includes `scripts/` and `vercel.json` again: without them, `pnpm build` failed in projects created by the CLI.
- The dashboard's "New proposal" ("Nova proposta") and "New project" ("Novo projeto") shortcuts open the creation form again.
- Texts on the login, testimonials, home, blog and about pages come from the translations (i18n) again instead of being hardcoded.

### Quality
- CI on GitHub Actions: types, tests and build for the template and the CLI on every PR.
- Template and CLI tests and typecheck passing (there were 21 + 8 failing tests and 9 + 4 type errors).

## 0.3.18 — 2026-10-24
- Conversion-focused portfolio structure in every layout: metrics, featured cases, working principles, case sections (role, before, decisions, lessons learned), category filters, testimonials by category, grouped skills, CV download at the top of the resume, and Umami events on CTAs. All new fields are optional.

## 0.3.17 — 2026-10-23
- **Security:** `siteConfig:setBatch` now requires the `root` or `admin` role.
- Seeds no longer erase customized texts and home page.
- Publishing after editing texts or configuration works again.
- The site name and contact entered in the CLI are now saved to Convex.
- New `rubrica` skill for AI agents (Claude Code, Codex, OpenCode).
- 4-color system in every layout, including light palettes; templates and colors guides.

## 0.3.16 — 2026-08-08
- The sidebar no longer covers part of the content on desktop.

## 0.3.15 — 2026-08-08
- Installs without the i18n plugin no longer show keys (`home.title`) instead of texts.

## 0.3.14 — 2026-08-08
- The home page no longer breaks when the technology list comes in an unexpected format.

## 0.3.13 — 2026-08-08
- Sidebar without a nested `<a>` (hydration error).

## 0.3.12 — 2026-08-08
- `setup` applies the seeds again (the command failed silently and the tables stayed empty).

## 0.3.11 — 2026-08-08
- The Magazine layout no longer repeats the Masthead three times.

## 0.3.10 — 2026-08-08
- Broken import in the Brutalist Navbar; pages and components that were missing from the template.

## 0.3.9 — 2026-08-08
- Masthead import fixed in the Magazine layout.

## 0.3.8 — 2026-05-25
- Theme CSS variable conflict fixed.

## 0.3.7 — 2026-05-25
- ASCII art of the name, and `--bg`/`--text` colors from Convex now applied.

## 0.3.6 — 2026-05-25
- The generated `vite.config` no longer references `isDev`.

## 0.3.5 — 2026-05-25
- Brutalist fixes (colors, navigation, identity in the CLI, ASCII art) and a clean console.

## 0.3.4 — 2026-05-25
- 4-color CSS contract (`--bg`, `--text`, `--primary`, `--accent`) and 2 fonts in every template.

## 0.3.0 — 2026-05-24
- Full pages (Home, Resume, Portfolio, About, Blog) for Brutalist, Swiss, Magazine and Bento.

## 0.2.0 – 0.2.4 — 2026-05-22 to 2026-05-23
- `setup` command: JWT keys, `SITE_URL`, per-plugin variables, root user and seeds. Fixes to saving `JWT_PRIVATE_KEY`.

## 0.1.0 — 2026-05-22
- First release.
