# Create a block

An **own block** is a new section that the [catalog](./blocos.md) doesn't have: a certification badge strip, an opening-hours table, a service-area map. It lives in your project, shows up in the page editor like the core blocks, with a form and a preview, and the backend validates its fields.

Before creating one, check whether the smallest effort is enough:

1. **Settings and tokens**, in the panel or with `config`, to change colour, font and spacing.
2. **Own block** (this guide), for a section that doesn't exist.
3. **Ejected component**, when the block exists and you want different markup. See [Eject a component](./criar-tema.md#eject-a-component).

This guide assumes you know the basics of React and TypeScript.

## How a block works

A block has two parts:

- the **definition**, made with `defineBlock`: the type, the panel name and the **fields**. Fields are written once and serve three places: the panel form, validation in the backend (and in the MCP) and the component's props, already in the page's language;
- the **component**, a **pure** React component: it takes props and returns HTML. Astro turns it into static HTML at build time, with no JavaScript in the browser.

Both parts live in `src/blocks/`, and `src/blocks/index.ts` brings them together. A project created by the CLI already reads that file in two places, so there is nothing else to register:

- `astro.config.ts` passes `blocks: ["./src/blocks/index.ts"]` and its `components` to the integration (the site, the panel and the preview);
- `convex/rubrica.config.ts` passes the same `blocks` to `createRubrica` (the backend validates what the panel and the MCP save).

## Complete example: badges and certifications

A `selos` block showing badges with an image, year and link. Three files.

The definition:

<!-- exemplo: projeto/src/blocks/selos.ts -->
```ts
import { defineBlock, field } from "@rubrica/core";

export const selos = defineBlock({
  type: "selos",
  label: "Selos e certificações",
  description: "Selos, prêmios e certificações, com imagem, ano e link.",
  category: "comum",
  fields: {
    anchor: field.text({ label: "Âncora", localized: false, maxLength: 40, help: "Para links na página (#selos). Opcional." }),
    title: field.text({ label: "Título", maxLength: 140 }),
    intro: field.text({ label: "Texto de apoio", multiline: true, maxLength: 400 }),
    layout: field.select({
      label: "Disposição",
      options: [
        { value: "linha", label: "Em linha" },
        { value: "grade", label: "Em grade" },
      ],
      default: "linha",
    }),
    showYear: field.boolean({ label: "Mostrar o ano", default: true }),
    items: field.list({
      label: "Selos",
      itemLabel: "Selo",
      required: true,
      min: 1,
      max: 12,
      of: {
        name: field.text({ label: "Nome", required: true, maxLength: 80 }),
        image: field.image({ label: "Imagem", required: true }),
        year: field.number({ label: "Ano", integer: true, min: 1900, max: 2100 }),
        link: field.link({ label: "Link" }),
      },
    }),
  },
});
```

The component. The field types come from the definition itself, with `ResolvedFields`:

<!-- exemplo: projeto/src/blocks/Selos.tsx -->
```tsx
import type { BlockProps, ResolvedFields } from "@rubrica/core";
import { Heading, Img, Section, SectionHeader } from "@rubrica/core/components";
import type { selos } from "./selos";

type Fields = ResolvedFields<typeof selos.fields>;

export default function Selos({ id, variant, fields, headingLevel }: BlockProps<Fields>) {
  const items = fields.items ?? [];
  if (items.length === 0) return null;
  return (
    <Section id={id} anchor={fields.anchor} type="selos" variant={variant}>
      <SectionHeader title={fields.title} intro={fields.intro} level={headingLevel} />
      <ul className="rb-grid" data-layout={fields.layout}>
        {items.map((item, i) => (
          <li key={`${i}-${item.name}`} className="rb-card">
            {item.image && <Img image={item.image} sizes="12rem" />}
            <Heading level={3} className="rb-card__title">
              {item.name}
            </Heading>
            {fields.showYear && item.year !== undefined && <p className="rb-card__text">{item.year}</p>}
            {item.link && (
              <a href={item.link.href} {...(item.link.external && { rel: "noopener noreferrer", target: "_blank" })}>
                {item.link.label}
              </a>
            )}
          </li>
        ))}
      </ul>
    </Section>
  );
}
```

And the registration:

<!-- exemplo: projeto/src/blocks/index.ts -->
```ts
import type { BlockDefinition } from "@rubrica/core";
import { selos } from "./selos";

export const blocks: BlockDefinition[] = [selos];

/** Component of each own block: type → file (default export), from the project root. */
export const components: Record<string, string> = {
  selos: "./src/blocks/Selos.tsx",
};
```

Run `pnpm dev` (and `pnpm dev:convex`, so the backend knows the new block). In the panel, under **Páginas**, open a page and add a block: **Selos e certificações** is in the list, with the form generated from the fields and the preview in the theme in use.

## The definition: `defineBlock`

| Option | What for |
|---|---|
| `type` | Stable identifier, in lowercase letters, digits and hyphens (`selos`, `opening-hours`). It is saved in every page that uses the block: changing it later breaks those pages. It can't repeat a core type; pick a name that is clearly yours, because the core may gain new blocks |
| `label` | The block's name in the panel |
| `description` | One sentence on what it is for, shown in the panel |
| `category` | `comum` (personal and company sites), `pessoal` or `empresa`: the panel only offers the block in the right site type |
| `fields` | The fields (below) |
| `plugin` | Optional. Id of a core plugin (`blog`, `portfolio`...): with it off, the block disappears from the panel and the site |
| `source` | Optional. To list items from a core collection: `{ collections: ["projects"], default: { collection: "projects", limit: 3, sort: "order" } }`. The component gets the items in `items`. The default collection must be among the allowed ones |
| `interactive` | Optional. The block needs JavaScript in the browser. See [Block with JavaScript](#block-with-javascript) |
| `islandWhen` | Optional, with `interactive`. A function that takes the fields and the enabled plugins and says whether the island mounts (e.g. only with a button turned on). Without it, it always mounts |

`defineBlock` checks the `type` and the default collection and throws a clear error if something is wrong, at build time.

**Variants** are not part of the definition: they belong to the theme, and a theme only declares variants for blocks it knows. In an own block, when you want more than one design, use a `select` field (like `layout` in the example).

## The fields: `field.*`

Every field takes:

- `label` (required): the label in the panel;
- `help`: a help text under the field;
- `required`: the panel and the backend refuse the block without this field.

| Builder | Own options | What is stored | What the component gets |
|---|---|---|---|
| `field.text` | `localized` (default `true`), `multiline`, `maxLength` | Translatable: one text per language, `{ "pt-BR": "...", "en": "..." }`. With `localized: false`: a single text | `string` |
| `field.richText` | `localized` (default `true`) | HTML per language. The backend strips anything unsafe before saving | `string` with HTML: render it with `<Html html={...} />` |
| `field.number` | `min`, `max`, `integer` | A number | `number` |
| `field.boolean` | `default` | `true` or `false` | `boolean` (with no value, the `default`) |
| `field.select` | `options` (`[{ value, label }]`, required), `default` | The chosen `value` | The `value`, typed from the options (with no value, the `default`) |
| `field.image` | — | `{ url, storageId?, alt?, width?, height? }`, with `alt` per language | `{ src, alt, width?, height? }`: render it with `<Img image={...} />` |
| `field.link` | — | `{ label, href }`, with `label` per language | `{ label, href, external }`. An internal path already carries the language prefix |
| `field.list` | `of` (the fields of each item, required), `min`, `max`, `itemLabel` | A list of objects with the fields in `of` | A list of resolved objects |

Worth knowing:

- **In the component, every field is optional**, even `required` ones: a page can exist in a language where a translatable field was left empty. Handle `undefined`.
- A list item missing a required field in the language drops out of the list in that language.
- A link without a label in the language arrives as `undefined`.
- `maxLength` applies to each language of a translatable text.
- There is no `default` for text and number, and no `placeholder`. Use `help` to give an example.
- Unknown fields are refused: the backend only accepts the fields in the definition.

## The component

It gets these props (`BlockProps<Fields, Item>`):

| Prop | What it is |
|---|---|
| `id` | The block's id in the page. Pass it to `Section` |
| `variant` | The variant. In an own block it is always `"default"` |
| `fields` | The fields, resolved in the page's language |
| `items` | The collection items, if the block has a `source` (otherwise empty) |
| `headingLevel` | `1` when the block carries the page title, otherwise `2`. Use it on the section title |
| `index`, `total` | The block's position in the page (from 0) and how many visible blocks the page has |
| `ctx` | The page context (below) |
| `island` | The mounted island, in an `interactive` block |

`ctx` holds:

| Field | What it is |
|---|---|
| `ctx.locale` | The page language (`pt-BR`, `en`) |
| `ctx.t(key, vars?)` | An interface text from the core or the theme, in the language (e.g. `ctx.t("nav.skip")`) |
| `ctx.href(path)` | Internal path with the language prefix: `ctx.href("/blog")` becomes `/en/blog` |
| `ctx.formatDate(iso, style?)` | A date in the language; style `long`, `short` or `month` |
| `ctx.site` | The resolved site: name, type, navigation, social links, person or company, enabled plugins |
| `ctx.path`, `ctx.alternates` | The current path and the page's versions in the other languages |

The core also exports ready-made pieces in `@rubrica/core/components`: `Section` (the section with its anchor and the markup themes rely on), `SectionHeader` (title and intro at the right level), `Heading`, `Img` (responsive image, with `width` and `height`), `Html` (HTML from `richText`) and `LinkButton` (a link that looks like a button).

### Rules

- **Pure React.** Props only: no `useState`, `useEffect`, context or data fetching. The component runs at build time, not in the browser.
- **No hard-coded text.** Section text is a block field. An own block doesn't add interface keys: if you need a label, make it a field.
- **Headings.** The section title uses `headingLevel` (`SectionHeader` already does); items use `h3`. Never add an `h1` yourself: the core guarantees one per page.
- **Internal links** through `ctx.href`, or through `link` fields, which arrive ready.
- **Accessibility.** Images with the `alt` from the content (`Img` uses it), touch targets of at least 44 px, nothing that depends on colour alone.
- **Look.** `Section` and the classes every theme styles (`rb-grid`, `rb-card`, `rb-card__title`, `rb-card__text`) give the block the theme's look. For your own styles, import a CSS file in the component (`import "./selos.css";`): the build adds it to the site's CSS. Start selectors with the section class (`.rb-selos ...`) so they don't leak into other blocks, and use the `--rb-*` tokens (see [Create a theme](./criar-tema.md#tokens)) instead of fixed colours, so the block works with any scheme, in light and dark mode.

## Block with JavaScript

Almost every block is plain HTML. When you need JavaScript in the browser (a copy button, a filter), set `interactive: true` and register an **island** with the same name as the type, in the `islands` option of `astro.config.ts`. Add the line outside the sections between `rubrica:` markers, which the CLI rewrites:

<!-- exemplo: projeto/astro.config.ts -->
```ts
import { defineConfig } from "astro/config";
import rubrica from "@rubrica/core/astro";
import { components as ownComponents } from "./src/blocks";

export default defineConfig({
  site: "https://exemplo.com.br",
  integrations: [
    rubrica({
      // rubrica:tema:inicio
      theme: "@rubrica/theme-padrao",
      // rubrica:tema:fim
      source: process.env.RUBRICA_FIXTURES ? { fixtures: process.env.RUBRICA_FIXTURES } : undefined,
      blocks: ["./src/blocks/index.ts"],
      // Islands of own blocks: block type → file (default export).
      islands: { cupom: "./src/islands/Cupom.tsx" },
      // rubrica:ejetados:inicio
      blockComponents: {
        ...ownComponents,
      },
      // rubrica:ejetados:fim
    }),
  ],
});
```

The island is a regular React component (it may have state) and gets serializable props: `blockId`, `page`, `locale`, `fields` (the resolved fields), `site` and `privacyHref`. The core mounts it when it scrolls into view and hands it to the block component as `island`, so the component decides where it goes:

<!-- exemplo: projeto/src/blocks/cupom.ts -->
```ts
import { defineBlock, field } from "@rubrica/core";

export const cupom = defineBlock({
  type: "cupom",
  label: "Cupom",
  description: "Um código de desconto com botão de copiar.",
  category: "comum",
  interactive: true,
  fields: {
    title: field.text({ label: "Título", maxLength: 140 }),
    code: field.text({ label: "Código", localized: false, required: true, maxLength: 30 }),
    button: field.text({ label: "Texto do botão", required: true, maxLength: 30 }),
  },
});
```

<!-- exemplo: projeto/src/blocks/Cupom.tsx -->
```tsx
import type { BlockProps, ResolvedFields } from "@rubrica/core";
import { Section, SectionHeader } from "@rubrica/core/components";
import type { cupom } from "./cupom";

export default function Cupom({ id, variant, fields, headingLevel, island }: BlockProps<ResolvedFields<typeof cupom.fields>>) {
  return (
    <Section id={id} type="cupom" variant={variant}>
      <SectionHeader title={fields.title} level={headingLevel} />
      <p>
        <code>{fields.code}</code>
      </p>
      {island}
    </Section>
  );
}
```

<!-- exemplo: projeto/src/islands/Cupom.tsx -->
```tsx
import { useState } from "react";

interface Props {
  fields: { code?: string; button?: string };
}

export default function Cupom({ fields }: Props) {
  const [copied, setCopied] = useState(false);
  if (!fields.code) return null;
  return (
    <button type="button" onClick={() => navigator.clipboard.writeText(fields.code!).then(() => setCopied(true))}>
      {copied ? "✓" : fields.button}
    </button>
  );
}
```

Register `cupom` in `blocks` and `components` in `src/blocks/index.ts`, like `selos`. Every island adds weight to the page load. Prefer HTML and CSS (`<details>`, `:target`, a checkbox) whenever you can.

## Where the block shows up

- **Panel.** In the page editor, with the form generated from the fields (`help` under each one, `itemLabel` on each list item) and the live preview in the theme in use. Only in the site type of its `category`, and only with its `plugin` on.
- **Site.** In any theme: the project's component wins over the theme. With no component registered, the core uses a generic one.
- **MCP.** The agent saves the block like any other, with `type` and `fields`, and the backend validates it against your definition. The MCP catalog (`blocks_catalog`) lists only the core blocks, so tell the agent the block exists and which fields it has, or ask it to read `src/blocks/`.

## Checking

- `pnpm check` checks types: a misspelt field in the component, an option that doesn't exist in a `select`.
- The backend refuses invalid fields with one message per field (`Título: até 140 caracteres`), shown in the panel and the MCP. The function behind it is `validateBlock`, exported by `@rubrica/core`.
- In the browser, check the block on a phone and on desktop, in light and dark mode, with empty fields and with full lists.
- `pnpm test` (`npx create-rubrica verificar`) checks `convex/`, the theme and the ejected components; it doesn't look at own blocks.
- The [theme test battery](./criar-tema.md#the-test-battery) runs in the Rubrica monorepo, on the demo sites, and doesn't see your project's blocks either. If the block is useful to everyone, propose it for the core: then it goes through the battery in every theme (see [Contributing](../v2/contribuindo.md#adicionar-um-bloco-ao-núcleo)).
