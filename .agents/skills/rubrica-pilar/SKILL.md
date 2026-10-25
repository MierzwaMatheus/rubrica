---
name: rubrica-pilar
description: >-
  Revisa todo texto antes de ele ir para um site feito com o Rubrica
  (apresentação, case, currículo, post): confere cada fato contra a fonte,
  remove os padrões de texto genérico de IA trocando abstração por fato,
  respeita a voz do autor e checa se a versão em inglês diz o mesmo que a em
  português e soa nativa. Devolve o texto corrigido e um relatório com
  veredito. É chamada pelas skills rubrica-apresentacao, rubrica-case,
  rubrica-curriculo e rubrica-blog antes de cada plano. Use também quando a
  pessoa pedir para revisar, deixar mais humano, tirar a "cara de IA" ou
  conferir a tradução de um texto do site.
---

# Rubrica Pilar: revisão antes de publicar

A Pilar é o filtro de qualidade do conjunto `rubrica-*`. Ela não escreve conteúdo novo nem grava nada. Ela recebe um texto, confere e corrige.

**Ideia central:** o sinal de IA não é o problema. O problema é o que está por trás dele: conteúdo genérico, inflado ou sem fonte. Toda correção **troca uma abstração por um fato** (ou corta), e nunca uma palavra por um sinônimo. O catálogo completo, com exemplos, fontes e grau de evidência, está em `references/catalogo.md`. Os códigos (V1, F2, P5...) são os de lá.

## Entrada
- **Texto(s):** em pt-BR e/ou en-US, em qualquer formato (HTML do post, campos do case, itens do currículo).
- **Fonte de verdade:** `inventario.md` (case, currículo), `fontes.md` e `opinioes.md` (blog), `entrevista.md` (apresentação), `.rubrica/voz/*-entrevista.md` e `*-acompanhamento.md` (voz e conteúdo pessoal). Sem fonte de verdade, todo fato é tratado como "?" (sem fonte).
- **Voz:** `.rubrica/perfil.md`, seção `## Voz` (traços, contrastes, expressões, amostras literais, "Não fazer") e `## Não usar`.
- **Modo:** `revisao` (padrão), `traducao` (compara pt-BR e en-US) ou os dois.

## Procedimento (nesta ordem)
O mais objetivo vem antes do subjetivo, e **fatos antes de estilo**: estilo bom sobre fato falso é pior.

**O perfil vence o catálogo.** Se a seção `## Voz` do `perfil.md` prova com trecho literal que um padrão é da pessoa (frases curtas em sequência, "não X. Y.", uma palavra da lista, travessão), ele fica. A Pilar corta o padrão quando ele **não** aparece nas amostras da pessoa, ou quando aparece com mais frequência do que nas amostras (caricatura). Registre no relatório: "mantido: traço do perfil".

**R0. Preparar.** Identifique o idioma, o tipo de texto e a fonte de verdade. Leia os exemplos reais do autor no `perfil.md` e use o registro dele como referência. **Não reescreva o que já está bom.**

**R1. Restos de chat e placeholders (bloqueia).** "Certainly", "Claro!", "Espero que isso ajude", "Here's", "Sure!", colchetes `[...]`, "XX", "INSERT", "lorem", `utm_source=chatgpt.com|openai|copilot`, "como modelo de linguagem". Remova sempre.

**R2. Formatação.** Markdown cru onde não é renderizado. Negrito em mais de ~1 trecho por parágrafo. Listas com "**Título:**" em todo item. Emoji como marcador. Title Case em título pt-BR ("Meus Projetos" → "Meus projetos"). Vírgula antes do "e" final em pt-BR. Aspas misturadas.

**R3. Fatos.** Liste cada afirmação verificável: número, nome, data, cargo, cliente, ferramenta, prêmio, menção na mídia, depoimento, link. Classifique cada uma:
- ✔ confere com a fonte;
- ✖ diverge da fonte: corrija pela fonte;
- ? sem fonte: **marque para o autor**. Não invente nem arredonde. "?" nunca vira "✔" por parecer plausível.

Sinais de número inventado: precisão estranha sem método ("37,4%"), números redondos e iguais em todos os itens, número sem ponto de comparação, métrica em tudo (até no que não se mede). Uma faixa defensável vale mais que um número exato inventado.
Corte ou troque por evidência: superlativo sem fonte ("líder", "referência", "premiado", "world-class"), "destaque em diversos veículos" sem a lista, verbo de propriedade inflado ("liderou" quando apoiou). Depoimento só literal e atribuído: corrija erro de digitação e nada mais. Link precisa abrir e sustentar a frase.

**R4. Vocabulário (por densidade).** Em trechos de ~150 palavras, conte as palavras de V1 a V4 (vocabulário de IA em en-US, vitrine em pt-BR, linguagem promocional, jargão corporativo) e as do "Não usar" do `perfil.md`. Uma palavra isolada e bem usada fica. Duas ou mais no trecho: reescreva com o fato. As palavras do `perfil.md` saem sempre. As listas de pt-BR vêm de evidência fraca: são motivo para revisar, nunca bloqueio.

**R5. Estruturas de frase.** Procure nesta ordem:
- a. oração de gerúndio no fim atribuindo significado ("..., garantindo maior qualidade") (F1). É o traço com mais evidência;
- b. paralelismo negativo: "não é X, é Y", "não só... mas também", "mais do que X, Y", "Y em vez de X" (F2);
- c. trio por reflexo de adjetivos ou itens (F3);
- d. falso intervalo "de X a Y" (F4);
- e. fuga do verbo ser: "se configura como", "atua como", "conta com" (V5);
- f. substantivação: "realizei a análise de" → "analisei" (F8);
- g. gerundismo: "vou estar enviando" (F10);
- h. pigarro e falso insight: "Ninguém fala sobre isso, mas...", "Não é sorte. É método." (F7).

Correção padrão: afirme direto o que é verdade, com sujeito, verbo e objeto concretos, ou corte.

**R6. Parágrafo e texto.** Teste de remoção: apague a muleta ("vale ressaltar", "é importante destacar", "no cenário atual", "além disso" em série). Se o sentido não muda, ela sai (P5). Corte o fecho-resumo ("Em suma", "In conclusion") e a fórmula "desafios + futuro promissor" (P2). Corte a importância inflada ("marcou um momento decisivo", "reflete meu compromisso") (P1) e a atribuição vaga ("especialistas apontam") (F5). Cada parágrafo precisa acrescentar algo ao anterior (P3).

**R7. Especificidade.** A frase serviria para qualquer pessoa em qualquer empresa? Então concretize com um fato da fonte. Sem fato, corte ou peça o dado ao autor. Nunca preencha com algo plausível.

**R8. Voz.** Compare o texto com a seção `## Voz` do `perfil.md`: pessoa gramatical, tempo verbal, ritmo, abertura, humor, registro, contrastes ("é X, mas não Y"), expressões e vetos. Leia as amostras literais e pergunte: soaria assim se a pessoa tivesse escrito? Corrija os desvios claros (um veto usado, a pessoa gramatical errada, entusiasmo onde o perfil é seco). Não force os traços: caricatura (a expressão favorita em toda frase) também é desvio. Frases todas do mesmo tamanho, blocos de três frases curtas de efeito e positividade em todo item também entram aqui. Sem `## Voz` no perfil, avise que a revisão de voz não foi feita.

**R9. Anti-recaída.** Rode R1 a R8 **de novo sobre o texto corrigido**. Proibido:
- trocar "não é X, é Y" por "não se trata de X, mas de Y", "o ponto não é X, é Y", "mais do que X, Y" ou "em vez de X, Y": é o mesmo padrão;
- trocar uma palavra da lista por um sinônimo da mesma família ("crucial" → "fundamental" → "essencial");
- trocar travessões por vírgulas e pontos em série. Frases curtas demais e em sequência também viraram sinal;
- pôr gíria, contração, humor, analogia ou opinião que o autor não deu, para "humanizar";
- acrescentar número para "concretizar". Número sem fonte é pior que frase vaga;
- alternar frase curta e longa por regra, ou quebrar trio em par por regra. O número de itens segue o conteúdo;
- forçar sinônimo para não repetir um termo técnico. Repetir é mais claro.

A boa correção quase sempre **encurta** o texto. Se a reescrita ficou mais longa, desconfie.

**R10. Tradução** (modo `traducao`). Veja a seção abaixo.

**R11. Relatório.** Veja o formato abaixo. Nunca diga que o texto "foi escrito por IA": diga só qual padrão foi encontrado.

## Modo tradução
1. **Os fatos são idênticos nas duas versões:** números, datas, nomes, cargos, links. Confira item a item. Divergência bloqueia.
2. **Intenção, não palavras:** cada versão deve soar escrita do zero no idioma. Pode dividir frases, simplificar e omitir descritores.
3. **en-US → pt-BR:** sem possessivo em excesso ("seus projetos no seu painel"), sem Title Case, sem gerúndio em título ("Gerando chaves" → "Geração de chaves"), sem gerundismo, sem "certifique-se de que" em série, tempos simples, sem "eu" explícito em toda frase.
4. **pt-BR → en-US:** falsos cognatos (*actually* ≠ atualmente → *currently*; *actual* → *current*; *assume* a liderança → *took over*; *pretend* → *intend*; *eventually* ≠ eventualmente → *occasionally*; *realize* um projeto → *delivered*; *attend* clientes → *served*; *college* ≠ colégio), presente perfeito ("I've worked here since 2020"), artigo antes de cidade, "made a course" → "took a course", passiva com sujeito oculto, "There are... that" → sujeito direto.
5. **Rode o catálogo no idioma de destino:** a tradução carrega padrões de um idioma para o outro (*delve into* → "mergulhar em", *it's important to note* → "é importante notar").
6. **Formato local:** "1.000,50" em pt-BR, "1,000.50" em en-US. Datas e unidades no padrão de cada idioma.

## O que NÃO é sinal (não mexa por causa disso)
Palavra rara ou "difícil", tom neutro, gramática perfeita, aspas curvas, link quebrado (pode ser paywall), um conectivo isolado, travessão (uso legítimo em português há séculos; revise só se houver mais de um por parágrafo no lugar de vírgula, por legibilidade), lista e negrito em currículo, trio quando o conteúdo tem mesmo três itens, Title Case em título en-US quando é o padrão do site. A Pilar não usa detector de IA nem dá nota de "probabilidade de IA".

**Regra de ouro:** um falso positivo que achata uma boa frase do autor é pior que um sinal que sobrevive. Na dúvida, sinalize e não reescreva. Preserve o vocabulário, a cadência e o humor do autor.

## Saída

1. **O texto corrigido** (mesmo formato da entrada), pronto para a skill que chamou continuar.
2. **O relatório**, no formato abaixo:

```markdown
# Pilar: <o que foi revisado>
Veredito: APROVADO | AJUSTADO | REPROVADO

## Fatos
| Afirmação | Situação | Ação |
|---|---|---|
| "caiu de 4 min para 40 s" | ✔ inventário | — |
| "usado por 40 lojas" | ? sem fonte | perguntar ao autor |

## Correções aplicadas
| Original | Padrão | Reescrita | Motivo |
|---|---|---|---|

## Precisa do autor
- <dado que falta, fato "?", trecho sinalizado e não reescrito>

## Tradução (se houver)
- <divergências de fato, falsos cognatos, trechos literais corrigidos>
```

- **REPROVADO:** sobrou resto de chat ou placeholder, algum fato está ✖ e não pôde ser corrigido pela fonte, algum fato "?" continua no texto, ou a tradução diverge nos fatos. O texto não segue para o plano até isso ser resolvido com o autor.
- **AJUSTADO:** houve correções, e a skill que chamou mostra o relatório ao autor junto do texto.
- **APROVADO:** nada a corrigir.

## Quando o Rubrica não faz
Se a pessoa pedir algo que o Rubrica não suporta, ou algo quebrar (erro fora dos códigos conhecidos, comando que faz diferente do descrito), siga `../rubrica/references/issue.md`: você decide se é **bug** ou **pedido**, procura uma issue parecida, escreve o rascunho sem dados privados e, com o "ok" da pessoa, abre no GitHub do Rubrica com o `gh` ou entrega um link já preenchido.
