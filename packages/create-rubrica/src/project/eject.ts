/**
 * Componente ejetado (RFC v2: "Personalização no projeto", item 3; decisão 20).
 *
 * `ejetar <bloco>` acha o componente que o site usa para o bloco (o do tema, senão o
 * padrão do núcleo), copia o arquivo dele (e os arquivos locais que ele importa) para
 * `src/overrides/<bloco>/`, troca os imports internos do pacote pelos públicos e cria um
 * `index.tsx` que a integração usa (`blockComponents`). O hash do componente original
 * fica no `rubrica.json`: o `update` avisa quando o original mudar.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { findPackageDir } from "./introspect.js";

export interface ComponentSource {
  /** Pacote de onde vem (`@rubrica/core` ou `@rubrica/theme-x`). */
  pkg: string;
  version: string;
  /** Pasta raiz do pacote. */
  pkgDir: string;
  /** Arquivo do componente (absoluto). */
  file: string;
  /** Nome exportado. */
  component: string;
}

const EXTENSIONS = [".tsx", ".ts", ".jsx", ".js"];

function resolveLocal(fromFile: string, spec: string): string | null {
  const base = resolve(dirname(fromFile), spec);
  for (const candidate of [base, ...EXTENSIONS.map((e) => base + e), ...EXTENSIONS.map((e) => join(base, `index${e}`))]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}

const packageDir = findPackageDir;

const readJson = (p: string) => JSON.parse(readFileSync(p, "utf-8")) as Record<string, unknown>;

function filesUnder(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return name === "node_modules" ? [] : filesUnder(full);
    return EXTENSIONS.some((e) => name.endsWith(e)) && !name.endsWith(".d.ts") ? [full] : [];
  });
}

/** `tipo: Ident` ou `"tipo": Ident` dentro de um objeto `blocks: { ... }` (ou `DEFAULT_BLOCKS = { ... }`). */
export function findBlockMapping(source: string, type: string): string | null {
  const key = /^[a-z][a-z0-9]*$/i.test(type) ? `(?:${type}|"${type}"|'${type}')` : `(?:"${type}"|'${type}')`;
  const match = new RegExp(`(?:^|[\\s{,])${key}\\s*:\\s*([A-Za-z_$][\\w$]*)\\s*[,}\\n]`, "m").exec(source);
  return match?.[1] ?? null;
}

/** Arquivo do pacote que exporta o componente (`export function X`/`export const X`). */
function fileExporting(files: string[], name: string): string | null {
  const re = new RegExp(`export\\s+(?:default\\s+)?(?:function|const|class)\\s+${name}\\b`);
  return files.find((f) => re.test(readFileSync(f, "utf-8"))) ?? null;
}

/** Texto do componente no arquivo (para o hash): da declaração até a próxima exportação. */
export function componentSegment(source: string, name: string): string {
  const re = new RegExp(`export\\s+(?:default\\s+)?(?:function|const|class)\\s+${name}\\b`);
  const m = re.exec(source);
  if (!m) return source;
  const rest = source.slice(m.index);
  const nextExport = rest.slice(1).search(/\nexport\s/);
  return nextExport === -1 ? rest : rest.slice(0, nextExport + 1);
}

export const hashText = (text: string) => createHash("sha256").update(text.replace(/\r\n/g, "\n")).digest("hex").slice(0, 16);

/** Componente que o site usa hoje para o bloco: o do tema (ou de um tema do qual ele herda), senão o do núcleo. */
export function findComponentSource(projectDir: string, themePkg: string, type: string): ComponentSource | null {
  const seen = new Set<string>();
  const queue = [themePkg];
  while (queue.length) {
    const pkg = queue.shift()!;
    if (seen.has(pkg)) continue;
    seen.add(pkg);
    const dir = packageDir(projectDir, pkg) ?? (pkg !== themePkg ? packageDir(packageDir(projectDir, themePkg) ?? projectDir, pkg) : null);
    if (!dir) continue;
    const files = filesUnder(join(dir, "src"));
    for (const file of files) {
      const ident = findBlockMapping(readFileSync(file, "utf-8"), type);
      if (!ident) continue;
      const exporting = fileExporting(files, ident);
      if (exporting) return { pkg, version: String(readJson(join(dir, "package.json")).version), pkgDir: dir, file: exporting, component: ident };
    }
    const deps = Object.keys((readJson(join(dir, "package.json")).dependencies as Record<string, string>) ?? {});
    queue.push(...deps.filter((d) => d.startsWith("@rubrica/theme-")));
  }
  const coreDir = packageDir(projectDir, "@rubrica/core");
  if (!coreDir) return null;
  const index = join(coreDir, "src/components/index.ts");
  const ident = findBlockMapping(readFileSync(index, "utf-8"), type);
  if (!ident) return null;
  const file = fileExporting(filesUnder(join(coreDir, "src/components")), ident);
  if (!file) return null;
  return { pkg: "@rubrica/core", version: String(readJson(join(coreDir, "package.json")).version), pkgDir: coreDir, file, component: ident };
}

/** Caminhos internos do núcleo → exportação pública equivalente. */
const CORE_PUBLIC: [string, string][] = [
  ["src/components/primitives", "@rubrica/core/components"],
  ["src/components/index", "@rubrica/core/components"],
  ["src/blocks/catalog", "@rubrica/core/blocks"],
  ["src/render", "@rubrica/core/render"],
  ["src/islands", "@rubrica/core/islands"],
  ["src/seo", "@rubrica/core/seo"],
  ["src/theme/recipes", "@rubrica/core"],
  ["src/theme/contract", "@rubrica/core"],
  ["src/blocks", "@rubrica/core"],
  ["src/content", "@rubrica/core"],
  ["src/i18n", "@rubrica/core"],
  ["src/plugins", "@rubrica/core/plugins"],
];

export interface EjectPlan {
  /** Arquivos a gravar (relativos ao projeto). */
  files: Record<string, string>;
  /** Arquivo que a integração passa a usar. */
  entry: string;
  folder: string;
  hash: string;
  sourceFile: string;
}

/** Monta a cópia (puro sobre o disco do pacote: só lê). */
export function planEject(source: ComponentSource, type: string): EjectPlan {
  const folder = `src/overrides/${type}`;
  // Base da cópia: o núcleo espelha a partir de src/components; o tema, de src/.
  const copyRoot = source.pkg === "@rubrica/core" ? join(source.pkgDir, "src/components") : join(source.pkgDir, "src");
  const files: Record<string, string> = {};
  const pending = [source.file];
  const done = new Set<string>();
  while (pending.length) {
    const file = pending.pop()!;
    if (done.has(file)) continue;
    done.add(file);
    let code = readFileSync(file, "utf-8");
    code = code.replace(/(from\s+|import\s*\(\s*|import\s+)(["'])(\.[^"']*)\2/g, (whole, lead: string, quote: string, spec: string) => {
      const target = resolveLocal(file, spec);
      if (!target) return whole;
      const relToPkg = relative(source.pkgDir, target).split(sep).join("/").replace(/\.(tsx?|jsx?)$/, "");
      if (source.pkg === "@rubrica/core") {
        const mapped = CORE_PUBLIC.find(([prefix]) => relToPkg === prefix || relToPkg.startsWith(`${prefix}/`));
        if (mapped) return `${lead}${quote}${mapped[1]}${quote}`;
      }
      if (!target.startsWith(copyRoot + sep)) {
        throw new Error(`O componente importa ${spec}, fora do que dá para copiar (${relToPkg}). Ejetar este bloco ainda não é possível.`);
      }
      if (/\.(css|json|svg|png)$/.test(target)) return whole;
      pending.push(target);
      return whole;
    });
    files[`${folder}/${relative(copyRoot, file).split(sep).join("/")}`] = code;
  }
  const mainRel = relative(copyRoot, source.file).split(sep).join("/").replace(/\.(tsx?|jsx?)$/, "");
  const entry = `${folder}/index.tsx`;
  files[entry] = [
    `/**`,
    ` * Bloco "${type}" ejetado de ${source.pkg} ${source.version} (${source.component}, em`,
    ` * ${relative(source.pkgDir, source.file).split(sep).join("/")}). Este projeto usa esta cópia no lugar do original:`,
    ` * você cuida dela agora. O \`npx create-rubrica update\` avisa quando o original mudar.`,
    ` * Regras: componente React puro (só props), textos por campo do bloco ou ctx.t().`,
    ` */`,
    `export { ${source.component} as default } from "./${mainRel}";`,
    "",
  ].join("\n");
  return { files, entry, folder, hash: hashText(componentSegment(readFileSync(source.file, "utf-8"), source.component)), sourceFile: relative(source.pkgDir, source.file).split(sep).join("/") };
}
