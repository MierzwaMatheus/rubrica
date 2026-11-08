/** CLI: `rubrica-testar-tema <tema> [opções]` (depois, `rubrica testar-tema`). */
import { writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { findRepoRoot, listThemes } from "./build.ts";
import { formatSite, summary } from "./report.ts";
import { testTheme } from "./index.ts";
import { DEFAULT_LIMITS, type Limits } from "./types.ts";

const HELP = `rubrica-testar-tema: bateria de testes de tema do Rubrica

Uso:
  rubrica-testar-tema <tema> [opções]       tema: "padrao" ou "@rubrica/theme-padrao"
  rubrica-testar-tema --todos [opções]      todos os temas de packages/themes/*
  rubrica-testar-tema --listar              lista os temas do monorepo

Opções:
  --site <pessoal|empresa>   testa só um tipo de site
  --sem-lighthouse           pula o Lighthouse
  --so-lighthouse            roda só o Lighthouse (pula axe, SEO e JavaScript por página)
  --js-kb <n>                limite de JavaScript (gzip) por página com ilha (padrão ${DEFAULT_LIMITS.jsKb})
  --lh-performance <n>       mínimo de performance (padrão ${DEFAULT_LIMITS.lighthouse.performance})
  --lh-acessibilidade <n>    mínimo de acessibilidade (padrão ${DEFAULT_LIMITS.lighthouse.accessibility})
  --lh-seo <n>               mínimo de SEO (padrão ${DEFAULT_LIMITS.lighthouse.seo})
  --lh-execucoes <n>         máximo de execuções do Lighthouse por página (padrão 3)
  --json <arquivo>           grava o relatório em JSON
  --verbose                  mostra também as verificações que passaram
  --manter-dist              não apaga a pasta do build
  --raiz <pasta>             raiz do monorepo (padrão: sobe a partir do diretório atual)
  -h, --help                 esta ajuda

Código de saída: 0 se tudo passou; 1 se algo falhou; 2 para erro de uso.`;

export async function main(argv: string[]): Promise<number> {
  let values, positionals;
  try {
    ({ values, positionals } = parseArgs({
      args: argv,
      allowPositionals: true,
      options: {
        site: { type: "string" },
        "sem-lighthouse": { type: "boolean" },
        "so-lighthouse": { type: "boolean" },
        "js-kb": { type: "string" },
        "lh-performance": { type: "string" },
        "lh-acessibilidade": { type: "string" },
        "lh-seo": { type: "string" },
        "lh-execucoes": { type: "string" },
        json: { type: "string" },
        verbose: { type: "boolean" },
        "manter-dist": { type: "boolean" },
        raiz: { type: "string" },
        todos: { type: "boolean" },
        listar: { type: "boolean" },
        help: { type: "boolean", short: "h" },
      },
    }));
  } catch (e) {
    console.error(`${(e as Error).message}\n\n${HELP}`);
    return 2;
  }
  if (values.help) {
    console.log(HELP);
    return 0;
  }
  if (values["sem-lighthouse"] && values["so-lighthouse"]) {
    console.error("--sem-lighthouse e --so-lighthouse não combinam.");
    return 2;
  }
  const root = values.raiz ?? findRepoRoot();
  if (values.listar) {
    console.log((await listThemes(root)).join("\n"));
    return 0;
  }
  const themes = values.todos ? await listThemes(root) : positionals;
  if (themes.length === 0) {
    console.error(`Informe o tema (ou --todos).\n\n${HELP}`);
    return 2;
  }
  const num = (v: string | undefined, fallback: number) => (v === undefined || Number.isNaN(Number(v)) ? fallback : Number(v));
  const limits: Limits = {
    jsKb: num(values["js-kb"], DEFAULT_LIMITS.jsKb),
    lighthouse: {
      performance: num(values["lh-performance"], DEFAULT_LIMITS.lighthouse.performance),
      accessibility: num(values["lh-acessibilidade"], DEFAULT_LIMITS.lighthouse.accessibility),
      seo: num(values["lh-seo"], DEFAULT_LIMITS.lighthouse.seo),
    },
  };

  let ok = true;
  const reports = [];
  for (const theme of themes) {
    const report = await testTheme({
      theme,
      root,
      limits,
      sites: values.site ? [values.site] : undefined,
      lighthouse: !values["sem-lighthouse"],
      pages: !values["so-lighthouse"],
      lighthouseRuns: num(values["lh-execucoes"], 3),
      keepDist: values["manter-dist"] ?? false,
      log: (m) => console.error(`... ${m}`),
      onSite: (site) => console.log(formatSite(site, values.verbose)),
    });
    console.log(summary(report));
    reports.push(report);
    ok &&= report.ok;
  }
  if (values.json) await writeFile(values.json, JSON.stringify(reports.length === 1 ? reports[0] : reports, null, 2));
  return ok ? 0 : 1;
}
