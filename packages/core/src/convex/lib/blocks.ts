/**
 * Validação das páginas antes de gravar: cada bloco é conferido contra o catálogo
 * (núcleo + blocos do projeto) com `validateBlock`, e o tipo precisa existir, valer
 * para o tipo do site e ter o plugin ligado.
 */
import { validateBlock, type BlockDefinition } from "../../blocks/define";
import type { BlockInstance, SiteKind } from "../../content/types";
import { sanitizeFields } from "./sanitize";

export interface BlockCatalog {
  blocks: readonly BlockDefinition[];
  kind: SiteKind;
  enabledPlugins: ReadonlySet<string>;
}

export interface PageBlockError {
  index: number;
  blockId?: string;
  path: string;
  message: string;
}

const BLOCK_ID = /^[A-Za-z0-9_-]{1,64}$/;

export function findBlock(catalog: BlockCatalog, type: string): BlockDefinition | undefined {
  return catalog.blocks.find((b) => b.type === type);
}

/** Erros da lista de blocos. Lista vazia = válida. */
export function validatePageBlocks(blocks: BlockInstance[], catalog: BlockCatalog): PageBlockError[] {
  const errors: PageBlockError[] = [];
  const seen = new Set<string>();
  blocks.forEach((block, index) => {
    const at = (path: string, message: string) => errors.push({ index, blockId: block.id, path, message });
    if (!BLOCK_ID.test(block.id)) at("id", `id de bloco inválido: "${block.id}"`);
    else if (seen.has(block.id)) at("id", `id de bloco repetido: "${block.id}"`);
    seen.add(block.id);

    const def = findBlock(catalog, block.type);
    if (!def) return at("type", `tipo de bloco desconhecido: "${block.type}"`);
    if (def.category !== "comum" && def.category !== catalog.kind) {
      return at("type", `o bloco ${def.type} é só de sites do tipo ${def.category}`);
    }
    if (def.plugin && !catalog.enabledPlugins.has(def.plugin)) {
      return at("type", `o bloco ${def.type} precisa do plugin "${def.plugin}" ligado`);
    }
    for (const e of validateBlock(def, block)) at(e.path, e.message);
  });
  return errors;
}

export function formatBlockErrors(errors: PageBlockError[]): string {
  return errors
    .map((e) => `bloco ${e.index + 1}${e.blockId ? ` (${e.blockId})` : ""}${e.path ? ` ${e.path}` : ""}: ${e.message}`)
    .join("; ");
}

/** Valida e devolve os blocos com o HTML dos campos `richText` sanitizado. Lança se houver erro. */
export function preparePageBlocks(blocks: BlockInstance[], catalog: BlockCatalog): BlockInstance[] {
  const errors = validatePageBlocks(blocks, catalog);
  if (errors.length) throw new Error(`Página inválida: ${formatBlockErrors(errors)}`);
  return blocks.map((block) => {
    const def = findBlock(catalog, block.type)!;
    return { ...block, fields: sanitizeFields(def.fields, block.fields) };
  });
}

/** Caminhos que não podem ser páginas: o painel, as rotas internas e as do app. */
const RESERVED = ["/admin", "/api", "/_rubrica", "/_astro", "/proposta", "/checkout", "/payment-success"];
const PATH_SEGMENT = /^[a-z0-9][a-z0-9_-]*$/;

/**
 * Caminho de página sem idioma: "/" ou "/sobre", "/servicos/design".
 * `reserved`: caminhos proibidos, com tudo abaixo deles (prefixos de idioma).
 * `detailBases`: bases das páginas de detalhe (`/blog`, `/portfolio`): a base pode
 * ser página (a lista), o que fica abaixo é do núcleo (`/blog/<slug>`).
 */
export function assertValidPagePath(path: string, reserved: readonly string[] = [], detailBases: readonly string[] = []): void {
  if (path === "/") return;
  if (!path.startsWith("/") || path.endsWith("/")) throw new Error(`Caminho inválido: "${path}". Use "/" ou "/nome-da-pagina".`);
  const segments = path.slice(1).split("/");
  if (segments.length > 4 || segments.some((s) => !PATH_SEGMENT.test(s))) {
    throw new Error(`Caminho inválido: "${path}". Use letras minúsculas, números e hífens.`);
  }
  for (const r of [...RESERVED, ...reserved]) {
    if (path === r || path.startsWith(`${r}/`)) throw new Error(`O caminho "${path}" é reservado`);
  }
  for (const base of detailBases) {
    if (path.startsWith(`${base}/`)) throw new Error(`O caminho "${path}" é reservado para as páginas de ${base}`);
  }
}
