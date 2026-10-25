---
name: rubrica-blog
description: >-
  Escreve um post de blog completo para um site feito com o Rubrica, do tema ao
  rascunho no site: briefing, opiniões do autor, SEO, pesquisa de fontes
  verificadas, escrita em HTML, edição, revisão, versão em inglês, tags e
  sugestões de capa, com aprovação da pessoa em cada etapa. Não grava nada
  sozinha: entrega um plano que a skill rubrica aplica. Use quando a pessoa
  quiser escrever, criar ou planejar um post, artigo ou texto para o blog do
  site/portfólio. Para só editar um campo de um post existente, publicar ou
  despublicar, use a skill rubrica.
---

# Rubrica Blog: do tema ao rascunho no site

Esta skill é a **estrategista** do post. Ela conduz a pessoa por um processo editorial com checkpoints, escreve o post em pt-BR e en-US e termina num plano que a skill `rubrica` aplica (`aplicar-plano`). Ela não chama o Convex para gravar.

**Regras que valem o tempo todo:**
- **Uma pergunta por vez.** Espere a resposta antes da próxima.
- **Checkpoint é parada.** Nos pontos marcados com ⏸, mostre o resultado e só siga com o "ok" da pessoa. Se ela pedir ajuste, ajuste e mostre de novo.
- **A opinião é do autor.** O post defende o que a pessoa disse nas etapas 1 e 2, com as palavras dela. Não invente posição, ângulo político ou ideológico que ela não trouxe. Não presuma o que ela pensa.
- **Nada sem fonte.** Dado, número, citação e fato verificável vêm da pesquisa, com URL testada.

## Antes de começar

**Leia primeiro `../rubrica/references/estrategistas.md`** (regras comuns: a voz vem primeiro, pastas e comandos, fonte de verdade, números, Pilar, quando aparece no site). Os comandos `$RB` são do script da skill `rubrica`, rodado da raiz do projeto. Se faltar login (código 4), siga a seção "Antes de tudo" da skill `rubrica`: a senha nunca passa pela conversa.

1. Confira a voz e o perfil (`estrategistas.md` §1).
2. Rode `$RB status` e anote o Convex que aparece, porque ele vai no plano.
3. Veja os posts existentes: `$RB listar posts --limite 200`. Eles servem para não duplicar tema, sugerir links internos e saber quais tags o blog já usa.
4. Crie a pasta do trabalho: `.rubrica/planos/aaaa-mm-dd-post-<assunto-curto>/`. Todo arquivo desta skill vai dentro dela, nunca solto em `.rubrica/`.

## Etapas

| # | Etapa | Referência | Saída na pasta |
|---|---|---|---|
| 1 | Briefing: tema, objetivo, leitor, pontos, CTA ⏸ | `references/estrategia.md` | `briefing.md` |
| 2 | Opiniões do autor, um tópico por vez ⏸ | `references/estrategia.md` | `opinioes.md` |
| 3 | SEO: palavra-chave, intenção de busca, estrutura | `references/seo.md` | `seo.md` |
| 4 | Pesquisa de fontes e dados, com URLs testadas | `references/pesquisa.md` | `pesquisa.md` |
| 5 | A pessoa escolhe as fontes ⏸ | — | `fontes.md` |
| 6 | Escrita do post em HTML (pt-BR) | `references/escrita.md` | `rascunho.html` |
| 7 | Aprovação do rascunho ⏸ (se rejeitar, volta à 6) | — | — |
| 8 | Edição: estrutura, clareza, ritmo | `references/edicao.md` | `corpo.html`, `edicao.md` |
| 9 | Revisão: língua, HTML, links + `rubrica-pilar` | `references/revisao.md` | `revisao.md` |
| 10 | Versão em inglês + `rubrica-pilar` na tradução | `references/escrita.md` (seção Inglês) | `corpo-en.html` |
| 11 | Aprovação final ⏸ (se rejeitar, volta à 8) | — | — |
| 12 | Tags e capa ⏸ | `references/capa.md` | `capa.md` |
| 13 | Plano e aplicação pela `rubrica` ⏸ | `../rubrica/references/plano.md` | `plano.json` |

As etapas 3 e 4 são independentes. Se o seu ambiente tiver subagentes, rode as duas em paralelo, passando `briefing.md`, `opinioes.md` e a referência de cada uma. Se não tiver, rode em sequência.

Ao fim de cada etapa sem checkpoint, avise em uma linha o que saiu (ex.: "SEO pronto: palavra-chave X, 5 seções") e siga.

## Etapa 9: a Pilar é obrigatória

Depois da sua revisão, invoque a skill `rubrica-pilar` (com `/rubrica-pilar` no Claude Code) passando o `corpo.html`, o título, o subtítulo, o `.rubrica/perfil.md` e, como fonte de verdade, o `fontes.md` (dados) **e** o `opinioes.md` (posições e casos do autor). Trate o veredito como em `estrategistas.md` §6. Anote no `revisao.md` o que mudou. Na etapa 10, faça o mesmo com a versão em inglês.

## Etapa 13: o plano

Monte `plano.json` com `"origem": "rubrica-blog"`, o `convex` do `status` e, nesta ordem:
1. `imagem` com `id: "capa"`, só se a pessoa entregou o arquivo da capa (com `alt` em pt-BR descritivo);
2. `imagem` para cada imagem do corpo, e use `{{id.url}}` no `src` dos dois HTML;
3. `post-criar` com `titulo`/`enTitulo`, `subtitulo`/`enSubtitulo`, `slug` (kebab-case, sem acento), `arquivo: "corpo.html"`, `enArquivo: "corpo-en.html"`, `tags`, `leitura` (ex.: "8 min", cerca de 200 palavras por minuto) e, só se houver o passo `capa`, `imagemId: "{{capa.id}}"`. `tags` é uma lista (`["React", "Convex"]`).

Depois passe para a skill `rubrica`: `$RB aplicar-plano .rubrica/planos/<pasta>/plano.json --verificar`, mostre a prévia, espere o "ok" ⏸ e aplique. O post nasce **rascunho**. Publicar (`post-publicar`) e reconstruir o site (`publicar-site`) só se a pessoa pedir.

## Opcional: texto curto de divulgação

Só se a pessoa pedir, escreva um texto curto para redes a partir do post final: gancho nas duas primeiras linhas, 3 ou 4 parágrafos de 1 ou 2 frases, a ação no fim e o link fora do corpo se a rede punir links. Passe pela `rubrica-pilar` e salve em `divulgacao.md`. Ele não entra no plano.

## Quando o Rubrica não faz
Se a pessoa pedir algo que o Rubrica não suporta, ou algo quebrar (erro fora dos códigos conhecidos, comando que faz diferente do descrito), siga `../rubrica/references/issue.md`: você decide se é **bug** ou **pedido**, procura uma issue parecida, escreve o rascunho sem dados privados e, com o "ok" da pessoa, abre no GitHub do Rubrica com o `gh` ou entrega um link já preenchido.
