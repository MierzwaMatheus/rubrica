# Create a theme

A **theme** shapes the site: the shell (header, navigation, footer), the design of each block, the variants and the starting pages. Content is the same in any theme. SEO, accessibility and languages (the `<head>`, the single `h1`, structured data, responsive images) belong to the core, so the theme doesn't have to deal with them.

This guide is for writing a theme from scratch or from one of the 14. To just pick and switch themes, see [Themes](./temas.md). To change one block on a single site, [ejecting the component](#eject-a-component) is usually enough.

## Where a theme lives

A theme is an npm package, `@rubrica/theme-<id>`, and today it is born in the [Rubrica monorepo](https://github.com/MierzwaMatheus/rubrica), under `packages/themes/<id>`. That's where the [test battery](#the-test-battery) every theme must pass runs, and where it is published from. The CLI only offers the themes in the official list (`create --tema`, `config --tema`): a new theme joins that list when it is accepted into the repository. The contribution rules are in [Contributing](../v2/contribuindo.md#adicionar-um-tema).

The package looks like this:

```
packages/themes/farol/
  package.json
  src/
    index.tsx      the definition (defineTheme), as the default export
    styles.css     the stylesheet
    fonts.json     the default fonts
    shell.tsx      the shell
    blocks.tsx     the blocks the theme draws (optional)
    templates.tsx  post, case and 404 (optional)
    texts.ts       the theme's interface texts (optional)
```

`package.json` exports the three entries the integration looks for and declares the contract:

<!-- exemplo: tema/package.json -->
```json
{
  "name": "@rubrica/theme-farol",
  "version": "0.1.0",
  "type": "module",
  "license": "GPL-3.0-only",
  "exports": {
    ".": "./src/index.tsx",
    "./styles.css": "./src/styles.css",
    "./fonts.json": "./src/fonts.json"
  },
  "files": ["src", "LICENSE"],
  "rubrica": { "contract": "^1" },
  "scripts": { "check": "tsc --noEmit -p tsconfig.json" },
  "peerDependencies": { "@rubrica/core": "workspace:^", "react": "^19.2.0" },
  "devDependencies": { "@rubrica/core": "workspace:^", "@types/react": "^19.2.0", "react": "^19.2.1", "typescript": "^5.9.0" }
}
```

The **contract** (`"rubrica": { "contract": "^1" }`, the same value as the definition's `contract` field) says which version of the block contract the theme works with. A new block in the core is a minor version: the theme inherits the default component until it draws its own. Changing or removing a field is a major version, always with a data migration.

## The definition: `defineTheme`

The example used in this guide, a theme called `farol`:

<!-- exemplo: tema/src/index.tsx -->
```tsx
import { CORE_RECIPES, defineTheme, type Recipe } from "@rubrica/core";
import fonts from "./fonts.json";
import { CasesBlock } from "./blocks";
import { FarolShell } from "./shell";
import { FarolNotFound } from "./templates";
import { FAROL_TEXTS } from "./texts";

const tr = (ptBR: string, en: string, es: string) => ({ "pt-BR": ptBR, en, es });

/** The core recipe, with a different hero on the home page. */
const pessoal: Recipe = CORE_RECIPES.pessoal.map((page) =>
  page.path !== "/"
    ? page
    : {
        ...page,
        blocks: [
          {
            type: "hero",
            fields: {
              eyebrow: tr("Seu cargo", "Your role", "Tu cargo"),
              title: tr("Uma frase sobre o que você faz", "One sentence on what you do", "Una frase sobre lo que haces"),
            },
          },
          ...page.blocks.filter((b) => b.type !== "hero"),
        ],
      },
);

export default defineTheme({
  id: "farol",
  label: "Farol",
  description: "Réguas finas, títulos serifados e cases em faixa.",
  contract: "^1",
  scheme: "azulejo",
  colorMode: "light",
  texture: "paper",
  fonts,
  tokens: {
    "rb-radius": { label: "Raio das bordas", kind: "length", default: "0.25rem" },
    "farol-rule": { label: "Espessura das réguas", kind: "length", default: "2px" },
  },
  Shell: FarolShell,
  blocks: { cases: CasesBlock },
  templates: { notFound: FarolNotFound },
  variants: {
    cases: [
      { value: "faixa", label: "Faixa" },
      { value: "grade", label: "Grade" },
      { value: "lista", label: "Lista" },
    ],
  },
  recipes: { pessoal },
  texts: FAROL_TEXTS,
});
```

| Field | Required | What for |
|---|---|---|
| `id` | yes | The package id without the scope (`farol` for `@rubrica/theme-farol`), in lowercase letters, digits and hyphens |
| `label`, `description` | `label` | Name and one sentence about the theme |
| `contract` | yes | Block contract range (`^1`) |
| `tokens` | yes | Tokens the panel lets people adjust under **Aparência** (may be `{}`). See [Tokens](#tokens) |
| `Shell` | yes | The shell. See [The shell](#the-shell) |
| `blocks` | no | A component per block type; anything missing inherits the core's. See [Blocks](#blocks) |
| `templates` | no | `post`, `case` and `notFound`. See [Templates](#templates) |
| `variants` | no | Variants per block; the first is the default. See [Variants](#variants) |
| `recipes` | no | Starting pages per site type (`pessoal`, `empresa`). See [Recipes](#recipes) |
| `scheme` | no | Default colour scheme (`neon`, `azulejo`...), when the site doesn't pick one |
| `colorMode` | no | The mode the layout was designed to show first: `dark` (the default), `light` or `system`. The CLI uses it when creating the site and when switching themes; the site's **Aparência** decides |
| `texture` | no | Default texture: `grain`, `paper`, `scanlines` or `none`. A fixed layer over the page that takes no clicks and disappears with `prefers-reduced-transparency` |
| `fonts` | no | The default fonts, imported from `fonts.json`. See [Fonts](#fonts) |
| `texts` | no | The theme's own interface texts. See [Interface texts](#interface-texts) |
| `contactDialog` | no | `true` opens contact in a dialog, on any page. See [Contact dialog](#contact-dialog) |

## Tokens

Tokens are `--rb-*` CSS properties on the page root. The core's default blocks use **only tokens**, no fixed colours, so a theme changes a lot with tokens alone.

**Colours** come from the chosen scheme (the 11 roles of each scheme, light and dark):

| Token | Role |
|---|---|
| `--rb-bg` | Page background |
| `--rb-surface` | Cards, panels, sidebar |
| `--rb-subtle` | Subtle backgrounds, hover, bands |
| `--rb-fg` | Main text |
| `--rb-muted` | Secondary text |
| `--rb-border` | Borders and dividers |
| `--rb-accent` | Identity colour: buttons and links |
| `--rb-accent-fg` | Text on `--rb-accent` |
| `--rb-accent-2` | Second brand colour (with text contrast on the background) |
| `--rb-accent-2-fg` | Text on `--rb-accent-2` |
| `--rb-accent-3` | Third colour, decorative only (no contrast guarantee) |
| `--rb-danger`, `--rb-success` | Error and confirmation text |

**The rest** come from the theme:

| Token | What for |
|---|---|
| `--rb-font-sans`, `--rb-font-mono`, `--rb-font-display` | Text, code and heading fonts |
| `--rb-fg-strong` | Heading colour (default: same as `--rb-fg`) |
| `--rb-radius` | Border radius |
| `--rb-container` | Maximum content width |

Precedence is always: **theme tokens, then the scheme, then the panel's adjustments**. The scheme uses a stronger selector than the theme's `:root`, so only declare colours in the theme if it must not follow the scheme (rare). The usual approach is for the theme to define what isn't colour and derive the rest from the scheme's tokens, with `color-mix()`:

```css
:root {
  --rb-font-display: "Fraunces", ui-serif, serif;
  --rb-radius: 0.25rem;
  --rb-container: 68rem;
  --farol-rule: 2px;
  --farol-hairline: color-mix(in srgb, var(--rb-fg) 12%, transparent);
}
.farol-header { border-bottom: var(--farol-rule) solid var(--rb-border); }
```

The page root carries `data-theme-id`, `data-color-mode` (`dark`, `light` or `system`), `data-scheme` and `data-texture`, so the CSS can vary when it needs to.

The definition's `tokens` field lists what the panel lets people adjust under **Aparência**: the key is the property name without the two hyphens (`farol-rule`), `kind` is `color`, `font`, `length` or `other`, `default` is the value shown as a hint and `light` the light-mode value when it differs. The initial value is still the one `styles.css` declares.

## The shell

The shell wraps every page. It gets `ShellProps`:

| Prop | What it is |
|---|---|
| `ctx` | The page context: `ctx.site` (name, logo, navigation, social links, person or company), `ctx.t`, `ctx.href`, `ctx.locale`, `ctx.alternates`, `ctx.feeds` |
| `pageType` | `page`, `post`, `case` or `notFound`, so the shell can vary |
| `collections` | The language's projects and posts, summarized (title, address, tags), for a site map or a menu |
| `children` | The page content |
| `colorToggle` | The light and dark mode button, ready to place. Only present when the site turns the toggle on |
| `localeSwitcher` | Links to the page in the other languages, ready to place |

<!-- exemplo: tema/src/shell.tsx -->
```tsx
import type { ShellProps } from "@rubrica/core";
import { Logo } from "@rubrica/core/components";

export function FarolShell({ ctx, pageType, children, colorToggle, localeSwitcher }: ShellProps) {
  const { site } = ctx;
  return (
    <div className="farol" data-page={pageType}>
      <a className="rb-skip" href="#conteudo">
        {ctx.t("nav.skip")}
      </a>
      <header className="farol-header">
        <a className="farol-brand" href={ctx.href("/")}>
          {site.logo ? <Logo logo={site.logo} priority /> : site.name}
        </a>
        <nav aria-label={ctx.t("nav.menu")}>
          <details className="farol-menu">
            <summary>{ctx.t("nav.menu")}</summary>
            <ul>
              {site.navigation.map((item) => (
                <li key={item.href}>
                  <a href={item.href} aria-current={item.current ? "page" : undefined}>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </details>
        </nav>
        <div className="farol-tools">
          {localeSwitcher}
          {colorToggle}
        </div>
      </header>
      <main id="conteudo">{children}</main>
      <footer className="farol-footer">
        <p>{ctx.t("farol.footer", { name: site.organization?.legalName ?? site.name })}</p>
      </footer>
    </div>
  );
}
```

Every shell needs:

- the skip link (`.rb-skip`, with `ctx.t("nav.skip")`) pointing at `<main id="conteudo">`;
- navigation with an `aria-label` and `aria-current="page"` on the current item (`item.current`);
- `localeSwitcher` and `colorToggle` somewhere visible;
- navigation that works on a phone **without JavaScript**: `<details>`, or a checkbox toggled by a `<label>` (the `padrao` theme does this).

A shell can go far beyond a header with a menu: the `desktop` theme becomes a desktop with windows, `chat` a conversation, `garden` a map of notes that uses `collections`. Read their `shell.tsx` in the repository before designing a special shell.

### Announcement bar and WhatsApp button

The **announcement bar** and the **floating WhatsApp button** ([Content](./conteudo.en.md#whatsapp-and-announcement-bar)) belong to the core: the bar comes before the shell, the button after it, using only `--rb-*` tokens. If the shell has something fixed at the top or bottom, the theme makes room with CSS, no JavaScript: `<html>` gets `data-announcement` when there is a bar and `data-whatsapp-float` when there is a button, and the `--rb-float-bottom` and `--rb-float-right` variables move the button (`--rb-whatsapp-bg` and `--rb-whatsapp-fg` set its colors). `padrao` turns its fixed bar and sidebar into `sticky` when there is a bar; `bento` lifts the button above the dock; `chat` puts it in the quick replies bar.


### Contact dialog

With `contactDialog: true`, the core adds a dialog (an HTML `popover`) with the contact form to every page, when the contact plugin is on. The form follows the home page's `contato` block; without that block, it's the default wizard. The dialog id comes in `ctx.site.contactDialog`, and the shell (or a template) opens it with `<button type="button" popoverTarget={ctx.site.contactDialog}>`, no JavaScript. Without the dialog, fall back to a link to the block (`#contato`). Link fields that point to contact (`contato:`, `#contato`) come with `dialog`, the dialog id: the core `LinkButton` already becomes a button, and a theme block that draws its own link should do the same.

Esc and clicking outside close it. The form only loads when the dialog opens, but every page now carries Astro's small island script. The test battery opens the dialog before checking hydration and axe. `padrao` and `cyberpunk` use the dialog, like the v1 contact wizard.

## Blocks

`blocks` has one component per block type, only for those the theme wants to draw. The others **inherit** the core's default component and get their look from CSS (each section has the `rb-<type>` class and the `data-block` and `data-variant` attributes). A block the core adds later also shows up in the theme, with the default component.

The component gets the same props as an [own block](./criar-bloco.md#the-component), with the collection items already resolved (`ProjectItem`, `PostItem`...). The rules are the same too: pure React, no hard-coded text, the title at `headingLevel` and items in `h3`.

A theme can reuse the core component and draw only what changes. Here `farol` draws the `faixa` variant and hands the others back to the core:

<!-- exemplo: tema/src/blocks.tsx -->
```tsx
import type { BlockProps, ProjectItem, ResolvedFields } from "@rubrica/core";
import type { cases } from "@rubrica/core/blocks";
import { CasesBlock as CoreCasesBlock, Heading, Img, LinkButton, Section, SectionHeader } from "@rubrica/core/components";

type CasesFields = ResolvedFields<typeof cases.fields>;

export function CasesBlock(props: BlockProps<CasesFields, ProjectItem>) {
  if (props.variant !== "faixa") return <CoreCasesBlock {...props} />;
  const { id, variant, fields, items, headingLevel, ctx } = props;
  return (
    <Section id={id} anchor={fields.anchor} type="cases" variant={variant}>
      <SectionHeader title={fields.title} intro={fields.intro} level={headingLevel} />
      <ol className="farol-faixa">
        {items.map((project) => (
          <li key={project.id}>
            {project.cover && <Img image={project.cover} sizes="(min-width: 64rem) 20rem, 80vw" />}
            <Heading level={3}>{project.title}</Heading>
            {project.summary && <p>{project.summary}</p>}
            <a href={project.url}>{ctx.t("farol.openCase")}</a>
          </li>
        ))}
      </ol>
      {fields.cta && <LinkButton link={fields.cta} variant="secondary" />}
    </Section>
  );
}
```

The default components and the pieces (`Section`, `SectionHeader`, `Heading`, `Img`, `Html`, `LinkButton`, `Logo`, `LocaleLinks`, `ColorToggleButton`) and a few pure utilities (`formatDays`, `safeId`, `shorten`, `tagFilterCss`) come from `@rubrica/core/components`.

## Variants

`variants` names different designs of a block (decision 23): the panel shows only those of the theme in use, and the **first is the default**. When you switch themes, a variant the new theme lacks falls back to its default. The component reads the chosen one in `variant`.

The core's default components only know how to draw the variants in `CORE_VARIANTS` (today, `grade` and `lista` for `cases`, `vertical` and `horizontal` for `linha-do-tempo`). A theme that inherits a block's default component may only declare those, in any order. A new variant needs the theme's own component, like `faixa` above. The [block catalog](./blocos.md) shows the variants each theme declares, and the MCP hands them to the agent (and refuses a variant the theme doesn't have).

## Recipes

A **recipe** is the list of pages and blocks a new site starts with (decision 24), per site type. `setup` uses the theme's recipe when it creates the initial content, and `migrar` uses the same one to bring over a v1 site. Without a recipe, the core's applies (`CORE_RECIPES`).

Each page has a `path`, a `title` (one text per language) and `blocks`, and each block has a `type` and, optionally, `variant`, `fields` (in the stored format, with one text per language) and `source`. The safest approach is to start from the core recipe and change only what the theme changes, as in the definition example. The battery's showcase (`/vitrine/receita/...`) shows the assembled recipes. The MCP also hands the recipe to agents (`page_recipes`) as a starting point to build a page of the same type: keep each page's block order consistent with the theme's design.

## Templates

Optional templates for the pages that aren't made of blocks. Each one renders its own `h1`, inside the shell:

| Template | Props |
|---|---|
| `post` | `post` (the `PostItem`), `html` (the body, already sanitized in the backend), `related`, `ctx` |
| `case` | `project` (the `ProjectItem`, with the case sections), `related`, `ctx` |
| `notFound` | `ctx` |

<!-- exemplo: tema/src/templates.tsx -->
```tsx
import type { NotFoundProps } from "@rubrica/core";

export function FarolNotFound({ ctx }: NotFoundProps) {
  return (
    <section className="farol-404">
      <h1>{ctx.t("notFound.title")}</h1>
      <p>{ctx.t("notFound.body")}</p>
      <a href={ctx.href("/")}>{ctx.t("notFound.home")}</a>
    </section>
  );
}
```

Without a template, the core's apply (`DefaultPost`, `DefaultCase`, `DefaultNotFound`), styled by the theme's CSS.

## Fonts

`fonts.json` names the family for each role. The theme's `index` imports the file (for `fonts`) and the package exports it as `./fonts.json` (for the build), so there is a single source:

<!-- exemplo: tema/src/fonts.json -->
```json
{ "sans": "Instrument Sans", "mono": "IBM Plex Mono", "display": "Fraunces", "italic": ["display"] }
```

- `sans`, `mono` and `display` are Google Fonts families. The build downloads the files and the site serves them: visitors' browsers never talk to Google. Prefer the ones in the panel's catalog (Inter, Chakra Petch, Fraunces, Instrument Sans...), whose weights are known; any other family downloads weights 400 and 700.
- `italic` lists the roles that also download the real italic, instead of the oblique the browser fakes. It applies to whichever family fills the role, even if the site swaps the font.
- Under **Aparência**, the site can change the text and code fonts. The heading font (`display`) is always the theme's.
- In `styles.css`, declare the families in the tokens (`--rb-font-sans: "Instrument Sans", system-ui, sans-serif;`) as a fallback: the core points the tokens at the downloaded fonts on top of that.

## Interface texts

Text that isn't content (the "open the case" of the strip, the footer) comes from `ctx.t`. The core's keys (`nav.skip`, `nav.menu`, `footer.rights`, `notFound.title`...) are in `packages/core/src/i18n/ui-texts.ts`. The theme adds its own in `texts`, prefixed with its id and with one text per base language (`pt`, `en`, `es`). Variables go in braces:

<!-- exemplo: tema/src/texts.ts -->
```ts
export const FAROL_TEXTS: Record<string, Record<string, string>> = {
  "farol.footer": { pt: "Feito por {name}", en: "Made by {name}", es: "Hecho por {name}" },
  "farol.openCase": { pt: "Abrir o case", en: "Open the case", es: "Abrir el caso" },
};
```

The site can change any text under **Textos** in the panel. With no translation in the page's language, the main language's applies.

## Islands and JavaScript

A page without islands loads no JavaScript, and the battery checks it. So:

- **The theme doesn't create islands.** Islands (the contact wizard, the testimonial form, the résumé PDF button) belong to the core, and the core decides when to mount each one. The block component gets the island ready in `island` and only chooses where it goes. A theme that draws the `contato` block and forgets `island` leaves the form out.
- `colorToggle` and `localeSwitcher` aren't islands either: they are ready HTML, with a small core script for the colour mode.
- For interaction in a theme, use HTML and CSS: `<details>`, `:target`, a checkbox with a `<label>`, or a `<style>` generated at build time (the core's `tagFilterCss` builds a tag filter's CSS this way).

## The test battery

Every theme goes through the same battery (decision 31) before it gets in. It builds the demo sites, personal and company, with the theme, plus the **showcase** (`/vitrine`: one page per block with all of the theme's variants, and the assembled recipes), and checks every page:

| Check | What it requires |
|---|---|
| `status` | The page responds without an error |
| `axe` | No axe accessibility violations |
| `h1` | Exactly one `<h1>` |
| `title`, `description`, `canonical`, `lang`, `hreflang` | A complete `<head>`: title, description, a canonical pointing at the page itself, the `lang` of the URL's language, reciprocal `hreflang` |
| `overflow` | No horizontal scrolling at 360 px wide |
| `console`, `network` | No console errors and no requests answered with 4xx or 5xx |
| `js` | Page without islands: only the colour-mode script, JSON-LD and the configured analytics. Page with islands: up to 120 KB of JavaScript (gzip) |
| `hydration` | Every island hydrates within 10 seconds |

And Lighthouse on the home page, a post and a case: **performance 90 or more, accessibility and SEO 95 or more** (median of up to 3 runs).

In the monorepo:

```bash
pnpm --filter @rubrica/theme-tester exec playwright install chromium   # once
pnpm testar-tema farol
```

Useful options: `--site pessoal`, `--sem-lighthouse` (much faster, for day-to-day work), `--so-lighthouse`, `--sem-vitrine`, `--json report.json`, `--manter-dist` and `--todos`. The limits change with `--js-kb`, `--lh-performance`, `--lh-acessibilidade` and `--lh-seo`, but a theme gets in with the defaults. The full list is in [CLI commands](./cli.md#testar-tema).

## From padrao to your theme

1. **Copy `padrao`.** In the monorepo (`pnpm install` at the root, Node 24): copy `packages/themes/padrao` to `packages/themes/<id>`, delete `CHANGELOG.md`, change the `name` in `package.json` to `@rubrica/theme-<id>` and the `id` and `label` in `defineTheme`. Run `pnpm install` again.
2. **See it running.** `THEME=@rubrica/theme-<id> pnpm demo` opens the demo site with your theme (`SITE=empresa` for the company one), and `/admin` shows the panel with the preview.
3. **Start with tokens.** Change fonts (`fonts.json`), radius and width in `styles.css`, and pick `scheme`, `colorMode` and `texture`. That alone changes a lot.
4. **Draw the shell.** Replace `shell.tsx`, keeping the skip link, `<main id="conteudo">`, `aria-current`, the languages, the colour mode and the JavaScript-free menu.
5. **Draw the blocks you want.** One at a time, in `blocks`, starting from the core component (`packages/core/src/components/blocks/`). The ones you don't draw keep working.
6. **Add variants and recipes**, if the theme calls for them.
7. **Run the battery** (`pnpm testar-tema <id> --sem-lighthouse` while designing; the full one before handing in) and `pnpm --filter @rubrica/theme-<id> check`.
8. **Propose it in the repository**, following [Contributing](../v2/contribuindo.md#adicionar-um-tema).

## Eject a component

To change a block's markup on a single site, without making a theme, eject the component:

```bash
npx create-rubrica ejetar hero     # copies the hero block's component to src/overrides/
npx create-rubrica ejetar --listar # shows what was ejected and whether the original changed
```

The copy comes from the theme in use (or from the core, if the theme doesn't draw the block) and takes over from it. From then on it is yours: `update` doesn't touch it, but warns when the original changes. Details in [CLI commands](./cli.md#ejetar).
