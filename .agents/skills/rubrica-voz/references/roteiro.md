# Roteiro da entrevista de voz (v1)

A fonte da verdade é `site/src/lib/voz.ts`, que gera a página https://userubrica.vercel.app/voz. Este arquivo espelha o roteiro para o agente usar quando a página não estiver acessível, e para saber para que serve cada resposta. Mudou o roteiro? Suba a versão nos dois lugares.

**Por que este formato** (`pesquisa.md` §5):
- 13 perguntas obrigatórias, mais 4 opcionais e 4 réguas opcionais, uns 20 minutos. A pesquisa sugere de 10 a 12 abertas para a voz; as 5 da seção D (fora do trabalho) somam porque alimentam a página Sobre;
- começa com uma pergunta fácil e concreta, nunca com "descreva a sua voz";
- mistura explicação, história, opinião e irritação, que é onde aparecem humor e vocabulário próprio;
- tem 2 respostas obrigatoriamente digitadas, porque o ditado vem sem pontuação;
- pergunta o que a pessoa nunca usaria, pede textos colados e fecha com réguas opcionais nas 4 dimensões de tom da NN/g.

**Na conversa** (quando não há página): um bloco por vez, com a mesma instrução: "responda como falaria a um amigo, sem caprichar". Registre tudo com `modo: digitado`.

| Id | Pergunta | Tipo | Uso |
|---|---|---|---|
| A1 | Como você explica o que faz para alguém da sua família que não é da área? | aberta | voz, apresentacao |
| B1 | Me conta um projeto de que você tem orgulho. O que estava ruim antes, o que você fez e o que mudou? | aberta | voz, case |
| B2 | Conta uma vez em que algo deu errado num trabalho seu. O que você fez depois? | aberta | voz, case |
| B3 | Quando alguém novo te procura para um trabalho, o que você faz nos primeiros dias? Passo a passo, do seu jeito. | aberta | voz, apresentacao |
| C1 | O que mais te irrita na sua área, ou no jeito como as pessoas trabalham nela? | aberta | voz, blog |
| C2 | Que coisa que todo mundo da sua área repete você acha errada ou exagerada? | aberta | voz, blog |
| C3 | Por que alguém deveria trabalhar com você, e não com outra pessoa? | aberta | voz, apresentacao |
| D1 | Quando você não está trabalhando, o que você está fazendo? | aberta | voz, pessoal:sobre-mim |
| D2 | Como é um dia comum seu, da hora que acorda até a hora de dormir? | aberta | voz, pessoal:rotina |
| D3 | O que costuma surpreender quem acaba de te conhecer? | aberta | voz, pessoal:faq, pessoal:sobre-mim |
| D4 | (opcional) O que você anda lendo, ouvindo, assistindo ou aprendendo? Por que isso te pegou? | aberta | voz, pessoal:faq, pessoal:rotina |
| D5 | (opcional) De onde você é, e o que desse lugar aparece no seu jeito de ser ou de trabalhar? | aberta | voz, pessoal:sobre-mim |
| E1 | Escreva a mensagem que você mandaria a um cliente avisando que um prazo vai atrasar. | escrita (só digitando) | voz |
| E2 | Escreva um post curto, de 3 a 5 linhas, sobre algo que você aprendeu este mês. | escrita (só digitando) | voz, blog |
| E3 | Que palavras, expressões ou jeitos de escrever você nunca usaria? | aberta | voz (vetos) |
| E4 | (opcional) Cite alguém (pessoa ou marca) cuja escrita você admira e o que te agrada nela. E alguém que você acha insuportável, e por quê. | aberta | voz |
| E5 | (opcional) Cole 2 ou 3 textos que você mesmo escreveu. | colar | voz (melhor evidência de escrita) |
| F1–F4 | (opcionais) Réguas de 1 a 5: formal↔casual, sério↔bem-humorado, respeitoso↔irreverente, objetivo↔entusiasmado | regua | voz (autoavaliação, peso menor) |

## Formato do Markdown
```
<!-- rubrica-voz v1 -->
# Entrevista de voz
Respondida em aaaa-mm-dd. Idioma do ditado: pt-BR.
> Para o agente: ...

## <título do bloco>

### A1. <pergunta>
<!-- uso: voz, apresentacao · tipo: aberta · modo: ditado -->

<resposta, ou _(sem resposta)_>
```
`modo` pode ser `digitado`, `ditado` (do navegador: pode ter palavra trocada e não ter pontuação), `colado` (texto que a pessoa já tinha escrito), `misto` (ditado e digitado na mesma resposta) ou `sem resposta`. As opcionais trazem `· opcional` no comentário. As réguas vêm como `4/5 (1 = sério, 5 = bem-humorado)`.
