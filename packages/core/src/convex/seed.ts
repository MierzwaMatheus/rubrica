/**
 * Conteúdo inicial do site (RFC v2, decisão 24), para o `setup` e o `config` do CLI.
 * São funções internas: só quem tem acesso ao Convex do projeto as chama, com
 * `npx convex run rubrica/seed:<função> '<json>'` (sem login no painel).
 *
 * - `status`: o site já foi configurado? quantas páginas? já tem root?
 * - `apply`: grava as configurações e monta as páginas fixas pela receita (a do tema,
 *   enviada pelo CLI, ou a do núcleo). Páginas que já existem não são tocadas.
 * - `patchSettings`: muda parte das configurações (o `config` do CLI).
 *
 * Campos que este backend ainda não conhece são descartados em vez de recusados, para
 * um CLI mais novo funcionar com um núcleo um pouco mais antigo (e vice-versa).
 */
import { v, type GenericValidator } from "convex/values";
import type { SiteKind } from "../content/types";
import type { Recipe } from "../theme/contract";
import { CORE_RECIPES } from "../theme/recipes";
import { findBlock, preparePageBlocks, type BlockCatalog } from "./lib/blocks";
import { navigationFromPages, pagesFromRecipe } from "./lib/seed";
import { enabledPluginsFor, getSettingsDoc } from "./plugins";
import type { RubricaRuntime } from "./runtime";
import { internalMutation, internalQuery, type Doc, type MutationCtx } from "./server";
import { upsertSettings } from "./settings";
import { vSiteSettings, type SiteSettingsValue } from "./validators";

type AnyValidator = GenericValidator & { kind: string; fields?: Record<string, AnyValidator>; element?: AnyValidator; value?: AnyValidator };

/** Tira, em qualquer nível, as chaves que o validador não conhece. */
export function pruneByValidator(validator: GenericValidator, value: unknown): unknown {
  const val = validator as AnyValidator;
  if (value === undefined || value === null) return value;
  if (val.kind === "object" && val.fields && typeof value === "object" && !Array.isArray(value)) {
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      const field = val.fields[key];
      if (field && item !== undefined) out[key] = pruneByValidator(field, item);
    }
    return out;
  }
  if (val.kind === "array" && val.element && Array.isArray(value)) return value.map((item) => pruneByValidator(val.element!, item));
  if (val.kind === "record" && val.value && typeof value === "object" && !Array.isArray(value)) {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([k, item]) => [k, pruneByValidator(val.value!, item)]));
  }
  return value;
}

function stripMeta(doc: Doc<"siteSettings">): SiteSettingsValue {
  const { _id, _creationTime, updatedAt, updatedBy, ...settings } = doc;
  void _id;
  void _creationTime;
  void updatedAt;
  void updatedBy;
  return settings;
}

async function catalog(ctx: MutationCtx, rt: RubricaRuntime): Promise<BlockCatalog> {
  const settings = await getSettingsDoc(ctx);
  return { blocks: rt.blocks, kind: settings?.kind ?? "pessoal", enabledPlugins: await enabledPluginsFor(ctx, rt, settings) };
}

function allowIn(cat: BlockCatalog) {
  return (type: string) => {
    const def = findBlock(cat, type);
    if (!def) return false;
    if (def.category !== "comum" && def.category !== cat.kind) return false;
    return !def.plugin || cat.enabledPlugins.has(def.plugin);
  };
}

export function seedFunctions(rt: RubricaRuntime) {
  return {
    /** Estado do site para o CLI decidir o que perguntar. */
    status: internalQuery({
      args: {},
      handler: async (ctx) => {
        const settings = await getSettingsDoc(ctx);
        const pages = await ctx.db.query("pages").collect();
        const root = await ctx.db
          .query("userRoles")
          .withIndex("by_role", (q) => q.eq("role", "root"))
          .first();
        return {
          configured: settings !== null,
          kind: settings?.kind ?? null,
          theme: settings?.theme ?? null,
          pages: pages.filter((p) => p.deletedAt === undefined).length,
          hasRoot: root !== null,
        };
      },
    }),

    /**
     * Configurações + páginas da receita. `recipe` é a receita do tema (o CLI a lê do
     * pacote do tema); sem ela, a do núcleo para o tipo do site.
     */
    apply: internalMutation({
      args: { settings: v.any(), recipe: v.optional(v.any()), overwrite: v.optional(v.boolean()) },
      handler: async (ctx, args) => {
        const existing = await getSettingsDoc(ctx);
        if (existing && !args.overwrite) throw new Error("O site já tem configurações (use overwrite)");
        const input = { navigation: [], social: [], plugins: {}, ...(args.settings as Record<string, unknown>) };
        const settings = pruneByValidator(vSiteSettings, input) as SiteSettingsValue;
        await upsertSettings(ctx, settings);

        const cat = await catalog(ctx, rt);
        const recipe = (args.recipe as Recipe | undefined) ?? CORE_RECIPES[settings.kind as SiteKind];
        const pages = pagesFromRecipe(recipe, { locales: settings.locales, allowBlock: allowIn(cat) });
        let created = 0;
        let skipped = 0;
        const now = Date.now();
        for (const page of pages) {
          const taken = (await ctx.db
            .query("pages")
            .withIndex("by_path", (q) => q.eq("path", page.path))
            .collect()).some((p) => p.deletedAt === undefined);
          if (taken) {
            skipped++;
            continue;
          }
          await ctx.db.insert("pages", { ...page, blocks: preparePageBlocks(page.blocks, cat), createdAt: now, updatedAt: now });
          created++;
        }

        if (!settings.navigation?.length) {
          const doc = await getSettingsDoc(ctx);
          if (doc) await ctx.db.patch(doc._id, { navigation: navigationFromPages(pages) as SiteSettingsValue["navigation"] });
        }
        return { pagesCreated: created, pagesSkipped: skipped };
      },
    }),

    /** Muda parte das configurações (identidade, idiomas, tema, aparência, plugins). */
    patchSettings: internalMutation({
      args: { patch: v.any() },
      handler: async (ctx, args) => {
        const existing = await getSettingsDoc(ctx);
        if (!existing) throw new Error("O site ainda não foi configurado (rode o setup)");
        const merged = { ...stripMeta(existing), ...(args.patch as Record<string, unknown>) };
        await upsertSettings(ctx, pruneByValidator(vSiteSettings, merged) as SiteSettingsValue);
        return null;
      },
    }),
  };
}
