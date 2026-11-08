/**
 * Normaliza um valor seguindo o validador do Convex: todo texto traduzível
 * (`v.record(v.string(), v.string())`) passa por `cleanLocalized`, em qualquer nível
 * (SEO, seções do case, itens dos planos, alt das imagens).
 */
import type { GenericValidator } from "convex/values";
import { cleanLocalized } from "./text";

type AnyValidator = GenericValidator & {
  kind: string;
  fields?: Record<string, AnyValidator>;
  element?: AnyValidator;
  key?: AnyValidator;
  value?: AnyValidator;
};

function isLocalizedValidator(validator: AnyValidator): boolean {
  return validator.kind === "record" && validator.key?.kind === "string" && validator.value?.kind === "string";
}

export function cleanByValidator(validator: GenericValidator, value: unknown, path = ""): unknown {
  const val = validator as AnyValidator;
  if (value === undefined || value === null) return value;
  if (isLocalizedValidator(val) && typeof value === "object") return cleanLocalized(value as Record<string, string>, path || "texto");
  if (val.kind === "object" && val.fields && typeof value === "object" && !Array.isArray(value)) {
    return cleanFields(val.fields, value as Record<string, unknown>, path);
  }
  if (val.kind === "array" && val.element && Array.isArray(value)) {
    return value.map((item, i) => cleanByValidator(val.element!, item, `${path}.${i}`));
  }
  return value;
}

export function cleanFields(fields: Record<string, GenericValidator>, values: Record<string, unknown>, prefix = ""): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(values)) {
    const validator = fields[key];
    out[key] = validator ? cleanByValidator(validator, value, prefix ? `${prefix}.${key}` : key) : value;
  }
  return out;
}

/** Campos opcionais do validador (os que podem ser apagados num `update`). */
export function optionalKeys(fields: Record<string, GenericValidator>): Set<string> {
  return new Set(Object.entries(fields).filter(([, v]) => v.isOptional === "optional").map(([k]) => k));
}
