# Updating your Rubrica

Rubrica was made to be customized. Updating can't undo that: colors, CSS, edited pages, text and identity stay as you left them. This guide explains how to update and what happens to each thing.

## Before you start

1. **Commit everything.** That way, if something doesn't go as expected, `git reset --hard` takes you back to the previous state.
2. **Read the release notes** in [Releases](https://github.com/MierzwaMatheus/rubrica/releases). They tell you if there is anything to do in Convex or in the environment variables.

## Project created with the CLI (`create-rubrica`)

Inside the project folder:

```bash
# 1. See what would change, without writing anything
npx create-rubrica@latest update --dry-run

# 2. Apply it
npx create-rubrica@latest update
```

The CLI shows a summary and asks for confirmation before writing. Options:

| Option | What it's for |
|---|---|
| `--dry-run` | Only shows the plan. Nothing is written. |
| `--to <versão>` | Updates to a specific version instead of the latest one. |
| `--from <versão>` | Tells which version the project was created with (see below). |
| `--yes` | Applies without asking (useful in scripts). |

### How it keeps your changes

The update compares three versions of each file:

- **base**: the version your project came from, built with the same choices you made in `create` (layout, theme, fonts, plugins, identity);
- **new**: the new version, built with the same choices;
- **yours**: the file as it is in your project today.

From there:

| Situation | What happens |
|---|---|
| You didn't touch the file | It gets the new version. |
| You changed it and Rubrica didn't change the file | It stays as it is. |
| You and Rubrica changed different parts | Both changes are merged. E.g. you changed the primary color in `src/index.css` and Rubrica added a new rule at the end: the file keeps your color **and** the new rule. |
| You and Rubrica changed the same part | **Your file stays intact.** The new version is saved next to it as `<arquivo>.rubrica-new`, so you can compare and bring over what you want. |
| New file in Rubrica | It is added. |
| File removed in Rubrica | It goes away if you hadn't touched it; it stays if you had. |
| File you deleted | It stays deleted. If Rubrica changed it, the new version goes to `.rubrica-new`. |
| Files that only exist in your project | Never touched. |

Never touched, in any situation: `.env*`, `rubrica.json` and the content generated from your database at build time (`public/data/`, `public/rss.xml`, `public/sitemap.xml`). Lockfiles changed on both sides stay as they are; `pnpm install` sorts them out.

### `.rubrica-new` files

For each one:

1. Compare it with your file (`git diff --no-index src/pages/Home.tsx src/pages/Home.tsx.rubrica-new`, or in your editor).
2. Bring into your file whatever makes sense from the new version.
3. Delete the `.rubrica-new`.

### Projects created with the CLI up to v0.3.18

Up to v0.3.18, the CLI always wrote `"version": "0.1.0"` to `rubrica.json`, whatever version was downloaded. In those projects, the update asks which version the project was created with. Compare the date you created the project with the dates in [Releases](https://github.com/MierzwaMatheus/rubrica/releases). You can also pass it directly: `npx create-rubrica@latest update --from 0.3.12`.

If you don't know the exact version, pick the closest one: in the worst case, more files show up as `.rubrica-new` for review, and none of yours is overwritten.

## Project created by fork

If you forked the repository, git itself does the same three-way merge:

```bash
# only once
git remote add upstream https://github.com/MierzwaMatheus/rubrica.git

# on every update
git fetch upstream --tags
git merge vX.Y.Z           # the tag of the version you want
```

Where you and Rubrica changed the same part, git marks the conflict in the file. Resolve it, run `pnpm check` and `pnpm test`, and commit the merge.

## After updating

1. **Dependencies:** `pnpm install`, if `package.json` changed.
2. **Backend:** if anything in `convex/` changed, publish to the development Convex first (`npx convex dev --once`), test with `pnpm dev`, and only then to production (`npx convex deploy`, or the Vercel deploy, which already runs `convex deploy` during the build).
3. **Check the site** with `pnpm dev` before publishing.

## What never changes in an update

- **Admin content and settings.** Text, colors and identity saved through the panel, posts, projects and testimonials live in your Convex database. The update changes files, not the database.
- **Seeds.** Running `rubrica setup` or the seeds again only creates what is missing; it doesn't overwrite what you customized.
- **Schema.** Within the same major version (1.x), new database fields are always optional: your data stays valid. A change that requires migrating data only comes in a new major version, with a migration guide in the release notes.
