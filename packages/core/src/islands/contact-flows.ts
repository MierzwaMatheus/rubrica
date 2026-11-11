/**
 * Assuntos do assistente de contato (campo `flows` do bloco `contato`), já no idioma.
 * Puro: normaliza a configuração vinda do painel e monta o pedido no formato do
 * backend (`islands/api.ts`): texto longo vira a mensagem; escolhas e textos curtos vão
 * em `details` (chaves curtas, valores até 200 caracteres), com o assunto em `topic`.
 */

export type StepKind = "choice" | "text" | "textarea" | "contact";

export interface FlowStep {
  kind: StepKind;
  /** Chaves das respostas: uma por campo (texto curto aceita várias). Vazio no contato. */
  keys: string[];
  title: string;
  options: string[];
  placeholders: string[];
  optional: boolean;
  askPhone: boolean;
  askLinkedin: boolean;
  askCompany: boolean;
}

export interface Flow {
  id: string;
  emoji: string;
  label: string;
  /** Sempre com uma etapa de contato (a do painel ou uma no fim). */
  steps: FlowStep[];
}

export interface ContactData {
  name: string;
  email: string;
  phone: string;
  linkedin: string;
  company: string;
}

const KEY_RE = /^[A-Za-z0-9_.-]{1,40}$/;
/** Chaves que o próprio assistente usa em `details`. */
const RESERVED = new Set(["topic", "linkedin", "empresa"]);
const KINDS: readonly StepKind[] = ["choice", "text", "textarea", "contact"];
const DETAIL_MAX = 200;
const MESSAGE_MAX = 5000;

const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");
const lines = (v: unknown): string[] =>
  str(v)
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

function cleanKey(raw: string, fallback: string, used: Set<string>): string {
  let key = KEY_RE.test(raw) ? raw : fallback;
  if (RESERVED.has(key)) key = `${key}_`;
  while (used.has(key)) key = `${key}_`;
  used.add(key);
  return key;
}

function readStep(raw: unknown, index: number, used: Set<string>): FlowStep | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const kind = KINDS.includes(r.kind as StepKind) ? (r.kind as StepKind) : "choice";
  const options = lines(r.options);
  if (kind === "choice" && options.length === 0) return null;
  const rawKeys = kind === "contact" ? [] : str(r.key).split(",").map((k) => k.trim());
  const count = kind === "text" ? Math.max(rawKeys.filter(Boolean).length, 1) : kind === "contact" ? 0 : 1;
  const keys = Array.from({ length: count }, (_, j) => cleanKey(rawKeys[j] ?? "", count > 1 ? `q${index + 1}_${j + 1}` : `q${index + 1}`, used));
  return {
    kind,
    keys,
    title: str(r.title),
    options,
    placeholders: lines(r.placeholder),
    optional: r.optional === true,
    askPhone: r.askPhone === true,
    askLinkedin: r.askLinkedin === true,
    askCompany: r.askCompany === true,
  };
}

const CONTACT_STEP: FlowStep = { kind: "contact", keys: [], title: "", options: [], placeholders: [], optional: false, askPhone: false, askLinkedin: false, askCompany: false };

/** Assuntos válidos da configuração (os sem rótulo saem; etapa de escolha sem opções sai). */
export function readFlows(raw: unknown): Flow[] {
  if (!Array.isArray(raw)) return [];
  const flows: Flow[] = [];
  raw.forEach((item, i) => {
    if (!item || typeof item !== "object") return;
    const r = item as Record<string, unknown>;
    const label = str(r.label);
    if (!label) return;
    const used = new Set<string>();
    const steps: FlowStep[] = [];
    let hasContact = false;
    (Array.isArray(r.steps) ? r.steps : []).forEach((s, j) => {
      const step = readStep(s, j, used);
      if (!step) return;
      if (step.kind === "contact") {
        if (hasContact) return;
        hasContact = true;
      }
      steps.push(step);
    });
    if (!hasContact) steps.push(CONTACT_STEP);
    flows.push({ id: str(r.id) || `assunto-${i + 1}`, emoji: str(r.emoji), label, steps });
  });
  return flows;
}

/** Etapas numeradas do assunto: as dele mais o resumo. */
export function totalSteps(flow: Flow): number {
  return flow.steps.length + 1;
}

/** Campos obrigatórios em falta na etapa: chave → motivo (`required` ou `email`). */
export function stepErrors(step: FlowStep, answers: Record<string, string>, contact: ContactData, consent: boolean): Record<string, "required" | "email" | "consent"> {
  const out: Record<string, "required" | "email" | "consent"> = {};
  if (step.kind === "contact") {
    if (!contact.name.trim()) out.name = "required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.email.trim())) out.email = "email";
    if (!consent) out.consent = "consent";
    return out;
  }
  if (step.optional) return out;
  for (const key of step.keys) if (!(answers[key] ?? "").trim()) out[key] = "required";
  return out;
}

/** Linhas do resumo: pergunta (ou a chave) e resposta, só as respondidas. */
export function summaryRows(flow: Flow, answers: Record<string, string>): { label: string; value: string }[] {
  const rows: { label: string; value: string }[] = [];
  for (const step of flow.steps) {
    if (step.kind === "contact") continue;
    const values = step.keys.map((k) => (answers[k] ?? "").trim()).filter(Boolean);
    if (values.length) rows.push({ label: step.title || step.keys.join(", "), value: values.join(" · ") });
  }
  return rows;
}

/** Mensagem, `details` e telefone do pedido. */
export function buildContactPayload(flow: Flow, answers: Record<string, string>, contact: ContactData): { message: string; details: Record<string, string>; phone?: string } {
  const details: Record<string, string> = { topic: flow.label.slice(0, DETAIL_MAX) };
  const free: string[] = [];
  for (const step of flow.steps) {
    if (step.kind === "contact") continue;
    for (const key of step.keys) {
      const value = (answers[key] ?? "").trim();
      if (!value) continue;
      if (step.kind === "textarea") free.push(value);
      // O backend aceita até 20 entradas: duas ficam para LinkedIn e empresa.
      else if (Object.keys(details).length < 18) details[key] = value.slice(0, DETAIL_MAX);
    }
  }
  if (contact.linkedin.trim()) details.linkedin = contact.linkedin.trim().slice(0, DETAIL_MAX);
  if (contact.company.trim()) details.empresa = contact.company.trim().slice(0, DETAIL_MAX);
  // Sem texto livre, a mensagem é o resumo das respostas (o backend exige mensagem).
  const fallback = summaryRows(flow, answers)
    .map((r) => `${r.label}: ${r.value}`)
    .join("\n");
  const message = (free.join("\n\n") || fallback || flow.label).slice(0, MESSAGE_MAX);
  return { message, details, ...(contact.phone.trim() ? { phone: contact.phone.trim() } : {}) };
}
