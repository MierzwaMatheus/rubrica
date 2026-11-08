# Começando

Do zero ao seu site rodando no computador, com o painel pronto para preencher. Leva uns 10 minutos, quase todos esperando a instalação. O caminho é o mesmo para um site **pessoal** (portfólio) e para um site de **empresa**; só muda o tipo que você escolhe no início.

> Já tem um site feito com o Rubrica v1? Não comece do zero: siga [Migrar da v1](./migrar.md).

## O que você precisa

- **Node.js 22.23 ou mais novo** e **git**. O pnpm é opcional: sem ele, o CLI usa o npm.
- Uma conta no **[Convex](https://convex.dev)** (gratuita). É o backend: guarda o conteúdo, o login e as imagens. Não precisa criar antes: o CLI abre o login no navegador na hora certa.
- Para publicar depois, uma conta na **[Vercel](https://vercel.com)** (gratuita). Veja [Publicar o site](./publicar.md).

Pagamentos (Asaas), tradução com IA (OpenRouter), avisos no Telegram e por e-mail são opcionais. Dá para ligar cada um depois: veja [Integrações](./integracoes.md).

## 1. Escolha a aparência no site

No [combinador](https://userubrica.vercel.app/#combinador), teste tema, esquema de cores e modo claro ou escuro no site de demonstração funcionando. Depois, na seção **Crie o seu**, escolha o tipo de site, preencha o nome, o endereço e o e-mail, e copie o comando pronto. Nada do que você digita sai do navegador: o comando é montado na própria página.

Prefere decidir no terminal? Pule para o passo 2 sem as opções: o CLI faz as mesmas perguntas.

## 2. Crie o projeto

Cole o comando num terminal, na pasta onde quer criar o projeto. Ele tem este formato:

```bash
npx create-rubrica@latest ana-souza --tipo pessoal --tema zine --esquema riso --modo claro
```

Ou rode só `npx create-rubrica@latest meu-site` e responda às perguntas: tipo de site, tema, nome, endereço, descrição, e-mail, idiomas, esquema de cores, modo e plugins. Todas as opções estão em [Comandos do CLI](./cli.md#create).

O CLI cria a pasta, escreve os arquivos, instala as dependências e inicia o git. Um projeto novo tem pouco código seu: o site vem de dois pacotes, `@rubrica/core` e o tema escolhido (`@rubrica/theme-<nome>`).

| Arquivo ou pasta | Para quê |
|---|---|
| `astro.config.ts` | Configuração do site. Os trechos entre marcadores `rubrica:` são do CLI |
| `rubrica.json` | Estado do projeto (tipo, tema, idiomas, plugins). O CLI mantém: não edite à mão |
| `convex/` | Backend. Os arquivos de `convex/rubrica/` são gerados (uma linha cada) |
| `src/blocks/` | Blocos próprios, se você criar |
| `src/overrides/` | Componentes ejetados, se você ejetar |
| `AGENTS.md`, `.mcp.json` | Instruções e configuração para agentes de IA |

## 3. Ligue o Convex e crie o seu login

No fim do `create`, o CLI oferece rodar o `setup` (ou rode `npx create-rubrica setup` quando quiser). Ele:

1. abre o login do Convex no navegador e cria um deployment de **desenvolvimento**;
2. grava as chaves e variáveis que o backend precisa;
3. pede o e-mail e a senha do seu usuário do painel, o `root`. **A senha é digitada ali, no terminal**;
4. monta as páginas iniciais pela receita do tema (home, sobre, contato e o resto);
5. pergunta, uma a uma, as integrações opcionais (Telegram, e-mail, OpenRouter, Asaas, botão Publicar). Pode pular todas.

## 4. Veja o site

Abra dois terminais na pasta do projeto:

```bash
pnpm dev          # o site, em http://localhost:4321
pnpm dev:convex   # o backend de desenvolvimento
```

O painel fica em `/admin`: entre com o e-mail e a senha do passo 3. Preencha a identidade, as páginas e o conteúdo (veja [Conteúdo e painel](./conteudo.md)). Para ver o site sem banco nenhum, `RUBRICA_FIXTURES=<pasta com site.json e pages.json> pnpm build`.

## 5. Publique

Quando estiver pronto, `npx create-rubrica publicar` põe o site no ar na Vercel, com um banco de **produção** separado do seu. Detalhes e outras hospedagens em [Publicar o site](./publicar.md).

## Dois bancos, sempre

O `.env.local` aponta para o Convex de **desenvolvimento**, o do seu computador. O site no ar usa o de **produção**, cujo endereço fica em `producao` no `rubrica.json`. Mexer no painel do computador não muda o site publicado. Comandos que publicam (`npx convex deploy`, `publicar`) gravam sempre em produção: só rode com a intenção de mudar o site no ar.

## Próximos passos

- [Conteúdo e painel](./conteudo.md): páginas com blocos, coleções e papéis
- [Temas](./temas.md): trocar o tema, as cores e as fontes
- [Idiomas](./idiomas.md): mais de um idioma
- [Agentes](./agentes.md): editar o conteúdo com o Claude Code ou o Codex
