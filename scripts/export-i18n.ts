export function validateEnv(env: Record<string, string | undefined>): string {
  const url = env.CONVEX_URL ?? env.VITE_CONVEX_URL;
  if (!url) {
    throw new Error("CONVEX_URL is not set. Configure it in .env.local before running build:i18n.");
  }
  return url;
}

export function serializeTranslations(obj: Record<string, unknown>, varName: string): string {
  function stringify(val: unknown, indent: number): string {
    const pad = "  ".repeat(indent);
    const innerPad = "  ".repeat(indent + 1);
    if (typeof val === "string") {
      return JSON.stringify(val);
    }
    if (typeof val === "object" && val !== null) {
      const entries = Object.entries(val as Record<string, unknown>);
      if (entries.length === 0) return "{}";
      const lines = entries.map(([k, v]) => `${innerPad}${k}: ${stringify(v, indent + 1)}`);
      return `{\n${lines.join(",\n")},\n${pad}}`;
    }
    return String(val);
  }
  return `export const ${varName} = ${stringify(obj, 0)};\n`;
}

export function unflattenTranslations(
  entries: Array<{ key: string; value: string }>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const { key, value } of entries) {
    const parts = key.split(".");
    let current = result;
    for (let i = 0; i < parts.length - 1; i++) {
      if (typeof current[parts[i]] !== "object" || current[parts[i]] === null) {
        current[parts[i]] = {};
      }
      current = current[parts[i]] as Record<string, unknown>;
    }
    current[parts[parts.length - 1]] = value;
  }
  return result;
}

type Tree = { [key: string]: string | Tree };

/**
 * Traduções do repositório como base, com os textos do banco (siteTexts) por cima.
 * Sem o plugin de tradução, o banco vem vazio: sem a base, o build apagaria tudo.
 */
export function mergeTranslations(base: Tree, overrides: Tree): Tree {
  const result: Tree = { ...base };
  for (const [key, value] of Object.entries(overrides)) {
    const current = result[key];
    if (typeof value === "object" && value !== null) {
      result[key] = mergeTranslations(typeof current === "object" && current !== null ? current : {}, value);
    } else if (value) {
      result[key] = value;
    }
  }
  return result;
}

// main() só executa quando rodado diretamente via tsx (não durante testes)
if (!process.env.VITEST) {
  const { config } = await import("dotenv");
  config({ path: ".env.local" });

  const { ConvexHttpClient } = await import("convex/browser");
  const { api } = await import("../convex/_generated/api");
  const { writeFileSync } = await import("fs");
  const { join } = await import("path");
  const { extractKeysFromDir, saveManifest } = await import("./extract-key-manifest");

  const convexUrl = validateEnv(process.env as Record<string, string | undefined>);
  const client = new ConvexHttpClient(convexUrl);

  console.log("Fetching siteTexts from Convex...");
  const rows = await client.query(api.siteTexts.getAll, {}) as Array<{
    key: string;
    ptBR: string;
    enUS?: string;
  }>;

  const ptBRObj = unflattenTranslations(rows.map((r) => ({ key: r.key, value: r.ptBR })));
  const enUSObj = unflattenTranslations(
    rows.filter((r) => r.enUS).map((r) => ({ key: r.key, value: r.enUS! }))
  );

  const translationsDir = join(process.cwd(), "src/i18n/translations");
  const { ptBR: basePtBR } = await import("../src/i18n/translations/pt-BR");
  const { enUS: baseEnUS } = await import("../src/i18n/translations/en-US");
  writeFileSync(
    join(translationsDir, "pt-BR.ts"),
    serializeTranslations(mergeTranslations(basePtBR as Tree, ptBRObj as Tree), "ptBR"),
    "utf-8"
  );
  writeFileSync(
    join(translationsDir, "en-US.ts"),
    serializeTranslations(mergeTranslations(baseEnUS as Tree, enUSObj as Tree), "enUS"),
    "utf-8"
  );

  console.log(`✓ pt-BR.ts (${rows.length} keys)`);
  console.log(`✓ en-US.ts (${rows.filter((r) => r.enUS).length} keys)`);

  console.log("Generating key manifest...");
  const srcDir = join(process.cwd(), "src");
  const manifest = await extractKeysFromDir(srcDir);
  const manifestPath = join(process.cwd(), "src/i18n/key-manifest.json");
  await saveManifest(manifest, manifestPath);
  console.log(`✓ key-manifest.json (${Object.keys(manifest).length} keys)`);

  console.log("Done!");
}
