/**
 * Arquivos do `convex/` do projeto (RFC v2, revisão da decisão 13). Todos são gerados:
 * o schema e as funções vêm do `@rubrica/core`, e o projeto só reexporta. O `update`
 * regenera tudo o que está aqui; tabelas e funções próprias do projeto vão em outros
 * arquivos do `convex/` (o CLI não mexe neles).
 *
 * O conjunto canônico é o `apps/demo/convex/` do monorepo (um teste compara).
 */
import { CORE_MODULES } from "../core-manifest.js";

export const GENERATED_HEADER = "// Gerado pelo Rubrica (@rubrica/core). Não edite: atualize o pacote.";

/** Igual a `reexportSource` do núcleo. */
export function reexportSource(module: string, names: readonly string[]): string {
  return [GENERATED_HEADER, 'import { rubrica } from "../rubrica.config";', "", `export const { ${names.join(", ")} } = rubrica.${module};`, ""].join("\n");
}

const GENERATED_ROOT: Record<string, string> = {
  "convex/auth.ts": [GENERATED_HEADER, 'import { rubrica } from "./rubrica.config";', "", "export const { auth, signIn, signOut, store, isAuthenticated } = rubrica.auth;", ""].join("\n"),
  "convex/http.ts": [GENERATED_HEADER, 'import { rubrica } from "./rubrica.config";', "", "export default rubrica.http;", ""].join("\n"),
  "convex/crons.ts": [GENERATED_HEADER, 'import { rubrica } from "./rubrica.config";', "", "export default rubrica.crons;", ""].join("\n"),
};

/** Criados uma vez; o projeto pode mudar (tabelas próprias no schema, por exemplo). */
const OWNED_ROOT: Record<string, string> = {
  "convex/auth.config.ts": `export default {
  providers: [
    {
      domain: process.env.CONVEX_SITE_URL,
      applicationID: "convex",
    },
  ],
};
`,
  "convex/schema.ts": `import { defineSchema } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { rubricaTables } from "@rubrica/core/convex/schema";

// Tabelas do login, do núcleo do Rubrica e (depois delas) as do próprio projeto.
export default defineSchema({ ...authTables, ...rubricaTables });
`,
  "convex/tsconfig.json": `{
  /* Configuração do TypeScript para as funções do Convex (padrão do \`npx convex init\`). */
  "compilerOptions": {
    "allowJs": true,
    "strict": true,
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "skipLibCheck": true,
    "allowSyntheticDefaultImports": true,
    "target": "ESNext",
    "lib": ["ES2021", "dom"],
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "isolatedModules": true,
    "noEmit": true,
    "types": ["node"]
  },
  "include": ["./**/*"],
  "exclude": ["./_generated"]
}
`,
};

/** Instância do backend: os blocos próprios do projeto entram aqui (os mesmos do site). */
export const RUBRICA_CONFIG = `/**
 * Instância do backend do Rubrica neste projeto. Os blocos próprios vêm de
 * src/blocks/index.ts, os mesmos que o site usa. (Dois pontos no nome: o Convex não
 * trata este arquivo como módulo de funções.)
 */
import { createRubrica } from "@rubrica/core/convex";
import { blocks } from "../src/blocks";

export const rubrica = createRubrica({ blocks });
`;

/**
 * Arquivos gerados do `convex/`. `modules`: funções por módulo do núcleo instalado
 * (sem ele, as do manifesto deste CLI).
 */
export function convexFiles(modules: Record<string, readonly string[]> = CORE_MODULES): Record<string, string> {
  const files: Record<string, string> = { ...GENERATED_ROOT };
  for (const [module, names] of Object.entries(modules)) files[`convex/rubrica/${module}.ts`] = reexportSource(module, names);
  return files;
}

/** Arquivos do `convex/` que o projeto pode personalizar: o CLI cria uma vez e não regenera. */
export function convexOwnedFiles(): Record<string, string> {
  return { ...OWNED_ROOT, "convex/rubrica.config.ts": RUBRICA_CONFIG };
}

/** É um arquivo gerado (o `update` pode sobrescrever e apagar)? */
export function isGeneratedConvexFile(path: string, content: string): boolean {
  return path.startsWith("convex/") && content.startsWith(GENERATED_HEADER);
}
