/**
 * Fontes de dados pessoais (LGPD): o ponto de extensão da exportação, da exclusão e
 * da política de privacidade. Cada recurso que guarda dado de um titular declara
 * aqui como achar, apagar e descrever esses dados.
 *
 * Para acrescentar uma fonte (ex.: propostas, checkouts):
 * 1. escreva um `PersonalDataSource` no módulo do recurso;
 * 2. inclua-o em `CORE_PERSONAL_DATA_SOURCES` (ou, num projeto, em
 *    `createRubrica({ personalData: [...] })`).
 *
 * A busca é sempre pelo e-mail normalizado (minúsculo, sem espaços). Quem precisa de
 * outro identificador (CPF/CNPJ) deve achar os e-mails ligados a ele dentro de `find`
 * e `erase`. Os dados que ficam por obrigação legal (ex.: aceite de proposta) devem ser
 * anonimizados em vez de apagados, e `erase` decide isso.
 */
import { deleteDeliveries } from "./contacts";
import type { PolicyEntry, Tri } from "./lib/privacyPolicy";
import type { MutationCtx, ReaderCtx } from "./server";

export interface PersonalDataSource {
  /** Identificador estável (aparece na exportação). */
  id: string;
  label: Tri;
  /** Plugin que coleta os dados: a política só descreve a fonte com ele ligado. */
  plugin?: string;
  /** Registros do titular, para a exportação. */
  find?: (ctx: ReaderCtx, email: string) => Promise<Record<string, unknown>[]>;
  /** Apaga ou anonimiza os registros do titular. Devolve quantos foram afetados. */
  erase?: (ctx: MutationCtx, email: string) => Promise<number>;
  /** O que a política de privacidade diz desta fonte. */
  policy?: PolicyEntry;
}

export const contactRequestsSource: PersonalDataSource = {
  id: "contactRequests",
  label: { pt: "Pedidos de contato", en: "Contact requests", es: "Solicitudes de contacto" },
  plugin: "contact-wizard",
  async find(ctx, email) {
    return ctx.db
      .query("contactRequests")
      .withIndex("by_email", (q) => q.eq("email", email))
      .collect();
  },
  async erase(ctx, email) {
    const docs = await ctx.db
      .query("contactRequests")
      .withIndex("by_email", (q) => q.eq("email", email))
      .collect();
    for (const doc of docs) {
      await deleteDeliveries(ctx, "contact", doc._id);
      await ctx.db.delete(doc._id);
    }
    return docs.length;
  },
  policy: {
    data: {
      pt: "nome, e-mail, telefone (se informado), a mensagem e as respostas do formulário",
      en: "name, e-mail, phone (if given), the message and the form answers",
      es: "nombre, correo, teléfono (si lo indica), el mensaje y las respuestas del formulario",
    },
    purpose: {
      pt: "Usamos para responder ao seu pedido.",
      en: "We use them to answer your request.",
      es: "Los usamos para responder a su solicitud.",
    },
  },
};

export const testimonialSubmissionsSource: PersonalDataSource = {
  id: "testimonialSubmissions",
  label: { pt: "Depoimentos enviados", en: "Submitted testimonials", es: "Testimonios enviados" },
  plugin: "testimonials-intake",
  async find(ctx, email) {
    const subs = await ctx.db
      .query("testimonialSubmissions")
      .withIndex("by_email", (q) => q.eq("email", email))
      .collect();
    return Promise.all(subs.map(async (s) => ({ ...s, published: s.testimonialId ? await ctx.db.get(s.testimonialId) : null })));
  },
  /** Apaga o envio e, se aprovado, o depoimento publicado a partir dele. */
  async erase(ctx, email) {
    const subs = await ctx.db
      .query("testimonialSubmissions")
      .withIndex("by_email", (q) => q.eq("email", email))
      .collect();
    let count = 0;
    for (const sub of subs) {
      if (sub.testimonialId && (await ctx.db.get(sub.testimonialId))) {
        await ctx.db.delete(sub.testimonialId);
        count++;
      }
      await deleteDeliveries(ctx, "testimonial", sub._id);
      await ctx.db.delete(sub._id);
      count++;
    }
    return count;
  },
  policy: {
    data: {
      pt: "nome, e-mail, cargo, empresa e o texto do depoimento",
      en: "name, e-mail, job title, company and the testimonial text",
      es: "nombre, correo, cargo, empresa y el texto del testimonio",
    },
    purpose: {
      pt: "Depois de aprovado, o depoimento é publicado no site com nome, cargo e empresa. O e-mail não é publicado; serve só para falar com você.",
      en: "Once approved, the testimonial is published on the site with name, job title and company. The e-mail is never published; it is only used to reach you.",
      es: "Una vez aprobado, el testimonio se publica en el sitio con nombre, cargo y empresa. El correo no se publica; solo sirve para contactarle.",
    },
    retention: {
      pt: "o envio fica até ser aprovado ou recusado; o depoimento publicado, até você pedir a remoção",
      en: "the submission is kept until approved or rejected; the published testimonial, until you ask for removal",
      es: "el envío se guarda hasta ser aprobado o rechazado; el testimonio publicado, hasta que solicite su retirada",
    },
  },
};

/*
 * Fontes da parte comercial (propostas e pagamentos): por enquanto só o texto da
 * política. Quem criar as tabelas acrescenta `find` e `erase` aqui (ou substitui
 * estas entradas pelas do módulo, mantendo o `id`).
 */
export const proposalsPolicySource: PersonalDataSource = {
  id: "proposals",
  label: { pt: "Propostas comerciais", en: "Commercial proposals", es: "Propuestas comerciales" },
  plugin: "proposals",
  policy: {
    data: {
      pt: "nome, e-mail, documento (CPF/CNPJ) e os dados do aceite eletrônico",
      en: "name, e-mail, tax ID (CPF/CNPJ) and the electronic acceptance details",
      es: "nombre, correo, documento (CPF/CNPJ) y los datos de la aceptación electrónica",
    },
    purpose: {
      pt: "Usamos para enviar a proposta e registrar o aceite, como prova do acordo.",
      en: "We use them to send the proposal and record its acceptance as proof of the agreement.",
      es: "Los usamos para enviar la propuesta y registrar la aceptación como prueba del acuerdo.",
    },
    retention: {
      pt: "o registro do aceite fica pelo prazo legal; ao pedir a exclusão, ele é anonimizado",
      en: "the acceptance record is kept for the legal period; on deletion requests it is anonymized",
      es: "el registro de aceptación se guarda durante el plazo legal; al solicitar la eliminación, se anonimiza",
    },
  },
};

export const paymentsPolicySource: PersonalDataSource = {
  id: "checkouts",
  label: { pt: "Pagamentos", en: "Payments", es: "Pagos" },
  plugin: "payments",
  policy: {
    data: {
      pt: "nome, e-mail, telefone e CPF/CNPJ de quem paga",
      en: "payer's name, e-mail, phone and tax ID (CPF/CNPJ)",
      es: "nombre, correo, teléfono y CPF/CNPJ de quien paga",
    },
    purpose: {
      pt: "Usamos para gerar a cobrança (PIX, boleto ou cartão) e emitir o comprovante. Os dados do cartão vão direto ao Asaas e não passam por este site.",
      en: "We use them to create the charge (PIX, boleto or card) and issue the receipt. Card details go straight to Asaas and never pass through this site.",
      es: "Los usamos para generar el cobro (PIX, boleto o tarjeta) y emitir el comprobante. Los datos de la tarjeta van directo a Asaas y no pasan por este sitio.",
    },
    sharedWith: [
      {
        name: "Asaas",
        purpose: { pt: "processamento dos pagamentos", en: "payment processing", es: "procesamiento de los pagos" },
      },
    ],
  },
};

/** Fontes do núcleo. A ordem é a da exportação e da política. */
export const CORE_PERSONAL_DATA_SOURCES: PersonalDataSource[] = [
  contactRequestsSource,
  testimonialSubmissionsSource,
  proposalsPolicySource,
  paymentsPolicySource,
];

/** Fontes efetivas: as do projeto com o mesmo `id` substituem as do núcleo. */
export function resolvePersonalDataSources(extra: readonly PersonalDataSource[] = []): PersonalDataSource[] {
  const byId = new Map<string, PersonalDataSource>();
  for (const source of [...CORE_PERSONAL_DATA_SOURCES, ...extra]) byId.set(source.id, source);
  return [...byId.values()];
}
