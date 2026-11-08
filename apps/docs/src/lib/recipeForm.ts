/**
 * "Crie o seu": junta as escolhas do combinador com os dados da pessoa e monta o comando
 * `npx create-rubrica@latest <pasta> --tipo ... --tema ...`. Tudo acontece no navegador:
 * nada é enviado a servidor nenhum. As opções são as do `create` (packages/create-rubrica).
 */
import { normalizeUrl, validateUrl, normalizeEmail, validateEmail } from "../../../../packages/create-rubrica/src/utils/normalize";
import { onChoice, requestChoice, type CombinatorChoice } from "./combinatorStore";
import type { SiteKind } from "./previews";

const FIELDS = ["siteName", "siteUrl", "siteDescription", "authorEmail"] as const;
type Field = (typeof FIELDS)[number];

/** Textos montados no navegador, no idioma da página (JSON em #cs-i18n). */
interface FormText {
  badUrl: string;
  badEmail: string;
  missingName: string;
  missingUrl: string;
  missingEmail: string;
  and: string;
  willAsk: string;
  allSet: string;
  siteNamePh: string;
  /** Idioma marcado de início: o da página. */
  pageLocale: string;
}

interface Preset {
  id: string;
  plugins: string[];
  kinds: string[];
}

const MODE_FLAG: Record<string, string> = { light: "claro", dark: "escuro" };

/** Aspas simples, só quando o valor tem algo além de letras, números e . _ - : / @ , */
function shell(value: string): string {
  return /^[\w.:/@,+-]+$/.test(value) ? value : `'${value.replace(/'/g, `'\\''`)}'`;
}

export function projectName(value: string): string {
  return (
    value
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "meu-site"
  );
}

export function initRecipeForm(): void {
  const form = document.getElementById("cs-form") as HTMLFormElement | null;
  const code = document.getElementById("cs-cmd");
  const copy = document.getElementById("cs-copy") as HTMLButtonElement | null;
  const folder = document.getElementById("cs-folder");
  const missing = document.getElementById("cs-missing");
  if (!form || !code || !copy || !folder || !missing) return;
  const tx = JSON.parse(document.getElementById("cs-i18n")?.textContent || "{}") as FormText & { presets: Preset[] };

  let visual: CombinatorChoice | null = null;
  let kind: SiteKind = "pessoal";
  let preset = "recommended";
  const locales = new Set<string>([tx.pageLocale || "pt-BR"]);

  const input = (f: Field) => form.querySelector<HTMLInputElement>(`[name="${f}"]`)!;
  const value = (f: Field) => input(f).value.trim();

  /** Mensagem embaixo do campo; some quando o valor fica bom. */
  function hint(f: Field, text: string) {
    const el = form!.querySelector<HTMLElement>(`[data-hint="${f}"]`);
    if (el) el.textContent = text;
    input(f).setAttribute("aria-invalid", String(Boolean(text)));
  }

  function render() {
    const name = value("siteName");
    const dir = projectName(name);
    const url = value("siteUrl");
    hint("siteUrl", url && validateUrl(url) ? tx.badUrl : "");
    const email = value("authorEmail");
    hint("authorEmail", email && validateEmail(email) ? tx.badEmail : "");

    const args: string[] = [dir, "--tipo", kind];
    if (visual) {
      args.push("--tema", visual.layout, "--esquema", visual.scheme, "--modo", MODE_FLAG[visual.mode] ?? "escuro");
    }
    if (name) args.push("--nome", shell(name));
    if (url && !validateUrl(url)) args.push("--url", shell(normalizeUrl(url)));
    if (value("siteDescription")) args.push("--descricao", shell(value("siteDescription")));
    if (email && !validateEmail(email)) args.push("--email", shell(normalizeEmail(email)));
    if (!(locales.size === 1 && locales.has("pt-BR"))) args.push("--idiomas", [...locales].join(","));
    const chosen = tx.presets.find((p) => p.id === preset && p.kinds.includes(kind));
    if (chosen && chosen.id !== "recommended") args.push("--plugins", chosen.id);

    const command = `npx create-rubrica@latest ${args.join(" ")}`;
    code!.textContent = command;
    copy!.dataset.copy = command;
    folder!.textContent = dir;
    input("siteName").placeholder = tx.siteNamePh;

    const left: string[] = [];
    if (!name) left.push(tx.missingName);
    if (!url || validateUrl(url)) left.push(tx.missingUrl);
    if (!email || validateEmail(email)) left.push(tx.missingEmail);
    missing!.textContent = left.length ? tx.willAsk.replace("{list}", left.join(", ").replace(/, ([^,]*)$/, ` ${tx.and} $1`)) : tx.allSet;

    form!.querySelectorAll<HTMLButtonElement>("[data-kind]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.kind === kind)));
    form!.querySelectorAll<HTMLButtonElement>("[data-locale]").forEach((b) => b.setAttribute("aria-pressed", String(locales.has(b.dataset.locale!))));
    form!.querySelectorAll<HTMLButtonElement>("[data-preset]").forEach((b) => {
      const p = tx.presets.find((x) => x.id === b.dataset.preset);
      b.hidden = !p?.kinds.includes(kind);
      b.setAttribute("aria-pressed", String(b.dataset.preset === preset));
    });
  }

  onChoice((choice) => {
    visual = choice;
    // O tipo de site é o mesmo do combinador (o preview mostra as páginas de cada tipo).
    if (choice.kind !== kind) setKind(choice.kind);
    render();
  });

  function setKind(next: SiteKind) {
    kind = next;
    if (!tx.presets.find((x) => x.id === preset)?.kinds.includes(kind)) preset = "recommended";
  }
  form.addEventListener("input", render);
  form.addEventListener("submit", (e) => e.preventDefault());
  form.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    const k = target.closest<HTMLButtonElement>("[data-kind]");
    const l = target.closest<HTMLButtonElement>("[data-locale]");
    const p = target.closest<HTMLButtonElement>("[data-preset]");
    if (k) {
      setKind(k.dataset.kind as SiteKind);
      // O combinador troca o preview e devolve a escolha (onChoice acima).
      requestChoice({ kind });
    } else if (l) {
      const code = l.dataset.locale!;
      // O primeiro idioma marcado é o principal; sempre fica ao menos um.
      if (locales.has(code)) {
        if (locales.size > 1) locales.delete(code);
      } else locales.add(code);
    } else if (p) preset = p.dataset.preset!;
    else return;
    render();
  });
  render();
}
