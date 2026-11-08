/**
 * Textos de interface do núcleo (decisão 25): menu, "ler mais", formulários, 404.
 * O site pode sobrescrever qualquer chave em "Textos"; os temas podem acrescentar as
 * suas. As chaves aqui são por idioma base (`pt`, `en`, `es`).
 */
import type { Locale, Localized } from "./index";

export const DEFAULT_UI_TEXTS: Record<string, Localized<string>> = {
  "nav.skip": { pt: "Pular para o conteúdo", en: "Skip to content", es: "Saltar al contenido" },
  "nav.menu": { pt: "Menu", en: "Menu", es: "Menú" },
  "nav.close": { pt: "Fechar menu", en: "Close menu", es: "Cerrar menú" },
  "nav.language": { pt: "Idioma", en: "Language", es: "Idioma" },
  "theme.toggle": { pt: "Alternar tema claro e escuro", en: "Toggle light and dark theme", es: "Cambiar tema claro y oscuro" },
  "common.readMore": { pt: "Ler mais", en: "Read more", es: "Leer más" },
  "common.seeAll": { pt: "Ver todos", en: "See all", es: "Ver todos" },
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

/** Texto padrão do núcleo: idioma exato, idioma base, inglês. */
export function defaultUiText(key: string, locale: Locale): string | undefined {
  const entry = DEFAULT_UI_TEXTS[key];
  if (!entry) return undefined;
  const base = locale.split("-")[0]!.toLowerCase();
  return entry[locale] ?? entry[base] ?? entry.en;
}
