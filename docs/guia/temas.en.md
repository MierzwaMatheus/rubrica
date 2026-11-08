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

When the theme and **Aparência** aren't enough, there are two paths inside the project itself, from the smallest effort to the largest:

1. **Own block**, for a section the [catalog](./blocos.md) doesn't have: a definition with the fields and a React component, in `src/blocks/`. See [Create a block](./criar-bloco.md).
2. **Ejected component**, when the block exists and you want different markup: `npx create-rubrica ejetar <block>` copies the component to `src/overrides/`, and the copy becomes yours. See [Eject a component](./criar-tema.md#eject-a-component).

## Create a theme

A new theme is a `@rubrica/theme-<id>` package, built in the Rubrica monorepo from `padrao` and approved by the same test battery as every theme (accessibility, SEO, JavaScript per page and Lighthouse). The contract, the shell, the tokens, variants, recipes and the step-by-step guide are in [Create a theme](./criar-tema.md).
