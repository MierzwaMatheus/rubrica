/**
 * Rótulos em português de nomes técnicos que aparecem no painel: tipos de conteúdo (onde
 * uma imagem é usada), campos do detalhe de um contato e assuntos do formulário. Puro.
 */
import { defaultUiText } from "../../i18n/ui-texts";

/** Tipos de conteúdo que guardam imagens ou entram num registro (chave = nome da coleção ou da tabela). */
export const CONTENT_LABELS = {
  page: "página",
  posts: "post",
  projects: "projeto",
  services: "serviço",
  testimonials: "depoimento",
  faq: "pergunta",
  resume: "item do currículo",
  routine: "dia a dia",
  plans: "plano",
  team: "pessoa da equipe",
  siteSettings: "configurações do site",
} as const;

/** Rótulo do tipo de conteúdo; tipo desconhecido sai como veio. */
export function contentLabel(type: string): string {
  return Object.prototype.hasOwnProperty.call(CONTENT_LABELS, type) ? CONTENT_LABELS[type as keyof typeof CONTENT_LABELS] : type;
}

/** Campos do detalhe de um contato. Os de assunto e os da migração da v1; o resto mostra o nome humanizado. */
const CONTACT_FIELD_LABELS: Record<string, string> = {
  topic: "Assunto",
  project: "Projeto",
  tipo: "Tipo",
  empresa: "Empresa",
  linkedin: "LinkedIn",
  origem: "Origem",
  notas: "Notas",
  atendidoPor: "Atendido por",
  situacaoV1: "Situação na v1",
};

/** `atendidoPor` → "Atendido por"; `budget_range` → "Budget range". */
export function humanizeKey(key: string): string {
  const spaced = key.replace(/[_-]+/g, " ").replace(/([a-z0-9])([A-Z])/g, "$1 $2").trim().toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/**
 * Rótulo e valor de um campo do contato. O assunto (`topic`) mostra o texto do formulário
 * ("Tenho um projeto"), e não a chave; o valor que não é conhecido sai como veio.
 */
export function contactDetail(key: string, value: string): { label: string; value: string } {
  const label = CONTACT_FIELD_LABELS[key] ?? humanizeKey(key);
  if (key === "topic") return { label, value: defaultUiText(`contactForm.topic.${value}`, "pt-BR") ?? value };
  return { label, value };
}
