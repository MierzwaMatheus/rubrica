# AI agents

Rubrica was made to work with agents such as Claude Code and Codex. They don't edit the database "from outside": they use a **local MCP server** that talks to your project's Convex **with the login of a panel user** and shows a **preview before writing**.

## How it works

```
agent (Claude Code, Codex)  ──stdio──▶  rubrica mcp  ──HTTPS──▶  project's Convex
                                         └─ token in ~/.config/rubrica/    (logged-in user's role)
```

- The server runs on **your machine**, starts with the agent and closes with it. There is no hosted server.
- The tools come from the same fields and rules that apply in the panel and the backend.
- The **permissions of the role** of the logged-in user apply. A `blog-editor` account can only touch posts and media, even if the agent asks for something else.
- Every tool that writes starts as a **preview** (`dryRun` on by default): the agent shows the before and after, and only with your "ok" repeats the call to write.

## Set up

A project created by `create-rubrica` already comes with the `.mcp.json` ready (no secrets, safe to commit):

```json
{
  "mcpServers": {
    "rubrica": { "command": "npx", "args": ["rubrica", "mcp"] }
  }
}
```

In Claude Code you can also use `claude mcp add rubrica -- npx rubrica mcp`. In Codex, in `~/.codex/config.toml`:

```toml
[mcp_servers.rubrica]
command = "npx"
args = ["rubrica", "mcp"]
env = { RUBRICA_PROJECT = "/path/to/project" }
```

To talk to the **published** site, add `"--producao"` to the `args`, in a separate server (`rubrica-producao`), so you never mix the two up.

## Login

The login is **yours, in your terminal**. The password is typed there, without echo, and never goes through the agent:

```bash
npx rubrica mcp login               # asks for email and password
npx rubrica mcp login --producao    # the published site's Convex
npx rubrica mcp whoami              # project, database, account and role
npx rubrica mcp logout
```

In Claude Code, you can type `! npx rubrica mcp login` in the prompt itself. The token lives in `~/.config/rubrica/`, outside the repository, one per project and per database (development and production have separate logins), and renews on its own.

**Tip:** for content work, sign in with a `content-editor` or `blog-editor` account. `root` only when needed.

## What the agent can do

| Area | Examples |
|---|---|
| Account and environment | See the project, the database (development or production), the role, the plugins and the block catalog |
| Site | Read and change settings (name, appearance, navigation, social links), turn plugins on and off, **publish** (triggers the build) |
| Pages and blocks | List, create (always as draft), change title, path and SEO; add, edit fields, move, hide and remove blocks |
| Collections | List, read, create (draft), edit, publish and remove posts, projects, services, testimonials, FAQ, résumé, team and plans |
| Proposals | List, read, create and edit commercial proposals (with an optional link password that is never returned in answers), with the proposals plugin on |
| Interface texts | See and customize texts per language |
| Media | List the library and upload images from a local path |
| Contacts | See requests and change the status (with the contact plugin on) |

There are also ready prompts (`montar-pagina`, `traduzir-conteudo`, `revisar-antes-de-publicar`) and read-only resources, like the writing guide and the block catalog.

The complete reference of tools, roles and variables is in [`docs/v2/mcp.md`](https://github.com/MierzwaMatheus/rubrica/blob/main/docs/v2/mcp.md) (in Portuguese).

## Example: change the opening button in both languages

1. The agent reads the page: `pages_get { "page": "/" }` and finds the `hero` block.
2. It calls `block_update_fields` with the texts in `pt-BR` and `en`. A **preview** comes back with the before and after, and warnings (for example, "text filled in `pt-BR` and empty in `en`").
3. You approve. The agent repeats the call with `dryRun: false`.

Writing does not publish: the static site only changes at the next build. The agent only triggers publishing (`site_publish`) when you ask.

## Security

- The server runs as your process, with the user's login and role. In **production**, always read the preview: the content changes immediately in the database.
- The MCP **does not use** `convex dev|deploy|run|import`: only the project's public functions, with the user's role.
- Tokens and passwords never appear in answers, resources or error messages.
- A proposal password is a tool argument (the backend stores only the hash) and goes through the conversation with the agent. If that is a concern, create the proposal without a password and set it in the panel.
- Image upload reads a local file (images only, checked by content). Restrict the agent's file system access if that is a concern.

## Skills: the "how to write"

Skills hold the right way to write each thing and write through the MCP. They live in `.agents/skills/` (with shortcuts in `.claude/skills/`):

| Request | Skill |
|---|---|
| Tone of voice, voice interview, the personal part of About | `rubrica-voz` |
| Presentation, "about me", home phrase, principles | `rubrica-apresentacao` |
| A project case study | `rubrica-case` |
| Résumé | `rubrica-curriculo` |
| A blog post from scratch | `rubrica-blog` |
| Review a text before it goes on the site | `rubrica-pilar` |

## AGENTS.md

The project ships an `AGENTS.md` (and a `CLAUDE.md` that imports it) with the rules for any agent: what is content and what is code, which commands the agent runs and which belong to the person (`setup`, `config`, `publicar`, `senha`), the two databases and the care around anything that writes to production. Once created it is yours: `update` doesn't rewrite it, so adjust it freely.
