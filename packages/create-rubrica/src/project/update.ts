/**
 * Plano do `update` (decisão 20): o que a versão nova pede além de subir os pacotes.
 * Puro: recebe o que está no disco e no pacote instalado e devolve o que fazer.
 */
import type { CoreMigration } from "./introspect.js";
import { convexFiles, convexOwnedFiles, GENERATED_HEADER } from "./convex.js";

export interface PackageBump {
  pkg: string;
  from: string | null;
  to: string;
  /** Pacote local (`link:`): não muda de versão, só regenera. */
  local?: boolean;
}

export interface UpdatePlanInput {
  packages: PackageBump[];
  /** Funções por módulo do núcleo que vai ficar instalado (vazio: não sei, não mexo nos módulos). */
  modules: Record<string, readonly string[]>;
  /** Conteúdo atual dos arquivos do convex/ (caminho → texto). */
  convexOnDisk: Record<string, string>;
  /** Migrações declaradas pelo núcleo. */
  migrations: CoreMigration[];
  /** Versão do núcleo antes da atualização (o `version` do rubrica.json). */
  fromVersion: string;
  ejected: { tipo: string; status: "igual" | "mudou" | "sumiu"; arquivo: string; original?: string }[];
}

export interface UpdatePlan {
  packages: PackageBump[];
  convex: { write: string[]; create: string[]; remove: string[]; keepOwned: string[] };
  files: Record<string, string>;
  migrations: CoreMigration[];
  ejectedChanged: UpdatePlanInput["ejected"];
}

/** `2.1.0` > `2.0.0-alpha.0`? Compara major.minor.patch e trata pré-lançamento como anterior. */
export function compareVersions(a: string, b: string): number {
  const parse = (v: string) => {
    const [core = "0", pre] = v.replace(/^v/, "").split("-", 2);
    return { nums: core.split(".").map((n) => parseInt(n, 10) || 0), pre };
  };
  const x = parse(a);
  const y = parse(b);
  for (let i = 0; i < 3; i++) {
    const d = (x.nums[i] ?? 0) - (y.nums[i] ?? 0);
    if (d) return d;
  }
  if (x.pre === y.pre) return 0;
  if (!x.pre) return 1;
  if (!y.pre) return -1;
  return x.pre.localeCompare(y.pre, "en", { numeric: true });
}

export function planUpdate(input: UpdatePlanInput): UpdatePlan {
  const generated = convexFiles(input.modules);
  const write: string[] = [];
  const create: string[] = [];
  for (const [path, content] of Object.entries(generated)) {
    const current = input.convexOnDisk[path];
    if (current === undefined) create.push(path);
    else if (current !== content) write.push(path);
  }
  // Arquivo gerado de um módulo que o núcleo não tem mais (só com a lista do núcleo em mãos).
  const known = Object.keys(input.modules).length > 0;
  const remove = Object.entries(input.convexOnDisk)
    .filter(() => known)
    .filter(([path, content]) => path.startsWith("convex/rubrica/") && content.startsWith(GENERATED_HEADER) && !(path in generated))
    .map(([path]) => path);
  const owned = convexOwnedFiles();
  const keepOwned = Object.keys(owned).filter((p) => p in input.convexOnDisk);
  const files: Record<string, string> = {};
  for (const p of [...write, ...create]) files[p] = generated[p]!;
  for (const [p, content] of Object.entries(owned)) if (!(p in input.convexOnDisk)) {
    files[p] = content;
    create.push(p);
  }
  const target = input.packages.find((p) => p.pkg === "@rubrica/core")?.to ?? input.fromVersion;
  const migrations = input.migrations.filter((m) => compareVersions(m.since, input.fromVersion) > 0 && compareVersions(m.since, target) <= 0);
  return {
    packages: input.packages,
    convex: { write, create, remove, keepOwned },
    files,
    migrations,
    ejectedChanged: input.ejected.filter((e) => e.status !== "igual"),
  };
}

export function formatPlan(plan: UpdatePlan): string {
  const lines: string[] = [];
  lines.push("Pacotes:");
  for (const p of plan.packages) lines.push(p.local ? `  ${p.pkg}: pacote local (${p.from ?? "?"}), sem troca de versão` : p.from === p.to ? `  ${p.pkg}: ${p.to} (já na mais recente)` : `  ${p.pkg}: ${p.from ?? "não instalado"} → ${p.to}`);
  const { write, create, remove } = plan.convex;
  lines.push(write.length || create.length || remove.length ? "convex/ (gerado, regenerado pelo update):" : "convex/: em dia com o núcleo instalado.");
  for (const p of write) lines.push(`  atualizar ${p}`);
  for (const p of create) lines.push(`  criar ${p}`);
  for (const p of remove) lines.push(`  apagar ${p} (o módulo saiu do núcleo)`);
  if (plan.migrations.length) {
    lines.push("Migrações de dados (rodar no Convex de desenvolvimento; produção só com ok):");
    for (const m of plan.migrations) lines.push(`  ${m.id} (desde ${m.since}): ${m.description} → npx convex run ${m.fn}${m.args ? ` '${JSON.stringify(m.args)}'` : ""}`);
  } else {
    lines.push("Migrações de dados: nenhuma declarada.");
  }
  if (plan.ejectedChanged.length) {
    lines.push("Componentes ejetados cujo original mudou (compare e traga as correções):");
    for (const e of plan.ejectedChanged) lines.push(e.status === "mudou" ? `  ${e.tipo}: ${e.arquivo} ↔ ${e.original}` : `  ${e.tipo}: ${e.arquivo} (o original não existe mais: veja as notas da versão)`);
  } else {
    lines.push("Componentes ejetados: nenhum com original mudado.");
  }
  return lines.join("\n");
}
