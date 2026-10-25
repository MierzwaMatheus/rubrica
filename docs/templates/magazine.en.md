# Magazine

> _Classic editorial · serif display · asymmetric grid · generous white space._

![Magazine home](img/magazine/home.jpg)

<sub>Screenshots use the **Editorial Cream** palette. See the layout in every palette in [Color schemes](./cores.md#magazine).</sub>

## Concept

The portfolio as a **printed magazine**. There is a cover header with "Vol. 01 · No. 26" and "Est. MMXX", sections numbered in Roman numerals (§ I, § II…) and editorial labels like "Reportagem de Capa" (Cover Story), "Dossiê de Capacidades" (Capabilities Dossier) and "Sumário desta edição" (In this issue). Titles are display type (92–124px, weight 500, negative tracking); the serif feel comes from the recommended fonts, and labels and metadata use widely spaced uppercase mono.

The composition is **asymmetric** (`1.4fr 1fr`, `1.2fr 1fr`, `180px 1fr`) and uses a lot of white space, with thin 0.5px dividers. The **primary** paints large numerals, italic words in titles and drop caps; the **accent** paints section labels, side rules and credits.

- **Recommended fonts:** Bodoni Moda or IBM Plex Serif (main) and JetBrains Mono (mono).
- **Template files:** `Layout.tsx`, `Masthead.tsx` and the 5 pages in `pages/`.

## Global structure

- **Masthead** in three bands: the issue metadata (with the light/dark mode icon before "Est. MMXX", also on mobile; the mobile menu repeats the button with text); the **name in spaced uppercase** as the magazine title; and centered navigation, with the active item underlined in the primary.
- Items for disabled plugins disappear from the navigation (on desktop and in the mobile menu, which opens from the top).
- The content sits in a column up to 1200px wide.

## Pages

### Home

![Home](img/magazine/home.jpg)

- **"↘ Reportagem de Capa · cargo"** (Cover Story · role): the value statement becomes the headline, with the description in italics beside it and two buttons: "Ver cases" (See cases) and "Fale comigo" (Talk to me).
- **Numbers strip** right below the cover, with up to 4 results edited in the admin (Números tab). It disappears when there are no numbers.
- **"✦ Cases em destaque ✦"** (Featured cases): the first 3 projects with a case, each with a numeral, category, the case's first metric and the "Ler a reportagem" (Read the story) link.
- **"✦ Dossiê de Capacidades ✦"**: the services in columns, each with a large numeral on the primary.
- **"Vozes do Campo"** (Voices from the Field): one testimonial as a centered italic quote and the rest in columns.
- **"↘ Carta ao Leitor"** (Letter to the Reader): a closing section with two paths, "Tenho um projeto" (I have a project) and "Tenho uma vaga" (I have a job opening).

### Resume

![Resume](img/magazine/curriculo.jpg)

- The "_Curriculum_ Vitæ" title followed by a **summary**: the first paragraph of "sobre" (about) with a drop cap, the highlight numbers and the "Baixar CV (PDF)" (Download CV) button.
- Numbered sections: **§ I Trajetória Profissional** (Career), **§ II Catálogo de Habilidades** (Skills Catalog), § III Formação (Education), § IV Idiomas (Languages), § V Certificações e cursos (Certifications and courses), § VI Voluntariado (Volunteering).
- Experience in a grid: period and company in italics on the left, role and description on the right.
- Skills **grouped by category** (the "Grupo" field in the admin), with no numeric level. Skills without a group go to "Stack".

### Portfolio

![Portfolio](img/magazine/portfolio.jpg)

- The "_Obras_ Selecionadas" (Selected Works) title and the **"Seções desta edição"** (Sections in this issue) strip, which filters by category. The strip disappears when no project has a category.
- Projects as **zigzag stories**: image and text swap sides with each project, with a 64px numeral, category, a 44px title, an italic description and the case's first metric.
- One action per project: "Ler a reportagem" (Read the story) when there is a case, "Ver o projeto ↗" (See the project) when there is only a demo link.

### About

![About](img/magazine/sobre.jpg)

- The "Quem faz o _trabalho_, e _como_ ele é feito." (Who does the work, and how it is done.) title.
- **§ I Professional summary**: the "sobre" text with a drop cap and the numbers highlighted.
- **§ II How I work**: the work principles (Princípios tab in the admin) numbered in columns. It disappears when there are no principles.
- **"Ensaio Pessoal · Fora do trabalho"** (Personal Essay · Outside work): the personal side, after the professional one.
- The day-to-day as an **essay in text columns**, opening with a drop cap on the primary.
- FAQ as **"A Entrevista"** (The Interview): questions numbered "P 01", answers with an accent side rule.

### Blog

![Blog](img/magazine/blog.jpg)

- **"↘ Em Destaque"** (Featured): the featured post as a cover story, with a 96px title and an italic subtitle.
- **"§ Sumário desta edição"** (In this issue): the other posts as a magazine table of contents (number, title, tags and date).

## Known limitations

- The Home, Resume, Portfolio and About sections reflow on mobile, but the side padding stays fixed at 48px.
- Works in both modes with no adjustment: everything is ink (`--text`) on paper (`--bg`). In dark mode, the paper texture is much subtler.
- Blog posts still show with placeholder blocks, and the table of contents items do not have links yet.
