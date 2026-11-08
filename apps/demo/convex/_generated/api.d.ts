/* eslint-disable */
  /**
   * Generated `api` utility.
   *
   * THIS CODE IS AUTOMATICALLY GENERATED.
   *
   * To regenerate, run `npx convex dev`.
   * @module
   */
  
  import type { ApiFromModules, FilterApi, FunctionReference } from "convex/server";
  import type * as auth from "../auth.js";
import type * as crons from "../crons.js";
import type * as http from "../http.js";
import type * as rubrica_audit from "../rubrica/audit.js";
import type * as rubrica_commerce from "../rubrica/commerce.js";
import type * as rubrica_contractTemplates from "../rubrica/contractTemplates.js";
import type * as rubrica_faq from "../rubrica/faq.js";
import type * as rubrica_media from "../rubrica/media.js";
import type * as rubrica_pages from "../rubrica/pages.js";
import type * as rubrica_plans from "../rubrica/plans.js";
import type * as rubrica_posts from "../rubrica/posts.js";
import type * as rubrica_projects from "../rubrica/projects.js";
import type * as rubrica_proposals from "../rubrica/proposals.js";
import type * as rubrica_resume from "../rubrica/resume.js";
import type * as rubrica_routine from "../rubrica/routine.js";
import type * as rubrica_services from "../rubrica/services.js";
import type * as rubrica_settings from "../rubrica/settings.js";
import type * as rubrica_site from "../rubrica/site.js";
import type * as rubrica_team from "../rubrica/team.js";
import type * as rubrica_testimonials from "../rubrica/testimonials.js";
import type * as rubrica_texts from "../rubrica/texts.js";
import type * as rubrica_users from "../rubrica/users.js";

  /**
   * A utility for referencing Convex functions in your app's API.
   *
   * Usage:
   * ```js
   * const myFunctionReference = api.myModule.myFunction;
   * ```
   */
  declare const fullApi: ApiFromModules<{
    "auth": typeof auth,
"crons": typeof crons,
"http": typeof http,
"rubrica/audit": typeof rubrica_audit,
"rubrica/commerce": typeof rubrica_commerce,
"rubrica/contractTemplates": typeof rubrica_contractTemplates,
"rubrica/faq": typeof rubrica_faq,
"rubrica/media": typeof rubrica_media,
"rubrica/pages": typeof rubrica_pages,
"rubrica/plans": typeof rubrica_plans,
"rubrica/posts": typeof rubrica_posts,
"rubrica/projects": typeof rubrica_projects,
"rubrica/proposals": typeof rubrica_proposals,
"rubrica/resume": typeof rubrica_resume,
"rubrica/routine": typeof rubrica_routine,
"rubrica/services": typeof rubrica_services,
"rubrica/settings": typeof rubrica_settings,
"rubrica/site": typeof rubrica_site,
"rubrica/team": typeof rubrica_team,
"rubrica/testimonials": typeof rubrica_testimonials,
"rubrica/texts": typeof rubrica_texts,
"rubrica/users": typeof rubrica_users,
  }>;
  export declare const api: FilterApi<typeof fullApi, FunctionReference<any, "public">>;
  export declare const internal: FilterApi<typeof fullApi, FunctionReference<any, "internal">>;
  