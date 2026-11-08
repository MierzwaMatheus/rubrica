/**
 * Ferramentas das coleções. Para cada coleção ativa (plugin ligado e papel com
 * permissão) saem `<coleção>_list|get|create|update|publish`; remover e reordenar são
 * genéricas (`collection_remove`, `collection_reorder`).
 */
import { can } from "@rubrica/core/convex/roles";
import { RubricaError } from "../client";
import { contentWarnings, diffValues, mergeFields } from "../diff";
import { COLLECTION_NAMES, COLLECTION_SPECS, collectionFieldsSchema, itemLabel, type CollectionSpec } from "../schema/collections";
import type { JsonSchema } from "../schema/json-schema";
import { validateAgainst } from "../schema/validate";
import { pluginEnabled, siteLocales } from "../state";
import { filledLocales, prop } from "./shared";
import { commit, ToolInputError, type FieldProblem, type ToolContext, type ToolDef } from "./types";

type Item = Record<string, unknown> & { _id: string; published?: boolean; deletedAt?: number; slug?: string; updatedAt?: number; featured?: boolean; order?: number; tags?: string[] };

const fn = (spec: CollectionSpec, name: string) => `rubrica/${spec.name}:${name}`;

function summarize(spec: CollectionSpec, item: Item, ctx: ToolContext) {
  const locales = siteLocales(ctx.state);
  const lang = ctx.state.settings?.locales.default;
  const text = (spec.requiredText[0] && (item[spec.requiredText[0]] as Record<string, string> | undefined)) || undefined;
  const have = text && typeof text === "object" ? filledLocales(text) : [];
  return {
    id: item._id,
    label: itemLabel(spec, item, lang),
    ...(item.slug ? { slug: item.slug } : {}),
    published: item.published ?? false,
    ...(item.featured ? { featured: true } : {}),
    ...(item.deletedAt ? { deleted: true } : {}),
    order: item.order,
    ...(item.tags?.length ? { tags: item.tags } : {}),
    ...(have.length ? { languages: have } : {}),
    ...(locales.length > 1 && have.length > 0 && have.length < locales.length ? { missingLanguages: locales.filter((l) => !have.includes(l)) } : {}),
    updatedAt: item.updatedAt,
  };
}

async function load(ctx: ToolContext, spec: CollectionSpec, args: { id?: string; slug?: string }): Promise<Item> {
  if (!args.id && !args.slug) throw new ToolInputError("Informe id ou slug.");
  if (args.id) {
    const item = await ctx.client.query<Item | null>(fn(spec, "get"), { id: args.id }).catch((e) => {
      if (e instanceof RubricaError && e.kind === "validation") return null;
      throw e;
    });
    if (item) return item;
  } else {
    const items = await ctx.client.query<Item[]>(fn(spec, "list"), { includeDeleted: true });
    const found = items.find((i) => i.slug === args.slug);
    if (found) return found;
  }
  throw new RubricaError(`${spec.singular[0]!.toUpperCase()}${spec.singular.slice(1)} não encontrado: ${args.id ?? args.slug}. Use ${spec.name}_list.`, "validation");
}

/** Textos obrigatórios que precisam de pelo menos um idioma preenchido. */
function requireText(spec: CollectionSpec, data: Record<string, unknown>, only?: Set<string>): FieldProblem[] {
  const problems: FieldProblem[] = [];
  for (const key of spec.requiredText) {
    if (only && !only.has(key)) continue;
    const v = data[key];
    if (v && typeof v === "object" && filledLocales(v as Record<string, string>).length === 0) problems.push({ path: key, message: "preencha em pelo menos um idioma" });
  }
  return problems;
}

function fail(message: string, problems: FieldProblem[]): never {
  const first = problems.slice(0, 4).map((p) => `${p.path ? `${p.path}: ` : ""}${p.message}`);
  throw new ToolInputError(`${message}: ${first.join("; ")}${problems.length > 4 ? ` (+${problems.length - 4})` : ""}`, problems);
}

export function collectionTools(spec: CollectionSpec): ToolDef[] {
  const access = { permission: spec.permission, collection: spec.name } as const;
  const Name = `${spec.singular[0]!.toUpperCase()}${spec.singular.slice(1)}`;

  return [
    {
      name: `${spec.name}_list`,
      title: `Listar ${spec.label}`,
      description: `Lista ${spec.label} (id, nome, publicação, idiomas traduzidos). Para o conteúdo completo use ${spec.name}_get.`,
      access,
      input: () => ({
        type: "object",
        properties: {
          search: prop.string("Filtra pelo nome (contém, sem maiúsculas)."),
          published: prop.bool("true: só publicados. false: só rascunhos."),
          includeDeleted: prop.bool("Inclui os da lixeira."),
          limit: { type: "integer", minimum: 1, maximum: 200, description: "Padrão: 50." },
        },
        additionalProperties: false,
      }),
      async handler(args: { search?: string; published?: boolean; includeDeleted?: boolean; limit?: number }, ctx) {
        const items = await ctx.client.query<Item[]>(fn(spec, "list"), { includeDeleted: args.includeDeleted });
        const rows = items.map((i) => summarize(spec, i, ctx));
        const needle = args.search?.toLowerCase();
        const filtered = rows.filter((r) => (args.published === undefined || r.published === args.published) && (!needle || r.label.toLowerCase().includes(needle)));
        const limit = args.limit ?? 50;
        return { total: filtered.length, items: filtered.slice(0, limit), ...(filtered.length > limit ? { truncated: true } : {}) };
      },
    },
    {
      name: `${spec.name}_get`,
      title: `Ler ${spec.singular}`,
      description: `Lê ${spec.singular} inteiro, com todos os campos por idioma.`,
      access,
      input: () => ({
        type: "object",
        properties: { id: prop.string(`Id (de ${spec.name}_list).`), ...(spec.slug ? { slug: prop.string("Ou o slug.") } : {}) },
        additionalProperties: false,
      }),
      async handler(args: { id?: string; slug?: string }, ctx) {
        return load(ctx, spec, args);
      },
    },
    {
      name: `${spec.name}_create`,
      title: `Criar ${spec.singular}`,
      description: `Cria ${spec.singular}. Nasce como RASCUNHO (published false), em qualquer coleção, a menos que você mande published: true. Textos por idioma; conteúdo sem tradução não aparece no idioma.${spec.slug ? " O slug sai do título se faltar." : ""}`,
      access,
      write: true,
      input: ({ state }) => {
        const schema = collectionFieldsSchema(spec, { locales: siteLocales(state) });
        return {
          ...schema,
          properties: { ...(schema.properties as JsonSchema), published: prop.bool("Publica ao criar. Padrão: false (rascunho).") },
        };
      },
      async handler(args: Record<string, unknown>, ctx) {
        const { published, ...fields } = args as { published?: boolean } & Record<string, unknown>;
        const locales = siteLocales(ctx.state);
        const problems = [...validateAgainst(collectionFieldsSchema(spec, { locales }), fields), ...requireText(spec, fields)];
        if (problems.length) fail(`${Name} inválido`, problems);
        return commit(ctx, {
          summary: `Criar ${spec.singular} "${itemLabel(spec, fields, ctx.state.settings?.locales.default)}" (${published ? "publicado" : "rascunho"}).`,
          changes: diffValues(undefined, fields, locales),
          warnings: contentWarnings(fields, locales),
          apply: async () => ({ id: await ctx.client.mutation<string>(fn(spec, "create"), { ...fields, published: published ?? false }) }),
        });
      },
    },
    {
      name: `${spec.name}_update`,
      title: `Atualizar ${spec.singular}`,
      description: `Muda campos de ${spec.singular}. Só os campos de \`patch\` mudam; um texto por idioma é mesclado (mandar só {en: ...} não apaga o pt-BR; replaceLocales troca inteiro). Listas e imagens são trocadas inteiras. \`unset\` apaga campos opcionais.${spec.slug ? " Mudar o slug quebra links já compartilhados: só com pedido explícito." : ""}`,
      access,
      write: true,
      input: ({ state }) => ({
        type: "object",
        properties: {
          id: prop.string(`Id (de ${spec.name}_list).`),
          patch: { ...collectionFieldsSchema(spec, { locales: siteLocales(state) }, true), description: "Campos a mudar." },
          unset: { type: "array", items: { type: "string" }, description: "Campos opcionais a apagar." },
          replaceLocales: prop.bool("Troca os textos por idioma inteiros em vez de mesclar."),
        },
        required: ["id"],
        additionalProperties: false,
      }),
      async handler(args: { id: string; patch?: Record<string, unknown>; unset?: string[]; replaceLocales?: boolean }, ctx) {
        const locales = siteLocales(ctx.state);
        const patch = args.patch ?? {};
        const full = collectionFieldsSchema(spec, { locales });
        const partial = collectionFieldsSchema(spec, { locales }, true);
        const problems = validateAgainst(partial, patch);
        const required = new Set((full.required as string[] | undefined) ?? []);
        for (const key of args.unset ?? []) {
          if (required.has(key)) problems.push({ path: key, message: "campo obrigatório: não pode ser apagado" });
          if (key in patch) problems.push({ path: key, message: "está em patch e em unset" });
        }
        const current = await load(ctx, spec, { id: args.id });
        const merged = mergeFields(current, patch, locales, args.replaceLocales);
        problems.push(...requireText(spec, merged, new Set(Object.keys(patch))));
        if (problems.length) fail(`${Name}: alteração inválida`, problems);

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
        return commit(ctx, {
          summary: `Atualizar ${spec.singular} "${itemLabel(spec, current, ctx.state.settings?.locales.default)}": ${changes.length} mudança(s).`,
          changes,
          warnings: [
            ...contentWarnings(after, locales),
            ...(sent.slug && sent.slug !== current.slug ? ["O slug mudou: os links antigos deixam de funcionar."] : []),
            ...(current.deletedAt ? ["O item está na lixeira."] : []),
          ],
          apply: async () => {
            if (changes.length) await ctx.client.mutation(fn(spec, "update"), { id: args.id, patch: sent, ...(unset.length ? { unset } : {}) });
          },
        });
      },
    },
    {
      name: `${spec.name}_publish`,
      title: `Publicar ou despublicar ${spec.singular}`,
      description: `Publica ${spec.singular} (entra no site no próximo rebuild) ou volta para rascunho.`,
      access,
      write: true,
      input: () => ({
        type: "object",
        properties: { id: prop.string(`Id (de ${spec.name}_list).`), published: { type: "boolean", default: true, description: "true publica; false despublica." } },
        required: ["id"],
        additionalProperties: false,
      }),
      async handler(args: { id: string; published?: boolean }, ctx) {
        const item = await load(ctx, spec, { id: args.id });
        const published = args.published ?? true;
        const locales = siteLocales(ctx.state);
        const warnings = published ? contentWarnings(Object.fromEntries(spec.requiredText.map((k) => [k, item[k]])), locales) : [];
        if (item.deletedAt) throw new RubricaError("O item está na lixeira.", "validation");
        return commit(ctx, {
          summary: `${published ? "Publicar" : "Despublicar"} ${spec.singular} "${itemLabel(spec, item, ctx.state.settings?.locales.default)}".`,
          changes: diffValues({ published: item.published ?? false }, { published }),
          warnings,
          apply: async () => {
            if ((item.published ?? false) !== published) await ctx.client.mutation(fn(spec, published ? "publish" : "unpublish"), { id: args.id });
          },
        });
      },
    },
  ];
}

/** Papéis que enxergam a coleção e o plugin dela ligado. */
function allowedCollection(ctx: ToolContext, name: string): CollectionSpec {
  const spec = COLLECTION_SPECS[name as keyof typeof COLLECTION_SPECS];
  if (!spec) throw new ToolInputError(`Coleção desconhecida: ${name}`);
  if (!can(ctx.state.me?.role, spec.permission)) throw new RubricaError(`O seu papel não pode mexer em ${spec.label}.`, "forbidden");
  if (spec.plugin && !pluginEnabled(ctx.state, spec.plugin)) throw new RubricaError(`${spec.label}: o plugin "${spec.plugin}" está desligado.`, "validation");
  return spec;
}

const collectionProp = { type: "string", enum: COLLECTION_NAMES, description: "Coleção." };

export const genericCollectionTools: ToolDef[] = [
  {
    name: "collection_remove",
    title: "Mandar item para a lixeira",
    description: "Move um item de qualquer coleção para a lixeira (reversível só por root). Para tirar do site mantendo o conteúdo, despublique (<coleção>_publish com published false).",
    access: { permission: ["content", "blog", "plans"] },
    write: true,
    destructive: true,
    input: () => ({
      type: "object",
      properties: { collection: collectionProp, id: prop.string("Id do item.") },
      required: ["collection", "id"],
      additionalProperties: false,
    }),
    async handler(args: { collection: string; id: string }, ctx) {
      const spec = allowedCollection(ctx, args.collection);
      const item = await load(ctx, spec, { id: args.id });
      return commit(ctx, {
        summary: `Mandar ${spec.singular} "${itemLabel(spec, item, ctx.state.settings?.locales.default)}" para a lixeira. Só root restaura.`,
        info: { item: summarize(spec, item, ctx) },
        warnings: item.published ? ["O item está publicado: some do site no próximo rebuild."] : [],
        apply: async () => {
          await ctx.client.mutation(fn(spec, "remove"), { id: args.id });
        },
      });
    },
  },
  {
    name: "collection_reorder",
    title: "Reordenar itens",
    description: "Define a ordem dos itens de uma coleção (a ordem que os blocos com sort \"order\" mostram). Mande os ids na ordem desejada.",
    access: { permission: ["content", "blog", "plans"] },
    write: true,
    input: () => ({
      type: "object",
      properties: { collection: collectionProp, ids: { type: "array", items: { type: "string" }, description: "Ids na nova ordem." } },
      required: ["collection", "ids"],
      additionalProperties: false,
    }),
    async handler(args: { collection: string; ids: string[] }, ctx) {
      const spec = allowedCollection(ctx, args.collection);
      const items = await ctx.client.query<Item[]>(fn(spec, "list"), {});
      const known = new Set(items.map((i) => i._id));
      const bad = args.ids.filter((id) => !known.has(id));
      if (bad.length) throw new ToolInputError(`Ids que não existem em ${spec.name}: ${bad.join(", ")}`);
      const before = items.map((i) => i._id);
      return commit(ctx, {
        summary: `Reordenar ${args.ids.length} item(ns) de ${spec.label}.`,
        changes: [{ path: "order", op: "change", before: before.slice(0, args.ids.length), after: args.ids }],
        apply: async () => {
          await ctx.client.mutation(fn(spec, "reorder"), { ids: args.ids });
        },
      });
    },
  },
];
