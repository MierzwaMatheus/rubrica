/**
 * Textos de interface (decisão 25): menu, "ler mais", formulários, 404. Cada chave tem
 * o padrão do núcleo por idioma; o que a pessoa grava aqui o substitui. Vazio volta
 * ao padrão.
 */
import { useMemo, useState } from "react";
import { RotateCcw, Search } from "lucide-react";
import { DEFAULT_UI_TEXTS, defaultUiText } from "../../i18n/ui-texts";
import type { SiteKind } from "../../content/types";
import type { Localized } from "../../i18n";
import { api } from "../data/api";
import { useMutation, useQuery } from "../data/backend";
import { errorMessage } from "../editor/model";
import { PageHeader } from "../Layout";
import { Loading } from "../App";
import { toast } from "../lib/toast";
import { localeName, usePanel } from "../panel";
import { Button } from "../ui/button";
import { Badge, Input } from "../ui/form";

const GROUPS: Record<string, string> = {
  nav: "Navegação",
  theme: "Tema",
  common: "Comum",
  blog: "Blog",
  case: "Cases",
  resume: "Currículo",
  pricing: "Preços",
  plans: "Planos",
  location: "Localização",
  video: "Vídeo",
  contact: "Contato",
  contactForm: "Formulário de contato",
  testimonials: "Depoimentos",
  testimonialForm: "Envio de depoimento",
  hero: "Hero",
  form: "Formulários",
  footer: "Rodapé",
  notFound: "Página 404",
};

function TextRow({ k, saved, locales, kind }: { k: string; saved: Localized<string> | undefined; locales: string[]; kind: SiteKind }) {
  const set = useMutation(api.texts.set);
  const reset = useMutation(api.texts.reset);
  const [values, setValues] = useState<Localized<string>>(saved ?? {});

  async function commit(next: Localized<string>) {
    const clean = Object.fromEntries(Object.entries(next).filter(([, v]) => v?.trim()));
    const before = JSON.stringify(Object.fromEntries(Object.entries(saved ?? {}).filter(([, v]) => v?.trim())));
    if (JSON.stringify(clean) === before) return;
    try {
      await set({ key: k, value: clean });
      toast.success(`“${k}” salvo.`);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  return (
    <li className="grid gap-2 px-4 py-3 md:grid-cols-[200px_1fr_auto] md:items-start">
      <div className="space-y-1">
        <code className="text-xs break-all">{k}</code>
        {saved && <Badge variant="secondary">personalizado</Badge>}
      </div>
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(locales.length, 3)}, minmax(0, 1fr))` }}>
        {locales.map((l) => (
          <label key={l} className="space-y-1">
            <span className="text-xs text-muted-foreground">{localeName(l)}</span>
            <Input
              lang={l}
              value={values[l] ?? ""}
              placeholder={defaultUiText(k, l, kind) ?? ""}
              onChange={(e) => setValues((v) => ({ ...v, [l]: e.target.value }))}
              onBlur={() => commit(values)}
            />
          </label>
        ))}
      </div>
      <Button
        variant="ghost"
        size="sm"
        disabled={!saved}
        onClick={async () => {
          try {
            await reset({ key: k });
            setValues({});
            toast.success(`“${k}” voltou ao padrão.`);
          } catch (e) {
            toast.error(errorMessage(e));
          }
        }}
      >
        <RotateCcw /> Padrão
      </Button>
    </li>
  );
}

export default function Texts() {
  const panel = usePanel();
  const saved = useQuery(api.texts.list, {});
  const [query, setQuery] = useState("");
  const [onlyCustom, setOnlyCustom] = useState(false);
  const keys = useMemo(() => [...new Set([...Object.keys(DEFAULT_UI_TEXTS), ...Object.keys(saved ?? {})])].sort(), [saved]);
  const locales = panel.locales.locales;

  if (!saved) return <Loading />;
  const q = query.trim().toLowerCase();
  const shown = keys.filter((k) => {
    if (onlyCustom && !saved[k]) return false;
    if (!q) return true;
    const texts = [...locales.map((l) => defaultUiText(k, l, panel.kind) ?? ""), ...Object.values(saved[k] ?? {})];
    return k.toLowerCase().includes(q) || texts.some((t) => t?.toLowerCase().includes(q));
  });
  const grouped = new Map<string, string[]>();
  for (const k of shown) {
    const g = GROUPS[k.split(".")[0]!] ?? "Outros";
    grouped.set(g, [...(grouped.get(g) ?? []), k]);
  }

  return (
    <>
      <PageHeader
        title="Textos"
        description="Textos fixos da interface do site. Os títulos e chamadas de cada seção ficam nos blocos das páginas. Sem tradução num idioma, vale o principal."
      />
      <div className="space-y-4 p-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full max-w-sm">
            <Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
            <Input className="pl-8" placeholder="Buscar por chave ou texto" aria-label="Buscar texto" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={onlyCustom} onChange={(e) => setOnlyCustom(e.target.checked)} /> Só os personalizados
          </label>
          <span className="text-xs text-muted-foreground">{shown.length} textos</span>
        </div>
        {[...grouped].map(([group, list]) => (
          <section key={group} className="space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground">{group}</h2>
            <ul className="divide-y rounded-lg border bg-card">
              {list.map((k) => (
                <TextRow key={`${k}:${JSON.stringify(saved[k] ?? null)}`} k={k} saved={saved[k]} locales={locales} kind={panel.kind} />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
