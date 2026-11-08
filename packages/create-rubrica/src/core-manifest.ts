/**
 * Funções de cada módulo do núcleo (`RUBRICA_MODULES` e `createRubrica()` do
 * `@rubrica/core/convex`), na versão com que este CLI foi feito. O `update` lê a lista
 * do pacote instalado; esta é a reserva (projeto ainda sem `node_modules`). Um teste
 * confere que ela bate com o núcleo do monorepo.
 */
export const CORE_MODULES: Record<string, readonly string[]> = {
  users: ["isSetupRequired", "me", "list", "create", "setRole", "remove", "changePassword", "actor", "assignRoleInternal", "clearMustChangePassword", "setupRoot", "findPasswordAccount", "afterPasswordReset", "resetPasswordInternal"],
  audit: ["recent", "logFromAction", "hitRateLimit", "cleanup"],
  site: ["snapshot"],
  settings: ["get", "plugins", "update", "setPlugin", "init"],
  texts: ["list", "set", "reset"],
  media: ["generateUploadUrl", "save", "list", "folders", "get", "update", "remove"],
  pages: ["list", "get", "getByPath", "create", "update", "reorderBlocks", "setBlockVisible", "upsertBlock", "removeBlock", "publish", "unpublish", "remove", "restore", "removePermanently"],
  posts: ["list", "get", "create", "update", "publish", "unpublish", "reorder", "remove", "restore", "removePermanently"],
  projects: ["list", "get", "create", "update", "publish", "unpublish", "reorder", "remove", "restore", "removePermanently"],
  services: ["list", "get", "create", "update", "publish", "unpublish", "reorder", "remove", "restore", "removePermanently"],
  testimonials: ["list", "get", "create", "update", "publish", "unpublish", "reorder", "remove", "restore", "removePermanently"],
  faq: ["list", "get", "create", "update", "publish", "unpublish", "reorder", "remove", "restore", "removePermanently"],
  resume: ["list", "get", "create", "update", "publish", "unpublish", "reorder", "remove", "restore", "removePermanently"],
  routine: ["list", "get", "create", "update", "publish", "unpublish", "reorder", "remove", "restore", "removePermanently"],
  plans: ["list", "get", "create", "update", "publish", "unpublish", "reorder", "remove", "restore", "removePermanently"],
  team: ["list", "get", "create", "update", "publish", "unpublish", "reorder", "remove", "restore", "removePermanently"],
  seed: ["status", "apply", "patchSettings"],
};
