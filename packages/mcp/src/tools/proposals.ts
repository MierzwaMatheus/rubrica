/**
 * Ferramentas das propostas comerciais (plugin `proposals`): `proposals_list|get|create|update`.
 * O backend (`convex/commerce/proposals.ts`) é a fonte da verdade: confere o papel, o
 * plugin, o desconto e a senha. Aqui só a prévia e a validação legível antes de ir.
 *
 * A senha da proposta vem como argumento e segue para o backend, que guarda só o hash.
 * Ela nunca aparece nas respostas, na prévia nem nos avisos; o backend também não a devolve
 * (só `hasPassword`). O aceite (dados pessoais do cliente) e o contrato congelado ficam fora.
 */
import { validateDiscount } from "@rubrica/core/convex/commerce/discount";
import { proposalContentFields } from "@rubrica/core/convex/commerce/validators";
import { RubricaError } from "../client";
import { diffValues, mergeFields, contentWarnings, type Change } from "../diff";
import type { JsonSchema } from "../schema/json-schema";
import { validatorsToSchema } from "../schema/json-schema";
import { validateAgainst } from "../schema/validate";
import { siteLocales } from "../state";
import { filledLocales, prop } from "./shared";
import { commit, ToolInputError, type FieldProblem, type ToolContext, type ToolDef } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;
/** Mínimo da senha (o mesmo do backend: `MIN_PROPOSAL_PASSWORD`). */
const MIN_PASSWORD = 6;
/** Campos opcionais que `unset` apaga (os mesmos do backend). */
const UNSETTABLE = ["scopePrices", "originalValue", "giftIndexes", "templateId"] as const;
const CONTENT_KEYS = Object.keys(proposalContentFields);
const SLUG = "^[a-z0-9]+(?:-[a-z0-9]+)*$";

const DESCRIPTIONS: Record<string, string> = {
  clientName: "Nome do cliente (aparece na proposta e no contrato).",
  title: "Título da proposta.",
  objective: "Objetivo do projeto.",
  scope: "Itens do escopo, na ordem. Cada item é um texto por idioma.",
  "timeline[].step": "Etapa do cronograma.",
  "timeline[].period": "Prazo da etapa (ex.: \"2 semanas\").",
  timeline: "Cronograma: etapas com prazo.",
  deliveryDate: 'Texto livre da entrega ("15/03/2027", "6 semanas após o aceite").',
  investmentValue: "Valor final do investimento, em reais (já com o desconto, se houver).",
  scopePrices: "Preço de cada item do escopo, na mesma ordem (null = sem preço). Precisa ter o mesmo tamanho de scope.",
  originalValue: "Valor antes do desconto, em reais. Precisa ser maior que investmentValue.",
  giftIndexes: "Posições (a partir de 0) dos itens do escopo dados de brinde. Exige originalValue e preço nesses itens; a soma não passa do desconto.",
  paymentMethods: "Formas de pagamento. Cada item é um texto por idioma.",
  conditions: "Condições comerciais. Cada item é um texto por idioma.",
  rescissionPolicy: "Política de rescisão.",
  templateId: "Id de um modelo de contrato (contracts_list). Sem ele vale o modelo padrão.",
};

type Doc = Record<string, unknown> & {
  _id: string;
  slug: string;
  clientName: string;
  title?: Record<string, string>;
  version: number;
  isAccepted: boolean;
  acceptedAt?: number;
  expiresAt: number;
  createdAt: number;
  updatedAt?: number;
  deletedAt?: number;
  hasPassword?: boolean;
  templateSnapshot?: string;
};

function contentSchema(locales: readonly string[], partial: boolean): JsonSchema {
  const schema = validatorsToSchema(proposalContentFields, { locales, descriptions: DESCRIPTIONS });
  if (partial) delete schema.required;
  return schema;
}

function props(schema: JsonSchema): JsonSchema {
  return schema.properties as JsonSchema;
}

const expiresProp = prop.string("Até quando o link vale: AAAA-MM-DD (vale o dia inteiro, até 23:59:59 no fuso da máquina) ou data e hora ISO. Padrão ao criar: 10 dias.");
const passwordProp = (what: string): JsonSchema => ({
  type: "string",
  minLength: MIN_PASSWORD,
  description: `${what} Mínimo ${MIN_PASSWORD} caracteres. O backend guarda só o hash; a senha não volta em nenhuma resposta. Passa pela conversa com o agente: se isso incomoda, deixe sem senha e defina no painel.`,
});

/** `AAAA-MM-DD` vira o fim do dia; data e hora ISO vira ela mesma. */
function parseExpires(value: string): number {
  const day = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const ms = day ? new Date(Number(day[1]), Number(day[2]) - 1, Number(day[3]), 23, 59, 59).getTime() : Date.parse(value);
  if (!Number.isFinite(ms)) throw new ToolInputError(`expiresAt: data inválida "${value}". Use AAAA-MM-DD.`, [{ path: "expiresAt", message: "use AAAA-MM-DD" }]);
  return ms;
}

const iso = (ms: number) => new Date(ms).toISOString();

type Status = "accepted" | "expired" | "pending" | "trash";
function statusOf(p: Pick<Doc, "isAccepted" | "expiresAt" | "deletedAt">, now = Date.now()): Status {
  if (p.deletedAt !== undefined) return "trash";
  if (p.isAccepted) return "accepted";
  return p.expiresAt < now ? "expired" : "pending";
}

const siteUrl = (ctx: ToolContext) => ctx.state.settings?.url?.replace(/\/+$/, "");
const linkOf = (ctx: ToolContext, slug: string) => (siteUrl(ctx) ? `${siteUrl(ctx)}/proposta/${slug}` : `/proposta/${slug}`);

function summarize(p: Doc, ctx: ToolContext) {
  const lang = ctx.state.settings?.locales.default;
  const title = p.title ? ((lang && p.title[lang]) || Object.values(p.title).find((t) => t?.trim()) || "") : "";
  return {
    id: p._id,
    clientName: p.clientName,
    title,
    status: statusOf(p),
    slug: p.slug,
    url: linkOf(ctx, p.slug),
    investmentValue: p.investmentValue,
    version: p.version,
    hasPassword: !!p.hasPassword,
    expiresAt: iso(p.expiresAt),
    ...(p.acceptedAt ? { acceptedAt: iso(p.acceptedAt) } : {}),
    updatedAt: p.updatedAt ?? p.createdAt,
  };
}

/** Proposta inteira para o agente: sem a senha (nem o hash), sem o contrato congelado. */
function present(p: Doc, ctx: ToolContext) {
  const { password: _password, templateSnapshot, ...rest } = p as Doc & { password?: unknown };
  void _password;
  return {
    ...rest,
    status: statusOf(p),
    url: linkOf(ctx, p.slug),
    hasPassword: !!p.hasPassword,
    ...(templateSnapshot !== undefined ? { contractFrozen: true } : {}),
    expiresAtDate: iso(p.expiresAt),
  };
}

async function load(ctx: ToolContext, args: { id?: string; slug?: string }): Promise<Doc> {
  if (!args.id && !args.slug) throw new ToolInputError("Informe id ou slug.");
  if (args.id) {
    const item = await ctx.client.query<Doc | null>("rubrica/proposals:get", { id: args.id }).catch((e) => {
      if (e instanceof RubricaError && e.kind === "validation") return null;
      throw e;
    });
    if (item) return item;
  } else {
    const items = await ctx.client.query<Doc[]>("rubrica/proposals:list", { includeDeleted: true, limit: 500 });
    const found = items.find((i) => i.slug === args.slug);
    if (found) return found;
  }
  throw new RubricaError(`Proposta não encontrada: ${args.id ?? args.slug}. Use proposals_list.`, "validation");
}

function fail(message: string, problems: FieldProblem[]): never {
  const first = problems.slice(0, 4).map((p) => `${p.path ? `${p.path}: ` : ""}${p.message}`);
  throw new ToolInputError(`${message}: ${first.join("; ")}${problems.length > 4 ? ` (+${problems.length - 4})` : ""}`, problems);
}

/** As mesmas conferências do backend (`prepareContent` e `validateDiscount`), com o conteúdo já completo. */
function checkContent(content: Record<string, unknown>, only?: Set<string>): FieldProblem[] {
  const problems: FieldProblem[] = [];
  const wants = (k: string) => !only || only.has(k);
  if (wants("clientName") && !(typeof content.clientName === "string" && content.clientName.trim())) problems.push({ path: "clientName", message: "informe o nome do cliente" });
  if (wants("title") && filledLocales(content.title as Record<string, string>).length === 0) problems.push({ path: "title", message: "preencha em pelo menos um idioma" });
  const value = content.investmentValue;
  if (wants("investmentValue") && !(typeof value === "number" && Number.isFinite(value) && value >= 0)) problems.push({ path: "investmentValue", message: "valor inválido" });
  for (const key of ["scope", "paymentMethods", "conditions"]) {
    const list = content[key] as Record<string, string>[] | undefined;
    if (wants(key) && list?.some((item) => filledLocales(item).length === 0)) problems.push({ path: key, message: "há item vazio (preencha em pelo menos um idioma)" });
  }
  return problems;
}

function checkDiscount(content: Record<string, unknown>): FieldProblem[] {
  try {
    validateDiscount({
      investmentValue: content.investmentValue as number,
      originalValue: content.originalValue as number | undefined,
      scopePrices: content.scopePrices as (number | null)[] | undefined,
      giftIndexes: content.giftIndexes as number[] | undefined,
      scopeLength: ((content.scope as unknown[]) ?? []).length,
    });
    return [];
  } catch (e) {
    const message = (e as Error).message;
    const path = /original/i.test(message) ? "originalValue" : /brinde|soma|pre[çc]o/i.test(message) ? "scope" : "investmentValue";
    return [{ path, message }];
  }
}

const HIDDEN_PASSWORD = "(definida; oculta)";

export const proposalTools: ToolDef[] = [
  {
    name: "proposals_list",
    title: "Listar propostas",
    description:
      "Lista as propostas comerciais (cliente, título, situação, valor, link público, validade, se tem senha). Não traz a senha, o aceite nem o contrato; para o conteúdo completo use proposals_get.",
    access: { permission: "proposals", plugin: "proposals" },
    input: () => ({
      type: "object",
      properties: {
        filter: { type: "string", enum: ["all", "accepted", "pending"], description: "all (padrão), accepted (aceitas) ou pending (não aceitas, inclusive as vencidas)." },
        search: prop.string("Filtra pelo nome do cliente ou título (contém, sem maiúsculas)."),
        includeDeleted: prop.bool("Inclui as da lixeira."),
        limit: { type: "integer", minimum: 1, maximum: 200, description: "Padrão: 50." },
      },
      additionalProperties: false,
    }),
    async handler(args: { filter?: "all" | "accepted" | "pending"; search?: string; includeDeleted?: boolean; limit?: number }, ctx) {
      const docs = await ctx.client.query<Doc[]>("rubrica/proposals:list", { filter: args.filter, includeDeleted: args.includeDeleted, limit: 500 });
      const needle = args.search?.toLowerCase();
      const rows = docs.map((d) => summarize(d, ctx)).filter((r) => !needle || `${r.clientName} ${r.title}`.toLowerCase().includes(needle));
      const limit = args.limit ?? 50;
      return { total: rows.length, items: rows.slice(0, limit), ...(rows.length > limit ? { truncated: true } : {}) };
    },
  },
  {
    name: "proposals_get",
    title: "Ler proposta",
    description:
      "Lê uma proposta inteira (todos os campos por idioma, situação, versão, link público). Sem a senha (só hasPassword), sem o aceite e sem o contrato congelado.",
    access: { permission: "proposals", plugin: "proposals" },
    input: () => ({
      type: "object",
      properties: { id: prop.string("Id (de proposals_list)."), slug: prop.string("Ou o slug do link público.") },
      additionalProperties: false,
    }),
    async handler(args: { id?: string; slug?: string }, ctx) {
      return present(await load(ctx, args), ctx);
    },
  },
  {
    name: "proposals_create",
    title: "Criar proposta",
    description:
      "Cria uma proposta comercial (versão 1, ainda não aceita). O link público é /proposta/<slug>; sem slug, ele sai do nome do cliente com um sufixo aleatório. Com `password`, quem abre o link precisa da senha; sem ela, QUALQUER pessoa com o link vê a proposta. Vale 10 dias, a menos que mande expiresAt. Valores em reais; desconto exige originalValue maior que investmentValue.",
    access: { permission: "proposals", plugin: "proposals" },
    write: true,
    input: ({ state }) => {
      const schema = contentSchema(siteLocales(state), false);
      return {
        ...schema,
        properties: {
          ...props(schema),
          slug: { type: "string", pattern: SLUG, description: "Parte final do link público (kebab-case). Opcional. Depois de compartilhado, mudar quebra o link." },
          password: passwordProp("Senha do link da proposta (opcional)."),
          expiresAt: expiresProp,
        },
      };
    },
    async handler(args: Record<string, unknown>, ctx) {
      const { slug, password, expiresAt, ...content } = args as { slug?: string; password?: string; expiresAt?: string } & Record<string, unknown>;
      const locales = siteLocales(ctx.state);
      const problems = [...validateAgainst(contentSchema(locales, false), content), ...checkContent(content)];
      if (!problems.length) problems.push(...checkDiscount(content));
      if (password !== undefined && password.length < MIN_PASSWORD) problems.push({ path: "password", message: `pelo menos ${MIN_PASSWORD} caracteres` });
      const expires = expiresAt !== undefined ? parseExpires(expiresAt) : undefined;
      if (problems.length) fail("Proposta inválida", problems);

      const changes: Change[] = diffValues(undefined, content, locales);
      if (slug) changes.push({ path: "slug", op: "add", after: slug });
      changes.push({ path: "expiresAt", op: "add", after: iso(expires ?? Date.now() + 10 * DAY_MS) });
      if (password) changes.push({ path: "password", op: "add", after: HIDDEN_PASSWORD });
      const warnings = contentWarnings(content, locales);
      if (!password) warnings.push("Sem senha: qualquer pessoa com o link vê a proposta.");
      if (expires !== undefined && expires < Date.now()) warnings.push("A validade já passou: a proposta nasce vencida.");
      return commit(ctx, {
        summary: `Criar proposta "${content.clientName}" (${password ? "com senha" : "sem senha"}).`,
        changes,
        warnings,
        apply: async () => {
          const id = await ctx.client.mutation<string>("rubrica/proposals:create", {
            ...content,
            ...(slug ? { slug } : {}),
            ...(password ? { password } : {}),
            ...(expires !== undefined ? { expiresAt: expires } : {}),
          });
          const created = await load(ctx, { id });
          return { id, slug: created.slug, url: linkOf(ctx, created.slug), hasPassword: !!created.hasPassword, expiresAt: iso(created.expiresAt) };
        },
      });
    },
  },
  {
    name: "proposals_update",
    title: "Atualizar proposta",
    description:
      "Muda uma proposta que ainda não foi aceita. Só os campos de `patch` mudam; um texto por idioma é mesclado (mandar só {en: ...} não apaga o pt-BR; replaceLocales troca inteiro); listas e preços são trocados inteiros. Cada edição guarda a versão anterior e sobe o número da versão. `unset` apaga opcionais (originalValue tira o desconto). `password` troca a senha e derruba as sessões abertas; `removePassword` deixa a proposta aberta a quem tiver o link.",
    access: { permission: "proposals", plugin: "proposals" },
    write: true,
    input: ({ state }) => ({
      type: "object",
      properties: {
        id: prop.string("Id (de proposals_list)."),
        patch: { ...contentSchema(siteLocales(state), true), description: "Campos a mudar." },
        unset: { type: "array", items: { type: "string", enum: [...UNSETTABLE] }, description: "Campos opcionais a apagar." },
        replaceLocales: prop.bool("Troca os textos por idioma inteiros em vez de mesclar."),
        expiresAt: expiresProp,
        password: passwordProp("Nova senha do link."),
        removePassword: prop.bool("Tira a senha do link (a proposta fica aberta a quem tiver o link). Não combina com password."),
      },
      required: ["id"],
      additionalProperties: false,
    }),
    async handler(
      args: { id: string; patch?: Record<string, unknown>; unset?: (typeof UNSETTABLE)[number][]; replaceLocales?: boolean; expiresAt?: string; password?: string; removePassword?: boolean },
      ctx,
    ) {
      const locales = siteLocales(ctx.state);
      const patch = args.patch ?? {};
      const problems = validateAgainst(contentSchema(locales, true), patch);
      for (const key of args.unset ?? []) if (key in patch) problems.push({ path: key, message: "está em patch e em unset" });
      if (args.password !== undefined && args.password.length < MIN_PASSWORD) problems.push({ path: "password", message: `pelo menos ${MIN_PASSWORD} caracteres` });
      if (args.password !== undefined && args.removePassword) problems.push({ path: "removePassword", message: "não combina com password" });
      const expires = args.expiresAt !== undefined ? parseExpires(args.expiresAt) : undefined;

      const current = await load(ctx, { id: args.id });
      if (current.isAccepted) throw new RubricaError("Proposta aceita não pode ser alterada.", "validation");
      if (current.deletedAt !== undefined) throw new RubricaError("A proposta está na lixeira.", "validation");

      const merged: Record<string, unknown> = mergeFields(Object.fromEntries(CONTENT_KEYS.filter((k) => current[k] !== undefined).map((k) => [k, current[k]])), patch, locales, args.replaceLocales);
      for (const key of args.unset ?? []) delete merged[key];
      if (!problems.length) problems.push(...checkContent(merged, new Set(Object.keys(patch))), ...checkDiscount(merged));
      if (problems.length) fail("Alteração inválida", problems);

      const sent: Record<string, unknown> = {};
      const before: Record<string, unknown> = {};
      const after: Record<string, unknown> = {};
      for (const key of Object.keys(patch)) {
        if (JSON.stringify(merged[key]) === JSON.stringify(current[key])) continue;
        sent[key] = merged[key];
        before[key] = current[key];
        after[key] = merged[key];
      }
      const unset = (args.unset ?? []).filter((k) => current[k] !== undefined);
      for (const key of unset) before[key] = current[key];
      const changes = diffValues(before, after, locales);
      const expiresChanged = expires !== undefined && expires !== current.expiresAt;
      if (expiresChanged) changes.push({ path: "expiresAt", op: "change", before: iso(current.expiresAt), after: iso(expires) });
      const touchesContent = Object.keys(sent).length > 0 || unset.length > 0;
      const passwordChange = args.password !== undefined || args.removePassword === true;
      if (args.password !== undefined) changes.push({ path: "password", op: current.hasPassword ? "change" : "add", ...(current.hasPassword ? { before: HIDDEN_PASSWORD } : {}), after: HIDDEN_PASSWORD });
      if (args.removePassword) changes.push({ path: "password", op: current.hasPassword ? "remove" : "change", ...(current.hasPassword ? { before: HIDDEN_PASSWORD } : { before: "(sem senha)" }), after: "(sem senha)" });

      const warnings = [
        ...contentWarnings(after, locales),
        ...(touchesContent || expiresChanged ? [`Vai para a versão ${current.version + 1}; a versão ${current.version} fica no histórico.`] : []),
        ...(passwordChange ? ["As sessões abertas com a senha atual são derrubadas."] : []),
        ...(args.removePassword ? ["Sem senha: qualquer pessoa com o link vê a proposta."] : []),
        ...(args.removePassword && !current.hasPassword ? ["A proposta já estava sem senha."] : []),
        ...(expires !== undefined && expires < Date.now() ? ["A validade já passou: a proposta fica vencida."] : []),
      ];
      return commit(ctx, {
        summary: `Atualizar proposta "${current.clientName}": ${changes.length} mudança(s).`,
        changes,
        warnings,
        apply: async () => {
          const versioned = touchesContent || expiresChanged;
          if (versioned) {
            await ctx.client.mutation("rubrica/proposals:update", {
              id: args.id,
              ...(touchesContent ? { patch: sent } : {}),
              ...(unset.length ? { unset } : {}),
              ...(expiresChanged ? { expiresAt: expires } : {}),
              ...(args.password !== undefined ? { password: args.password } : {}),
            });
          }
          // Só a senha mudou: não há o que versionar (é o que o painel faz).
          else if (args.password !== undefined) await ctx.client.mutation("rubrica/proposals:resetPassword", { id: args.id, newPassword: args.password });
          if (args.removePassword && current.hasPassword) await ctx.client.mutation("rubrica/proposals:resetPassword", { id: args.id });
          const next = await load(ctx, { id: args.id });
          return { version: next.version, hasPassword: !!next.hasPassword, url: linkOf(ctx, next.slug) };
        },
      });
    },
  },
];
