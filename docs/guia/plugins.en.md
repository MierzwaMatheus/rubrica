# Plugins

Each optional part of the site is a **plugin**: the blog, the résumé, proposals, payments and so on. You turn on only what you will use. When a plugin is off, it disappears from the site (its blocks stop showing) and from the panel menu. **Turning it off deletes nothing**: what you added stays saved and comes back when you turn it on again.

Each site type starts with a ready-made selection, which you can change at any time.

## Turning plugins on and off

- **In the panel:** the **Plugins** screen. Anyone with the `root` or `admin` role turns them on and off with one click. The screen also shows when a plugin needs another one.
- **In the terminal:** `npx create-rubrica config --plugins +blog,-resume` turns the blog on and the résumé off (no sign means on). This changes the site on your computer; to change the live site too, add `--producao`. See [CLI commands](./cli.md#config).
- **When creating the site:** `create` asks which plugins you want, or takes the list in `--plugins`. See [Getting started](./comecando.md).

Remember that the live site only changes at the next build: after turning a plugin on or off, click **Publicar** (Publish) in the panel.

## The plugins

In the table, "on" and "off" say how the plugin starts in each site type. A dash means the plugin does not exist in that type. The name in backticks is what goes in `--plugins`.

| Plugin | What it does | Personal | Company |
|---|---|---|---|
| Contact assistant (`contact-wizard`) | Step-by-step contact form. Requests arrive on the **Contatos** (Contacts) screen and, if you want, also on Telegram, by email or to a webhook | on | on |
| Proposals (`proposals`) | Sales proposals with versions, a password and e-signature. Each proposal has its own address to send to the client | on | on |
| Contract templates (`contract-templates`) | Contract templates used in proposals. Needs **Proposals** | on | on |
| Payments (`payments`) | Checkout with PIX, boleto and card through Asaas. Needs the Asaas key | on | on |
| Blog (`blog`) | Posts with SEO, translation and an RSS feed | on | on |
| Projects and case studies (`portfolio`) | Projects, each with its own case study page | on | on |
| Résumé (`resume`) | Experience, education and skills, with a PDF to download | on | — |
| Day to day (`about`) | Gallery of day-to-day photos on the About page | on | — |
| Testimonials (`testimonials`) | Testimonials on the site, added in the panel | on | on |
| Testimonial submission (`testimonials-intake`) | Visitors can send a testimonial. It comes in as pending and only shows after you approve it. Needs **Testimonials** | on | off |
| Pricing and plans (`pricing`) | Plans with a price, included items and a button (to checkout, to the contact form or to a link) | — | on |
| Team (`team`) | The company's people, with photo, role and social links | — | on |
| AI résumé per job (`ai-resumes`) | Generates a résumé tailored to a job opening. Needs **Résumé** and the OpenRouter key. Only `root` sees this screen | off | — |
| AI translation (`translation`) | A "translate" button on fields that have versions in other languages. Needs the OpenRouter key. Without it, you translate by hand or with an agent | off | off |
| Analytics (`analytics`) | Adds the Umami script to the pages, to count visits without cookies | off | off |
| Activity log (`audit-log`) | History of what was done in the panel, and by whom. Only `root` sees it | on | on |
| Media library (`media-manager`) | Organizes images in folders, with the details of each one | on | on |

Plugins that depend on an outside service (Asaas, OpenRouter, Umami) only work once the key is set up. How to do that is in [Integrations](./integracoes.md).

## What disappears when a plugin is turned off

- **Listing pages.** The blog page (`/blog`), the projects page (`/portfolio` on a personal site, `/cases` on a company site, or the base you set in **Settings**), the pricing page (`/precos`) and the résumé page (`/curriculo`) are not generated while the plugin that owns them is off. They also stay out of the sitemap. The RSS feed follows the blog.
- **Menu items.** A navigation item that points to a page that no longer exists is removed from the menu, in every language.
- **Blocks.** A block from a disabled plugin (Posts, Cases, Testimonials, Pricing, Team, Résumé) is not rendered on any page. If the page has other blocks it stays and only the block goes away. A page whose blocks all belonged to disabled plugins is not generated either. The home page is never dropped.
- **Data stays.** The content is still in Convex: turning the plugin back on brings everything back.

Collection blocks with no items (for example Testimonials with none approved) do not leave a lone title either: the block is dropped from the page, unless that would leave the page empty (the `/cases` listing with no projects shows the theme's default empty message). Cases and Testimonials with "Mostrar os destaques" (show highlights) on show only the highlighted items; if none is highlighted, they show the first items of the list.

## Ready-made bundles

When creating a **personal** site, you can pick a bundle instead of ticking plugin by plugin (`--plugins <bundle>`):

| Bundle | What it turns on |
|---|---|
| `recommended` | The default selection for the site type (the "on" column in the table above) |
| `freelancer` | For selling services: contact, proposals, projects, day to day, testimonials, testimonial submission, activity log and media library |
| `simple` | Just the portfolio: contact, projects, résumé and day to day |

On a **company** site, the default is `recommended`. Bundles are only a starting point: afterwards, everything is turned on and off in the panel.

## Create a plugin

**In 2.0 there is no public API for third-party plugins.** Plugins stay in the core, with a single contract, and packaged plugins come later, on top of that same contract (decision 19 of the [RFC](../rfc/v2.md)). The `definePlugin` you see in the code is the **internal** contract: it is for people contributing to the monorepo, and a project's site and panel only read the core's plugins. The step-by-step guide to a core plugin is in [Contributing](../v2/contribuindo.md#adicionar-um-plugin-do-núcleo).

What a project can do today, from the smallest effort to the largest:

- **Turn on and combine the existing plugins**, in the panel or with `config`.
- **Own block**, for a new site section with fields in the panel: [Create a block](./criar-bloco.md). An own block can depend on a core plugin (`plugin: "blog"`) and list one of its collections.
- **Ejected component**, to change the markup of an existing block: [Eject a component](./criar-tema.md#eject-a-component).
- **Your own Convex functions and tables**, to store and read data Rubrica doesn't model (below).

### Your own Convex functions and tables

The project's `convex/` mixes two kinds of file. Those starting with `// Gerado pelo Rubrica` (`convex/rubrica/*`, `auth.ts`, `http.ts` and `crons.ts`) belong to the CLI: `update` rewrites and deletes them. `schema.ts`, `auth.config.ts` and `rubrica.config.ts` are created once by the CLI and never touched again. **Any other file in `convex/` is yours**, and Convex deploys its functions along with the core's.

For a new table, add it to `convex/schema.ts`, after the core's:

<!-- exemplo: projeto/convex/schema.ts -->
```ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";
import { rubricaTables } from "@rubrica/core/convex/schema";

// Login tables, the Rubrica core's and (after them) the project's own.
export default defineSchema({
  ...authTables,
  ...rubricaTables,
  signups: defineTable({
    email: v.string(),
    source: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_email", ["email"]),
});
```

And the functions in a file of your own, outside `convex/rubrica/` (which belongs to the CLI):

<!-- exemplo: projeto/convex/signups.ts -->
```ts
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { can } from "@rubrica/core/convex/roles";
import { internalMutation, query, type QueryCtx } from "./_generated/server";

/** Saves a signup. Internal: runs through `npx convex run`, the Convex dashboard or another function. */
export const add = internalMutation({
  args: { email: v.string(), source: v.optional(v.string()) },
  handler: async (ctx, { email, source }) => {
    const normalized = email.trim().toLowerCase();
    const existing = await ctx.db
      .query("signups")
      .withIndex("by_email", (q) => q.eq("email", normalized))
      .unique();
    if (existing) return existing._id;
    return ctx.db.insert("signups", { email: normalized, source, createdAt: Date.now() });
  },
});

/** Requires a login with a panel role that sees contacts (root, admin or comercial). */
async function requireRole(ctx: QueryCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Log in first");
  const role = await ctx.db
    .query("userRoles")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .unique();
  if (!role || role.suspendedAt || role.mustChangePassword || !can(role.role, "contacts")) {
    throw new Error("Not allowed");
  }
}

/** Lists the signups, for people with the right role. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx);
    return ctx.db.query("signups").order("desc").take(500);
  },
});
```

Deploy to your computer's Convex with `npx convex dev --once` (or keep `pnpm dev:convex` running) and test with `npx convex run signups:add '{"email":"ana@example.com"}'`. Production gets the functions on the next `publicar`.

The limits, today:

- The panel and the MCP don't show your own tables or functions: the data lives in the Convex dashboard and in whatever you build.
- `http.ts` and `crons.ts` are generated, so there is no place yet for your own HTTP routes or scheduled jobs.
- Personal-data export and deletion in the **Privacidade** screen only see the core's tables. If your table holds personal data, exporting and deleting it is on you.
- Public functions (`query`, `mutation`) are open to any Convex client: check the login and the role, as above, or use internal ones.
