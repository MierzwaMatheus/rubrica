/**
 * Catálogo de blocos que o MCP usa: o do backend do projeto (núcleo + blocos próprios,
 * `rubrica/pages:blockCatalog`) e, num backend antigo ou sem login, o do núcleo que vem
 * com o MCP (`CORE_BLOCKS`). As definições do backend chegam só com dados; as regras em
 * função (`validate`) dos blocos do núcleo voltam pelo catálogo local, e as dos blocos do
 * projeto ficam com o backend.
 */
import type { BlockDefinition, BlockGuidance, SerializedBlock } from "@rubrica/core";
import { CORE_BLOCKS } from "@rubrica/core/blocks";
import type { RubricaClient } from "./client";

export type BlockOrigin = "nucleo" | "projeto";

export interface CatalogBlock extends BlockDefinition {
  origin: BlockOrigin;
  /** O backend confere regras que o MCP não tem (bloco do projeto com `validate`). */
  backendRules?: boolean;
}

export interface BlockCatalog {
  blocks: CatalogBlock[];
  /** `backend`: o catálogo real do projeto; `nucleo`: o que vem com o MCP (backend antigo ou sem login). */
  source: "backend" | "nucleo";
  /** Versão do contrato de blocos do backend, quando ele informa. */
  contract?: string;
}

const LOCAL = new Map<string, BlockDefinition>((CORE_BLOCKS as readonly BlockDefinition[]).map((b) => [b.type, b]));

export const CORE_CATALOG: BlockCatalog = {
  blocks: (CORE_BLOCKS as readonly BlockDefinition[]).map((b) => ({ ...b, origin: "nucleo" as const })),
  source: "nucleo",
};

type Wire = SerializedBlock & { origin?: BlockOrigin };

/** Definição utilizável a partir da que veio do backend. */
export function fromBackend(data: Wire): CatalogBlock {
  const local = LOCAL.get(data.type);
  const origin: BlockOrigin = data.origin ?? (local ? "nucleo" : "projeto");
  const { customValidation, origin: _o, ...def } = data;
  void _o;
  const block: CatalogBlock = { ...(def as BlockDefinition), origin };
  if (customValidation) {
    if (local?.validate && origin === "nucleo") block.validate = local.validate;
    else block.backendRules = true;
  }
  return block;
}

/** Busca o catálogo no backend; sem a função (versão antiga) ou sem permissão, o do núcleo. */
export async function loadCatalog(client: RubricaClient): Promise<BlockCatalog> {
  try {
    const data = await client.query<{ contract?: string; blocks: Wire[] }>("rubrica/pages:blockCatalog", {});
    if (!data || !Array.isArray(data.blocks) || data.blocks.length === 0) return CORE_CATALOG;
    return { blocks: data.blocks.map(fromBackend), source: "backend", ...(data.contract ? { contract: data.contract } : {}) };
  } catch {
    // Função ausente (backend anterior ao catálogo), sem permissão ou erro: o do núcleo.
    return CORE_CATALOG;
  }
}

export function guidanceText(g: BlockGuidance | undefined): string[] {
  if (!g) return [];
  return [`Quando usar: ${g.use}`, ...(g.avoid ? [`Quando não usar: ${g.avoid}`] : []), ...(g.pairsWith?.length ? [`Combina com: ${g.pairsWith.join(", ")}`] : [])];
}
