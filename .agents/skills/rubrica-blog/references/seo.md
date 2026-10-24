# Etapa 3: SEO

O SEO serve para o post ser encontrado por quem procura o assunto. Ele nunca pode custar a clareza nem a posição do autor.

**Entrada:** `briefing.md`, `opinioes.md`. **Saída:** `seo.md`.

## Passos
1. **Intenção de busca:** pense no que o leitor do briefing digitaria. A intenção é informacional (aprender), navegacional (achar algo) ou transacional (contratar/comprar)?
2. **Palavras-chave** (pesquisa na web, no idioma do leitor):
   - 1 palavra-chave principal;
   - 5 a 10 secundárias, de preferência de cauda longa (mais específicas, com público mais qualificado);
   - as perguntas relacionadas que aparecem na busca ("as pessoas também perguntam").
   Consultas úteis: "<tema> o que é", "como <tarefa>", "<tema> vs <alternativa>", "<tema> exemplos".
3. **Concorrência:** para 2 ou 3 palavras-chave, leia os 3 primeiros resultados e anote o tipo de conteúdo, a profundidade, o ângulo e o que **falta** neles. Essa falta é a chance do post.
4. **Estrutura:**
   - **Título** com a palavra-chave principal, até ~60 caracteres. O Rubrica guarda título e subtítulo em campos separados: o título não leva dois-pontos com subtítulo dentro.
   - **Subtítulo** de uma frase que complementa o título (ângulo e promessa), com uma palavra-chave secundária quando couber naturalmente.
   - **3 a 6 seções (`h2`)**, cada uma com uma secundária ou variação, em ordem lógica.
   - As perguntas que o texto precisa responder.
5. **Recomendações:** links internos (posts e páginas do site), links externos de autoridade, slug sugerido (kebab-case, sem acento, curto).

## `seo.md`
```markdown
# SEO
## Palavra-chave principal
## Secundárias
1. ...
## Intenção de busca
## Título sugerido (até ~60 caracteres)
## Subtítulo sugerido
## Estrutura de seções (h2)
1. ...
## Perguntas para responder
- ...
## Lacuna da concorrência
## Links internos e externos sugeridos
## Slug sugerido
```

## Não fazer
- Repetir palavra-chave à força. Se a frase soa robótica, está errado.
- Título que promete o que o texto não entrega.
- Muitas seções rasas no lugar de poucas profundas.
