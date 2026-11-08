# Themes

A **theme** changes the shape of the site without changing the content: header, navigation, footer and how each block is drawn. Pages, texts and images are the same in every theme. SEO, accessibility and languages (the `<head>`, the single page `h1`, screen reader labels) live in the core, so every theme gets the same fix when one ships.

Each theme is a package (`@rubrica/theme-<name>`) that your project installs next to `@rubrica/core`. The default look of each one (color scheme, mode and fonts) is declared in its package.

## The 14 themes

| Theme | What it is like | Default look |
|---|---|---|
| `padrao` | Side bar with photo, clean and neutral: fits any field | Neon, dark, Chakra Petch |
| `cyberpunk` | Side bar with a profile photo (dev, designer, freelancer) | Neon, dark, Chakra Petch |
| `brutalist` | Total hacker identity: monospace, no rounded corners | Paper Noir, dark, JetBrains Mono |
| `swiss` | 12-column grid, strong type, rigorous Swiss design | Paper Noir, light, Archivo |
| `bento` | Asymmetric grid with a floating dock: modern, product minded | Editorial Cream, light, Manrope |
| `magazine` | Classic editorial, serif display, lots of white space | Editorial Cream, light, IBM Plex Serif |
| `desktop` | Each section is a window on a retro desktop | Sorbet, light, Instrument Sans |
| `index` | Dense museum list, image on hover: curation | Sumi, light, Instrument Sans |
| `monograph` | The site as a book: title page, contents, drop caps, margin notes | Azulejo, light, Source Serif 4 |
| `zine` | Collage: polaroids, tape, sticky notes and handwriting | Riso, light, Bricolage Grotesque |
| `blueprint` | Numbered technical sheets on grid paper | Cianotipia, dark, IBM Plex Sans |
| `garden` | Notes with growth stages, backlinks and a link map | Crepúsculo, dark, Fraunces |
| `chat` | The site as a conversation: each section answers a ready-made question | Alto Contraste, light, Instrument Sans |
| `poster` | Giant type from start to finish, scrolling bands: impact | Tropicália, light, Bricolage Grotesque |

See them all running in the [builder](https://userubrica.vercel.app/en/#combinador). Some themes change the whole navigation (`desktop`, `chat`, `garden`): open the preview and click around before choosing.

## Pick and switch

At creation: `npx create-rubrica@latest my-site --tema zine`. Afterwards, any time:

```bash
npx create-rubrica config --tema monograph
```

The command swaps the package dependency and the `astro.config.ts` section, runs the install and writes the appearance changes to the development Convex. If you never changed the scheme, mode and fonts, they start following the new theme; whatever you picked stays. The content does not change.

For the **published** site, the switch only arrives with `npx create-rubrica config --tema ... --producao` (which asks for confirmation) and a new `publicar`.

If you ejected components from the old theme, the command warns you: check whether they still make sense in the new one.

## Color schemes

The scheme is the palette, and **any scheme works with any theme**. Each has a light and a dark version, with 11 color roles (background, card, text, secondary text, border, primary color, accent and more).

| Scheme | What it is like |
|---|---|
| `neon` | The original Rubrica look: purple and lime on graphite |
| `editorial-cream` | Refined and timeless: blogs and literary portfolios |
| `paper-noir` | Maximum contrast, strong editorial identity |
| `midnight-blue` | Tech and premium |
| `solar-warm` | Energy and creativity |
| `riso` | Fluorescent pink and riso print blue on paper |
| `cianotipia` | Prussian blue and chalk white |
| `tropicalia` | Forest green, gold yellow and bougainvillea pink |
| `azulejo` | Cobalt blue on white, with terracotta |
| `sumi` | Black ink, washi paper and a single stamp red |
| `fosforo` | CRT monitor green and amber |
| `crepusculo` | Deep purple fading into late afternoon orange |
| `concreto` | Cool grays and a signage yellow |
| `sorbet` | Lilac, mint and peach in Y2K tones |
| `alto-contraste` | AAA contrast in both modes, designed for low vision |

All of them pass AA text contrast (4.5:1) in both modes.

```bash
npx create-rubrica config --esquema azulejo --modo claro
```

The **mode** is `claro` (light), `escuro` (dark) or `automatico` (follows the visitor's system). With the toggle on, the site shows a button for visitors to switch mode. In the panel, the **Appearance** screen makes the same choices and one more: adjusting individual tokens (a color, the corner radius), which win over the scheme.

The precedence is always: **theme tokens, then the scheme, then the panel adjustments**.

## Fonts

Each theme brings its own fonts (one role for text, one for code and one for headings). In the panel's **Appearance** screen you swap the text font and the code font for any family in the catalog (Inter, Chakra Petch, Playfair Display, Space Grotesk, DM Sans, Bodoni Moda, IBM Plex Serif, Manrope, Archivo, Instrument Sans, IBM Plex Sans, Fraunces, Source Serif 4, Bricolage Grotesque, JetBrains Mono, Fira Code, Space Mono, IBM Plex Mono). Fonts are downloaded **at build time** and served by the site itself: the visitor's browser never talks to Google Fonts.

## Own blocks and ejected components

From least to most effort (always prefer the least):

1. **Configuration and tokens**, in the panel or with `config`.
2. **Own block**, for a section the catalog doesn't have.
3. **Ejected component**, when the block exists but you want other markup.

### Own block

It lives in `src/blocks/`: a definition (the fields, with `defineBlock`) and a pure React component. Register both in `src/blocks/index.ts`:

```ts
import { defineBlock, field } from "@rubrica/core";

export const blocks = [defineBlock({ type: "selo", label: "Badge", /* fields... */ })];
export const components = { selo: "./src/blocks/Selo.tsx" };
```

The block shows up in the page editor like the core ones, with form and preview.

### Eject a component

```bash
npx create-rubrica ejetar hero     # copies the hero block component
npx create-rubrica ejetar --listar # shows what has been ejected
```

The command copies only that component (from the theme, or from the core if the theme has none) into `src/overrides/` and starts using the copy. From then on the component is **yours**: `update` doesn't touch it, but warns when the original changed since the copy, so you can bring over the fix. `--forcar` copies again over the top.

### Component rules

Block and theme components are **pure React**: props only, no state, effects, context or data fetching. Astro turns them into static HTML; whatever needs JavaScript is a core island. In addition:

- no fixed text in the component: it is either a block field or an interface text (`ctx.t("key")`);
- internal links through `ctx.href("/path")`, which already carries the language prefix;
- the first block's title is the page `h1`; the others use `h2`, and items use `h3`.

`npx create-rubrica verificar` checks the ejected ones.

## Create a theme

A theme is a package that exports `defineTheme({...})` by default, and the stylesheet at `./styles.css`. It provides:

- **tokens** (colors, typography, spacing, radius) and the default scheme and mode;
- the **shell**: header, navigation and footer (or the `desktop` theme's "desktop");
- **one component per block type**, only the ones you want to replace; the others inherit the core's version;
- named **variants** per block (for example, `cases: ["grade", "lista"]`);
- **recipes**: the default list of blocks of each page, used when creating a site and when migrating;
- optionally, post, case and 404 templates.

The **announcement bar** and the **floating WhatsApp button** ([Content](./conteudo.en.md#whatsapp-and-announcement-bar)) belong to the core: the bar comes before the shell, the button after it, using only `--rb-*` tokens. If the shell has something fixed at the top or bottom, the theme makes room with CSS, no JavaScript: `<html>` gets `data-announcement` when there is a bar and `data-whatsapp-float` when there is a button, and the `--rb-float-bottom` and `--rb-float-right` variables move the button (`--rb-whatsapp-bg` and `--rb-whatsapp-fg` set its colors). `padrao` turns its fixed bar and sidebar into `sticky` when there is a bar; `bento` lifts the button above the dock; `chat` puts it in the quick replies bar.

The contract has its own version: the package declares `"rubrica": { "contract": "^1" }`. A new block in the core is a minor version (the theme inherits the default); changing or removing a field is a major version, always with a data migration.

The shortest way to start is to copy `packages/themes/padrao` from the [repository](https://github.com/MierzwaMatheus/rubrica) and change what you want. The monorepo guide, with the complete rules, is in [`docs/v2/contribuindo.md`](https://github.com/MierzwaMatheus/rubrica/blob/main/docs/v2/contribuindo.md) (in Portuguese).

### The test battery

Every theme goes through the same battery before it ships. It builds the demo sites (personal and company) with the theme, across all blocks and variants, and checks:

- accessibility with axe, no violations;
- one `h1` per page and a complete `<head>` (title, description, canonical, languages, structured data);
- a JavaScript limit per page (120 KB gzipped on pages with an island; a page without an island ships no JavaScript);
- islands hydrating without errors;
- Lighthouse: performance 90 or more, accessibility and SEO 95 or more.

```bash
pnpm testar-tema my-theme              # in the monorepo
npx create-rubrica testar-tema my-theme
```

Useful options: `--site pessoal`, `--sem-lighthouse`, `--so-lighthouse`, `--json report.json` and `--todos`. The full list is in [CLI commands](./cli.md#testar-tema). If anything fails, the theme doesn't ship. The same battery applies to third-party themes.
