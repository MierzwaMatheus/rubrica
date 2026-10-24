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
