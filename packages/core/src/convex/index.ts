/**
 * Backend do Rubrica no pacote (RFC v2, revisão da decisão 13).
 *
 * O projeto cria a instância uma vez, em `convex/rubrica.config.ts` (o Convex não
 * trata arquivos com dois pontos no nome como módulo de funções):
 *
 * ```ts
 * import { createRubrica } from "@rubrica/core/convex";
 * export const rubrica = createRubrica({ blocks: [], plugins: [] });
 * ```
 *
 * e cada módulo do `convex/` é uma linha que reexporta (gerada pelo CLI, não se edita):
 *
 * ```ts
 * // convex/rubrica/posts.ts
 * import { rubrica } from "../rubrica.config";
 * export const { list, get, create, update, publish, unpublish, reorder, remove, restore, removePermanently } = rubrica.posts;
 * ```
 *
 * As funções do núcleo que chamam outras usam o caminho `rubrica/<módulo>:<função>`
 * (`MODULE_DIR`), então os arquivos precisam ficar em `convex/rubrica/`. Os nomes de
 * cada módulo estão em `RUBRICA_MODULES` (o CLI gera os arquivos a partir dele).
 */
import { cronJobs, httpRouter } from "convex/server";
import { auditFunctions } from "./audit";
import { createAuth } from "./auth";
import {
  faqFunctions,
  plansFunctions,
  postsFunctions,
  projectsFunctions,
  resumeFunctions,
  routineFunctions,
  servicesFunctions,
  teamFunctions,
  testimonialsFunctions,
} from "./collections";
import { mediaFunctions } from "./media";
import { pagesFunctions } from "./pages";
import { panelFunctions } from "./panel";
import { resolveRuntime, type RubricaConfig } from "./runtime";
import { ref } from "./server";
import { settingsFunctions, textsFunctions } from "./settings";
import { siteFunctions } from "./site";
import { usersFunctions } from "./users";

export function createRubrica(config: RubricaConfig = {}) {
  const rt = resolveRuntime(config);
  const once = <T>(build: () => T): (() => T) => {
    let value: T | undefined;
    return () => (value ??= build());
  };

  const auth = once(createAuth);
  const modules = {
    users: once(usersFunctions),
    audit: once(() => auditFunctions(rt)),
    site: once(() => siteFunctions(rt)),
    settings: once(() => settingsFunctions(rt)),
    texts: once(textsFunctions),
    media: once(mediaFunctions),
    pages: once(() => pagesFunctions(rt)),
    posts: once(() => postsFunctions(rt)),
    projects: once(() => projectsFunctions(rt)),
    services: once(() => servicesFunctions(rt)),
    testimonials: once(() => testimonialsFunctions(rt)),
    faq: once(() => faqFunctions(rt)),
    resume: once(() => resumeFunctions(rt)),
    routine: once(() => routineFunctions(rt)),
    plans: once(() => plansFunctions(rt)),
    team: once(() => teamFunctions(rt)),
    panel: once(() => panelFunctions(rt)),
  };

  return {
    /** Blocos e plugins efetivos (núcleo + projeto). */
    runtime: rt,
    /** Para `convex/auth.ts`: `export const { auth, signIn, signOut, store, isAuthenticated } = rubrica.auth;` */
    get auth() {
      return auth();
    },
    /** Para `convex/http.ts`: `export default rubrica.http;` (rotas do login; os webhooks entram aqui). */
    get http() {
      const http = httpRouter();
      auth().auth.addHttpRoutes(http);
      return http;
    },
    /** Para `convex/crons.ts`: `export default rubrica.crons;` */
    get crons() {
      const crons = cronJobs();
      crons.daily("rubrica: limpar registros e limites vencidos", { hourUTC: 6, minuteUTC: 0 }, ref("mutation", "audit", "cleanup"), {});
      return crons;
    },
    get users() {
      return modules.users();
    },
    get audit() {
      return modules.audit();
    },
    get site() {
      return modules.site();
    },
    get settings() {
      return modules.settings();
    },
    get texts() {
      return modules.texts();
    },
    get media() {
      return modules.media();
    },
    get pages() {
      return modules.pages();
    },
    get posts() {
      return modules.posts();
    },
    get projects() {
      return modules.projects();
    },
    get services() {
      return modules.services();
    },
    get testimonials() {
      return modules.testimonials();
    },
    get faq() {
      return modules.faq();
    },
    get resume() {
      return modules.resume();
    },
    get routine() {
      return modules.routine();
    },
    get plans() {
      return modules.plans();
    },
    get team() {
      return modules.team();
    },
    /** Só do painel: validar página sem gravar, uso e substituição de imagens. */
    get panel() {
      return modules.panel();
    },
  };
}

export type Rubrica = ReturnType<typeof createRubrica>;

/** Módulos de funções e o arquivo de cada um em `convex/rubrica/`. */
export const RUBRICA_MODULES = [
  "users",
  "audit",
  "site",
  "settings",
  "texts",
  "media",
  "pages",
  "posts",
  "projects",
  "services",
  "testimonials",
  "faq",
  "resume",
  "routine",
  "plans",
  "team",
  "panel",
] as const satisfies readonly (keyof Rubrica)[];

export type { RubricaConfig } from "./runtime";
export { rubricaTables, COLLECTION_TABLES } from "./schema";
export { requireAuth, requireRole, getUserRole, MAX_FAILED_SIGN_INS_PER_HOUR } from "./auth";
export { logAudit, logUserAction, checkRateLimit, recordRateLimitAttempt, hitRateLimit, resetRateLimit, RATE_LIMITS } from "./audit";
export { ROLES, PERMISSIONS, ROLE_LABELS, can, isRole, type Role, type Permission } from "./lib/roles";
export { buildSnapshot } from "./site";
export { MODULE_DIR } from "./server";
export type { DataModel, Doc, Id, QueryCtx, MutationCtx, ActionCtx } from "./server";

export type RubricaModule = (typeof RUBRICA_MODULES)[number];

/**
 * Conteúdo do arquivo `convex/rubrica/<módulo>.ts` do projeto: uma linha que
 * reexporta todas as funções do módulo. O CLI gera os arquivos com isto, e o teste do
 * projeto de referência confere que estão em dia.
 */
export function reexportSource(rubrica: Rubrica, module: RubricaModule): string {
  const names = Object.keys(rubrica[module]);
  return [
    "// Gerado pelo Rubrica (@rubrica/core). Não edite: atualize o pacote.",
    'import { rubrica } from "../rubrica.config";',
    "",
    `export const { ${names.join(", ")} } = rubrica.${module};`,
    "",
  ].join("\n");
}
