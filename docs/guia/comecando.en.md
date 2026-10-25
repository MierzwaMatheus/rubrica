# Getting started

From zero to your portfolio running on your computer, with the admin panel ready to fill in. It takes about 10 minutes, most of it waiting for the install.

## What you need

- **Node.js 20 or newer** and **git**. pnpm is optional: without it, the CLI uses npm.
- A **[Convex](https://convex.dev)** account (free). It holds the database and the images. You don't need to create it first: the CLI opens the login in the browser at the right moment.
- To publish later, a **[Vercel](https://vercel.com)** account (free). See [Publishing the site](./publicar.md).
- Only if you'll use the AI skills: **Python 3.8 or newer**.

Payments (Asaas), AI (OpenRouter) and Telegram notifications are optional. You can turn each one on later.

## 1. Pick the look on the site

In the [builder](https://userubrica.vercel.app/#combinador), try layout, color scheme, light or dark mode, texture and fonts on a working Rubrica with sample data. Then, in the **Crie o seu** (create yours) section, fill in your name, the site address and your email, and copy the ready-made command. Nothing you type leaves the browser: the command is built on the page itself.

Prefer to decide in the terminal? Skip to step 2 without the code: the CLI asks the same questions.

## 2. Create the project

Paste the command into a terminal, in the folder where you want to create the project:

```bash
npx create-rubrica@latest ana-souza --receita <código-do-site>
```

Without the code from the site, just run `npx create-rubrica@latest meu-portfolio` and answer the questions. In **Rápido** (quick) mode, the default, it asks for the layout, what the site will have and your identity; colors, texture and fonts come matched to the layout.

The CLI then:

1. downloads the latest version of Rubrica and applies your choices;
2. starts git on the `main` branch, with a first commit, and installs the dependencies;
3. connects the project to Convex (login in the browser, if it's the first time);
4. generates the login keys, creates your panel user and the initial data.

In the terminal, you only choose the panel password: 12 or more characters, with uppercase, lowercase and a number.

All questions and options are in [CLI commands](./cli.md).

## 3. Open the site

```bash
cd ana-souza
npm run dev        # or pnpm dev
```

The site opens at `http://localhost:3000`. The panel is at `http://localhost:3000/login`, with the email and password you set.

Skipped the panel setup in `create`? Run `npx create-rubrica setup` in the project folder before `npm run dev`.

## 4. Fill in the content

Everything is edited in the panel, without touching the code. The site starts with the sample data of a fictional profile: replace it with yours.

| Panel screen | What you fill in |
|---|---|
| `/admin/contact` | Name, email, phone, photo and social networks |
| `/admin/home` | Introduction, highlight numbers, availability, services and work principles |
| `/admin/projects` | Portfolio projects and case studies |
| `/admin/blog` | Posts |
| `/admin/resume` | Resume |
| `/admin/about` | Routine and FAQ for the About page |
| `/admin/depoimentos` | Testimonials |
| `/admin/site-config` | **Site & Aparência** (site & appearance): identity, SEO, fonts and the colors of each mode |
| `/admin/textos` | The site's fixed texts, in Portuguese and English |
| `/admin/plugins` | Turns parts of the site on and off (blog, proposals, payments…) |

You can also ask your AI agent (Claude Code, Codex or OpenCode): the project comes with the `rubrica` skill, which reads and changes the site's content, and with skills that write the introduction, the case studies, the resume and the posts in your voice. See the "Ou pelo seu agente de IA" section (in Portuguese) of the [README](../../README.md).

## 5. Make it yours

Rubrica handles the technical part. The identity is up to you, and it's what keeps your portfolio from being "just another one":

- **Colors and fonts in the panel:** in **Site & Aparência**, change the 4 main colors of each mode and the fonts. "Usar as cores do esquema" (use the scheme's colors) undoes it.
- **Another layout or scheme:** `npx create-rubrica config` changes layout, scheme, mode, texture and fonts after the project is created. See the [templates](../templates/README.md) and the [color schemes](../templates/cores.md).
- **Favicon:** replace `public/favicon.ico` with yours.
- **In the code:** the color scheme is in `src/index.css`; the layout structure, in `src/components/` and `src/pages/`.

## Next steps

- [Publishing the site](./publicar.md): put it online on Vercel and connect your domain.
- [Updating your Rubrica](../atualizacao.md): get new versions without losing what you customized.
