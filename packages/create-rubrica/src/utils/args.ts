/**
 * Opções dos comandos: `--nome valor`, `--nome=valor` e chaves sem valor. Opção
 * desconhecida vira erro com a lista das aceitas.
 */
export interface ArgSpec {
  /** Opções que recebem valor. */
  values?: readonly string[];
  /** Opções sem valor (liga/desliga). */
  flags?: readonly string[];
  /** Apelidos: `-y` → `yes`. */
  aliases?: Record<string, string>;
}

export interface ParsedArgs {
  positionals: string[];
  values: Record<string, string>;
  flags: Set<string>;
}

export class ArgError extends Error {}

export function parseArgs(argv: readonly string[], spec: ArgSpec): ParsedArgs {
  const values: Record<string, string> = {};
  const flags = new Set<string>();
  const positionals: string[] = [];
  const known = [...(spec.values ?? []), ...(spec.flags ?? [])];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (!arg.startsWith("-") || arg === "-") {
      positionals.push(arg);
      continue;
    }
    const alias = spec.aliases?.[arg];
    const raw = alias ?? arg.replace(/^--?/, "");
    const eq = raw.indexOf("=");
    const name = eq === -1 ? raw : raw.slice(0, eq);
    if (spec.flags?.includes(name)) {
      flags.add(name);
      continue;
    }
    if (!spec.values?.includes(name)) {
      throw new ArgError(`Opção desconhecida: ${arg}.${known.length ? ` Opções: ${known.map((k) => `--${k}`).join(", ")}.` : ""}`);
    }
    const value = eq !== -1 ? raw.slice(eq + 1) : argv[i + 1] !== undefined && !argv[i + 1]!.startsWith("--") ? argv[++i] : undefined;
    if (value === undefined || value === "") throw new ArgError(`A opção --${name} precisa de um valor.`);
    values[name] = value;
  }
  return { positionals, values, flags };
}

/** Lista separada por vírgula. */
export const list = (value: string | undefined) =>
  (value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
