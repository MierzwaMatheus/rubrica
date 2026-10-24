# Conteúdo pessoal da página Sobre

Conferido em `src/pages/About.tsx`, `convex/aboutDailyRoutine.ts` e `convex/aboutFaq.ts`. A página Sobre abre com o lado profissional (o `about_text` e os princípios, da `rubrica-apresentacao`) e depois mostra o pessoal:

| Seção | Onde fica | Passo no plano | Origem na entrevista |
|---|---|---|---|
| Fora do trabalho | texto fixo `about.aboutMe.text` (o título `about.aboutMe.title` fica como está, a não ser que a pessoa peça) | `textos` | D1, D5 e o que sobrar de D3/D4 |
| Meu dia a dia | `aboutDailyRoutine`: `{description, descriptionTranslations {ptBR, enUS}, spanSize "1x1"/"1x2"/"2x1", displayOrder, imageId?}` | `mutation` `aboutDailyRoutine:create` / `update` | D2, D4 |
| FAQ pessoal | `aboutFaq`: `{question, questionTranslations, answer, answerTranslations, displayOrder}` | `mutation` `aboutFaq:create` / `update` | D3, D4, D1 |

## Como escrever
- **Só o que a pessoa contou e topou mostrar.** Pergunte antes se algum detalhe (família, cidade, saúde) não deve ir para o site.
- **Na voz do perfil,** reaproveitando as expressões dela. No FAQ, a resposta pode ficar quase literal (só apagando a oralidade).
- **Fora do trabalho:** de 2 a 4 parágrafos curtos, separados por linha em branco (o site preserva as quebras). É texto fixo, então vai em pt-BR e en-US na mesma escrita.
- **Dia a dia:** de 3 a 6 itens de 1 ou 2 frases, concretos ("Café coado às 7h, antes de abrir o e-mail"). Itens com foto ficam melhores em `1x2` ou `2x1`. Peça as fotos e suba como passos `imagem` (`imageId: "{{<id-do-passo>.id}}"`).
- **FAQ pessoal:** de 3 a 6 perguntas que um visitante curioso faria ("O que você faz quando não está programando?"). Pergunta curta e resposta curta.
- **Nada de** adjetivo de vitrine, lista de três hobbies por reflexo ou "apaixonado por viajar". O que vale é o detalhe que só ela teria.

## Antes do plano
- Leia o que existe: `$RB textos --chave about.aboutMe`, `$RB listar rotina`, `$RB listar faq`.
- Pergunte se é para **substituir** ou **completar**. Substituir item existente é `update` (ou `remove`, só se ela pedir). O `displayOrder` continua depois do último existente.
- Rode a `rubrica-pilar` (com `.rubrica/voz/<entrevista>.md` como fonte de verdade) e trate o veredito como em `../../rubrica/references/estrategistas.md` §6.

## Exemplo de passos
```json
[
  { "acao": "textos", "descricao": "Fora do trabalho",
    "itens": [{ "key": "about.aboutMe.text", "ptBR": "...\n\n...", "enUS": "...\n\n..." }] },
  { "acao": "mutation", "descricao": "Dia a dia: café", "funcao": "aboutDailyRoutine:create",
    "args": { "description": "Café coado às 7h, antes de abrir o e-mail.",
              "descriptionTranslations": { "ptBR": "Café coado às 7h, antes de abrir o e-mail.", "enUS": "Pour-over coffee at 7 a.m., before opening my inbox." },
              "spanSize": "1x1", "displayOrder": 3 } },
  { "acao": "mutation", "descricao": "FAQ pessoal", "funcao": "aboutFaq:create",
    "args": { "question": "...", "questionTranslations": { "ptBR": "...", "enUS": "..." },
              "answer": "...", "answerTranslations": { "ptBR": "...", "enUS": "..." }, "displayOrder": 2 } }
]
```
O `displayOrder` começa em 0 numa lista vazia e continua depois do último item numa lista existente. Cada fato vai para uma seção só.

Depois: `$RB aplicar-plano .rubrica/planos/<pasta>/plano.json --verificar`, mostre o texto, o relatório da Pilar e a prévia de uma vez, "ok" e aplicar. O texto fixo vale na hora. O dia a dia e o FAQ entram no próximo `publicar-site`.
