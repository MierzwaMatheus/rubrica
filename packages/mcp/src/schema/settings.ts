import { v } from "convex/values";
import { siteSettingsFields, vSeo } from "@rubrica/core/convex/validators";

/** JSON dos validadores que as ferramentas usam (o SEO de página, as configurações do site). */
export const vSeoJson = (vSeo as unknown as { json: unknown }).json;
export const siteSettingsJson = (v.object(siteSettingsFields) as unknown as { json: unknown }).json;
