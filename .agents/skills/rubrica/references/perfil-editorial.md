# Perfil editorial (`.rubrica/perfil.md`)

O arquivo que todas as skills `rubrica-*` leem antes de escrever. Ele diz **de quem** é o site, **para quem** ele fala e, acima de tudo, **como essa pessoa escreve**. Fica na pasta do projeto, é da pessoa (está fora do git por padrão) e nunca vem pronto no template.

## Quem preenche o quê
| Seção | Preenchida por | Como |
|---|---|---|
| `## Voz` | `rubrica-voz` | entrevista de voz (https://userubrica.vercel.app/voz), métricas, trechos literais, calibração às cegas |
| `## Quem`, `## Para quem`, `## Posicionamento` | `rubrica-apresentacao` (ou a entrevista curta abaixo) | entrevista sobre trajetória, clientes e resultados |
| `## Não usar` | `rubrica-voz` (resposta E3) e qualquer correção | vetos explícitos da pessoa |
| `## Correções aprendidas` | todas as skills | cada "eu não falaria assim", com data |

Sem `## Voz` com amostras literais, nenhuma estrategista escreve: ela chama a `rubrica-voz` primeiro (`estrategistas.md` §1).

## Entrevista curta (só quando a pessoa recusar a entrevista de voz agora)
Uma pergunta por vez:
1. O que você faz, em uma frase, do jeito que contaria numa conversa?
2. Quem você quer que leia o site e entre em contato?
3. Mande dois ou três textos seus que soem como você (post, mensagem, descrição de projeto).
4. Alguma palavra, expressão ou tom que você não quer de jeito nenhum?

Com isso, monte uma `## Voz` provisória, com `Confiança: baixa`, e avise que o texto vai soar menos como a pessoa até ela fazer a entrevista completa.

## Formato
```markdown
# Perfil editorial

## Quem
<nome>, <o que faz em uma frase, nas palavras da pessoa>

## Para quem
- Leitor principal: <tipo de cliente/recrutador, setor, nível técnico>
- O que ele procura ao chegar no site: <...>

## Posicionamento
- Resultado que entrega: <...>   prova: <fato>
- Diferencial: <...>   prova: <fato>

## Voz
> Feito a partir de: <N respostas (X escritas, Y ditadas), Z textos colados> · ~<palavras> palavras · atualizado em <aaaa-mm-dd>.
> Confiança: <alta | média | baixa> (<motivo, ex.: abaixo de 2.000 palavras os números são indícios>).

### Como escreve (5 a 8 traços verificáveis)
- Pessoa: <ex.: 1ª do singular para o que fez; "a gente" para trabalho em equipe; fala com o leitor por "você">  prova: "<trecho>"
- Tempo verbal: <ex.: narra no pretérito perfeito, opina no presente>
- Ritmo (só do escrito): <ex.: frases curtas, mediana ~8 palavras; alterna com uma frase longa de explicação>
- Abertura: <ex.: começa pela conclusão ou pela irritação, nunca pelo contexto>
- Humor: <tipo e alvo, ou "não usa">
- Registro: <ex.: casual-técnico; usa termo técnico e traduz logo em seguida>

### Contrastes (é X, mas não Y)
- <ex.: direta, mas não ríspida>
- <ex.: informal, mas sem gíria de internet nem emoji>

### Expressões dela
- Usa: <"do zero", "mostrar funcionando", ...>

### Amostras literais (imite o jeito, não o assunto)
1. "<trecho de 1 a 3 frases>" (<pergunta, escrito/ditado>)
2. ...
(de 5 a 10, de perguntas diferentes; nos ditados, só com a oralidade apagada)

### Tom por superfície (só onde há amostra)
- Mensagem a cliente: <...> · Post: <...> · Case: <a definir> · Currículo: <a definir>

### Réguas declaradas (peso menor que o observado)
formal <n>/5 · humor <n>/5 · irreverência <n>/5 · entusiasmo <n>/5

### Não fazer
- <marcas de texto de IA ausentes nas amostras: "além disso", "não apenas... mas também", trios de adjetivos...>

## Não usar
- <palavras e tons que a pessoa vetou>

## Correções aprendidas
- <aaaa-mm-dd>: <o que a pessoa corrigiu e a regra que ficou>
```

**Regras do perfil:**
- Todo traço tem um comportamento observável e uma prova (trecho ou número). Adjetivo sem prova não entra.
- Sem evidência, o campo fica "a definir".
- O perfil guarda **padrões, não valores**: sem nomes de clientes, números de projetos ou opiniões sobre terceiros.
- As técnicas de escrita ficam nas referências de cada skill, e as regras contra texto de IA na `rubrica-pilar`. Não copie para cá.
