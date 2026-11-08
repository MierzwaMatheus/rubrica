/**
 * Backend de demonstração, em memória, com os dados de exemplo (fixtures). Serve ao
 * site de demonstração (o `/admin` funciona sem Convex) e aos testes de ponta a ponta
 * do painel. Imita as funções do núcleo que o painel usa, com as MESMAS regras puras
 * (validação de blocos e caminhos, papéis, plugins), mas não grava nada: recarregar a
 * página volta aos dados de exemplo.
 *
 * Só é carregado quando a integração usa `source: { fixtures }`; num projeto com
 * Convex este arquivo nem entra no bundle (import dinâmico).
 */
import { useCallback, useMemo, useSyncExternalStore } from "react";
import { getFunctionName } from "convex/server";
import { CORE_BLOCKS } from "../../blocks/catalog";
import type { BlockDefinition } from "../../blocks/define";
import type { BlockInstance, CollectionName, PageRecord, SiteSettings } from "../../content/types";
import { COLLECTIONS } from "../../content/types";
import type { SiteSnapshot } from "../../data/source";
import { defineLocales, localePrefix, type Localized } from "../../i18n";
import { can, type Permission, type Role } from "../../convex/lib/roles";
import { assertValidPagePath, preparePageBlocks, validatePageBlocks } from "../../convex/lib/blocks";
import { enabledPlugins, type PluginDefinition } from "../../plugins/contract";
import { CORE_PLUGINS } from "../../plugins/registry";
import type { Backend } from "./backend";

type Data = Record<string, unknown>;
type Doc = Data & { _id: string; _creationTime: number };

interface DemoUser {
  userId: string;
  email: string;
  name: string;
  role: Role;
  password: string;
  mustChangePassword: boolean;
  createdAt: number;
}

export const DEMO_CREDENTIALS = { email: "demo@rubrica.dev", password: "Demonstracao2026" };

const TECHNICAL = ["kind", "url", "locales", "theme"];

let seq = 0;
const newId = (prefix: string) => `${prefix}${Date.now().toString(36)}${(seq++).toString(36)}`;

function textOf(value: unknown): string {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") return (Object.values(value).find((v) => typeof v === "string" && v.trim()) as string) ?? "";
  return "";
}

function countRefs(value: unknown, storageId: string): number {
  if (Array.isArray(value)) return value.reduce((n: number, v) => n + countRefs(v, storageId), 0);
  if (!value || typeof value !== "object") return 0;
  const o = value as Data;
  const self = o.storageId === storageId && typeof o.url === "string" ? 1 : 0;
  return Object.values(o).reduce((n: number, v) => n + countRefs(v, storageId), self);
}

function replaceRefs<T>(value: T, from: string, to: Data): T {
  if (Array.isArray(value)) return value.map((v) => replaceRefs(v, from, to)) as T;
  if (!value || typeof value !== "object") return value;
  const out: Data = {};
  for (const [k, v] of Object.entries(value)) out[k] = replaceRefs(v, from, to);
  if (out.storageId === from && typeof out.url === "string") {
    delete out.width;
    delete out.height;
    Object.assign(out, to);
  }
  return out as T;
}

export interface DemoOptions {
  snapshot: SiteSnapshot;
  blocks?: readonly BlockDefinition[];
  plugins?: readonly PluginDefinition[];
  /** Atraso das gravações, para a interface mostrar o "salvando" (ms). */
  latency?: number;
}

/** Estado e funções do backend de demonstração. Exportado para os testes. */
export function createDemoStore(options: DemoOptions) {
  const blocks = [...CORE_BLOCKS, ...(options.blocks ?? []).filter((b) => !CORE_BLOCKS.some((c) => c.type === b.type))];
  const plugins = [...(options.plugins ?? CORE_PLUGINS)];
  const snap = structuredClone(options.snapshot);
  const now = Date.now();

  const state = {
    settings: snap.site as SiteSettings,
    pages: snap.pages.map((p, i): Doc => ({ ...p, _id: p.id, _creationTime: now + i, createdAt: p.updatedAt, published: p.published })),
    collections: Object.fromEntries(
      COLLECTIONS.map((name) => [name, (snap.collections[name] as unknown as Data[]).map((item, i): Doc => ({ ...item, _id: String(item.id), _creationTime: now + i, published: true, createdAt: now }))]),
    ) as Record<CollectionName, Doc[]>,
    texts: { ...snap.texts } as Record<string, Localized<string>>,
    media: [] as Doc[],
    blobs: new Map<string, string>(),
    users: [
      { userId: "u-root", email: DEMO_CREDENTIALS.email, name: "Demonstração", role: "root", password: DEMO_CREDENTIALS.password, mustChangePassword: false, createdAt: now },
      { userId: "u-editor", email: "editora@rubrica.dev", name: "Editora", role: "content-editor", password: "Editora2026!x", mustChangePassword: false, createdAt: now },
    ] as DemoUser[],
    session: null as string | null,
  };

  // Imagens dos fixtures entram na biblioteca, para a tela de mídia ter o que mostrar.
  const seen = new Set<string>();
  const collectImages = (value: unknown) => {
    if (Array.isArray(value)) return value.forEach(collectImages);
    if (!value || typeof value !== "object") return;
    const o = value as Data;
    if (typeof o.url === "string" && /^(https?:|\/)/.test(o.url) && !seen.has(o.url) && ("alt" in o || "width" in o)) {
      seen.add(o.url);
      const storageId = typeof o.storageId === "string" ? o.storageId : `demo-file-${seen.size}`;
      state.media.push({
        _id: newId("m"),
        _creationTime: now,
        storageId,
        name: o.url.split("/").pop() || "imagem",
        folder: "/",
        alt: o.alt as Localized<string> | undefined,
        width: o.width as number | undefined,
        height: o.height as number | undefined,
        createdAt: now,
      });
      state.blobs.set(storageId, o.url);
    }
    Object.values(o).forEach(collectImages);
  };
  collectImages(snap);

  let version = 0;
  const listeners = new Set<() => void>();
  const changed = () => {
    version++;
    listeners.forEach((l) => l());
  };

  const actor = (): DemoUser => {
    const user = state.users.find((u) => u.userId === state.session);
    if (!user) throw new Error("Não autenticado");
    return user;
  };
  const require = (permission: Permission): DemoUser => {
    const user = actor();
    if (!can(user.role, permission)) throw new Error("Sem permissão para esta ação");
    return user;
  };
  const enabled = () => enabledPlugins(plugins, state.settings.kind, state.settings.plugins);
  const catalog = () => ({ blocks, kind: state.settings.kind, enabledPlugins: enabled() });
  const reserved = () => state.settings.locales.locales.map((l) => localePrefix(l, state.settings.locales)).filter(Boolean).map((p) => `/${p}`);
  const detailBases = () => [state.settings.paths?.posts ?? "/blog", state.settings.paths?.projects ?? "/portfolio"];
  const page = (id: string): Doc => {
    const p = state.pages.find((x) => x._id === id);
    if (!p) throw new Error("Página não encontrada");
    return p;
  };
  const pathFree = (path: string, except?: string) => {
    if (state.pages.some((p) => p.path === path && p._id !== except && p.deletedAt === undefined)) throw new Error(`Já existe uma página em "${path}"`);
  };
  const cleanTitle = (title: Localized<string>) => {
    const out = Object.fromEntries(Object.entries(title).filter(([, v]) => typeof v === "string" && v.trim()));
    if (!Object.keys(out).length) throw new Error("title: preencha em pelo menos um idioma");
    return out;
  };
  const media = (id: string) => {
    const doc = state.media.find((m) => m._id === id);
    if (!doc) throw new Error("Imagem não encontrada");
    return doc;
  };
  const withUrl = (doc: Doc) => ({ ...doc, url: state.blobs.get(doc.storageId as string) ?? null });
  const collectionPermission = (name: CollectionName): Permission => (name === "posts" ? "blog" : name === "plans" ? "plans" : "content");

  function snapshot(): SiteSnapshot {
    const on = enabled();
    const pages: PageRecord[] = state.pages
      .filter((p) => p.published && p.deletedAt === undefined)
      .map((p) => ({
        id: p._id,
        path: p.path as string,
        ...(p.system ? { system: true } : {}),
        title: p.title as Localized<string>,
        ...(p.seo ? { seo: p.seo as PageRecord["seo"] } : {}),
        blocks: (p.blocks as BlockInstance[]).filter((b) => b.visible),
        published: true,
        updatedAt: p.updatedAt as number,
      }));
    const collections = Object.fromEntries(
      COLLECTIONS.map((name) => {
        const owner = plugins.find((p) => p.collections?.includes(name));
        const items = owner && !on.has(owner.id) ? [] : state.collections[name].filter((d) => d.published && d.deletedAt === undefined);
        return [name, items.map(({ _id, _creationTime, published, createdAt, deletedAt, ...rest }) => (void _creationTime, void published, void createdAt, void deletedAt, { ...rest, id: _id }))];
      }),
    ) as unknown as SiteSnapshot["collections"];
    return structuredClone({ site: state.settings, pages, collections, texts: state.texts });
  }

  const queries: Record<string, (args: Data) => unknown> = {
    "users:isSetupRequired": () => false,
    "users:me": () => {
      const user = state.users.find((u) => u.userId === state.session);
      return user ? { userId: user.userId, email: user.email, name: user.name, role: user.role, mustChangePassword: user.mustChangePassword } : null;
    },
    "users:list": () => {
      require("users");
      return state.users.map((u) => ({ userId: u.userId, email: u.email, name: u.name, createdAt: u.createdAt, role: u.role }));
    },
    "settings:get": () => (require("panel"), structuredClone(state.settings)),
    "settings:plugins": () => {
      require("panel");
      const on = enabled();
      return plugins.filter((p) => p.kinds.includes(state.settings.kind)).map((p) => ({ id: p.id, label: p.label, description: p.description, requires: p.requires ?? [], enabled: on.has(p.id) }));
    },
    "texts:list": () => (require("panel"), structuredClone(state.texts)),
    "media:list": (args) => {
      require("media");
      return state.media.filter((m) => !args.folder || m.folder === args.folder).sort((a, b) => (b.createdAt as number) - (a.createdAt as number)).map(withUrl);
    },
    "media:folders": () => {
      require("media");
      const counts = new Map<string, number>();
      for (const m of state.media) counts.set(m.folder as string, (counts.get(m.folder as string) ?? 0) + 1);
      return [...counts].map(([path, count]) => ({ path, count })).sort((a, b) => a.path.localeCompare(b.path));
    },
    "pages:list": (args) => {
      require("pages");
      return structuredClone(state.pages.filter((p) => args.includeDeleted || p.deletedAt === undefined).sort((a, b) => (a.path as string).localeCompare(b.path as string)));
    },
    "pages:get": (args) => (require("pages"), structuredClone(state.pages.find((p) => p._id === args.id) ?? null)),
    "site:snapshot": () => snapshot(),
    "panel:validatePage": (args) => {
      require("pages");
      const result: Data = { blockErrors: validatePageBlocks(args.blocks as BlockInstance[], catalog()) };
      const title = args.title as Localized<string> | undefined;
      if (title && !Object.values(title).some((v) => v?.trim())) result.titleError = "Preencha o título em pelo menos um idioma";
      if (typeof args.path === "string") {
        const current = state.pages.find((p) => p._id === args.pageId);
        if (!current || current.path !== args.path) {
          try {
            if (current?.system) throw new Error("O caminho de uma página do sistema não muda");
            assertValidPagePath(args.path, reserved(), detailBases());
            pathFree(args.path, args.pageId as string | undefined);
          } catch (e) {
            result.pathError = (e as Error).message;
          }
        }
      }
      return result;
    },
    "panel:mediaUsage": (args) => {
      require("media");
      const storageId = media(args.id as string).storageId as string;
      const found: Data[] = [];
      for (const p of state.pages) {
        const count = countRefs([p.blocks, p.seo], storageId);
        if (count) found.push({ type: "page", id: p._id, label: textOf(p.title) || p.path, count });
      }
      for (const name of COLLECTIONS) {
        for (const d of state.collections[name]) {
          const count = countRefs(d, storageId);
          if (count) found.push({ type: name, id: d._id, label: textOf(d.title ?? d.name ?? d.question ?? d.author), count });
        }
      }
      const count = countRefs(state.settings, storageId);
      if (count) found.push({ type: "siteSettings", id: "settings", label: "Configurações do site", count });
      return found;
    },
  };
  for (const name of COLLECTIONS) {
    queries[`${name}:list`] = (args) => {
      require(collectionPermission(name));
      return structuredClone(state.collections[name].filter((d) => args.includeDeleted || d.deletedAt === undefined));
    };
  }

  const mutations: Record<string, (args: Data) => unknown> = {
    "users:setRole": (args) => {
      const me = require("users");
      if (args.userId === me.userId) throw new Error("Você não pode mudar o próprio papel");
      const user = state.users.find((u) => u.userId === args.userId);
      if (!user) throw new Error("Usuário não encontrado");
      if (user.role === "root" && args.role !== "root" && state.users.filter((u) => u.role === "root").length <= 1) throw new Error("O site precisa de pelo menos um root");
      user.role = args.role as Role;
      return null;
    },
    "users:remove": (args) => {
      const me = require("users");
      if (args.userId === me.userId) throw new Error("Você não pode remover a si mesmo");
      state.users = state.users.filter((u) => u.userId !== args.userId);
      return null;
    },
    "settings:update": (args) => {
      const me = require("settings");
      const patch = args.patch as Partial<SiteSettings>;
      if (me.role !== "root" && Object.keys(patch).some((k) => TECHNICAL.includes(k))) throw new Error("Tipo do site, URL, idiomas e tema só a agência (root) muda");
      const next = { ...state.settings, ...patch } as SiteSettings;
      try {
        defineLocales(next.locales);
      } catch (e) {
        throw new Error((e as Error).message.replace("[rubrica] ", ""));
      }
      if (!/^https?:\/\/[^/\s]+(\/[^\s]*)?$/.test(next.url) || next.url.endsWith("/")) throw new Error("URL do site inválida: use https://exemplo.com, sem barra no final");
      state.settings = structuredClone(next);
      return null;
    },
    "settings:setPlugin": (args) => {
      require("settings");
      if (!plugins.some((p) => p.id === args.id)) throw new Error(`Plugin desconhecido: ${String(args.id)}`);
      state.settings = { ...state.settings, plugins: { ...state.settings.plugins, [args.id as string]: args.enabled as boolean } };
      return null;
    },
    "texts:set": (args) => {
      require("texts");
      const value = Object.fromEntries(Object.entries(args.value as Data).filter(([, v]) => typeof v === "string" && v.trim()));
      if (Object.keys(value).length) state.texts[args.key as string] = value as Localized<string>;
      else delete state.texts[args.key as string];
      return null;
    },
    "texts:reset": (args) => {
      require("texts");
      delete state.texts[args.key as string];
      return null;
    },
    "media:generateUploadUrl": () => (require("media"), `demo-upload:${newId("u")}`),
    "media:save": (args) => {
      const me = require("media");
      if (!state.blobs.has(args.storageId as string)) throw new Error("Arquivo não encontrado no storage");
      const id = newId("m");
      state.media.push({ _id: id, _creationTime: Date.now(), storageId: args.storageId, name: String(args.name || "imagem"), folder: (args.folder as string) || "/", alt: args.alt, width: args.width, height: args.height, createdAt: Date.now(), createdBy: me.userId });
      return { id, url: state.blobs.get(args.storageId as string) ?? null };
    },
    "media:update": (args) => {
      require("media");
      const doc = media(args.id as string);
      for (const key of ["name", "folder", "alt", "width", "height"]) if (args[key] !== undefined) doc[key] = args[key];
      return null;
    },
    "media:remove": (args) => {
      require("media");
      media(args.id as string);
      state.media = state.media.filter((m) => m._id !== args.id);
      return null;
    },
    "panel:replaceMedia": (args) => {
      require("media");
      const doc = media(args.id as string);
      const url = state.blobs.get(args.storageId as string);
      if (!url) throw new Error("Arquivo não encontrado no storage");
      const to: Data = { storageId: args.storageId, url, ...(args.width ? { width: args.width } : {}), ...(args.height ? { height: args.height } : {}) };
      const from = doc.storageId as string;
      let updated = 0;
      for (const p of state.pages) {
        if (countRefs([p.blocks, p.seo], from)) {
          p.blocks = replaceRefs(p.blocks, from, to);
          p.seo = replaceRefs(p.seo, from, to);
          updated++;
        }
      }
      for (const name of COLLECTIONS) {
        state.collections[name] = state.collections[name].map((d) => (countRefs(d, from) ? (updated++, replaceRefs(d, from, to)) : d));
      }
      if (countRefs(state.settings, from)) {
        state.settings = replaceRefs(state.settings, from, to);
        updated++;
      }
      Object.assign(doc, { storageId: args.storageId, width: args.width, height: args.height });
      return { url, updated };
    },
    "pages:create": (args) => {
      require("pages");
      const path = args.path as string;
      assertValidPagePath(path, reserved(), detailBases());
      pathFree(path);
      const id = newId("p");
      const t = Date.now();
      state.pages.push({
        _id: id,
        _creationTime: t,
        path,
        title: cleanTitle(args.title as Localized<string>),
        ...(args.seo ? { seo: args.seo } : {}),
        blocks: preparePageBlocks((args.blocks as BlockInstance[]) ?? [], catalog()),
        published: (args.published as boolean) ?? false,
        createdAt: t,
        updatedAt: t,
      });
      return id;
    },
    "pages:update": (args) => {
      require("pages");
      const p = page(args.id as string);
      const next: Data = { updatedAt: Date.now() };
      if (typeof args.path === "string" && args.path !== p.path) {
        if (p.system) throw new Error("O caminho de uma página do sistema não muda");
        assertValidPagePath(args.path, reserved(), detailBases());
        pathFree(args.path, p._id);
        next.path = args.path;
      }
      if (args.title) next.title = cleanTitle(args.title as Localized<string>);
      if (args.clearSeo) next.seo = undefined;
      else if (args.seo) next.seo = args.seo;
      if (args.blocks) next.blocks = preparePageBlocks(args.blocks as BlockInstance[], catalog());
      Object.assign(p, structuredClone(next));
      return null;
    },
    "pages:publish": (args) => (require("pages"), Object.assign(page(args.id as string), { published: true, updatedAt: Date.now() }), null),
    "pages:unpublish": (args) => (require("pages"), Object.assign(page(args.id as string), { published: false, updatedAt: Date.now() }), null),
    "pages:remove": (args) => {
      require("pages");
      const p = page(args.id as string);
      if (p.system) throw new Error("Páginas do sistema podem ser editadas, não apagadas");
      p.deletedAt = Date.now();
      return null;
    },
  };

  const actions: Record<string, (args: Data) => unknown> = {
    "users:create": (args) => {
      const me = actor();
      if (me.role !== "root") throw new Error("Sem permissão para esta ação");
      const email = String(args.email).trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("E-mail inválido");
      if (state.users.some((u) => u.email === email)) throw new Error("Já existe um usuário com esse e-mail");
      const tempPassword = `Temp${Math.random().toString(36).slice(2, 10)}A1`;
      const userId = newId("u");
      state.users.push({ userId, email, name: String(args.name).trim(), role: args.role as Role, password: tempPassword, mustChangePassword: true, createdAt: Date.now() });
      return { userId, tempPassword };
    },
    "users:changePassword": (args) => {
      const me = actor();
      const pw = String(args.newPassword);
      if (pw.length < 12) throw new Error("A senha deve ter no mínimo 12 caracteres");
      if (!/[A-Z]/.test(pw)) throw new Error("A senha deve conter ao menos uma letra maiúscula");
      if (!/[a-z]/.test(pw)) throw new Error("A senha deve conter ao menos uma letra minúscula");
      if (!/[0-9]/.test(pw)) throw new Error("A senha deve conter ao menos um número");
      me.password = pw;
      me.mustChangePassword = false;
      return null;
    },
  };

  function call(table: Record<string, (args: Data) => unknown>, ref: unknown, args: unknown) {
    const full = getFunctionName(ref as never);
    const name = full.replace(/^rubrica\//, "");
    const fn = table[name];
    if (!fn) throw new Error(`Could not find public function for '${full}'`);
    return fn((args ?? {}) as Data);
  }

  return {
    state,
    blocks,
    plugins,
    get version() {
      return version;
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    query: (ref: unknown, args: unknown) => call(queries, ref, args),
    mutate(ref: unknown, args: unknown) {
      const result = call(mutations, ref, args);
      changed();
      return result;
    },
    act(ref: unknown, args: unknown) {
      const result = call(actions, ref, args);
      changed();
      return result;
    },
    signIn(email: string, password: string) {
      const user = state.users.find((u) => u.email === email.trim().toLowerCase() && u.password === password);
      if (!user) throw new Error("InvalidSecret");
      state.session = user.userId;
      changed();
    },
    signOut() {
      state.session = null;
      changed();
    },
    upload(file: File | Blob) {
      const storageId = newId("s");
      const url = typeof URL.createObjectURL === "function" ? URL.createObjectURL(file) : `blob:demo/${storageId}`;
      state.blobs.set(storageId, url);
      return storageId;
    },
  };
}

export type DemoStore = ReturnType<typeof createDemoStore>;

/** `Backend` sobre o store de demonstração (ganchos React). */
export function createDemoBackend(options: DemoOptions): { backend: Backend; store: DemoStore } {
  const store = createDemoStore(options);
  const latency = options.latency ?? 120;
  const wait = () => new Promise((r) => setTimeout(r, latency));
  const useVersion = () => useSyncExternalStore(store.subscribe, () => store.version);

  const backend: Backend = {
    mode: "demo",
    demoCredentials: DEMO_CREDENTIALS,
    useQuery(ref, args) {
      const v = useVersion();
      const key = args === "skip" ? "skip" : JSON.stringify(args);
      // eslint-disable-next-line react-hooks/exhaustive-deps
      return useMemo(() => (args === "skip" ? undefined : (store.query(ref, args) as never)), [v, key, ref]);
    },
    useMutation(ref) {
      return useCallback(async (args) => {
        await wait();
        return store.mutate(ref, args) as never;
      }, [ref]);
    },
    useAction(ref) {
      return useCallback(async (args) => {
        await wait();
        return store.act(ref, args) as never;
      }, [ref]);
    },
    useQueryOnce() {
      return useCallback(async (ref, args) => store.query(ref, args) as never, []);
    },
    useAuth() {
      useVersion();
      return {
        isLoading: false,
        isAuthenticated: store.state.session !== null,
        async signIn(email, password) {
          await wait();
          store.signIn(email, password);
        },
        async signOut() {
          store.signOut();
        },
      };
    },
    async upload(_url, file) {
      await wait();
      return store.upload(file);
    },
  };
  return { backend, store };
}
