# Block catalog

<!-- Gerado por apps/docs/scripts/blocos.ts a partir de packages/core. Não edite à mão: rode pnpm docs:blocos. -->

Every block that ships with the Rubrica core, with its fields. A block is a page section: you pick blocks in the panel's page editor, and each theme draws each one its own way.

This page is generated from the core's code. Field names (like `title`) are the ones the MCP and data files use; the label is what the panel shows, in Portuguese. "When to use", "When not to use" and "Pairs well with" are each block's guidance, the same the MCP gives agents.

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

- **When to use:** The page's opening: the first block, with the main promise (it carries the h1), short supporting text and one or two buttons. One per page.
- **When not to use:** Away from the top or repeated on the page. For a call to action in the middle or at the end, use cta; to explain in paragraphs, texto.
- **Pairs well with:** [`numeros`](#numeros--números), [`logos-clientes`](#logos-clientes--logos-de-clientes), [`cases`](#cases--cases), [`servicos`](#servicos--serviços)
- **Site type:** personal and company
- **Plugin:** none: always available
- **Variants:** themes: `blueprint` (`apresentacao`, `folha`); `cyberpunk` (`inicio`, `pagina`); `monograph` (`folha-de-rosto`, `capitulo`); `padrao` (`inicio`, `pagina`)

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

- **When to use:** Explaining in paragraphs: a story, an about section, an approach, a policy. Takes an image beside it.
- **When not to use:** For parallel items (values, steps, differentiators), use lista-itens; for dated milestones, linha-do-tempo; for numbers, numeros. Never put an h1 in the body.
- **Pairs well with:** [`numeros`](#numeros--números), [`lista-itens`](#lista-itens--lista-de-itens), [`galeria`](#galeria--galeria), [`cta`](#cta--chamada)
- **Site type:** personal and company
- **Plugin:** none: always available
- **Variants:** themes: `brutalist` (`simples`, `numerado`); `chat` (`mensagens`, `pergunta`); `cyberpunk` (`default`, `pessoal`); `magazine` (`coluna`, `ensaio`); `padrao` (`default`, `pessoal`); `poster` (`declaracao`, `corrido`); `zine` (`carta`, `postit`)

| Field | Panel label | Type | Required | Translatable | Help and limits |
|---|---|---|---|---|---|
| `anchor` | Âncora | text | no | no | Identifier for links within the page (#contact). Optional; up to 40 characters |
| `title` | Título | text | no | yes | up to 140 characters |
| `body` | Texto | rich text | yes | yes | — |
| `image` | Imagem | image | no | the alt text | — |
| `imagePosition` | Posição da imagem | choice | no | — | options: `start` (Antes do texto), `end` (Depois do texto); default: `end` |

## `numeros` — Números

Highlighted numbers (years of experience, clients, projects).

- **When to use:** Three or four concrete numbers that give quick proof (years, clients, projects), right after the hero or a text.
- **When not to use:** Without real numbers the person has confirmed (don't make them up). Too many numbers dilute the highlight: up to four is ideal.
- **Pairs well with:** [`hero`](#hero--hero), [`texto`](#texto--texto), [`depoimentos`](#depoimentos--depoimentos)
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

- **When to use:** Parallel items with a title and short text: principles, values, differentiators, the steps of a process (numbered).
- **When not to use:** For dated milestones, use linha-do-tempo; for services with their own page, servicos; for questions and answers, faq.
- **Pairs well with:** [`texto`](#texto--texto), [`numeros`](#numeros--números), [`cta`](#cta--chamada)
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

- **When to use:** Showing work done (projects collection): the featured ones on the home page, the whole list on the portfolio or cases page.
- **When not to use:** With no projects the block disappears: create the projects first. To only show brands served, logos-clientes.
- **Pairs well with:** [`depoimentos`](#depoimentos--depoimentos), [`logos-clientes`](#logos-clientes--logos-de-clientes), [`cta`](#cta--chamada)
- **Site type:** personal and company
- **Plugin:** `portfolio`: the block disappears when the plugin is off
- **Lists items from:** `projects` (default when created: featured only, 3 items, in panel order)
- **Variants:** core default component: `grade`, `lista` · themes: `bento` (`grade`, `destaque`); `blueprint` (`grade`, `destaque`); `brutalist` (`grade`, `lista`); `chat` (`lista`, `destaque`); `cyberpunk` (`grade`, `lista`, `pagina`); `desktop` (`grade`, `lista`); `garden` (`grade`, `destaque`); `index` (`indice`, `destaque`, `grade`); `magazine` (`grade`, `lista`); `monograph` (`sumario`, `pranchas`); `padrao` (`grade`, `lista`, `pagina`); `poster` (`cartaz`, `catalogo`, `faixa`); `swiss` (`grade`, `lista`); `zine` (`grade`, `destaque`, `lista`)

| Field | Panel label | Type | Required | Translatable | Help and limits |
|---|---|---|---|---|---|
| `anchor` | Âncora | text | no | no | Identifier for links within the page (#contact). Optional; up to 40 characters |
| `title` | Título | text | no | yes | up to 140 characters |
| `intro` | Texto de apoio | long text | no | yes | up to 400 characters |
| `cta` | Link para ver todos | link | no | the label | — |

## `servicos` — Serviços

Services from the collection.

- **When to use:** Listing what is offered (services collection): a summary on the home page, the full list on the services page.
- **When not to use:** For prices, use precos or comparativo-planos; for a step-by-step way of working, lista-itens or linha-do-tempo.
- **Pairs well with:** [`faq`](#faq--perguntas-frequentes), [`depoimentos`](#depoimentos--depoimentos), [`cta`](#cta--chamada)
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

- **When to use:** Social proof with the collection's approved testimonials, close to a decision (before the cta or the contact).
- **When not to use:** Never write testimonials: only the ones the person received. With none approved, the block disappears.
- **Pairs well with:** [`cases`](#cases--cases), [`logos-clientes`](#logos-clientes--logos-de-clientes), [`cta`](#cta--chamada)
- **Site type:** personal and company
- **Plugin:** `testimonials`: the block disappears when the plugin is off
- **Lists items from:** `testimonials` (default when created: featured only, 6 items, in panel order)
- **JavaScript:** may mount an island (the interactive part, with JavaScript in the browser); the rest is static HTML
- **Variants:** themes: `cyberpunk` (`default`, `categorias`); `padrao` (`default`, `categorias`)

| Field | Panel label | Type | Required | Translatable | Help and limits |
|---|---|---|---|---|---|
| `anchor` | Âncora | text | no | no | Identifier for links within the page (#contact). Optional; up to 40 characters |
| `title` | Título | text | no | yes | up to 140 characters |
| `intro` | Texto de apoio | long text | no | yes | up to 400 characters |
| `allowSubmission` | Convidar a enviar depoimento | yes or no | no | — | Shows the testimonial wizard button (needs the testimonials-intake plugin); default: no |
| `cta` | Link para todos | link | no | the label | E.g. "See all testimonials", to the testimonials page. Optional |

## `faq` — Perguntas frequentes

Questions and answers from the collection. Outputs FAQPage JSON-LD.

- **When to use:** Answering recurring questions and objections (FAQ collection) on services, pricing or contact pages. Outputs FAQ structured data.
- **When not to use:** For continuous explanatory content, use texto. Avoid the same full FAQ on several pages.
- **Pairs well with:** [`servicos`](#servicos--serviços), [`precos`](#precos--preços), [`cta`](#cta--chamada)
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

- **When to use:** Blog posts: a few on the home page, all of them (empty quantity) on the blog page.
- **When not to use:** Without the blog plugin or published posts, it does not show. For a fixed notice, use texto or the site's announcement bar.
- **Pairs well with:** [`texto`](#texto--texto), [`cta`](#cta--chamada)
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

- **When to use:** Closing a page or section with a clear action (one or two buttons): talk, request a proposal, see plans. A whatsapp: link opens the chat.
- **When not to use:** At the top (that's the hero's place) or several in a row. Right before a contato block, it is usually redundant.
- **Pairs well with:** [`depoimentos`](#depoimentos--depoimentos), [`servicos`](#servicos--serviços), [`contato`](#contato--contato)
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

- **When to use:** Receiving contact requests (form or wizard) and showing the channels: at the end of the home page or on the contact page.
- **When not to use:** More than one per page. For just a button that leads to contact, use cta.
- **Pairs well with:** [`localizacao`](#localizacao--localização), [`faq`](#faq--perguntas-frequentes), [`cta`](#cta--chamada)
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
| `presentation` | Onde aparece | choice | no | — | In a window, the block takes no space on the page: it opens over it from links to the anchor (#contato), the sidebar's included. The channels are not shown; options: `inline` (Na página), `dialog` (Numa janela, aberta pelos links para a âncora); default: `inline` |
| `eyebrow` | Sobretítulo | text | no | yes | A short line above the title (e.g. portfolio / contact); up to 80 characters |
| `flows` | Assuntos do assistente | list | no | — | Optional, for the wizard format. Each topic has its own steps; the first screen lists the topics and a summary to review comes at the end. With no topics, the wizard asks for the topic, the message and the details; up to 6 items; each item: "Assunto" |
| `flows[].id` | Identificador | text | yes | no | Short and without spaces (e.g. project); up to 40 characters |
| `flows[].emoji` | Emoji | text | no | no | up to 16 characters |
| `flows[].label` | Rótulo | text | yes | yes | up to 80 characters |
| `flows[].steps` | Etapas | list | no | — | Without a contact details step, one is added at the end; up to 8 items; each item: "Etapa" |
| `flows[].steps[].kind` | Tipo | choice | no | — | options: `choice` (Escolha entre opções), `text` (Texto curto), `textarea` (Texto longo (vai como mensagem)), `contact` (Dados de contato); default: `choice` |
| `flows[].steps[].key` | Chave da resposta | text | no | no | Name of the answer in the request (e.g. timeline). In short text, several comma-separated keys become several inputs; up to 80 characters |
| `flows[].steps[].title` | Pergunta | text | no | yes | up to 160 characters |
| `flows[].steps[].options` | Opções | long text | no | yes | One per line (choice type); up to 1500 characters |
| `flows[].steps[].placeholder` | Exemplo dentro do campo | long text | no | yes | One per line when the step has several inputs; up to 400 characters |
| `flows[].steps[].optional` | Resposta opcional | yes or no | no | — | default: no |
| `flows[].steps[].askPhone` | Pedir telefone | yes or no | no | — | Only in the contact details step; default: no |
| `flows[].steps[].askLinkedin` | Pedir LinkedIn | yes or no | no | — | Only in the contact details step; default: no |
| `flows[].steps[].askCompany` | Pedir empresa | yes or no | no | — | Only in the contact details step; default: no |

## `galeria` — Galeria

Images with a title and description: day to day, behind the scenes, the company's space.

- **When to use:** Photos with a title and description (routine collection): day to day, behind the scenes, the company's space.
- **When not to use:** For logos, use logos-clientes; for the team's people, equipe; for a single image, texto with an image.
- **Pairs well with:** [`texto`](#texto--texto), [`equipe`](#equipe--equipe)
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

- **When to use:** The full résumé (experience, education, skills) with a PDF, on personal sites; it usually stands alone on the résumé page.
- **When not to use:** On the home page: there, prefer texto and numeros with a button to the résumé.
- **Pairs well with:** [`texto`](#texto--texto), [`cta`](#cta--chamada)
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

- **When to use:** Plans side by side as cards (plans collection), on the pricing page.
- **When not to use:** To compare feature by feature, use comparativo-planos (it can follow the cards). Don't make up prices.
- **Pairs well with:** [`comparativo-planos`](#comparativo-planos--comparativo-de-planos), [`faq`](#faq--perguntas-frequentes), [`cta`](#cta--chamada)
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

- **When to use:** Introducing the company's people (team collection), usually on the About us page.
- **When not to use:** For a single person, use texto with an image; for clients, logos-clientes or depoimentos.
- **Pairs well with:** [`texto`](#texto--texto), [`linha-do-tempo`](#linha-do-tempo--linha-do-tempo), [`numeros`](#numeros--números)
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

- **When to use:** The company's address, opening hours and map (from the company details), on the contact page.
- **When not to use:** Without an address or in-person service. For another service's map or calendar, use incorporacao.
- **Pairs well with:** [`contato`](#contato--contato), [`faq`](#faq--perguntas-frequentes)
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

- **When to use:** A strip of client or partner logos as quick social proof, right after the hero or near the cases.
- **When not to use:** Without permission to use the brands. For results told in full, use cases or depoimentos.
- **Pairs well with:** [`hero`](#hero--hero), [`cases`](#cases--cases), [`depoimentos`](#depoimentos--depoimentos)
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

- **When to use:** A YouTube or Vimeo video (introduction, demo, talk) that loads light: a thumbnail, and the player only on click.
- **When not to use:** For another service's calendar, map or form, use incorporacao. The main information shouldn't live only in the video: repeat the essentials in text.
- **Pairs well with:** [`texto`](#texto--texto), [`cta`](#cta--chamada)
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

- **When to use:** A calendar, form, map or player from an allowed provider (e.g. Calendly, Google Maps), by its embed address.
- **When not to use:** For YouTube or Vimeo videos, use video (lighter); to receive contacts on the site, contato. Providers outside the list are refused.
- **Pairs well with:** [`texto`](#texto--texto), [`contato`](#contato--contato), [`cta`](#cta--chamada)
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

- **When to use:** Milestones in order, with dates: the company's history, a career path, the stages of a project or of a process with deadlines.
- **When not to use:** For items with no order or date (values, differentiators), use lista-itens; for the whole résumé, curriculo.
- **Pairs well with:** [`texto`](#texto--texto), [`equipe`](#equipe--equipe), [`numeros`](#numeros--números)
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

- **When to use:** A table that compares the plans feature by feature, on the pricing page, when the difference between them is in the details.
- **When not to use:** With one or two simple plans, precos is enough. Don't make up features or values.
- **Pairs well with:** [`precos`](#precos--preços), [`faq`](#faq--perguntas-frequentes), [`cta`](#cta--chamada)
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
