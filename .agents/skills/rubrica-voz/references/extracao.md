# Como interpretar a entrevista

Regras de `pesquisa.md` (§2 a §4 e §B), na ordem em que se aplicam.

## O que cada fonte prova
| Fonte | Vale como prova de | Não vale para |
|---|---|---|
| **Escrito** (`digitado`, `colado`) | ritmo (tamanho de frase), pontuação (exclamação, reticências, dois-pontos, travessão), maiúsculas, emoji, parágrafo, como começa e termina uma mensagem, vocabulário | — |
| **Ditado** (`ditado`) | vocabulário e jargão escolhido, metáforas e comparações próprias, como conta uma história (pelo problema? pelo resultado? pela cena?), opiniões, alvos de humor, de quem fala ("eu", "a gente", "o time"), tempo verbal das narrativas | ritmo, pontuação, frase. Sem pontuação, "frase" não existe |
| **Misto** | vocabulário e opinião | ritmo e pontuação |
| **Réguas** | o que a pessoa **quer** parecer (checagem cruzada) | o tom real. O observado pesa mais que o declarado |

## Oralidade e erro de transcrição
- **Descarte** (marca da fala): hesitações ("ahn", "éh"), repetição imediata ("eu eu"), falsos começos, "né?" e "sabe?" de checagem, "aí... aí..." usado para sequenciar, frase sem fim.
- **Teste de corte:** um marcador oral ("tipo", "né", "aí") só vira traço de escrita se aparecer também no **escrito**, usado como marcador. No ditado sozinho, é fala. A contagem do script é bruta: "começa por aí" e "só então" são usos gramaticais, não marcadores. Confira lendo.
- **Erro de transcrição:** palavra estranha fora de contexto é erro do ditado, não "expressão característica". Na dúvida, pergunte.
- **Não limpe antes de analisar.** Analise o texto bruto sabendo o que é oralidade. Para citar um trecho ditado, **só apague** (hesitação, repetição). Nunca reescreva: limpeza por LLM tende a reescrever demais.

## Lendo as métricas
- **Abaixo de ~2.000 palavras,** os números são indícios, não impressão digital. Com pouco texto, o que é confiável: expressões que se repetem, palavras usadas e evitadas, pessoa gramatical, pontuação expressiva no escrito, presença de humor, histórias e perguntas ao leitor. Taxas finas (MATTR, palavras funcionais) não sustentam traço sozinhas.
- **`frases_confiaveis: false`:** sem pontuação suficiente. Não use frase média nem desvio desse bloco.
- **`linha_de_base_ia`:** já exclui as respostas de vetos (E3). As marcas de texto de IA que a pessoa **não** usa entram em "Não fazer" como cuidado, não como proibição provada. Se ela usa uma ("além disso", travessão) fora da E3, é dela: não proíba.
- **`expressoes_frequentes`** e **`palavras_de_conteudo_mais_usadas`:** separe o que é do assunto (nome da área, ferramenta) do que é do jeito ("do zero", "na mão", "mostrar funcionando").
- **Confira lendo:** uma palavra entre aspas ou num contexto de deboche ("sinergia", "jornada") vai para "nunca usa", não para "usa".
- **Vetos explícitos (E3):** entram direto em "Não usar", sem precisar de métrica.

## De observação a traço
Cada traço do perfil precisa de **comportamento observável + prova + contraste**:
- ❌ "Comunicação próxima e autêntica."
- ✅ "Fala com o leitor por 'você' e conta bastidor em 1ª pessoa, mas não usa gíria de internet nem emoji. Ex.: '<trecho literal>'."

Sem trecho nem número que prove, o traço não entra. Com evidência só do ditado, o traço vale para vocabulário e jeito de contar, nunca para ritmo.

## Tom por superfície
A voz é constante, e o tom muda com o público. Registre o tom por superfície (case, blog, currículo, mensagem) só onde houver amostra: E1 mostra como fala com cliente, E2 como escreve em público, E5 o que ela colou. Sem amostra, "a definir".
