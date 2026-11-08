/**
 * Confere um documento contra o validador de uma tabela do schema da v2 (a forma JSON
 * que o `convex/values` expõe em `defineTable(...).validator.json`). O `npx convex import`
 * recusa documentos fora do schema; este teste pega isso antes, sem Convex.
 */
import { rubricaTables } from "@rubrica/core/convex/schema";

type Json = Record<string, any>;

function check(value: unknown, type: Json, path: string, errors: string[]): void {
  const fail = (what: string): void => void errors.push(`${path || "(raiz)"}: ${what} (veio ${JSON.stringify(value)?.slice(0, 80)})`);
  switch (type.type) {
    case "any":
      return;
    case "null":
      if (value !== null) fail("esperava null");
      return;
    case "string":
      if (typeof value !== "string") fail("esperava texto");
      return;
    case "id":
      if (typeof value !== "string") fail(`esperava id de ${type.tableName}`);
      return;
    case "number":
      if (typeof value !== "number") fail("esperava número");
      return;
    case "bigint":
      if (typeof value !== "bigint") fail("esperava int64");
      return;
    case "boolean":
      if (typeof value !== "boolean") fail("esperava booleano");
      return;
    case "literal":
      if (value !== type.value) fail(`esperava ${JSON.stringify(type.value)}`);
      return;
    case "array":
      if (!Array.isArray(value)) return fail("esperava lista");
      value.forEach((item, i) => check(item, type.value, `${path}[${i}]`, errors));
      return;
    case "record":
      if (!value || typeof value !== "object" || Array.isArray(value)) return fail("esperava mapa");
      for (const [k, item] of Object.entries(value)) {
        check(k, type.keys, `${path}{${k}}`, errors);
        check(item, type.values.fieldType, `${path}.${k}`, errors);
      }
      return;
    case "object": {
      if (!value || typeof value !== "object" || Array.isArray(value)) return fail("esperava objeto");
      const fields = type.value as Record<string, { fieldType: Json; optional: boolean }>;
      for (const [k, f] of Object.entries(fields)) {
        const item = (value as Json)[k];
        if (item === undefined) {
          if (!f.optional) errors.push(`${path ? `${path}.` : ""}${k}: obrigatório`);
          continue;
        }
        check(item, f.fieldType, path ? `${path}.${k}` : k, errors);
      }
      for (const k of Object.keys(value)) if (!(k in fields) && !(path === "" && k.startsWith("_"))) errors.push(`${path ? `${path}.` : ""}${k}: campo fora do schema`);
      return;
    }
    case "union": {
      for (const option of type.value as Json[]) {
        const sub: string[] = [];
        check(value, option, path, sub);
        if (!sub.length) return;
      }
      fail("nenhuma opção da união");
      return;
    }
    default:
      fail(`tipo ${type.type} sem conferência`);
  }
}

/** Erros de cada documento de `docs` contra a tabela `table` da v2 (vazio = tudo certo). */
export function schemaErrors(table: string, docs: Json[]): string[] {
  const def = (rubricaTables as unknown as Record<string, { validator: { json: Json } }>)[table];
  if (!def) return [`a tabela ${table} não existe no schema da v2`];
  const errors: string[] = [];
  docs.forEach((d, i) => {
    const own: string[] = [];
    check(d, def.validator.json, "", own);
    for (const e of own) errors.push(`${table}[${i}] ${e}`);
  });
  return errors;
}

export const V2_TABLES = Object.keys(rubricaTables);
