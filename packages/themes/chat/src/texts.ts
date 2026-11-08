/**
 * Textos de interface do tema Conversa (prefixo `chat.`), nos três idiomas de partida.
 * São as falas fixas da conversa: a saudação, as perguntas que "quem visita" faz em cada
 * tipo de bloco e os rótulos das peças (encaminhada, destaque, anexo do CV). O site pode
 * trocar qualquer um em "Textos".
 *
 * As perguntas têm duas versões: `chat.ask.<bloco>` (site pessoal, "você") e
 * `chat.org.ask.<bloco>` (site de empresa, "vocês"), porque em português e em espanhol
 * o tratamento muda a frase inteira.
 */
type Tr = { pt: string; en: string; es: string };
const tr = (pt: string, en: string, es: string): Tr => ({ pt, en, es });

export const CHAT_TEXTS: Record<string, Tr> = {
  "chat.today": tr("hoje", "today", "hoy"),
  "chat.home": tr("Início", "Home", "Inicio"),
  "chat.hello": tr("Oi! Eu sou {name}.", "Hi! I'm {name}.", "¡Hola! Soy {name}."),
  "chat.org.hello": tr("Olá! Aqui é {name}.", "Hi! We're {name}.", "¡Hola! Somos {name}."),
  "chat.quickReplies": tr("Respostas rápidas", "Quick replies", "Respuestas rápidas"),
  "chat.talk": tr("Fale comigo", "Get in touch", "Hablemos"),
  "chat.org.talk": tr("Fale com a gente", "Talk to us", "Habla con nosotros"),
  "chat.forwarded": tr("encaminhada", "forwarded", "reenviado"),
  "chat.featured": tr("destaque", "featured", "destacado"),
  "chat.readCase": tr("ler o case", "read the case", "leer el caso"),
  "chat.cvIntro": tr("Deixo meu currículo completo aqui também:", "Here's my full résumé too:", "Te dejo también mi currículum completo:"),
  "chat.cvFile": tr("CV.pdf", "CV.pdf", "CV.pdf"),
  "chat.cvHint": tr("PDF · gerado na hora", "PDF · generated on the spot", "PDF · generado al momento"),
  "chat.filterAsk": tr("Só os de {tag}", "Just {tag}", "Solo los de {tag}"),
  "chat.testimonialsIntro": tr("Algumas mensagens que recebi:", "A few messages I got:", "Algunos mensajes que recibí:"),
  "chat.org.testimonialsIntro": tr("Algumas mensagens que recebemos:", "A few messages we got:", "Algunos mensajes que recibimos:"),

  // Perguntas de quem visita, por bloco (site pessoal).
  "chat.ask.numeros": tr("Me mostra uns números", "Show me some numbers", "Muéstrame unos números"),
  "chat.ask.lista-itens": tr("Como você trabalha?", "How do you work?", "¿Cómo trabajas?"),
  "chat.ask.cases": tr("Quais projetos você destaca?", "Which projects would you highlight?", "¿Qué proyectos destacas?"),
  "chat.ask.servicos": tr("O que você faz?", "What do you do?", "¿Qué haces?"),
  "chat.ask.depoimentos": tr("Quem já trabalhou com você?", "Who has worked with you?", "¿Quién ha trabajado contigo?"),
  "chat.ask.posts-recentes": tr("O que você tem escrito?", "What have you been writing?", "¿Qué has estado escribiendo?"),
  "chat.ask.contato": tr("Como falo com você?", "How can I reach you?", "¿Cómo te contacto?"),
  "chat.ask.galeria": tr("Como é o seu dia a dia?", "What does your day look like?", "¿Cómo es tu día a día?"),
  "chat.ask.curriculo": tr("Me conta sua trajetória", "Walk me through your career", "Cuéntame tu trayectoria"),
  "chat.ask.precos": tr("Quanto custa?", "How much does it cost?", "¿Cuánto cuesta?"),
  "chat.ask.equipe": tr("Quem trabalha com você?", "Who works with you?", "¿Quién trabaja contigo?"),
  "chat.ask.localizacao": tr("Onde você fica?", "Where are you based?", "¿Dónde estás?"),
  "chat.ask.logos-clientes": tr("Para quem você já trabalhou?", "Who have you worked for?", "¿Para quién has trabajado?"),
  "chat.ask.video": tr("Tem algum vídeo pra eu ver?", "Got a video I can watch?", "¿Tienes algún video para ver?"),
  "chat.ask.incorporacao": tr("Dá pra marcar por aqui?", "Can I book it here?", "¿Puedo agendar por aquí?"),
  "chat.ask.linha-do-tempo": tr("Como foi o seu caminho até aqui?", "How did you get here?", "¿Cómo llegaste hasta aquí?"),
  "chat.ask.comparativo-planos": tr("O que muda entre os planos?", "What's the difference between plans?", "¿Qué cambia entre los planes?"),
  "chat.ask.resume.experience": tr("Onde você já trabalhou?", "Where have you worked?", "¿Dónde has trabajado?"),
  "chat.ask.resume.education": tr("Onde você estudou?", "Where did you study?", "¿Dónde estudiaste?"),
  "chat.ask.resume.skill": tr("Com o que você trabalha?", "What do you work with?", "¿Con qué trabajas?"),
  "chat.ask.resume.certification": tr("Fez cursos ou certificações?", "Any courses or certifications?", "¿Hiciste cursos o certificaciones?"),
  "chat.ask.resume.language": tr("Quais idiomas você fala?", "Which languages do you speak?", "¿Qué idiomas hablas?"),

  // As mesmas perguntas num site de empresa.
  "chat.org.ask.numeros": tr("Me mostra uns números", "Show me some numbers", "Muéstrenme unos números"),
  "chat.org.ask.lista-itens": tr("Como vocês trabalham?", "How do you work?", "¿Cómo trabajan?"),
  "chat.org.ask.cases": tr("Quais projetos vocês destacam?", "Which projects would you highlight?", "¿Qué proyectos destacan?"),
  "chat.org.ask.servicos": tr("O que vocês fazem?", "What do you do?", "¿Qué hacen?"),
  "chat.org.ask.depoimentos": tr("Quem já trabalhou com vocês?", "Who has worked with you?", "¿Quién ha trabajado con ustedes?"),
  "chat.org.ask.posts-recentes": tr("O que vocês têm escrito?", "What have you been writing?", "¿Qué han estado escribiendo?"),
  "chat.org.ask.contato": tr("Como falo com vocês?", "How can I reach you?", "¿Cómo los contacto?"),
  "chat.org.ask.galeria": tr("Como é o dia a dia de vocês?", "What's a day like at your place?", "¿Cómo es su día a día?"),
  "chat.org.ask.curriculo": tr("Me conta a trajetória de vocês", "Walk me through your story", "Cuéntenme su trayectoria"),
  "chat.org.ask.precos": tr("Quanto custa?", "How much does it cost?", "¿Cuánto cuesta?"),
  "chat.org.ask.equipe": tr("Quem faz parte do time?", "Who's on the team?", "¿Quién forma el equipo?"),
  "chat.org.ask.localizacao": tr("Onde vocês ficam?", "Where are you based?", "¿Dónde están?"),
  "chat.org.ask.logos-clientes": tr("Para quem vocês já trabalharam?", "Who have you worked for?", "¿Para quién han trabajado?"),
  "chat.org.ask.video": tr("Tem algum vídeo pra eu ver?", "Got a video I can watch?", "¿Tienen algún video para ver?"),
  "chat.org.ask.incorporacao": tr("Dá pra marcar por aqui?", "Can I book it here?", "¿Puedo agendar por aquí?"),
  "chat.org.ask.linha-do-tempo": tr("Como vocês chegaram até aqui?", "How did you get here?", "¿Cómo llegaron hasta aquí?"),
  "chat.org.ask.comparativo-planos": tr("O que muda entre os planos?", "What's the difference between plans?", "¿Qué cambia entre los planes?"),
};
