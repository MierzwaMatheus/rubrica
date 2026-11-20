# Atualizar o Rubrica

Na v2, atualizar é **subir a versão de um pacote**. O seu projeto não tem uma cópia do template, então não há arquivos para mesclar nem conflitos: o site vem de `@rubrica/core` e do tema, e o que é seu (configuração, blocos próprios, componentes ejetados) fica como está.

## O que é seu e o que é do pacote

| | De quem | O `update` |
|---|---|---|
| `@rubrica/core` e `@rubrica/theme-<nome>` | Do pacote | Sobe a versão |
| `convex/rubrica/*.ts`, `convex/auth.ts`, `convex/http.ts`, `convex/crons.ts` | Gerados (uma linha cada) | Regenera |
| `astro.config.ts` | Seu, com trechos do CLI entre marcadores `rubrica:` | Não mexe |
| `src/blocks/` | Seu | Não mexe |
| `src/overrides/` | Seu (componentes ejetados) | Não mexe, **mas avisa** se o original mudou |
| Tabelas e funções do seu `convex/` | Seu | Não mexe |
| `AGENTS.md`, `README.md` | Seu | Não mexe |

## Passo a passo

1. **Ponto de partida limpo.** `git status` sem mudanças. É o que permite voltar atrás.
2. **Veja o plano**, sem gravar nada:

   ```bash
   npx create-rubrica@latest update --dry-run
   ```

   Mostra as versões do núcleo e do tema, os arquivos do `convex/` que mudam, as **migrações de dados** que a versão pede e os **componentes ejetados** cujo original mudou. Leia também as [notas da release](https://github.com/MierzwaMatheus/rubrica/releases).
3. **Aplique:**

   ```bash
   npx create-rubrica@latest update --yes
   ```

   Sobe os pacotes, instala, regenera o `convex/` e roda as migrações de dados no Convex de **desenvolvimento** (ele diz qual é antes).
4. **Ejetados.** Para cada componente que o `update` listou, compare a cópia em `src/overrides/` com o original novo (o caminho vem na lista) e traga o que a versão nova corrige, preservando a sua personalização.
5. **Backend e produção.** As migrações de dados rodam no desenvolvimento. Na produção, rode as mesmas depois de publicar o backend, com o "ok" de quem cuida do site: `npx convex run --prod <função>`.
6. **Confira:** `pnpm check`, `pnpm test` e `pnpm build`.
7. **Commit:** `chore: atualiza o Rubrica para a vX.Y.Z`.
8. **Site no ar.** A produção só muda quando você publica (`npx create-rubrica publicar`, ou o merge na branch ligada à Vercel). Repasse o que as notas pedem: migrações e variáveis novas.

## Migração dos cases (2.3.0)

A 2.3.0 passa o corpo dos cases para **blocos**. O `update` lista a migração `projects-sections-to-blocks`, que converte o texto longo (`content`) e as seções (`sections`) de cada projeto em blocos `texto` e apaga os campos antigos. Ela é **idempotente**: rodar de novo não repete nada, e projetos que já têm blocos ficam como estão. Antes de rodar, o site já funciona: os cases no formato antigo continuam sendo lidos e aparecem normalmente.

O `update --yes` roda a migração no Convex de **desenvolvimento**, depois de publicar o backend lá. Na **produção**, com o "ok" de quem cuida do site, publique o backend e rode a migração, nesta ordem:

```bash
npx convex deploy
npx convex run --prod rubrica/collections:migrateSectionsToBlocks
```

O `convex deploy` publica sempre em produção, e a função nova só existe lá depois dele. A resposta é `{ migrated: <quantos projetos> }`. Depois, publique o site (`npx create-rubrica publicar`).

Se o seu tema é de terceiros ou foi ejetado, confira também o template de case: ele precisa mostrar `blocks` no lugar de `sections`. Veja [O template de case](./criar-tema.md#o-template-de-case).

## Versões

O núcleo e cada tema têm versões **independentes**, e o tema declara o contrato de blocos que usa (`contract: ^1`). Na prática:

- **Bloco novo** é versão menor: todos os temas ganham a versão padrão dele.
- **Mudar ou remover um campo** é versão maior e sempre vem com migração de dados.
- Correções de SEO, acessibilidade e idiomas saem no núcleo e valem para todos os temas.

Para fixar uma versão, use `--para <versão>`.

## Várias instalações (agências)

Cada cliente tem a sua instalação (repositório, Convex e Vercel próprios), e o `update` cuida de **um projeto por vez**. Para abrir a atualização em todos eles sem fazer na mão, use um bot de dependências no repositório de cada cliente:

**Renovate** (`renovate.json` na raiz):

```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": ["config:recommended"],
  "packageRules": [
    {
      "matchPackageNames": ["/^@rubrica//", "create-rubrica"],
      "groupName": "rubrica",
      "commitMessagePrefix": "chore:"
    }
  ]
}
```

**Dependabot** (`.github/dependabot.yml`):

```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule: { interval: weekly }
    groups:
      rubrica:
        patterns: ["@rubrica/*", "create-rubrica"]
```

O bot abre a PR com os pacotes novos. Em cada PR, rode `npx create-rubrica update --dry-run` para ver o que mais a versão pede (o `convex/` gerado e as migrações) e `npx create-rubrica update --yes` para completar, antes do merge. O `pnpm test` (que roda `verificar`) falha se o `convex/` ficou para trás, então o CI pega o esquecimento.

## Voltar atrás

Como tudo está no git, voltar é desfazer o commit (ou a PR). Se uma migração de dados já rodou, leia nas notas da versão como desfazê-la antes de voltar o código.
