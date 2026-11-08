# Migrar da v1

Este guia leva um site feito com o Rubrica v1 para a v2. O comando `migrar` faz a maior parte do trabalho e **não grava em nenhum banco**: o que vai para o Convex é você quem importa, primeiro num banco de desenvolvimento novo.

## O que muda da v1 para a v2

- O projeto deixa de ser uma cópia do template: passa a **depender** de `@rubrica/core` e de um tema (`@rubrica/theme-<nome>`). Atualizar vira subir a versão do pacote.
- O site público é **Astro**, em HTML estático (antes, uma SPA em Vite).
- Os 13 layouts viram **temas** (o seu layout tem um tema equivalente com o mesmo nome; a v2 acrescenta o `padrao`).
- As páginas fixas viram **páginas de blocos**, editáveis no painel.
- O `convex/` do projeto vira arquivos de uma linha que reexportam o backend do núcleo.
- Os idiomas viram uma lista configurável (a v1 tinha português e inglês fixos).
- O script Python da skill `rubrica` sai; entra o **MCP local**.

A v1 continua recebendo correções de bug e de segurança por **6 meses** depois do lançamento da v2. Enquanto o seu site estiver nela, a documentação certa é a da [branch `v1` do GitHub](https://github.com/MierzwaMatheus/rubrica/tree/v1/docs): os guias deste site são da v2.

## Antes de começar

1. O projeto precisa estar na **última v1 (1.13.1)**. Se não estiver: `npx create-rubrica@1 update` e faça o commit.
2. `git status` sem mudanças pendentes. A migração roda numa branch nova, então a sua branch atual não muda.
3. Node 22.23 ou mais novo.
4. Anote o endereço do site no ar: ele serve para conferir depois.

## Passo a passo

### 1. Veja o que vai acontecer (não grava nada)

```bash
npx create-rubrica@latest migrar --relatorio
```

Mostra o tema equivalente ao seu layout e a lista das **personalizações** do seu projeto (arquivos que diferem da v1 de referência), cada uma com a sugestão de destino. Se quiser ver também o que os dados viram, passe o export do passo 2 com `--export`.

### 2. Exporte os dados da v1

Rode na pasta do projeto, **com o `.env.local` ainda apontando para o banco da v1**:

```bash
npx convex export --path .rubrica/migracao/export-v1.zip
```

O export é só leitura: não altera o banco da v1.

### 3. Migre

```bash
npx create-rubrica@latest migrar --export .rubrica/migracao/export-v1.zip
```

O comando mostra o plano e pede confirmação. Depois:

1. cria a branch **`rubrica-v2`**;
2. compara com a v1 de referência e lista as personalizações;
3. troca o código: sai o template, entram `@rubrica/core` e o tema, o `astro.config.ts`, o `convex/` gerado, o `AGENTS.md` e o `.mcp.json`;
4. converte o export num arquivo de import da v2 (`.rubrica/migracao/import-v2.zip`), mais os dados em fixtures;
5. instala e faz o build **sem banco**, com os dados convertidos;
6. escreve o relatório em **`.rubrica/migracao/relatorio.md`**.

O Convex não é tocado.

### 4. Leia o relatório

Ele traz, em ordem: o tema escolhido; as páginas montadas e os blocos que ficaram de fora (e por quê); os textos e plugins convertidos; o que ficou **pendente** (guardado em `pendentes-v1.zip`); o que foi **descartado**; tabelas próprias do projeto que não foram convertidas; as personalizações com a sugestão de cada uma; e os próximos passos.

### 5. Importe no Convex de desenvolvimento NOVO

Nunca importe direto no banco da v1 nem na produção. Crie um banco de desenvolvimento novo e vazio para a v2:

```bash
npx convex dev --configure new --once     # o .env.local passa a apontar para o novo; o banco da v1 fica intacto
cat .env.local | grep CONVEX_DEPLOYMENT   # confira para onde vai
npx convex import .rubrica/migracao/import-v2.zip
npx create-rubrica setup                  # chaves de login e variáveis (o root e as páginas já vieram no import)
```

Abra o site (`pnpm dev` e `pnpm dev:convex`), entre no painel com o **mesmo e-mail e a mesma senha da v1** e confira as páginas.

### 6. Trate as personalizações

Para cada arquivo da lista do relatório, siga a sugestão:

| Sugestão | Quando | O que fazer |
|---|---|---|
| **Tokens** | Era só cor, fonte ou espaçamento | Ajuste na tela Aparência do painel; nada de código |
| **Bloco próprio** | Era uma seção que o catálogo não tem | Crie em `src/blocks/` com `defineBlock` e um componente React puro |
| **Ejetar** | Era o desenho de um bloco que o catálogo tem | `npx create-rubrica ejetar <bloco>` e refaça a mudança na cópia |

Siga o menor esforço que resolve. Veja [Temas](./temas.md#blocos-próprios-e-componentes-ejetados).

### 7. Confira

```bash
pnpm check && pnpm test && pnpm build
npx create-rubrica@latest migrar conferir --v1 https://seusite.com --v2 dist
```

O `migrar conferir` compara, nas páginas principais, o **título**, o **`h1`** e o **texto** entre o site da v1 no ar (ou uma pasta `dist` dela) e o build da v2. Diferenças aparecem em lista: nem todas são erros (o tema novo pode mudar a ordem de uma seção), mas título e `h1` de SEO devem bater.

### 8. Analytics, se você usava

O `migrar` não lê as variáveis da Vercel. Se a v1 tinha Umami, ligue de novo:

```bash
npx create-rubrica config --analytics https://cloud.umami.is/script.js --analytics-id <id>
```

### 9. Publique, só com o seu ok

A produção só muda quando você publicar. Faça com o mesmo cuidado de sempre: o desenvolvimento conferido primeiro, depois a produção.

- O **import em produção apaga o que houver lá**. Combine antes com quem cuida do site, e só faça com um "ok" explícito.
- O `publicar` prepara o Convex de produção da v2 e a Vercel. Use um banco de produção **novo** para a v2 e mantenha o da v1 até confirmar que está tudo certo.
- Faça o merge da branch `rubrica-v2` quando o site da v2 estiver aprovado.

## O que é convertido

| Da v1 | Para a v2 |
|---|---|
| Home, sobre, currículo, portfólio, blog, depoimentos | Páginas de blocos, montadas pela receita do tema e preenchidas com o conteúdo da v1 |
| Textos de seção (títulos, chamadas, botões) | Campos dos blocos, com tradução |
| Outros textos do site | Textos de interface |
| Traduções português e inglês | Mapa por idioma: `pt-BR` (principal) e `en`, com as mesmas URLs `/en` |
| Posts, projetos, serviços, depoimentos, FAQ, dia a dia, currículo | As mesmas coleções, com os mesmos ids |
| Configurações do site e plugins | Configurações da v2 (`i18n` vira `translation`) |
| Usuários e papéis | Mantidos; ninguém muda de papel |
| Contatos | Mantidos, com o consentimento marcado como "anterior à v2" |
| Propostas, versões e aceites | Mantidos, com hash e prova de aceite intactos |
| Modelos de contrato, checkouts, currículos com IA | Mantidos, com o estado e os ids do Asaas |
| Imagens (biblioteca) | Mantidas |

## O que não é convertido

| O que | Por quê |
|---|---|
| Sessões de login | Todo mundo entra de novo |
| Códigos e limites temporários (login, envios) | São zerados |
| Sessões de proposta | Expiram: o cliente digita a senha de novo |
| Contatos na lixeira da v1 | A v2 não tem lixeira de contatos |
| Depoimentos recusados | A v2 apaga o envio ao recusar |
| Depoimentos em vídeo | A v2 só recebe depoimento em texto. Vão como estavam para `pendentes-v1.zip` |
| Plugin `playground` | Saiu da v2 |
| Tabelas próprias do projeto | Leve-as para o `convex/` da v2 (schema e funções) e importe à parte |
| Personalizações no código | Listadas no relatório, mas você as refaz (bloco próprio, ejetar ou tokens) |

O que não é convertido nunca é apagado: ou fica no `pendentes-v1.zip`, ou continua no banco da v1.

## Se algo der errado

- A migração roda numa branch. Para desistir: `git switch <sua-branch>` e `git branch -D rubrica-v2`.
- O banco da v1 nunca é alterado, a menos que você mesmo importe nele (não faça).
- Dúvidas ou casos que o relatório não explica: abra uma [issue](https://github.com/MierzwaMatheus/rubrica/issues), sem dados privados.
