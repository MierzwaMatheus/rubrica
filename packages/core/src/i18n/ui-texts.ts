/**
 * Textos de interface do núcleo (decisão 25): menu, "ler mais", formulários, 404.
 * O site pode sobrescrever qualquer chave em "Textos"; os temas podem acrescentar as
 * suas. As chaves aqui são por idioma base (`pt`, `en`, `es`).
 */
import type { Locale, Localized } from "./index";

export const DEFAULT_UI_TEXTS: Record<string, Localized<string>> = {
  "nav.skip": { pt: "Pular para o conteúdo", en: "Skip to content", es: "Saltar al contenido" },
  "nav.menu": { pt: "Menu", en: "Menu", es: "Menú" },
  "sidebar.contact": { pt: "Contato", en: "Contact", es: "Contacto" },
  "sidebar.talk": { pt: "Fale comigo", en: "Talk to me", es: "Hablemos" },
  "nav.language": { pt: "Idioma", en: "Language", es: "Idioma" },
  "theme.toggle": { pt: "Alternar tema claro e escuro", en: "Toggle light and dark theme", es: "Cambiar tema claro y oscuro" },
  "common.readMore": { pt: "Ler mais", en: "Read more", es: "Leer más" },
  "common.back": { pt: "Voltar", en: "Back", es: "Volver" },
  "blog.readingTime": { pt: "{minutes} min de leitura", en: "{minutes} min read", es: "{minutes} min de lectura" },
  "blog.publishedAt": { pt: "Publicado em {date}", en: "Published on {date}", es: "Publicado el {date}" },
  "blog.related": { pt: "Leia também", en: "Read next", es: "Lee también" },
  "blog.allTags": { pt: "Todos", en: "All", es: "Todos" },
  "case.related": { pt: "Outros projetos", en: "More projects", es: "Otros proyectos" },
  "case.client": { pt: "Cliente", en: "Client", es: "Cliente" },
  "case.year": { pt: "Ano", en: "Year", es: "Año" },
  "case.role": { pt: "Papel", en: "Role", es: "Rol" },
  "resume.download": { pt: "Baixar currículo em PDF", en: "Download résumé (PDF)", es: "Descargar CV en PDF" },
  "resume.experience": { pt: "Experiência", en: "Experience", es: "Experiencia" },
  "resume.education": { pt: "Formação", en: "Education", es: "Formación" },
  "resume.skill": { pt: "Competências", en: "Skills", es: "Habilidades" },
  "resume.certification": { pt: "Certificações", en: "Certifications", es: "Certificaciones" },
  "resume.language": { pt: "Idiomas", en: "Languages", es: "Idiomas" },
  "resume.present": { pt: "atual", en: "present", es: "actual" },
  "pricing.highlighted": { pt: "Mais escolhido", en: "Most popular", es: "Más elegido" },
  "location.hours": { pt: "Horário", en: "Opening hours", es: "Horario" },
  "location.address": { pt: "Endereço", en: "Address", es: "Dirección" },
  "location.map": { pt: "Ver no mapa", en: "View on map", es: "Ver en el mapa" },
  "contact.email": { pt: "E-mail", en: "Email", es: "Correo" },
  "contact.whatsapp": { pt: "WhatsApp", en: "WhatsApp", es: "WhatsApp" },
  "hero.available": { pt: "Disponível para novos projetos", en: "Available for new projects", es: "Disponible para nuevos proyectos" },
  "common.empty": { pt: "Nada por aqui ainda.", en: "Nothing here yet.", es: "Aún no hay nada aquí." },
  "common.external": { pt: "(abre em nova aba)", en: "(opens in a new tab)", es: "(se abre en una pestaña nueva)" },
  "case.view": { pt: "Ver case", en: "View case study", es: "Ver caso" },
  "blog.filter": { pt: "Filtrar por etiqueta", en: "Filter by tag", es: "Filtrar por etiqueta" },
  "testimonials.send": { pt: "Enviar um depoimento", en: "Send a testimonial", es: "Enviar un testimonio" },
  "contact.phone": { pt: "Telefone", en: "Phone", es: "Teléfono" },
  "contact.channels": { pt: "Outros canais", en: "Other channels", es: "Otros canales" },
  "contact.social": { pt: "Redes", en: "Social", es: "Redes" },
  "resume.period": { pt: "Período", en: "Period", es: "Período" },
  "plans.included": { pt: "O que está incluso", en: "What's included", es: "Qué incluye" },
  "resume.downloadError": { pt: "Não foi possível abrir o currículo. Permita pop-ups e tente de novo.", en: "Couldn't open the résumé. Allow pop-ups and try again.", es: "No se pudo abrir el CV. Permite las ventanas emergentes e inténtalo de nuevo." },
  "form.name": { pt: "Nome", en: "Name", es: "Nombre" },
  "form.email": { pt: "E-mail", en: "Email", es: "Correo" },
  "form.phone": { pt: "Telefone", en: "Phone", es: "Teléfono" },
  "form.message": { pt: "Mensagem", en: "Message", es: "Mensaje" },
  "form.optional": { pt: "Opcional", en: "Optional", es: "Opcional" },
  "form.required": { pt: "Preencha este campo.", en: "Fill in this field.", es: "Completa este campo." },
  "form.invalidEmail": { pt: "Informe um e-mail válido.", en: "Enter a valid email.", es: "Ingresa un correo válido." },
  "form.consent": { pt: "Li e concordo com o tratamento dos meus dados conforme a", en: "I have read and agree to the processing of my data under the", es: "He leído y acepto el tratamiento de mis datos según la" },
  "form.consentLink": { pt: "política de privacidade", en: "privacy policy", es: "política de privacidad" },
  "form.consentRequired": { pt: "Para enviar, é preciso concordar com a política de privacidade.", en: "To send, you need to agree to the privacy policy.", es: "Para enviar, es necesario aceptar la política de privacidad." },
  "form.step": { pt: "Etapa {current} de {total}", en: "Step {current} of {total}", es: "Paso {current} de {total}" },
  "form.next": { pt: "Continuar", en: "Continue", es: "Continuar" },
  "form.back": { pt: "Voltar", en: "Back", es: "Volver" },
  "form.cancel": { pt: "Cancelar", en: "Cancel", es: "Cancelar" },
  "form.send": { pt: "Enviar", en: "Send", es: "Enviar" },
  "form.sending": { pt: "Enviando…", en: "Sending…", es: "Enviando…" },
  "form.error": { pt: "Não foi possível enviar agora. Tente de novo em instantes.", en: "Couldn't send right now. Please try again in a moment.", es: "No se pudo enviar ahora. Inténtalo de nuevo en unos instantes." },
  "form.rateLimited": { pt: "Muitos envios seguidos. Aguarde um pouco e tente de novo.", en: "Too many submissions in a row. Wait a bit and try again.", es: "Demasiados envíos seguidos. Espera un poco e inténtalo de nuevo." },
  "form.disabled": { pt: "O envio está desativado nesta demonstração.", en: "Sending is turned off in this demo.", es: "El envío está desactivado en esta demostración." },
  "contactForm.title": { pt: "Envie uma mensagem", en: "Send a message", es: "Envía un mensaje" },
  "contactForm.topic": { pt: "Sobre o que você quer falar?", en: "What would you like to talk about?", es: "¿Sobre qué quieres hablar?" },
  "contactForm.message": { pt: "Conte um pouco mais", en: "Tell me a bit more", es: "Cuéntame un poco más" },
  "contactForm.you": { pt: "Como falar com você?", en: "How can I reach you?", es: "¿Cómo puedo contactarte?" },
  "contactForm.topic.project": { pt: "Tenho um projeto", en: "I have a project", es: "Tengo un proyecto" },
  "contactForm.topic.job": { pt: "Tenho uma vaga", en: "I have a job opening", es: "Tengo una vacante" },
  "contactForm.topic.talk": { pt: "Quero trocar uma ideia", en: "I'd like to chat", es: "Quiero conversar" },
  "contactForm.topic.other": { pt: "Outro assunto", en: "Something else", es: "Otro asunto" },
  "contactForm.success": { pt: "Mensagem enviada.", en: "Message sent.", es: "Mensaje enviado." },
  "contactForm.successBody": { pt: "Obrigado pelo contato. Respondo assim que possível.", en: "Thanks for reaching out. I'll reply as soon as I can.", es: "Gracias por escribir. Responderé lo antes posible." },
  "testimonialForm.open": { pt: "Enviar um depoimento", en: "Send a testimonial", es: "Enviar un testimonio" },
  "testimonialForm.title": { pt: "Conte como foi trabalhar junto", en: "Tell us what it was like to work together", es: "Cuéntanos cómo fue trabajar juntos" },
  "testimonialForm.quote": { pt: "Seu depoimento", en: "Your testimonial", es: "Tu testimonio" },
  "testimonialForm.role": { pt: "Cargo", en: "Role", es: "Cargo" },
  "testimonialForm.company": { pt: "Empresa", en: "Company", es: "Empresa" },
  "testimonialForm.emailHint": { pt: "Não aparece no site.", en: "Not shown on the site.", es: "No se muestra en el sitio." },
  "testimonialForm.success": { pt: "Depoimento enviado.", en: "Testimonial sent.", es: "Testimonio enviado." },
  "testimonialForm.successBody": { pt: "Obrigado! Ele aparece no site depois de aprovado.", en: "Thank you! It will show on the site once approved.", es: "¡Gracias! Aparecerá en el sitio una vez aprobado." },
  "footer.rights": { pt: "Todos os direitos reservados.", en: "All rights reserved.", es: "Todos los derechos reservados." },
  "footer.privacy": { pt: "Política de privacidade", en: "Privacy policy", es: "Política de privacidad" },
  "notFound.title": { pt: "Página não encontrada", en: "Page not found", es: "Página no encontrada" },
  "notFound.body": {
    pt: "O endereço pode ter mudado ou a página não existe neste idioma.",
    en: "The address may have changed, or the page doesn't exist in this language.",
    es: "La dirección puede haber cambiado o la página no existe en este idioma.",
  },
  "notFound.home": { pt: "Ir para a página inicial", en: "Go to the home page", es: "Ir a la página de inicio" },
};

/**
 * Na linha empresa, quem fala é a empresa ("nós"): estes textos trocam a primeira pessoa
 * do singular da linha pessoal. O resto vale para os dois tipos.
 */
export const EMPRESA_UI_TEXTS: Record<string, Localized<string>> = {
  "sidebar.talk": { pt: "Fale conosco", en: "Talk to us", es: "Hablemos" },
  "contactForm.message": { pt: "Conte um pouco mais", en: "Tell us a bit more", es: "Cuéntanos un poco más" },
  "contactForm.you": { pt: "Como falar com você?", en: "How can we reach you?", es: "¿Cómo podemos contactarte?" },
  "contactForm.successBody": {
    pt: "Obrigado pelo contato. Respondemos assim que possível.",
    en: "Thanks for reaching out. We'll reply as soon as we can.",
    es: "Gracias por escribir. Responderemos lo antes posible.",
  },
};

/** Chaves de interface do núcleo que começam com algum dos prefixos. */
export function uiKeysWithPrefix(prefixes: string[]): string[] {
  return Object.keys(DEFAULT_UI_TEXTS).filter((k) => prefixes.some((p) => k.startsWith(p)));
}

/** Texto padrão do núcleo: idioma exato, idioma base, inglês. Na linha empresa, a versão em "nós" quando existe. */
export function defaultUiText(key: string, locale: Locale, kind?: "pessoal" | "empresa"): string | undefined {
  const entry = (kind === "empresa" && EMPRESA_UI_TEXTS[key]) || DEFAULT_UI_TEXTS[key];
  if (!entry) return undefined;
  const base = locale.split("-")[0]!.toLowerCase();
  return entry[locale] ?? entry[base] ?? entry.en;
}
