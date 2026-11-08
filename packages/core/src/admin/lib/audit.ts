/**
 * Rótulos do registro de atividades (tela Atividades): cada ação que o backend grava
 * (`logUserAction`, `logAudit`, `logFromAction`), cada tipo de alvo e o detalhe que vem
 * nos metadados (qual plugin, qual usuário, qual assunto). Puro: testável sem React.
 */
import type { SiteKind } from "../../content/types";
import { isRole, ROLE_LABELS } from "../../convex/lib/roles";
import { CONTENT_LABELS } from "./labels";

/** Só o que a frase usa de um registro de `auditLog`. */
export interface AuditEntry {
  eventType: string;
  targetType?: string;
  targetId?: string;
  metadata?: unknown;
  success?: boolean;
}

type Meta = Record<string, unknown>;

interface ActionDef {
  /** Verbo ou frase. */
  label: string;
  /** `false` quando a frase já diz o alvo, ou o alvo não ajuda. Padrão: mostra o alvo. */
  target?: boolean;
  /** Detalhe próprio. Sem ele, usa o nome do documento (`metadata.label`), se vier. */
  detail?: (meta: Meta, targetId?: string) => string | undefined;
}

const text = (value: unknown): string | undefined => (typeof value === "string" && value.trim() ? value.trim() : undefined);
const named = (map: Record<string, string>, value: unknown): string | undefined => {
  const key = text(value);
  return key ? (map[key] ?? key) : undefined;
};
const roleName = (value: unknown) => (isRole(value) ? ROLE_LABELS[value] : text(value));
const joinDetail = (...parts: (string | undefined)[]) => parts.filter(Boolean).join(" · ") || undefined;

const CONTACT_STATUS: Record<string, string> = { new: "novo", read: "lido", archived: "arquivado" };
const DESTINATION: Record<string, string> = { telegram: "Telegram", email: "e-mail", webhook: "webhook" };
const PROVIDER: Record<string, string> = { asaas: "Asaas" };

/**
 * Ações pelo nome do evento. Quando a mesma ação aparece com subtipos (`admin.update`
 * com `metadata.action`), a chave é `evento:subtipo`.
 */
export const AUDIT_ACTIONS: Record<string, ActionDef> = {
  // Coleções e páginas
  "admin.create": { label: "criou" },
  "admin.update": { label: "editou" },
  "admin.publish": { label: "publicou" },
  "admin.unpublish": { label: "despublicou" },
  "admin.delete": { label: "mandou para a lixeira" },
  "admin.restore": { label: "restaurou" },
  "admin.permanent_delete": { label: "apagou de vez" },
  "admin.reorder": { label: "reordenou" },
  "admin.update:payment_link": { label: "gerou o link de pagamento" },
  "admin.update:payment_link_removed": { label: "removeu o link de pagamento" },
  "admin.update:password_reset": { label: "redefiniu a senha da proposta", target: false },
  "admin.update:set_default": { label: "definiu como padrão" },
  "page.blocks_reordered": { label: "reordenou os blocos", target: false },
  "page.block_added": { label: "adicionou um bloco" },
  "page.block_updated": { label: "editou um bloco" },
  "page.block_shown": { label: "mostrou um bloco" },
  "page.block_hidden": { label: "escondeu um bloco" },
  "page.block_removed": { label: "removeu um bloco" },

  // Biblioteca de imagens
  "media.uploaded": { label: "enviou" },
  "media.updated": { label: "editou" },
  "media.replaced": { label: "substituiu" },
  "media.deleted": { label: "apagou" },

  // Depoimentos
  "testimonial.approved": { label: "aprovou" },
  "testimonial.rejected": { label: "recusou" },
  "testimonial.submitted": { label: "enviou um depoimento", target: false, detail: (m) => (text(m.page) ? `pela página ${m.page}` : undefined) },

  // Contatos e avisos
  "contact.submitted": {
    label: "enviou um pedido de contato",
    target: false,
    detail: (m) => joinDetail(m.spam === true ? "possível spam" : undefined, text(m.page) ? `pela página ${m.page}` : undefined),
  },
  "contact.status_changed": {
    label: "mudou o estado",
    detail: (m) => (text(m.from) && text(m.to) ? `${named(CONTACT_STATUS, m.from)} → ${named(CONTACT_STATUS, m.to)}` : undefined),
  },
  "contact.deleted": { label: "apagou" },
  "contact.destinations_updated": {
    label: "mudou os destinos dos avisos",
    target: false,
    detail: (m) => {
      const on = (["telegram", "email", "webhook"] as const).filter((k) => m[k] === true);
      return on.length ? on.map((k) => DESTINATION[k]).join(", ") : "nenhum destino ligado";
    },
  },
  "contact.delivery_retried": { label: "tentou de novo o aviso", target: false, detail: (m) => named(DESTINATION, m.destination) },
  "contact.delivery_failed": {
    label: "um aviso não foi entregue",
    target: false,
    detail: (m) => joinDetail(named(DESTINATION, m.destination), text(m.error)),
  },

  // Configurações, textos e plugins
  "settings.updated": { label: "mudou as configurações do site", target: false },
  "texts.updated": { label: "mudou um texto da interface", target: false, detail: (_m, id) => id },
  "texts.reset": { label: "voltou um texto da interface ao padrão", target: false, detail: (_m, id) => id },
  "plugin.enabled": { label: "ligou o plugin", target: false, detail: (m, id) => text(m.label) ?? id },
  "plugin.disabled": { label: "desligou o plugin", target: false, detail: (m, id) => text(m.label) ?? id },

  // Usuários e acesso
  "user.created": {
    label: "criou o usuário",
    target: false,
    detail: (m) => joinDetail(text(m.email), roleName(m.role) && `papel: ${roleName(m.role)}`),
  },
  "user.role_assigned": {
    label: "mudou o papel de um usuário",
    target: false,
    detail: (m) => (roleName(m.role) ? `${roleName(m.previous) ? `${roleName(m.previous)} → ` : "para "}${roleName(m.role)}` : undefined),
  },
  "user.removed": { label: "removeu o usuário", target: false, detail: (m) => text(m.email) },
  "user.root_created": { label: "criou a conta da agência (setup)", target: false },
  "auth.password_changed": { label: "trocou a própria senha", target: false },
  "auth.password_reset": {
    label: "reiniciou a senha de um usuário",
    target: false,
    detail: (m) => (m.via === "painel" ? "pelo painel, com senha temporária" : "pelo terminal"),
  },
  "user.suspended": { label: "suspendeu o acesso de um usuário", target: false, detail: (m) => text(m.email) },
  "user.reactivated": { label: "reativou o acesso de um usuário", target: false, detail: (m) => text(m.email) },

  // Propostas e pagamentos
  "proposal.accepted": { label: "aceitou", detail: (m) => (typeof m.version === "number" ? `versão ${m.version}` : undefined) },
  "proposal.password_failed": { label: "digitou a senha errada de" },

  // Publicação, LGPD e webhooks
  "publish.triggered": { label: "publicou o site", target: false },
  "publish.failed": { label: "tentou publicar o site", target: false, detail: (m) => text(m.error) },
  "lgpd.erasure_executed": {
    label: "excluiu os dados de um titular (LGPD)",
    target: false,
    detail: (m) => (typeof m.total === "number" ? `${m.total} registro(s)` : undefined),
  },
  "webhook.unauthorized": { label: "recebeu um webhook com o token errado", target: false, detail: (_m, id) => (id ? (PROVIDER[id] ?? id) : undefined) },
};

/** Tipos de alvo. `kinds` esconde o tipo no filtro quando não se aplica ao tipo do site. */
export const AUDIT_TARGETS: Record<string, { label: string; kinds?: SiteKind[] }> = {
  page: { label: CONTENT_LABELS.page },
  posts: { label: CONTENT_LABELS.posts },
  projects: { label: CONTENT_LABELS.projects },
  services: { label: CONTENT_LABELS.services },
  testimonials: { label: CONTENT_LABELS.testimonials },
  testimonialSubmission: { label: "depoimento enviado" },
  faq: { label: CONTENT_LABELS.faq },
  resume: { label: CONTENT_LABELS.resume, kinds: ["pessoal"] },
  routine: { label: CONTENT_LABELS.routine, kinds: ["pessoal"] },
  ai_resume: { label: "currículo com IA", kinds: ["pessoal"] },
  plans: { label: CONTENT_LABELS.plans, kinds: ["empresa"] },
  team: { label: CONTENT_LABELS.team, kinds: ["empresa"] },
  proposal: { label: "proposta" },
  checkout: { label: "link de pagamento" },
  contract_template: { label: "modelo de contrato" },
  media: { label: "imagem" },
  site: { label: "site" },
  contactRequest: { label: "contato" },
  contactDelivery: { label: "aviso de contato" },
  contactDestinations: { label: "destinos dos avisos" },
  user: { label: "usuário" },
  plugin: { label: "plugin" },
  siteSettings: { label: CONTENT_LABELS.siteSettings },
  uiText: { label: "texto da interface" },
  webhook: { label: "webhook" },
  titular: { label: "titular (LGPD)" },
  asaas_customer: { label: "cliente no Asaas" },
  asaas_charge: { label: "cobrança no Asaas" },
};

/** Opções do filtro de tipos da tela Atividades: só os que valem para o tipo do site, por nome. */
export function auditTargetOptions(kind: SiteKind): { value: string; label: string }[] {
  return Object.entries(AUDIT_TARGETS)
    .filter(([, t]) => !t.kinds || t.kinds.includes(kind))
    .map(([value, t]) => ({ value, label: t.label }))
    .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
}

function asMeta(value: unknown): Meta {
  return value && typeof value === "object" ? (value as Meta) : {};
}

/**
 * Frase curta da atividade: "editou · post · Meu texto", "ligou o plugin · Blog".
 * Evento sem regra aparece com o nome técnico (para não sumir), e tipo sem rótulo também.
 */
export function describeAudit(entry: AuditEntry): string {
  const meta = asMeta(entry.metadata);
  const sub = text(meta.action);
  const def = (sub && AUDIT_ACTIONS[`${entry.eventType}:${sub}`]) || AUDIT_ACTIONS[entry.eventType];
  const parts = [def ? def.label : entry.eventType];
  if (entry.targetType && def?.target !== false) parts.push(AUDIT_TARGETS[entry.targetType]?.label ?? entry.targetType);
  const detail = def?.detail ? def.detail(meta, entry.targetId) : text(meta.label);
  if (detail) parts.push(detail);
  const phrase = parts.join(" · ");
  return entry.success === false ? `${phrase} (falhou)` : phrase;
}
