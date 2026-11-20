# Rubrica 2.3.0

> Rascunho das entradas da 2.3.0, em pt e en. A entrada do `CHANGELOG.md` e do `CHANGELOG.en.md` vai na PR de release; o texto da release do GitHub é o bloco "Texto da release". Revise a data e os números de versão dos pacotes (o `changeset version` os define) antes de copiar.

## Entrada do CHANGELOG.md

```md
## 2.3.0 — AAAA-MM-DD

O corpo do case passa a ser feito de blocos, com blocos de marca e mídia e a opção de vestir o case com a cara do cliente. Tudo é opcional: um case no formato antigo continua aparecendo. Contrato de tema 1.4.

### Novidades
- **Case em blocos:** o corpo do projeto usa os mesmos blocos das páginas (`blocks` no projeto), sem `hero`, `contato` e `cases`, a partir do `h2`. No painel, editor de blocos e prévia do case no próprio projeto.
- **Blocos de marca e mídia:** antes e depois (com comparador deslizante), paleta de cores, tipografia, variações de marca e imagens (grade, mosaico ou carrossel, com GIF para animações curtas). O vídeo do YouTube e do Vimeo ganha capítulos.
- **Case com a cara do cliente:** cores (claro e escuro) e fonte de título do cliente só dentro do case (`brand` no projeto). O contraste mínimo é conferido ao salvar (4,5:1 no texto, 3:1 no destaque) e a fonte é baixada no build.
- **Blocos:** `contexts` (página, case ou os dois) e o campo `color`.
- **Temas:** o template de case recebe `blocks` e `brand`, e os 14 temas ganham o template e o CSS do case em blocos.
- **MCP:** as ferramentas `block_*` aceitam `project` (o corpo de um case), `blocks_catalog` filtra por `context` e o `brand` do projeto é validado antes de gravar.
- **`create-rubrica`:** o conversor da v1 leva os cases para blocos e o `update` lista a migração dos dados.

### Para quem atualiza
- **Migração de dados:** `projects-sections-to-blocks` converte `content` e `sections` em blocos `texto`. O `update` a roda no desenvolvimento; na produção, depois de publicar o backend: `npx convex run --prod rubrica/collections:migrateSectionsToBlocks` (idempotente).
- **Temas de terceiros e ejetados:** `sections` e `content` ficam obsoletos. O template de case deve mostrar `blocks`. Veja [Criar um tema](./docs/guia/criar-tema.md#o-template-de-case).
```

## Entrada do CHANGELOG.en.md

```md
## 2.3.0 — YYYY-MM-DD

The case body is now made of blocks, with brand and media blocks and the option to dress a case in the client's look. Everything is optional: a case in the old format keeps showing up. Theme contract 1.4.

### New
- **Case in blocks:** the project body uses the same blocks as pages (`blocks` on the project), without `hero`, `contato` and `cases`, starting at `h2`. In the panel, a block editor and a case preview right in the project.
- **Brand and media blocks:** before and after (with a sliding comparison), color palette, typography, brand variations and images (grid, mosaic or carousel, with GIF for short animations). YouTube and Vimeo video gains chapters.
- **A case in the client's look:** the client's colors (light and dark) and title font only inside the case (`brand` on the project). The minimum contrast is checked on save (4.5:1 for text, 3:1 for the accent) and the font is downloaded at build time.
- **Blocks:** `contexts` (page, case or both) and the `color` field.
- **Themes:** the case template receives `blocks` and `brand`, and the 14 themes get the case-in-blocks template and CSS.
- **MCP:** the `block_*` tools accept `project` (a case body), `blocks_catalog` filters by `context` and the project's `brand` is validated before saving.
- **`create-rubrica`:** the v1 converter carries cases over as blocks and `update` lists the data migration.

### If you are updating
- **Data migration:** `projects-sections-to-blocks` converts `content` and `sections` into `texto` blocks. `update` runs it on development; on production, after publishing the backend: `npx convex run --prod rubrica/collections:migrateSectionsToBlocks` (idempotent).
- **Third-party and ejected themes:** `sections` and `content` are deprecated. The case template must show `blocks`. See [Creating a theme](./docs/guia/criar-tema.en.md#the-case-template).
```

## Texto da release

# Rubrica 2.3.0

Cases com **blocos**, blocos de **marca e mídia** e a opção de vestir o case com a **cara do cliente**. Pensada para quem conta um trabalho visual (identidade, telas, vídeo) dentro do portfólio.

## O que há de novo

- **O corpo do case é feito de blocos**, os mesmos das páginas. No painel, o projeto ganha o editor de blocos e a prévia do case.
- **Cinco blocos novos:** antes e depois, paleta de cores, tipografia, variações de marca e imagens. O bloco de vídeo (YouTube ou Vimeo) ganha **capítulos**. Animação curta entra como GIF, pela biblioteca de imagens.
- **Case com a cara do cliente:** as cores e a fonte de título do cliente valem só dentro do case, com o contraste conferido ao salvar.
- **Agentes:** pelo MCP, as ferramentas `block_*` aceitam `project`, o catálogo filtra por `context` e a marca é validada.
- **Os 14 temas** desenham o case em blocos (contrato 1.4).

## Para quem atualiza

```bash
npx create-rubrica@latest update --dry-run
npx create-rubrica@latest update --yes
```

O `update` lista a migração `projects-sections-to-blocks` e a roda no desenvolvimento. Na produção, depois de publicar o backend e com o "ok" de quem cuida do site: `npx convex run --prod rubrica/collections:migrateSectionsToBlocks`. Os cases no formato antigo continuam aparecendo antes da migração. Temas de terceiros e componentes ejetados de case devem passar a mostrar `blocks` no lugar de `sections`. Passo a passo: [Atualizar o Rubrica](https://userubrica.vercel.app/docs/guia/atualizar).

---

# Rubrica 2.3.0 (English)

Cases made of **blocks**, **brand and media** blocks, and the option to dress a case in the **client's look**. Made for anyone telling visual work (identity, screens, video) inside a portfolio.

- **The case body is made of blocks**, the same as pages. In the panel, the project gets a block editor and a case preview.
- **Five new blocks:** before and after, color palette, typography, brand variations and images. The video block (YouTube or Vimeo) gains **chapters**. A short animation comes in as a GIF, through the image library.
- **A case in the client's look:** the client's colors and title font apply only inside the case, with contrast checked on save.
- **Agents:** through the MCP, the `block_*` tools accept `project`, the catalog filters by `context` and the brand is validated.
- **All 14 themes** draw the case in blocks (contract 1.4).
- **Updating:** `npx create-rubrica@latest update --yes` lists the `projects-sections-to-blocks` migration and runs it on development. On production, after publishing the backend and with the OK of whoever looks after the site: `npx convex run --prod rubrica/collections:migrateSectionsToBlocks`. Cases in the old format keep showing up before the migration. Third-party themes and ejected case components must show `blocks` instead of `sections`.

Full details: [CHANGELOG.en.md](https://github.com/MierzwaMatheus/rubrica/blob/main/CHANGELOG.en.md).
