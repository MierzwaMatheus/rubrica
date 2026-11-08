# Getting started

From zero to your site running on your computer, with the panel ready to fill in. It takes about 10 minutes, most of it waiting for the install. The path is the same for a **personal** site (portfolio) and for a **company** site; only the type you pick at the start changes. What is different on a company site is in [Company site](./empresa.md).

> Already have a site built with Rubrica v1? Don't start over: follow [Migrating from v1](./migrar.md). Staying on v1 for now? Its documentation is on the [`v1` branch on GitHub](https://github.com/MierzwaMatheus/rubrica/tree/v1/docs).

## What you need

- **Node.js 22.23 or newer** and **git**. pnpm is optional: without it, the CLI uses npm.
- A **[Convex](https://convex.dev)** account (free). It is the backend: it stores the content, the login and the images. You don't need to create it beforehand: the CLI opens the login in your browser at the right time.
- To publish later, a **[Vercel](https://vercel.com)** account (free). See [Publishing the site](./publicar.md).

Payments (Asaas), AI translation (OpenRouter), Telegram and email alerts are optional. You can turn each one on later: see [Integrations](./integracoes.md).

## 1. Pick the look on the website

In the [builder](https://userubrica.vercel.app/en/#combinador), try theme, color scheme and light or dark mode on the working demo site. Then, in the **Create yours** section, choose the site type, fill in the name, address and email, and copy the ready command. Nothing you type leaves the browser: the command is built on the page itself.

Prefer to decide in the terminal? Skip to step 2 without the options: the CLI asks the same questions.

## 2. Create the project

Paste the command in a terminal, in the folder where you want the project. It looks like this:

```bash
npx create-rubrica@latest ana-souza --tipo pessoal --tema zine --esquema riso --modo claro
```

Or just run `npx create-rubrica@latest my-site` and answer the questions: site type, theme, name, address, description, email, languages, color scheme, mode and plugins. All the options are in [CLI commands](./cli.md#create). The CLI itself and the panel are in Brazilian Portuguese for now, which is why the option names (`--tipo`, `--tema`) are in Portuguese.

The CLI creates the folder, writes the files, installs the dependencies and starts git. A new project has little code of yours: the site comes from two packages, `@rubrica/core` and the chosen theme (`@rubrica/theme-<name>`).

| File or folder | What it is for |
|---|---|
| `astro.config.ts` | Site configuration. The sections between `rubrica:` markers belong to the CLI |
| `rubrica.json` | Project state (type, theme, languages, plugins). The CLI maintains it: don't edit by hand |
| `convex/` | Backend. The files in `convex/rubrica/` are generated (one line each) |
| `src/blocks/` | Your own blocks, if you create any |
| `src/overrides/` | Ejected components, if you eject any |
| `AGENTS.md`, `.mcp.json` | Instructions and configuration for AI agents |

## 3. Connect Convex and create your login

At the end of `create`, the CLI offers to run `setup` (or run `npx create-rubrica setup` whenever you want). It:

1. opens the Convex login in the browser and creates a **development** deployment;
2. writes the keys and variables the backend needs;
3. asks for the email and password of your panel user, the `root`. **The password is typed there, in the terminal**;
4. builds the initial pages from the theme recipe (home, about, contact and the rest);
5. asks, one by one, about the optional integrations (Telegram, email, OpenRouter, Asaas, Publish button). You can skip them all.

## 4. See the site

Open two terminals in the project folder:

```bash
pnpm dev          # the site, at http://localhost:4321
pnpm dev:convex   # the development backend
```

The panel is at `/admin`: sign in with the email and password from step 3. Fill in the identity, the pages and the content (see [Content and panel](./conteudo.md)). To see the site without any database, `RUBRICA_FIXTURES=<folder with site.json and pages.json> pnpm build`.

## 5. Publish

When you are ready, `npx create-rubrica publicar` puts the site online on Vercel, with a **production** database separate from yours. Details and other hosts in [Publishing the site](./publicar.md).

## Two databases, always

`.env.local` points to the **development** Convex, the one on your computer. The live site uses the **production** one, whose address is under `producao` in `rubrica.json`. Changing the panel on your computer does not change the published site. Commands that publish (`npx convex deploy`, `publicar`) always write to production: only run them when you mean to change the live site.

## Next steps

- [Content and panel](./conteudo.md): pages made of blocks, collections and roles
- [Themes](./temas.md): switch the theme, colors and fonts
- [Languages](./idiomas.md): more than one language
- [AI agents](./agentes.md): edit the content with Claude Code or Codex
