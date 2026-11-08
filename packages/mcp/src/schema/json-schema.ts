/**
 * JSON Schema das ferramentas, gerado uma vez em código a partir de:
 * - `FieldMap` dos blocos (`@rubrica/core`, `CORE_BLOCKS`): o mesmo schema que valida
 *   no backend e monta o formulário do painel;
 * - validadores do Convex das coleções e das configurações (`@rubrica/core/convex/validators`).
 *
 * As descrições são em pt-BR. Com os idiomas do site conhecidos, o texto traduzível
 * lista cada idioma como propriedade.
 */
import type { BlockDefinition, FieldDef, FieldMap } from "@rubrica/core";

export type JsonSchema = Record<string, unknown>;

export interface SchemaOptions {
  /** Idiomas do site. Sem eles, o texto traduzível aceita qualquer código. */
  locales?: readonly string[];
}

export function localizedSchema(opts: SchemaOptions, description: string, extra: JsonSchema = {}): JsonSchema {
  const hint = opts.locales?.length ? ` Idiomas do site: ${opts.locales.join(", ")}.` : "";
  const base: JsonSchema = {
    type: "object",
    description: `${description} Um texto por idioma, ex.: {"pt-BR": "...", "en": "..."}.${hint}`,
    ...(opts.locales?.length
      ? {
          properties: Object.fromEntries(opts.locales.map((l) => [l, { type: "string", ...extra }])),
          additionalProperties: false,
        }
      : { additionalProperties: { type: "string", ...extra } }),
  };
  return base;
}

export function imageSchema(opts: SchemaOptions, description: string): JsonSchema {
  return {
    type: "object",
    description: `${description} Use o objeto devolvido por media_upload ou media_list (url, storageId, largura e altura).`,
    properties: {
      url: { type: "string", description: "Endereço da imagem." },
      storageId: { type: "string", description: "Id no storage do Convex (vem de media_upload/media_list)." },
      alt: localizedSchema(opts, "Texto alternativo da imagem, descrevendo o que ela mostra."),
      width: { type: "integer", minimum: 1 },
      height: { type: "integer", minimum: 1 },
    },
    required: ["url"],
    additionalProperties: false,
  };
}

export function linkSchema(opts: SchemaOptions, description: string): JsonSchema {
  return {
    type: "object",
    description,
    properties: {
      label: localizedSchema(opts, "Texto do link."),
      href: { type: "string", description: 'Endereço: caminho interno ("/contato", sem prefixo de idioma) ou URL completa.' },
    },
    required: ["label", "href"],
    additionalProperties: false,
  };
}

function describe(def: FieldDef): string {
  return [def.label + (def.required ? " (obrigatório)" : ""), def.help].filter(Boolean).join(". ");
}

export function fieldToSchema(def: FieldDef, opts: SchemaOptions = {}): JsonSchema {
  const description = describe(def);
  switch (def.kind) {
    case "text":
    case "richText": {
      const rich = def.kind === "richText" ? " HTML permitido: h2, h3, p, ul, ol, li, strong, em, a, blockquote, img, code, pre (o h1 é do hero)." : "";
      const max = def.kind === "text" && def.maxLength ? { maxLength: def.maxLength } : {};
      if (def.localized === false) return { type: "string", description: description + rich, ...max };
      return localizedSchema(opts, description + rich, max);
    }
    case "number":
      return {
        type: def.integer ? "integer" : "number",
        description,
        ...(def.min !== undefined ? { minimum: def.min } : {}),
        ...(def.max !== undefined ? { maximum: def.max } : {}),
      };
    case "boolean":
      return { type: "boolean", description: def.default !== undefined ? `${description}. Padrão: ${def.default}` : description };
    case "select":
      return {
        type: "string",
        enum: def.options.map((o) => o.value),
        description: `${description}. Opções: ${def.options.map((o) => `${o.value} (${o.label})`).join(", ")}${def.default ? `. Padrão: ${def.default}` : ""}`,
      };
    case "image":
      return imageSchema(opts, description);
    case "link":
      return linkSchema(opts, description);
    case "list":
      return {
        type: "array",
        description: def.itemLabel ? `${description}. Cada item: ${def.itemLabel}` : description,
        ...(def.min !== undefined ? { minItems: def.min } : {}),
        ...(def.max !== undefined ? { maxItems: def.max } : {}),
        items: fieldMapToSchema(def.of, opts),
      };
  }
}

export function fieldMapToSchema(map: FieldMap, opts: SchemaOptions = {}): JsonSchema {
  const required = Object.entries(map)
    .filter(([, d]) => d.required)
    .map(([k]) => k);
  return {
    type: "object",
    properties: Object.fromEntries(Object.entries(map).map(([k, d]) => [k, fieldToSchema(d, opts)])),
    ...(required.length ? { required } : {}),
    additionalProperties: false,
  };
}

/** `campos` do bloco como o agente deve mandar. */
export function blockFieldsSchema(def: BlockDefinition, opts: SchemaOptions = {}): JsonSchema {
  return { ...fieldMapToSchema(def.fields, opts), description: `Campos do bloco ${def.type}.` };
}

const sourceSchema: JsonSchema = {
  type: "object",
  description: "Quais itens da coleção o bloco mostra (em vez de copiá-los).",
  properties: {
    collection: { type: "string", enum: ["posts", "projects", "services", "testimonials", "faq", "resume", "routine", "plans", "team"] },
    ids: { type: "array", items: { type: "string" }, description: "Itens escolhidos à mão, nesta ordem. Ignora os filtros." },
    featured: { type: "boolean", description: "Só os destacados." },
    tags: { type: "array", items: { type: "string" } },
    limit: { type: "integer", minimum: 1 },
    sort: { type: "string", enum: ["recent", "order"], description: "recent: mais novos primeiro. order: a ordem do painel (padrão)." },
  },
  required: ["collection"],
  additionalProperties: false,
};

/** Um bloco de um tipo, com os campos tipados. */
export function blockInstanceSchema(def: BlockDefinition, opts: SchemaOptions = {}): JsonSchema {
  return {
    type: "object",
    title: def.type,
    description: `${def.label}: ${def.description}`,
    properties: {
      id: { type: "string", pattern: "^[A-Za-z0-9_-]{1,64}$", description: "Id estável do bloco. Se faltar, o MCP gera um." },
      type: { const: def.type },
      variant: { type: "string", description: "Variação declarada pelo tema (opcional)." },
      visible: { type: "boolean", description: "Padrão: true." },
      fields: blockFieldsSchema(def, opts),
      ...(def.source ? { source: { ...sourceSchema, properties: { ...(sourceSchema.properties as JsonSchema), collection: { type: "string", enum: [...def.source.collections] } } } } : {}),
    },
    required: ["type", "fields"],
    additionalProperties: false,
  };
}

/** Qualquer bloco: os tipados e, por último, um genérico (blocos próprios do projeto, que o backend valida). */
export function anyBlockSchema(defs: readonly BlockDefinition[], opts: SchemaOptions = {}, typed = true): JsonSchema {
  const generic: JsonSchema = {
    type: "object",
    description: "Bloco de tipo próprio do projeto (sem schema local; o backend valida).",
    properties: {
      id: { type: "string" },
      type: { type: "string" },
      variant: { type: "string" },
      visible: { type: "boolean" },
      fields: { type: "object" },
      source: sourceSchema,
    },
    required: ["type", "fields"],
  };
  if (!typed) return generic;
  return { description: "Um bloco da página. Veja blocks_catalog para o que cada tipo faz.", anyOf: [...defs.map((d) => blockInstanceSchema(d, opts)), generic] };
}

// ── Validadores do Convex → JSON Schema ─────────────────────────────────────

interface ConvexValidatorJson {
  type: string;
  value?: unknown;
  keys?: ConvexValidatorJson;
  values?: { fieldType: ConvexValidatorJson; optional: boolean };
  tableName?: string;
}

export interface ValidatorSchemaOptions extends SchemaOptions {
  /** Descrição por caminho (`title`, `cover.alt`). */
  descriptions?: Record<string, string>;
  /** Registros texto→texto que NÃO são traduções (ex.: tokens de cor). */
  notLocalized?: readonly string[];
}

export function validatorToSchema(json: ConvexValidatorJson, opts: ValidatorSchemaOptions = {}, path = ""): JsonSchema {
  const description = opts.descriptions?.[path];
  const withDescription = (schema: JsonSchema): JsonSchema => (description ? { ...schema, description } : schema);
  switch (json.type) {
    case "string":
    case "id":
      return withDescription({ type: "string" });
    case "number":
    case "float64":
      return withDescription({ type: "number" });
    case "int64":
    case "bigint":
      return withDescription({ type: "integer" });
    case "boolean":
      return withDescription({ type: "boolean" });
    case "null":
      return withDescription({ type: "null" });
    case "any":
      return withDescription({});
    case "literal":
      return withDescription({ const: json.value });
    case "array":
      return withDescription({ type: "array", items: validatorToSchema(json.value as ConvexValidatorJson, opts, `${path}[]`) });
    case "union": {
      const members = json.value as ConvexValidatorJson[];
      if (members.every((m) => m.type === "literal")) return withDescription({ enum: members.map((m) => m.value) });
      return withDescription({ anyOf: members.map((m) => validatorToSchema(m, opts, path)) });
    }
    case "record": {
      const inner = json.values!.fieldType;
      if (inner.type === "string" && !opts.notLocalized?.includes(path)) {
        return localizedSchema(opts, description ?? "Texto traduzível.");
      }
      return withDescription({ type: "object", additionalProperties: validatorToSchema(inner, opts, `${path}.*`) });
    }
    case "object": {
      const fields = json.value as Record<string, { fieldType: ConvexValidatorJson; optional: boolean }>;
      const required = Object.entries(fields)
        .filter(([, f]) => !f.optional)
        .map(([k]) => k);
      return withDescription({
        type: "object",
        properties: Object.fromEntries(Object.entries(fields).map(([k, f]) => [k, validatorToSchema(f.fieldType, opts, path ? `${path}.${k}` : k)])),
        ...(required.length ? { required } : {}),
        additionalProperties: false,
      });
    }
    default:
      return withDescription({});
  }
}

/** Esquema de um mapa de validadores (`postFields`), com `fields` opcionais conforme o validador. */
export function validatorsToSchema(fields: Record<string, unknown>, opts: ValidatorSchemaOptions = {}): JsonSchema {
  const object: ConvexValidatorJson = {
    type: "object",
    value: Object.fromEntries(
      Object.entries(fields).map(([k, v]) => {
        const json = (v as { json: ConvexValidatorJson }).json;
        // Em um mapa de campos, o validador opcional vem embrulhado: `isOptional`.
        return [k, { fieldType: json, optional: (v as { isOptional?: string }).isOptional === "optional" }];
      }),
    ),
  };
  return validatorToSchema(object, opts);
}
