# Creating a layout

A guide for anyone who creates or maintains a Rubrica layout. It applies to the new layouts (full color scheme) and, where noted, to the 5 original ones.

## What a layout is

A layout is a folder in `templates/layouts/<id>/` registered in `cli/src/layouts.ts`. When a project is created or reconfigured, the CLI (`applyLayout`) copies:

| From the template | To the project |
|---|---|
| the root files listed in `copy` (e.g. `Layout.tsx`, the navigation, a `<Nome>Shared.tsx`) | `src/components/` |
| `pages/Home.tsx`, `Resume.tsx`, `Portfolio.tsx`, `About.tsx`, `Blog.tsx` | `src/pages/` |

So, inside the template:

- `Layout.tsx` exports `function Layout({ children, className })`, like the current layouts. The app wraps every public page with it.
- Root files import each other by relative path (`./ZineNav`). Pages import root files through `@/components/<Arquivo>` (that's where they will be in the project).
- File names are the ones in the registry. Don't create files outside that list: they wouldn't be copied.

Pages that no layout replaces (blog post `/blog/:slug`, case study `/portfolio/:slug`, testimonials, proposals, checkout) belong to the app and follow the color scheme on their own. `Layout.tsx` gives them the frame and the margin: see `TEMPLATE_PAGES` in Bento's `Layout.tsx`.

## Colors: the full scheme

The CLI writes the chosen scheme to `src/index.css`: light mode in `:root` and dark mode in `.dark`. Each mode has 11 roles (`cli/src/themes/schemes.ts`):

| Variable | Role |
|---|---|
| `--bg` | page background |
| `--surface` | cards, panels, bars |
| `--subtle` | subtle backgrounds, bands, hover |
| `--text` | main text |
| `--text-muted` | secondary text, captions |
| `--line` | borders and dividers |
| `--primary` | identity: buttons, links, highlight blocks |
| `--on-primary` | text on the primary color |
| `--accent` | second brand color |
| `--on-accent` | text on the accent color |
| `--accent-2` | third color (new layouts only) |

There is also `--text-strong` (headings, derived from `--text`).

Rules (checked by `tests/app/colorContract.test.ts`):

- **New layouts** use only these variables: `var(--surface)`, `color-mix(in srgb, var(--text) 20%, transparent)` etc. No literal colors: no `#hex`, `rgb()`, `hsl()`, and no fixed-color Tailwind classes (`text-white`, `bg-gray-100`, `bg-red-500`…). Shadows too: `color-mix(in srgb, var(--text) 18%, transparent)`.
- Layout-specific variables are allowed if they start with `--<id>-` and are derived from the scheme (e.g. `--zine-tape: color-mix(in srgb, var(--accent-2) 60%, transparent)`).
- Text on the primary color uses `--on-primary`; on the accent, `--on-accent`. Never assume the background is light or dark.
- **Original layouts** (`legacy: true`) keep using only `--bg`, `--text`, `--primary` and `--accent`.

The layout has to work with **any** scheme, in **both modes**. Test at least: the layout's recommended scheme, `alto-contraste`, `neon`, and a scheme whose mode is the opposite of the recommended one.

## Light/dark mode and texture

- The mode comes from the `dark` class on `<html>`. The layout doesn't decide the mode: it only uses the variables.
- When the site owner turns on the toggle (`rubrica config` → "Aparência"), visitors can switch the mode. **Every layout puts `<ColorModeToggle />` (`@/components/ColorModeToggle`) in the navigation.** It renders nothing when the toggle is off and inherits the text color. Style it through `className`/`style` and place it wherever it makes sense in the layout. For a custom control, use `useTheme()` from `@/contexts/ThemeContext` (`theme`, `toggleTheme`, `switchable`).
- The texture (grain, paper, scanlines) is a global layer applied by `index.css` (`data-texture` on `<html>`). The layout doesn't implement texture and must not create opaque fixed layers over the whole page.

## Fonts

- Use `var(--font-sans)` (main) and `var(--font-mono)`. The CLI loads both from Google Fonts. Each layout's recommended fonts are in the registry.
- One extra signature font (e.g. Zine's handwriting) is allowed. `Layout.tsx` itself loads it with `<Helmet>` from `react-helmet-async` (`<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Caveat:wght@500;700&display=swap" />`) and always declares a fallback font.

## Content: what each page must show

Layouts change the form, not the content. Every page covers the same things as the current layouts' pages, reading the same hooks. **Read an existing layout's pages in full** (`templates/layouts/swiss/pages/*.tsx` and `templates/layouts/bento/pages/*.tsx`) and its doc (`docs/templates/bento.md`) before you start. In short:

- **Home** (`useHome`, `useHomeMetrics`, `usePortfolio` + `selectFeaturedCases`, `useContactWizard`, `usePlugin`): availability (when on), name, value statement (`home.hero.headline`), job title, the "Ver cases" (see cases) and "Fale comigo" (talk to me, opens the form) buttons, highlight numbers (up to 4; the strip disappears with no numbers), 3 featured cases with their first metric and a link to `/portfolio/<slug>`, about, "O que eu faço" (what I do: services), testimonials (with "ver todos" (see all) and "deixar meu depoimento" (leave a testimonial) depending on the plugins), and the closing call "Tem um projeto em mente?" (have a project in mind?) with "Tenho um projeto" (I have a project) and "Tenho uma vaga" (I have a job opening).
- **Resume** (`useResume`, `groupSkills`, `splitExperiences`, `useDownloadCV`): summary, button to download the CV as PDF, highlight numbers, recent experiences with older ones behind "ver anteriores" (see earlier), skills grouped by group (no numeric levels), soft skills, languages, education, courses, certifications and volunteering (each block disappears when empty).
- **Portfolio** (`usePortfolio`, `listCategories`, `filterByCategory`, `hasCaseStudy`): category filter (disappears with no categories), highlight for the first projects, the case's first metric on each project, and a single action: the case when there is one, otherwise the project link.
- **About** (`useAbout`, `useWorkPrinciples`, `splitParagraphs`, `highlightNumbers`): "Como eu trabalho" (how I work: principles) opening the page, professional summary, personal text, day to day, interests and FAQ.
- **Blog** (`useBlogPosts`): list of posts with the featured one first, links to `/blog/<slug>`, date and reading time, tags and an RSS indication.

Respect the plugins (`usePlugin("portfolio")`, `"blog"`, `"resume"`, `"about"`, `"testimonials"`, `"testimonials-intake"`, `"contact-wizard"`): whatever is off disappears from the page and from the navigation.

Every internal link points to a route in `src/App.tsx` (test `tests/app/templates/routes-contract.test.ts`).

## Text and languages

- Use the keys in `src/i18n/translations/pt-BR.ts` with `t()` (`useTranslation`). Don't edit the translation files.
- Layout-specific text (decorative labels like "Folha 02" (sheet 02) or "Caixa de entrada" (inbox)) lives in the layout's `<Nome>Shared.tsx`, in pt-BR and en-US, picked by `useI18n().locale`.
- No hardcoded personal data: name, email and projects come from the hooks.

## Mobile

Everything works from 360px wide, with no horizontal scrolling. Use Tailwind's responsive classes, media queries in the component itself, or the `MobileLayoutStyles` attributes (`rb-mobile`, `data-m-cols`, `data-m-hide`…). Decorative elements that don't fit disappear on mobile; content never does.

## Seeing the layout run

```bash
# builds a temporary project with the layout applied by the CLI, checks types, builds it and starts the preview
npx tsx scripts/preview-layout.ts --layout <id> --port <porta> [--scheme <esquema>] [--texture <textura>]

# only check types
npx tsx scripts/preview-layout.ts --layout <id> --port <porta> --check-only

# screenshots the 5 pages in both modes, at 1440px and 390px, and warns about horizontal scrolling and console errors
node scripts/shot-layout.mjs --port <porta> --out /tmp/rubrica-shots/<id>

# stop the preview
npx tsx scripts/preview-layout.ts --stop --port <porta>
```

The preview uses the sample data in `public/data/` (fictional profile "Alex Rocha") and starts with the mode toggle on.

Tests that cover layouts:

```bash
npx vitest run tests/app/colorContract.test.ts tests/app/templates
```
