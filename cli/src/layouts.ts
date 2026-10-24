/**
 * Registro dos layouts do Rubrica: de onde vem cada arquivo, o que o CLI pergunta e o que
 * recomenda. É a única lista de layouts — create, config, applyLayout e os testes leem daqui.
 */

export type ColorMode = "light" | "dark" | "system";
export type Texture = "none" | "grain" | "paper" | "scanlines";

export interface LayoutSpec {
  id: string;
  label: string;
  hint: string;
  /**
   * `true` para os 5 layouts originais: só podem usar as 4 cores do contrato
   * (--bg, --text, --primary, --accent). Os novos usam o esquema completo.
   */
  legacy: boolean;
  /** Arquivos da raiz de templates/layouts/<id>/ copiados para src/components/. */
  copy: string[];
  /** Arquivos de src/components/ apagados ao aplicar este layout. */
  remove: string[];
  /** Páginas de templates/layouts/<id>/pages/ copiadas para src/pages/. */
  pages?: string[];
  /** Fontes recomendadas. `mono: ""` = o layout não usa fonte mono (o CLI não pergunta). */
  fonts: { sans: string[]; mono: string };
  /** Aparência sugerida ao escolher o layout. */
  recommended: { scheme: string; mode: ColorMode; texture: Texture };
}

export const TEMPLATE_PAGES = ["Home.tsx", "Resume.tsx", "Portfolio.tsx", "About.tsx", "Blog.tsx"];

const NEW_LAYOUT_REMOVE = ["Sidebar.tsx", "Navbar.tsx", "Footer.tsx"];

export const LAYOUTS: LayoutSpec[] = [
  // ---- originais (contrato de 4 cores) ----
  {
    id: "cyberpunk",
    label: "Cyberpunk",
    hint: "sidebar lateral com foto de perfil — dev, designer, freelancer",
    legacy: true,
    copy: ["Layout.tsx", "Sidebar.tsx"],
    remove: ["Navbar.tsx", "Footer.tsx"],
    fonts: { sans: ["Chakra Petch"], mono: "JetBrains Mono" },
    recommended: { scheme: "neon", mode: "dark", texture: "none" },
  },
  {
    id: "brutalist",
    label: "Brutalism Terminal",
    hint: "identidade hacker total — monospace, sem bordas arredondadas",
    legacy: true,
    copy: ["Layout.tsx", "Navbar.tsx"],
    remove: ["Sidebar.tsx", "Footer.tsx"],
    pages: TEMPLATE_PAGES,
    fonts: { sans: ["JetBrains Mono"], mono: "JetBrains Mono" },
    recommended: { scheme: "paper-noir", mode: "dark", texture: "none" },
  },
  {
    id: "swiss",
    label: "Swiss Grid",
    hint: "grid de 12 colunas, tipografia forte, design suíço rigoroso",
    legacy: true,
    copy: ["Layout.tsx", "Sidebar.tsx", "SwissShared.tsx"],
    remove: ["Navbar.tsx", "Footer.tsx"],
    pages: TEMPLATE_PAGES,
    fonts: { sans: ["Archivo"], mono: "" },
    recommended: { scheme: "paper-noir", mode: "light", texture: "none" },
  },
  {
    id: "bento",
    label: "Bento",
    hint: "grid assimétrico com floating dock — moderno, orientado a produto",
    legacy: true,
    copy: ["Layout.tsx", "FloatingDock.tsx"],
    remove: [],
    pages: TEMPLATE_PAGES,
    fonts: { sans: ["Manrope"], mono: "JetBrains Mono" },
    recommended: { scheme: "editorial-cream", mode: "light", texture: "none" },
  },
  {
    id: "magazine",
    label: "Magazine",
    hint: "editorial clássico · display serifado · grid assimétrico · áreas de respiro generosas",
    legacy: true,
    copy: ["Layout.tsx", "Masthead.tsx"],
    remove: ["Sidebar.tsx", "Footer.tsx"],
    pages: TEMPLATE_PAGES,
    fonts: { sans: ["Bodoni Moda", "IBM Plex Serif"], mono: "JetBrains Mono" },
    recommended: { scheme: "editorial-cream", mode: "light", texture: "paper" },
  },
  // ---- novos (esquema completo) ----
  {
    id: "desktop",
    label: "Desktop Retrô",
    hint: "cada seção é uma janela sobre a área de trabalho — nostalgia e brincadeira",
    legacy: false,
    copy: ["Layout.tsx", "DesktopMenuBar.tsx", "DesktopShared.tsx"],
    remove: NEW_LAYOUT_REMOVE,
    pages: TEMPLATE_PAGES,
    fonts: { sans: ["Instrument Sans"], mono: "IBM Plex Mono" },
    recommended: { scheme: "sorbet", mode: "light", texture: "grain" },
  },
  {
    id: "index",
    label: "Índice",
    hint: "lista densa de museu, rótulos à esquerda e imagem que surge no hover — curadoria",
    legacy: false,
    copy: ["Layout.tsx", "IndexHeader.tsx", "IndexShared.tsx"],
    remove: NEW_LAYOUT_REMOVE,
    pages: TEMPLATE_PAGES,
    fonts: { sans: ["Instrument Sans"], mono: "IBM Plex Mono" },
    recommended: { scheme: "sumi", mode: "light", texture: "none" },
  },
  {
    id: "monograph",
    label: "Monografia",
    hint: "o site como livro: folha de rosto, sumário, capitulares e notas na margem",
    legacy: false,
    copy: ["Layout.tsx", "MonographRunningHead.tsx", "MonographShared.tsx"],
    remove: NEW_LAYOUT_REMOVE,
    pages: TEMPLATE_PAGES,
    fonts: { sans: ["Fraunces", "Source Serif 4"], mono: "IBM Plex Mono" },
    recommended: { scheme: "azulejo", mode: "light", texture: "paper" },
  },
  {
    id: "zine",
    label: "Zine",
    hint: "colagem: polaroides, fita adesiva, post-its e letra à mão — autoral",
    legacy: false,
    copy: ["Layout.tsx", "ZineNav.tsx", "ZineShared.tsx"],
    remove: NEW_LAYOUT_REMOVE,
    pages: TEMPLATE_PAGES,
    fonts: { sans: ["Bricolage Grotesque"], mono: "IBM Plex Mono" },
    recommended: { scheme: "riso", mode: "light", texture: "paper" },
  },
  {
    id: "blueprint",
    label: "Blueprint",
    hint: "folhas técnicas numeradas sobre papel quadriculado, com cotas e carimbo",
    legacy: false,
    copy: ["Layout.tsx", "BlueprintHeader.tsx", "BlueprintShared.tsx"],
    remove: NEW_LAYOUT_REMOVE,
    pages: TEMPLATE_PAGES,
    fonts: { sans: ["IBM Plex Sans"], mono: "IBM Plex Mono" },
    recommended: { scheme: "cianotipia", mode: "dark", texture: "paper" },
  },
  {
    id: "garden",
    label: "Jardim Digital",
    hint: "notas com estágio de crescimento, backlinks e mapa de ligações",
    legacy: false,
    copy: ["Layout.tsx", "GardenSidebar.tsx", "GardenShared.tsx"],
    remove: NEW_LAYOUT_REMOVE,
    pages: TEMPLATE_PAGES,
    fonts: { sans: ["Fraunces", "Source Serif 4"], mono: "IBM Plex Mono" },
    recommended: { scheme: "crepusculo", mode: "dark", texture: "grain" },
  },
  {
    id: "chat",
    label: "Conversa",
    hint: "o site como conversa: cada seção responde a uma pergunta pronta",
    legacy: false,
    copy: ["Layout.tsx", "ChatHeader.tsx", "ChatShared.tsx"],
    remove: NEW_LAYOUT_REMOVE,
    pages: TEMPLATE_PAGES,
    fonts: { sans: ["Instrument Sans"], mono: "IBM Plex Mono" },
    recommended: { scheme: "alto-contraste", mode: "light", texture: "none" },
  },
  {
    id: "poster",
    label: "Pôster Cinético",
    hint: "tipografia gigante do começo ao fim, faixas rolando — impacto",
    legacy: false,
    copy: ["Layout.tsx", "PosterNav.tsx", "PosterShared.tsx"],
    remove: NEW_LAYOUT_REMOVE,
    pages: TEMPLATE_PAGES,
    fonts: { sans: ["Bricolage Grotesque"], mono: "IBM Plex Mono" },
    recommended: { scheme: "tropicalia", mode: "light", texture: "grain" },
  },
];

export type RubricaLayoutId = (typeof LAYOUTS)[number]["id"];

export function getLayout(id: string): LayoutSpec | undefined {
  return LAYOUTS.find((l) => l.id === id);
}

export const COLOR_MODES: { value: ColorMode; label: string; hint: string }[] = [
  { value: "light", label: "Claro", hint: "fundo claro" },
  { value: "dark", label: "Escuro", hint: "fundo escuro" },
  { value: "system", label: "Automático", hint: "segue o modo do sistema de quem visita" },
];

export const TEXTURES: { value: Texture; label: string; hint: string }[] = [
  { value: "none", label: "Nenhuma", hint: "superfícies lisas" },
  { value: "grain", label: "Grão de filme", hint: "ruído fino, sensação analógica" },
  { value: "paper", label: "Papel", hint: "fibras de papel, bom para layouts editoriais" },
  { value: "scanlines", label: "Scanlines", hint: "linhas de monitor CRT" },
];
