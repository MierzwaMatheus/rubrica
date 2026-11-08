import { can, type Permission } from "@rubrica/core/convex/roles";
import { COLLECTION_NAMES, COLLECTION_SPECS } from "../schema/collections";
import type { JsonSchema } from "../schema/json-schema";
import { pluginEnabled, type SiteState } from "../state";
import { authTools } from "./auth";
import { collectionTools, genericCollectionTools } from "./collections";
import { mediaTools } from "./media";
import { pagesTools } from "./pages";
import { siteTools } from "./site";
import { proposalTools } from "./proposals";
import { textTools } from "./texts";
import { DRY_RUN_PROP, type SchemaContext, type ToolDef } from "./types";

/** Todas as ferramentas que o servidor conhece; quais aparecem depende do estado. */
export function allTools(): ToolDef[] {
  return [
    ...authTools,
    ...siteTools,
    ...pagesTools,
    ...COLLECTION_NAMES.flatMap((name) => collectionTools(COLLECTION_SPECS[name])),
    ...genericCollectionTools,
    ...proposalTools,
    ...textTools,
    ...mediaTools,
  ];
}

const asList = (p: Permission | readonly Permission[] | undefined): readonly Permission[] => (p === undefined ? [] : typeof p === "string" ? [p] : p);

/** A ferramenta aparece para este usuário, com estes plugins e este backend? */
export function isVisible(tool: ToolDef, state: SiteState): boolean {
  const a = tool.access;
  if (a.login === false) return true;
  const role = state.me?.role;
  if (!role) return false;
  const perms = asList(a.permission);
  if (perms.length && !perms.some((p) => can(role, p))) return false;
  if (a.module && !state.modules.has(a.module)) return false;
  if (a.plugin && !pluginEnabled(state, a.plugin)) return false;
  if (a.collection) {
    const plugin = COLLECTION_SPECS[a.collection].plugin;
    if (plugin && !pluginEnabled(state, plugin)) return false;
  }
  return true;
}

export function toolSchema(tool: ToolDef, sc: SchemaContext, defaultDryRun: boolean): JsonSchema {
  const schema = tool.input(sc);
  if (!tool.write) return schema;
  return { ...schema, properties: { ...(schema.properties as JsonSchema), dryRun: DRY_RUN_PROP(defaultDryRun) } };
}
