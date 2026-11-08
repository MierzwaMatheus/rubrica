# Block catalog

<!-- Gerado por apps/docs/scripts/blocos.ts a partir de packages/core. Não edite à mão: rode pnpm docs:blocos. -->

Every block that ships with the Rubrica core, with its fields. A block is a page section: you pick blocks in the panel's page editor, and each theme draws each one its own way.

This page is generated from the core's code. Field names (like `title`) are the ones the MCP and data files use; the label is what the panel shows, in Portuguese.

**Variants** are named designs a theme offers for the block (for example, `cases` as a grid or a list). The panel shows only the ones of the theme in use, and the first in each list is the default. When you switch themes, a variant the new theme lacks falls back to its default.

Need a section that isn't here? See [Create a block](./criar-bloco.md).

## The blocks

| Block | Panel name | What it is for | Site type | Plugin |
|---|---|---|---|---|
| [`hero`](#hero--hero) | Hero | Opening section: main title, supporting text, buttons and image. Carries the h1 when it is the page's first block. | personal and company | — |
| [`texto`](#texto--texto) | Texto | Title and free text, with an optional image beside it. | personal and company | — |
| [`numeros`](#numeros--números) | Números | Highlighted numbers (years of experience, clients, projects). | personal and company | — |
| [`lista-itens`](#lista-itens--lista-de-itens) | Lista de itens | Items with a title and text: working principles, values, differentiators, steps. | personal and company | — |
| [`cases`](#cases--cases) | Cases | Projects or cases from the collection, linking to each one's page. Shows the featured ones; with none featured, the first in the list. With no projects, the block disappears. | personal and company | `portfolio` |
| [`servicos`](#servicos--serviços) | Serviços | Services from the collection. | personal and company | — |
| [`depoimentos`](#depoimentos--depoimentos) | Depoimentos | Approved testimonials from the collection, with an optional invitation to send a new one. Shows the featured ones; with none featured, the first in the list. With no testimonials, the block disappears. | personal and company | `testimonials` |
| [`faq`](#faq--perguntas-frequentes) | Perguntas frequentes | Questions and answers from the collection. Outputs FAQPage JSON-LD. | personal and company | — |
| [`posts-recentes`](#posts-recentes--posts) | Posts | Blog posts. With an empty quantity, lists them all (the blog page). | personal and company | `blog` |
| [`cta`](#cta--chamada) | Chamada | Closing call with one or two paths (e.g. "I have a project" and "I have a role"). | personal and company | — |
| [`contato`](#contato--contato) | Contato | Contact form or wizard, with the channels (e-mail, WhatsApp, social). | personal and company | — |
| [`galeria`](#galeria--galeria) | Galeria | Images with a title and description: day to day, behind the scenes, the company's space. | personal and company | `about` |
| [`curriculo`](#curriculo--currículo) | Currículo | Experience, education and skills from the collection, with a PDF download. | personal only | `resume` |
| [`precos`](#precos--preços) | Preços | Plans from the collection side by side, each with its highlight and button. | company only | `pricing` |
| [`equipe`](#equipe--equipe) | Equipe | People from the collection, with photo, role and social links. | company only | `team` |
| [`localizacao`](#localizacao--localização) | Localização | Address, opening hours and map from the company details. | company only | — |
| [`logos-clientes`](#logos-clientes--logos-de-clientes) | Logos de clientes | A strip of client or partner logos. | company only | — |
| [`video`](#video--vídeo) | Vídeo | A YouTube or Vimeo video. Loads light: a thumbnail and a play button, and the player only after the click. | personal and company | — |
| [`incorporacao`](#incorporacao--incorporação) | Incorporação | A calendar, form, map or player from another service, by address, only from the allowed providers (Calendly, Cal.com, Google Calendar, Google Forms, Typeform, Tally, Google Maps, OpenStreetMap, Spotify, SoundCloud, Figma). | personal and company | — |
| [`linha-do-tempo`](#linha-do-tempo--linha-do-tempo) | Linha do tempo | Milestones in order: the company's history, a career path, the stages of a project. | personal and company | — |
| [`comparativo-planos`](#comparativo-planos--comparativo-de-planos) | Comparativo de planos | A table that compares the collection's plans item by item (rows = features, columns = plans), with each plan's button. | company only | `pricing` |

## `hero` — Hero

Opening section: main title, supporting text, buttons and image. Carries the h1 when it is the page's first block.

- **Site type:** personal and company
- **Plugin:** none: always available
- **Variants:** themes: `blueprint` (`apresentacao`, `folha`); `monograph` (`folha-de-rosto`, `capitulo`)

| Field | Panel label | Type | Required | Translatable | Help and limits |
|---|---|---|---|---|---|
| `eyebrow` | Sobretítulo | text | no | yes | up to 80 characters |
| `title` | Título | text | yes | yes | up to 160 characters |
| `subtitle` | Subtítulo | long text | no | yes | up to 400 characters |
| `primaryCta` | Botão principal | link | no | the label | — |
| `secondaryCta` | Botão secundário | link | no | the label | — |
| `image` | Imagem | image | no | the alt text | — |
| `tags` | Etiquetas | list | no | — | up to 8 items; each item: "Etiqueta" |
| `tags[].label` | Texto | text | yes | yes | up to 40 characters |
| `showAvailability` | Mostrar disponibilidade | yes or no | no | — | default: no |

## `texto` — Texto

Title and free text, with an optional image beside it.

- **Site type:** personal and company
- **Plugin:** none: always available
- **Variants:** themes: `brutalist` (`simples`, `numerado`); `chat` (`mensagens`, `pergunta`); `magazine` (`coluna`, `ensaio`); `poster` (`declaracao`, `corrido`); `zine` (`carta`, `postit`)

| Field | Panel label | Type | Required | Translatable | Help and limits |
|---|---|---|---|---|---|
| `anchor` | Âncora | text | no | no | Identifier for links within the page (#contact). Optional; up to 40 characters |
| `title` | Título | text | no | yes | up to 140 characters |
| `body` | Texto | rich text | yes | yes | — |
| `image` | Imagem | image | no | the alt text | — |
| `imagePosition` | Posição da imagem | choice | no | — | options: `start` (Antes do texto), `end` (Depois do texto); default: `end` |

## `numeros` — Números

Highlighted numbers (years of experience, clients, projects).

- **Site type:** personal and company
- **Plugin:** none: always available
- **Variants:** none: a single design in each theme

| Field | Panel label | Type | Required | Translatable | Help and limits |
|---|---|---|---|---|---|
| `anchor` | Âncora | text | no | no | Identifier for links within the page (#contact). Optional; up to 40 characters |
| `title` | Título | text | no | yes | up to 140 characters |
| `intro` | Texto de apoio | long text | no | yes | up to 400 characters |
| `items` | Números | list | yes | — | 1 to 8 items; each item: "Número" |
| `items[].value` | Valor | text | yes | no | E.g. 10+, 98%, $2M; up to 16 characters |
| `items[].label` | Rótulo | text | yes | yes | up to 60 characters |
| `items[].description` | Detalhe | text | no | yes | up to 140 characters |

## `lista-itens` — Lista de itens

Items with a title and text: working principles, values, differentiators, steps.

- **Site type:** personal and company
- **Plugin:** none: always available
- **Variants:** none: a single design in each theme

| Field | Panel label | Type | Required | Translatable | Help and limits |
|---|---|---|---|---|---|
| `anchor` | Âncora | text | no | no | Identifier for links within the page (#contact). Optional; up to 40 characters |
| `title` | Título | text | no | yes | up to 140 characters |
| `intro` | Texto de apoio | long text | no | yes | up to 400 characters |
| `numbered` | Numerar itens | yes or no | no | — | default: no |
| `items` | Itens | list | yes | — | 1 to 12 items; each item: "Item" |
| `items[].icon` | Ícone | text | no | no | Name of a Lucide icon (e.g. rocket); up to 40 characters |
| `items[].title` | Título | text | yes | yes | up to 100 characters |
| `items[].body` | Texto | long text | no | yes | up to 500 characters |

## `cases` — Cases

Projects or cases from the collection, linking to each one's page. Shows the featured ones; with none featured, the first in the list. With no projects, the block disappears.

- **Site type:** personal and company
- **Plugin:** `portfolio`: the block disappears when the plugin is off
- **Lists items from:** `projects` (default when created: featured only, 3 items, in panel order)
- **Variants:** core default component: `grade`, `lista` · themes: `bento` (`grade`, `destaque`); `blueprint` (`grade`, `destaque`); `brutalist` (`grade`, `lista`); `chat` (`lista`, `destaque`); `cyberpunk` (`grade`, `lista`); `desktop` (`grade`, `lista`); `garden` (`grade`, `destaque`); `index` (`indice`, `destaque`, `grade`); `magazine` (`grade`, `lista`); `monograph` (`sumario`, `pranchas`); `padrao` (`grade`, `lista`); `poster` (`cartaz`, `catalogo`, `faixa`); `swiss` (`grade`, `lista`); `zine` (`grade`, `destaque`, `lista`)

| Field | Panel label | Type | Required | Translatable | Help and limits |
|---|---|---|---|---|---|
| `anchor` | Âncora | text | no | no | Identifier for links within the page (#contact). Optional; up to 40 characters |
| `title` | Título | text | no | yes | up to 140 characters |
| `intro` | Texto de apoio | long text | no | yes | up to 400 characters |
| `cta` | Link para ver todos | link | no | the label | — |

## `servicos` — Serviços

Services from the collection.

- **Site type:** personal and company
- **Plugin:** none: always available
- **Lists items from:** `services` (default when created: in panel order)
- **Variants:** themes: `chat` (`lista`, `etiquetas`); `garden` (`canteiros`, `etiquetas`)

| Field | Panel label | Type | Required | Translatable | Help and limits |
|---|---|---|---|---|---|
| `anchor` | Âncora | text | no | no | Identifier for links within the page (#contact). Optional; up to 40 characters |
| `title` | Título | text | no | yes | up to 140 characters |
| `intro` | Texto de apoio | long text | no | yes | up to 400 characters |
| `cta` | Botão | link | no | the label | — |

## `depoimentos` — Depoimentos

Approved testimonials from the collection, with an optional invitation to send a new one. Shows the featured ones; with none featured, the first in the list. With no testimonials, the block disappears.

- **Site type:** personal and company
- **Plugin:** `testimonials`: the block disappears when the plugin is off
- **Lists items from:** `testimonials` (default when created: featured only, 6 items, in panel order)
- **JavaScript:** may mount an island (the interactive part, with JavaScript in the browser); the rest is static HTML
- **Variants:** none: a single design in each theme

| Field | Panel label | Type | Required | Translatable | Help and limits |
|---|---|---|---|---|---|
| `anchor` | Âncora | text | no | no | Identifier for links within the page (#contact). Optional; up to 40 characters |
| `title` | Título | text | no | yes | up to 140 characters |
| `intro` | Texto de apoio | long text | no | yes | up to 400 characters |
| `allowSubmission` | Convidar a enviar depoimento | yes or no | no | — | Shows the testimonial wizard button (needs the testimonials-intake plugin); default: no |

## `faq` — Perguntas frequentes

Questions and answers from the collection. Outputs FAQPage JSON-LD.

- **Site type:** personal and company
- **Plugin:** none: always available
- **Lists items from:** `faq` (default when created: in panel order)
- **Variants:** none: a single design in each theme

| Field | Panel label | Type | Required | Translatable | Help and limits |
|---|---|---|---|---|---|
| `anchor` | Âncora | text | no | no | Identifier for links within the page (#contact). Optional; up to 40 characters |
| `title` | Título | text | no | yes | up to 140 characters |
| `intro` | Texto de apoio | long text | no | yes | up to 400 characters |

## `posts-recentes` — Posts

Blog posts. With an empty quantity, lists them all (the blog page).

- **Site type:** personal and company
- **Plugin:** `blog`: the block disappears when the plugin is off
- **Lists items from:** `posts` (default when created: 3 items, newest first)
- **Variants:** themes: `chat` (`lista`, `destaque`); `garden` (`notas`, `lista`); `index` (`indice`, `destaque`); `magazine` (`sumario`, `colunas`); `zine` (`recortes`, `destaque`)

| Field | Panel label | Type | Required | Translatable | Help and limits |
|---|---|---|---|---|---|
| `anchor` | Âncora | text | no | no | Identifier for links within the page (#contact). Optional; up to 40 characters |
| `title` | Título | text | no | yes | up to 140 characters |
| `intro` | Texto de apoio | long text | no | yes | up to 400 characters |
| `cta` | Link para o blog | link | no | the label | — |
| `showTagFilter` | Filtro por etiqueta | yes or no | no | — | default: no |

## `cta` — Chamada

Closing call with one or two paths (e.g. "I have a project" and "I have a role").

- **Site type:** personal and company
- **Plugin:** none: always available
- **Variants:** none: a single design in each theme

| Field | Panel label | Type | Required | Translatable | Help and limits |
|---|---|---|---|---|---|
| `anchor` | Âncora | text | no | no | Identifier for links within the page (#contact). Optional; up to 40 characters |
| `title` | Título | text | yes | yes | up to 140 characters |
| `body` | Texto de apoio | long text | no | yes | up to 400 characters |
| `primary` | Botão principal | link | yes | the label | — |
| `secondary` | Botão secundário | link | no | the label | — |

## `contato` — Contato

Contact form or wizard, with the channels (e-mail, WhatsApp, social).

- **Site type:** personal and company
- **Plugin:** none: always available
- **JavaScript:** may mount an island (the interactive part, with JavaScript in the browser); the rest is static HTML
- **Variants:** none: a single design in each theme

| Field | Panel label | Type | Required | Translatable | Help and limits |
|---|---|---|---|---|---|
| `anchor` | Âncora | text | no | no | Identifier for links within the page (#contact). Optional; up to 40 characters |
| `title` | Título | text | no | yes | up to 140 characters |
| `intro` | Texto de apoio | long text | no | yes | up to 400 characters |
| `mode` | Formato | choice | no | — | options: `wizard` (Assistente em etapas), `form` (Formulário simples), `channels` (Só os canais, sem formulário); default: `wizard` |
| `showChannels` | Mostrar canais de contato | yes or no | no | — | default: yes |

## `galeria` — Galeria

Images with a title and description: day to day, behind the scenes, the company's space.

- **Site type:** personal and company
- **Plugin:** `about`, owner of the `routine` collection: the block disappears when the plugin is off
- **Lists items from:** `routine` (default when created: in panel order)
- **Variants:** none: a single design in each theme

| Field | Panel label | Type | Required | Translatable | Help and limits |
|---|---|---|---|---|---|
| `anchor` | Âncora | text | no | no | Identifier for links within the page (#contact). Optional; up to 40 characters |
| `title` | Título | text | no | yes | up to 140 characters |
| `intro` | Texto de apoio | long text | no | yes | up to 400 characters |

## `curriculo` — Currículo

Experience, education and skills from the collection, with a PDF download.

- **Site type:** personal only
- **Plugin:** `resume`: the block disappears when the plugin is off
- **Lists items from:** `resume` (default when created: in panel order)
- **JavaScript:** may mount an island (the interactive part, with JavaScript in the browser); the rest is static HTML
- **Variants:** none: a single design in each theme

| Field | Panel label | Type | Required | Translatable | Help and limits |
|---|---|---|---|---|---|
| `anchor` | Âncora | text | no | no | Identifier for links within the page (#contact). Optional; up to 40 characters |
| `title` | Título | text | no | yes | up to 140 characters |
| `intro` | Texto de apoio | long text | no | yes | up to 400 characters |
| `showDownload` | Botão de baixar PDF | yes or no | no | — | default: yes |

## `precos` — Preços

Plans from the collection side by side, each with its highlight and button.

- **Site type:** company only
- **Plugin:** `pricing`, owner of the `plans` collection: the block disappears when the plugin is off
- **Lists items from:** `plans` (default when created: in panel order)
- **Variants:** none: a single design in each theme

| Field | Panel label | Type | Required | Translatable | Help and limits |
|---|---|---|---|---|---|
| `anchor` | Âncora | text | no | no | Identifier for links within the page (#contact). Optional; up to 40 characters |
| `title` | Título | text | no | yes | up to 140 characters |
| `intro` | Texto de apoio | long text | no | yes | up to 400 characters |
| `note` | Observação | long text | no | yes | E.g. prices before tax; up to 300 characters |

## `equipe` — Equipe

People from the collection, with photo, role and social links.

- **Site type:** company only
- **Plugin:** `team`, owner of the `team` collection: the block disappears when the plugin is off
- **Lists items from:** `team` (default when created: in panel order)
- **Variants:** none: a single design in each theme

| Field | Panel label | Type | Required | Translatable | Help and limits |
|---|---|---|---|---|---|
| `anchor` | Âncora | text | no | no | Identifier for links within the page (#contact). Optional; up to 40 characters |
| `title` | Título | text | no | yes | up to 140 characters |
| `intro` | Texto de apoio | long text | no | yes | up to 400 characters |

## `localizacao` — Localização

Address, opening hours and map from the company details.

- **Site type:** company only
- **Plugin:** none: always available
- **Variants:** none: a single design in each theme

| Field | Panel label | Type | Required | Translatable | Help and limits |
|---|---|---|---|---|---|
| `anchor` | Âncora | text | no | no | Identifier for links within the page (#contact). Optional; up to 40 characters |
| `title` | Título | text | no | yes | up to 140 characters |
| `intro` | Texto de apoio | long text | no | yes | up to 400 characters |
| `showMap` | Mostrar mapa | yes or no | no | — | default: yes |
| `showHours` | Mostrar horário | yes or no | no | — | default: yes |

## `logos-clientes` — Logos de clientes

A strip of client or partner logos.

- **Site type:** company only
- **Plugin:** none: always available
- **Variants:** none: a single design in each theme

| Field | Panel label | Type | Required | Translatable | Help and limits |
|---|---|---|---|---|---|
| `anchor` | Âncora | text | no | no | Identifier for links within the page (#contact). Optional; up to 40 characters |
| `title` | Título | text | no | yes | up to 140 characters |
| `logos` | Logos | list | yes | — | 1 to 24 items; each item: "Logo" |
| `logos[].name` | Nome | text | yes | no | up to 80 characters |
| `logos[].image` | Logo | image | yes | the alt text | — |
| `logos[].href` | Link | text | no | no | up to 300 characters |

## `video` — Vídeo

A YouTube or Vimeo video. Loads light: a thumbnail and a play button, and the player only after the click.

- **Site type:** personal and company
- **Plugin:** none: always available
- **JavaScript:** may mount an island (the interactive part, with JavaScript in the browser); the rest is static HTML
- **Variants:** none: a single design in each theme

| Field | Panel label | Type | Required | Translatable | Help and limits |
|---|---|---|---|---|---|
| `anchor` | Âncora | text | no | no | Identifier for links within the page (#contact). Optional; up to 40 characters |
| `title` | Título | text | no | yes | up to 140 characters |
| `intro` | Texto de apoio | long text | no | yes | up to 400 characters |
| `url` | Endereço do vídeo | text | yes | no | A YouTube link (youtube.com/watch?v=…, youtu.be/…, /shorts/…) or a Vimeo link (vimeo.com/123456789); up to 300 characters |
| `caption` | Legenda | text | no | yes | Shown below the video and names the play button and the player for screen readers. Without it, the title is used; up to 200 characters |
| `poster` | Miniatura própria | image | no | the alt text | Optional on YouTube (without it, the video's thumbnail is used). On Vimeo, without an image only the play button shows |
| `aspect` | Proporção | choice | no | — | options: `16:9` (16:9 (paisagem)), `4:3` (4:3), `1:1` (1:1 (quadrado)), `9:16` (9:16 (vertical, Shorts e Reels)); default: `16:9` |

## `incorporacao` — Incorporação

A calendar, form, map or player from another service, by address, only from the allowed providers (Calendly, Cal.com, Google Calendar, Google Forms, Typeform, Tally, Google Maps, OpenStreetMap, Spotify, SoundCloud, Figma).

- **Site type:** personal and company
- **Plugin:** none: always available
- **Variants:** none: a single design in each theme

| Field | Panel label | Type | Required | Translatable | Help and limits |
|---|---|---|---|---|---|
| `anchor` | Âncora | text | no | no | Identifier for links within the page (#contact). Optional; up to 40 characters |
| `title` | Título | text | no | yes | up to 140 characters |
| `intro` | Texto de apoio | long text | no | yes | up to 400 characters |
| `url` | Endereço da incorporação | text | yes | no | The service's embed link: the src address, not the HTML code. Accepted providers: Calendly, Cal.com, Google Calendar, Google Forms, Typeform, Tally, Google Maps, OpenStreetMap, Spotify, SoundCloud, Figma; up to 2000 characters |
| `frameTitle` | Título acessível | text | yes | yes | Describes the content for screen readers (e.g. "Calendar to book a call"); up to 120 characters |
| `height` | Altura (px) | number | no | — | Optional. Without it, the provider's default height is used; 150 to 2000; integer |
| `showLink` | Link para abrir em nova aba | yes or no | no | — | Shows a link below to open the service outside the site; default: yes |

## `linha-do-tempo` — Linha do tempo

Milestones in order: the company's history, a career path, the stages of a project.

- **Site type:** personal and company
- **Plugin:** none: always available
- **Variants:** core default component: `vertical`, `horizontal`

| Field | Panel label | Type | Required | Translatable | Help and limits |
|---|---|---|---|---|---|
| `anchor` | Âncora | text | no | no | Identifier for links within the page (#contact). Optional; up to 40 characters |
| `title` | Título | text | no | yes | up to 140 characters |
| `intro` | Texto de apoio | long text | no | yes | up to 400 characters |
| `items` | Marcos | list | yes | — | 1 to 16 items; each item: "Marco" |
| `items[].date` | Data | text | yes | yes | Free text: 2019, Mar 2021, Today; up to 40 characters |
| `items[].title` | Título | text | yes | yes | up to 120 characters |
| `items[].body` | Texto | long text | no | yes | up to 600 characters |
| `items[].image` | Imagem | image | no | the alt text | — |

## `comparativo-planos` — Comparativo de planos

A table that compares the collection's plans item by item (rows = features, columns = plans), with each plan's button.

- **Site type:** company only
- **Plugin:** `pricing`: the block disappears when the plugin is off
- **Lists items from:** `plans` (default when created: in panel order)
- **Variants:** none: a single design in each theme

| Field | Panel label | Type | Required | Translatable | Help and limits |
|---|---|---|---|---|---|
| `anchor` | Âncora | text | no | no | Identifier for links within the page (#contact). Optional; up to 40 characters |
| `title` | Título | text | no | yes | up to 140 characters |
| `intro` | Texto de apoio | long text | no | yes | up to 400 characters |
| `caption` | Legenda da tabela | text | no | yes | A summary of the table for screen readers (and shown above it). Without it, the title is used, for screen readers only; up to 160 characters |
| `rows` | Recursos | list | yes | — | 1 to 40 items; each item: "Recurso" |
| `rows[].label` | Recurso | text | yes | yes | up to 120 characters |
| `rows[].detail` | Detalhe | text | no | yes | up to 200 characters |
| `rows[].cells` | Planos | list | no | — | One value per plan, in column order (the same as the block's plan list). A plan with no value shows a dash; up to 8 items; each item: "Plano" |
| `rows[].cells[].value` | Valor | choice | no | — | options: `sim` (✓ Incluso), `nao` (✗ Não incluso), `texto` (Texto); default: `sim` |
| `rows[].cells[].text` | Texto | text | no | yes | For the "Text" value (e.g. up to 5, unlimited); up to 60 characters |
| `note` | Observação | long text | no | yes | up to 300 characters |
