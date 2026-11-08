# create-rubrica

CLI do [Rubrica](https://github.com/MierzwaMatheus/rubrica) v2: cria, configura, publica, atualiza e migra sites feitos com `@rubrica/core` (Astro + Convex). No projeto, o mesmo CLI responde por `rubrica`.

Precisa de Node 22.23+ e do `git`.

```bash
npx create-rubrica@latest meu-site --tipo pessoal --tema padrao
# ou
pnpm create rubrica meu-site
```

## Comandos

Tirando o `create`, rode dentro da pasta do projeto.

| Comando | Para quê |
|---|---|
| `create <pasta> [--tipo pessoal\|empresa] [--tema <id>]` | Gera o projeto: `@rubrica/core` + tema, `astro.config.ts`, `convex/` de reexportações, hospedagem neutra (`vercel.json`, `_redirects`, `_headers`), `AGENTS.md` e `.mcp.json`. `--help` lista as opções |
| `setup` | Liga o Convex, grava as variáveis, cria o root e o conteúdo inicial (receita do tema) e as integrações |
| `config` | Troca identidade, tipo, tema, esquema de cores, idiomas ou plugins |
| `publicar` | Põe o site no ar na Vercel, ou publica de novo |
| `senha` | Troca a senha do painel e libera o login bloqueado |
| `update [--dry-run] [--yes]` | Sobe o núcleo e o tema, regenera o `convex/`, roda as migrações de dados no desenvolvimento e avisa dos ejetados cujo original mudou |
| `ejetar <bloco>` | Copia o componente do bloco para `src/overrides/` e passa a usar a cópia |
| `verificar` | Confere o `convex/` gerado, o tema e os ejetados (o `pnpm test` dos projetos) |
| `testar-tema [tema]` | Bateria de testes de tema (`@rubrica/theme-tester`) |
| `mcp` | Servidor MCP local (`@rubrica/mcp`), que o agente inicia pelo `.mcp.json` |
| `migrar [--relatorio]` | Leva um projeto da v1 para a v2 (`migrar dados`, `migrar conferir`) |
| `telemetria [ligar\|desligar]` | Mostra, liga ou desliga a telemetria anônima do projeto |

## Migrar da v1

```bash
npx create-rubrica@latest migrar --relatorio          # só mostra: tema, personalizações, dados
npx convex export --path .rubrica/migracao/export-v1.zip
npx create-rubrica@latest migrar --export .rubrica/migracao/export-v1.zip
```

O `migrar` cria a branch `rubrica-v2`, troca o código, converte o export num arquivo de import da v2 (mais os dados em fixtures, para buildar sem banco) e grava o relatório em `.rubrica/migracao/relatorio.md`. Convertem também os dados de negócio: contatos (com o consentimento marcado como anterior à v2), depoimentos enviados, propostas com versões e aceites (hash e prova intactos), modelos de contrato, checkouts (estado e ids do Asaas) e currículos com IA. O que não tem destino na v2 (depoimento em vídeo, por exemplo) vai como estava para `pendentes-v1.zip`, e o relatório diz o porquê. Ele não grava no Convex: o import vai para um deployment de desenvolvimento novo, rodado por você; a produção só com o seu "ok".

## Manutenção

- Tema novo portado: acrescente o id em `PORTED_THEMES` (`src/themes.ts`).
- Módulo novo no núcleo: nada a fazer. O `convex/` sai das funções do núcleo instalado no projeto; a reserva (`src/core-manifest.ts`, para projeto ainda sem `node_modules`) é lida do núcleo do monorepo no build (`scripts/core-modules.ts`). `test/project.test.ts` compara com o `apps/demo/convex`.
- Variável de ambiente nova de integração: `INTEGRATIONS` em `src/commands/setup.ts`.
- `pnpm --filter create-rubrica test` roda também os testes de ponta a ponta (instalam e buildam projetos de verdade); `RUBRICA_SKIP_E2E=1` os pula.

## Licença

MIT
