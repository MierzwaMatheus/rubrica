/** Validação local dos argumentos contra o JSON Schema da ferramenta (Ajv), com mensagens em pt-BR. */
import Ajv, { type ErrorObject } from "ajv";
import type { JsonSchema } from "./json-schema";
import type { FieldProblem } from "../tools/types";

const ajv = new Ajv({ allErrors: true, strict: false, useDefaults: false, coerceTypes: false });
const cache = new WeakMap<object, ReturnType<Ajv["compile"]>>();

function where(e: ErrorObject): string {
  return e.instancePath.replace(/^\//, "").replace(/\//g, ".");
}

function message(e: ErrorObject): string {
  const p = e.params as Record<string, unknown>;
  switch (e.keyword) {
    case "required":
      return `campo obrigatório: ${p.missingProperty}`;
    case "additionalProperties":
      return `campo desconhecido: ${p.additionalProperty}`;
    case "type":
      return `deve ser ${{ string: "texto", number: "número", integer: "número inteiro", boolean: "verdadeiro ou falso", object: "objeto", array: "lista" }[String(p.type)] ?? p.type}`;
    case "enum":
      return `use um destes valores: ${(p.allowedValues as unknown[]).join(", ")}`;
    case "const":
      return `deve ser ${JSON.stringify(p.allowedValue)}`;
    case "maxLength":
      return `até ${p.limit} caracteres`;
    case "minimum":
      return `mínimo ${p.limit}`;
    case "maximum":
      return `máximo ${p.limit}`;
    case "pattern":
      return "formato inválido";
    case "minItems":
      return `pelo menos ${p.limit} itens`;
    case "maxItems":
      return `no máximo ${p.limit} itens`;
    default:
      return e.message ?? "inválido";
  }
}

export function validateAgainst(schema: JsonSchema, value: unknown): FieldProblem[] {
  let validate = cache.get(schema);
  if (!validate) {
    validate = ajv.compile(schema);
    cache.set(schema, validate);
  }
  if (validate(value)) return [];
  const errors = validate.errors ?? [];
  // `anyOf`/`oneOf` espalham erros dos ramos que não valem: fica só o que não é desses ramos.
  const useful = errors.filter((e) => e.keyword !== "anyOf" && e.keyword !== "oneOf");
  const seen = new Set<string>();
  return (useful.length ? useful : errors)
    .map((e) => ({ path: where(e), message: message(e) }))
    .filter((p) => !seen.has(`${p.path}|${p.message}`) && seen.add(`${p.path}|${p.message}`));
}
