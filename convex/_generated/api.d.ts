/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as aboutDailyRoutine from "../aboutDailyRoutine.js";
import type * as aboutFaq from "../aboutFaq.js";
import type * as aiResumes from "../aiResumes.js";
import type * as aiResumesAction from "../aiResumesAction.js";
import type * as asaas from "../asaas.js";
import type * as audit from "../audit.js";
import type * as auth from "../auth.js";
import type * as checkouts from "../checkouts.js";
import type * as contactInfo from "../contactInfo.js";
import type * as contactRequests from "../contactRequests.js";
import type * as contractTemplates from "../contractTemplates.js";
import type * as crons from "../crons.js";
import type * as deploy from "../deploy.js";
import type * as homeContent from "../homeContent.js";
import type * as http from "../http.js";
import type * as imageFolders from "../imageFolders.js";
import type * as images from "../images.js";
import type * as lib_security from "../lib/security.js";
import type * as lib_softDelete from "../lib/softDelete.js";
import type * as playground from "../playground.js";
import type * as playgroundAi from "../playgroundAi.js";
import type * as pluginRegistry from "../pluginRegistry.js";
import type * as plugins from "../plugins.js";
import type * as posts from "../posts.js";
import type * as projects from "../projects.js";
import type * as proposals from "../proposals.js";
import type * as publishStatus from "../publishStatus.js";
import type * as rateLimit from "../rateLimit.js";
import type * as resumeItems from "../resumeItems.js";
import type * as seed from "../seed.js";
import type * as services from "../services.js";
import type * as siteConfig from "../siteConfig.js";
import type * as siteTexts from "../siteTexts.js";
import type * as stats from "../stats.js";
import type * as stripe from "../stripe.js";
import type * as telegram from "../telegram.js";
import type * as testimonialSubmissions from "../testimonialSubmissions.js";
import type * as testimonials from "../testimonials.js";
import type * as translation from "../translation.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  aboutDailyRoutine: typeof aboutDailyRoutine;
  aboutFaq: typeof aboutFaq;
  aiResumes: typeof aiResumes;
  aiResumesAction: typeof aiResumesAction;
  asaas: typeof asaas;
  audit: typeof audit;
  auth: typeof auth;
  checkouts: typeof checkouts;
  contactInfo: typeof contactInfo;
  contactRequests: typeof contactRequests;
  contractTemplates: typeof contractTemplates;
  crons: typeof crons;
  deploy: typeof deploy;
  homeContent: typeof homeContent;
  http: typeof http;
  imageFolders: typeof imageFolders;
  images: typeof images;
  "lib/security": typeof lib_security;
  "lib/softDelete": typeof lib_softDelete;
  playground: typeof playground;
  playgroundAi: typeof playgroundAi;
  pluginRegistry: typeof pluginRegistry;
  plugins: typeof plugins;
  posts: typeof posts;
  projects: typeof projects;
  proposals: typeof proposals;
  publishStatus: typeof publishStatus;
  rateLimit: typeof rateLimit;
  resumeItems: typeof resumeItems;
  seed: typeof seed;
  services: typeof services;
  siteConfig: typeof siteConfig;
  siteTexts: typeof siteTexts;
  stats: typeof stats;
  stripe: typeof stripe;
  telegram: typeof telegram;
  testimonialSubmissions: typeof testimonialSubmissions;
  testimonials: typeof testimonials;
  translation: typeof translation;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
