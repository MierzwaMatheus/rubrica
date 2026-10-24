/**
 * Dados iniciais que o setup (desenvolvimento) e o publicar (produção) gravam no Convex.
 * Ficam num lugar só para os dois ambientes começarem iguais.
 */
type Identity = Partial<Record<string, string>>;

export interface SeedPayloads {
  /** Argumentos de `seed:seedAll`. */
  seedAll: { enabledPlugins: string[] };
  /** Argumentos de `siteConfig:setBatchInternal`, ou null sem nome do site. */
  siteConfig: { items: Array<{ key: string; value: string }> } | null;
  /** Argumentos de `contactInfo:updateInternal`, ou null sem nome do site ou da pessoa. */
  contact: { name: string; email: string; showEmail: boolean } | null;
}

export function seedPayloads(identity: Identity, plugins: Record<string, boolean>, siteUrl: string): SeedPayloads {
  const enabledPlugins = Object.entries(plugins).filter(([, on]) => on).map(([id]) => id);
  if (!identity.siteName) return { seedAll: { enabledPlugins }, siteConfig: null, contact: null };
  return {
    seedAll: { enabledPlugins },
    siteConfig: {
      items: [
        { key: "site_title", value: identity.siteName },
        { key: "site_name", value: identity.siteName },
        { key: "site_url", value: siteUrl },
        { key: "site_description", value: identity.siteDescription || "" },
        { key: "author_name", value: identity.authorName || "" },
        { key: "author_email", value: identity.authorEmail || "" },
        { key: "twitter_handle", value: identity.twitterHandle || "" },
        { key: "lang", value: identity.lang || "pt-BR" },
      ],
    },
    contact: identity.authorName ? { name: identity.authorName, email: identity.authorEmail || "", showEmail: false } : null,
  };
}
