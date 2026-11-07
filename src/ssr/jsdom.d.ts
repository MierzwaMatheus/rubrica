// Tipagem mínima do jsdom, usado só na pré-renderização (src/entry-server.tsx).
declare module "jsdom" {
  export class JSDOM {
    constructor(html?: string);
    readonly window: unknown;
  }
}
