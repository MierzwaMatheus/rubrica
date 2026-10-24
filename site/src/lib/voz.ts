/*
 * Roteiro da entrevista de voz (página /voz). A skill rubrica-voz lê o Markdown que
 * esta página gera: os ids e o campo "uso" de cada pergunta fazem parte do contrato.
 * Mudou uma pergunta de sentido? Suba a VERSAO e atualize
 * .agents/skills/rubrica-voz/references/roteiro.md.
 *
 * Base: .agents/skills/rubrica-voz/references/pesquisa.md (seção 5). Comece fácil e
 * concreto; misture explicação, história, opinião e irritação; duas respostas
 * obrigatoriamente digitadas (o ditado não traz pontuação); "nunca usaria"; textos colados.
 */

export const VERSAO = "v1";
export const TEMPO_ESTIMADO = "Uns 20 minutos";

/** aberta: fala ou digita · escrita: só digitando · colar: textos prontos · regua: 1 a 5 */
export type Tipo = "aberta" | "escrita" | "colar" | "regua";

export interface Pergunta {
  id: string;
  texto: string;
  dica?: string;
  tipo: Tipo;
  opcional?: boolean;
  /** Para que a resposta serve: voz, apresentacao, case, blog, pessoal:sobre-mim, pessoal:rotina, pessoal:faq. */
  uso: string[];
  /** Só para tipo "regua": rótulos das pontas. */
  polos?: [string, string];
}

export interface Bloco {
  id: string;
  titulo: string;
  intro: string;
  perguntas: Pergunta[];
}

export const BLOCOS: Bloco[] = [
  {
    id: "a",
    titulo: "Para começar",
    intro: "Uma fácil, para esquentar.",
    perguntas: [
      {
        id: "A1",
        tipo: "aberta",
        texto: "Como você explica o que faz para alguém da sua família que não é da área?",
        dica: "Do jeito que você explicaria num almoço de domingo.",
        uso: ["voz", "apresentacao"],
      },
    ],
  },
  {
    id: "b",
    titulo: "Histórias de trabalho",
    intro: "Conte como contaria a um amigo. Detalhe concreto vale mais que resumo.",
    perguntas: [
      {
        id: "B1",
        tipo: "aberta",
        texto: "Me conta um projeto de que você tem orgulho. O que estava ruim antes, o que você fez e o que mudou?",
        uso: ["voz", "case"],
      },
      {
        id: "B2",
        tipo: "aberta",
        texto: "Conta uma vez em que algo deu errado num trabalho seu. O que você fez depois?",
        uso: ["voz", "case"],
      },
      {
        id: "B3",
        tipo: "aberta",
        texto: "Quando alguém novo te procura para um trabalho, o que você faz nos primeiros dias? Passo a passo, do seu jeito.",
        uso: ["voz", "apresentacao"],
      },
    ],
  },
  {
    id: "c",
    titulo: "O que você pensa",
    intro: "Aqui vale opinião forte. Ninguém vai publicar isso como está.",
    perguntas: [
      {
        id: "C1",
        tipo: "aberta",
        texto: "O que mais te irrita na sua área, ou no jeito como as pessoas trabalham nela?",
        uso: ["voz", "blog"],
      },
      {
        id: "C2",
        tipo: "aberta",
        texto: "Que coisa que todo mundo da sua área repete você acha errada ou exagerada?",
        uso: ["voz", "blog"],
      },
      {
        id: "C3",
        tipo: "aberta",
        texto: "Por que alguém deveria trabalhar com você, e não com outra pessoa?",
        dica: "Responda como numa conversa, não como num currículo.",
        uso: ["voz", "apresentacao"],
      },
    ],
  },
  {
    id: "d",
    titulo: "Fora do trabalho",
    intro: "Isto ajuda a montar a parte pessoal da página Sobre. Conte só o que você toparia ver no site.",
    perguntas: [
      {
        id: "D1",
        tipo: "aberta",
        texto: "Quando você não está trabalhando, o que você está fazendo?",
        uso: ["voz", "pessoal:sobre-mim"],
      },
      {
        id: "D2",
        tipo: "aberta",
        texto: "Como é um dia comum seu, da hora que acorda até a hora de dormir?",
        dica: "Pode incluir as manias: o café, o caminho, a música, o horário em que rende mais.",
        uso: ["voz", "pessoal:rotina"],
      },
      {
        id: "D3",
        tipo: "aberta",
        texto: "O que costuma surpreender quem acaba de te conhecer?",
        uso: ["voz", "pessoal:faq", "pessoal:sobre-mim"],
      },
      {
        id: "D4",
        tipo: "aberta",
        opcional: true,
        texto: "O que você anda lendo, ouvindo, assistindo ou aprendendo? Por que isso te pegou?",
        uso: ["voz", "pessoal:faq", "pessoal:rotina"],
      },
      {
        id: "D5",
        tipo: "aberta",
        opcional: true,
        texto: "De onde você é, e o que desse lugar aparece no seu jeito de ser ou de trabalhar?",
        uso: ["voz", "pessoal:sobre-mim"],
      },
    ],
  },
  {
    id: "e",
    titulo: "Escrevendo",
    intro: "Agora digitando, sem ditado: a pontuação e o ritmo da sua escrita também contam.",
    perguntas: [
      {
        id: "E1",
        tipo: "escrita",
        texto: "Escreva a mensagem que você mandaria a um cliente avisando que um prazo vai atrasar.",
        uso: ["voz"],
      },
      {
        id: "E2",
        tipo: "escrita",
        texto: "Escreva um post curto, de 3 a 5 linhas, sobre algo que você aprendeu este mês.",
        uso: ["voz", "blog"],
      },
      {
        id: "E3",
        tipo: "aberta",
        texto: "Que palavras, expressões ou jeitos de escrever você nunca usaria?",
        dica: "Um termo corporativo que você detesta, emoji, ponto de exclamação, \"jornada\", \"sinergia\"...",
        uso: ["voz"],
      },
      {
        id: "E4",
        tipo: "aberta",
        opcional: true,
        texto: "Cite alguém (pessoa ou marca) cuja escrita você admira e o que te agrada nela. E alguém que você acha insuportável, e por quê.",
        uso: ["voz"],
      },
      {
        id: "E5",
        tipo: "colar",
        opcional: true,
        texto: "Cole 2 ou 3 textos que você mesmo escreveu: um post, uma descrição de projeto, um e-mail, uma mensagem.",
        dica: "É a melhor pista do seu jeito de escrever. Tire nomes de clientes e dados que não podem sair daqui.",
        uso: ["voz"],
      },
    ],
  },
  {
    id: "f",
    titulo: "Para fechar",
    intro: "Quatro réguas rápidas, opcionais. Marque onde você se vê quando escreve para o seu site.",
    perguntas: [
      { id: "F1", tipo: "regua", opcional: true, texto: "Formal ou casual?", polos: ["formal", "casual"], uso: ["voz"] },
      { id: "F2", tipo: "regua", opcional: true, texto: "Sério ou bem-humorado?", polos: ["sério", "bem-humorado"], uso: ["voz"] },
      {
        id: "F3",
        tipo: "regua",
        opcional: true,
        texto: "Respeitoso ou irreverente?",
        polos: ["respeitoso", "irreverente"],
        uso: ["voz"],
      },
      {
        id: "F4",
        tipo: "regua",
        opcional: true,
        texto: "Objetivo ou entusiasmado?",
        polos: ["objetivo", "entusiasmado"],
        uso: ["voz"],
      },
    ],
  },
];
