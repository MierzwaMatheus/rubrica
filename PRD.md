# Product Requirements Document (PRD) — Portfolio Platform

## 1. Product Overview

### 1.1 Product Name

**Rubrica — Portfolio Platform**

### 1.2 Product Description

An open-source, full-stack portfolio template that combines a public site with an administrative panel. It manages projects and case studies, blog posts, resume, testimonials, commercial proposals with electronic acceptance, and site content/appearance through the admin. New projects are created and kept up to date with the `create-rubrica` CLI (`cli/`).

### 1.3 Target Audience

- **Primary**: Developers, designers and freelancers who create their own portfolio from the template
- **Secondary**: Potential clients and employers visiting the published portfolio
- **Tertiary**: Commercial proposal recipients who review and accept proposals electronically

### 1.4 Design Philosophy

- **Interchangeable layouts**: 5 layouts — `cyberpunk` (default), `brutalist`, `swiss`, `bento`, `magazine` — applied by the CLI from `templates/layouts/` (see `docs/templates/`)
- **4-color theme contract**: every theme is defined only by `--bg`, `--text`, `--primary` and `--accent` in `src/index.css` (or in the admin, **Site & Appearance**); surfaces, borders and muted text are derived from them, so light and dark palettes both work. The CLI offers 4 palettes (Editorial Cream, Paper Noir, Midnight Blue, Solar Warm); the repository default is the original neon purple/lime look (see `docs/templates/cores.md`)
- **Conversion-focused structure**: home metrics, featured case studies, work principles, case study sections, project/testimonial categories and resume skill groups (since v0.3.18)
- **Console-inspired touches**: terminal overlay (toggled with the backtick key), monospace typography for code elements

---

## 2. Technical Stack

### 2.1 Frontend

| Technology           | Version  | Purpose                 |
| -------------------- | -------- | ----------------------- |
| React                | 19.2     | UI library              |
| TypeScript           | 5.6.3    | Type safety             |
| Vite                 | 7.1      | Build tool & dev server |
| Wouter               | 3.3      | Lightweight routing     |
| Framer Motion        | 12.23    | Animations              |
| TanStack React Query | 5.90     | Server state management |

### 2.2 Backend & Database

| Technology      | Version | Purpose                                      |
| --------------- | ------- | -------------------------------------------- |
| **Convex**      | 1.37    | Serverless backend, real-time database, file storage, cron jobs |
| **Convex Auth** | 0.0.92  | Authentication (email/password)              |

### 2.3 Styling

| Technology   | Version | Purpose                        |
| ------------ | ------- | ------------------------------ |
| Tailwind CSS | 4.1     | Utility-first CSS framework    |
| Radix UI     | Various | Accessible headless components |
| shadcn/ui    | —       | Pre-built component collection |
| Lucide React | 0.453.0 | Icon library                   |

### 2.4 AI

| Provider   | Purpose                                                                 |
| ---------- | ----------------------------------------------------------------------- |
| OpenRouter | Automatic content translation, AI resume pipeline, playground AI proxy |

### 2.5 Payment Integration (Asaas)

| Provider | Role |
| -------- | ---- |
| Asaas    | PIX, boleto and credit card (up to 12 installments) through the Asaas API v3 (`convex/asaas.ts`, `convex/lib/asaasClient.ts`) |

- Environment comes from the key prefix (`$aact_prod_` = production, otherwise sandbox); `ASAAS_ENV` overrides it.
- Card data is never collected by the site: card charges redirect to the Asaas hosted payment page (`invoiceUrl`).
- Installment totals are computed on the server (`convex/lib/installments.ts`), never trusted from the browser.
- A checkout only becomes `paid` through the Asaas webhook (`/webhooks/asaas`, `asaas-access-token` header); refunds and chargebacks move it to `refunded`.
- Charge generation is locked per checkout (no duplicate charges on concurrent clicks), capped at 8 charges per link, and errors reach the browser as `ConvexError` codes.

### 2.6 Forms & Validation

| Technology      | Version | Purpose               |
| --------------- | ------- | --------------------- |
| React Hook Form | 7.64    | Form state management |
| Zod             | 4.1     | Schema validation     |

### 2.7 Rich Text Editor

| Technology | Version | Purpose                     |
| ---------- | ------- | --------------------------- |
| TipTap     | 3.13    | Extensible rich text editor |

### 2.8 Utilities

| Technology           | Purpose                                  |
| -------------------- | ---------------------------------------- |
| Recharts             | Charts & visualizations                  |
| Sonner               | Toast notifications                      |
| nanoid               | Unique ID generation                     |
| @dnd-kit             | Drag and drop                            |
| jsPDF                | Client-side PDF generation (CV, contract) |
| signature_pad        | Handwritten signature capture            |
| react-markdown       | Markdown rendering                       |
| react-helmet-async   | Per-page SEO meta tags                   |
| cmdk                 | Command palette (admin)                  |
| embla-carousel-react | Carousel component                       |

### 2.9 Analytics & Performance

| Technology            | Purpose                                                                    |
| --------------------- | -------------------------------------------------------------------------- |
| Vercel Analytics      | Page views                                                                 |
| Vercel Speed Insights | Performance monitoring                                                     |
| Umami (optional)      | Custom events (`src/lib/analytics.ts`, `data-umami-event` attributes); script injected at build time only when `VITE_UMAMI_SCRIPT_URL` + `VITE_UMAMI_WEBSITE_ID` are set (`src/lib/umamiScript.ts`); Umami Cloud is allowed in the CSP |

### 2.10 Testing & CI

| Technology     | Purpose                                                                 |
| -------------- | ----------------------------------------------------------------------- |
| Vitest         | Template test suite (`tests/app`, `tests/convex`) and CLI tests (`cli/src/__tests__`) |
| Stryker        | Mutation testing (`npm run mutation:diff`)                              |
| GitHub Actions | `.github/workflows/ci.yml`: typecheck + tests for the template, typecheck + tests + build for the CLI |

---

## 3. Convex Backend Architecture

### 3.1 Database Schema (`convex/schema.ts`)

Most content tables use soft delete (`deletedAt`, `deletedBy`). Translatable fields use `*Translations` objects with `ptBR` / `enUS`.

| Collection               | Purpose                              | Main fields |
| ------------------------ | ------------------------------------ | ----------- |
| `users` + Convex Auth tables | User accounts                    | (from `authTables`) |
| `userRoles`              | Role assignments                     | userId, role (root\|admin\|content-editor\|blog-editor\|proposal-editor), mustChangePassword |
| `projects`               | Portfolio projects / case studies    | title, description, longDescription, tags, imageIds, externalImageUrls, demoLink, githubLink, slug, caseStudy (problem, solution, results, role, context, decisions, learnings, metrics, testimonial), category, orderIndex |
| `posts`                  | Blog posts                           | title, subtitle, slug, content, imageId, tags, featured, status (draft\|published), readTime, publishedAt |
| `resumeItems`            | Resume entries (discriminated union) | type (experience\|education\|course\|skill\|soft_skill\|language\|volunteer), content (skills have an optional `group`), orderIndex |
| `services`               | Home service cards                   | title, description, orderIndex |
| `testimonials`           | Published testimonials               | name, role, imageId, text, showOnHome, category, orderIndex |
| `testimonialSubmissions` | Testimonials sent by visitors        | name, role, company, email, type (text\|video), videoStorageId, status (pending\|approved\|rejected\|published) |
| `homeContent`            | Key/value home content and plugin state | key, value (e.g. hero_title, about_text, home_metrics, work_principles, `plugin:<id>:enabled`) |
| `aboutDailyRoutine`      | About page daily routine             | imageId, description, spanSize (1x1\|1x2\|2x1), displayOrder |
| `aboutFaq`               | About page FAQ                       | question, answer, displayOrder |
| `contactInfo`            | Owner/contact information            | name, role, email, phone, location, social URLs, show* visibility flags, avatar, proposalIntro |
| `contactRequests`        | Contact wizard submissions           | type (project\|job\|networking\|feedback), status, answers, contactInfo, adminNotes |
| `imageFolders` / `imageMetadata` | Media library on Convex Storage | folder tree; storageId, displayName, altText, tags, dimensions |
| `proposals`              | Commercial proposals                 | clientName, slug, title, objective, scope, timeline, deliveryDate, investmentValue, paymentMethods, conditions, password, rescissionPolicy, version, isAccepted, expiresAt, templateId |
| `proposalVersions`       | Proposal version history             | proposalId, version, contentSnapshot |
| `proposalSessions`       | Temporary access sessions            | proposalId, token, isUsed, expiresAt |
| `proposalAcceptances`    | Electronic acceptance records        | proposalVersion, clientName, clientDocument, clientEmail, clientRole, contentSnapshot, contentHash (SHA-256), ipAddress, userAgent, signatureStorageId, anonymizedAt |
| `contractTemplates`      | Contract templates for proposals     | name, content, isDefault |
| `checkouts`              | Checkout links                       | uniqueLink, customer data, customerId (Asaas), value, dueDate, status (pending\|payment_selected\|paid\|expired\|failed\|refunded; legacy payment_confirmed), paymentMethod, installments, totalValue, asaasChargeId, PIX QR code, boleto URL and line, invoiceUrl |
| `aiGeneratedResumes`     | AI-generated CVs                     | jobDescription, locale, fitScore, strengths, weaknesses, cvData |
| `siteConfig`             | Site & appearance settings           | key, value (theme colors, fonts, …) |
| `siteTexts`              | Editable interface texts (i18n)      | key, page, ptBR, enUS |
| `deployStatus`           | Publish tracking                     | pendingChanges, lastPublishedAt, lastTriggeredBy |
| `auditLog`               | Admin audit trail                    | eventType, actorType, actorId, target, metadata, ipAddress, expiresAt |
| `playgroundAuditLog`     | Playground usage events (24h)        | sessionId, eventType, expiresAt |
| `rateLimitAttempts`      | Rate limiting                        | key, type, attemptCount, blockedUntil, expiresAt |

### 3.2 Convex Auth Configuration

- Single provider: **Password** (email/password). Public sign-up is disabled (`convex/auth.ts`).
- The first root user is created through a setup screen, allowed only while the Convex env var `BOOTSTRAP_ALLOWED=true`.
- Other users are created by root and must change their password on first login (`mustChangePassword`).

### 3.3 Convex Functions

Server logic lives in one module per domain (`projects.ts`, `posts.ts`, `proposals.ts`, `checkouts.ts`, `users.ts`, `siteConfig.ts`, `siteTexts.ts`, `plugins.ts`, `images.ts`, `translation.ts`, `aiResumesAction.ts`, `telegram.ts`, `deploy.ts`, …) as queries, mutations and actions. Admin mutations check roles (`requireRole`), check the plugin state (`requirePlugin`), write to the audit log and mark pending changes for publishing.

#### HTTP endpoints (`convex/http.ts`)

| Path                       | Purpose                                                      |
| -------------------------- | ------------------------------------------------------------ |
| `/api/contact/submit`      | Contact wizard submission (rate limited)                     |
| `/api/testimonial/submit`  | Testimonial wizard submission (rate limited)                 |
| `/api/proposal/session`    | Password check → temporary proposal session                  |
| `/api/proposal/accept`     | Electronic proposal acceptance                               |
| `/webhooks/asaas`          | Asaas webhook (access token) → `checkouts.markPaidByLink`    |
| `/webhooks/vercel-deploy`  | Marks the site as published after a Vercel deploy            |
| `/playground/ai-proxy`     | Rate-limited AI proxy for the playground                     |

#### Cron jobs (`convex/crons.ts`)

Expired proposal sessions, rate-limit entries and playground logs are cleaned daily; audit logs older than 2 years are removed weekly; IPs older than 90 days are anonymized daily; pending checkouts past their expiration date (30 days by default) are expired hourly, cancelling their PIX/card charge in Asaas (boleto charges are kept, since they may be clearing); `siteConfig` is seeded daily (idempotent).

#### Telegram notifications

Optional (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_ADMIN_CHAT_ID`): proposal accepted, checkout paid, new contact request, new testimonial submission.

### 3.4 Real-time Subscriptions

Admin pages use reactive Convex queries, so changes made by another admin show up automatically.

---

## 4. Public Area — Features

### 4.1 Home Page (`/`)

- Hero (title, subtitle, tags from `homeContent`) with proof metrics (`home_metrics`) and calls to action
- Featured case studies
- About section with highlighted numbers
- Services grid
- Testimonials (those marked `showOnHome`)
- Closing section with two paths: "I have a project" / "I have a job opening"

### 4.2 About Page (`/sobre`)

- Professional summary (same text as the home "About")
- Work principles (`work_principles`)
- Personal side, daily routine bento grid (`aboutDailyRoutine`) and FAQ accordion (`aboutFaq`)

### 4.3 Portfolio (`/portfolio`, `/portfolio/:slug`)

- Project grid filtered by category
- Project detail dialog with image carousel and full-screen viewer, demo and source links
- Case study page per project: role, context, decisions, results, metrics, learnings, screenshots, testimonial, CTA and next case

### 4.4 Resume (`/curriculo`)

Experience, education, courses, skills (grouped by `group`), soft skills, languages and volunteer work, in the order set in the admin. ATS-friendly CV PDF export.

### 4.5 Blog (`/blog`, `/blog/:slug`)

- Published posts, featured posts, search and tag filter, read time
- Post page rendering TipTap HTML with SEO meta tags
- RSS feed and sitemap generated at build time

### 4.6 Testimonials (`/depoimentos`)

- Testimonials grouped by category
- Public testimonial wizard (text or video upload) going to a moderation queue (`testimonials-intake` sub-plugin)

### 4.7 Proposals (`/proposta/:id`, `/proposta/:slug/aceitar`)

- Proposal view with 10-day expiration, status (accepted, pending, expired), optional password protection and session-based access
- Expandable rescission policy (markdown)
- Electronic acceptance: full name, CPF/CNPJ, email, role, declaration, handwritten signature (stored in Convex Storage), SHA-256 content hash, IP and User-Agent
- Contract PDF generated from the contract template, with the signature

### 4.8 Checkout (`/checkout/:uniqueLink`, `/payment-success/:uniqueLink`)

- The customer picks PIX (QR code + copy-and-paste code, with the expiration returned by Asaas), boleto (digitable line + PDF) or credit card (installments, then redirect to the Asaas hosted page).
- Switching methods (or installments) cancels the previous Asaas charge before creating a new one; picking the same method again reuses the existing charge.
- The page is reactive: it moves to the success screen when the webhook marks the checkout as paid. `/payment-success` shows "confirming" until then.

### 4.9 Contact Wizard

Step-by-step contact flow (project, job, networking, feedback) opened from the sidebar; rate limited by IP; lands in `/admin/contatos`.

### 4.10 Playground (`/playground/*`)

Public demo area (contact wizard, proposal, blog, payment link, AI CV) using fake data; AI usage rate limited.

### 4.11 Sidebar & Terminal

- Persistent sidebar: navigation (items follow the enabled plugins), contact info, CV download, language switch (pt-BR / en-US)
- Terminal overlay toggled with the backtick key on public pages

---

## 5. Administrative Area — Features

### 5.1 Authentication & Authorization

#### Login (`/login`)

- Email/password only (Convex Auth Password provider)
- Forced password change on first login for users created by root

#### Role-Based Access Control

| Role              | Access                                                        |
| ----------------- | ------------------------------------------------------------- |
| `root`            | Everything, including users, audit log and LGPD               |
| `admin`           | All content, proposals, payments, plugins, site config        |
| `content-editor`  | Projects, blog, resume, home, about, texts, testimonials      |
| `blog-editor`     | Blog only                                                     |
| `proposal-editor` | Proposals only                                                |

Roles are stored in `userRoles`. Per-route roles are listed in §10.2.

### 5.2 Dashboard (`/admin/dashboard`)

- Counts: projects, posts (published/draft), proposals (total/accepted/pending), checkouts (paid/pending)
- Quick actions, command palette, publish status / "Publish" button

### 5.3 Content Management

- **Projects** (`/admin/projects`): CRUD, images from the media library, tags, category, case study fields and metrics, drag & drop ordering, automatic translation
- **Blog** (`/admin/blog`): TipTap editor, tags, featured, draft/published, auto slug, cover image
- **Resume** (`/admin/resume`): CRUD by type, skill groups, ordering
- **Home** (`/admin/home`): hero, about text, metrics editor, services
- **About** (`/admin/about`): work principles, daily routine, FAQ
- **Testimonials** (`/admin/depoimentos`): CRUD, categories, "show on home", submissions moderation
- **Contact** (`/admin/contact`): contact data, social links, visibility toggles
- **Contact requests** (`/admin/contatos`): status, notes
- **Texts** (`/admin/textos`): edit interface strings per language (`siteTexts`)
- **Site & Appearance** (`/admin/site-config`): the 4 theme colors and fonts

### 5.4 Media Library

Images are stored in Convex Storage, organized in folders (`imageFolders`, `imageMetadata`) and picked with `ImagePicker`. Content references images by ID.

### 5.5 Proposal Management (`/admin/proposals`, `/admin/contracts`)

- CRUD with tabs: All / Accepted; accepted proposals are immutable
- Password generation (8 random characters), rescission policy (markdown)
- Automatic versioning on edit (non-accepted only) in `proposalVersions`
- Contract templates (`contractTemplates`) and contract PDF download for accepted proposals

### 5.6 Payments (`/admin/payment-links`)

- Asaas customers: list, create, delete. Asaas charges: list, create, cancel. Invoices (NFS-e): read-only list (issued and configured in Asaas).
- Checkout links: created from an Asaas customer, with a cryptographically random link; soft delete/restore.
- All admin actions require the `payments` plugin and `root`/`admin`, and writes go to the audit log.

### 5.7 AI Resumes (`/admin/ai-resumes`)

Three-step OpenRouter pipeline (job analysis → ATS fit score with strengths/weaknesses → ATS rewrite), saved in `aiGeneratedResumes`, exportable as PDF.

### 5.8 Plugins (`/admin/plugins`)

Features can be turned on/off: `contact-wizard`, `proposals`, `payments`, `blog`, `portfolio`, `resume`, `about`, `ai-resumes`, `audit-log`, `media-manager`, `i18n`, `playground`, `testimonials` (with sub-plugin `testimonials-intake`), `contract-templates`. Disabled plugins are blocked in the backend and hidden in the UI. Public visitors see the change after the next deploy (`plugins.json`).

### 5.9 Users, Audit and LGPD

- **Users** (`/admin/users/new`): root-only creation with role assignment
- **Audit log** (`/admin/logs`): all admin mutations; 2-year retention, IP anonymized after 90 days
- **LGPD** (`/admin/lgpd`): root-only export and anonymization of a data subject's records

### 5.10 Publishing

Admin changes mark `deployStatus.pendingChanges`. The "Publish" button calls `deploy.trigger`, which (root/admin, throttled to 1 per minute) calls the Vercel deploy hook (`VERCEL_DEPLOY_HOOK_URL`).

---

## 6. Internationalization (i18n)

### 6.1 Supported Languages

- **pt-BR** (Portuguese — Brazil) — Default
- **en-US** (English — United States)

### 6.2 Implementation

- React Context provider and `useTranslation` hook, with a repository pattern (`src/i18n/`)
- Interface strings live in `src/i18n/translations/{pt-BR,en-US}.ts`; they can be edited in the admin (`siteTexts`) and are regenerated from Convex at build time by `npm run build:i18n`
- Content fields store both languages (`*Translations`); the admin translates changed fields automatically via OpenRouter

---

## 7. Static Data & Fallback

### 7.1 Static JSON Files

`public/data/` holds `home.json`, `portfolio.json`, `blog.json`, `resume.json`, `about.json`, `sidebar.json` (plus `contact.json` and `plugins.json` generated at build time). The committed files are sample data (`scripts/generate-sample-data.ts`) so the template renders without Convex; `scripts/fetch-static-data.ts` replaces them with real data in production builds.

### 7.2 Repository Pattern

- Interface-based abstraction
- Static repositories for fallback, Convex repositories for live data

---

## 8. Scripts & Automation

| Script                     | Description                                                   |
| -------------------------- | ------------------------------------------------------------- |
| `export-i18n.ts`           | Regenerate interface translations from `siteTexts` (`build:i18n`) |
| `fetch-static-data.ts`     | Fetch static data from Convex at build time                   |
| `generate-rss-feed.ts`     | Generate the RSS feed from blog posts                          |
| `generate-sitemap.ts`      | Generate `sitemap.xml`                                         |
| `generate-sample-data.ts`  | Generate the sample `public/data` files and images             |
| `extract-key-manifest.ts`  | Build the i18n key manifest                                    |
| `generate-cv-pdf.ts`       | Render the CV page to PDF                                      |

---

## 9. Non-Functional Requirements

### 9.1 Performance

- Vite build, lazy loading and code splitting
- Static data generated at build time
- Vercel Speed Insights

### 9.2 Security

- Convex Auth with public sign-up disabled; RBAC on routes and in every admin function
- Password-protected proposals with temporary sessions; SHA-256 content hash for accepted proposals
- Rate limiting on proposal password/acceptance, contact and testimonial submissions, and the playground
- Webhook verification (Asaas token, Vercel secret)
- Sign-in limited to 5 failed attempts per account per hour (Convex Auth `signIn.maxFailedAttempsPerHour`)
- Security headers and CSP in `vercel.json`
- Audit log, soft delete, LGPD export/anonymization

### 9.3 Accessibility

- Radix UI components, semantic HTML, keyboard navigation

### 9.4 SEO

- react-helmet-async per-page meta tags (Open Graph), slug URLs
- RSS feed and sitemap

### 9.5 Reliability

- Error Boundary, graceful static fallback, toast notifications
- Automated tests run in CI on every pull request

---

## 10. Route Map

### 10.1 Public Routes

| Route                          | Description          | Plugin       |
| ------------------------------ | -------------------- | ------------ |
| `/`                            | Home page            | —            |
| `/sobre`                       | About page           | about        |
| `/curriculo`                   | Resume page          | resume       |
| `/portfolio`                   | Portfolio page       | portfolio    |
| `/portfolio/:slug`             | Case study           | portfolio    |
| `/blog`                        | Blog listing         | blog         |
| `/blog/:slug`                  | Blog post detail     | blog         |
| `/depoimentos`                 | Testimonials         | testimonials |
| `/proposta/:id`                | Proposal viewing     | proposals    |
| `/proposta/:slug/aceitar`      | Proposal acceptance  | proposals    |
| `/checkout/:uniqueLink`        | Checkout page        | payments     |
| `/payment-success/:uniqueLink` | Payment success      | payments     |
| `/playground/*`                | Demo area            | playground   |
| `/login`                       | Login page           | —            |
| `/404`                         | Not found page       | —            |

### 10.2 Admin Routes

| Route                          | Description            | Required Role                                    |
| ------------------------------ | ---------------------- | ------------------------------------------------ |
| `/admin` or `/admin/dashboard` | Dashboard              | root, admin, content-editor, blog-editor         |
| `/admin/projects`              | Projects               | root, admin, content-editor                      |
| `/admin/blog`                  | Blog                   | root, admin, content-editor, blog-editor         |
| `/admin/resume`                | Resume                 | root, admin, content-editor                      |
| `/admin/home`                  | Home page              | root, admin, content-editor                      |
| `/admin/about`                 | About page             | root, admin, content-editor                      |
| `/admin/textos`                | Interface texts        | root, admin, content-editor                      |
| `/admin/depoimentos`           | Testimonials           | root, admin, content-editor                      |
| `/admin/contact`               | Contact info           | root, admin                                      |
| `/admin/contatos`              | Contact requests       | root, admin                                      |
| `/admin/proposals`             | Proposals              | root, admin, proposal-editor                     |
| `/admin/contracts`             | Contract templates     | root, admin                                      |
| `/admin/payment-links`         | Payments (experimental)| root, admin                                      |
| `/admin/ai-resumes`            | AI resumes             | root, admin                                      |
| `/admin/plugins`               | Plugins                | root, admin                                      |
| `/admin/site-config`           | Site & appearance      | root, admin                                      |
| `/admin/logs`                  | Audit log              | root                                             |
| `/admin/lgpd`                  | LGPD data subjects     | root                                             |
| `/admin/users/new`             | Create user            | root                                             |

---

## 11. Environment Variables

Frontend / build (`.env` / Vercel):

```env
VITE_CONVEX_URL=https://your-project.convex.cloud
CONVEX_URL=https://your-project.convex.cloud   # build scripts
CONVEX_DEPLOY_KEY=...                          # npx convex deploy during build
SITE_URL=https://your-domain.com               # RSS + sitemap
VITE_UMAMI_SCRIPT_URL=...                      # optional, Umami (e.g. https://cloud.umami.is/script.js)
VITE_UMAMI_WEBSITE_ID=...                      # optional, Umami
```

Convex (`npx convex env set`):

```env
BOOTSTRAP_ALLOWED=true          # only while creating the first root user
OPENROUTER_API_KEY=...          # translation, AI resumes
PLAYGROUND_KEY_PEPPER=...       # playground API key fingerprint
TELEGRAM_BOT_TOKEN=...          # optional notifications
TELEGRAM_ADMIN_CHAT_ID=...
VERCEL_DEPLOY_HOOK_URL=...      # "Publish" button
VERCEL_WEBHOOK_SECRET=...       # /webhooks/vercel-deploy
ASAAS_API_KEY=...               # payments ($aact_hmlg_ sandbox / $aact_prod_ production)
ASAAS_WEBHOOK_TOKEN=...         # token configured in the Asaas webhook
ASAAS_ENV=...                   # optional: production | sandbox
SITE_URL=...
```

See `.env.example` for the reference list.

---

## 12. Build & Deployment

### 12.1 Build Process

```
npm run dev        = vite --host & npx convex dev
npm run build:i18n = tsx scripts/export-i18n.ts
npm run build      = npx convex deploy → fetch-static-data → generate-rss-feed → generate-sitemap → vite build
```

On Vercel, `vercel.json` sets `buildCommand` to `npm run build:i18n && npm run build`.

### 12.2 Deployment

- **Platform**: Vercel (frontend) + Convex Cloud (backend)
- **Configuration**: `vercel.json` with SPA rewrites, security headers and CSP
- Content changes reach the public site through a redeploy triggered by the admin "Publish" button (Vercel deploy hook). There is no scheduled rebuild.

### 12.3 Scripts

| Command                | Description                    |
| ---------------------- | ------------------------------ |
| `npm run dev`          | Vite + Convex dev              |
| `npm run build`        | Production build               |
| `npm run preview`      | Preview production build       |
| `npm run check`        | TypeScript type check          |
| `npm run format`       | Prettier formatting            |
| `npm run generate:rss` | Generate RSS feed              |
| `npm test`             | Run the Vitest suite           |
| `npm run mutation:diff`| Mutation testing (Stryker)     |

### 12.4 CLI (`create-rubrica`)

- `rubrica create <name>` — new project with a chosen layout and palette
- `rubrica config` — reconfigure identity (name, URL, SEO, RSS), appearance (palette, font), layout and plugins
- `rubrica setup` — sets the Convex env vars, creates the root user and seeds initial content
- `rubrica update` — brings template updates into an existing project with a 3-way merge that preserves the user's customizations (see `docs/atualizacao.md`)

---

## 13. Future Enhancements

| Feature                                    | Status |
| ------------------------------------------ | ------ |
| Light palettes / 4-color theme contract    | Done (Editorial Cream and Paper Noir are light palettes) |
| High-contrast mode                         | Planned |
| Analytics                                  | Partial — Vercel Analytics + optional Umami events; no in-app analytics dashboard |
| Additional SEO optimizations               | Partial — per-page meta, RSS and sitemap done |
| Automated testing                          | Done — Vitest suites for template and CLI, GitHub Actions CI |
| PWA (Progressive Web App)                  | Planned |
| Notifications on proposal acceptance       | Partial — Telegram done; email planned |
| Proposal acceptance statistics dashboard   | Partial — dashboard shows total/accepted/pending counts |
| Image storage                              | Done — media library on Convex Storage |
| Payments (PIX, boleto, card)               | Done — Asaas API, hosted card page, webhook confirmation |

---

## 14. License

**GNU General Public License v3.0**

---

_Developed with ❤️ by Matheus Mierzwa_
