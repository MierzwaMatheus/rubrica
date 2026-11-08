/**
 * "Crie o seu": junta as escolhas do combinador com os dados da pessoa e monta o comando
 * `npx create-rubrica@latest <pasta> --receita <código>`. Tudo acontece no navegador: nada é
 * enviado a servidor nenhum. O formato da receita é o do CLI (cli/src/recipe.ts).
 */
import { recipeCommand, projectNameFrom, type Recipe } from "../../../cli/src/recipe";
import { PLUGIN_PRESETS } from "../../../cli/src/plugins";
import { normalizeUrl, validateUrl, normalizeEmail, validateEmail } from "../../../cli/src/utils/normalize";
import { onChoice, type CombinatorChoice } from "./combinatorStore";

const FIELDS = ["authorName", "siteName", "siteUrl", "siteDescription", "authorEmail", "twitterHandle", "profession", "specialties"] as const;
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
}

export function initRecipeForm(): void {
  const form = document.getElementById("cs-form") as HTMLFormElement | null;
  const code = document.getElementById("cs-cmd");
  const copy = document.getElementById("cs-copy") as HTMLButtonElement | null;
  const folder = document.getElementById("cs-folder");
  const missing = document.getElementById("cs-missing");
  if (!form || !code || !copy || !folder || !missing) return;
  const tx = JSON.parse(document.getElementById("cs-i18n")?.textContent || "{}") as FormText;

  let visual: CombinatorChoice | null = null;
  let preset = PLUGIN_PRESETS[0].id;

  const input = (f: Field) => form.querySelector<HTMLInputElement>(`[name="${f}"]`)!;
  const value = (f: Field) => input(f).value.trim();

  /** Mensagem embaixo do campo; some quando o valor fica bom. */
  function hint(f: Field, text: string) {
    const el = form!.querySelector<HTMLElement>(`[data-hint="${f}"]`);
    if (el) el.textContent = text;
    input(f).setAttribute("aria-invalid", String(Boolean(text)));
  }

  function build(): Recipe {
    const recipe: Recipe = {};
    if (visual) {
      recipe.layout = visual.layout;
      recipe.scheme = visual.scheme;
      recipe.colorMode = visual.mode;
      recipe.colorModeToggle = visual.toggle;
      recipe.texture = visual.texture as Recipe["texture"];
      recipe.fontSans = visual.sans;
      recipe.fontMono = visual.mono;
    }
    recipe.plugins = [...(PLUGIN_PRESETS.find((p) => p.id === preset)?.plugins ?? [])];

    const identity: NonNullable<Recipe["identity"]> = {};
    for (const f of ["authorName", "siteName", "siteDescription", "twitterHandle", "profession", "specialties"] as const) {
      if (value(f)) identity[f] = value(f);
    }
    const url = value("siteUrl");
    hint("siteUrl", url && validateUrl(url) ? tx.badUrl : "");
    if (url && !validateUrl(url)) identity.siteUrl = normalizeUrl(url);
    const email = value("authorEmail");
    hint("authorEmail", email && validateEmail(email) ? tx.badEmail : "");
    if (email && !validateEmail(email)) identity.authorEmail = normalizeEmail(email);
    if (Object.keys(identity).length) recipe.identity = identity;
    return recipe;
  }

  function render() {
    const recipe = build();
    const name = projectNameFrom(value("siteName") || value("authorName"));
    const command = recipeCommand(name, recipe);
    code!.textContent = command;
    copy!.dataset.copy = command;
    folder!.textContent = name;
    input("siteName").placeholder = value("authorName") || tx.siteNamePh;

    const left: string[] = [];
    if (!recipe.identity?.authorName) left.push(tx.missingName);
    if (!recipe.identity?.siteUrl) left.push(tx.missingUrl);
    if (!recipe.identity?.authorEmail) left.push(tx.missingEmail);
    missing!.textContent = left.length
      ? tx.willAsk.replace("{list}", left.join(", ").replace(/, ([^,]*)$/, ` ${tx.and} $1`))
      : tx.allSet;

    form!.querySelectorAll<HTMLButtonElement>("[data-preset]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.preset === preset)));
  }

  onChoice((choice) => {
    visual = choice;
    render();
  });
  form.addEventListener("input", render);
  form.addEventListener("submit", (e) => e.preventDefault());
  form.addEventListener("click", (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-preset]");
    if (!b) return;
    preset = b.dataset.preset!;
    render();
  });
  render();
}
