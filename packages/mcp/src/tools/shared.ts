import { randomBytes } from "node:crypto";
import { validateBlock, type BlockDefinition, type BlockInstance } from "@rubrica/core";
import { CORE_BLOCKS } from "@rubrica/core/blocks";
import { RubricaError, type RubricaClient } from "../client";
import { pluginEnabled, type SiteState } from "../state";
import type { JsonSchema } from "../schema/json-schema";
import { ToolInputError, type FieldProblem } from "./types";

export const prop = {
  string: (description: string, extra: JsonSchema = {}): JsonSchema => ({ type: "string", description, ...extra }),
  bool: (description: string): JsonSchema => ({ type: "boolean", description }),
};

/** Blocos que o site aceita agora (tipo do site e plugins ligados). */
export function blocksFor(state: SiteState): BlockDefinition[] {
  const kind = state.settings?.kind;
  return CORE_BLOCKS.filter((b) => {
    if (kind && b.category !== "comum" && b.category !== kind) return false;
    if (b.plugin && state.plugins.length > 0 && !pluginEnabled(state, b.plugin)) return false;
    return true;
  }) as BlockDefinition[];
}

export function newBlockId(type: string): string {
  return `${type}-${randomBytes(3).toString("hex")}`;
}

export interface BlockCheck {
  problems: FieldProblem[];
  warnings: string[];
}

const BLOCK_ID = /^[A-Za-z0-9_-]{1,64}$/;

/** Confere os blocos como o backend vai conferir (validateBlock + tipo, site e plugin). */
export function checkBlocks(blocks: BlockInstance[], state: SiteState): BlockCheck {
  const problems: FieldProblem[] = [];
  const warnings: string[] = [];
  const seen = new Set<string>();
  const allowed = new Set(blocksFor(state).map((b) => b.type));
  for (const block of blocks) {
    const at = (path: string, message: string) => problems.push({ blockId: block.id, path, message });
    if (!BLOCK_ID.test(block.id)) at("id", `id de bloco inválido: "${block.id}"`);
    else if (seen.has(block.id)) at("id", `id de bloco repetido: "${block.id}"`);
    seen.add(block.id);
    const def = CORE_BLOCKS.find((b) => b.type === block.type) as BlockDefinition | undefined;
    if (!def) {
      warnings.push(`Bloco ${block.id}: o tipo "${block.type}" não está no catálogo do núcleo; só o backend confere os campos dele.`);
      continue;
    }
    if (state.settings && !allowed.has(def.type)) {
      at("type", def.plugin && !pluginEnabled(state, def.plugin) ? `o bloco ${def.type} precisa do plugin "${def.plugin}" ligado` : `o bloco ${def.type} é só de sites do tipo ${def.category}`);
      continue;
    }
    for (const e of validateBlock(def, block)) at(e.path, e.message);
  }
  return { problems, warnings };
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
