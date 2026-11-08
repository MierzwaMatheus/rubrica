# Contribuindo na v2

Guia para quem trabalha no monorepo da v2 (pessoas e agentes). A arquitetura e as decisões estão no [RFC](../rfc/v2.md); este guia é o "como".

## Ambiente

- **Node 24** (`.nvmrc`). O Astro 7 pede Node ≥ 22.23.4. Com nvm: `nvm use` (ou `export PATH=$HOME/.nvm/versions/node/v24.22.2/bin:$PATH`).
- **pnpm 10**, na raiz: `pnpm install`.
- **A v1 para consulta** fica na branch `v1`. Para ler um arquivo: `git show v1:src/pages/Home.tsx`, ou abra a worktree de consulta (`git worktree add ../rubrica-v1 v1`, se ainda não existir). Não edite a v1.

## Estrutura

```
packages/core/            @rubrica/core
  src/i18n/               idiomas (decisões 26 a 28) e textos de interface
  src/blocks/             contrato de blocos: campos, validação, catálogo
  src/content/types.ts    modelo de conteúdo cru (páginas, coleções, site)
  src/render/             conteúdo cru → props do tema, por idioma; rotas do site
  src/theme/contract.ts   contrato de tema
  src/plugins/            contrato e registro de plugins
  src/seo/                <head>, JSON-LD, sitemap, robots
  src/components/         casca, templates e blocos padrão (React)
  src/islands/            ilhas (o que leva JavaScript)
  src/astro/              integração do Astro e páginas injetadas (inclui /admin e /admin/preview)
  src/admin/              painel (SPA React + Tailwind): telas, editor de páginas, prévia,
                          collections/ (lista e editor genéricos das coleções), proposals/ (formulário
                          da proposta), data/demo*.ts (backend de demonstração em memória)
  src/data/               fontes de dados do build (fixtures, Convex)
  test/                   testes do núcleo (vitest)
packages/themes/<id>/     um pacote por tema (@rubrica/theme-<id>)
packages/create-rubrica/  CLI
packages/mcp/             @rubrica/mcp, servidor MCP local (ver docs/v2/mcp.md)
apps/demo/                site de demonstração (fixtures em apps/demo/fixtures/<pessoal|empresa>)
apps/docs/                site de documentação (userubrica.vercel.app)
```

## Comandos

| O quê | Comando |
|---|---|
| Testes do núcleo | `pnpm --filter @rubrica/core test` |
| Tipos do núcleo | `pnpm --filter @rubrica/core check` |
| Build da demo (pessoal) | `pnpm --filter @rubrica/demo build` |
| Build da demo (empresa) | `SITE=empresa pnpm --filter @rubrica/demo build` |
| Build com outro tema | `THEME=@rubrica/theme-cyberpunk pnpm --filter @rubrica/demo build` |
| Bateria de tema | `pnpm testar-tema padrao` (opções: `--site pessoal`, `--sem-lighthouse`, `--so-lighthouse`, `--json out.json`; `--help` lista todas) |
| Painel (ponta a ponta, Playwright) | `pnpm --filter @rubrica/core test:e2e` (builda a demo e abre `/admin` com o backend de demonstração) |
| Painel no navegador | `pnpm demo` e abra `/admin` (com fixtures, o painel roda em memória; entra com o acesso já preenchido) |
| Tudo | `pnpm -r check && pnpm -r test` |

## Regras do contrato

- **Componentes de tema e de bloco são React puros**: só props, sem `useState`, `useEffect`, contexto, nem busca de dados. O Astro os renderiza em HTML estático. O que precisa de JavaScript é **ilha** (`src/islands/`, registrada por nome em `CORE_ISLANDS`), e só blocos com `interactive: true` montam ilha.
- **O tema não cuida de `<head>`, SEO, JSON-LD nem do h1.** O h1 é do primeiro bloco quando ele é `hero` (`headingLevel === 1`); senão o núcleo põe um h1 oculto. Blocos usam `headingLevel` no título e `h3` dentro.
- **Textos de seção são campos do bloco; textos de interface vêm de `ctx.t(chave)`** (decisão 25). Chave nova de interface entra em `src/i18n/ui-texts.ts` com `pt`, `en` e `es`.
- **Links internos** passam por `ctx.href("/caminho")` (prefixo do idioma). Campos `link` já chegam resolvidos.
- **Nada de texto fixo em português no componente.** Ou é campo do bloco, ou é `ctx.t`.
- **Acessibilidade**: alvos de toque ≥ 44 px, contraste AA nos tokens, `alt` vindo do conteúdo, `aria-current` na navegação, imagens com `width`/`height` quando houver.
- **Mudar campo existente do catálogo é quebra de contrato** (decisão 30). Acrescentar bloco ou campo opcional pode; o resto precisa de discussão e migração.

## Commits

- **Microcommits**: cada commit faz uma coisa e deixa os testes passando. Prefira 10 commits pequenos a 1 grande.
- **Conventional Commits em inglês**, com escopo do pacote: `feat(core): ...`, `feat(theme-cyberpunk): ...`, `fix(cli): ...`, `test(core): ...`, `docs(v2): ...`.
- **Sem linhas de atribuição** no commit.
- Comentários e textos de interface do código em **pt-BR**, com acentuação.
- Nunca faça commit de `.env*`, segredos ou dados reais de clientes. Fixtures são fictícios.

## Antes de entregar

1. `pnpm -r check` e `pnpm -r test` passando.
2. Build da demo nos dois tipos (`pessoal` e `empresa`) quando mexer em algo que aparece no site.
3. Página sem ilha não carrega JavaScript (confira `dist/**/*.html`: só `/_rubrica/color-mode.js`).
4. Resumo do que fez, do que ficou de fora e de qualquer decisão que você precisou tomar sozinho.
