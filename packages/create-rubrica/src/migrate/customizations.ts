/**
 * Personalizações de um projeto v1 (RFC v2: "Migração da v1", passo 4): compara os
 * arquivos do projeto com a última v1 montada com as mesmas escolhas (`buildPristine`)
 * e sugere o destino de cada diferença na v2 (bloco próprio, ejetar, tokens…).
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

export type ChangeKind = "modificado" | "novo" | "removido";

export interface Customization {
  path: string;
  kind: ChangeKind;
  /** Área do projeto ("página", "casca do tema", "backend"…). */
  area: string;
  suggestion: string;
  /** Linhas acrescentadas e tiradas (texto). */
  lines?: { added: number; removed: number };
}

/** Fora da comparação: gerados no build, segredos, dependências, artefatos de ferramentas. */
const IGNORE = [
  /^\.git(\/|$)/, /(^|\/)node_modules(\/|$)/, /^dist(-server)?(\/|$)/, /^\.env/, /^\.vercel(\/|$)/, /^\.rubrica(\/|$)/,
  /^public\/(data|media|fonts)(\/|$)/, /^public\/(sitemap\.xml|robots\.txt|rss\.xml|feed\.xml)$/, /^coverage(\/|$)/, /^\.stryker-tmp(\/|$)/, /^reports(\/|$)/,
  /^\.playwright-mcp(\/|$)/, /\.log$/, /^pnpm-lock\.yaml$/, /^package-lock\.json$/, /^\.DS_Store$/, /(^|\/)\.DS_Store$/, /^\.convex(\/|$)/,
  /^convex\/_generated(\/|$)/, /^src\/i18n\/key-manifest\.json$/, /^\.tdd(\/|$)/, /^\.claude\/settings\.local\.json$/,
];

export const ignored = (path: string) => IGNORE.some((re) => re.test(path));

export function listFiles(root: string): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      const rel = relative(root, full).split(sep).join("/");
      if (ignored(rel)) continue;
      const st = statSync(full, { throwIfNoEntry: false });
      if (!st) continue;
      if (st.isDirectory()) walk(full);
      else if (st.isFile()) out.push(rel);
    }
  };
  if (existsSync(root)) walk(root);
  return out.sort();
}

/** Linhas acrescentadas/tiradas (contagem por multiconjunto: rápida e suficiente para o relatório). */
export function lineDelta(before: string, after: string): { added: number; removed: number } {
  const count = (text: string) => {
    const m = new Map<string, number>();
    for (const line of text.split("\n")) m.set(line, (m.get(line) ?? 0) + 1);
    return m;
  };
  const a = count(before);
  const b = count(after);
  let added = 0;
  let removed = 0;
  for (const [line, n] of b) added += Math.max(0, n - (a.get(line) ?? 0));
  for (const [line, n] of a) removed += Math.max(0, n - (b.get(line) ?? 0));
  return { added, removed };
}

/** Blocos que normalmente compõem cada página fixa da v1 (para a sugestão). */
const PAGE_BLOCKS: Record<string, string> = {
  Home: "hero, numeros, cases, texto, servicos, depoimentos, cta, contato",
  About: "texto, lista-itens, galeria, faq",
  Resume: "curriculo",
  Portfolio: "cases",
  Blog: "posts-recentes",
  Testimonials: "depoimentos",
};

interface Rule {
  test: (path: string, kind: ChangeKind) => boolean;
  area: string;
  suggestion: (path: string, kind: ChangeKind) => string;
}

const SHELL = /^src\/components\/(Layout|Sidebar|Navbar|Footer|Masthead|FloatingDock|MobileLayoutStyles|[A-Z][A-Za-z]*(Header|Nav|Shared|MenuBar|RunningHead|Sidebar))\.tsx$/;

export const RULES: Rule[] = [
  { test: (p) => SHELL.test(p), area: "casca do tema", suggestion: () => "Cabeçalho, navegação e rodapé são a casca do tema na v2. Cores e fontes: tokens (Aparência). Mudança de estrutura: peça no tema ou num tema próprio; a casca ainda não se ejeta." },
  {
    test: (p) => /^src\/pages\/(Home|About|Resume|Portfolio|Blog|Testimonials)\.tsx$/.test(p),
    area: "página",
    suggestion: (p) => {
      const page = /src\/pages\/(\w+)\.tsx/.exec(p)![1]!;
      return `Na v2 a página é uma lista de blocos (${PAGE_BLOCKS[page]}), editada no painel. Seção que não existe no catálogo: bloco próprio em src/blocks/. Marcação diferente de um bloco que existe: npx create-rubrica ejetar <bloco>.`;
    },
  },
  { test: (p) => /^src\/pages\/(BlogPost|ProjectCaseStudy|NotFound)\.tsx$/.test(p), area: "template do tema", suggestion: () => "Post, case e 404 são templates do tema na v2 (ainda não se ejetam): leve o ajuste para o tema ou abra uma issue." },
  { test: (p) => /^src\/pages\/admin\//.test(p), area: "painel", suggestion: () => "O painel vem do @rubrica/core na v2. Tela própria: abra uma issue ou um plugin; ajuste de texto: Textos." },
  { test: (p, k) => /^src\/components\/[^/]+\.tsx$/.test(p) && k === "novo", area: "componente próprio", suggestion: () => "Vira bloco próprio em src/blocks/ (definição com defineBlock + componente React puro, só props)." },
  { test: (p) => /^src\/components\/(ui|admin)\//.test(p), area: "componentes base", suggestion: () => "Componentes base da v1 (shadcn, painel) não vão para a v2. Se um bloco próprio usa, copie o necessário para src/blocks/." },
  { test: (p) => /^src\/components\//.test(p), area: "componente do layout", suggestion: () => "Parte de um bloco na v2: ejete o bloco equivalente (npx create-rubrica ejetar <bloco>) e traga a mudança, ou faça um bloco próprio." },
  { test: (p) => /\.css$/.test(p) && p.startsWith("src/"), area: "estilo", suggestion: () => "Cores, fontes e raios viram tokens do tema (painel: Aparência, ou appearance.tokens). Regras de layout ficam com o tema; CSS de bloco próprio vai junto dele." },
  { test: (p) => /^src\/i18n\//.test(p), area: "textos", suggestion: () => "Os textos do banco (siteTexts) já vão para os blocos e para Textos. Mudança no arquivo: refaça no painel (campo do bloco ou Textos)." },
  { test: (p) => p === "convex/schema.ts", area: "backend: tabelas", suggestion: () => "Tabelas próprias vão no convex/schema.ts da v2, depois de ...rubricaTables. Os dados delas: import à parte." },
  { test: (p, k) => /^convex\//.test(p) && k === "novo", area: "backend próprio", suggestion: () => "Função própria: copie para o convex/ do projeto v2 (arquivo fora de convex/rubrica/). Use @rubrica/core/convex para auth e papéis." },
  { test: (p) => /^convex\//.test(p), area: "backend do núcleo", suggestion: () => "O backend do núcleo vem do pacote na v2 (não se edita). Leve a mudança para um arquivo próprio do convex/ ou abra uma issue para entrar no núcleo." },
  { test: (p) => p === "index.html", area: "<head>", suggestion: () => "O <head> (título, descrição, Open Graph, JSON-LD) é do núcleo na v2, pelo painel. Scripts de terceiros (analytics) precisam de plugin ou issue." },
  { test: (p) => /^(vercel\.json|netlify\.toml|_redirects|_headers)$/.test(p), area: "hospedagem", suggestion: () => "A v2 gera vercel.json, _redirects e _headers de uma configuração só. Redirecionamentos e cabeçalhos próprios: leve para lá." },
  { test: (p) => /^public\//.test(p), area: "arquivo público", suggestion: () => "Continua em public/ (o migrar mantém a pasta)." },
  { test: (p) => p === "package.json", area: "dependências", suggestion: () => "O migrar refaz o package.json (núcleo + tema). Dependências que um bloco próprio usar, acrescente de volta." },
  { test: (p) => p === "rubrica.config.ts" || p === "vite.config.ts" || /^tsconfig/.test(p), area: "configuração", suggestion: () => "Vira astro.config.ts e rubrica.json na v2 (o migrar gera)." },
  { test: (p) => /^(scripts|tests|domain)\//.test(p) || /^(vitest|stryker)/.test(p), area: "ferramenta do projeto", suggestion: () => "Os scripts e testes do template vêm no pacote na v2. Os seus: revise se ainda fazem sentido (testes de bloco próprio, por exemplo)." },
  { test: (p) => /^\.(agents|claude)\//.test(p), area: "skills e agentes", suggestion: () => "Na v2 o conteúdo é gravado pelo MCP (rubrica mcp); a skill rubrica (Python) saiu. As skills de escrita continuam." },
  { test: (p) => /\.md$/.test(p) || /^docs\//.test(p), area: "documentação", suggestion: () => "Mantida (o AGENTS.md e o CLAUDE.md são trocados pelos da v2)." },
];

export function classify(path: string, kind: ChangeKind): { area: string; suggestion: string } {
  const rule = RULES.find((r) => r.test(path, kind));
  return rule ? { area: rule.area, suggestion: rule.suggestion(path, kind) } : { area: "outro", suggestion: "Revise à mão." };
}

/** Diferenças entre o projeto e a v1 de referência, com a sugestão de cada uma. */
export function listCustomizations(projectDir: string, pristineDir: string): Customization[] {
  const mine = new Set(listFiles(projectDir));
  const base = new Set(listFiles(pristineDir));
  const out: Customization[] = [];
  for (const path of [...new Set([...mine, ...base])].sort()) {
    const inMine = mine.has(path);
    const inBase = base.has(path);
    if (inMine && inBase) {
      const a = readFileSync(join(pristineDir, path));
      const b = readFileSync(join(projectDir, path));
      if (a.equals(b)) continue;
      const lines = /\0/.test(a.toString("latin1").slice(0, 2000)) ? undefined : lineDelta(a.toString("utf-8"), b.toString("utf-8"));
      out.push({ path, kind: "modificado", ...classify(path, "modificado"), ...(lines && { lines }) });
    } else if (inMine) {
      out.push({ path, kind: "novo", ...classify(path, "novo") });
    } else {
      out.push({ path, kind: "removido", ...classify(path, "removido") });
    }
  }
  return out;
}

/** Agrupa por área para o relatório. */
export function groupByArea(items: Customization[]): Map<string, Customization[]> {
  const map = new Map<string, Customization[]>();
  for (const item of items) map.set(item.area, [...(map.get(item.area) ?? []), item]);
  return map;
}
