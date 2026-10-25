# Zine

> _Collage: polaroids, tape, sticky notes and handwriting. Personal._

![Zine home page](img/zine/home.jpg)

<sub>Screenshots with the **Riso** scheme in light mode, paper texture. The layout uses the full scheme and works with any scheme, in both modes.</sub>

## Concept

The site is a **handmade fanzine**. Each section is a collage material: numbers become round stickers, cases become polaroids held with tape, "about" is a typewritten letter on lined paper, services are sticky notes, testimonials are pasted notes and contact is a cut-out coupon.

Everything sits in grid/flex in the normal flow, with small rotations. **Tape, stickers, blots and rotations never cover text**: the tape sits on the paper's edge (in the middle of the top edge or crossing only the corner triangle), and the color blots sit behind the photo, away from the text. On mobile the rotations drop to about a third and the decoration shrinks.

Scheme usage:

- **Primary** (with `--on-primary`): main ticket, first sticker, one sticky note, letter margin, hand-drawn underlines.
- **Accent** (`--accent`): second blot behind the photo and the background of missing photos.
- **Third color** (`--accent-2`): tape and highlighter, always translucent or mixed with the paper (`--zine-tape-solid`) so the text stays in `--text`. Never a solid text background.
- **Text** (`--text` on `--bg`): the role label and the "ink" sticker.
- The blots use `mix-blend-mode: multiply` in light mode and `screen` in dark mode.

- **Recommended fonts:** Bricolage Grotesque (main) and IBM Plex Mono (mono). The handwriting is **Caveat**, loaded by `Layout.tsx` itself with `<Helmet>`; without it, it falls back to Segoe Print / Bradley Hand / Comic Sans MS / `cursive`.
- **Recommended scheme:** Riso, light mode, paper texture.
- **Template files:** `Layout.tsx`, `ZineNav.tsx` (navigation and footer), `ZineShared.tsx` (styles, the layout's own strings in pt-BR/en-US and the materials: `Tape`, `Polaroid`, `PostIt`, `Sticker`, `TicketFace`, `Letter`, `HandTitle`) and the 5 pages in `pages/`.

## Global structure

- **Navigation**: a slightly rotated strip of tape, with the links in handwriting and the light/dark mode button (`ColorModeToggle`) at the end. The current page gets a wavy underline in the primary color. The links follow the plugins (resume, portfolio, about and blog disappear when turned off). On the right, the name in mono (desktop only).
- "Pular para o conteúdo" (Skip to content) link for keyboard users.
- **Footer**: "feito à mão por <primeiro nome> · <ano>" (handmade by <first name> · <year>) in handwriting, with email (if visible), GitHub and LinkedIn.
- Shared pages (post, case, testimonials…) get the margin from `Layout.tsx`.

## Pages

### Home

![Home](img/zine/home.jpg)

- **Cover**: "oi, eu sou <primeiro nome>!" (hi, I'm <first name>!) in handwriting, the role on a label, the value statement (`home.hero.headline`) on a rotated paper strip, the description in mono and two **torn tickets**: "Ver cases" (See cases; hidden when there are no cases) and "Fale comigo" (Talk to me; opens the form).
- On the right, the **profile polaroid** with a halftone in the primary color over the photo (or a dot pattern when there's no photo), two color blots behind it and the **round availability sticker** (only when on) over the photo area.
- **"em números"** (in numbers): up to 4 highlight numbers as round stickers (primary, ink, tape and dashed paper). The number size shrinks with its length, so it doesn't spill out of the circle. The band disappears when there are no numbers.
- **"coisas que fiz"** (things I made): the 3 featured cases as taped polaroids, the first metric in highlighter and "ler case →" (read case). Then "ver todos os projetos" (see all projects).
- **"uma cartinha"** (a little letter): the "about" text as a typewritten letter on lined paper with a colored margin, numbers highlighted and a handwritten signature. "mais sobre mim →" (more about me) when the about plugin is on.
- **"o que eu faço"** (what I do): the services as sticky notes in 4 shades.
- **"o que dizem por aí"** (what people are saying): up to 6 testimonials as pasted notes (handwritten text, cut at 220 characters), "Ver todos os depoimentos" (See all testimonials) and "Deixar meu depoimento" (Leave a testimonial) depending on the plugins.
- **Cut-out coupon**: dashed border, scissors, "Tem um projeto em mente?" (Have a project in mind?) and two checkboxes, "Tenho um projeto" (I have a project) and "Tenho uma vaga" (I have a job opening), which open the form in the right flow. Below, "recorte, marque e mande para <e-mail>" (cut, check and send to <email>).

### Resume

![Resume](img/zine/curriculo.jpg)

- Header with "Currículo" in handwriting, the summary (first paragraph of "about") on a paper strip and the **"Baixar CV (PDF)"** (Download CV) ticket.
- Highlight numbers as stickers.
- **"por onde andei"** (where I've been): the experiences on a typewritten sheet of lined paper; older ones sit behind "ver experiências anteriores" (see earlier experience).
- **Skills**: one sticky note per group ("Grupo" field in the admin), plus a soft skills sticky note. No numeric levels.
- **Taped index cards**: education, languages, courses and certifications, and volunteering. Each card disappears when empty.

### Portfolio

![Portfolio](img/zine/portfolio.jpg)

- "Portfólio" header in handwriting with the project count.
- **Category filter** on pieces of tape (the active tab turns primary). Without categories, the filter disappears.
- **Polaroid wall**: the first project gets the "★ destaque" (featured) seal and spans two columns (on desktop, when the filter is on "Todos", All). Each polaroid shows the category, the description, the **case's first metric in highlighter**, up to 4 tags and **only one action**: "ler case →" (read case) when there is a case, otherwise "ver projeto ↗" (see project; the project link). With neither, there is no action.

### About

![About](img/zine/sobre.jpg)

- **"Como eu trabalho"** (How I work) opens the page: the principles in a numbered list, each number on a round sticker.
- **"Resumo profissional"** (Professional summary): the "about" text as a typewritten letter, with the numbers in highlighter.
- **"Fora do trabalho"** (Outside work): the personal text on a sticky note and, next to it, the **interests** on pieces of tape (the day-to-day tags; without them, the services).
- **"Meu dia-a-dia"** (My day to day): polaroids with handwritten captions.
- **FAQ** as folded notes (`<details>`): the question in handwriting, the answer when opened.

### Blog

![Blog](img/zine/blog.jpg)

- "Blog" header in handwriting with the post count and the "assinar o RSS" (subscribe to RSS) link.
- **Featured clipping**, larger: seal, big title, date, reading time, subtitle in two newspaper columns, tags and "Ler agora →" (Read now), with the image beside it.
- The other posts as **newspaper clippings** pasted in a grid, with image, title (link to the post), date, reading time, subtitle and tags.

## Known limitations

- The cover line is "oi, eu sou <nome>!" with no article ("o"/"a"), because the layout doesn't know the person's gender.
- The RSS link points to `/rss.xml`, generated at build time by `scripts/generate-rss-feed.ts`. In development, without the build, the file doesn't exist.
- The lined-paper lines align with the letter text, but an experience description with HTML other than simple paragraphs and lists can drift a little off the lines.
- Projects with no case and no project link have no action on the wall.
- Long testimonials are cut at 220 characters on Home; the full text is at `/depoimentos`.
- In schemes whose third color equals the text color (Sumi, Alto Contraste), the tape and the highlighter turn gray.
