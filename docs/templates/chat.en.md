# Conversa

> _The site as a conversation: each section answers a ready-made question._

![Conversa home page](img/chat/home.jpg)

<sub>Screenshots with the **Alto Contraste** scheme, light mode. The layout uses the full scheme and works with any scheme, in both modes.</sub>

## Concept

**Closeness.** The whole site is a conversation with the portfolio owner, as in a messaging app. The visitor "asks" (bubbles on the right, in the primary color) and the person answers (bubbles on the left, in the surface color). There is no fake text field: the questions come ready-made and the navigation is a set of **quick replies** fixed at the bottom.

The conversation sits in a centered ~620px column. Answers use `--surface` with a `--line` border; questions use `--primary` with text in `--on-primary`; mini cards (numbers, cases, attachments) use `--bg` inside the bubble. Text links stay in the text color with a primary underline, so contrast doesn't depend on the primary over the background.

All content appears on load: nothing is hidden behind animation. The three "digitando…" (typing…) dots at the end of Home are decoration only (`aria-hidden`) and stop with `prefers-reduced-motion`.

- **Recommended scheme:** Alto Contraste, light mode, no texture.
- **Recommended fonts:** Instrument Sans (main) and IBM Plex Mono (mono: the "hoje" (today) marker, group labels, "encaminhada" (forwarded)).
- **Template files:** `Layout.tsx`, `ChatHeader.tsx`, `ChatShared.tsx` and the 5 pages in `pages/`.

## Global structure

- **Fixed header** (`ChatHeader.tsx`), like the top of a chat: avatar (the sidebar photo, or the initials on the primary color), name and status — availability with a primary dot when on, otherwise the role. On the right, the page links (following the plugins), the language switch (`i18n` plugin) and the `<ColorModeToggle />`. On mobile the links leave the header: navigation lives in the footer.
- **Quick-reply footer** (`Layout.tsx`): "Fale comigo" (Talk to me; opens the form, `contact-wizard` plugin) followed by links to the other pages — "Voltar ao início" (Back to home), "Ver projetos" (See projects), "Ver currículo" (See resume), "Quem é você?" (Who are you?), "Ler o blog" (Read the blog) — without the current page and without disabled ones. It uses `position: sticky`: it stays stuck to the bottom while the page scrolls and, at the end, returns to its place, so it never covers the end of the conversation. On mobile the replies sit in a row that scrolls sideways, with "Fale comigo" always in view.
- **Accessible sections:** each block is a `<section>` with a visually hidden heading ("Cases em destaque", "Experiência Profissional"…), so screen reader users can navigate by headings. Each page has an `<h1>` (on Home, the "Oi! Eu sou…").
- **App pages** (post, case, testimonials, proposals, checkout) get the frame with margin (`ct-shared`) and keep the header and footer.
- **Layout strings** (the questions, "hoje", "encaminhada", quick-reply labels) live in `ChatShared.tsx`, in pt-BR and en-US. The rest comes from the app's translations.

## Pages

### Home

![Home](img/chat/home.jpg)

- A "hoje" (today) marker and two intro bubbles: **"Oi! Eu sou {nome}."** (Hi! I'm {name}.) with the role and the value statement (`home.hero.headline`), then the description with **"Ver cases"** (See cases; jumps to the cases within the conversation) and **"Fale comigo"** (Talk to me).
- **"Me mostra uns números"** (Show me some numbers) → up to 4 highlight numbers in 2×2 mini cards. Without numbers, the question doesn't appear.
- **"Quais projetos você destaca?"** (Which projects do you highlight?) → "Esses três:" (These three:) and the cases as link cards (thumbnail, category and description, the case's first metric), each leading to `/portfolio/<slug>`, and "ver todos os projetos" (see all projects).
- **"Me conta mais sobre você"** (Tell me more about you) → one bubble per paragraph of "about", with the numbers highlighted, and "mais sobre mim" (more about me).
- **"O que você faz?"** (What do you do?) → the services as a list inside the bubble.
- **"Quem já trabalhou com você?"** (Who has worked with you?) → the testimonials as **forwarded messages**, with "Ver todos os depoimentos" (See all testimonials) and "Deixar meu depoimento" (Leave a testimonial) depending on the plugins.
- Final call **"Tem um projeto em mente?"** (Have a project in mind?) with "Tenho um projeto" (I have a project) and "Tenho uma vaga" (I have a job opening).

### Resume

![Resume](img/chat/curriculo.jpg)

- **"Me conta sua trajetória"** (Tell me about your career) → the summary (first paragraph of "about") and a **CV.pdf** attachment (file card) that generates and downloads the PDF.
- **"E em números?"** (And in numbers?) → the highlight numbers.
- **"Onde você já trabalhou?"** (Where have you worked?) → one experience per bubble. Older ones sit behind "ver experiências anteriores" (see earlier experience), which expands within the conversation (`aria-expanded`).
- **"Com o que você trabalha?"** (What do you work with?) → skills as chips grouped by the "Grupo" field, with no numeric levels.
- Soft skills, languages, education, courses and certifications, and volunteering, each with its own question. Empty blocks don't appear.

### Portfolio

![Portfolio](img/chat/portfolio.jpg)

- **"Me mostra seus projetos"** (Show me your projects) → "Tenho N projetos publicados por aqui. Quer ver de alguma área?" (I have N projects published here. Want to see a specific area?) and the categories as quick replies ("Todos" (All) + categories). Without categories, the filter disappears.
- Choosing a category **becomes a question in the conversation** ("Só os de E-commerce", Only the E-commerce ones) and the answer brings only the projects from that area.
- Projects as link cards; with no filter, the first becomes **featured** with a large image. Each card shows the case's first metric and **only one action**: the case when there is one, otherwise the project link (demo or code). With no link at all, the card isn't clickable.

### About

![About](img/chat/sobre.jpg)

- **"Como você trabalha?"** (How do you work?) → opens the conversation with the numbered work principles.
- **"Quem é você?"** (Who are you?) → the professional summary, one bubble per paragraph, with highlighted numbers.
- **"E fora do trabalho?"** (And outside work?) → the personal text, after the professional part.
- **"Como é o seu dia a dia?"** (What's your day to day like?) → the day-to-day photos in a gallery inside the bubble, with captions.
- **"No que você mais gosta de trabalhar?"** (What do you most like working on?) → the interests (the Home services) as chips.
- **FAQ as real question-and-answer pairs**: each FAQ question is a visitor bubble and each answer, a bubble from the person.

### Blog

![Blog](img/chat/blog.jpg)

- **"O que você tem escrito?"** (What have you been writing?) → "N textos até agora. Começa por este:" (N posts so far. Start with this one:) and the posts as **link previews**: the featured one first, with a large cover and the "Em Destaque" (Featured) badge, then the others with a thumbnail.
- Each preview shows title, subtitle, date, reading time and up to 4 tags, and leads to `/blog/<slug>`.
- At the end, "assinar o RSS" (subscribe to RSS) (`/rss.xml`, generated at build time).

## Known limitations

- The fixed footer takes ~60px of the screen while the page scrolls (at the end it returns to its place and covers nothing).
- Full-page screenshots taken with a viewport smaller than the page show the "sticky" header and footer in the middle of the image. It's an effect of the capture, not of the site; the screenshots in this doc were taken with a viewport the size of the page.
- Projects with no case, no demo and no repository appear as a card with no action.
- The portfolio filter isn't kept in the URL: reloading the page goes back to "Todos".
- The RSS link points to `/rss.xml`, which only exists when the feed is generated at build time.
