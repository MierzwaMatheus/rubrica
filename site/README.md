# Site público do Rubrica

A página de apresentação do Rubrica, em [Astro](https://astro.build), na identidade da marca (`docs/brand`). Tem o **combinador**: escolha layout, esquema de cores, modo, textura e fontes e veja o resultado funcionando.

Esta pasta não vai para os projetos criados com o `create-rubrica` (o CLI a apaga, como faz com `templates/` e `cli/`).

## Os previews são o Rubrica de verdade

O combinador não mostra imagens: mostra o próprio app do Rubrica, compilado uma vez para cada layout com os dados de exemplo (`public/data`), dentro de um iframe.

- `scripts/build-previews.ts` monta cada layout com o próprio CLI (`scripts/lib/layoutProject.ts`), faz o build em `public/previews/<layout>/` e copia os dados de exemplo para `public/data` e `public/samples`. Nada disso é versionado.
- `scripts/preview-bridge.js` vai no `<head>` de cada build. Na carga, lê da URL a página, o modo, o esquema, as fontes e a textura; depois, recebe do site as trocas ao vivo (`postMessage`). O código do app não muda.
- Layouts, esquemas e fontes vêm de `cli/src` (`layouts.ts`, `themes/schemes.ts`, `themes/fonts.ts`): o combinador só oferece o que o CLI oferece.
- As miniaturas da galeria (`public/img/layouts/*.jpg`) são fotos dos próprios previews, geradas por `scripts/shot-thumbnails.mjs`. Regere quando um layout mudar.

## Crie o seu: o comando com a receita

Abaixo do combinador, a seção **Crie o seu** (`src/components/CreateYours.astro`, `src/lib/recipeForm.ts`) junta as escolhas do combinador com os dados da pessoa e monta `npx create-rubrica@latest <pasta> --receita <código>`. O código usa `cli/src/recipe.ts`, o mesmo módulo que o CLI usa para ler. Tudo acontece no navegador.

O combinador publica as escolhas em `src/lib/combinatorStore.ts`, e a seção se inscreve ali (recebe o estado atual mesmo que o combinador tenha iniciado antes). O formato da receita e o que não pode mudar nele estão em [Manutenção do CLI](../docs/cli/manutencao.md#a-receita-do-site).

## Rodar

Precisa das dependências da raiz do repositório (o build dos previews usa o app e o CLI):

```bash
pnpm install            # na raiz do repositório
cd site && pnpm install
pnpm previews           # gera os 13 builds de preview (~1-2 min)
pnpm dev                # http://localhost:4321
```

`pnpm build:full` gera os previews e o site (`dist/`). `pnpm build` só o site, reaproveitando os previews já gerados.

Miniaturas, com o site servido em algum endereço:

```bash
node scripts/shot-thumbnails.mjs --base http://127.0.0.1:4321
```

## Publicar na Vercel

Crie um projeto apontando para este repositório com **Root Directory** = `site`. O `vercel.json` desta pasta instala as dependências da raiz e do site, gera os previews e faz o build.
