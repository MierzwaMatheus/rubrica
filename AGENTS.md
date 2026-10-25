# Instruções para agentes

Este é um site feito com o **Rubrica**, um template de portfólio em React + Convex. O template vive em `MierzwaMatheus/rubrica`; o CLI `create-rubrica` cria, configura, publica e atualiza o projeto. Siga estas regras ao trabalhar aqui.

> Se o `origin` deste repositório for o próprio `MierzwaMatheus/rubrica`, você está no código do template, não num site. Este arquivo vai junto para os projetos criados: mantenha-o válido para eles ao mudar o CLI ou as skills.

## O essencial
- **Conteúdo ou código?** Texto, cores, posts, projetos, currículo, propostas e o que mais aparece no painel são **conteúdo**, guardado no Convex: use a skill `rubrica` (`.agents/skills/rubrica/SKILL.md`), que fala com o painel pela linha de comando. Layout, componentes e estilos são **código** deste repositório.
- **Dois bancos.** O `.env.local` aponta para o Convex de **desenvolvimento** (o site do computador). O site no ar usa o de **produção**, cujo endereço fica em `producao` no `rubrica.json`. Antes de rodar qualquer comando que grave no Convex, diga em qual dos dois vai rodar.
- **`npx convex deploy` publica sempre em produção.** Só com o "ok" explícito da pessoa. Para o banco do computador, use `npx convex dev --once`. Nunca rode `npx convex import --replace-all` ou outra operação que apague dados em massa sem pedido explícito para aquele banco.
- **Gerenciador de pacotes:** `pnpm` se existir `pnpm-lock.yaml`, `npm` se existir `package-lock.json`. Os exemplos abaixo usam `pnpm`.
- **Não toque** em `.env*` (nunca mostre nem faça commit deles) nem edite o `rubrica.json` à mão: o CLI mantém esse arquivo, e o `update` e o `publicar` dependem dele.
- **Conferir mudanças de código:** `pnpm check` (tipos) e `pnpm test`. `pnpm dev` sobe o site e o Convex de desenvolvimento (fica rodando; pare quando terminar).

## O CLI: quem roda o quê
Rode os comandos na raiz do projeto. Alguns são interativos e fazem perguntas que você não consegue responder: peça para a pessoa rodar no terminal dela. No Claude Code ela pode digitar `! ` antes do comando, no próprio prompt.

| Comando | Para quê | Quem roda |
|---|---|---|
| `npx create-rubrica@latest update --dry-run` | Mostra o que uma atualização mudaria, sem gravar | Você |
| `npx create-rubrica@latest update --yes` | Aplica a atualização | Você, depois do "ok" da pessoa |
| `npx create-rubrica setup` | Conecta o Convex, cria o admin e os dados iniciais, liga integrações (Telegram, Vercel, OpenRouter, Asaas) | A pessoa: pede senha e chaves |
| `npx create-rubrica config` | Troca identidade, aparência, layout ou plugins padrão | A pessoa. Avise antes: trocar o **layout** sobrescreve os arquivos dele, e personalizações neles se perdem |
| `npx create-rubrica publicar` | Põe o site no ar na Vercel, ou publica de novo depois de mudar o código | A pessoa, a pedido dela: publica em produção |
| `npx create-rubrica senha` | Troca a senha do painel e libera o login bloqueado | Sempre a pessoa. A senha nunca passa pela conversa |

Referência completa dos comandos e opções: [Comandos do CLI](https://userubrica.vercel.app/docs/guia/cli).

## Atualizar o Rubrica
1. **Ponto de partida limpo.** `git status` precisa estar sem mudanças. Se houver, peça para a pessoa decidir (commit ou descarte) antes de seguir: é o que permite voltar atrás.
2. **Versões.** A versão atual é o `version` do `rubrica.json`. A mais recente é a última release do GitHub (`gh release view -R MierzwaMatheus/rubrica --json tagName`), que é de onde o `update` baixa o template. Não use a versão do pacote no npm: ela é a do CLI, que nem sempre muda junto. Leia as notas das versões no meio do caminho (`gh release list -R MierzwaMatheus/rubrica` e `gh release view vX.Y.Z -R MierzwaMatheus/rubrica`, ou [Releases](https://github.com/MierzwaMatheus/rubrica/releases)) e anote o que pedem: publicar algo no Convex, variável de ambiente nova, rodar o `setup`.
3. **Plano.** `npx create-rubrica@latest update --dry-run`. Resuma para a pessoa: arquivos atualizados, mesclados, novos, removidos e os que vão virar `.rubrica-new` (conflito). Espere o "ok".
4. **Aplicar.** `npx create-rubrica@latest update --yes`. Projetos criados até a v0.3.18 gravavam a versão `0.1.0`: se o CLI perguntar a versão de origem, pergunte à pessoa quando ela criou o projeto e use `--from <versão>`.
5. **Conflitos (`<arquivo>.rubrica-new`).** O arquivo da pessoa ficou intacto e a versão nova está ao lado. Para cada um: compare (`git diff --no-index <arquivo> <arquivo>.rubrica-new`), traga para o arquivo dela o que a versão nova corrige ou acrescenta, **preservando as personalizações dela**, mostre o resultado e apague o `.rubrica-new`. Na dúvida sobre um trecho, pergunte.
6. **Dependências.** Se o `package.json` mudou: `pnpm install`.
7. **Backend.** Se algo em `convex/` mudou, publique no Convex de desenvolvimento com `npx convex dev --once` (diga o deployment do `.env.local` antes).
8. **Conferir.** `pnpm check` e `pnpm test`. Se der para abrir o site (`pnpm dev`), confira as páginas principais.
9. **Commit.** `chore: atualiza o Rubrica para a vX.Y.Z`, só com o "ok" da pessoa.
10. **Site no ar.** A produção só muda quando a pessoa rodar `npx create-rubrica publicar` (o build da Vercel envia junto as mudanças do backend). Lembre a pessoa e repasse o que as notas da release pedem para a produção.

**Projeto criado por fork** (sem `rubrica.json`): a atualização é pelo git. `git remote add upstream https://github.com/MierzwaMatheus/rubrica.git` (uma vez), `git fetch upstream --tags` e `git merge vX.Y.Z`. Resolva os conflitos preservando as personalizações e siga do passo 6.

Guia completo para pessoas: [Atualizando o seu Rubrica](https://userubrica.vercel.app/docs/atualizacao).

## Skills do Rubrica
Ficam em `.agents/skills/` (com atalhos em `.claude/skills/`). Use a que couber:

| Pedido | Skill |
|---|---|
| Ler ou mudar conteúdo, publicar um post, ver contatos, publicar o site pelo painel | `rubrica` |
| Tom de voz, entrevista de voz, parte pessoal do Sobre | `rubrica-voz` |
| Apresentação, "sobre mim", frase da home, princípios | `rubrica-apresentacao` |
| Case de um projeto | `rubrica-case` |
| Currículo | `rubrica-curriculo` |
| Post do blog do zero | `rubrica-blog` |
| Revisar um texto antes de ir ao site | `rubrica-pilar` |

## Quando o Rubrica não faz
Se a pessoa pedir algo que o Rubrica não suporta, ou algo quebrar no template ou no CLI, siga `.agents/skills/rubrica/references/issue.md`: decida se é bug ou pedido, procure uma issue parecida e, com o "ok" da pessoa, abra no GitHub do Rubrica, sem dados privados.
