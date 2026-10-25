# Índice

> _A dense museum list, labels on the left and an image that appears on hover — curation._

![Índice home page](img/index/home.jpg)

<sub>Screenshots with the **Sumi** scheme, light mode. The layout works with any scheme, in both modes.</sub>

## Concept

The site as an **archive catalog**: small, precise type, lots of white space and thin lines separating everything. Each page is a sequence of **labeled sections**: the uppercase label sits in a ~180px column on the left and the content on the right. The Home value statement (`home.hero.headline`) is the only moment of large type.

Projects and posts become **rows in an index** (real tables). When you hover a row or reach it with the keyboard, its colors invert (background in the text color) and the item's image appears **in the label column, at the row's height**: never over the table, the label or other text. Each page and each project gets a catalog number (`Nº 003`).

The identity color (`--primary`) appears rarely and precisely: link underlines, the active navigation item and the availability dot. Everything else uses `--text`, `--text-muted`, `--line`, `--subtle` and `--surface`.

- **Recommended fonts:** Instrument Sans (main) and IBM Plex Mono (catalog numbers, dates, captions).
- **Recommended scheme:** Sumi, light mode, no texture.
- **Template files:** `Layout.tsx`, `IndexHeader.tsx`, `IndexShared.tsx` and the 5 pages in `pages/`.

## Global structure

- **Fixed 3-column header:** name (link to the home page) | role and "Arquivo de trabalhos, <ano>" ("Work archive, <year>") | text navigation and the light/dark mode button (`<ColorModeToggle />`). The active item is underlined in the primary color. The items follow the plugins (Resume, Portfolio, About, Blog).
- On mobile the header keeps the name, the mode button and "Menu", which opens the navigation as a list.
- **Footer** with the email (when visible), the catalog line and the year.
- "Pular para o conteúdo" (Skip to content) link at the top, visible when it gets focus.
- `IndexShared.tsx` holds the layout's own strings (pt-BR and en-US), the stylesheet, the labeled section (`IndexSection`), the highlight numbers (`IndexMetrics`) and the index with preview (`IndexTableSection`).
- App pages the layout doesn't replace (post, case, testimonials, proposals) get the frame and margin from `Layout.tsx`.

## Pages

### Home

![Home](img/index/home.jpg)

- **Opening:** availability (dot in the primary color + text) in the label, the value statement in large type, the description and the links **"Ver cases ↓"** (See cases) and **"Fale comigo →"** (Talk to me; opens the form).
- **Em números** (In numbers): up to 4 highlight numbers in a definition list. The band disappears when there are no numbers.
- **Featured cases** as an index: Nº | Project | Type | Area | Result (the case's first metric). Hover and focus invert the row and show the image in the label column. Each row leads to `/portfolio/<slug>`; below it, "ver todos os projetos (N) →" (see all projects).
- **About me** in two columns, with the numbers in the text highlighted.
- **What I do:** services in title | description rows.
- **What people say about me:** up to 3 testimonials side by side, with "Ver todos os depoimentos" (See all testimonials) and "Deixar meu depoimento" (Leave a testimonial) depending on the plugins.
- **Contact:** "Tem um projeto em mente?" (Have a project in mind?) with "Tenho um projeto →" (I have a project) and "Tenho uma vaga →" (I have a job opening).

### Resume

![Resume](img/index/curriculo.jpg)

- Header with the summary (first paragraph of "about") and the **"Baixar CV (PDF)"** (Download CV) button.
- Highlight numbers (the same as on Home).
- **Experience as a catalog record:** Period | Role | Company | Summary (the first bullet) rows. Each row is a button that expands the full bullets. Older experiences sit behind "ver experiências anteriores" (see earlier experience).
- **Skills** as a definition list per group ("Grupo" field in the admin), with no numeric levels.
- Soft skills, languages (language | level), education (period | course | institution | details), numbered courses and certifications in two columns, and volunteering. Each block disappears when empty.

### Portfolio

![Portfolio](img/index/portfolio.jpg)

- **Category filter** as text links with the count for each one. It disappears when there are no categories.
- **Featured:** the first project in the current selection as a record (number, category, description, first metric, action and image).
- **Full index:** Nº | Project | Type | Area | Result | action. Clickable sorting by **number** and by **name** (headers with `aria-sort`), with the same preview in the label column. The catalog number follows the admin order and doesn't change when filtering.
- **Only one action per row:** "Ler case →" (Read case) when there is a case, otherwise "Ver projeto ↗" (See project; new tab). The whole row is clickable and the title is the link for keyboard users.

### About

![About](img/index/sobre.jpg)

- **How I work** opens the page, as a numbered list of principles (title | description).
- **Professional summary** and **Outside work** in two columns.
- **My day to day** as plates: image, "Fig. 01 — …" caption and tags.
- **Interests:** the day-to-day tags (or, without tags, the Home services).
- **FAQ** as a definition list (question | answer).

### Blog

![Blog](img/index/blog.jpg)

- Header with the post count and the **"Assinar o RSS"** (Subscribe to RSS) link (`/rss.xml`).
- **Featured** at the top: date, reading time, title, summary (subtitle), tags, "Ler agora →" (Read now) and the image.
- **Index of the other posts:** Date | Title | Tags | Reading, with the post image in the label column on hover. Each row leads to `/blog/<slug>`.
- With no posts, the page shows "Nenhum artigo publicado ainda" (No articles published yet).

## Mobile

- Below 760px the labels move above the content and the text columns become one.
- Below 900px the tables become **list cards**: one card per item, with the fields stacked and each field's name on the left. On Portfolio, the sort buttons stay visible above the list. The preview disappears.
- The experience records stack period, role, company and summary.

## Accessibility

- Headings in order (h1 for the page, h2 for section labels, h3 inside them), `nav` with `aria-label`, `main` as the target of "Pular para o conteúdo".
- Projects and posts in `<table>` with a caption for screen readers; the preview is decorative (`aria-hidden`).
- Keyboard focus also inverts the row and shows the image. The focus outline uses `--text` (contrast guaranteed by the scheme).
- Animations (image and row inversion) only with `prefers-reduced-motion: no-preference`.

## Known limitations

- **Projects have no year or client fields.** The index uses the catalog number (admin order) instead of the year and the area (tags) instead of the client; sorting is by number and by name. With `year` and `client` fields in `Project`, the Year and Client columns and sorting by year plug straight in.
- **The profile has no city field**: the second line of the header shows "Arquivo de trabalhos, <ano>" instead of the city.
- Reading time is estimated (200 words per minute), as on the other blog pages.
- The preview caption truncates long titles with an ellipsis; the catalog number comes first so it stays visible.
