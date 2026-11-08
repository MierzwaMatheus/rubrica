/*
 * Roteiro da entrevista de voz em inglês (página /en/voice). Espelha voz.ts: mesmas
 * perguntas, mesma ordem, mesmos ids, tipo, uso e opcional. Só os textos mudam, e são
 * adaptados (não traduzidos ao pé da letra) para soar como uma conversa entre amigos.
 */
import type { Bloco } from "./voz";

export const BLOCOS_EN: Bloco[] = [
  {
    id: "a",
    titulo: "Getting started",
    intro: "An easy one, to warm up.",
    perguntas: [
      {
        id: "A1",
        tipo: "aberta",
        texto: "How do you explain what you do to someone in your family who isn't in your field?",
        dica: "The way you'd explain it over a family dinner.",
        uso: ["voz", "apresentacao"],
      },
    ],
  },
  {
    id: "b",
    titulo: "Work stories",
    intro: "Tell it the way you'd tell a friend. A concrete detail beats a summary.",
    perguntas: [
      {
        id: "B1",
        tipo: "aberta",
        texto: "Tell me about a project you're proud of. What was wrong before, what did you do, and what changed?",
        uso: ["voz", "case"],
      },
      {
        id: "B2",
        tipo: "aberta",
        texto: "Tell me about a time something went wrong in your work. What did you do next?",
        uso: ["voz", "case"],
      },
      {
        id: "B3",
        tipo: "aberta",
        texto: "When someone new comes to you for a job, what do you do in the first few days? Step by step, your way.",
        uso: ["voz", "apresentacao"],
      },
    ],
  },
  {
    id: "c",
    titulo: "What you think",
    intro: "Strong opinions welcome. Nobody is going to publish this as is.",
    perguntas: [
      {
        id: "C1",
        tipo: "aberta",
        texto: "What bugs you most about your field, or about the way people work in it?",
        uso: ["voz", "blog"],
      },
      {
        id: "C2",
        tipo: "aberta",
        texto: "What's something everyone in your field keeps saying that you think is wrong or overblown?",
        uso: ["voz", "blog"],
      },
      {
        id: "C3",
        tipo: "aberta",
        texto: "Why should someone work with you and not with someone else?",
        dica: "Answer like you're having a conversation, not writing a résumé.",
        uso: ["voz", "apresentacao"],
      },
    ],
  },
  {
    id: "d",
    titulo: "Outside work",
    intro: "This helps build the personal side of your About page. Only share what you'd be happy to see on your site.",
    perguntas: [
      {
        id: "D1",
        tipo: "aberta",
        texto: "When you're not working, what are you up to?",
        uso: ["voz", "pessoal:sobre-mim"],
      },
      {
        id: "D2",
        tipo: "aberta",
        texto: "What does a normal day look like for you, from the moment you wake up to when you go to bed?",
        dica: "Throw in the little habits: the coffee, the commute, the music, the time of day you get the most done.",
        uso: ["voz", "pessoal:rotina"],
      },
      {
        id: "D3",
        tipo: "aberta",
        texto: "What tends to surprise people who've just met you?",
        uso: ["voz", "pessoal:faq", "pessoal:sobre-mim"],
      },
      {
        id: "D4",
        tipo: "aberta",
        opcional: true,
        texto: "What have you been reading, listening to, watching or learning lately? Why did it grab you?",
        uso: ["voz", "pessoal:faq", "pessoal:rotina"],
      },
      {
        id: "D5",
        tipo: "aberta",
        opcional: true,
        texto: "Where are you from, and how does that place show up in who you are or how you work?",
        uso: ["voz", "pessoal:sobre-mim"],
      },
    ],
  },
  {
    id: "e",
    titulo: "Writing",
    intro: "Now typing, no dictation: the punctuation and rhythm of your writing count too.",
    perguntas: [
      {
        id: "E1",
        tipo: "escrita",
        texto: "Write the message you'd send a client to let them know a deadline is going to slip.",
        uso: ["voz"],
      },
      {
        id: "E2",
        tipo: "escrita",
        texto: "Write a short post, 3 to 5 lines, about something you learned this month.",
        uso: ["voz", "blog"],
      },
      {
        id: "E3",
        tipo: "aberta",
        texto: "What words, phrases or ways of writing would you never use?",
        dica: "A corporate buzzword you can't stand, emoji, exclamation marks, \"journey\", \"synergy\"...",
        uso: ["voz"],
      },
      {
        id: "E4",
        tipo: "aberta",
        opcional: true,
        texto: "Name someone (a person or a brand) whose writing you admire and what you like about it. And someone you find unbearable, and why.",
        uso: ["voz"],
      },
      {
        id: "E5",
        tipo: "colar",
        opcional: true,
        texto: "Paste 2 or 3 things you wrote yourself: a post, a project description, an email, a message.",
        dica: "It's the best clue to how you write. Take out client names and anything that shouldn't leave this page.",
        uso: ["voz"],
      },
    ],
  },
  {
    id: "f",
    titulo: "To wrap up",
    intro: "Four quick scales, all optional. Mark where you see yourself when you write for your site.",
    perguntas: [
      { id: "F1", tipo: "regua", opcional: true, texto: "Formal or casual?", polos: ["formal", "casual"], uso: ["voz"] },
      { id: "F2", tipo: "regua", opcional: true, texto: "Serious or playful?", polos: ["serious", "playful"], uso: ["voz"] },
      {
        id: "F3",
        tipo: "regua",
        opcional: true,
        texto: "Respectful or irreverent?",
        polos: ["respectful", "irreverent"],
        uso: ["voz"],
      },
      {
        id: "F4",
        tipo: "regua",
        opcional: true,
        texto: "Matter-of-fact or enthusiastic?",
        polos: ["matter-of-fact", "enthusiastic"],
        uso: ["voz"],
      },
    ],
  },
];
