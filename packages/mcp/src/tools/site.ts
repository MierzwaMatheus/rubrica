/** Configurações do site, plugins, catálogo de blocos, contatos e publicação. */
import { CORE_BLOCKS } from "@rubrica/core/blocks";
import { can } from "@rubrica/core/convex/roles";
import { RubricaError } from "../client";
import { contentWarnings, diffValues, mergeFields } from "../diff";
import { blockFieldsSchema, validatorToSchema, type JsonSchema } from "../schema/json-schema";
import { siteSettingsJson } from "../schema/settings";
import { validateAgainst } from "../schema/validate";
import { siteLocales } from "../state";
import { blocksFor, prop } from "./shared";
import { commit, ToolInputError, type ToolDef } from "./types";

/** Campos que só a agência (root) muda — espelha `TECHNICAL_SETTINGS` do backend. */
const TECHNICAL = ["kind", "url", "locales", "theme"];
const OBJECT_KEYS = ["appearance", "person", "organization", "paths", "icons", "themeColor", "rss", "analytics"];

const DESCRIPTIONS: Record<string, string> = {
  kind: "Tipo do site: pessoal ou empresa. SÓ root.",
  name: "Nome do site, por idioma.",
  description: "Descrição curta do site (SEO e compartilhamento), por idioma.",
  url: "URL pública, sem barra no final (https://exemplo.com). SÓ root.",
  locales: "Idiomas do site. SÓ root. `locales` lista os códigos (BCP 47); `default` é o principal (sem prefixo na URL).",
  theme: "Id do tema. SÓ root.",
  "appearance.colorMode": "Modo de cor padrão: dark, light ou system.",
  "appearance.colorToggle": "Mostra o botão de trocar o modo de cor.",
  "appearance.tokens": "Tokens do tema (cores etc.), nome → valor (hex). Mesclados com os atuais.",
  "appearance.fontSans": "Fonte principal (nome do Google Fonts).",
  "appearance.fontMono": "Fonte monoespaçada.",
  navigation: "Menu principal, em ordem. Lista inteira (substitui a atual).",
  social: "Redes sociais. Lista inteira (substitui a atual).",
  person: "Dono do site pessoal (nome, cargo, e-mail, foto).",
  organization: "Dados da empresa (razão social, CNPJ, endereço, horário…): geram o JSON-LD e o rodapé.",
  ogImage: "Imagem de compartilhamento (1200x630).",
  twitterHandle: "Usuário no X/Twitter.",
  icons: "Ícones do site: svg (favicon SVG), favicon (PNG/ICO 32×32), apple (180×180), icon192 e icon512 (manifest), maskable (512×512, Android). Mesclados com os atuais.",
  themeColor: "Cor da barra do navegador por modo (light, dark), em hexadecimal. Sem ela, o fundo do esquema de cor.",
  rss: "Título e descrição do feed RSS do blog, por idioma. Sem eles, o nome e a descrição do site.",
  defaultPostCover: "Capa padrão dos posts sem capa (e imagem de compartilhamento deles), 1200x630.",
  analytics: "Analytics (plugin analytics, Umami): scriptUrl (https) e websiteId. A origem precisa estar na CSP (npx create-rubrica config --analytics).",
};

function stripRequired(schema: JsonSchema): JsonSchema {
  const { required: _r, ...rest } = schema as { required?: unknown } & JsonSchema;
  void _r;
  const props = rest.properties as Record<string, JsonSchema> | undefined;
  return props ? { ...rest, properties: Object.fromEntries(Object.entries(props).map(([k, v]) => [k, v.type === "object" && v.properties ? stripRequired(v) : v])) } : rest;
}

function settingsSchema(locales: string[]): JsonSchema {
  return validatorToSchema(siteSettingsJson as never, { locales, descriptions: DESCRIPTIONS, notLocalized: ["appearance.tokens"] });
}

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function mergeSettings(current: Record<string, unknown>, patch: Record<string, unknown>, locales: string[], replaceLocales?: boolean): Record<string, unknown> {
  const out = mergeFields(current, patch, locales, replaceLocales);
  for (const key of OBJECT_KEYS) {
    const cur = current[key];
    const val = patch[key];
    if (isObj(cur) && isObj(val)) {
      const merged: Record<string, unknown> = { ...cur, ...val };
      for (const nested of ["tokens", "address"]) {
        if (isObj(cur[nested]) && isObj(val[nested])) merged[nested] = { ...cur[nested], ...val[nested] };
      }
      out[key] = merged;
    }
  }
  return out;
}

export const siteTools: ToolDef[] = [
  {
    name: "site_get",
    title: "Ler configurações do site",
    description: "Configurações do site: nome, descrição, URL, tipo (pessoal/empresa), idiomas, tema, aparência, navegação, redes, dados da pessoa/empresa e plugins.",
    access: { permission: "panel" },
    input: () => ({ type: "object", properties: {}, additionalProperties: false }),
    async handler(_args, ctx) {
      const settings = await ctx.client.query("rubrica/settings:get", {});
      return { settings, enabledPlugins: ctx.state.plugins.filter((p) => p.enabled).map((p) => p.id) };
    },
  },
  {
    name: "site_update",
    title: "Atualizar configurações do site",
    description:
      "Muda parte das configurações (identidade, SEO, aparência, navegação, redes, dados da pessoa/empresa). Só o que está em `patch` muda; textos por idioma e objetos (appearance, person, organization) são mesclados. Idiomas, URL, tema e tipo do site são só da agência (root). Plugins: use plugin_set.",
    access: { permission: "settings" },
    write: true,
    input: ({ state }) => {
      const full = settingsSchema(siteLocales(state));
      const props = { ...(full.properties as Record<string, JsonSchema>) };
      delete props.plugins;
      if (state.me?.role !== "root") for (const k of TECHNICAL) delete props[k];
      return {
        type: "object",
        properties: {
          patch: { ...stripRequired({ type: "object", properties: props, additionalProperties: false }), description: "Campos a mudar." },
          replaceLocales: prop.bool("Troca os textos por idioma inteiros em vez de mesclar."),
        },
        required: ["patch"],
        additionalProperties: false,
      };
    },
    async handler(args: { patch: Record<string, unknown>; replaceLocales?: boolean }, ctx) {
      const locales = siteLocales(ctx.state);
      const role = ctx.state.me?.role;
      const technical = Object.keys(args.patch).filter((k) => TECHNICAL.includes(k));
      if (technical.length && role !== "root") throw new RubricaError("Tipo do site, URL, idiomas e tema só a agência (root) muda.", "forbidden");
      if ("plugins" in args.patch) throw new ToolInputError("Use plugin_set para ligar ou desligar plugins.");
      const current = await ctx.client.query<Record<string, unknown> | null>("rubrica/settings:get", {});
      if (!current) throw new RubricaError("O site ainda não foi configurado (rode o setup).", "validation");
      const merged = mergeSettings(current, args.patch, locales, args.replaceLocales);
      const problems = validateAgainst(settingsSchema(locales), merged);
      if (problems.length) throw new ToolInputError(`Configurações inválidas: ${problems.slice(0, 4).map((p) => `${p.path}: ${p.message}`).join("; ")}`, problems);
      const sent: Record<string, unknown> = {};
      const before: Record<string, unknown> = {};
      const after: Record<string, unknown> = {};
      for (const key of Object.keys(args.patch)) {
        if (JSON.stringify(merged[key]) === JSON.stringify(current[key])) continue;
        sent[key] = merged[key];
        before[key] = current[key];
        after[key] = merged[key];
      }
      const changes = diffValues(before, after, locales);
      return commit(ctx, {
        summary: `Atualizar as configurações do site (${Object.keys(sent).join(", ") || "nada"}).`,
        changes,
        warnings: [
          ...contentWarnings(after, locales),
          ...(technical.length ? [`Mudança técnica (${technical.join(", ")}): afeta URLs, rotas e o próximo build inteiro.`] : []),
        ],
        apply: async () => {
          if (changes.length) await ctx.client.mutation("rubrica/settings:update", { patch: sent });
        },
      });
    },
  },
  {
    name: "plugins_list",
    title: "Listar plugins",
    description: "Plugins do tipo do site, com o que cada um traz e se está ligado. Plugin desligado esconde páginas, blocos, coleções e telas do painel.",
    access: { permission: "panel" },
    input: () => ({ type: "object", properties: {}, additionalProperties: false }),
    async handler(_args, ctx) {
      return { plugins: ctx.state.plugins };
    },
  },
  {
    name: "plugin_set",
    title: "Ligar ou desligar plugin",
    description: "Liga ou desliga um plugin. Desligar esconde o conteúdo dele do site e das ferramentas (os dados ficam). Só com pedido explícito da pessoa.",
    access: { permission: "settings" },
    write: true,
    destructive: true,
    input: ({ state }) => ({
      type: "object",
      properties: {
        id: { type: "string", ...(state.plugins.length ? { enum: state.plugins.map((p) => p.id) } : {}), description: "Id do plugin (plugins_list)." },
        enabled: { type: "boolean", description: "true liga; false desliga." },
      },
      required: ["id", "enabled"],
      additionalProperties: false,
    }),
    async handler(args: { id: string; enabled: boolean }, ctx) {
      const plugin = ctx.state.plugins.find((p) => p.id === args.id);
      if (!plugin) throw new ToolInputError(`Plugin desconhecido ou fora do tipo deste site: ${args.id}`);
      const dependents = ctx.state.plugins.filter((p) => p.enabled && p.requires.includes(args.id)).map((p) => p.id);
      const missing = plugin.requires.filter((r) => !ctx.state.plugins.find((p) => p.id === r)?.enabled);
      return commit(ctx, {
        summary: `${args.enabled ? "Ligar" : "Desligar"} o plugin ${plugin.label} (${plugin.id}).`,
        changes: diffValues({ [plugin.id]: plugin.enabled }, { [plugin.id]: args.enabled }),
        warnings: [
          ...(!args.enabled && dependents.length ? [`Também deixam de funcionar: ${dependents.join(", ")}.`] : []),
          ...(args.enabled && missing.length ? [`Depende de plugins desligados: ${missing.join(", ")}; ele não ficará ativo até ligá-los.`] : []),
        ],
        apply: async () => {
          await ctx.client.mutation("rubrica/settings:setPlugin", { id: args.id, enabled: args.enabled });
          await ctx.runtime.refresh();
        },
      });
    },
  },
  {
    name: "blocks_catalog",
    title: "Catálogo de blocos",
    description:
      "Os tipos de bloco que o site aceita (com o tipo e os plugins ligados): o que cada um faz e os campos, com limites e obrigatórios. Passe `type` para ver o JSON Schema completo de um tipo.",
    access: { login: false },
    input: () => ({
      type: "object",
      properties: { type: prop.string('Tipo do bloco, ex.: "hero". Devolve o JSON Schema dos campos.') },
      additionalProperties: false,
    }),
    async handler(args: { type?: string }, ctx) {
      const defs = ctx.state.settings ? blocksFor(ctx.state) : [...CORE_BLOCKS];
      const locales = siteLocales(ctx.state);
      if (args.type) {
        const def = CORE_BLOCKS.find((b) => b.type === args.type);
        if (!def) throw new ToolInputError(`Tipo de bloco desconhecido: ${args.type}. Tipos: ${CORE_BLOCKS.map((b) => b.type).join(", ")}`);
        return { type: def.type, label: def.label, description: def.description, category: def.category, plugin: def.plugin ?? null, source: def.source ?? null, fields: blockFieldsSchema(def, { locales }) };
      }
      return {
        filteredBySite: !!ctx.state.settings,
        blocks: defs.map((d) => ({
          type: d.type,
          label: d.label,
          description: d.description,
          category: d.category,
          ...(d.plugin ? { plugin: d.plugin } : {}),
          ...(d.source ? { source: d.source.collections } : {}),
          fields: Object.entries(d.fields).map(([k, f]) => `${k} (${f.kind}${f.required ? ", obrigatório" : ""}): ${f.label}`),
        })),
      };
    },
  },

  // ── Módulos opcionais do backend ──────────────────────────────────────────
  {
    name: "contacts_list",
    title: "Listar contatos",
    description: "Pedidos de contato recebidos pelo assistente de contato (mais novos primeiro). Dados pessoais: não repasse além do necessário.",
    access: { permission: "contacts", plugin: "contact-wizard", module: "contacts" },
    input: () => ({
      type: "object",
      properties: { status: prop.string("Filtra por status (new, read, in_progress, contacted, closed, archived)."), limit: { type: "integer", minimum: 1, maximum: 200 } },
      additionalProperties: false,
    }),
    async handler(args: { status?: string; limit?: number }, ctx) {
      const rows = await ctx.client.query<unknown[]>("rubrica/contacts:list", args.status ? { status: args.status } : {});
      return { total: rows.length, contacts: rows.slice(0, args.limit ?? 50) };
    },
  },
  {
    name: "contacts_get",
    title: "Ler um contato",
    description: "Lê um pedido de contato inteiro.",
    access: { permission: "contacts", plugin: "contact-wizard", module: "contacts" },
    input: () => ({ type: "object", properties: { id: prop.string("Id do contato.") }, required: ["id"], additionalProperties: false }),
    async handler(args: { id: string }, ctx) {
      return ctx.client.query("rubrica/contacts:get", { id: args.id });
    },
  },
  {
    name: "contacts_set_status",
    title: "Mudar status de um contato",
    description: "Marca um contato como novo (não lido), lido ou arquivado.",
    access: { permission: "contacts", plugin: "contact-wizard", module: "contacts" },
    write: true,
    input: () => ({
      type: "object",
      properties: {
        id: prop.string("Id do contato."),
        status: { type: "string", enum: ["new", "read", "archived"], description: "new = não lido, read = lido, archived = arquivado." },
      },
      required: ["id", "status"],
      additionalProperties: false,
    }),
    async handler(args: { id: string; status: "new" | "read" | "archived" }, ctx) {
      const current = await ctx.client.query<Record<string, unknown> | null>("rubrica/contacts:get", { id: args.id });
      if (!current) throw new RubricaError(`Contato não encontrado: ${args.id}`, "validation");
      const fn = { new: "markUnread", read: current.status === "archived" ? "unarchive" : "markRead", archived: "archive" }[args.status];
      return commit(ctx, {
        summary: "Atualizar o status do contato.",
        changes: diffValues({ status: current.status }, { status: args.status }),
        apply: async () => {
          await ctx.client.mutation(`rubrica/contacts:${fn}`, { id: args.id });
        },
      });
    },
  },
  {
    name: "site_publish",
    title: "Publicar o site (rebuild)",
    description:
      "Dispara o deploy hook: o site é gerado de novo com o conteúdo publicado (leva alguns minutos). Só com pedido explícito da pessoa, no máximo uma vez por minuto. Rascunhos e blocos ocultos não vão ao ar.",
    access: { permission: "publish", module: "deploy" },
    write: true,
    destructive: true,
    input: () => ({ type: "object", properties: {}, additionalProperties: false }),
    async handler(_args, ctx) {
      if (!can(ctx.state.me?.role, "publish")) throw new RubricaError("Sem permissão para esta ação", "forbidden");
      return commit(ctx, {
        summary: "Disparar o rebuild do site publicado.",
        warnings: ctx.state.settings?.url ? [`Atualiza ${ctx.state.settings.url} em alguns minutos.`] : [],
        apply: async () => ctx.client.action("rubrica/publish:trigger", {}),
      });
    },
  },
];
