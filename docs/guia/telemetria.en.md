# CLI telemetry

The Rubrica CLI anonymously sends the choices made in its commands: which layout, which colors, which plugins. That's how we learn what people use the most and where it's worth investing. Nothing that identifies you or your site leaves your computer.

## What is sent

Each command sends one event when it finishes successfully. If it fails or you cancel, nothing is sent.

Every event carries:

- a **random project id**, created the first time and stored in `rubrica.json` (it links events from the same site: created, set up, published);
- the CLI version and the project's Rubrica version;
- the operating system (`linux`, `darwin`, `win32`), the Node major version and the package manager (`pnpm` or `npm`).

Plus, depending on the command:

| Command | What is sent |
|---|---|
| `create` | Whether it came from the site or from the questions, quick or custom mode, layout, color scheme, light/dark mode, toggle, texture, fonts, plugin bundle and the chosen plugins |
| `setup` | Whether it came from `create`, whether it created the admin and which integrations were turned on (Telegram, OpenRouter, Asaas, Vercel), yes or no only |
| `publicar` | Whether it was the first publish, a republish or another computer relinking the site |
| `update` | From which version to which, how many files changed and how many ended up in conflict |
| `config` | Which parts changed (identity, appearance, layout, plugins) and the new appearance, layout and plugin values |

## What is not sent

Name, email, site address, folder name, texts, posts, passwords, integration keys and tokens, panel content and IP address. For identity, only the fact that it changed is sent, never what you wrote. The collector stores the day the event arrived, without the time.

## How to turn it off

| How | Applies to |
|---|---|
| `npx create-rubrica telemetria desligar` | This project, for good (stored in `rubrica.json`). To turn it back on: `telemetria ligar` |
| `npx create-rubrica@latest <folder> --sem-telemetria` | The new project starts with telemetry off |
| `--sem-telemetria` on any other command | That run only |
| `RUBRICA_TELEMETRIA=0` | Any command, while the variable is set |
| `DO_NOT_TRACK=1` | The same, following the [Console Do Not Track](https://consoledonottrack.com) convention |

In CI (`CI` variable set) the CLI never sends anything. `npx create-rubrica telemetria` with nothing else shows whether it's on and why.

The first time in each project, the CLI tells you telemetry exists and how to turn it off.

## How it works

Sending takes at most 2 seconds. Without internet, or with the collector down, the command carries on and nothing shows up on screen. The code that builds and sends the events is open: [`cli/src/telemetry.ts`](https://github.com/MierzwaMatheus/rubrica/blob/main/cli/src/telemetry.ts).
