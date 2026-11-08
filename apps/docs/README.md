# Site e documentação do Rubrica

O site público do Rubrica ([userubrica.vercel.app](https://userubrica.vercel.app)), em [Astro](https://astro.build), na identidade da marca (`docs/brand`). Tem o **combinador**: escolha tema, esquema de cores, modo e fontes e veja o site de demonstração funcionando. Mostra a documentação (`docs/guia/*.md`, em português e, quando existe o `.en.md` ao lado, em inglês) e o changelog (`CHANGELOG.md` da raiz).

Esta pasta é um app do monorepo (`rubrica-site`) e não vai para os projetos criados com o `create-rubrica`.

## Os previews são o site de verdade

O combinador não mostra imagens: mostra o site de demonstração (`apps/demo`), gerado uma vez para cada tema com os dados de exemplo, dentro de um iframe.

- `scripts/build-previews.ts` roda o `astro build --base /previews/<tema>` do `apps/demo` para cada um dos 14 temas e grava em `public/previews/<tema>/`. Depois ajusta o HTML (prefixo nos caminhos, `noindex`, tira o `/admin`) e injeta a ponte. Nada disso é versionado (`public/previews` está no `.gitignore`).
- `scripts/preview-bridge.js` vai no `<head>` de cada página. Na carga, lê da URL o modo, o esquema e as fontes (e guarda no `sessionStorage`, para valer nas páginas seguintes do preview); depois recebe do site as trocas de esquema e fontes ao vivo (`postMessage`) e avisa em que página o preview está. O código do site não muda.
- Temas, esquemas e fontes vêm de `packages/create-rubrica/src/themes.ts` e de `@rubrica/core` (`SCHEMES`): o combinador só oferece o que o CLI oferece. O comando da seção **Crie o seu** usa as opções do `create`.
- As miniaturas da galeria (`public/img/layouts/*.jpg`) são fotos dos próprios previews, geradas por `scripts/shot-thumbnails.mjs`. Regere quando um tema mudar.

## Rodar

Precisa do Node 24 e das dependências da raiz do monorepo:

```bash
export PATH=$HOME/.nvm/versions/node/v24.22.2/bin:$PATH   # ou: nvm use
pnpm install                                # na raiz do repositório
pnpm --filter rubrica-site previews         # gera os 14 previews (~1 min)
pnpm --filter rubrica-site dev              # http://localhost:4321
```

- `pnpm --filter rubrica-site build` gera só o site (`dist/`). Sem os previews gerados, o combinador abre um iframe vazio.
- `pnpm --filter rubrica-site build:full` gera os previews e o site: é o que a Vercel roda.

Miniaturas, com o site servido em algum endereço:

```bash
pnpm --filter rubrica-site build && pnpm --filter rubrica-site preview --port 4800 &
node apps/docs/scripts/shot-thumbnails.mjs --base http://127.0.0.1:4800
```

## Documentação

Os guias ficam em `docs/guia/`. Cada um tem o `<nome>.md` (português) e o `<nome>.en.md` (inglês). Links entre guias usam o nome em português (`./temas.md`): o site troca para o idioma da página. Para incluir um guia novo na navegação, acrescente o slug em `src/lib/docsContent.ts`. A documentação da v1 está arquivada em `docs/v1/` e não é publicada.

## Publicar na Vercel

Crie um projeto apontando para este repositório com **Root Directory** = `apps/docs`. O `vercel.json` desta pasta instala as dependências do monorepo, gera os previews e faz o build.
