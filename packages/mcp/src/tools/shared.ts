import { randomBytes } from "node:crypto";
import { blockAllowedIn, sectionsToBlocks, validateBlock, type BlockContext, type BlockInstance, type VariantOption } from "@rubrica/core";
import { can } from "@rubrica/core/convex/roles";
import type { CatalogBlock } from "../catalog";
import { RubricaError, type RubricaClient } from "../client";
import { pluginEnabled, type SiteState } from "../state";
import { themeVariants } from "../theme";
import type { JsonSchema } from "../schema/json-schema";
import { ToolInputError, type FieldProblem, type ToolContext } from "./types";

export const prop = {
  string: (description: string, extra: JsonSchema = {}): JsonSchema => ({ type: "string", description, ...extra }),
  bool: (description: string): JsonSchema => ({ type: "boolean", description }),
};

/** Blocos que o site aceita agora (catálogo do backend, tipo do site e plugins ligados). */
export function blocksFor(state: SiteState, context?: BlockContext): CatalogBlock[] {
  const kind = state.settings?.kind;
  return state.catalog.blocks.filter((b) => {
    if (context && !blockAllowedIn(b, context)) return false;
    if (kind && b.category !== "comum" && b.category !== kind) return false;
    if (b.plugin && state.plugins.length > 0 && !pluginEnabled(state, b.plugin)) return false;
    return true;
  });
}

/** Definição de um tipo no catálogo do site (sem filtrar por tipo de site ou plugin). */
export function findBlock(state: SiteState, type: string): CatalogBlock | undefined {
  return state.catalog.blocks.find((b) => b.type === type);
}

/** Variações do bloco no tema instalado (a primeira é a padrão). */
export function variantsOf(state: SiteState, type: string): VariantOption[] {
  return themeVariants(state.theme, type);
}

export function variantList(options: readonly VariantOption[]): string {
  return options.map((o, i) => `${o.value} (${o.label}${i === 0 ? ", padrão" : ""})`).join(", ");
}

const themeName = (state: SiteState) => state.theme.label ?? state.theme.id;

export function newBlockId(type: string): string {
  return `${type}-${randomBytes(3).toString("hex")}`;
}

export interface BlockCheck {
  problems: FieldProblem[];
  warnings: string[];
}

const BLOCK_ID = /^[A-Za-z0-9_-]{1,64}$/;

/** Confere os blocos como o backend vai conferir (validateBlock + tipo, site e plugin). */
export function checkBlocks(blocks: BlockInstance[], state: SiteState, context: BlockContext = "page"): BlockCheck {
  const problems: FieldProblem[] = [];
  const warnings: string[] = [];
  const seen = new Set<string>();
  const allowed = new Set(blocksFor(state).map((b) => b.type));
  for (const block of blocks) {
    const at = (path: string, message: string) => problems.push({ blockId: block.id, path, message });
    if (!BLOCK_ID.test(block.id)) at("id", `id de bloco inválido: "${block.id}"`);
    else if (seen.has(block.id)) at("id", `id de bloco repetido: "${block.id}"`);
    seen.add(block.id);
    const def = findBlock(state, block.type);
    if (!def) {
      if (state.catalog.source === "backend") at("type", `tipo de bloco desconhecido: "${block.type}". Tipos do site: ${blocksFor(state).map((b) => b.type).join(", ")}`);
      else warnings.push(`Bloco ${block.id}: o tipo "${block.type}" não está no catálogo do núcleo; só o backend confere os campos dele.`);
      continue;
    }
    if (!blockAllowedIn(def, context)) {
      at("type", context === "case" ? `o bloco ${def.type} só vale em páginas, não no corpo de um case (o case já tem título e capa do template). Veja blocks_catalog com context "case".` : `o bloco ${def.type} só vale no corpo de um case, não em páginas`);
      continue;
    }
    if (state.settings && !allowed.has(def.type)) {
      at("type", def.plugin && !pluginEnabled(state, def.plugin) ? `o bloco ${def.type} precisa do plugin "${def.plugin}" ligado` : `o bloco ${def.type} é só de sites do tipo ${def.category}`);
      continue;
    }
    if (block.variant !== undefined) {
      const options = variantsOf(state, def.type);
      const known = options.some((o) => o.value === block.variant);
      if (!known) {
        const message = options.length
          ? `a variação "${block.variant}" não existe no tema ${themeName(state)} para o bloco ${def.type}. Válidas: ${variantList(options)}`
          : `o bloco ${def.type} não tem variações no tema ${themeName(state)}; tire o "variant"`;
        // Sem ler o tema, não dá para ter certeza: o site cai na variação padrão.
        if (state.theme.source === "tema") at("variant", message);
        else warnings.push(`Bloco ${block.id}: ${message} (lista do núcleo: o tema não pôde ser lido; o site usa a padrão se ela não existir).`);
      }
    }
    for (const e of validateBlock(def, block)) at(e.path, e.message);
    if (def.backendRules) warnings.push(`Bloco ${block.id} (${def.type}): o projeto tem regras próprias para este bloco; o backend confere ao gravar.`);
  }
  return { problems, warnings };
}

/**
 * Blocos do projeto com regras próprias (`validate` em função) só o backend sabe conferir:
 * a prévia pergunta a ele (`rubrica/panel:validatePage`, sem gravar). Num backend sem essa
 * função, fica o aviso de `checkBlocks` e a validação acontece ao gravar.
 */
export async function checkWithBackend(client: RubricaClient, blocks: BlockInstance[], state: SiteState, check: BlockCheck, context: BlockContext = "page"): Promise<BlockCheck> {
  if (check.problems.length || !blocks.some((b) => findBlock(state, b.type)?.backendRules)) return check;
  try {
    const res = await client.query<{ blockErrors: { blockId?: string; path: string; message: string }[] }>(context === "case" ? BACKEND.validateProjectBlocks : "rubrica/panel:validatePage", { blocks });
    const problems = res.blockErrors.map((e) => ({ ...(e.blockId ? { blockId: e.blockId } : {}), path: e.path, message: e.message }));
    return { problems, warnings: check.warnings.filter((w) => !w.includes("o backend confere ao gravar")) };
  } catch {
    return check;
  }
}

export function assertValid(check: BlockCheck, what = "Blocos inválidos"): void {
  if (check.problems.length) {
    const first = check.problems.slice(0, 3).map((p) => `${p.blockId ? `[${p.blockId}] ` : ""}${p.path ? `${p.path}: ` : ""}${p.message}`);
    throw new ToolInputError(`${what}: ${first.join("; ")}${check.problems.length > 3 ? ` (+${check.problems.length - 3})` : ""}`, check.problems);
  }
}

/** Instância completa a partir do que o agente mandou. */
export function toBlock(input: Partial<BlockInstance> & { type: string }): BlockInstance {
  return {
    id: input.id ?? newBlockId(input.type),
    type: input.type,
    visible: input.visible ?? true,
    fields: (input.fields as Record<string, unknown>) ?? {},
    ...(input.variant ? { variant: input.variant } : {}),
    ...(input.source ? { source: input.source } : {}),
  };
}

export interface PageDoc {
  _id: string;
  path: string;
  title: Record<string, string>;
  seo?: Record<string, unknown>;
  blocks: BlockInstance[];
  published: boolean;
  system?: boolean;
  updatedAt: number;
  deletedAt?: number;
}

/** `ref`: caminho ("/sobre") ou id da página. */
export async function resolvePage(client: RubricaClient, ref: string): Promise<PageDoc> {
  const page = ref.startsWith("/")
    ? await client.query<PageDoc | null>("rubrica/pages:getByPath", { path: ref })
    : await client.query<PageDoc | null>("rubrica/pages:get", { id: ref }).catch((e) => {
        if (e instanceof RubricaError && /ID|id/.test(e.message)) return null;
        throw e;
      });
  if (!page) throw new RubricaError(`Página não encontrada: ${ref}. Use pages_list para ver os caminhos e ids.`, "validation");
  return page;
}

export function filledLocales(value: Record<string, string> | undefined): string[] {
  return Object.entries(value ?? {})
    .filter(([, t]) => typeof t === "string" && t.trim())
    .map(([l]) => l);
}

export function pageSummary(page: PageDoc, locales: readonly string[]) {
  const have = filledLocales(page.title);
  return {
    id: page._id,
    path: page.path,
    title: page.title,
    published: page.published,
    ...(page.system ? { system: true } : {}),
    ...(page.deletedAt ? { deleted: true } : {}),
    blocks: page.blocks.map((b) => ({ id: b.id, type: b.type, visible: b.visible })),
    languages: have,
    ...(locales.length > 1 && have.length < locales.length ? { missingLanguages: locales.filter((l) => !have.includes(l)) } : {}),
    updatedAt: page.updatedAt,
  };
}

export const pageRefProp = prop.string('Página: caminho ("/", "/sobre") ou id (de pages_list).');


// ── Alvo dos blocos: página ou case ──────────────────────────────────────────

/**
 * Funções do backend para os blocos de um case (contrato da 2.3.0). Os argumentos espelham
 * os das páginas (`rubrica/pages:upsertBlock` etc.), com `projectId` no lugar de `id`.
 * Se o backend usar outros nomes, troque só aqui.
 */
export const BACKEND = {
  upsertProjectBlock: "rubrica/collections:upsertProjectBlock",
  reorderProjectBlocks: "rubrica/collections:reorderProjectBlocks",
  setProjectBlockVisible: "rubrica/collections:setProjectBlockVisible",
  removeProjectBlock: "rubrica/collections:removeProjectBlock",
  validateProjectBlocks: "rubrica/panel:validateProjectBlocks",
  /** Nome do argumento que leva o id do projeto nas mutations de bloco. */
  projectIdArg: "projectId",
} as const;

export interface ProjectDoc {
  _id: string;
  slug?: string;
  title: Record<string, string>;
  blocks?: BlockInstance[];
  published?: boolean;
  deletedAt?: number;
}

/** Onde os blocos moram: uma página (`context` page) ou o corpo de um case (`case`). */
export interface BlockTarget {
  kind: "page" | "project";
  context: BlockContext;
  id: string;
  /** Como a prévia chama o alvo: "/sobre" ou "o case meu-projeto". */
  label: string;
  blocks: BlockInstance[];
  /** Grava pelo backend (ações: upsert, reorder, visible, remove). */
  write(client: RubricaClient, op: "upsert" | "reorder" | "visible" | "remove", args: Record<string, unknown>): Promise<unknown>;
  /** Nome para mensagens de erro ("Blocos da página"). */
  blocksOf: string;
}

export const targetProps = {
  page: prop.string('Página: caminho ("/", "/sobre") ou id (de pages_list). Informe `page` OU `project`.'),
  project: prop.string("Case: slug ou id do projeto (de projects_list). O corpo do case é em blocos, como o de uma página. Informe `page` OU `project`."),
};

const PAGE_FN = { upsert: "rubrica/pages:upsertBlock", reorder: "rubrica/pages:reorderBlocks", visible: "rubrica/pages:setBlockVisible", remove: "rubrica/pages:removeBlock" } as const;
const PROJECT_FN = { upsert: BACKEND.upsertProjectBlock, reorder: BACKEND.reorderProjectBlocks, visible: BACKEND.setProjectBlockVisible, remove: BACKEND.removeProjectBlock } as const;

/** `ref`: slug ou id do projeto. */
export async function resolveProject(client: RubricaClient, ref: string): Promise<ProjectDoc> {
  let found: ProjectDoc | null = null;
  try {
    found = await client.query<ProjectDoc | null>("rubrica/projects:get", { id: ref });
  } catch (e) {
    if (!(e instanceof RubricaError && /ID|id/.test(e.message))) throw e;
  }
  if (!found) found = (await client.query<ProjectDoc[]>("rubrica/projects:list", {})).find((p) => p.slug === ref) ?? null;
  if (!found) throw new RubricaError(`Projeto não encontrado: ${ref}. Use projects_list para ver os slugs e ids.`, "validation");
  return found;
}

/** Resolve o alvo das ferramentas de bloco: `page` (padrão, retrocompatível) ou `project`. */
export async function resolveBlockTarget(ctx: ToolContext, args: { page?: string; project?: string }): Promise<BlockTarget> {
  if (args.page && args.project) throw new ToolInputError("Informe `page` OU `project`, não os dois.");
  if (!args.page && !args.project) throw new ToolInputError("Informe `page` (página) ou `project` (case).");
  if (args.page) {
    if (!can(ctx.state.me?.role, "pages")) throw new RubricaError("O seu papel não pode mexer em páginas.", "forbidden");
    const page = await resolvePage(ctx.client, args.page);
    return {
      kind: "page",
      context: "page",
      id: page._id,
      label: page.path,
      blocks: page.blocks,
      blocksOf: "Blocos da página",
      write: (client, op, a) => client.mutation(PAGE_FN[op], { id: page._id, ...a }),
    };
  }
  const role = ctx.state.me?.role;
  if (!can(role, "content")) throw new RubricaError("O seu papel não pode mexer em projetos e cases.", "forbidden");
  if (!pluginEnabled(ctx.state, "portfolio")) throw new RubricaError('Projetos e cases: o plugin "portfolio" está desligado.', "validation");
  const project = await resolveProject(ctx.client, args.project!);
  if (project.deletedAt) throw new RubricaError("O projeto está na lixeira.", "validation");
  return {
    kind: "project",
    context: "case",
    id: project._id,
    label: `o case ${project.slug ?? project._id}`,
    // Projeto ainda no formato antigo: o corpo chega convertido, como o backend grava.
    blocks: sectionsToBlocks(project as never),
    blocksOf: "Blocos do case",
    write: (client, op, a) => client.mutation(PROJECT_FN[op], { [BACKEND.projectIdArg]: project._id, ...a }),
  };
}
