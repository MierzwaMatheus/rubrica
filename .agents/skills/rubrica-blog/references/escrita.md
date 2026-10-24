# Etapas 6 e 10: escrita do post (pt-BR) e versão em inglês

**Entrada, nesta ordem de prioridade:**
1. `opinioes.md`: o texto segue **estritamente** as posições do autor;
2. `.rubrica/perfil.md`: voz, pessoa (1ª/3ª), palavras vetadas;
3. `briefing.md`, `seo.md`, `fontes.md`.

**Saída:** `rascunho.html`.

## HTML aceito pelo Rubrica
O corpo do post é HTML, e título e subtítulo ficam em campos próprios. Por isso:
- **Sem `<h1>`, `<article>`, `<html>`, `<body>`, classes ou `style`.** O título não se repete no corpo.
- Use só: `h2 h3 p ul ol li strong em a code pre blockquote img`.
- `h2` para seções, `h3` para subseções dentro de uma seção. Nunca pule nível.
- `strong` para os termos e ideias-chave, com moderação. `em` para um termo técnico na primeira menção.
- Lista (`ul`/`ol`) para 3 ou mais itens paralelos, **a não ser que o perfil de voz mostre que a pessoa conta em sequência, sem lista**. Raciocínio vai em parágrafo.
- Citação: `<blockquote><p>"trecho"</p><p>Autor, Publicação</p></blockquote>`.
- Código: `<pre><code>...</code></pre>`, com `<`, `>` e `&` escapados.
- Imagem: `<img src="{{id.url}}" alt="descrição">`, com o `id` do passo `imagem` do plano.

## Passos
1. **Esboço antes de escrever:** as seções do `seo.md`, o que cada uma diz, a fonte que sustenta cada ponto e uma estimativa de palavras. Compare com as opiniões: cada posição do autor tem lugar no esboço?
2. **Abertura** (os primeiros 1 ou 2 parágrafos, que aparecem logo abaixo do subtítulo):
   - um gancho concreto: um caso, um dado surpreendente com fonte, uma situação que o leitor reconhece ou uma pergunta real;
   - por que isso importa para o leitor agora;
   - o que ele vai levar do texto.
   Nunca abra com definição de dicionário ("X é definido como...").
3. **Corpo**, para cada `h2`:
   - a primeira frase diz o ponto da seção;
   - desenvolvimento com evidência, exemplo e o caso do autor (de 200 a 300 palavras por seção, como referência);
   - a última frase prepara a próxima seção, sem fórmula.
4. **Fechamento:** retome a tese com o que foi mostrado (sem repetir frases), dê a síntese e a ação concreta do briefing, e aponte o próximo passo ou a aplicação prática.
5. **Referências:** última seção, `<h2>Referências</h2>` com `<ul>` de `<li><a href="URL">Autor. "Título". Publicação, data.</a></li>`, somente das `fontes.md`. Fonte usada no texto também ganha link no ponto em que aparece.

## Regras de texto
- **A voz vence a forma.** Quando uma regra de forma desta referência ou do `seo.md` (perguntas nos títulos, listas, ganchos com pergunta) contraria o perfil de voz, vale o perfil. A técnica de conteúdo continua: fonte em todo fato, gancho concreto, ação no fim.
- Frases diretas e parágrafos de 3 ou 4 linhas no celular. Ideia complexa se explica com exemplo, não com palavra difícil.
- Toda afirmação de fato tem fonte. Opinião do autor aparece como opinião, na voz dele.
- Palavra-chave entra onde soa natural: no primeiro parágrafo, em parte dos `h2` e no fim.
- Tamanho do briefing. Profundidade não é enchimento: se o material da pessoa não sustenta o tamanho combinado, pare e pergunte se ela tem mais um caso ou se o texto fica mais curto. Nunca encha.
- O que é sinal de texto de IA (vocabulário inflado, "não é X, é Y", gerúndio no fim da frase, listas de três por reflexo) é tratado pela `rubrica-pilar`. Escreva já evitando, e ela confere.

## Autoverificação antes de mostrar
- [ ] Nenhuma frase contradiz `opinioes.md`; as ênfases do autor estão presentes e o que ele rejeitou ficou de fora.
- [ ] Toda afirmação de fato tem fonte em `fontes.md`.
- [ ] HTML só com as tags aceitas, bem fechadas, com hierarquia correta.
- [ ] Abertura com gancho concreto e fechamento com ação.
- [ ] Tamanho dentro do combinado.

Informe: "Rascunho pronto: N palavras, N seções, N referências." ⏸ Mostre o texto (ou um link para o arquivo) e espere a aprovação. Se a pessoa rejeitar, pergunte o que mudar e reescreva.

## Inglês (etapa 10)
Depois da revisão da etapa 9, escreva `corpo-en.html` a partir do `corpo.html` final:
- tradução idiomática, no mesmo tom e na mesma estrutura, como um autor nativo escreveria, não palavra por palavra;
- mesmas tags, links e `src`. Traduza só o texto visível e os `alt`;
- nomes próprios, tecnologias, código e títulos de fontes ficam como estão;
- traduza também título e subtítulo;
- citações de fonte em português: traduza e indique "(tradução livre)" se não houver versão oficial em inglês.
Depois passe pela `rubrica-pilar` (modo tradução).
