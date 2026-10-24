# Etapas 4 e 5: pesquisa de fontes e escolha

Argumento sem evidência é só opinião. A pesquisa dá ao autor dados e fontes verificáveis para sustentar o que **ele** pensa (`opinioes.md`) e mostra também o que contradiz essa visão, porque o autor precisa saber.

**Entrada:** `briefing.md`, `opinioes.md`, `seo.md` (se já existir). **Saída:** `pesquisa.md`.

## Princípios
1. **Fontes primárias primeiro:** documentação oficial, dados de instituições, estudos, publicações acadêmicas, o texto original em vez do resumo de alguém.
2. **Duas fontes independentes** para toda afirmação importante.
3. **Recência:** em tecnologia, prefira os últimos 2 ou 3 anos. Dado antigo só com a data explícita no texto.
4. **Conflito de interesse sinalizado:** o blog de uma empresa falando do próprio produto não é fonte neutra.
5. **Contradições são dados:** quando as fontes discordam, mostre os dois lados.
6. **Toda URL é aberta antes de entrar.** Link quebrado não entra.

## Passos
1. Liste o que precisa de evidência: cada ponto do briefing e cada posição do autor.
2. Pesquise com consultas específicas ("<tema> estatísticas <ano>", "<tema> estudo", "<tema> documentação", "<autor de referência> <tema>"). Leia as fontes, não só o snippet da busca.
3. De cada achado, guarde a afirmação, a fonte (autor, publicação, data), a URL, a data de acesso e a confiança.
4. Abra cada URL para conferir que funciona e diz o que você anotou.

## `pesquisa.md`
```markdown
# Pesquisa
## Achados principais
1. <afirmação>
   Fonte: <autor/publicação, data>
   URL: <link> (acessado em <aaaa-mm-dd>, funciona)
   Confiança: alta | média | baixa (<por quê>)
   Sustenta / contradiz: <qual posição do autor>
## Dados e números
- <dado> (<fonte>, <data>)
## Citações diretas úteis
"<trecho>" (<autor>, <publicação>)
## Contradições encontradas
## Referências
1. <Autor>. "<Título>". <Publicação>, <data>. <URL> (acessado em <data>)
```
Mire em 5 a 10 achados fortes e de 5 a 12 referências. Poucas fontes boas valem mais que muitas rasas.

## Etapa 5: a pessoa escolhe ⏸
Mostre os achados numerados, com a confiança e se cada um sustenta ou contradiz a visão dela. Pergunte quais entram, quais saem e se ela tem fontes próprias para incluir (um estudo que leu, um dado do trabalho dela). Se algum achado contradiz a posição do autor, pergunte como ele quer tratar: refutar no texto, matizar a posição ou deixar de fora. Salve a seleção em `fontes.md`, no mesmo formato.

## Não escrever
"Estudos mostram", "dizem que" ou "pesquisas indicam" sem dizer quais. Fonte sem autor identificado. Link que você não abriu.
