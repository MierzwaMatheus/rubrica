# Jardim Digital

> _Notes with growth stages, backlinks and a link map — thinking in progress._

![Jardim Digital home page](img/garden/home.jpg)

<sub>Screenshots with the **Crepúsculo** scheme, dark mode and grain texture (the recommended combination).</sub>

## Concept

The site is the **entrance to a garden of notes**. Instead of a "finished" portfolio, each page is a note that grows: projects, posts and experiences get a **growth stage** (seed ○, sprout ◐, tree ●), the texts link terms to other parts of the site with a dotted underline, and a **fixed sidebar** shows the map of links between pages.

Reading happens in a narrow column (up to ~790px), with serif headings and plenty of breathing room. The **primary** color appears on the main buttons, on the stages and on the current page's node in the map; the **accent** marks the projects in the map. Cards use `--surface`, soft bands use `--subtle` and lines use `--line`, so the layout works with any scheme, in both modes.

- **Recommended fonts:** Fraunces or Source Serif 4 (main) and IBM Plex Mono (mono: breadcrumbs, dates, labels).
- **Recommended combination:** Crepúsculo scheme, dark mode, grain texture.
- **Template files:** `Layout.tsx`, `GardenSidebar.tsx`, `GardenShared.tsx` and the 5 pages in `pages/`.

## Growth stages

The stages come only from data that already exists; nothing is made up. The rule lives in `GardenShared.tsx` (`projectStage`, `postStage`, `experienceStage`) and is covered by `tests/app/templates/garden-stages.test.ts`.

| What | Tree ● | Sprout ◐ | Seed ○ |
|---|---|---|---|
| Project | has a case study page (slug + case) | has no case | — |
| Post | marked as featured | the others | published in the last 30 days (and not featured) |
| Experience | ended | the current one (period ending in "atual", "presente", "hoje", "present", "current"…) | — |

The dots are drawn in CSS (border, half filled, filled), always next to the stage name.

## Global structure

- **Fixed sidebar** (230px, `position: sticky`) with:
  - the garden's name ("Jardim de <primeiro nome>", <first name>'s garden) and the role;
  - the navigation (whatever a plugin turns off disappears), with the current page marked and `aria-current="page"`;
  - the stage legend;
  - the **garden map**: an SVG with the home page in the center, the other pages around it and the projects sprouting from the portfolio (trees filled, sprouts hollow). The links are the site's real links: home → pages, portfolio → projects, and (dashed) home → featured cases. The node for the current page (or the open case) is larger, in the primary color, with its name beside it;
  - the language switcher (only with the `i18n` plugin) and the `<ColorModeToggle />`.
- **Mobile and tablet (below 960px):** the sidebar becomes a top bar with the name, the mode button and a menu (Sheet) with the navigation and the legend. The map moves to the end of the page.
- "Pular para o conteúdo" (Skip to content) link at the start of the page; visible focus on all controls; animations (availability pulse, map halo) turned off with `prefers-reduced-motion`.
- Shared pages (post, case, testimonials, proposals) appear in the content column, with their own margin.

## Pages

### Home

![Home](img/garden/home.jpg)

- `jardim / início` breadcrumb, a chip with the count of trees and sprouts in the portfolio and an **availability** chip (when on).
- **"Oi! Eu sou <nome>."** (Hi! I'm <name>.), the value statement (`home.hero.headline`), the role and the description; pill buttons **"Ver cases"** (See cases) and **"Fale comigo"** (Talk to me; opens the form).
- **"Estado do jardim"** (State of the garden): the highlight numbers (up to 4; the section disappears when there are no numbers).
- **"Árvores do jardim"** (Trees in the garden): the 3 featured cases with thumbnail, stage + category, the first metric and "ler case →" (read case).
- **"Quem cuida do jardim"** (Who tends the garden): the about text, with site terms linked with a dotted underline (project names → case, skills → resume, post tags → blog) and the numbers in bold; below it, **"Ligada a"** (Linked to) with 3 real backlinks (the first case, the newest post and a page).
- **"Canteiros"** (Beds; "O que eu faço", What I do): the services as numbered garden beds.
- **"Livro de visitas"** (Guestbook): the testimonials (quote, name and role), with "Ver todos os depoimentos" (See all testimonials) and "Deixar meu depoimento" (Leave a testimonial) depending on the plugins.
- **"Plante uma conversa"** (Plant a conversation): "Tem um projeto em mente?" (Have a project in mind?) with "Tenho um projeto" (I have a project) and "Tenho uma vaga" (I have a job opening).

### Resume

![Resume](img/garden/curriculo.jpg)

- Title, summary (first paragraph of about) and **"Baixar CV (PDF)"** (Download CV).
- **"Estado do jardim"** with the same numbers as on Home.
- **"Linha do tempo do jardim"** (Garden timeline): the experiences on a vertical line with rings — the current one as a sprout ("em crescimento", growing), the ended ones as trees. Older ones sit behind "ver experiências anteriores" (see earlier experience).
- **"Canteiros de habilidades"** (Skill beds): one bed per group ("Grupo" field in the admin), with no numeric levels.
- Soft skills and languages side by side; education, courses and certifications, and volunteering in lists (each block disappears when empty).

### Portfolio

![Portfolio](img/garden/portfolio.jpg)

- **"Árvores e brotos"** (Trees and sprouts), with an explanation of the rule and the count.
- **Filter by bed** (the project categories, as pills with `aria-pressed`); it disappears when there are no categories.
- The first project becomes a wide, horizontal card; the others sit in the grid. Each card shows stage, category, the **case's first metric** and **only one action**: "ler case →" (read case) when there is a case (the whole card is the link), otherwise "ver projeto ↗" (see project; if there is a link).

### About

![About](img/garden/sobre.jpg)

- **"Regras do jardim"** (Garden rules; "Como eu trabalho", How I work): the work principles, numbered, opening the page.
- **"Resumo profissional"** (Professional summary; with linked terms) and **"Fora do trabalho"** (Outside work; the personal text).
- "Meu dia-a-dia" (My day to day) as a photo grid with captions; **"Interesses"** (Interests) reusing the service titles.
- FAQ with `<details>` (opens and closes without JavaScript) and **"Ligada a"** at the end, with real backlinks.

### Blog

![Blog](img/garden/blog.jpg)

- **"Notas do jardim"** (Garden notes) with the count and the **RSS** button.
- Notes grouped by stage: **trees** (featured) first, then **seeds** (last 30 days) and **sprouts**. Each note has stage, date, reading time, a title linking to `/blog/<slug>`, subtitle, the tags as beds and the cover on the right (hidden on mobile).

## Known limitations

- Testimonials have no date in the database, so the "Livro de visitas" numbers the visits ("visita 01", visit 01) instead of showing dates.
- The map shows up to 6 projects and has no nodes for posts; with many pages turned off, it looks emptier. The nodes are not clickable (the navigation is right above).
- Linked terms depend on the text quoting the exact name of a project, a skill or a post tag; only the first occurrence of each term becomes a link.
- The current experience's stage depends on the period ending with a word like "atual" or "presente".
- The sidebar is fixed to the screen height; on very short screens, it scrolls internally.
