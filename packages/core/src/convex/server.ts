/**
 * Construtores de funções tipados com as tabelas do núcleo. O pacote não enxerga o
 * `convex/_generated` do projeto, então usa os construtores genéricos do Convex com o
 * `DataModel` montado aqui a partir de `rubricaTables` + `authTables`.
 */
import {
  actionGeneric,
  defineSchema,
  httpActionGeneric,
  internalActionGeneric,
  internalMutationGeneric,
  internalQueryGeneric,
  makeFunctionReference,
  mutationGeneric,
  queryGeneric,
  type ActionBuilder,
  type DataModelFromSchemaDefinition,
  type DocumentByName,
  type FunctionType,
  type GenericActionCtx,
  type GenericMutationCtx,
  type GenericQueryCtx,
  type HttpActionBuilder,
  type MutationBuilder,
  type QueryBuilder,
  type TableNamesInDataModel,
} from "convex/server";
import type { GenericId } from "convex/values";
import { authTables } from "@convex-dev/auth/server";
import { rubricaTables } from "./schema";

const schema = defineSchema({ ...authTables, ...rubricaTables });

export type DataModel = DataModelFromSchemaDefinition<typeof schema>;
export type TableName = TableNamesInDataModel<DataModel>;
export type Doc<T extends TableName> = DocumentByName<DataModel, T>;
export type Id<T extends TableName | "_storage"> = GenericId<T>;

export type QueryCtx = GenericQueryCtx<DataModel>;
export type MutationCtx = GenericMutationCtx<DataModel>;
export type ActionCtx = GenericActionCtx<DataModel>;
export type ReaderCtx = QueryCtx | MutationCtx;

export const query = queryGeneric as QueryBuilder<DataModel, "public">;
export const internalQuery = internalQueryGeneric as QueryBuilder<DataModel, "internal">;
export const mutation = mutationGeneric as MutationBuilder<DataModel, "public">;
export const internalMutation = internalMutationGeneric as MutationBuilder<DataModel, "internal">;
export const action = actionGeneric as ActionBuilder<DataModel, "public">;
export const internalAction = internalActionGeneric as ActionBuilder<DataModel, "internal">;
export const httpAction = httpActionGeneric as HttpActionBuilder;

/**
 * Pasta do `convex/` do projeto onde ficam os arquivos de reexportação do núcleo
 * (`convex/rubrica/<módulo>.ts`, gerados pelo CLI). As funções que chamam outras
 * funções do núcleo (actions, crons, a fonte do build) usam esse caminho.
 */
export const MODULE_DIR = "rubrica";

/** Referência a uma função do núcleo: `ref("mutation", "users", "assignRoleInternal")`. */
export function ref<T extends FunctionType, Args extends Record<string, unknown> = Record<string, unknown>, Return = unknown>(
  _type: T,
  module: string,
  name: string,
) {
  return makeFunctionReference<T, Args, Return>(`${MODULE_DIR}/${module}:${name}`);
}
