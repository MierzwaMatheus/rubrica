import { DEFAULT_UI_TEXTS, defaultUiText } from "@rubrica/core";
import { diffValues, mergeFields } from "../diff";
import { localizedSchema } from "../schema/json-schema";
import { siteLocales } from "../state";
import { filledLocales, prop } from "./shared";
import { commit, ToolInputError, type ToolDef } from "./types";

type Texts = Record<string, Record<string, string>>;

const KEY = /^[a-z0-9][a-z0-9._-]{0,99}$/i;

/** Texto padrão do núcleo em cada idioma do site (o núcleo guarda por idioma base: pt, en, es). */
function defaultFor(key: string, locales: readonly string[]): Record<string, string> | null {
  if (!(key in DEFAULT_UI_TEXTS)) return null;
  const out: Record<string, string> = {};
  for (const l of locales) {
    const text = defaultUiText(key, l);
    if (text) out[l] = text;
  }
  return out;
}

export const textTools: ToolDef[] = [
  {
    name: "texts_list",
    title: "Listar textos de interface",
    description:
      "Lista os textos de interface (menu, botões, rótulos de formulário, 404…): o padrão do núcleo e o que foi personalizado. Textos de seção (título de um bloco) NÃO estão aqui: são campos do bloco.",
    access: { permission: "panel" },
    input: () => ({
      type: "object",
      properties: {
        prefix: prop.string('Só as chaves que começam assim, ex.: "nav.".'),
        search: prop.string("Procura na chave e nos textos."),
        customOnly: prop.bool("Só os personalizados."),
        missingLocale: prop.string("Só os que não têm texto neste idioma (sem texto no idioma, o site usa o principal)."),
        limit: { type: "integer", minimum: 1, maximum: 500, description: "Padrão: 100." },
      },
      additionalProperties: false,
    }),
    async handler(args: { prefix?: string; search?: string; customOnly?: boolean; missingLocale?: string; limit?: number }, ctx) {
      const custom = await ctx.client.query<Texts>("rubrica/texts:list", {});
      const locales = siteLocales(ctx.state);
      const keys = new Set([...Object.keys(DEFAULT_UI_TEXTS), ...Object.keys(custom)]);
      const needle = args.search?.toLowerCase();
      const rows = [...keys]
        .sort()
        .filter((k) => !args.prefix || k.startsWith(args.prefix))
        .map((key) => {
          const standard = defaultFor(key, locales);
          const effective = { ...standard, ...custom[key] } as Record<string, string>;
          return { key, custom: custom[key] ?? null, default: standard, effective };
        })
        .filter((r) => !args.customOnly || r.custom)
        .filter((r) => !args.missingLocale || !filledLocales(r.effective).includes(args.missingLocale))
        .filter((r) => !needle || r.key.toLowerCase().includes(needle) || Object.values(r.effective).some((t) => (t ?? "").toLowerCase().includes(needle)));
      const limit = args.limit ?? 100;
      return { total: rows.length, texts: rows.slice(0, limit), ...(rows.length > limit ? { truncated: true } : {}) };
    },
  },
  {
    name: "texts_set",
    title: "Definir texto de interface",
    description: "Personaliza o texto de uma chave. Mescla por idioma com o texto atual (mandar só {en: ...} mantém o pt-BR). Texto sem tradução num idioma cai no principal.",
    access: { permission: "texts" },
    write: true,
    input: ({ state }) => ({
      type: "object",
      properties: { key: prop.string('Chave, ex.: "nav.blog" (veja texts_list).'), value: localizedSchema({ locales: siteLocales(state) }, "Texto novo."), replaceLocales: prop.bool("Troca tudo em vez de mesclar.") },
      required: ["key", "value"],
      additionalProperties: false,
    }),
    async handler(args: { key: string; value: Record<string, string>; replaceLocales?: boolean }, ctx) {
      if (!KEY.test(args.key)) throw new ToolInputError(`Chave inválida: "${args.key}"`);
      const locales = siteLocales(ctx.state);
      const custom = await ctx.client.query<Texts>("rubrica/texts:list", {});
      const current = { ...defaultFor(args.key, locales), ...custom[args.key] };
      const known = args.key in DEFAULT_UI_TEXTS || args.key in custom;
      const merged = mergeFields({ v: current }, { v: args.value }, locales, args.replaceLocales).v as Record<string, string>;
      if (filledLocales(merged).length === 0) throw new ToolInputError("Preencha o texto em pelo menos um idioma (ou use texts_reset).");
      return commit(ctx, {
        summary: `Definir o texto "${args.key}".`,
        changes: diffValues(current, merged, locales),
        warnings: known ? [] : [`A chave "${args.key}" não existe no núcleo; só vale se o tema a usar.`],
        apply: async () => {
          await ctx.client.mutation("rubrica/texts:set", { key: args.key, value: merged });
        },
      });
    },
  },
  {
    name: "texts_reset",
    title: "Voltar ao texto padrão",
    description: "Apaga a personalização de uma chave: volta ao texto padrão do núcleo.",
    access: { permission: "texts" },
    write: true,
    input: () => ({ type: "object", properties: { key: prop.string("Chave.") }, required: ["key"], additionalProperties: false }),
    async handler(args: { key: string }, ctx) {
      const custom = await ctx.client.query<Texts>("rubrica/texts:list", {});
      if (!custom[args.key]) return { applied: false, summary: `"${args.key}" não está personalizado.` };
      return commit(ctx, {
        summary: `Voltar "${args.key}" ao texto padrão.`,
        changes: diffValues(custom[args.key], defaultFor(args.key, siteLocales(ctx.state)) ?? {}, siteLocales(ctx.state)),
        apply: async () => {
          await ctx.client.mutation("rubrica/texts:reset", { key: args.key });
        },
      });
    },
  },
];
