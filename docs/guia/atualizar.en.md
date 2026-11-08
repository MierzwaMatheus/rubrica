# Updating Rubrica

In v2, updating is **bumping a package version**. Your project has no copy of the template, so there are no files to merge and no conflicts: the site comes from `@rubrica/core` and the theme, and what is yours (configuration, own blocks, ejected components) stays as it is.

## What is yours and what is the package's

| | Whose | What `update` does |
|---|---|---|
| `@rubrica/core` and `@rubrica/theme-<name>` | The package's | Bumps the version |
| `convex/rubrica/*.ts`, `convex/auth.ts`, `convex/http.ts`, `convex/crons.ts` | Generated (one line each) | Regenerates |
| `astro.config.ts` | Yours, with CLI sections between `rubrica:` markers | Doesn't touch |
| `src/blocks/` | Yours | Doesn't touch |
| `src/overrides/` | Yours (ejected components) | Doesn't touch, **but warns** if the original changed |
| Tables and functions in your `convex/` | Yours | Doesn't touch |
| `AGENTS.md`, `README.md` | Yours | Doesn't touch |

## Step by step

1. **Clean starting point.** `git status` with no changes. That is what lets you go back.
2. **See the plan**, writing nothing:

   ```bash
   npx create-rubrica@latest update --dry-run
   ```

   It shows the core and theme versions, the `convex/` files that change, the **data migrations** the version asks for and the **ejected components** whose original changed. Also read the [release notes](https://github.com/MierzwaMatheus/rubrica/releases).
3. **Apply:**

   ```bash
   npx create-rubrica@latest update --yes
   ```

   It bumps the packages, installs, regenerates `convex/` and runs the data migrations on the **development** Convex (it says which one first).
4. **Ejected ones.** For each component `update` listed, compare the copy in `src/overrides/` with the new original (the path is in the list) and bring over what the new version fixes, keeping your customization.
5. **Backend and production.** The data migrations run on development. On production, run the same ones after publishing the backend, with the OK of whoever looks after the site: `npx convex run --prod <function>`.
6. **Check:** `pnpm check`, `pnpm test` and `pnpm build`.
7. **Commit:** `chore: update Rubrica to vX.Y.Z`.
8. **Live site.** Production only changes when you publish (`npx create-rubrica publicar`, or the merge into the branch tied to Vercel). Pass along what the notes ask: migrations and new variables.

## Versions

The core and each theme have **independent** versions, and the theme declares the block contract it uses (`contract: ^1`). In practice:

- A **new block** is a minor version: every theme gets its default version.
- **Changing or removing a field** is a major version and always comes with a data migration.
- SEO, accessibility and language fixes ship in the core and apply to every theme.

To pin a version, use `--para <version>`.

## Several installations (agencies)

Each client has their own installation (repository, Convex and Vercel), and `update` handles **one project at a time**. To open the update on all of them without doing it by hand, use a dependency bot on each client's repository:

**Renovate** (`renovate.json` at the root):

```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": ["config:recommended"],
  "packageRules": [
    {
      "matchPackageNames": ["/^@rubrica//", "create-rubrica"],
      "groupName": "rubrica",
      "commitMessagePrefix": "chore:"
    }
  ]
}
```

**Dependabot** (`.github/dependabot.yml`):

```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule: { interval: weekly }
    groups:
      rubrica:
        patterns: ["@rubrica/*", "create-rubrica"]
```

The bot opens the PR with the new packages. On each PR, run `npx create-rubrica update --dry-run` to see what else the version asks for (the generated `convex/` and migrations) and `npx create-rubrica update --yes` to complete it, before merging. `pnpm test` (which runs `verificar`) fails if `convex/` fell behind, so CI catches the slip.

## Going back

Since everything is in git, going back is undoing the commit (or the PR). If a data migration already ran, read in the version notes how to undo it before reverting the code.
