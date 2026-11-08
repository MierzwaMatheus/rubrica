# CLI commands

`create-rubrica` creates, configures, publishes, updates and migrates the site. Inside a project, the same CLI answers as `rubrica`: `npx rubrica <command>` is the same as `npx create-rubrica <command>`. It needs Node 22.23 or newer and `git`. The CLI messages and option names are in Brazilian Portuguese.

```bash
npx create-rubrica@latest <command> [options]
npx create-rubrica --help       # lists the commands
npx create-rubrica --version
```

Run the commands in the project folder (except `create`). When a command needs an answer and there is no interactive terminal, use the options or `--yes`. In **any** command, `--sem-telemetria` turns [telemetry](./telemetria.md) off for that run only.

| Command | What for |
|---|---|
| [`create`](#create) | Creates a new site |
| [`setup`](#setup) | Connects Convex, creates the login and the initial content |
| [`config`](#config) | Changes identity, type, theme, colors, languages, plugins or analytics |
| [`publicar`](#publicar) | Puts the site online on Vercel |
| [`senha`](#senha) | Changes the panel password |
| [`update`](#update) | Updates the core and the theme |
| [`ejetar`](#ejetar) | Copies a block's component into the project |
| [`verificar`](#verificar) | Checks the project (the `pnpm test`) |
| [`testar-tema`](#testar-tema) | A theme's test battery |
| [`mcp`](#mcp) | Local MCP server for agents |
| [`migrar`](#migrar) | Takes a project from v1 to v2 |
| [`telemetria`](#telemetria) | Shows, turns on or off telemetry |

## create

```bash
npx create-rubrica@latest [create] <folder> [options]
```

Generates the project: `@rubrica/core` and the theme, `astro.config.ts`, the re-exporting `convex/`, the hosting files (`vercel.json`, `public/_redirects`, `public/_headers`), `AGENTS.md` and `.mcp.json`. It installs the dependencies, starts git and offers to run `setup`. The folder must be empty or not exist. Without options, it asks for what is missing.

| Option | Value |
|---|---|
| `--tipo` | `pessoal` (personal, default) or `empresa` (company) |
| `--tema <id>` | `padrao`, `cyberpunk`, `brutalist`, `swiss`, `bento`, `magazine`, `desktop`, `index`, `monograph`, `zine`, `blueprint`, `garden`, `chat` or `poster` |
| `--nome <text>` | Site or company name |
| `--url <address>` | Site address (`mysite.com`) |
| `--descricao <text>` | Short description (SEO) |
| `--autor <name>` | Site owner (personal) or contact (company) |
| `--email <email>` | Panel login and contact email |
| `--idiomas <list>` | Languages, comma separated (default `pt-BR`) |
| `--idioma-principal <code>` | Language with no URL prefix (default: the first) |
| `--esquema <id>` | Color scheme (see [Themes](./temas.md#color-schemes)) |
| `--modo` | `escuro` (dark), `claro` (light) or `automatico` |
| `--plugins <list>` | Comma separated plugins, or a pack: `recommended`, `freelancer` or `simple` (the last two only for the personal type) |
| `--gerenciador` | `pnpm` or `npm` (default: whichever ran the command) |
| `--local <folder>` | Uses the packages of a monorepo clone (`link:`), to test unpublished versions |
| `--sem-instalar` | Does not install dependencies |
| `--sem-git` | Does not run `git init` |
| `--sem-setup` | Does not offer `setup` at the end |
| `-y`, `--yes` | Asks nothing: uses the options and the defaults |

## setup

```bash
npx create-rubrica setup
```

Interactive; **you run it**, because it asks for the password and keys. It connects the project to the development Convex, writes the login keys and backend variables, creates the `root` user (the password is typed there and never goes through an agent), builds the initial content from the theme recipe and asks about the integrations (Telegram, email, OpenRouter, Asaas, deploy hook). It is safe to run again: it only completes what is missing.

## config

```bash
npx create-rubrica config [options]
```

With no options and in a terminal, it asks what to change. With options, it changes directly:

| Option | What changes |
|---|---|
| `--nome`, `--url`, `--descricao`, `--autor`, `--email` | Identity |
| `--tipo pessoal\|empresa` | Site type (existing pages stay; blocks exclusive to the other type stop appearing) |
| `--tema <id>` | Theme (swaps the package, installs and updates `astro.config.ts`) |
| `--esquema <id>`, `--modo escuro\|claro\|automatico` | Colors |
| `--idiomas <list>`, `--idioma-principal <code>` | Languages ([Languages](./idiomas.md)) |
| `--plugins <list>` | Turns plugins on and off: `+blog,-resume`. Without a sign, turns on |
| `--analytics <script>`, `--analytics-id <id>` | Turns Umami on and allows the origin in the CSP. `--analytics desligar` turns it off |
| `--producao` | Also writes to the **production** Convex (asks for confirmation) |
| `--sem-instalar` | Does not run the install when switching theme |
| `-y`, `--yes` | Does not ask |

Changes go to `rubrica.json`, to the code (when needed) and to the **development** Convex. The published site only changes with `--producao` and a new `publicar`.

## publicar

```bash
npx create-rubrica publicar
```

**You run it, when you want to**: it publishes to **production**. The first time, it creates the Vercel project and the production database; afterwards, it just publishes again. Step by step in [Publishing the site](./publicar.md).

## senha

```bash
npx create-rubrica senha
```

Changes the panel password (forgotten, or the login got blocked). It asks whether it is on the published site or on your computer's. **You always run it**: the password never goes through an agent.

## update

```bash
npx create-rubrica@latest update [--dry-run] [--yes] [--para <version>] [--forcar]
```

| Option | What it does |
|---|---|
| `--dry-run` | Shows the plan without writing anything |
| `-y`, `--yes` | Applies without asking for confirmation |
| `--para <version>` | Updates to a specific core version |
| `--forcar` | Proceeds even with uncommitted changes in git |

Bumps `@rubrica/core` and the theme, regenerates `convex/`, runs the version's data migrations on development and warns about ejected components whose original changed. See [Updating Rubrica](./atualizar.md).

## ejetar

```bash
npx create-rubrica ejetar <block> [--forcar]
npx create-rubrica ejetar --listar
```

Copies the block component (from the theme, or the core) into `src/overrides/` and starts using the copy. `--forcar` copies again over the top; `--listar` shows what has been ejected and whether the original changed. With no argument, it lists the available blocks.

## verificar

```bash
npx create-rubrica verificar
```

It is the project's `pnpm test`. It checks that the generated `convex/` matches the installed core, that the theme in `rubrica.json` is installed and in `astro.config.ts`, that the `rubrica:` markers in `astro.config.ts` are in place and that the ejected files exist. It exits with an error if something is off.

## testar-tema

```bash
npx create-rubrica testar-tema [theme] [options]
```

The theme test battery (`@rubrica/theme-tester`): axe, SEO, JavaScript per page and Lighthouse, over the demo sites. In the monorepo: `pnpm testar-tema <theme>`.

| Option | What it does |
|---|---|
| `--todos` | All themes in `packages/themes/*` |
| `--listar` | Lists the monorepo's themes |
| `--site pessoal\|empresa` | Tests only one site type |
| `--sem-lighthouse` | Skips Lighthouse |
| `--so-lighthouse` | Runs only Lighthouse |
| `--js-kb <n>` | JavaScript limit (gzip) per page with an island (default 120) |
| `--lh-performance <n>`, `--lh-acessibilidade <n>`, `--lh-seo <n>` | Minimum scores (default 90, 95 and 95) |
| `--lh-execucoes <n>` | Maximum Lighthouse runs per page (default 3) |
| `--json <file>` | Writes the report as JSON |
| `--verbose` | Also shows the checks that passed |
| `--manter-dist` | Keeps the build folder |
| `--raiz <folder>` | Monorepo root |

Exit code: `0` if everything passed, `1` if something failed, `2` for a usage error.

## mcp

```bash
npx rubrica mcp                 # starts the server (.mcp.json does this)
npx rubrica mcp login           # terminal login (also: --email, --producao, --senha-stdin)
npx rubrica mcp whoami          # project, database, account and role
npx rubrica mcp logout
npx rubrica mcp --producao      # server pointing to the production Convex
```

See [AI agents](./agentes.md). No banner: `stdout` is the protocol.

## migrar

```bash
npx create-rubrica@latest migrar [--export <zip>] [--yes]
npx create-rubrica@latest migrar --relatorio [--export <zip>] [--saida <file>]
npx create-rubrica@latest migrar dados --export <zip> [--saida <folder>]
npx create-rubrica@latest migrar conferir --v1 <url|folder> [--v2 <dist folder>]
```

| Form | What it does |
|---|---|
| `migrar` | Creates the `rubrica-v2` branch, swaps the code, converts the data (with `--export`), builds and writes the report |
| `migrar --relatorio` | Only shows: theme, customizations and (with `--export`) what the data turns into. Writes nothing |
| `migrar dados` | Only the data conversion (import file, pending items, fixtures and report) |
| `migrar conferir` | Compares title, `h1` and text of the main pages between v1 and v2 |

Other options: `--template-v1 <folder>` (uses a repository clone as the reference v1, with no internet), `--convex-url <address>` (Convex image address), `--local <folder>` (monorepo packages), `--sem-instalar` and `--sem-build`. Step by step in [Migrating from v1](./migrar.md). The command **does not write to Convex**.

## telemetria

```bash
npx create-rubrica telemetria [ligar|desligar]
```

Without an argument, it shows whether it is on and why. See [Telemetry](./telemetria.md).
