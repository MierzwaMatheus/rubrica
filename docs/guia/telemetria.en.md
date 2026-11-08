# CLI telemetry

The Rubrica CLI sends, anonymously, the choices made in its commands: which site type, which theme, which colors, which plugins. That is how we can tell what people use most and where it is worth investing. Nothing that identifies you or your site leaves your computer.

## What is sent

Each command sends one event when it finishes successfully. If it fails or you cancel, nothing is sent.

Every event carries:

- a **random project id**, created the first time and stored in `rubrica.json` (it links the events of the same site: created, configured, published);
- the CLI version and the project's `@rubrica/core` version;
- the operating system (`linux`, `darwin`, `win32`), the Node major version and the package manager (`pnpm` or `npm`).

And more, depending on the command:

| Command | What is sent |
|---|---|
| `create` | Site type, theme, color scheme, mode, how many languages and the plugins chosen |
| `setup` | Whether it came from `create`, whether it created the `root` and which integrations were turned on (Telegram, email, OpenRouter, Asaas, deploy hook), names only |
| `publicar` | Whether it was the first publication or a republication |
| `update` | From which version to which, how many data migrations and how many ejected components had their original changed |
| `config` | Which fields changed (field names, never identity values) and the theme |
| `ejetar` | Which block and whether the original came from the theme or the core |
| `migrar` | The v1 layout, the theme, whether there was data, how many customizations and whether the build passed |

## What is not sent

Name, email, site address, folder name, texts, posts, passwords, integration keys and tokens, panel content and IP address. Of the identity, only that the field changed is sent, never what you wrote. The collector stores the day the event arrived, without the time.

## How to turn it off

| Way | Applies to |
|---|---|
| `npx create-rubrica telemetria desligar` | This project, for good (stored in `rubrica.json`). To turn it back on: `telemetria ligar` |
| `npx create-rubrica@latest <folder> --sem-telemetria` | The new project is born with telemetry off |
| `--sem-telemetria` on any other command | That run only |
| `RUBRICA_TELEMETRIA=0` | Any command, while the variable exists |
| `DO_NOT_TRACK=1` | The same, following the [Console Do Not Track](https://consoledonottrack.com) standard |

In CI (the `CI` variable set) the CLI never sends anything. `npx create-rubrica telemetria`, with nothing else, shows whether it is on and why.

The first time in each project, the CLI notes that telemetry exists and how to turn it off.

## How it works

Sending takes at most 2 seconds. With no internet, or with the collector down, the command carries on as normal and nothing shows on screen. The code that builds and sends the events is open: [`packages/create-rubrica/src/telemetry.ts`](https://github.com/MierzwaMatheus/rubrica/blob/v2/packages/create-rubrica/src/telemetry.ts).
