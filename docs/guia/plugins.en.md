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

## Ready-made bundles

When creating a **personal** site, you can pick a bundle instead of ticking plugin by plugin (`--plugins <bundle>`):

| Bundle | What it turns on |
|---|---|
| `recommended` | The default selection for the site type (the "on" column in the table above) |
| `freelancer` | For selling services: contact, proposals, projects, day to day, testimonials, testimonial submission, activity log and media library |
| `simple` | Just the portfolio: contact, projects, résumé and day to day |

On a **company** site, the default is `recommended`. Bundles are only a starting point: afterwards, everything is turned on and off in the panel.
