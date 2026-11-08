/** Arquivos Markdown importados como texto (tsup: loader "text"; vitest: plugin em vitest.config.ts). */
declare module "*.md" {
  const text: string;
  export default text;
}
