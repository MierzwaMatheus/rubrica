# Content and panel

Everything that shows on the site is **content**, stored in Convex and edited in the panel (`/admin`). The project code only changes when you want another look or another behavior.

Two ideas organize the content: **pages made of blocks** and **collections** of repeating items.

## Pages and blocks

A page has an address (`/`, `/about`, `/services`), a title, the SEO (title, description and share image, per language) and an **ordered list of blocks**. Each block is a section: opening, text, numbers, services, testimonials, FAQ, call to action, contact and so on.

In **Pages**, in the panel, you can:

- create a new page and pick its blocks;
- reorder blocks, turn them on and off (a hidden block stays saved, just not shown on the site);
- edit each block's fields in a form, with a **live preview** of the theme beside it, at phone or desktop width;
- save as a **draft** or publish.

The home, about and contact pages are not special: they come built from the theme recipe when the site is created and are edited like any other.

### Block catalog

| Block | What it is for |
|---|---|
| `hero` | Page opening: title, subtitle, buttons and photo. It is the page `h1` |
| `texto` | Title and free text |
| `numeros` | Highlighted numbers |
| `lista-itens` | List with title and description (principles, values, steps) |
| `cases` | Projects or case studies, from the collection |
| `servicos` | Services, from the collection |
| `depoimentos` | Approved testimonials, with submission of new ones |
| `faq` | Frequently asked questions |
| `posts-recentes` | Latest blog posts |
| `cta` | Call to action with two buttons |
| `contato` | Contact assistant, channels and address |
| `galeria` | Image gallery (day to day) |
| `curriculo` | Résumé (personal type only) |
| `precos` | Plans and pricing (company type only) |
| `equipe` | Team members (company type only) |
| `localizacao` | Address and map (company type only) |
| `logos-clientes` | Client logos (company type only) |

A block that lists items points to a collection with a filter, order and quantity, instead of copying the items. Some blocks have named **variants** (for example, `cases` as a grid or a list); the panel shows only the variants of the theme in use.

When Rubrica ships a new block, it shows up in every theme with the core's default version until the theme draws its own. Need a block that doesn't exist? See [Own blocks and ejected components](./temas.md#own-blocks-and-ejected-components).

## Collections

Collections are lists of items with fixed fields, each with its own panel screen:

| Collection | Site type | What it stores |
|---|---|---|
| Posts | both | Blog articles, with cover, tags, SEO and translation |
| Projects and cases | both | Projects, with the case page |
| Services | both | What you or the company offer |
| Testimonials | both | Testimonials, published or pending approval |
| FAQ | both | Questions and answers |
| Résumé and day to day | personal | Experience, education, skills, routine |
| Plans | company | Name, price, period, items, highlight and button |
| Team | company | Photo, name, role, short bio and links |

The company line also has **company data** (legal name, tax id, address, hours, phone, WhatsApp, map), a single record that builds the footer and the `Organization`/`LocalBusiness` structured data for Google.

## Other panel screens

- **Appearance:** color scheme, mode, fonts and theme tokens. See [Themes](./temas.md).
- **Settings:** identity, address, navigation, social links, SEO, icons, [WhatsApp and announcement bar](#whatsapp-and-announcement-bar).
- **Texts:** interface texts (menu, "read more", forms, 404), per language. Section titles and buttons are not here: they are block fields.
- **Media:** image library.
- **Contacts, Proposals, Contracts, Payments:** the sales side, when the plugins are on.
- **Plugins:** turn features on and off. See below.
- **Privacy (LGPD/GDPR):** privacy policy built from the company data and the plugins that are on, and export or deletion of a person's data.
- **Users and activity:** `root` only.

## WhatsApp and announcement bar

Two features apply to the **whole site**, in both site types, and live in **Settings** (with a preview of the home page before you save). All 14 themes show both without any change.

### WhatsApp

- **Number:** international format, with country and area code (`+55 11 91234-5678`). The panel accepts spaces, parentheses and dashes and stores only the digits.
- **Opening message** (per language): already typed when the chat opens. With no translation in a language, the chat opens empty in it.
- **Floating button:** a button in the bottom corner of every page (except proposal and checkout) that opens the chat in a new tab. No JavaScript, it respects reduced motion and doesn't cover the theme's color toggle or menu.
- **Button text** (per language, optional): shown next to the icon on wide screens. Empty, only the icon shows, with the accessible name "Chat with me on WhatsApp" ("Chat with us on WhatsApp" on company sites), which you can change in **Texts** (`whatsapp.float`).

**In any button or link**, use the address `whatsapp:` instead of a URL: it becomes the site's WhatsApp link with the opening message in the page's language. For a custom message, write it after the colon: `whatsapp:I want the Pro plan`. It works in block buttons, plans, the menu and the announcement link. With no number set, a `whatsapp:` link doesn't render (the button disappears instead of going nowhere). If WhatsApp isn't set here, `whatsapp:` uses the WhatsApp from the company data.

On company sites, the number also goes into the organization's structured data (`contactPoint`) for Google.

### Announcement bar

One line at the top of every page (except proposal and checkout, which are a one-person flow): open bookings, a promotion, new opening hours.

- **Text** (per language, up to 200 characters). With no text in a language, the bar **doesn't show** in it: it doesn't fall back to the default language.
- Optional **link** after the text (`/contact`, `https://…` or `whatsapp:`). With no label in a language, the bar shows without the link.
- **Style:** subtle (card colors) or highlight (the theme's primary color). Both pass AA contrast in every scheme and in both modes.
- **Starts / Ends** (optional): `YYYY-MM-DD`, which covers the whole day in UTC, or a date and time with offset, `2026-12-01T09:00-03:00`.

The period is checked **when the site is published**, because the site is static: the bar only goes live or away on the first build after the date. If it must change at an exact time, publish the site then.

## Plugins

Each optional feature is a plugin the panel turns on and off: contact assistant, proposals, contract templates, payments, blog, projects, résumé, day to day, testimonials, testimonial submission, AI translation, AI résumé per job, analytics (Umami), activity log and media library. The company type adds **pricing** and **team**. When off, the feature disappears from the site and from the panel menu. Plugins that need an external service key are in [Integrations](./integracoes.md). What each one does, in which site type and how it starts is in [Plugins](./plugins.md).

## Roles

Each panel user has a role, and the panel shows only what the role can change.

| Role | For whom | What it does |
|---|---|---|
| `root` | The agency or whoever maintains the site | Everything, including users, the activity log, restoring from trash and technical settings (site type, address, languages, theme) |
| `admin` | The company or portfolio owner | All the content, contacts, proposals and settings, without managing the agency |
| `content-editor` | Whoever looks after the site day to day | Pages, collections, texts and media |
| `blog-editor` | Whoever writes | Blog posts and media |
| `comercial` | Support and sales | Proposals, contracts, checkouts, contacts and plans |
| `proposal-editor` | Whoever only writes proposals | Proposals only |

The first user, created in `setup`, is the `root`. Create the others in **Users**. The rule holds in the backend, not just on screen: without the role, the operation is refused by any route.

On the **Users** screen, the `root` can also:

- **Reset someone's password**, without email. The panel generates a temporary password and shows it once, for you to pass on. The person is signed out of every open session and creates a new password at the next sign-in. You change your own password in **Minha conta** (My account). If nobody can sign in, use `npx create-rubrica senha` in the terminal.
- **Suspend** access: the person leaves the panel at once, and the role and history are kept. **Reactivate** gives the same role back.
- **Delete** the account for good: the login and the role are erased. To only remove access, prefer suspending.

Someone with a temporary password can't do anything until they change it, neither in the panel nor through the MCP.

## Publishing a change

Saving in the panel writes to Convex immediately, and the static site **only changes at the next build**. The panel's **Publish** button triggers the build on the host (the deploy hook). See [Publishing the site](./publicar.md).
