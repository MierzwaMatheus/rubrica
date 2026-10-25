# Brutalism Terminal

> _Full hacker identity — monospace, no rounded corners._

![Brutalism Terminal home](img/brutalist/home.jpg)

<sub>Screenshots use the **Solar Warm** palette. See the layout in every palette in [Color schemes](./cores.md#brutalism-terminal).</sub>

## Concept

The whole site imitates a Unix terminal session. Each section is a **command** (`user@rubrica:~$ cat about.txt`) followed by its "output", and sections are separated by ASCII rules like `─── [ WHOAMI ] ────`. The whole interface uses a 13px monospace font, the maximum width is 1200px and **there is not a single rounded corner**: everything is a straight box with solid 1–2px borders in the text color.

Colors follow a fixed code: the **primary** paints commands, labels and highlights; the **accent** paints the prompt host and the markers (`›`, `#`, the dash in the rules); and the active or most important item appears **inverted** (text-colored background, background-colored text).

- **Recommended font:** JetBrains Mono — the layout uses `--font-mono` everywhere.
- **Template files:** `Layout.tsx`, `Navbar.tsx` and the 5 pages in `pages/`.

## Global structure

- **Window bar**: `[●][○][○]  rubrica:~/portfolio` on the left; on the right, the light/dark mode button ("modo escuro"/"modo claro"; on mobile only the icon, and only with the toggle on) and `tty1 · 80x40` (hidden on mobile).
- **Tabs as scripts**: `início.sh`, `currículo.sh`, `portfólio.sh`, `sobre-mim.sh`, `blog.sh`. The active tab is inverted and gets the `▶` marker; tabs for disabled plugins disappear.
- Status **footer**: `UTF-8 · LF · monospace` and `v1.0.0 · MIT`.
- On mobile, the tabs scroll horizontally.

## Pages

### Home

![Home](img/brutalist/home.jpg)

- The name becomes an **ASCII banner** generated with [figlet](https://github.com/patorjk/figlet.js) ("Big" font) in the primary; while it is generated, the name shows as large text.
- `cat /etc/motd` shows the **value statement** (`home.hero.headline`), the role and the "sobre" (about) text, followed by the `› Ver cases` and `› Fale comigo` buttons (the latter only with the contact form on).
- `[ STATS ]`: up to 4 **highlight numbers** (admin → Home → Números) in side-by-side boxes; it disappears when there are no numbers.
- `[ CASES EM DESTAQUE ]`: `ls -la cases/ --featured` shows the first 3 projects with a case, each with the first metric and the `$ cat case.md` link.
- `[ CAPABILITIES ]` lists the numbered services (`[01]`, `[02]`…).
- `cat clients/*.txt | head` shows the testimonials as files (`> from: nome <cargo>`), with the first one inverted.
- `[ CONTACT ]`: `./contato.sh` with two paths, `› Tenho um projeto` (I have a project) and `› Tenho uma vaga` (I have a job opening).
- `echo $CONTACT` prints `email=` and `phone=` depending on each one's visibility, and the page ends with a **blinking cursor**.

### Resume

![Resume](img/brutalist/curriculo.jpg)

- `[ RESUMO ]`: `cat summary.txt` with the first paragraph of "sobre", the highlight numbers and the `↓ Baixar CV (PDF)` button.
- Experience as **`git log --oneline --graph`**: each role is a commit, with the current period highlighted. The 2 most recent show; older ones sit behind `[+] ver experiências anteriores`.
- Skills **grouped by category** (`## design`, `## front-end`…) as chips, with no numeric level. Skills without a group go to `## stack`.
- Soft skills as `#hashtags-em-kebab`, languages as `Nome = "nível"`, education in `[edu]` boxes, courses numbered in 2 columns and volunteering in a `<pre>` block.

### Portfolio

![Portfolio](img/brutalist/portfolio.jpg)

- **Category filter** shaped like flags: `--todos`, `--produto-digital`, `--e-commerce`… The row disappears when no project has a category.
- `[ INDEX ]`: the project list in `ls -la` format (`drwxr-xr-x`, kebab-case-name/ and the category).
- `[ DETAILS ]`: one "README" per project, with an inverted `[01] ./nome/README.md` header, image, description, the **case's first metric** and `stack=[…]`. There is a single action: `$ cat case.md` when there is a case; otherwise, `$ open --demo` and `$ open --source` when there are links.

### About

![About](img/brutalist/sobre.jpg)

- `[ RESUMO PROFISSIONAL ]`: `head -n 30 ~/about.txt`, the "sobre" text in numbered paragraphs (`01|`), with the result numbers highlighted.
- `[ COMO EU TRABALHO ]`: `cat ~/method.md` with the work principles (admin → Home → Princípios) in numbered boxes; it disappears when there are no principles.
- `[ FORA DO TRABALHO ]`: `cat ~/offline.txt` with the personal text, after the professional one.
- `find ~/photos`: the day-to-day in a 3-column grid, with `img_001.jpg` captions.
- `cat faq.txt | less`: FAQ in `<details>` (`Q01.` / `A.`), the first one open and inverted.

### Blog

![Blog](img/brutalist/blog.jpg)

- `[ FEATURED ]`: the featured post in a box with a primary border and a `★ DESTAQUE ★` badge, with date, reading time, tags and the `$ open --post=<slug>` "button".
- A decorative search bar (`$ grep -r`, `--tags`, `--rss`).
- `[ INDEX.POSTS ]`: the posts as a **table** (#, date, title, tags, reading time) with zebra rows.

## Known limitations

- The pages use fixed grids (2 and 3 columns) with no breakpoints: on mobile, the content shrinks instead of reflowing.
- The Blog search bar is decorative, and the posts in the table do not have links yet.
