# Languages

The site can have **a single language** or as many as you want. Each language has its own address, and the content is translated field by field in the panel.

## How it works

- You declare the **list of languages** (`pt-BR`, `en`, `es`, `fr`...) and pick which one is the **main** one.
- The main language has **no prefix** in the URL; the others go under `/<code>`: `/about` (main), `/en/about`, `/es/about`. The prefix code is the first part of the language (`pt-PT` becomes `/pt`). Two languages with the same prefix, such as `pt-BR` and `pt-PT` together, are not accepted.
- Any language can be the main one. An English site has `/` in English and `/pt` in Portuguese.
- With **a single language**, there is no prefix and no language switcher.
- Every page has `hreflang` and canonical for all the languages it exists in, which Google asks for.

## Content without a translation

Rubrica **only generates what is translated**:

- A post or page without a translation in a language **does not exist** in that language: it is left out of the lists, the sitemap, the RSS and the `hreflang`.
- The language switcher, on a page that doesn't exist in the other language, goes to that language's home.
- **Interface texts** (menu, buttons, forms, 404) without a translation fall back to the main language, so nothing shows up blank.
- The panel shows what is missing to translate on each item.

So you can launch the site in one language and translate bit by bit, with no empty pages and no 404s inside the site itself.

## Choose at creation

```bash
npx create-rubrica@latest my-site --idiomas pt-BR,en --idioma-principal pt-BR
```

Without `--idioma-principal`, the first in the list is the main one. Without `--idiomas`, the site starts in `pt-BR`.

## Change later

```bash
npx create-rubrica config --idiomas pt-BR,en,es
npx create-rubrica config --idioma-principal en
```

Before writing, the command warns about two things:

- **New language:** content only shows in it after it is translated.
- **New main language:** the URLs change (the main one has no prefix), so consider redirects.

The language list is technical configuration: only the `root` role can change it in the panel.

## Translate

Each translatable text field in the panel has a tab per language. You can translate in three ways:

1. **By hand**, in the panel.
2. **With the agent**: the MCP has the `traduzir-conteudo` prompt, which completes a language and shows the preview before writing. See [AI agents](./agentes.md).
3. **With AI in the panel**: turn on the **AI translation** plugin (it uses OpenRouter, with the `OPENROUTER_API_KEY` key). It fills in the "translate" button on each field. See [Integrations](./integracoes.md). It is a regular plugin: you can turn it off or swap it.

## Migrating from v1

The v1 site had Portuguese and English. In the migration, the main language is `pt-BR` and the `/en` URLs stay exactly the same. See [Migrating from v1](./migrar.md).
