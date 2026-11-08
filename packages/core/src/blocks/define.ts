import type { CollectionName, CollectionQuery, SiteKind } from "../content/types";
import { validateFields, type FieldError, type FieldMap } from "./fields";

export type BlockCategory = "comum" | SiteKind;

export interface BlockDefinition<M extends FieldMap = FieldMap> {
  /** Identificador estável, em kebab-case. Mudar é quebra de contrato (major). */
  type: string;
  /** Nome no catálogo do painel. */
  label: string;
  description: string;
  /** `comum` aparece nos dois tipos de site; `pessoal`/`empresa` só no seu. */
  category: BlockCategory;
  fields: M;
  /** Blocos que listam itens de uma coleção (decisão 12). */
  source?: {
    collections: readonly CollectionName[];
    /** Consulta usada quando o bloco é criado. */
    default: CollectionQuery;
  };
  /** Plugin que precisa estar ligado para o bloco aparecer (ex.: `blog`). */
  plugin?: string;
  /**
   * A versão padrão precisa de JavaScript no navegador (vira ilha). Temas podem
   * desenhar a sua versão estática.
   */
  interactive?: boolean;
}

export function defineBlock<const M extends FieldMap>(def: BlockDefinition<M>): BlockDefinition<M> {
  if (!/^[a-z][a-z0-9-]*$/.test(def.type)) throw new Error(`[rubrica] tipo de bloco inválido: "${def.type}"`);
  if (def.source && !def.source.collections.includes(def.source.default.collection)) {
    throw new Error(`[rubrica] bloco ${def.type}: a coleção padrão não está entre as permitidas`);
  }
  return def;
}

export interface BlockValidationError extends FieldError {
  blockId?: string;
}

/** Valida campos e fonte de um bloco contra a definição. */
export function validateBlock(
  def: BlockDefinition,
  block: { id?: string; fields: unknown; source?: CollectionQuery },
): BlockValidationError[] {
  const errors: BlockValidationError[] = validateFields(def.fields, block.fields);
  if (block.source) {
    if (!def.source) errors.push({ path: "source", message: `o bloco ${def.type} não lista coleções` });
    else if (!def.source.collections.includes(block.source.collection)) {
      errors.push({ path: "source.collection", message: `coleção não permitida em ${def.type}: ${block.source.collection}` });
    }
    if (block.source.limit !== undefined && (!Number.isInteger(block.source.limit) || block.source.limit < 1)) {
      errors.push({ path: "source.limit", message: "a quantidade deve ser um inteiro positivo" });
    }
  }
  return block.id ? errors.map((e) => ({ ...e, blockId: block.id })) : errors;
}
