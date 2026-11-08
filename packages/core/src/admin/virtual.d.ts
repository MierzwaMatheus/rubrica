/** Módulos virtuais que a integração do Astro gera para o painel e a prévia. */
declare module "virtual:rubrica/client" {
  import type { ThemeDefinition, BlockComponent } from "../theme/contract";
  import type { BlockDefinition } from "../blocks/define";
  export const theme: ThemeDefinition;
  export const projectBlocks: BlockDefinition[];
  export const projectComponents: Record<string, BlockComponent>;
}

declare module "virtual:rubrica/admin" {
  export const adminBackend: { kind: "convex"; url: string } | { kind: "demo" } | { kind: "missing" };
}

declare module "virtual:rubrica/admin-demo" {
  import type { SiteSnapshot } from "../data/source";
  const snapshot: SiteSnapshot | null;
  export default snapshot;
}
