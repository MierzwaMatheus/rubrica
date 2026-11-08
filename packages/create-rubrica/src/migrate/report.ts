/** Relatório da migração em Markdown (impresso no terminal e gravado em `.rubrica/migracao/`). */
import type { MigrationReport } from "./convert.js";
import { groupByArea, type Customization } from "./customizations.js";

export interface ReportInput {
  projectName: string;
  v1Version: string;
  layout: string;
  theme: { tema: string; temaDesejado?: string; aviso?: string };
  data?: MigrationReport;
  customizations?: Customization[];
  /** Por que a lista de personalizações não saiu (sem a v1 de referência). */
  customizationsError?: string;
  outputs?: Record<string, string>;
  nextSteps?: string[];
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export function renderReport(input: ReportInput): string {
  const out: string[] = [];
  out.push(`# Migração para a v2: ${input.projectName}`, "");
  out.push(`- Versão da v1: **${input.v1Version}**`);
  out.push(`- Layout da v1: **${input.layout}** → tema da v2: **${input.theme.temaDesejado ?? input.theme.tema}**${input.theme.temaDesejado ? ` (ainda não portado: o site usa **${input.theme.tema}** por enquanto)` : ""}`);
  if (input.theme.aviso) out.push(`- ⚠ ${input.theme.aviso}`);
  out.push("");

  if (input.data) {
    const d = input.data;
    out.push("## Dados", "");
    out.push("| Tabela v2 | De (v1) | Documentos |", "|---|---|---|");
    for (const t of d.tables) out.push(`| ${t.v2} | ${t.from} | ${t.count} |`);
    out.push("");
    out.push("### Páginas (receita do tema, preenchidas com a v1)", "");
    for (const p of d.pages) {
      out.push(`- \`${p.path}\`: ${p.blocks.length ? p.blocks.join(", ") : "**não criada** (nenhum bloco com conteúdo)"}`);
      for (const x of p.dropped) out.push(`  - fora: \`${x.type}\` (${x.reason})`);
    }
    out.push("");
    out.push("### Textos", "");
    out.push(`- Textos de seção (títulos, chamadas, botões) vão para os campos dos blocos, com o que estava no banco (${plural(d.texts.sectionKeys, "chave encontrada", "chaves encontradas")} no siteTexts), senão o dos arquivos de tradução do projeto, senão o padrão da v1.`);
    if (d.texts.projectKeys !== undefined) out.push(`- Arquivos de tradução do projeto (src/i18n/translations): ${plural(d.texts.projectKeys, "texto mudado em relação ao template", "textos mudados em relação ao template")}, usados como padrão.`);
    out.push(`- Textos de interface personalizados → "Textos": ${d.texts.ui.length ? d.texts.ui.map((u) => `\`${u.v1}\` → \`${u.v2}\``).join(", ") : "nenhum"}.`);
    if (d.texts.unmapped.length) {
      out.push(`- **Sem destino na v2** (refaça no painel, num campo de bloco ou em Textos, se ainda fizer sentido):`);
      for (const u of d.texts.unmapped) out.push(`  - \`${u.key}\`: "${u.pt}"`);
    }
    out.push("");
    out.push("### Plugins", "");
    for (const p of d.plugins) out.push(`- \`${p.v1}\` → ${p.v2 ? `\`${p.v2}\`` : "**removido na v2**"} (${p.enabled ? "ligado" : "desligado"})`);
    out.push("");
    if (d.pending.length) {
      out.push("### Sem destino na v2 (guardados como estavam em pendentes-v1.zip)", "");
      for (const p of d.pending) out.push(`- \`${p.table}\`: ${plural(p.count, "documento", "documentos")} (${p.reason})`);
      out.push("");
    }
    if (d.dropped.length || d.unknownTables.length) {
      out.push("### Não vão para a v2", "");
      for (const x of d.dropped) out.push(`- \`${x.table}\` (${x.count}): ${x.reason}`);
      for (const x of d.unknownTables) out.push(`- \`${x.table}\` (${x.count}): **tabela própria do projeto**, não convertida`);
      out.push("");
    }
    if (d.warnings.length) {
      out.push("### Avisos", "");
      for (const w of d.warnings) out.push(`- ${w}`);
      out.push("");
    }
  } else {
    out.push("## Dados", "", "Sem export da v1 ainda. Rode `npx convex export --path .rubrica/migracao/export-v1.zip` (no Convex de desenvolvimento) e depois `npx create-rubrica migrar dados --export .rubrica/migracao/export-v1.zip`.", "");
  }

  out.push("## Personalizações (comparando com a v1 de referência)", "");
  if (input.customizationsError) out.push(`Não deu para comparar: ${input.customizationsError}`, "");
  else if (!input.customizations?.length) out.push("Nenhuma: o projeto é igual à v1 montada com as mesmas escolhas.", "");
  else {
    const groups = groupByArea(input.customizations);
    out.push(`${plural(input.customizations.length, "arquivo difere", "arquivos diferem")} da v1 de referência.`, "");
    for (const [area, items] of groups) {
      out.push(`### ${area} (${items.length})`, "", `> ${items[0]!.suggestion}`, "");
      for (const c of items) out.push(`- ${c.kind}: \`${c.path}\`${c.lines ? ` (+${c.lines.added}/−${c.lines.removed})` : ""}`);
      out.push("");
    }
    out.push("O código da v1 continua no histórico do git (`git show <branch-original>:<caminho>`).", "");
  }

  if (input.outputs && Object.keys(input.outputs).length) {
    out.push("## Arquivos gerados", "");
    for (const [what, path] of Object.entries(input.outputs)) out.push(`- ${what}: \`${path}\``);
    out.push("");
  }
  if (input.nextSteps?.length) {
    out.push("## Próximos passos", "");
    input.nextSteps.forEach((s, i) => out.push(`${i + 1}. ${s}`));
    out.push("");
  }
  return out.join("\n");
}
