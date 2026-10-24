# Atualizando o seu Rubrica

O Rubrica foi feito para ser personalizado. Atualizar não pode desfazer isso: cores, CSS, páginas editadas, textos e identidade continuam como você deixou. Este guia explica como atualizar e o que acontece com cada coisa.

## Antes de começar

1. **Faça commit de tudo.** Assim, se algo não sair como esperado, `git reset --hard` volta ao estado anterior.
2. **Leia as notas da release** em [Releases](https://github.com/MierzwaMatheus/rubrica/releases). Elas dizem se há algo a fazer no Convex ou nas variáveis de ambiente.

## Projeto criado com o CLI (`create-rubrica`)

Dentro da pasta do projeto:

```bash
# 1. Veja o que mudaria, sem gravar nada
npx create-rubrica@latest update --dry-run

# 2. Aplique
npx create-rubrica@latest update
```

O CLI mostra um resumo e pede confirmação antes de gravar. Opções:

| Opção | Para que serve |
|---|---|
| `--dry-run` | Só mostra o plano. Nada é gravado. |
| `--to <versão>` | Atualiza para uma versão específica, em vez da mais recente. |
| `--from <versão>` | Informa com qual versão o projeto foi criado (veja abaixo). |
| `--yes` | Aplica sem perguntar (útil em scripts). |

### Como ele preserva as suas mudanças

O update compara três versões de cada arquivo:

- **base**: a versão de onde o seu projeto saiu, montada com as mesmas escolhas que você fez no `create` (layout, tema, fontes, plugins, identidade);
- **nova**: a versão nova, montada com as mesmas escolhas;
- **sua**: o arquivo como está hoje no seu projeto.

A partir daí:

| Situação | O que acontece |
|---|---|
| Você não mexeu no arquivo | Recebe a versão nova. |
| Você mexeu e o Rubrica não mudou o arquivo | Fica como está. |
| Você e o Rubrica mudaram partes diferentes | As duas mudanças são mescladas. Ex.: você trocou a cor primária no `src/index.css` e o Rubrica acrescentou uma regra nova no fim: o arquivo fica com a sua cor **e** a regra nova. |
| Você e o Rubrica mudaram o mesmo trecho | **O seu arquivo fica intacto.** A versão nova é salva ao lado, como `<arquivo>.rubrica-new`, para você comparar e trazer o que quiser. |
| Arquivo novo no Rubrica | É adicionado. |
| Arquivo removido no Rubrica | Sai se você não tinha mexido nele; fica se você tinha. |
| Arquivo que você apagou | Continua apagado. Se o Rubrica o alterou, a versão nova vai para `.rubrica-new`. |
| Arquivos que só existem no seu projeto | Nunca são tocados. |

Nunca são tocados, em nenhuma situação: `.env*`, `rubrica.json` e o conteúdo gerado a partir do seu banco no build (`public/data/`, `public/rss.xml`, `public/sitemap.xml`). Lockfiles alterados dos dois lados ficam como estão; o `pnpm install` resolve.

### Arquivos `.rubrica-new`

Para cada um:

1. Compare com o seu arquivo (`git diff --no-index src/pages/Home.tsx src/pages/Home.tsx.rubrica-new`, ou no seu editor).
2. Traga para o seu arquivo o que fizer sentido da versão nova.
3. Apague o `.rubrica-new`.

### Projetos criados com o CLI até a v0.3.18

Até a v0.3.18, o CLI gravava sempre `"version": "0.1.0"` no `rubrica.json`, qualquer que fosse a versão baixada. Nesses projetos, o update pergunta com qual versão o projeto foi criado. Compare a data em que você criou o projeto com as datas em [Releases](https://github.com/MierzwaMatheus/rubrica/releases). Também dá para informar direto: `npx create-rubrica@latest update --from 0.3.12`.

Se não souber a versão exata, escolha a mais próxima: no pior caso, mais arquivos aparecem como `.rubrica-new` para revisar, e nenhum dos seus é sobrescrito.

## Projeto criado por fork

Se você fez fork do repositório, o próprio git faz a mesma mescla em três vias:

```bash
# uma vez só
git remote add upstream https://github.com/MierzwaMatheus/rubrica.git

# a cada atualização
git fetch upstream --tags
git merge vX.Y.Z           # a tag da versão que você quer
```

Onde você e o Rubrica mudaram o mesmo trecho, o git marca o conflito no arquivo. Resolva, rode `pnpm check` e `pnpm test`, e faça o commit do merge.

## Depois de atualizar

1. **Dependências:** `pnpm install`, se o `package.json` mudou.
2. **Backend:** se algo em `convex/` mudou, publique primeiro no Convex de desenvolvimento (`npx convex dev --once`), teste com `pnpm dev`, e só depois em produção (`npx convex deploy`, ou o deploy da Vercel, que já roda `convex deploy` no build).
3. **Confira o site** com `pnpm dev` antes de publicar.

## O que nunca muda numa atualização

- **Conteúdo e configurações do admin.** Textos, cores e identidade salvos pelo painel, posts, projetos e depoimentos ficam no seu banco Convex. O update mexe em arquivos, não no banco.
- **Seeds.** Rodar o `rubrica setup` ou os seeds de novo só cria o que falta; não sobrescreve o que você personalizou.
- **Schema.** Dentro da mesma versão major (1.x), campos novos no banco são sempre opcionais: os seus dados continuam válidos. Uma mudança que exija migrar dados só entra numa versão major nova, com guia de migração nas notas da release.
