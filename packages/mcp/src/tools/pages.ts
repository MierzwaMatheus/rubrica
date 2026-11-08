/** Páginas e blocos. As ferramentas de bloco gravam pelas mutations finas do backend. */
import type { BlockInstance } from "@rubrica/core";
import { anyBlockSchema, localizedSchema, validatorToSchema, type JsonSchema } from "../schema/json-schema";
import { vSeoJson } from "../schema/settings";
import { contentWarnings, diffValues, mergeFields } from "../diff";
import { RubricaError } from "../client";
import { siteLocales } from "../state";
import { assertValid, blocksFor, checkBlocks, filledLocales, pageRefProp, pageSummary, prop, resolvePage, toBlock, type PageDoc } from "./shared";
import { commit, ToolInputError, type ToolDef } from "./types";

const seoSchema = (locales: string[]): JsonSchema =>
  validatorToSchema(vSeoJson as never, {
    locales,
    descriptions: { title: "Título para buscadores (~60 caracteres), por idioma.", description: "Descrição para buscadores (~160 caracteres), por idioma.", noindex: "Esconde a página dos buscadores." },
  });

function titleOf(value: Record<string, string>, locales: string[]): void {
  if (filledLocales(value).length === 0) throw new ToolInputError("title: preencha em pelo menos um idioma", [{ path: "title", message: "obrigatório em pelo menos um idioma" }]);
  const unknown = Object.keys(value).filter((l) => locales.length && !locales.includes(l));
  if (unknown.length) throw new ToolInputError(`title: idioma fora da lista do site (${locales.join(", ")}): ${unknown.join(", ")}`, [{ path: "title", message: "idioma desconhecido" }]);
}

export const pagesTools: ToolDef[] = [
  {
    name: "pages_list",
    title: "Listar páginas",
    description:
      "Lista as páginas do site com caminho, título, publicação, idiomas traduzidos e os blocos (id, tipo, visível). Comece por aqui para editar uma página.",
    access: { permission: "pages" },
    input: () => ({ type: "object", properties: { includeDeleted: prop.bool("Inclui as que estão na lixeira.") }, additionalProperties: false }),
    async handler(args: { includeDeleted?: boolean }, ctx) {
      const pages = await ctx.client.query<PageDoc[]>("rubrica/pages:list", { includeDeleted: args.includeDeleted });
      return { pages: pages.map((p) => pageSummary(p, siteLocales(ctx.state))) };
    },
  },
  {
    name: "pages_get",
    title: "Ler uma página",
    description: "Lê uma página inteira: título, SEO e todos os blocos com os campos (por idioma).",
    access: { permission: "pages" },
    input: () => ({ type: "object", properties: { page: pageRefProp }, required: ["page"], additionalProperties: false }),
    async handler(args: { page: string }, ctx) {
      const page = await resolvePage(ctx.client, args.page);
      return { ...pageSummary(page, siteLocales(ctx.state)), seo: page.seo ?? null, blocks: page.blocks };
    },
  },
  {
    name: "pages_create",
    title: "Criar página",
    description:
      "Cria uma página nova (rascunho, a menos que `published` seja true) com título por idioma e uma lista de blocos. Os blocos são conferidos contra o catálogo antes de gravar. O primeiro bloco `hero` leva o h1 da página.",
    access: { permission: "pages" },
    write: true,
    input: ({ state, typed }) => {
      const locales = siteLocales(state);
      return {
        type: "object",
        properties: {
          path: prop.string('Caminho sem idioma, em minúsculas: "/precos", "/servicos/design". Não use /admin, /blog/<slug> nem prefixos de idioma.', { pattern: "^/([a-z0-9][a-z0-9_-]*(/[a-z0-9][a-z0-9_-]*){0,3})?$" }),
          title: localizedSchema({ locales }, "Título da página (também o nome no painel)."),
          seo: seoSchema(locales),
          blocks: { type: "array", description: "Blocos em ordem.", items: anyBlockSchema(blocksFor(state), { locales }, typed) },
          published: prop.bool("Publica ao criar. Padrão: false (rascunho)."),
        },
        required: ["path", "title"],
        additionalProperties: false,
      };
    },
    async handler(args: { path: string; title: Record<string, string>; seo?: unknown; blocks?: Partial<BlockInstance>[]; published?: boolean }, ctx) {
      const locales = siteLocales(ctx.state);
      titleOf(args.title, locales);
      const blocks = (args.blocks ?? []).map((b) => toBlock(b as never));
      const check = checkBlocks(blocks, ctx.state);
      assertValid(check, "Página inválida");
      const page = { path: args.path, title: args.title, ...(args.seo ? { seo: args.seo } : {}), blocks, published: args.published ?? false };
      return commit(ctx, {
        summary: `Criar a página ${args.path} (${page.published ? "publicada" : "rascunho"}) com ${blocks.length} bloco(s).`,
        changes: diffValues(undefined, { path: page.path, title: page.title, blocks: blocks.map((b) => ({ id: b.id, type: b.type, visible: b.visible })) }, locales),
        warnings: [...check.warnings, ...contentWarnings({ title: page.title, blocks: blocks.map((b) => b.fields) }, locales)],
        info: { blockIds: blocks.map((b) => b.id) },
        apply: async () => ({ id: await ctx.client.mutation<string>("rubrica/pages:create", page) }),
      });
    },
  },
  {
    name: "pages_update",
    title: "Atualizar título, caminho ou SEO",
    description: "Muda o título (mescla por idioma), o caminho ou o SEO de uma página. Não mexe nos blocos (use block_*). Páginas do sistema (home, sobre) não mudam de caminho.",
    access: { permission: "pages" },
    write: true,
    input: ({ state }) => {
      const locales = siteLocales(state);
      return {
        type: "object",
        properties: {
          page: pageRefProp,
          title: localizedSchema({ locales }, "Título novo. Idiomas não citados continuam como estão."),
          path: prop.string("Caminho novo (muda a URL: avise quem tem links)."),
          seo: seoSchema(locales),
          clearSeo: prop.bool("Apaga o SEO da página."),
        },
        required: ["page"],
        additionalProperties: false,
      };
    },
    async handler(args: { page: string; title?: Record<string, string>; path?: string; seo?: Record<string, unknown>; clearSeo?: boolean }, ctx) {
      const locales = siteLocales(ctx.state);
      const page = await resolvePage(ctx.client, args.page);
      const mutation: Record<string, unknown> = { id: page._id };
      const before: Record<string, unknown> = {};
      const after: Record<string, unknown> = {};
      if (args.title) {
        const merged = mergeFields({ title: page.title }, { title: args.title }, locales).title as Record<string, string>;
        titleOf(merged, locales);
        mutation.title = merged;
        before.title = page.title;
        after.title = merged;
      }
      if (args.path !== undefined && args.path !== page.path) {
        mutation.path = args.path;
        before.path = page.path;
        after.path = args.path;
      }
      if (args.seo) {
        mutation.seo = mergeFields({ seo: page.seo ?? {} }, { seo: args.seo }, locales).seo;
        before.seo = page.seo;
        after.seo = mutation.seo;
      }
      if (args.clearSeo) {
        mutation.clearSeo = true;
        before.seo = page.seo;
        after.seo = undefined;
      }
      const changes = diffValues(before, after, locales);
      return commit(ctx, {
        summary: `Atualizar a página ${page.path}.`,
        changes,
        warnings: contentWarnings(after, locales),
        apply: async () => {
          if (changes.length) await ctx.client.mutation("rubrica/pages:update", mutation);
        },
      });
    },
  },
  {
    name: "pages_set_published",
    title: "Publicar ou despublicar página",
    description: "Publica a página (entra no site no próximo rebuild) ou volta para rascunho.",
    access: { permission: "pages" },
    write: true,
    input: () => ({
      type: "object",
      properties: { page: pageRefProp, published: { type: "boolean", default: true, description: "true publica; false despublica." } },
      required: ["page"],
      additionalProperties: false,
    }),
    async handler(args: { page: string; published?: boolean }, ctx) {
      const page = await resolvePage(ctx.client, args.page);
      const published = args.published ?? true;
      const warnings: string[] = [];
      if (published && page.blocks.length === 0) warnings.push("A página não tem blocos.");
      if (published && !page.blocks.some((b) => b.visible)) warnings.push("Nenhum bloco visível: a página sairia vazia.");
      return commit(ctx, {
        summary: `${published ? "Publicar" : "Despublicar"} a página ${page.path}.`,
        changes: diffValues({ published: page.published }, { published }),
        warnings,
        apply: async () => {
          if (page.published !== published) await ctx.client.mutation(published ? "rubrica/pages:publish" : "rubrica/pages:unpublish", { id: page._id });
        },
      });
    },
  },
  {
    name: "pages_remove",
    title: "Mandar página para a lixeira",
    description: "Move a página para a lixeira (só a agência/root restaura). Páginas do sistema não podem ser apagadas.",
    access: { permission: "pages" },
    write: true,
    destructive: true,
    input: () => ({ type: "object", properties: { page: pageRefProp }, required: ["page"], additionalProperties: false }),
    async handler(args: { page: string }, ctx) {
      const page = await resolvePage(ctx.client, args.page);
      if (page.system) throw new RubricaError("Páginas do sistema podem ser editadas, não apagadas.", "validation");
      return commit(ctx, {
        summary: `Mandar a página ${page.path} (${page.blocks.length} bloco(s)) para a lixeira. Só root restaura.`,
        info: { page: pageSummary(page, siteLocales(ctx.state)) },
        apply: async () => {
          await ctx.client.mutation("rubrica/pages:remove", { id: page._id });
        },
      });
    },
  },

  // ── Blocos ────────────────────────────────────────────────────────────────
  {
    name: "block_add",
    title: "Adicionar bloco",
    description:
      "Acrescenta um bloco a uma página, na posição pedida (padrão: no fim). Os campos são conferidos com o schema do bloco (veja blocks_catalog). Textos vão por idioma: conteúdo sem tradução não aparece no idioma.",
    access: { permission: "pages" },
    write: true,
    input: ({ state, typed }) => ({
      type: "object",
      properties: {
        page: pageRefProp,
        block: anyBlockSchema(blocksFor(state), { locales: siteLocales(state) }, typed),
        index: { type: "integer", minimum: 0, description: "Posição (0 = primeiro). Padrão: no fim." },
      },
      required: ["page", "block"],
      additionalProperties: false,
    }),
    async handler(args: { page: string; block: Partial<BlockInstance> & { type: string }; index?: number }, ctx) {
      const locales = siteLocales(ctx.state);
      const page = await resolvePage(ctx.client, args.page);
      const block = toBlock(args.block);
      if (page.blocks.some((b) => b.id === block.id)) throw new ToolInputError(`Já existe um bloco ${block.id} nesta página. Para mudar, use block_update_fields.`);
      const check = checkBlocks([block], ctx.state);
      assertValid(check);
      const index = Math.min(args.index ?? page.blocks.length, page.blocks.length);
      return commit(ctx, {
        summary: `Adicionar o bloco ${block.type} (${block.id}) na posição ${index} de ${page.path}.`,
        changes: diffValues(undefined, { block }, locales),
        warnings: [...check.warnings, ...contentWarnings(block.fields, locales, "fields")],
        info: { blockId: block.id },
        apply: async () => {
          await ctx.client.mutation("rubrica/pages:upsertBlock", { id: page._id, block, index });
          return { blockId: block.id };
        },
      });
    },
  },
  {
    name: "block_update_fields",
    title: "Atualizar campos de um bloco",
    description:
      "Muda campos de um bloco existente. Só os campos citados mudam; um texto por idioma é mesclado (mandar só {en: ...} não apaga o pt-BR; use replaceLocales para trocar o texto inteiro). Listas e imagens são trocadas inteiras. `unset` apaga campos opcionais.",
    access: { permission: "pages" },
    write: true,
    input: ({ state }) => ({
      type: "object",
      properties: {
        page: pageRefProp,
        blockId: prop.string("Id do bloco (de pages_get)."),
        fields: { type: "object", description: "Campos a mudar, no formato do bloco (blocks_catalog mostra o schema do tipo). Só os citados." },
        unset: { type: "array", items: { type: "string" }, description: "Campos opcionais a apagar." },
        variant: prop.string("Variação do tema. \"\" volta à padrão."),
        source: { type: "object", description: "Troca a consulta da coleção do bloco (collection, ids, featured, tags, limit, sort)." },
        replaceLocales: prop.bool(`Troca os textos por idioma inteiros em vez de mesclar. Idiomas do site: ${siteLocales(state).join(", ") || "veja whoami"}.`),
      },
      required: ["page", "blockId"],
      additionalProperties: false,
    }),
    async handler(
      args: { page: string; blockId: string; fields?: Record<string, unknown>; unset?: string[]; variant?: string; source?: BlockInstance["source"]; replaceLocales?: boolean },
      ctx,
    ) {
      const locales = siteLocales(ctx.state);
      const page = await resolvePage(ctx.client, args.page);
      const current = page.blocks.find((b) => b.id === args.blockId);
      if (!current) throw new RubricaError(`Bloco não encontrado: ${args.blockId}. Blocos da página: ${page.blocks.map((b) => b.id).join(", ") || "(nenhum)"}`, "validation");
      let fields = mergeFields(current.fields, args.fields ?? {}, locales, args.replaceLocales);
      for (const key of args.unset ?? []) {
        if (key in (args.fields ?? {})) throw new ToolInputError(`O campo "${key}" está em fields e em unset.`);
        delete fields[key];
      }
      fields = { ...fields };
      const next: BlockInstance = {
        ...current,
        fields,
        ...(args.variant !== undefined ? (args.variant ? { variant: args.variant } : { variant: undefined }) : {}),
        ...(args.source ? { source: args.source } : {}),
      };
      if (next.variant === undefined) delete next.variant;
      const check = checkBlocks([next], ctx.state);
      assertValid(check);
      const changes = diffValues({ fields: current.fields, variant: current.variant, source: current.source }, { fields: next.fields, variant: next.variant, source: next.source }, locales);
      return commit(ctx, {
        summary: `Atualizar o bloco ${current.type} (${current.id}) de ${page.path}: ${changes.length} mudança(s).`,
        changes,
        warnings: [...check.warnings, ...contentWarnings(next.fields, locales, "fields")],
        apply: async () => {
          if (changes.length) await ctx.client.mutation("rubrica/pages:upsertBlock", { id: page._id, block: next });
        },
      });
    },
  },
  {
    name: "block_move",
    title: "Mover bloco",
    description: "Muda a posição de um bloco na página (0 = primeiro). A ordem dos outros se mantém.",
    access: { permission: "pages" },
    write: true,
    input: () => ({
      type: "object",
      properties: { page: pageRefProp, blockId: prop.string("Id do bloco."), toIndex: { type: "integer", minimum: 0, description: "Nova posição (0 = primeiro)." } },
      required: ["page", "blockId", "toIndex"],
      additionalProperties: false,
    }),
    async handler(args: { page: string; blockId: string; toIndex: number }, ctx) {
      const page = await resolvePage(ctx.client, args.page);
      const from = page.blocks.findIndex((b) => b.id === args.blockId);
      if (from < 0) throw new RubricaError(`Bloco não encontrado: ${args.blockId}`, "validation");
      const ids = page.blocks.map((b) => b.id);
      ids.splice(from, 1);
      ids.splice(Math.min(args.toIndex, ids.length), 0, args.blockId);
      const same = ids.every((id, i) => id === page.blocks[i]!.id);
      return commit(ctx, {
        summary: same ? "O bloco já está nessa posição." : `Mover o bloco ${args.blockId} de ${from} para ${ids.indexOf(args.blockId)} em ${page.path}.`,
        info: { order: { before: page.blocks.map((b) => b.id), after: ids } },
        changes: same ? [] : [{ path: "blocks.order", op: "change", before: page.blocks.map((b) => b.id), after: ids }],
        warnings: ids[0] !== args.blockId && page.blocks[0]?.type === "hero" && ids[0] !== page.blocks[0].id ? ["O hero deixaria de ser o primeiro bloco: o h1 da página passa a ser oculto."] : [],
        apply: async () => {
          if (!same) await ctx.client.mutation("rubrica/pages:reorderBlocks", { id: page._id, blockIds: ids });
        },
      });
    },
  },
  {
    name: "block_set_visible",
    title: "Ocultar ou mostrar bloco",
    description: "Liga ou desliga um bloco sem apagar (bloco oculto não vai ao site, mas o conteúdo fica).",
    access: { permission: "pages" },
    write: true,
    input: () => ({
      type: "object",
      properties: { page: pageRefProp, blockId: prop.string("Id do bloco."), visible: { type: "boolean", description: "true mostra; false oculta." } },
      required: ["page", "blockId", "visible"],
      additionalProperties: false,
    }),
    async handler(args: { page: string; blockId: string; visible: boolean }, ctx) {
      const page = await resolvePage(ctx.client, args.page);
      const block = page.blocks.find((b) => b.id === args.blockId);
      if (!block) throw new RubricaError(`Bloco não encontrado: ${args.blockId}`, "validation");
      return commit(ctx, {
        summary: `${args.visible ? "Mostrar" : "Ocultar"} o bloco ${block.type} (${block.id}) em ${page.path}.`,
        changes: diffValues({ visible: block.visible }, { visible: args.visible }),
        apply: async () => {
          if (block.visible !== args.visible) await ctx.client.mutation("rubrica/pages:setBlockVisible", { id: page._id, blockId: block.id, visible: args.visible });
        },
      });
    },
  },
  {
    name: "block_remove",
    title: "Remover bloco",
    description: "Apaga um bloco da página (não há lixeira para blocos: para só tirar do site, use block_set_visible).",
    access: { permission: "pages" },
    write: true,
    destructive: true,
    input: () => ({
      type: "object",
      properties: { page: pageRefProp, blockId: prop.string("Id do bloco.") },
      required: ["page", "blockId"],
      additionalProperties: false,
    }),
    async handler(args: { page: string; blockId: string }, ctx) {
      const page = await resolvePage(ctx.client, args.page);
      const block = page.blocks.find((b) => b.id === args.blockId);
      if (!block) throw new RubricaError(`Bloco não encontrado: ${args.blockId}`, "validation");
      return commit(ctx, {
        summary: `Remover o bloco ${block.type} (${block.id}) de ${page.path}. Sem desfazer.`,
        info: { removed: block },
        warnings: block.type === "hero" ? ["Remover o hero tira o h1 da página (o núcleo põe um h1 oculto)."] : [],
        apply: async () => {
          await ctx.client.mutation("rubrica/pages:removeBlock", { id: page._id, blockId: block.id });
        },
      });
    },
  },
];
