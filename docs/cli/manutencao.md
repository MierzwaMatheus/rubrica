# Manutenção do CLI

O `create-rubrica` (pasta `cli/`) não descobre sozinho o que existe no template. Layouts, esquemas de cores, fontes e plugins ficam em listas dentro do CLI. **Tudo o que entra no template e deve aparecer no `create` ou no `config` precisa entrar também nessas listas.** Este guia diz onde mexer em cada caso e quais testes avisam quando algo ficou faltando.

## Onde fica cada coisa

| Arquivo | O que tem |
|---|---|
| `cli/src/layouts.ts` | `LAYOUTS`: os layouts, os arquivos de cada um e a aparência recomendada (esquema, modo, textura, fontes). O modo rápido aplica essa recomendação sem perguntar. |
| `cli/src/themes/schemes.ts` | `SCHEMES`: os esquemas de cores, com os 11 papéis nos modos claro e escuro |
| `cli/src/themes/fonts.ts` | `SANS_FONTS` e `MONO_FONTS`, com os pesos que cada família tem no Google Fonts |
| `cli/src/plugins.ts` | `PLUGINS` (nome e descrição que a pessoa vê), `PLUGIN_PRESETS` (os pacotes prontos) e `UNLISTED_PLUGINS` |
| `cli/src/prompts/` | As perguntas: identidade, aparência e plugins |
| `cli/src/utils/normalize.ts` | Limpeza do que a pessoa digita: URL sem `https://`, @ do X, e-mail |
| `cli/src/commands/create.ts` | O fluxo do `create` |
| `cli/src/commands/setup.ts` | O fluxo do `setup`: conexão com o Convex, variáveis de ambiente, admin e seed |
| `cli/src/commands/config.ts` | O `config`, que reaproveita as mesmas perguntas |
| `templates/layouts/<id>/` | Os arquivos de cada layout. Vêm da release do GitHub, não do pacote npm. |

## Como o `create` pergunta

O público inclui gente que nunca usou terminal. Toda pergunta nova segue estas regras:

1. **Não pergunte o que dá para deduzir.** O modo rápido só pergunta o layout, o pacote de plugins e a identidade. Todo item novo precisa de um valor recomendado para o modo rápido usar.
2. **Não pergunte duas vezes.** O `rubrica.json` guarda o que o `create` perguntou. O `setup` e o `config` leem dali e só perguntam o que falta (o `setup` não pede o endereço do site; o e-mail do admin já vem preenchido).
3. **Aceite o jeito natural de escrever.** URL sem `https://`, `@fulano`, link do perfil, e-mail com maiúsculas. Normalize com as funções de `utils/normalize.ts` e explique o formato com um exemplo na própria pergunta.
4. **Nada de jargão.** Não mostre nome de variável de ambiente (`TELEGRAM_BOT_TOKEN`) nem termos como "SEO" e "Open Graph". Diga para que serve e onde a pessoa acha o valor. Um teste do setup recusa perguntas com nomes de variável.
5. **Integração opcional vem atrás de um sim/não, com "não" como padrão.** Primeiro "Quer receber avisos no Telegram?", só depois o token. Quem não sabe o que é segue em frente.
6. **Sem perguntas de infraestrutura.** O git é iniciado sem perguntar (se falhar, só avisa) e as dependências são instaladas com o gerenciador que rodou o comando (`pnpm create` → pnpm; `npx` → npm).

## A receita do site

O site (`site/`) monta o comando `npx create-rubrica@latest <pasta> --receita <código>`. O formato da receita fica em `cli/src/recipe.ts` e é usado pelos dois lados: o site importa o módulo direto de `cli/src`. Por isso ele não pode usar APIs do Node.

- **As chaves curtas (`KEYS`, `IDENTITY_KEYS`) são um contrato.** Comandos já copiados (num tutorial, num post) usam essas chaves. Para acrescentar um campo, crie uma chave nova; não renomeie nem reaproveite uma existente.
- **`RECIPE_VERSION`**: suba quando o formato mudar de um jeito que um CLI antigo leria errado. O CLI que recebe uma versão maior avisa para rodar com `@latest` e aproveita o que entende.
- **Validação**: `sanitizeRecipe` confere cada campo contra `LAYOUTS`, `SCHEMES`, as fontes e `PLUGINS`. O que não existe vira aviso e o `create` pergunta. Layout, esquema, fonte ou plugin novo entra na receita sem mudar nada aqui: basta estar no registro.
- **Campo novo na identidade**: acrescente a chave em `IDENTITY_KEYS`, a limpeza em `sanitizeRecipe` e o campo no formulário do site (`site/src/components/CreateYours.astro` e `site/src/lib/recipeForm.ts`).
- **Opção legível nova** (`--algo`): `cli/src/args.ts`, e a tabela de opções do `cli/README.md`.
- **Do site, o terminal só pede a senha.** O `create` chama o `setup` com `site` (profissão e especialidades da receita) e `newProject` (o nome da pasta). Com `site`, o `setup` não pergunta integrações, e-mail (se veio válido) nem profissão. Com `newProject` e sem `.env.local`, ele roda `convex dev --once --configure new --project <pasta> --dev-deployment cloud` e grava `convex.json` com `aiFiles.enabled: false`, o que tira as perguntas do Convex. Pergunta nova no `setup` precisa decidir o que acontece nesse modo; o padrão é não perguntar.

## Publicar (`npx create-rubrica publicar`)

`cli/src/commands/publish.ts` usa só os CLIs oficiais, via `npx`: `npx --yes vercel@latest` (sem instalar nada no computador da pessoa) e o `convex` do projeto.

- **Primeira vez** (sem `.vercel/project.json`): `vercel link --yes --project <nome do package.json>`, o domínio `.vercel.app` pela API (`vercel api /v9/projects/<id>/domains`, beta; sem ela, usa `<nome>.vercel.app`), `.vercelignore` com `.env*` (sem isso a Vercel enviaria o `.env.local`), chave de produção com `convex deployment token create rubrica-vercel --prod` (formato `prod:<deployment>|…`), `convex deploy` com essa chave, variáveis `--prod` no Convex, admin e dados iniciais com `convex run --prod`, variáveis na Vercel e `vercel deploy --prod --yes`.
- **Depois:** só `vercel deploy --prod --yes`. O build da Vercel envia o backend com a `CONVEX_DEPLOY_KEY` gravada lá.
- **Dados iniciais:** os mesmos do `setup`, em `cli/src/utils/seedPayloads.ts`. Mudou um, vale para os dois ambientes.
- **Variável nova de integração** que deve valer igual em produção: acrescente em `COPIED_ENV`. Se for diferente por ambiente (como o Asaas), não copie; avise a pessoa.
- **Várias contas da Vercel:** `RUBRICA_VERCEL_GLOBAL_CONFIG` vira `--global-config` em todas as chamadas da Vercel. É o que o teste ponta a ponta usa.

### O que o build do site publicado exige do template

Três problemas só apareceram ao publicar um projeto criado pelo CLI. Os testes abaixo, em `tests/`, impedem que voltem:

- `tests/release-tarball.test.ts`: nada em `src/`, `scripts/` ou `convex/` pode importar de uma pasta com `export-ignore` no `.gitattributes`, porque ela não vai no tarball que o `create` baixa. A `domain/` estava fora e quebrava o `npm run build`.
- `tests/csp.test.ts`: a CSP do `vercel.json` só aceita scripts de arquivo. O `index.html` não pode ter `<script>` embutido; o do modo de cor fica em `public/color-mode.js`.
- `tests/app/exportI18n.test.ts`: o `build:i18n` mescla os textos do banco (`siteTexts`) sobre as traduções do repositório. Sem o plugin de tradução, o banco vem vazio e, antes, o build apagava as traduções.

## Senha do painel

A regra de senha existe em dois lugares que precisam andar juntos: `assertStrongPassword` em `convex/users.ts` (painel e `users:resetPasswordInternal`) e `validatePassword` em `cli/src/utils/password.ts` (`setup` e `senha`). Mudou um, mude o outro, ou o CLI vai aceitar uma senha que o painel recusa.

O `npx create-rubrica senha` chama a função **interna** `users:resetPasswordInternal`: só roda via `npx convex run` com acesso ao projeto. Ela também apaga o bloqueio de login (`authRateLimits`, identificado pelo `_id` da conta em `authAccounts`) e registra `auth.password_reset` no histórico.

## Novo layout

1. Crie os arquivos em `templates/layouts/<id>/`. O guia de design está em [Criando um layout](../templates/criando-um-layout.md).
2. Adicione a entrada em `LAYOUTS` (`cli/src/layouts.ts`): `id`, `label`, `hint` (uma frase para leigos: para quem é e como é), `legacy: false`, `copy`, `remove`, `pages`, `fonts` e `recommended`. O modo rápido usa `fonts.sans[0]`, `fonts.mono` (vazio = o layout não usa mono) e `recommended`.
3. As fontes e o esquema recomendados precisam existir em `fonts.ts` e `schemes.ts`. Se forem novos, veja as seções abaixo.
4. Atualize a contagem em `cli/src/__tests__/layouts.test.ts` ("os 5 originais e os N novos").
5. Docs: `docs/templates/<id>.md` com as imagens em `docs/templates/img/<id>/`, a tabela de `docs/templates/README.md`, a lista de layouts de `cli/README.md` e a contagem no `README.md` da raiz.

## Novo esquema de cores

1. Adicione a entrada em `SCHEMES` (`cli/src/themes/schemes.ts`), com os 11 papéis em `#RRGGBB` nos modos `light` e `dark`.
2. Os testes de `schemes.test.ts` conferem o contraste: texto sobre fundo ≥ 4,5 e primária sobre fundo ≥ 3, nos dois modos. Atualize a contagem ("tem os N esquemas").
3. Para ser o recomendado de algum layout, troque o `recommended.scheme` dele em `layouts.ts`.
4. Docs: a seção do esquema em `docs/templates/cores.md` e as contagens em `docs/templates/README.md`, `cli/README.md` e `README.md`.

## Nova fonte

1. Adicione em `SANS_FONTS` ou `MONO_FONTS` (`cli/src/themes/fonts.ts`) **só com os pesos que a família tem no Google Fonts**. Um peso inexistente faz o Google recusar o link inteiro, e o site fica sem nenhuma fonte.
2. Para ser a recomendada de um layout, coloque-a em primeiro lugar em `fonts.sans` desse layout (o modo rápido usa a primeira).

## Novo pacote de plugins

Os pacotes (`PLUGIN_PRESETS` em `cli/src/plugins.ts`) aparecem no `create` e nos botões da seção "Crie o seu" do site, que lê a mesma lista. O `id` do pacote também vale em `--plugins <id>`.

## Novo plugin

1. Registre no backend em `convex/pluginRegistry.ts`, como hoje.
2. Adicione em `PLUGINS` (`cli/src/plugins.ts`):
   - `label` e `description` em linguagem comum: é o que aparece na lista;
   - `recommended: true` se deve entrar no pacote "Completo";
   - `needsKey: true` se só funciona com a chave de um serviço externo. Plugins assim ficam fora de todos os pacotes.
3. Se o plugin não deve aparecer no CLI (liga pelo painel, por exemplo), coloque o id em `UNLISTED_PLUGINS`.
4. Revise os pacotes em `PLUGIN_PRESETS`.
5. Se ele precisa de variável de ambiente, adicione a pergunta no `setup.ts` dentro de um `if (plugins["<id>"])`, seguindo as regras de "Como o `create` pergunta". Use `optional(pergunta, CHAVE)` para valor que pode ficar em branco e `wants(pergunta)` para o sim/não. Segredo que a pessoa não precisa ver (token de webhook, pepper) é gerado com `randomBytes` sem perguntar.
6. Se ele tem dados iniciais, eles entram no `seed:seedAll`, que recebe a lista de plugins ligados.

O teste "todo plugin do backend está no CLI ou em UNLISTED_PLUGINS" (`plugins.test.ts`) falha enquanto o passo 2 ou o 3 não for feito.

## Novo campo de identidade

1. Adicione a pergunta em `cli/src/prompts/identityPrompt.ts`. O teste reconhece cada pergunta pelo começo do texto: inclua o campo no mapa `QUESTION` de `identityPrompt.test.ts`.
2. Adicione o campo em `RubricaIdentity` (`cli/src/state/readState.ts`) e no `writeState` do `create`.
3. Se ele vai para o build ou para as meta tags, ajuste `rubricaConfigInput`/`indexHtmlInput` em `transforms/identityInputs.ts`. Create, config e update usam essas funções, então todos geram o mesmo conteúdo.
4. Se ele vai para o banco, inclua no `siteConfig:setBatchInternal` do `setup.ts`.

## Testes e ordem das perguntas

Os testes de `create.test.ts`, `create.e2e.test.ts`, `create.validity.e2e.test.ts` e `pristine.parity.test.ts` respondem às perguntas **na ordem em que aparecem** (`select` e `confirm` com `mockResolvedValueOnce`). Ao incluir, remover ou trocar a ordem de uma pergunta, ajuste os helpers no topo desses arquivos (`setupPrompts`, `setupSelectPrompts`). A ordem do modo personalizado, hoje:

```
modo → layout → esquema → modo de cor → (confirm: alternância) → textura → fonte principal → fonte mono
→ pacote de plugins ("custom" abre o multiselect) → identidade → (confirm: configurar o painel agora)
```

Os testes do fluxo novo (`create.flow.test.ts`, `setup.flow.test.ts`) e o de identidade não dependem da posição.

Para conferir se os testes pegam erros de verdade, rode o Stryker no que mudou. Use `inPlace`: alguns testes leem `templates/` e `convex/` fora da pasta `cli/`.

## Publicação

O `create` baixa os arquivos do template da **release do GitHub marcada como latest** e os registros vêm do **pacote npm**. Por isso a ordem importa:

1. merge → `gh release create vX.Y.Z --latest` (os arquivos do layout novo passam a existir na release);
2. só depois `npm publish` em `cli/`.

Ao contrário, um CLI que já conhece um layout novo falharia ao aplicá-lo sobre uma release que ainda não tem os arquivos.

Projetos criados antes de um layout ou esquema existir não têm esses arquivos. O `config` avisa e manda rodar `npx create-rubrica@latest update` primeiro.
