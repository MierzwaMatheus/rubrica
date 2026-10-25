/*
 * Textos de interface da entrevista de voz, por idioma, e o Markdown que a pessoa cola no
 * agente. O Markdown é lido pela skill rubrica-voz (scripts/voz_metricas.py e
 * references/roteiro.md): o que ela usa para parsear NÃO se traduz. Fica igual nos dois
 * idiomas: a 1ª linha `<!-- rubrica-voz VERSAO -->`, os títulos `## bloco` e
 * `### ID. pergunta`, o comentário `<!-- uso: … · tipo: … · opcional · modo: … -->` com
 * chaves e valores em português, e a régua `n/5 (1 = …, 5 = …)`. Em inglês entram só a
 * linha `<!-- idioma: en -->` logo depois da 1ª e o vazio `_(no answer)_`.
 */
import type { Lang } from "../i18n/routes";
import { ROTEIRO, VERSAO } from "./voz";

export type Modo = "digitado" | "ditado" | "colado" | "misto";

export interface EstadoVoz {
  respostas: Record<string, string>;
  modos: Record<string, Modo>;
  /** Idioma do ditado (ex.: pt-BR, en-US). */
  idioma: string;
  pontuacaoAuto?: boolean;
}

export const UI = {
  pt: {
    titulo: "Entrevista de voz — Rubrica",
    descricao: "Responda falando ou digitando para o seu agente escrever o seu site do seu jeito.",
    logoAria: "Rubrica — início",
    outroIdioma: { rotulo: "English", aria: "Voice interview in English" },
    de: "de",
    eyebrow: "Entrevista de voz",
    h1: "Para o seu site soar como você.",
    lead:
      "O seu agente vai escrever a apresentação, os cases, o currículo e os posts do seu site. Técnica ele tem. O que falta é o seu jeito de falar. Responda como responderia a um amigo, sem caprichar: o jeito como você conta as coisas importa mais do que as palavras certas.",
    regras: [
      ["Uns 20 minutos.", "Dá para parar e voltar depois: tudo fica salvo neste navegador."],
      ["Fale ou digite.", "Falar costuma render mais. O navegador transcreve, e erro de transcrição não tem problema."],
      ["Nada é enviado.", "As respostas só saem daqui quando você copiar e colar no seu agente."],
      ["Pule o que não quiser.", "As perguntas marcadas como opcionais podem ficar em branco."],
    ],
    idiomaDitado: "Idioma do ditado",
    ditadoPadrao: "pt-BR",
    semDitado: "Este navegador não tem ditado. Use o Chrome, o Edge ou o Safari para falar, ou digite as respostas aqui mesmo.",
    opcional: "opcional",
    placeholder: { aberta: "Fale ou escreva aqui…", colar: "Cole aqui…", escrita: "Escreva aqui…" },
    falar: "Falar",
    parar: "Parar",
    soDigitar: "Só digitando, sem ditado",
    finalEyebrow: "Pronto",
    finalH2: "Agora é com o seu agente.",
    finalLead:
      "Copie e cole na conversa com o agente, na pasta do seu projeto. Ele vai extrair o seu tom de voz e o que for pessoal para a página Sobre, e vai te mostrar tudo antes de gravar.",
    copiar: "Copiar para o agente",
    baixar: "Baixar .md",
    limpar: "Apagar respostas",
    limparConfirmar: "Clique de novo para apagar tudo",
    previa: "Ver o que vai ser copiado",
    palavras: (n: number) => `${n} palavra${n > 1 ? "s" : ""}`,
    modo: { digitado: "digitado", ditado: "ditado", colado: "colado", misto: "misto" } as Record<Modo, string>,
    falta: (ids: string[]) =>
      `Faltam ${ids.length} pergunta(s) não opcionais: ${ids.join(", ")}. Dá para copiar assim mesmo, mas a voz sai melhor com todas.`,
    micBloqueado: "O navegador bloqueou o microfone. Libere o acesso ou digite a resposta.",
    copiado: "Copiado. Cole na conversa com o seu agente.",
    copiarManual: "Não deu para copiar sozinho: o texto está selecionado, é só copiar (Ctrl+C).",
    apagadas: "Respostas apagadas deste navegador.",
    arquivo: "entrevista-de-voz.md",
  },
  en: {
    titulo: "Voice interview — Rubrica",
    descricao: "Answer by talking or typing so your agent writes your site the way you'd say it.",
    logoAria: "Rubrica — home",
    outroIdioma: { rotulo: "Português", aria: "Entrevista de voz em português" },
    de: "of",
    eyebrow: "Voice interview",
    h1: "So your site sounds like you.",
    lead:
      "Your agent is going to write your site's intro, case studies, résumé and posts. It has the technique down. What it's missing is the way you talk. Answer like you'd answer a friend, no polishing: how you tell things matters more than finding the perfect words.",
    regras: [
      ["About 20 minutes.", "You can stop and come back later: everything is saved in this browser."],
      ["Talk or type.", "Talking usually gets you further. The browser transcribes, and transcription mistakes are fine."],
      ["Nothing is sent.", "Your answers only leave this page when you copy and paste them into your agent."],
      ["Skip whatever you like.", "Questions marked optional can stay blank."],
    ],
    idiomaDitado: "Dictation language",
    ditadoPadrao: "en-US",
    semDitado: "This browser doesn't do dictation. Use Chrome, Edge or Safari to talk, or just type your answers here.",
    opcional: "optional",
    placeholder: { aberta: "Talk or type here…", colar: "Paste here…", escrita: "Type here…" },
    falar: "Talk",
    parar: "Stop",
    soDigitar: "Typing only, no dictation",
    finalEyebrow: "Done",
    finalH2: "Now it's over to your agent.",
    finalLead:
      "Copy it and paste it into your conversation with the agent, in your project folder. It'll pick up your tone of voice and the personal bits for your About page, and show you everything before saving.",
    copiar: "Copy for your agent",
    baixar: "Download .md",
    limpar: "Delete answers",
    limparConfirmar: "Click again to delete everything",
    previa: "See what will be copied",
    palavras: (n: number) => `${n} word${n > 1 ? "s" : ""}`,
    modo: { digitado: "typed", ditado: "dictated", colado: "pasted", misto: "mixed" } as Record<Modo, string>,
    falta: (ids: string[]) =>
      `${ids.length} required question${ids.length > 1 ? "s" : ""} left: ${ids.join(", ")}. You can copy anyway, but your voice comes through better with all of them.`,
    micBloqueado: "The browser blocked the microphone. Allow access or type your answer.",
    copiado: "Copied. Paste it into your conversation with the agent.",
    copiarManual: "Couldn't copy automatically: the text is selected, just copy it (Ctrl+C).",
    apagadas: "Answers deleted from this browser.",
    arquivo: "voice-interview.md",
  },
} satisfies Record<Lang, unknown>;

/** Cabeçalho e marcação do Markdown por idioma. */
const MD = {
  pt: {
    titulo: "# Entrevista de voz",
    respondida: (data: string, idioma: string) => `Respondida em ${data}. Idioma do ditado: ${idioma}.`,
    nota: (auto: boolean) => [
      "> Para o agente: esta é a entrevista de voz do Rubrica. Use a skill `rubrica-voz` (etapa \"Extração\")",
      "> para montar o perfil de voz em `.rubrica/perfil.md` e propor o conteúdo pessoal da página Sobre.",
      "> Respostas com modo \"ditado\" vieram do ditado do navegador: podem ter palavras trocadas e",
      `> ${auto ? "pontuação automática" : "não têm pontuação confiável"}. \"colado\" = texto que a pessoa já tinha escrito.`,
    ],
    vazio: "_(sem resposta)_",
  },
  en: {
    titulo: "# Voice interview",
    respondida: (data: string, idioma: string) => `Answered on ${data}. Dictation language: ${idioma}.`,
    nota: (auto: boolean) => [
      "> For the agent: this is the Rubrica voice interview, answered in English. Use the `rubrica-voz` skill",
      "> (\"Extração\" step) to build the voice profile in `.rubrica/perfil.md` and propose the personal content",
      "> for the About page. Answers with mode \"ditado\" came from the browser's dictation: they may have wrong",
      `> words and ${auto ? "automatic punctuation" : "no reliable punctuation"}. \"colado\" = text the person had already written.`,
      "> The `uso · tipo · modo` tags stay in Portuguese on purpose: that is the format the skill reads.",
    ],
    vazio: "_(no answer)_",
  },
} satisfies Record<Lang, unknown>;

/** O Markdown que a pessoa copia para o agente. `data` no formato aaaa-mm-dd. */
export function gerarMarkdown(lang: Lang, estado: EstadoVoz, data: string): string {
  const t = MD[lang];
  const linhas: string[] = [`<!-- rubrica-voz ${VERSAO} -->`];
  if (lang !== "pt") linhas.push(`<!-- idioma: ${lang} -->`);
  linhas.push(t.titulo, "", t.respondida(data, estado.idioma), "", ...t.nota(!!estado.pontuacaoAuto), "");
  for (const b of ROTEIRO[lang]) {
    linhas.push(`## ${b.titulo}`, "");
    for (const q of b.perguntas) {
      const r = (estado.respostas[q.id] ?? "").trim();
      linhas.push(`### ${q.id}. ${q.texto}`);
      if (q.tipo === "regua") {
        linhas.push(`<!-- uso: ${q.uso.join(", ")} · tipo: regua -->`);
        linhas.push("", r ? `${r}/5 (1 = ${q.polos![0]}, 5 = ${q.polos![1]})` : t.vazio, "");
        continue;
      }
      const modo = r ? estado.modos[q.id] ?? "digitado" : "sem resposta";
      linhas.push(`<!-- uso: ${q.uso.join(", ")} · tipo: ${q.tipo}${q.opcional ? " · opcional" : ""} · modo: ${modo} -->`);
      linhas.push("", r || t.vazio, "");
    }
  }
  return linhas.join("\n");
}
