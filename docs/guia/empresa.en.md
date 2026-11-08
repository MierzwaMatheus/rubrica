# Company site

Rubrica has two lines: **personal**, for one person's portfolio, and **company**, for a business website. The company line was designed for **agencies and freelancers** who build and maintain a client's site: whoever builds it handles the technical side, and the client only uses the panel.

The core, the themes, the panel and publishing are the same in both. What changes are the pages that come ready, a few blocks and plugins, and the details of who owns the site.

## Creating a company site

```bash
npx create-rubrica@latest my-site --tipo empresa
```

Or run it without `--tipo` and pick **Empresa** (company) when the CLI asks for the site type. In the [site builder](https://userubrica.vercel.app/en/#combinador) you can see any theme with a company's sample content.

An existing site can also switch type with `npx create-rubrica config --tipo empresa`. The pages you already have stay; blocks that belong only to the personal type (such as the résumé) stop showing.

## What changes from the personal line

| | Personal | Company |
|---|---|---|
| Pages that come ready | Home, About, Résumé, Portfolio, Blog, Testimonials | Home, About us, Services, Pricing, Case studies, Blog, Contact |
| Blocks only in this type | Résumé | Pricing, Team, Location, Client logos |
| Plugins only in this type | Résumé, Day to day, AI résumé per job | Pricing and plans, Team |
| Who owns the site | A **person** (name, role, photo) | A **company** (legal name, tax ID, address, opening hours) |
| For Google | Person data (`Person`) | Company data (`Organization` or `LocalBusiness`) |

Both types also have the **Privacy** page, which Rubrica generates from the site details and the plugins that are on. All pages are ordinary pages: you can edit them, reorder the blocks, delete them or create others in the panel. See [Content and panel](./conteudo.md).

## The ready-made pages

The pages come built with blocks and sample text, for you to replace with the client's. The exact layout depends on the theme (a theme can bring its own); in the default theme, it is:

| Page | Blocks |
|---|---|
| Home | Opening, services, numbers, case studies, testimonials and a call to contact |
| About us | The company story, numbers, values and the team |
| Services | Services, frequently asked questions and a call to request a proposal |
| Pricing | Plans and questions about the plans |
| Case studies | The projects, each with its own case study page |
| Blog | The posts, with a tag filter |
| Contact | The contact assistant and the location (address, hours and map) |

## Company blocks

| Block | What for |
|---|---|
| Pricing (`precos`) | The plans side by side, with a highlight and each plan's button |
| Team (`equipe`) | The company's people, with photo, role and social links |
| Location (`localizacao`) | Address, hours and map, taken from the company details |
| Client logos (`logos-clientes`) | A strip with the logos of clients or partners |

## Plans, team and company details

- **Plans** (**Planos** screen, Pricing and plans plugin): name, price, period, included items, highlight and a button. The button can lead to checkout (with the Payments plugin), to the contact assistant or to a link.
- **Team** (**Equipe** screen, Team plugin): name, role, a short bio, photo and links.
- **Company details** (**Configurações** screen, **Empresa** section): legal name, tax ID (CNPJ), email, phone, WhatsApp, address, opening hours, map link and the type of business. These details show in the footer, in the location block and in the privacy policy, and become the information Google reads about the company.

## Roles: agency and client

The panel shows each person only what their role can change. On a company site, the usual setup is:

| Role | Usually | What they do |
|---|---|---|
| `root` | The agency or freelancer | Everything, including users, the activity log and the technical settings (site type, address, languages, theme) |
| `admin` | The business owner | All content, contacts, proposals and settings, without touching the agency's part |
| `content-editor` and `blog-editor` | Whoever looks after the site or writes | Pages, collections and media, or just the blog |
| `comercial` | Customer service and sales | Proposals, contracts, checkouts, contacts and plans |
| `proposal-editor` | Someone who only writes proposals | Proposals only |

The first user, created in `setup`, is `root`. You create the others on the **Usuários** (Users) screen. The full list is in [Content and panel](./conteudo.md#roles).

## The client's accounts

The site uses accounts on **Vercel** (where the site is hosted) and **Convex** (the database), and sometimes on services like Asaas, OpenRouter or Resend. Rubrica does not choose for you whose name they are in. The two most common ways:

- **Accounts in the client's name**, with the agency invited as a member. The client pays and owns everything from the start; if the partnership ends, you just remove the agency from the accounts.
- **Accounts owned by the agency**, transferred to the client if they leave. Simpler at first, but leaving takes more work.

Either way, agree with the client on:

- **who pays** for Vercel and Convex (the free plans are usually enough to start);
- **who is the panel's `root`**: if the agency leaves, the client needs a `root` of their own;
- **which keys to change when leaving**: the agency's `root` password, the Convex deploy key used by Vercel and the keys of the connected services (Asaas, OpenRouter, Telegram, Resend). The variables are in [Environment variables](./variaveis.md).
