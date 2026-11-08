# Migrating from v1

This guide takes a site built with Rubrica v1 to v2. The `migrar` command does most of the work and **does not write to any database**: what goes into Convex is imported by you, first into a brand new development database.

## What changes from v1 to v2

- The project stops being a copy of the template: it now **depends on** `@rubrica/core` and a theme (`@rubrica/theme-<name>`). Updating becomes bumping a package version.
- The public site is **Astro**, in static HTML (before, a Vite SPA).
- The 13 layouts become **themes** (your layout has an equivalent theme with the same name; v2 adds `padrao`).
- The fixed pages become **pages of blocks**, editable in the panel.
- The project's `convex/` becomes one-line files that re-export the core's backend.
- Languages become a configurable list (v1 had fixed Portuguese and English).
- The `rubrica` skill's Python script goes away; the **local MCP** comes in.

v1 keeps receiving bug and security fixes for **6 months** after v2 launches.

## Before you start

1. The project must be on the **last v1 (1.13.1)**. If it isn't: `npx create-rubrica@1 update` and commit.
2. `git status` with no pending changes. The migration runs on a new branch, so your current branch doesn't change.
3. Node 22.23 or newer.
4. Note the address of the live site: you will use it to compare later.

## Step by step

### 1. See what will happen (writes nothing)

```bash
npx create-rubrica@latest migrar --relatorio
```

It shows the theme equivalent to your layout and the list of your project's **customizations** (files that differ from the reference v1), each with a suggested destination. To also see what the data turns into, pass the export from step 2 with `--export`.

### 2. Export the v1 data

Run it in the project folder, **with `.env.local` still pointing to the v1 database**:

```bash
npx convex export --path .rubrica/migracao/export-v1.zip
```

The export is read-only: it doesn't change the v1 database.

### 3. Migrate

```bash
npx create-rubrica@latest migrar --export .rubrica/migracao/export-v1.zip
```

The command shows the plan and asks for confirmation. Then it:

1. creates the **`rubrica-v2`** branch;
2. compares with the reference v1 and lists the customizations;
3. swaps the code: the template goes, `@rubrica/core` and the theme come in, along with `astro.config.ts`, the generated `convex/`, `AGENTS.md` and `.mcp.json`;
4. converts the export into a v2 import file (`.rubrica/migracao/import-v2.zip`), plus the data as fixtures;
5. installs and builds **without a database**, with the converted data;
6. writes the report to **`.rubrica/migracao/relatorio.md`**.

Convex is not touched.

### 4. Read the report

In order, it has: the chosen theme; the pages built and the blocks left out (and why); the converted texts and plugins; what stayed **pending** (kept in `pendentes-v1.zip`); what was **discarded**; the project's own tables that were not converted; the customizations with a suggestion for each; and the next steps.

### 5. Import into a NEW development Convex

Never import straight into the v1 database or into production. Create a new, empty development database for v2:

```bash
npx convex dev --configure new --once     # .env.local now points to the new one; the v1 database stays intact
cat .env.local | grep CONVEX_DEPLOYMENT   # check where it goes
npx convex import .rubrica/migracao/import-v2.zip
npx create-rubrica setup                  # login keys and variables (the root and pages came with the import)
```

Open the site (`pnpm dev` and `pnpm dev:convex`), sign in to the panel with the **same email and password as v1** and check the pages.

### 6. Handle the customizations

For each file in the report list, follow the suggestion:

| Suggestion | When | What to do |
|---|---|---|
| **Tokens** | It was just color, font or spacing | Adjust in the panel's Appearance screen; no code |
| **Own block** | It was a section the catalog doesn't have | Create it in `src/blocks/` with `defineBlock` and a pure React component |
| **Eject** | It was the look of a block the catalog has | `npx create-rubrica ejetar <block>` and redo the change in the copy |

Take the least effort that solves it. See [Themes](./temas.md#own-blocks-and-ejected-components).

### 7. Check

```bash
pnpm check && pnpm test && pnpm build
npx create-rubrica@latest migrar conferir --v1 https://yoursite.com --v2 dist
```

`migrar conferir` compares, on the main pages, the **title**, the **`h1`** and the **text** between the live v1 site (or a v1 `dist` folder) and the v2 build. Differences show up as a list: not all are errors (the new theme may reorder a section), but the SEO title and `h1` should match.

### 8. Analytics, if you used it

`migrar` doesn't read the Vercel variables. If v1 had Umami, turn it on again:

```bash
npx create-rubrica config --analytics https://cloud.umami.is/script.js --analytics-id <id>
```

### 9. Publish, only with your explicit ok

Production only changes when you publish. Do it with the usual care: development checked first, then production.

- **Importing into production wipes what is there.** Agree with whoever looks after the site first, and only with an explicit "ok".
- `publicar` prepares the v2 production Convex and Vercel. Use a **new** production database for v2 and keep the v1 one until you confirm everything is fine.
- Merge the `rubrica-v2` branch once the v2 site is approved.

## What is converted

| From v1 | To v2 |
|---|---|
| Home, about, résumé, portfolio, blog, testimonials | Pages of blocks, built from the theme recipe and filled with the v1 content |
| Section texts (titles, subtitles, buttons) | Block fields, with translation |
| Other site texts | Interface texts |
| Portuguese and English translations | Per-language map: `pt-BR` (main) and `en`, with the same `/en` URLs |
| Posts, projects, services, testimonials, FAQ, day to day, résumé | The same collections, with the same ids |
| Site settings and plugins | v2 settings (`i18n` becomes `translation`) |
| Users and roles | Kept; nobody changes role |
| Contacts | Kept, with consent marked as "before v2" |
| Proposals, versions and acceptances | Kept, with hash and proof of acceptance intact |
| Contract templates, checkouts, AI résumés | Kept, with the Asaas state and ids |
| Images (library) | Kept |

## What is not converted

| What | Why |
|---|---|
| Login sessions | Everybody signs in again |
| Temporary codes and limits (login, submissions) | Reset |
| Proposal sessions | They expire: the client types the password again |
| Contacts in v1's trash | v2 has no contact trash |
| Rejected testimonials | v2 deletes the submission on rejection |
| Video testimonials | v2 only takes text testimonials. They go as they were to `pendentes-v1.zip` |
| The `playground` plugin | It left v2 |
| The project's own tables | Bring them to the v2 `convex/` (schema and functions) and import separately |
| Code customizations | Listed in the report, but you redo them (own block, eject or tokens) |

What isn't converted is never deleted: it either stays in `pendentes-v1.zip` or remains in the v1 database.

## If something goes wrong

- The migration runs on a branch. To give up: `git switch <your-branch>` and `git branch -D rubrica-v2`.
- The v1 database is never changed, unless you import into it yourself (don't).
- Questions or cases the report doesn't explain: open an [issue](https://github.com/MierzwaMatheus/rubrica/issues), without private data.
