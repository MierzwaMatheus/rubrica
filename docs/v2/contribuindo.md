# Contribuindo na v2

Guia para quem trabalha no monorepo da v2 (pessoas e agentes). A arquitetura e as decisões estão no [RFC](../rfc/v2.md); este guia é o "como". Para estender o Rubrica **num projeto**, sem mexer no monorepo, os guias são [Criar um bloco](../guia/criar-bloco.md), [Criar um tema](../guia/criar-tema.md) e [Plugins](../guia/plugins.md#criar-um-plugin).

## Ambiente

- **Node 24** (`.nvmrc`). O Astro 7 pede Node ≥ 22.23.4. Com nvm: `nvm use` (ou `export PATH=$HOME/.nvm/versions/node/v24.22.2/bin:$PATH`).
- **pnpm 10**, na raiz: `pnpm install`.
- **A v1 para consulta** fica na branch `v1`. Para ler um arquivo: `git show v1:src/pages/Home.tsx`, ou abra a worktree de consulta (`git worktree add ../rubrica-v1 v1`, se ainda não existir). Não edite a v1.

## Estrutura

```
packages/core/              @rubrica/core
  src/i18n/                 idiomas (decisões 26 a 28) e textos de interface (ui-texts.ts)
  src/blocks/               contrato de blocos: campos (fields.ts), defineBlock e validação (define.ts),
                            catálogo (catalog/index.ts, CORE_BLOCKS)
  src/content/types.ts      modelo de conteúdo cru (páginas, coleções, site)
  src/render/               conteúdo cru → props do tema, por idioma; rotas do site
  src/theme/                contrato de tema (contract.ts: defineTheme, CORE_VARIANTS), receitas do núcleo
                            (recipes.ts), esquemas de cor (schemes.ts), fontes (fonts.ts)
  src/plugins/              contrato (contract.ts: definePlugin) e registro (registry.ts: CORE_PLUGINS)
  src/seo/                  <head>, JSON-LD, sitemap, robots
  src/components/           casca, templates e blocos padrão (React), DEFAULT_BLOCKS
  src/islands/              ilhas (o que leva JavaScript), CORE_ISLANDS
  src/styles/               base.css (tokens --rb-* e estrutura) e blocks.css (blocos padrão, só tokens)
  src/astro/                integração do Astro e páginas injetadas (inclui /admin e /admin/preview)
  src/convex/               backend: schema, funções por módulo (createRubrica, RUBRICA_MODULES), papéis
  src/admin/                painel (SPA React + Tailwind): telas (screens/), editor de páginas, prévia,
                            collections/ (lista e editor genéricos das coleções), proposals/ (formulário
                            da proposta), routes.ts (menu e acesso), data/demo*.ts (backend de demonstração em memória)
  src/data/                 fontes de dados do build (fixtures, Convex) e a vitrine (showcase.ts)
  test/                     testes do núcleo (vitest; test/convex/ com convex-test)
packages/themes/<id>/       um pacote por tema (@rubrica/theme-<id>)
packages/theme-tester/      a bateria de temas (rubrica-testar-tema)
packages/create-rubrica/    CLI (create, setup, config, update, ejetar, verificar, migrar...)
packages/mcp/               @rubrica/mcp, servidor MCP local (ver docs/v2/mcp.md); ferramentas em src/tools/
apps/demo/                  site de demonstração (fixtures em apps/demo/fixtures/<pessoal|empresa>;
                            convex/ é o projeto de referência das reexportações)
apps/docs/                  site e documentação (userubrica.vercel.app); scripts/ gera e confere os docs
docs/guia/                  guias de uso publicados no site (<nome>.md e <nome>.en.md)
docs/rfc/v2.md              decisões da v2
```

## Comandos

| O quê | Comando |
|---|---|
| Testes do núcleo | `pnpm --filter @rubrica/core test` |
| Tipos do núcleo | `pnpm --filter @rubrica/core check` |
| Build da demo (pessoal) | `pnpm --filter @rubrica/demo build` |
| Build da demo (empresa) | `SITE=empresa pnpm --filter @rubrica/demo build` |
| Demo com outro tema | `THEME=@rubrica/theme-cyberpunk pnpm demo` (ou `... pnpm --filter @rubrica/demo build`). Qualquer tema de `packages/themes` serve |
| Bateria de tema | `pnpm testar-tema padrao` (opções: `--site pessoal`, `--sem-lighthouse`, `--so-lighthouse`, `--sem-vitrine`, `--json out.json`, `--todos`; `--help` lista todas). A vitrine (`/vitrine/...`) acrescenta uma página por bloco com todas as variações do tema e as receitas. Na primeira vez: `pnpm --filter @rubrica/theme-tester exec playwright install chromium` |
| Painel (ponta a ponta, Playwright) | `pnpm --filter @rubrica/core test:e2e` (builda a demo e abre `/admin` com o backend de demonstração) |
| Painel no navegador | `pnpm demo` e abra `/admin` (com fixtures, o painel roda em memória; entra com o acesso já preenchido) |
| Catálogo de blocos da documentação | `pnpm docs:blocos` (regera `docs/guia/blocos.md` e `.en.md` do código) |
| Exemplos de código dos guias | `pnpm --filter rubrica-site check` (compila cada exemplo) |
| Site da documentação | `pnpm --filter rubrica-site build` (confere os links internos no fim) |
| Tudo | `pnpm -r check && pnpm -r test` |

## Regras do contrato

- **Componentes de tema e de bloco são React puros**: só props, sem `useState`, `useEffect`, contexto, nem busca de dados. O Astro os renderiza em HTML estático. O que precisa de JavaScript é **ilha** (`src/islands/`, registrada por nome em `CORE_ISLANDS`), e só blocos com `interactive: true` montam ilha. Tema não registra ilha.
- **O tema não cuida de `<head>`, SEO, JSON-LD nem do h1.** O h1 é do primeiro bloco quando ele é `hero` (`headingLevel === 1`); senão o núcleo põe um h1 oculto. Blocos usam `headingLevel` no título e `h3` dentro. Templates de post, case e 404 põem o próprio h1.
- **Textos de seção são campos do bloco; textos de interface vêm de `ctx.t(chave)`** (decisão 25). Chave nova de interface entra em `src/i18n/ui-texts.ts` com `pt`, `en` e `es`.
- **Links internos** passam por `ctx.href("/caminho")` (prefixo do idioma). Campos `link` já chegam resolvidos.
- **Nada de texto fixo em português no componente.** Ou é campo do bloco, ou é `ctx.t`.
- **Acessibilidade**: alvos de toque ≥ 44 px, contraste AA nos tokens, `alt` vindo do conteúdo, `aria-current` na navegação, imagens com `width`/`height` quando houver.
- **Mudar campo existente do catálogo é quebra de contrato** (decisão 30). Acrescentar bloco ou campo opcional pode; o resto precisa de discussão e migração.

## Adicionar um bloco ao núcleo

A forma do bloco é a mesma de um bloco de projeto ([Criar um bloco](../guia/criar-bloco.md) tem a referência completa dos campos e das props); muda onde cada parte mora.

1. **Definição** em `packages/core/src/blocks/catalog/index.ts`, com `defineBlock`, reaproveitando as constantes do topo (`anchor`, `heading`, `intro`). Acrescente em `CORE_BLOCKS`, na posição em que ele deve aparecer no painel. Bloco que depende de plugin leva `plugin`; bloco que lista coleção leva `source` (e some com o plugin dono da coleção desligado).
2. **Componente padrão** em `packages/core/src/components/blocks/` (no arquivo do grupo dele: `basic`, `lists`, `collections`, `contact`...), tipado com `ResolvedFields<typeof def.fields>`, e registrado em `DEFAULT_BLOCKS` (`components/index.ts`). Ele precisa funcionar com campos e itens vazios.
3. **CSS** em `packages/core/src/styles/blocks.css`, só com tokens `--rb-*`, na classe `.rb-<tipo>`. Os 14 temas herdam esse componente: confira cada um na vitrine.
4. **Ilha**, se o bloco é `interactive`: o componente em `src/islands/`, registrado em `CORE_ISLANDS` (e em `ISLAND_FOR_BLOCK` se o nome difere do tipo), com os prefixos de texto em `ISLAND_META`. Use `islandWhen` para não montar a ilha quando ela não serve.
5. **Textos de interface** novos em `src/i18n/ui-texts.ts` (`pt`, `en`, `es`).
6. **Fixtures**: use o bloco em `apps/demo/fixtures/<pessoal|empresa>/pages.json` (o `fixtures.test.ts` valida contra o catálogo).
7. **Testes**: o `blocks.test.tsx` confere o número de blocos e que cada um tem componente padrão; acrescente casos do que o bloco faz de próprio. O MCP lê o catálogo direto (`CORE_BLOCKS`), sem registro à parte.
8. **Variações**: se o componente padrão desenha mais de uma, declare em `CORE_VARIANTS` (`theme/contract.ts`).
9. **Documentação**: `pnpm docs:blocos` regera o catálogo; acrescente o inglês da descrição e das ajudas em `apps/docs/scripts/blocos/en.ts`. O teste do `rubrica-site` falha enquanto o catálogo estiver desatualizado.
10. **Bateria**: `pnpm testar-tema --todos --sem-lighthouse` passa o bloco por todos os temas.
11. **Changeset**: bloco novo é versão menor do `@rubrica/core` (`pnpm changeset`).

## Adicionar um tema

O guia de [Criar um tema](../guia/criar-tema.md) cobre o contrato e o passo a passo a partir do `padrao`. Para o tema entrar no monorepo e no CLI:

1. O pacote em `packages/themes/<id>/`, com `package.json` como os outros (nome `@rubrica/theme-<id>`, `exports` de `.`, `./styles.css` e `./fonts.json`, `"rubrica": { "contract": "^1" }`, `publishConfig`, `LICENSE`), e `tsconfig.json` estendendo o `tsconfig.base.json`.
2. A bateria completa passando: `pnpm testar-tema <id>` (com Lighthouse, nos dois tipos de site).
3. O tema no CLI, em `packages/create-rubrica/src/themes.ts`: o id em `PORTED_THEMES`, o visual padrão em `THEME_PACKAGE_DEFAULTS` (igual ao `scheme`, ao `colorMode` e ao `fonts.json` do pacote; o `alignment.test.ts` compara) e, se ele não vem de um layout da v1, uma entrada em `THEMES` como a do `padrao`.
4. O site: a miniatura da galeria (`apps/docs/scripts/shot-thumbnails.mjs`) e a linha na tabela de [Temas](../guia/temas.md), nos dois idiomas.
5. Changeset do pacote novo.

## Adicionar um plugin do núcleo

Plugin é um módulo do núcleo que declara num lugar só o que traz (decisão 19). Não há API pública para plugin de terceiros na 2.0: o caminho é este, dentro do monorepo.

1. **Registro.** Uma entrada em `CORE_PLUGINS` (`packages/core/src/plugins/registry.ts`) com `definePlugin`. O id é estável e entra no `--plugins` do CLI e no `site.plugins` do conteúdo:

<!-- exemplo: nucleo/src/plugins/exemplo-registro.ts -->
```ts
import { definePlugin } from "./contract";

export const contactDigest = definePlugin({
  id: "contact-digest",
  label: "Resumo de contatos",
  description: "Quantos pedidos de contato chegaram nos últimos dias, por situação.",
  kinds: ["pessoal", "empresa"],
  defaultEnabled: { pessoal: false, empresa: true },
  requires: ["contact-wizard"],
  admin: [{ path: "/admin/resumo-contatos", label: "Resumo", icon: "chart-bar", roles: ["root", "admin", "comercial"], group: "Comercial" }],
  mcpTools: ["contact_digest_get"],
});
```

   | Campo | Para quê |
   |---|---|
   | `kinds`, `defaultEnabled` | Em que tipos de site o plugin existe e se começa ligado em cada um |
   | `requires` | Plugins que precisam estar ligados junto (desligar um desliga os que dependem dele) |
   | `blocks` | Definições de bloco que vêm com o plugin. Os blocos do catálogo apontam para o plugin com o campo `plugin` |
   | `collections` | Coleções do plugin: os blocos que listam a coleção somem com ele desligado |
   | `routes` | `{ path, kind: "public" }` (página do site) ou `{ path, kind: "app", island }` (página do app com parâmetro, como a proposta) |
   | `pages` | Páginas fixas que só existem com o plugin (`/precos`): a página não é gerada e o item de menu some |
   | `admin` | Telas do painel: caminho, rótulo, ícone do Lucide, papéis e grupo do menu (`Site`, `Conteúdo`, `Comercial`, `Administração`) |
   | `mcpTools` | Nomes das ferramentas do MCP que o plugin acrescenta |

2. **Backend.** Um módulo em `packages/core/src/convex/<modulo>.ts` que devolve as funções a partir do runtime, confere o papel (`requireRole`, com uma permissão de `lib/roles.ts`) e o plugin (`requirePlugin` ou `isPluginOn`):

<!-- exemplo: nucleo/src/convex/exemplo-modulo.ts -->
```ts
import { v } from "convex/values";
import { requireRole } from "./auth";
import { isPluginOn } from "./plugins";
import type { RubricaRuntime } from "./runtime";
import { query } from "./server";

export function contactDigestFunctions(rt: RubricaRuntime) {
  return {
    /** Pedidos de contato dos últimos `days` dias, por situação. Vazio com o plugin desligado. */
    summary: query({
      args: { days: v.optional(v.number()) },
      handler: async (ctx, { days = 7 }) => {
        await requireRole(ctx, "contacts");
        if (!(await isPluginOn(ctx, rt, "contact-digest"))) return {};
        const since = Date.now() - days * 24 * 60 * 60 * 1000;
        const recent = await ctx.db
          .query("contactRequests")
          .withIndex("by_createdAt", (q) => q.gte("createdAt", since))
          .take(1000);
        const byStatus: Record<string, number> = {};
        for (const r of recent) byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
        return byStatus;
      },
    }),
  };
}
```

   Depois, em `convex/index.ts`: o módulo em `modules` dentro de `createRubrica`, o getter dele no objeto devolvido e o nome em `RUBRICA_MODULES`. Crie a reexportação em `apps/demo/convex/rubrica/<modulo>.ts` (o `reexports.test.ts` mostra o conteúdo esperado e falha se faltar); o CLI gera a mesma nos projetos. Tabelas novas entram no `convex/schema.ts` do núcleo (`rubricaTables`); permissão nova, em `PERMISSIONS`. Se o plugin guarda dado pessoal, escreva a fonte em `convex/personalData.ts` (exportação, exclusão e política de privacidade). Rotas HTTP e tarefas agendadas entram em `http` e `crons` do `createRubrica`.
3. **Painel.** A tela em `packages/core/src/admin/screens/` e o caminho dela no mapa `SCREENS` (`screens/index.tsx`); o menu sai do `admin` do registro e respeita papel e plugin (`routes.ts`). Para a tela funcionar no `pnpm demo`, acrescente os dados e as funções em `admin/data/demo*.ts`.
4. **MCP.** As ferramentas em `packages/mcp/src/tools/` (`ToolDef`: `name`, `title`, `description`, `access: { permission, plugin }`, `write` para quem grava, `input` e `handler`, que chama `ctx.client.query("rubrica/<modulo>:<função>")`), incluídas em `allTools()`. O `registry.test.ts` confere que cada nome de `mcpTools` existe e só aparece com o plugin ligado.
5. **CLI.** O `create`, o `config --plugins` e o `setup` leem o registro. Se o plugin precisa de chave de serviço, acrescente em `NEEDS_KEY` (`packages/create-rubrica/src/plugins.ts`) e no `setup`; se entra num pacote pronto (`freelancer`, `simple`), ajuste a lista.
6. **Textos e documentação.** Chaves de interface em `ui-texts.ts`; a linha do plugin na tabela de [Plugins](../guia/plugins.md) (pt e en); variáveis novas em [Variáveis de ambiente](../guia/variaveis.md).
7. **Testes.** Funções em `packages/core/test/convex/` (com `convex-test`: papel, plugin desligado, entradas inválidas), menu e acesso em `test/admin/routes.test.ts`, ferramentas em `packages/mcp/test/`.

## A bateria de temas

`pnpm testar-tema <tema>` constrói a demo nos dois tipos de site com o tema e a vitrine, e confere axe, um `h1`, `<head>` completo, rolagem horizontal a 360 px, console e rede sem erro, JavaScript por página (sem ilha, nada além do modo de cor; com ilha, até 120 KB gzip), hidratação e o Lighthouse (performance ≥ 90, acessibilidade e SEO ≥ 95). A tabela completa está em [Criar um tema](../guia/criar-tema.md#a-bateria-de-testes). Mudou algo que aparece no site (bloco, CSS do núcleo, casca), rode com `--todos --sem-lighthouse` antes de entregar.

## Documentação

- **Guias de uso** em `docs/guia/<nome>.md` e `<nome>.en.md`, publicados pelo `apps/docs`. Guia novo entra na navegação em `apps/docs/src/lib/docsContent.ts`. Links entre guias usam o nome em português (`./temas.md`); a âncora é a do título no idioma do arquivo.
- **O catálogo de blocos** (`docs/guia/blocos.md`) é gerado: não edite à mão, rode `pnpm docs:blocos`.
- **Exemplos de código** em ` ```ts ` ou ` ```tsx ` precisam de um marcador logo antes, `<!-- exemplo: <cenário>/<arquivo> -->`, com o cenário `projeto` (um projeto criado pelo CLI), `tema` (um pacote de tema) ou `nucleo` (arquivo novo dentro de `packages/core`). O `check` do `rubrica-site` compila todos; um bloco sem marcador falha.
- **Links**: o build do `rubrica-site` confere os links internos do `dist` e o teste dele confere os links entre guias, inclusive as âncoras.

## Commits

- **Microcommits**: cada commit faz uma coisa e deixa os testes passando. Prefira 10 commits pequenos a 1 grande.
- **Conventional Commits em inglês**, com escopo do pacote: `feat(core): ...`, `feat(theme-cyberpunk): ...`, `fix(cli): ...`, `test(core): ...`, `docs(v2): ...`, `docs(guide): ...`.
- **Sem linhas de atribuição** no commit.
- **Changeset** (`pnpm changeset`) em toda mudança que vai para um pacote publicado: `patch` para correção, `minor` para bloco, campo opcional ou plugin novo, `major` para quebra de contrato.
- Comentários e textos de interface do código em **pt-BR**, com acentuação.
- Nunca faça commit de `.env*`, segredos ou dados reais de clientes. Fixtures são fictícios.

## Antes de entregar

1. `pnpm -r check` e `pnpm -r test` passando.
2. Build da demo nos dois tipos (`pessoal` e `empresa`) quando mexer em algo que aparece no site.
3. Página sem ilha não carrega JavaScript (confira `dist/**/*.html`: só `/_rubrica/color-mode.js`).
4. Documentação em dia: guia nos dois idiomas, `pnpm docs:blocos` se mexeu no catálogo, `pnpm --filter rubrica-site build` sem link quebrado.
5. Resumo do que fez, do que ficou de fora e de qualquer decisão que você precisou tomar sozinho.
