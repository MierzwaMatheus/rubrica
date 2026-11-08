/** Dados e atalhos dos testes do comercial. */
import { api, internal, type T } from "../_setup";

export const PROPOSAL = {
  clientName: "Cliente Exemplo",
  title: { "pt-BR": "Site institucional", en: "Company website" },
  objective: { "pt-BR": "Um site novo" },
  scope: [{ "pt-BR": "Design" }, { "pt-BR": "Desenvolvimento" }],
  timeline: [{ step: { "pt-BR": "Design" }, period: { "pt-BR": "2 semanas" } }],
  deliveryDate: "2027-03-15",
  investmentValue: 5000,
  paymentMethods: [{ "pt-BR": "PIX" }],
  conditions: [{ "pt-BR": "50% no início" }],
  rescissionPolicy: { "pt-BR": "Multa de 10%" },
};

export const ACCEPTANCE = {
  clientName: "Maria Exemplo",
  clientDocument: "123.456.789-00",
  clientEmail: "Maria@Exemplo.dev",
};

/** Chamada às rotas HTTP públicas, vinda do site. */
export function post(t: T, path: string, body: unknown, headers: Record<string, string> = {}) {
  return t.fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "https://exemplo.dev", "x-forwarded-for": "203.0.113.7", "user-agent": "vitest", ...headers },
    body: JSON.stringify(body),
  });
}

/** Funções agendadas (avisos do Telegram, cancelamentos no Asaas), pelo nome. */
export async function scheduled(t: T): Promise<string[]> {
  return t.run(async (ctx) => (await ctx.db.system.query("_scheduled_functions").collect()).map((f) => f.name));
}

export async function notifications(t: T): Promise<string[]> {
  return t.run(async (ctx) =>
    (await ctx.db.system.query("_scheduled_functions").collect())
      .filter((f) => f.name.includes("commerce:notifyAdmin"))
      .map((f) => String((f.args[0] as { message: string }).message)),
  );
}

export { api, internal };
