# Comandos do CLI

O `create-rubrica` cria, configura, publica, atualiza e migra o site. Dentro de um projeto, o mesmo CLI responde por `rubrica`: `npx rubrica <comando>` é igual a `npx create-rubrica <comando>`. Precisa de Node 22.23 ou mais novo e do `git`.

```bash
npx create-rubrica@latest <comando> [opções]
npx create-rubrica --help       # lista os comandos
npx create-rubrica --version
```

Rode os comandos na pasta do projeto (menos o `create`). Quando um comando precisa de uma resposta e não há terminal interativo, use as opções ou `--yes`. Em **qualquer** comando, `--sem-telemetria` desliga a [telemetria](./telemetria.md) só naquela execução.

| Comando | Para quê |
|---|---|
| [`create`](#create) | Cria um site novo |
| [`setup`](#setup) | Liga o Convex, cria o login e o conteúdo inicial |
| [`config`](#config) | Muda identidade, tipo, tema, cores, idiomas, plugins ou analytics |
| [`publicar`](#publicar) | Põe o site no ar na Vercel |
| [`senha`](#senha) | Troca a senha do painel |
| [`update`](#update) | Atualiza o núcleo e o tema |
| [`ejetar`](#ejetar) | Copia o componente de um bloco para o projeto |
| [`verificar`](#verificar) | Confere o projeto (o `pnpm test`) |
| [`testar-tema`](#testar-tema) | Bateria de testes de um tema |
| [`mcp`](#mcp) | Servidor MCP local para agentes |
| [`migrar`](#migrar) | Leva um projeto da v1 para a v2 |
| [`telemetria`](#telemetria) | Mostra, liga ou desliga a telemetria |

## create

```bash
npx create-rubrica@latest [create] <pasta> [opções]
```

Gera o projeto: `@rubrica/core` e o tema, `astro.config.ts`, o `convex/` de reexportações, os arquivos de hospedagem (`vercel.json`, `public/_redirects`, `public/_headers`), o `AGENTS.md` e o `.mcp.json`. Instala as dependências, inicia o git e oferece rodar o `setup`. A pasta precisa estar vazia ou não existir. Sem opções, pergunta o que falta.

| Opção | Valor |
|---|---|
| `--tipo` | `pessoal` (padrão) ou `empresa` |
| `--tema <id>` | `padrao`, `cyberpunk`, `brutalist`, `swiss`, `bento`, `magazine`, `desktop`, `index`, `monograph`, `zine`, `blueprint`, `garden`, `chat` ou `poster` |
| `--nome <texto>` | Nome do site ou da empresa |
| `--url <endereço>` | Endereço do site (`meusite.com`) |
| `--descricao <texto>` | Descrição curta (SEO) |
| `--autor <nome>` | Dono do site (pessoal) ou contato (empresa) |
| `--email <e-mail>` | E-mail do login do painel e de contato |
| `--idiomas <lista>` | Idiomas separados por vírgula (padrão `pt-BR`) |
| `--idioma-principal <código>` | Idioma sem prefixo na URL (padrão: o primeiro) |
| `--esquema <id>` | Esquema de cores (veja [Temas](./temas.md#esquemas-de-cor)) |
| `--modo` | `escuro`, `claro` ou `automatico` |
| `--plugins <lista>` | Plugins separados por vírgula, ou um pacote: `recommended`, `freelancer` ou `simple` (os dois últimos só no tipo pessoal) |
| `--gerenciador` | `pnpm` ou `npm` (padrão: o que rodou o comando) |
| `--local <pasta>` | Usa os pacotes de um clone do monorepo (`link:`), para testar versões não publicadas |
| `--sem-instalar` | Não instala as dependências |
| `--sem-git` | Não roda o `git init` |
| `--sem-setup` | Não oferece o `setup` no fim |
| `-y`, `--yes` | Não pergunta nada: usa as opções e os padrões |

## setup

```bash
npx create-rubrica setup
```

Interativo; **quem roda é você**, porque pede a senha e as chaves. Liga o projeto ao Convex de desenvolvimento, grava as chaves de login e as variáveis do backend, cria o usuário `root` (a senha é digitada ali, nunca passa por um agente), monta o conteúdo inicial pela receita do tema e pergunta as integrações (Telegram, e-mail, OpenRouter, Asaas, deploy hook). É seguro rodar de novo: ele só completa o que falta.

## config

```bash
npx create-rubrica config [opções]
```

Sem opções e num terminal, pergunta o que mudar. Com opções, muda direto:

| Opção | O que muda |
|---|---|
| `--nome`, `--url`, `--descricao`, `--autor`, `--email` | Identidade |
| `--tipo pessoal\|empresa` | Tipo do site (as páginas existentes ficam; blocos exclusivos do outro tipo deixam de aparecer) |
| `--tema <id>` | Tema (troca o pacote, instala e atualiza o `astro.config.ts`) |
| `--esquema <id>`, `--modo escuro\|claro\|automatico` | Cores |
| `--idiomas <lista>`, `--idioma-principal <código>` | Idiomas ([Idiomas](./idiomas.md)) |
| `--plugins <lista>` | Liga e desliga plugins: `+blog,-resume`. Sem sinal, liga |
| `--analytics <script>`, `--analytics-id <id>` | Liga o Umami e libera a origem na CSP. `--analytics desligar` desliga |
| `--producao` | Grava também no Convex de **produção** (pede confirmação) |
| `--sem-instalar` | Não roda a instalação ao trocar de tema |
| `-y`, `--yes` | Não pergunta |

As mudanças vão para o `rubrica.json`, para o código (quando precisa) e para o Convex de **desenvolvimento**. O site publicado só muda com `--producao` e um novo `publicar`.

## publicar

```bash
npx create-rubrica publicar
```

**Quem roda é você, a pedido seu**: publica em **produção**. Na primeira vez, cria o projeto na Vercel e o banco de produção; depois, só publica de novo. Passo a passo em [Publicar o site](./publicar.md).

## senha

```bash
npx create-rubrica senha
```

Troca a senha do painel (esqueceu, ou o login ficou bloqueado). Pergunta se é no site publicado ou no do computador. **Sempre você roda**: a senha nunca passa por um agente.

## update

```bash
npx create-rubrica@latest update [--dry-run] [--yes] [--para <versão>] [--forcar]
```

| Opção | O que faz |
|---|---|
| `--dry-run` | Mostra o plano sem gravar nada |
| `-y`, `--yes` | Aplica sem pedir confirmação |
| `--para <versão>` | Atualiza para uma versão específica do núcleo |
| `--forcar` | Segue mesmo com mudanças sem commit no git |

Sobe `@rubrica/core` e o tema, regenera o `convex/`, roda no desenvolvimento as migrações de dados da versão e avisa dos componentes ejetados cujo original mudou. Veja [Atualizar o Rubrica](./atualizar.md).

## ejetar

```bash
npx create-rubrica ejetar <bloco> [--forcar]
npx create-rubrica ejetar --listar
```

Copia o componente do bloco (do tema, ou do núcleo) para `src/overrides/` e passa a usar a cópia. `--forcar` copia de novo por cima; `--listar` mostra o que já foi ejetado e se o original mudou. Sem argumento, lista os blocos disponíveis.

## verificar

```bash
npx create-rubrica verificar
```

É o `pnpm test` do projeto. Confere se o `convex/` gerado bate com o núcleo instalado, se o tema do `rubrica.json` está instalado e no `astro.config.ts`, se os marcadores `rubrica:` do `astro.config.ts` estão no lugar e se os ejetados existem. Termina com erro se algo estiver fora.

## testar-tema

```bash
npx create-rubrica testar-tema [tema] [opções]
```

A bateria de testes de tema (`@rubrica/theme-tester`): axe, SEO, JavaScript por página e Lighthouse, sobre os sites de demonstração. No monorepo: `pnpm testar-tema <tema>`.

| Opção | O que faz |
|---|---|
| `--todos` | Todos os temas de `packages/themes/*` |
| `--listar` | Lista os temas do monorepo |
| `--site pessoal\|empresa` | Testa só um tipo de site |
| `--sem-lighthouse` | Pula o Lighthouse |
| `--so-lighthouse` | Roda só o Lighthouse |
| `--js-kb <n>` | Limite de JavaScript (gzip) por página com ilha (padrão 120) |
| `--lh-performance <n>`, `--lh-acessibilidade <n>`, `--lh-seo <n>` | Notas mínimas (padrão 90, 95 e 95) |
| `--lh-execucoes <n>` | Máximo de execuções do Lighthouse por página (padrão 3) |
| `--json <arquivo>` | Grava o relatório em JSON |
| `--verbose` | Mostra também as verificações que passaram |
| `--manter-dist` | Não apaga a pasta do build |
| `--raiz <pasta>` | Raiz do monorepo |

Saída: `0` se tudo passou, `1` se algo falhou, `2` para erro de uso.

## mcp

```bash
npx rubrica mcp                 # inicia o servidor (o .mcp.json faz isso)
npx rubrica mcp login           # login no terminal (também: --email, --producao, --senha-stdin)
npx rubrica mcp whoami          # projeto, banco, conta e papel
npx rubrica mcp logout
npx rubrica mcp --producao      # servidor apontando para o Convex de produção
```

Veja [Agentes de IA](./agentes.md). Sem banner: o `stdout` é o protocolo.

## migrar

```bash
npx create-rubrica@latest migrar [--export <zip>] [--yes]
npx create-rubrica@latest migrar --relatorio [--export <zip>] [--saida <arquivo>]
npx create-rubrica@latest migrar dados --export <zip> [--saida <pasta>]
npx create-rubrica@latest migrar conferir --v1 <url|pasta> [--v2 <pasta dist>]
```

| Forma | O que faz |
|---|---|
| `migrar` | Cria a branch `rubrica-v2`, troca o código, converte os dados (com `--export`), builda e grava o relatório |
| `migrar --relatorio` | Só mostra: tema, personalizações e (com `--export`) o que os dados viram. Não grava nada |
| `migrar dados` | Só a conversão dos dados (arquivo de import, pendentes, fixtures e relatório) |
| `migrar conferir` | Compara título, `h1` e texto das páginas principais entre a v1 e a v2 |

Outras opções: `--template-v1 <pasta>` (usa um clone do repositório como v1 de referência, sem internet), `--convex-url <endereço>` (endereço das imagens do Convex), `--local <pasta>` (pacotes do monorepo), `--sem-instalar` e `--sem-build`. Passo a passo em [Migrar da v1](./migrar.md). O comando **não grava no Convex**.

## telemetria

```bash
npx create-rubrica telemetria [ligar|desligar]
```

Sem argumento, mostra se está ligada e por quê. Veja [Telemetria](./telemetria.md).
