/**
 * Dependências de navegador do painel e das ilhas, para o Vite pré-otimizar na partida do
 * dev. Sem isso, o Vite as descobre no meio do uso (ex.: o `@tiptap/react` só na hora de
 * adicionar um bloco "Texto"), reotimiza, recarrega a página e a edição se perde; no
 * intervalo, chunks de duas otimizações convivem e aparecem duas cópias do React
 * ("Invalid hook call"), e a barra de ferramentas do Astro dá 504 "Outdated Optimize Dep".
 *
 * Os especificadores saem do `@rubrica/core` (`"@rubrica/core > dep"`): o projeto não
 * declara essas dependências (com pnpm, nem as enxerga) e, com `create --local`
 * (`link:`), o núcleo resolve cópias próprias. Assim o Vite otimiza exatamente o arquivo
 * que o código do núcleo importa, nos dois modos. O React é exceção: vem do projeto
 * (dependência de par) e entra no `resolve.dedupe`, para haver uma cópia só.
 *
 * O teste `dev-deps.test.ts` confere que toda importação de `src/admin` e `src/islands`
 * está aqui.
 */

/** O que o código do painel importa (`src/admin` e o que ele importa de `src/convex/lib`). */
export const ADMIN_BROWSER_DEPS = [
  "@convex-dev/auth/react",
  "@radix-ui/react-dialog",
  "@radix-ui/react-slot",
  "@radix-ui/react-switch",
  "@radix-ui/react-tabs",
  "@tiptap/react",
  "@tiptap/starter-kit",
  "class-variance-authority",
  "clsx",
  "convex/react",
  "convex/server",
  "lucide-react",
  "sonner",
  "tailwind-merge",
  // `src/convex/lib/sanitize.ts`, pela validação de blocos do modo de demonstração.
  "xss",
] as const;

/** O que o código das ilhas importa (`src/islands`), além do React. */
export const ISLAND_BROWSER_DEPS = [] as const satisfies readonly string[];

/** Uma cópia só (a do projeto) no navegador. */
export const DEDUPE = ["react", "react-dom"];

/** Entradas do React que o painel, as ilhas e o `@astrojs/react` usam. */
const REACT_ENTRIES = ["react", "react-dom", "react-dom/client", "react/jsx-runtime", "react/jsx-dev-runtime"];

export const CORE_PACKAGE = "@rubrica/core";

export function optimizeDepsInclude(options: { admin: boolean }): string[] {
  const fromCore = [...(options.admin ? ADMIN_BROWSER_DEPS : []), ...ISLAND_BROWSER_DEPS];
  return [...REACT_ENTRIES, ...fromCore.map((dep) => `${CORE_PACKAGE} > ${dep}`)];
}
