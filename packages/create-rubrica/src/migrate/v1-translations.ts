/**
 * Arquivos de tradução do projeto v1 (`src/i18n/translations/pt-BR.ts` e `en-US.ts`).
 * Muita gente personalizou os textos ali, no código, em vez de em "Textos" do painel. O
 * `migrar` usa esses arquivos como segundo padrão dos textos: o `siteTexts` do banco
 * vence; depois vêm os arquivos do projeto; por último, o texto do template (`v1-texts.json`).
 *
 * Os arquivos são TypeScript (`export const ptBR = { ... }`). Em vez de executar o código
 * do projeto, um leitor pequeno entende o literal de objeto: chaves, strings (aspas
 * simples, duplas e crase sem `${}`), números, booleanos, listas e comentários. Valores
 * que não são texto (identificadores, expressões) são ignorados.
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const V1_TRANSLATION_FILES = { pt: "src/i18n/translations/pt-BR.ts", en: "src/i18n/translations/en-US.ts" } as const;

/** Cópia dos textos lidos, guardada antes do `migrar` tirar o código da v1. */
export const SAVED_TEXTS_FILE = "textos-v1.json";

export type ProjectTexts = Record<string, { pt?: string; en?: string }>;

type Value = string | number | boolean | null | Value[] | { [k: string]: Value } | undefined;

class Reader {
  i = 0;
  constructor(readonly src: string) {}

  fail(what: string): never {
    const line = this.src.slice(0, this.i).split("\n").length;
    throw new Error(`${what} (linha ${line})`);
  }

  space(): void {
    for (;;) {
      const c = this.src[this.i];
      if (c === undefined) return;
      if (/\s/.test(c)) this.i++;
      else if (this.src.startsWith("//", this.i)) {
        const end = this.src.indexOf("\n", this.i);
        this.i = end < 0 ? this.src.length : end + 1;
      } else if (this.src.startsWith("/*", this.i)) {
        const end = this.src.indexOf("*/", this.i + 2);
        if (end < 0) this.fail("comentário sem fim");
        this.i = end + 2;
      } else return;
    }
  }

  peek(): string | undefined {
    this.space();
    return this.src[this.i];
  }

  eat(c: string): boolean {
    if (this.peek() === c) {
      this.i++;
      return true;
    }
    return false;
  }

  string(): string {
    const quote = this.src[this.i]!;
    this.i++;
    let out = "";
    for (;;) {
      const c = this.src[this.i++];
      if (c === undefined) this.fail("texto sem fim");
      if (c === quote) return out;
      if (quote === "`" && c === "$" && this.src[this.i] === "{") this.fail("texto com ${}");
      if (c !== "\\") {
        if (c === "\n" && quote !== "`") this.fail("quebra de linha dentro de texto");
        out += c;
        continue;
      }
      const e = this.src[this.i++];
      const simple: Record<string, string> = { n: "\n", t: "\t", r: "\r", b: "\b", f: "\f", v: "\v", "0": "\0" };
      if (e === undefined) this.fail("texto sem fim");
      else if (e in simple) out += simple[e];
      else if (e === "u") {
        if (this.src[this.i] === "{") {
          const end = this.src.indexOf("}", this.i);
          out += String.fromCodePoint(parseInt(this.src.slice(this.i + 1, end), 16));
          this.i = end + 1;
        } else {
          out += String.fromCharCode(parseInt(this.src.slice(this.i, this.i + 4), 16));
          this.i += 4;
        }
      } else if (e === "x") {
        out += String.fromCharCode(parseInt(this.src.slice(this.i, this.i + 2), 16));
        this.i += 2;
      } else if (e === "\r" || e === "\n") {
        if (e === "\r" && this.src[this.i] === "\n") this.i++;
      } else out += e;
    }
  }

  key(): string {
    const c = this.peek();
    if (c === '"' || c === "'") return this.string();
    const m = /^[A-Za-z_$][\w$]*|^\d+/.exec(this.src.slice(this.i));
    if (!m) this.fail("chave inválida");
    this.i += m[0].length;
    return m[0];
  }

  /** Pula uma expressão que não é literal (até a próxima vírgula ou fechamento no mesmo nível). */
  skipExpression(): undefined {
    let depth = 0;
    for (;;) {
      const c = this.peek();
      if (c === undefined) return undefined;
      if (depth === 0 && (c === "," || c === "}" || c === "]")) return undefined;
      if (c === "'" || c === '"' || c === "`") {
        this.string();
        continue;
      }
      if (c === "{" || c === "[" || c === "(") depth++;
      if (c === "}" || c === "]" || c === ")") depth--;
      this.i++;
    }
  }

  value(): Value {
    const c = this.peek();
    if (c === "{") {
      this.i++;
      const obj: Record<string, Value> = {};
      while (!this.eat("}")) {
        if (this.src.startsWith("...", this.i)) {
          this.i += 3;
          this.skipExpression();
        } else {
          const k = this.key();
          if (!this.eat(":")) this.fail(`faltou ":" depois de ${k}`);
          obj[k] = this.value();
        }
        if (!this.eat(",") && this.peek() !== "}") this.fail("faltou vírgula");
      }
      return obj;
    }
    if (c === "[") {
      this.i++;
      const arr: Value[] = [];
      while (!this.eat("]")) {
        arr.push(this.value());
        if (!this.eat(",") && this.peek() !== "]") this.fail("faltou vírgula");
      }
      return arr;
    }
    if (c === '"' || c === "'" || c === "`") {
      const start = this.i;
      try {
        return this.string();
      } catch (err) {
        // Crase com ${}: não é texto fixo; pula.
        if (!/\$\{\}/.test((err as Error).message)) throw err;
        this.i = start;
        this.i++;
        while (this.src[this.i] !== "`" && this.i < this.src.length) this.i += this.src[this.i] === "\\" ? 2 : 1;
        this.i++;
        return undefined;
      }
    }
    const m = /^-?\d+(\.\d+)?|^true\b|^false\b|^null\b/.exec(this.src.slice(this.i));
    if (m) {
      this.i += m[0].length;
      return m[0] === "true" ? true : m[0] === "false" ? false : m[0] === "null" ? null : Number(m[0]);
    }
    return this.skipExpression();
  }
}

/** Achata `{ a: { b: "x" }, l: [{ n: "y" }] }` em `a.b` e `l.0.n` (só as folhas de texto). */
function flatten(value: Value, prefix: string, out: Record<string, string>): void {
  if (typeof value === "string") {
    if (prefix) out[prefix] = value;
    return;
  }
  if (Array.isArray(value)) value.forEach((v, i) => flatten(v, prefix ? `${prefix}.${i}` : String(i), out));
  else if (value && typeof value === "object") for (const [k, v] of Object.entries(value)) flatten(v, prefix ? `${prefix}.${k}` : k, out);
}

/**
 * Lê o objeto exportado (`export const <nome> = { ... }`, com ou sem tipo, `as const` ou
 * `satisfies`) e devolve as chaves achatadas. Lança erro se o arquivo não tiver o formato.
 */
export function parseV1Translations(source: string): Record<string, string> {
  const m = /export\s+(?:const|let|var)\s+[A-Za-z_$][\w$]*\s*(?::[^=]+)?=\s*/.exec(source) ?? /export\s+default\s+/.exec(source);
  if (!m) throw new Error("não achei o export do objeto de traduções");
  const reader = new Reader(source);
  reader.i = m.index + m[0].length;
  if (reader.peek() !== "{") reader.fail("o export não é um objeto");
  const out: Record<string, string> = {};
  flatten(reader.value(), "", out);
  return out;
}

/** Junta pt e en por chave. */
export function mergeTranslations(pt: Record<string, string> | undefined, en: Record<string, string> | undefined): ProjectTexts {
  const out: ProjectTexts = {};
  for (const [k, v] of Object.entries(pt ?? {})) out[k] = { pt: v };
  for (const [k, v] of Object.entries(en ?? {})) out[k] = { ...out[k], en: v };
  return out;
}

export interface ReadTexts {
  texts?: ProjectTexts;
  /** Arquivos lidos. */
  files: string[];
  warnings: string[];
}

/**
 * Textos dos arquivos de tradução do projeto v1. Sem os arquivos (o `migrar` já tirou o
 * código), usa a cópia guardada em `<workDir>/textos-v1.json`.
 */
export function readV1ProjectTexts(projectDir: string, workDir?: string): ReadTexts {
  const files: string[] = [];
  const warnings: string[] = [];
  const read = (rel: string): Record<string, string> | undefined => {
    const path = join(projectDir, rel);
    if (!existsSync(path)) return undefined;
    try {
      const parsed = parseV1Translations(readFileSync(path, "utf-8"));
      files.push(rel);
      return parsed;
    } catch (err) {
      warnings.push(`Não deu para ler ${rel} (${(err as Error).message}): os textos dele não foram usados; confira no painel, em Textos e nos blocos.`);
      return undefined;
    }
  };
  const pt = read(V1_TRANSLATION_FILES.pt);
  const en = read(V1_TRANSLATION_FILES.en);
  if (pt || en) return { texts: mergeTranslations(pt, en), files, warnings };
  const saved = workDir ? join(workDir, SAVED_TEXTS_FILE) : undefined;
  if (saved && existsSync(saved)) {
    try {
      return { texts: JSON.parse(readFileSync(saved, "utf-8")) as ProjectTexts, files: [saved], warnings };
    } catch {
      warnings.push(`${saved} está corrompido: os textos dos arquivos de tradução da v1 não foram usados.`);
    }
  }
  return { files, warnings };
}
