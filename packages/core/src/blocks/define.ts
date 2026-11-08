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
  /**
   * Quando o bloco `interactive` realmente monta a ilha, dados os campos já resolvidos e
   * os plugins ligados (ex.: o botão de PDF só existe com `showDownload`). Sem ela, monta sempre.
   */
  islandWhen?: (fields: Record<string, unknown>, plugins: ReadonlySet<string>) => boolean;
  /**
   * A ilha só melhora o HTML estático do bloco, que funciona sem ela (ex.: o vídeo vira
   * player no clique; sem JavaScript, é um link para o provedor). A prévia do painel mostra
   * o bloco estático no lugar do aviso de "parte interativa".
   */
  enhances?: boolean;
  /**
   * Regras entre campos ou de formato que o schema não expressa (ex.: endereço de um
   * provedor permitido). Recebe os valores crus, já conferidos campo a campo; vale no
   * backend, no MCP e no painel, porque roda dentro de `validateBlock`.
   */
  validate?: (fields: Record<string, unknown>) => FieldError[];
  /**
   * Campos de exemplo para a vitrine da bateria de tema, por cima dos gerados pelo schema,
   * quando o gerado não passaria na validação (endereços, por exemplo). `mode`: instância
   * cheia ou curta; `instance`: índice da instância (alterna exemplos).
   */
  sample?: (mode: "cheio" | "curto", instance: number) => Record<string, unknown>;
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
  if (def.validate && errors.length === 0) errors.push(...def.validate(block.fields as Record<string, unknown>));
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
