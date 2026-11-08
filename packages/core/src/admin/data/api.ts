/**
 * Referências às funções do backend que o painel chama. O painel vive no pacote e não
 * enxerga o `convex/_generated` do projeto, então monta as referências pelo nome
 * (`rubrica/<módulo>:<função>`, ver `MODULE_DIR`), com os tipos escritos aqui.
 */
import { makeFunctionReference, type FunctionReference } from "convex/server";
import type { BlockInstance, CollectionName, SeoFields, SiteKind, SiteSettings } from "../../content/types";
import type { Localized } from "../../i18n";
import type { Role } from "../../convex/lib/roles";
import type { SiteSnapshot } from "../../data/source";
import type { BlockError } from "../editor/model";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Args = Record<string, any>;
type Q<A extends Args, R> = FunctionReference<"query", "public", A, R>;
type M<A extends Args, R> = FunctionReference<"mutation", "public", A, R>;
type Act<A extends Args, R> = FunctionReference<"action", "public", A, R>;
type Empty = Record<string, never>;

const q = <A extends Args, R>(module: string, name: string) => makeFunctionReference<"query", A, R>(`rubrica/${module}:${name}`) as Q<A, R>;
const m = <A extends Args, R>(module: string, name: string) => makeFunctionReference<"mutation", A, R>(`rubrica/${module}:${name}`) as M<A, R>;
const a = <A extends Args, R>(module: string, name: string) => makeFunctionReference<"action", A, R>(`rubrica/${module}:${name}`) as Act<A, R>;

export interface Me {
  userId: string;
  email: string | null;
  name: string | null;
  role: Role | null;
  mustChangePassword: boolean;
}

export interface UserRow {
  userId: string;
  email: string | null;
  name: string | null;
  createdAt: number;
  role: Role | null;
}

export interface PageDoc {
  _id: string;
  _creationTime: number;
  path: string;
  title: Localized<string>;
  seo?: SeoFields;
  blocks: BlockInstance[];
  published: boolean;
  system?: boolean;
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;
}

export interface PluginRow {
  id: string;
  label: string;
  description: string;
  requires: string[];
  enabled: boolean;
}

export interface MediaDoc {
  _id: string;
  _creationTime: number;
  storageId: string;
  name: string;
  folder: string;
  alt?: Localized<string>;
  width?: number;
  height?: number;
  size?: number;
  contentType?: string;
  createdAt: number;
  url: string | null;
}

export interface MediaUsage {
  type: string;
  id: string;
  label: string;
  count: number;
}

export interface PageValidation {
  blockErrors: BlockError[];
  pathError?: string;
  titleError?: string;
}

/** Item de coleção como o `list` devolve (formato do banco, campos variam por coleção). */
export type CollectionDoc = Record<string, unknown> & { _id: string; published?: boolean; deletedAt?: number };

type SettingsPatch = Partial<Omit<SiteSettings, "kind">> & { kind?: SiteKind };

export const api = {
  users: {
    isSetupRequired: q<Empty, boolean>("users", "isSetupRequired"),
    me: q<Empty, Me | null>("users", "me"),
    list: q<Empty, UserRow[]>("users", "list"),
    create: a<{ name: string; email: string; role: Exclude<Role, "root"> }, { userId: string; tempPassword: string }>("users", "create"),
    setRole: m<{ userId: string; role: Role }, null>("users", "setRole"),
    remove: m<{ userId: string }, null>("users", "remove"),
    changePassword: a<{ newPassword: string }, null>("users", "changePassword"),
  },
  settings: {
    get: q<Empty, SiteSettings | null>("settings", "get"),
    plugins: q<Empty, PluginRow[]>("settings", "plugins"),
    update: m<{ patch: SettingsPatch }, null>("settings", "update"),
    setPlugin: m<{ id: string; enabled: boolean }, null>("settings", "setPlugin"),
  },
  texts: {
    list: q<Empty, Record<string, Localized<string>>>("texts", "list"),
    set: m<{ key: string; value: Localized<string> }, null>("texts", "set"),
    reset: m<{ key: string }, null>("texts", "reset"),
  },
  media: {
    generateUploadUrl: m<Empty, string>("media", "generateUploadUrl"),
    save: m<{ storageId: string; name: string; folder?: string; alt?: Localized<string>; width?: number; height?: number }, { id: string; url: string | null }>("media", "save"),
    list: q<{ folder?: string }, MediaDoc[]>("media", "list"),
    folders: q<Empty, { path: string; count: number }[]>("media", "folders"),
    update: m<{ id: string; name?: string; folder?: string; alt?: Localized<string>; width?: number; height?: number }, null>("media", "update"),
    remove: m<{ id: string }, null>("media", "remove"),
  },
  pages: {
    list: q<{ includeDeleted?: boolean }, PageDoc[]>("pages", "list"),
    get: q<{ id: string }, PageDoc | null>("pages", "get"),
    create: m<{ path: string; title: Localized<string>; seo?: SeoFields; blocks?: BlockInstance[]; published?: boolean }, string>("pages", "create"),
    update: m<{ id: string; path?: string; title?: Localized<string>; seo?: SeoFields; clearSeo?: boolean; blocks?: BlockInstance[] }, null>("pages", "update"),
    publish: m<{ id: string }, null>("pages", "publish"),
    unpublish: m<{ id: string }, null>("pages", "unpublish"),
    remove: m<{ id: string }, null>("pages", "remove"),
  },
  site: {
    snapshot: q<Empty, SiteSnapshot>("site", "snapshot"),
  },
  panel: {
    validatePage: q<{ blocks: BlockInstance[]; path?: string; title?: Localized<string>; pageId?: string }, PageValidation>("panel", "validatePage"),
    mediaUsage: q<{ id: string }, MediaUsage[]>("panel", "mediaUsage"),
    replaceMedia: m<{ id: string; storageId: string; width?: number; height?: number }, { url: string; updated: number }>("panel", "replaceMedia"),
  },
  /**
   * Plugin `translation` (decisão 32): ponto "traduzir este campo". A action pode não
   * existir no backend ainda; o painel trata a ausência (`isMissingFunction`).
   */
  translation: {
    translate: a<{ text: string; from: string; to: string; html?: boolean }, string>("translation", "translate"),
  },
  collection: (name: CollectionName) => ({
    list: q<{ includeDeleted?: boolean }, CollectionDoc[]>(name, "list"),
  }),
};

/** O backend não tem a função (módulo ainda não instalado ou de outra versão). */
export function isMissingFunction(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /Could not find (public )?function/i.test(message);
}
