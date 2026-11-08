# Instruções para agentes

Este é um site feito com o **Rubrica v2**: um site em Astro com backend no Convex, que **depende** do pacote `@rubrica/core` e de um tema `@rubrica/theme-<id>` em vez de copiar um template. O projeto guarda só configuração e personalizações. O CLI `create-rubrica` (também chamado de `rubrica`) cria, configura, publica, atualiza e migra o projeto. Siga estas regras ao trabalhar aqui.

> Se o `origin` deste repositório for o próprio `MierzwaMatheus/rubrica`, você está no monorepo do Rubrica, não num site: siga `docs/v2/contribuindo.md`. Este arquivo vai junto para os projetos criados: mantenha-o válido para eles ao mudar o CLI.

## O essencial
- **Conteúdo ou código?** Textos, páginas e blocos, posts, cases, currículo, serviços, planos, cores e o que mais aparece no painel são **conteúdo**, guardado no Convex: leia e grave pelo **MCP do Rubrica** (`rubrica mcp`, já configurado no `.mcp.json`; ele fala com o Convex com o login de um usuário do painel e mostra uma prévia antes de gravar). Layout, blocos próprios e componentes ejetados são **código** deste repositório.
- **O que é de quem:**
  - `astro.config.ts`: configuração do site. Os trechos entre marcadores `rubrica:` (tema e componentes ejetados) são do CLI.
  - `convex/rubrica/*.ts`, `convex/auth.ts`, `convex/http.ts`, `convex/crons.ts`: **gerados**, uma linha que reexporta as funções do núcleo. Não edite: o `update` regenera. Tabelas e funções próprias do projeto vão em outros arquivos do `convex/` (e as tabelas, depois de `...rubricaTables` no `convex/schema.ts`).
  - `src/blocks/`: blocos próprios (definição com `defineBlock` + componente React puro). O site e o backend leem a lista de `src/blocks/index.ts`.
  - `src/overrides/`: componentes ejetados com `rubrica ejetar`. Quem ejeta passa a cuidar deles; o `update` avisa quando o original mudou.
  - `rubrica.json`: estado do projeto, mantido pelo CLI. **Não edite à mão.**
- **Componentes são React puros**: só props, sem estado, efeito, contexto nem busca de dados. O Astro gera HTML estático; o que precisa de JavaScript é ilha do núcleo. Nada de texto fixo no componente: ou é campo do bloco, ou é texto de interface (`ctx.t("chave")`). Links internos por `ctx.href("/caminho")`.
- **Dois bancos.** O `.env.local` aponta para o Convex de **desenvolvimento** (o site do computador). O site no ar usa o de **produção**, cujo endereço fica em `producao` no `rubrica.json`. Antes de rodar qualquer comando que grave no Convex, leia o `CONVEX_DEPLOYMENT` do `.env.local` naquele instante e diga em qual dos dois vai rodar.
- **`npx convex deploy` publica sempre em produção.** Só com o "ok" explícito da pessoa. Para o banco do computador, use `npx convex dev --once`. Nunca rode `npx convex import --replace-all` ou outra operação que apague dados em massa sem pedido explícito para aquele banco. Precisa de banco vazio? Crie um deployment novo.
- **Gerenciador de pacotes:** `pnpm` se existir `pnpm-lock.yaml`, `npm` se existir `package-lock.json`. Os exemplos abaixo usam `pnpm`.
- **Não toque** em `.env*` (nunca mostre nem faça commit deles).
- **Conferir mudanças de código:** `pnpm check` (tipos), `pnpm test` (roda `rubrica verificar`: confere o `convex/` gerado, o tema e os ejetados) e `pnpm build`. O build lê o Convex de `CONVEX_URL`; para buildar sem banco, use `RUBRICA_FIXTURES=<pasta com site.json e pages.json> pnpm build`. `pnpm dev` sobe o site e `pnpm dev:convex` o Convex de desenvolvimento (ficam rodando; pare quando terminar).

## O CLI: quem roda o quê
Rode os comandos na raiz do projeto. Alguns são interativos e fazem perguntas que você não consegue responder: peça para a pessoa rodar no terminal dela. No Claude Code ela pode digitar `! ` antes do comando, no próprio prompt.

| Comando | Para quê | Quem roda |
|---|---|---|
| `npx create-rubrica@latest update --dry-run` | Mostra o que uma atualização faria (pacotes, `convex/` gerado, migrações de dados, ejetados cujo original mudou), sem gravar | Você |
| `npx create-rubrica@latest update --yes` | Aplica a atualização | Você, depois do "ok" da pessoa |
| `npx create-rubrica setup` | Conecta o Convex, grava as variáveis, cria o root, monta o conteúdo inicial e liga integrações (Telegram, e-mail, OpenRouter, Asaas, deploy hook) | A pessoa: pede senha e chaves |
| `npx create-rubrica config` | Troca identidade, tipo, tema, esquema de cores, idiomas, plugins ou o analytics (`--analytics <script> --analytics-id <id>`, que também libera a origem na CSP) | A pessoa |
| `npx create-rubrica publicar` | Põe o site no ar na Vercel, ou publica de novo | A pessoa, a pedido dela: publica em produção |
| `npx create-rubrica senha` | Troca a senha do painel e libera o login bloqueado | Sempre a pessoa. A senha nunca passa pela conversa |
| `npx create-rubrica ejetar <bloco>` | Copia o componente do bloco (do tema ou do núcleo) para `src/overrides/` e passa a usar a cópia | Você, com o "ok" da pessoa |
| `npx create-rubrica verificar` | Confere o `convex/` gerado, o tema instalado e os ejetados (é o `pnpm test`) | Você |
| `npx create-rubrica testar-tema [tema]` | Bateria de testes de tema (axe, SEO, JavaScript por página, Lighthouse) | Você |
| `npx rubrica mcp` | Servidor MCP local (o `.mcp.json` já o inicia) | O agente |
| `npx create-rubrica@latest migrar` | Leva um projeto da v1 para a v2 | A pessoa, com você acompanhando |
| `npx create-rubrica telemetria [ligar\|desligar]` | Mostra, liga ou desliga a telemetria anônima do CLI neste projeto | Você, a pedido da pessoa |

Referência completa: [Comandos do CLI](https://userubrica.vercel.app/docs/guia/cli).

## Personalizar
Do menor para o maior esforço (prefira sempre o menor):
1. **Configuração e tokens**: cores, fontes e textos pelo painel (MCP) ou `npx create-rubrica config`.
2. **Bloco próprio** em `src/blocks/` (definição + componente), registrado em `src/blocks/index.ts`. Aparece no editor de páginas como os outros.
3. **Componente ejetado**: `npx create-rubrica ejetar <bloco>`. Só quando o bloco existe mas precisa de outra marcação.

## Atualizar o Rubrica
1. **Ponto de partida limpo.** `git status` precisa estar sem mudanças. Se houver, peça para a pessoa decidir (commit ou descarte) antes de seguir.
2. **Plano.** `npx create-rubrica@latest update --dry-run`. Resuma para a pessoa: versões de `@rubrica/core` e do tema, arquivos do `convex/` que mudam, migrações de dados que a versão pede e componentes ejetados cujo original mudou. Leia as notas da versão (`gh release view -R MierzwaMatheus/rubrica`). Espere o "ok".
3. **Aplicar.** `npx create-rubrica@latest update --yes`: sobe os pacotes, instala e regenera o `convex/`.
4. **Ejetados.** Para cada componente que o `update` listou, compare a cópia em `src/overrides/` com o original novo (o caminho vem na lista) e traga o que a versão nova corrige, **preservando a personalização**. Na dúvida sobre um trecho, pergunte.
5. **Backend e dados.** Publique no Convex de desenvolvimento com `npx convex dev --once` (diga o deployment do `.env.local` antes) e rode lá as migrações que o `update` listou. Na produção, só com o "ok" da pessoa.
6. **Conferir.** `pnpm check`, `pnpm test` e `pnpm build`; se der, abra o site (`pnpm dev`) e confira as páginas principais.
7. **Commit.** `chore: atualiza o Rubrica para a vX.Y.Z`, só com o "ok" da pessoa.
8. **Site no ar.** A produção só muda quando a pessoa publicar (`npx create-rubrica publicar`, ou o merge na branch ligada à Vercel). Repasse o que as notas pedem para a produção (migrações, variáveis novas).

## Migrar da v1
`npx create-rubrica@latest migrar`, num projeto v1 na última versão e com o git limpo. Ele cria a branch `rubrica-v2`, converte o export do Convex da v1 (a pessoa roda `npx convex export`) num arquivo de import da v2, troca o código, lista as personalizações com a sugestão de cada uma e confere o resultado. O import vai para um Convex de **desenvolvimento novo e vazio**, rodado pela pessoa; a produção só com o "ok" explícito dela. Para só ver o que mudaria, sem gravar nada: `npx create-rubrica@latest migrar --relatorio`.

## Skills do Rubrica
As skills ficam com o "como escrever" e gravam pelo MCP. Use a que couber:

| Pedido | Skill |
|---|---|
| Tom de voz, entrevista de voz, parte pessoal do Sobre | `rubrica-voz` |
| Apresentação, "sobre mim", frase da home, princípios | `rubrica-apresentacao` |
| Case de um projeto | `rubrica-case` |
| Currículo | `rubrica-curriculo` |
| Post do blog do zero | `rubrica-blog` |
| Revisar um texto antes de ir ao site | `rubrica-pilar` |

## Quando o Rubrica não faz
Se a pessoa pedir algo que o Rubrica não suporta, ou algo quebrar no núcleo, num tema ou no CLI: decida se é bug ou pedido, procure uma issue parecida em `github.com/MierzwaMatheus/rubrica/issues` e, com o "ok" da pessoa, abra uma nova, sem dados privados (nada de `.env*`, chaves, e-mails ou conteúdo do site que ela não autorizou). Enquanto isso, prefira resolver com bloco próprio a ejetar.
