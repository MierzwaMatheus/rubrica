# Swiss Grid

> _12-column grid, strong typography, rigorous Swiss design._

![Swiss Grid home](img/swiss/home.jpg)

<sub>Screenshots use the **Paper Noir** palette. See the layout in every palette in [Color schemes](./cores.md#swiss-grid).</sub>

## Concept

Inspired by the International Typographic Style, the layout treats each page as a **poster sheet** built on a 12-column grid, which shows as dotted vertical lines in the headers. The type is heavy (weight 900, negative tracking, 88–132px titles) and labels are small, uppercase and spaced out.

Color comes in **solid blocks**: the primary and the accent become card backgrounds and keywords (with text in the background color), and the text color also becomes the background of inverted blocks. There are no rounded corners — the only circular shape is the avatar. Editorial numbering runs across pages: `.01` on Home up to `.16` on Blog, like chapters of one publication.

- **Recommended font:** Archivo — the layout only uses `--font-sans`, with no mono font.
- **Template files:** `Layout.tsx`, `Sidebar.tsx` (navigation), `SwissShared.tsx` (page frame) and the 5 pages in `pages/`.

## Global structure

- **Navigation** (`SwissNav`): a strip with an inverted "R", the name, "Portfolio · 2026" and the light/dark mode icon (also on mobile; the side menu repeats the button with text); below it, a bar of 5 equal columns numbered `.01`–`.05`. The active item and hover are inverted. Items for disabled plugins disappear; on mobile, it becomes a side menu.
- **Page frame** (`SwissShell`), on every page:
  - **Corners**: "Rubrica / surname / year" on the left; "Folha 0X / 05" (Sheet 0X / 05) and the chapter on the right.
  - **Masthead**: "Index — Portfólio Pessoal" over the name with the inverted initial (e.g. **A.** Rocha) and the current role on the right.
  - A 4-column **footer** with contact info.

## Pages

### Home (Folha 01)

![Home](img/swiss/home.jpg)

- A hero across 8 of the 12 columns with the **main headline** (text editable in Textos), the name in a primary block next to the role, and two buttons: **"Ver cases"** (See cases) and **"Fale comigo"** (Talk to me, opens the contact form). Avatar and "sobre" (about) text in the other 4 columns.
- **Numbers strip** right below the top: up to 4 results registered in the admin (Home → Números), the first one inverted. With no numbers, the strip goes back to showing the main stack.
- Chapter .02 **"Cases em destaque"** (Featured cases): the first 3 projects with a case study, with category, the case's first metric in a primary block and a link to the case.
- Chapter .03: the first 4 services in 4 columns, the first in a primary block.
- Chapter .04 "Vozes" (Voices): the first testimonial highlighted and inverted, the rest in a list beside it.
- Chapter .05: a primary closing block with two paths, **"Tenho um projeto"** (I have a project) and **"Tenho uma vaga"** (I have a job opening).

### Resume (Folha 02)

![Resume](img/swiss/curriculo.jpg)

- The **"Curriculum Vitæ."** title with "Vitæ." on the accent; next to it, the **summary** (first paragraph of "sobre") and the **"Baixar CV (PDF)"** (Download CV) button.
- A strip with the admin's **result numbers**; with no numbers, it shows roles, skills and certifications.
- Experience in 3-column rows: the 2 most recent open and older ones behind "ver experiências anteriores" (see earlier experience).
- **Skills grouped by area** (the "Grupo" field in the admin), as chips with no numeric level; skills without a group go to "Stack".
- Education, languages and soft skills side by side; courses and volunteering at the end.

### Portfolio (Folha 03)

![Portfolio](img/swiss/portfolio.jpg)

- The **"6 obras selecionadas."** (6 selected works.) title with the number in a primary block.
- A working `.filtros` bar **by category** ("Todos" (All) + the projects' categories). It is hidden when no project has a category.
- Projects in a 2-column grid with a 4:3 image, a large number, title, description, the case's first metric and up to 3 tags; the first project in an accent block.
- One action per project: **"$ cat case.md →"** when there is a case study, or "Ver projeto ↗" (See project) when there is only a demo link.

### About (Folha 04)

![About](img/swiss/sobre.jpg)

- The "Quem faz o trabalho e **como.**" (Who does the work, and how.) title with the last word in a primary block.
- **.13 Professional summary**: the "sobre" text in up to 3 paragraphs, the first with a drop cap and the result numbers highlighted.
- **.14 How I work**: the principles registered in the admin (Home → Princípios) in numbered columns, the first on the primary.
- **.15 Outside work**: the personal text, after the professional content.
- A day-to-day gallery in 6 columns (4:5 photos) and the FAQ in 3-column rows, the first inverted.

### Blog (Folha 05)

![Blog](img/swiss/blog.jpg)

- The **"Blog — 6 ensaios."** (Blog — 6 essays.) title with the number inverted.
- The featured post split into an image (5/12) and a primary panel with "★ Destaque", date, a 56px title, tags and "Ler agora →" (Read now).
- The other posts in a 3-column grid, numbered, one of them in an accent block.

## Known limitations

- Only the navigation, the numbers strip, the featured cases and the Home closing reflow on mobile; the rest of the pages use fixed grids and sizes.
- The Blog search is visual only (no action).
- The block highlights ("Vitæ.", "como.", resume numbers) put the background color on the primary/accent. In schemes whose accent is mid-tone in light mode (e.g. `midnight-blue`, `sorbet`, `tropicalia`), the contrast of these blocks is low.
- Some texts are hardcoded: "Portfolio · 2026", "Grid 12 · Helvetica", "Folha X / 05".
