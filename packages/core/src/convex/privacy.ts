/**
 * LGPD no painel (port do LgpdErasure da v1): exportação e exclusão dos dados de um
 * titular pelo e-mail, sobre as fontes de `personalData.ts`, e a política de
 * privacidade gerada como página `/privacidade` (blocos `texto`, editável), com versão
 * que sobe a cada mudança (`privacyVersion.ts`). Permissão `privacy` (root, admin).
 */
import { v } from "convex/values";
import { requireRole } from "./auth";
import { logUserAction } from "./audit";
import { contactRetentionDays, getDestinations } from "./contacts";
import { preparePageBlocks } from "./lib/blocks";
import { EMAIL_PROVIDERS, emailProviderId, enabledDestinations } from "./lib/destinations";
import { localizeTri, POLICY_TITLE, privacyPolicyBlocks, type PolicyInput } from "./lib/privacyPolicy";
import { anyText } from "./lib/text";
import { enabledPluginsFor, getSettingsDoc } from "./plugins";
import { currentPolicyVersion, PRIVACY_PATH, privacyPage, readPolicyVersion } from "./privacyVersion";
import type { RubricaRuntime } from "./runtime";
import { mutation, query, type ReaderCtx } from "./server";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function normalizeTitularEmail(email: string): string {
  const normalized = email.trim().toLowerCase();
  if (!EMAIL.test(normalized)) throw new Error("E-mail inválido");
  return normalized;
}

const PROVIDER_NAMES: Record<string, string> = { resend: "Resend" };

export function privacyFunctions(rt: RubricaRuntime) {
  async function policyInput(ctx: ReaderCtx): Promise<PolicyInput & { defaultLocale: string }> {
    const settings = await getSettingsDoc(ctx);
    if (!settings) throw new Error("O site ainda não foi configurado (rode o setup)");
    const plugins = await enabledPluginsFor(ctx, rt, settings);
    const { _id, ...config } = await getDestinations(ctx);
    void _id;
    const on = new Set(plugins.has("contact-wizard") ? enabledDestinations(config) : []);
    const provider = emailProviderId(process.env);
    return {
      siteName: anyText(settings.name, settings.locales.default) || settings.url,
      url: settings.url,
      locales: settings.locales.locales,
      defaultLocale: settings.locales.default,
      person: settings.person,
      organization: settings.organization,
      sources: rt.personalData.filter((s) => s.policy && (!s.plugin || plugins.has(s.plugin))).map((s) => ({ label: s.label, policy: s.policy! })),
      destinations: { telegram: on.has("telegram"), email: on.has("email"), webhook: on.has("webhook") },
      emailProvider: PROVIDER_NAMES[provider] ?? (EMAIL_PROVIDERS[provider] ? provider : "o provedor de e-mail"),
      contactRetentionDays: contactRetentionDays(),
      generatedAt: Date.now(),
    };
  }

  return {
    /** Tudo o que o site guarda do titular, por fonte (para entregar a ele). */
    exportData: query({
      args: { email: v.string() },
      handler: async (ctx, args) => {
        await requireRole(ctx, "privacy");
        const email = normalizeTitularEmail(args.email);
        const sources = [];
        for (const source of rt.personalData) {
          if (!source.find) continue;
          sources.push({ id: source.id, label: source.label.pt, records: await source.find(ctx, email) });
        }
        return { email, generatedAt: Date.now(), total: sources.reduce((n, s) => n + s.records.length, 0), sources };
      },
    }),

    /**
     * Apaga (ou anonimiza, conforme a fonte) os dados do titular. `confirm` repete o
     * e-mail, para não apagar por engano. O registro de atividade não guarda o e-mail.
     */
    erase: mutation({
      args: { email: v.string(), confirm: v.string() },
      handler: async (ctx, args) => {
        const { userId } = await requireRole(ctx, "privacy");
        const email = normalizeTitularEmail(args.email);
        if (normalizeTitularEmail(args.confirm) !== email) throw new Error("A confirmação não confere com o e-mail");
        const bySource: Record<string, number> = {};
        for (const source of rt.personalData) {
          if (!source.erase) continue;
          bySource[source.id] = await source.erase(ctx, email);
        }
        const total = Object.values(bySource).reduce((a, b) => a + b, 0);
        await logUserAction(ctx, userId, "lgpd.erasure_executed", { type: "titular" }, { bySource, total });
        return { total, bySource };
      },
    }),

    /** Estado da política: existe, está publicada, versão vigente, mudou desde a última versão. */
    policyStatus: query({
      args: {},
      handler: async (ctx) => {
        await requireRole(ctx, "privacy");
        const { version, outdated, page } = await readPolicyVersion(ctx);
        return {
          path: PRIVACY_PATH,
          exists: !!page,
          pageId: page?._id ?? null,
          published: page?.published ?? false,
          // Mudança ainda não registrada vira versão nova no próximo envio ou geração.
          version: outdated ? version + 1 : version,
          updatedAt: page?.updatedAt ?? null,
        };
      },
    }),

    /** Texto padrão, sem gravar (para mostrar antes de gerar). */
    policyDraft: query({
      args: {},
      handler: async (ctx) => {
        await requireRole(ctx, "privacy");
        const input = await policyInput(ctx);
        return { path: PRIVACY_PATH, title: localizeTri(POLICY_TITLE, input.locales), blocks: privacyPolicyBlocks(input) };
      },
    }),

    /**
     * Grava o texto padrão como a página `/privacidade`. Se a página já existe, só com
     * `overwrite` (as edições feitas nela se perdem). A versão sobe.
     */
    generatePolicy: mutation({
      args: { overwrite: v.optional(v.boolean()), publish: v.optional(v.boolean()) },
      handler: async (ctx, args) => {
        const { userId } = await requireRole(ctx, "privacy");
        const input = await policyInput(ctx);
        const settings = await getSettingsDoc(ctx);
        const blocks = preparePageBlocks(privacyPolicyBlocks(input), {
          blocks: rt.blocks,
          kind: settings!.kind,
          enabledPlugins: await enabledPluginsFor(ctx, rt, settings),
        });
        const title = localizeTri(POLICY_TITLE, input.locales);
        const existing = await privacyPage(ctx);
        const now = Date.now();
        let pageId = existing?._id;
        if (existing) {
          if (!args.overwrite) throw new Error("A página /privacidade já existe. Use overwrite para trocar pelo texto padrão (as edições se perdem).");
          await ctx.db.patch(existing._id, { title, blocks, published: args.publish ?? existing.published, updatedAt: now, updatedBy: userId });
        } else {
          pageId = await ctx.db.insert("pages", { path: PRIVACY_PATH, title, blocks, published: args.publish ?? false, system: true, createdAt: now, updatedAt: now, updatedBy: userId });
        }
        const version = await currentPolicyVersion(ctx);
        await logUserAction(ctx, userId, existing ? "admin.update" : "admin.create", { type: "page", id: pageId, label: title[input.defaultLocale] ?? PRIVACY_PATH }, { privacyPolicyVersion: version });
        return { pageId: pageId!, version };
      },
    }),
  };
}
