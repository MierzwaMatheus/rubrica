/**
 * Fonte da coleção de um bloco que lista itens (decisão 12): automática (filtros,
 * quantidade, ordem) ou itens escolhidos à mão, nessa ordem.
 */
import { Component, useId, type ReactNode } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import type { BlockDefinition } from "../../blocks/define";
import type { CollectionName, CollectionQuery } from "../../content/types";
import type { Locale } from "../../i18n";
import { api, type CollectionDoc } from "../data/api";
import { useQuery } from "../data/backend";
import { errorMessage, moveItem } from "./model";
import { Button } from "../ui/button";
import { Input, Label, NativeSelect } from "../ui/form";
import { Switch } from "../ui/tabs";

export const COLLECTION_LABELS: Record<CollectionName, string> = {
  posts: "Posts do blog",
  projects: "Projetos",
  services: "Serviços",
  testimonials: "Depoimentos",
  faq: "Perguntas frequentes",
  resume: "Currículo",
  routine: "Dia a dia",
  plans: "Planos",
  team: "Equipe",
};

function textOf(value: unknown, locale: Locale): string | undefined {
  if (typeof value === "string") return value || undefined;
  if (value && typeof value === "object") {
    const map = value as Record<string, string>;
    return map[locale] || Object.values(map).find(Boolean);
  }
  return undefined;
}

/** Nome do item na lista do painel, pelo campo mais descritivo de cada coleção. */
export function itemLabel(doc: CollectionDoc, locale: Locale): string {
  for (const key of ["title", "name", "question", "author", "quote"]) {
    const text = textOf(doc[key], locale);
    if (text) return text.replace(/<[^>]*>/g, "").slice(0, 80);
  }
  return doc._id;
}

class Boundary extends Component<{ children: ReactNode }, { error?: unknown }> {
  state: { error?: unknown } = {};
  static getDerivedStateFromError(error: unknown) {
    return { error };
  }
  render() {
    if (this.state.error) return <p className="text-xs text-destructive">Não foi possível listar os itens: {errorMessage(this.state.error)}</p>;
    return this.props.children;
  }
}

function ManualItems({ query, locale, onChange }: { query: CollectionQuery; locale: Locale; onChange: (q: CollectionQuery) => void }) {
  const docs = useQuery(api.collection(query.collection).list, {});
  if (!docs) return <p className="text-xs text-muted-foreground">Carregando itens…</p>;
  const available = docs.filter((d) => d.deletedAt === undefined);
  const ids = query.ids ?? [];
  const byId = new Map(available.map((d) => [d._id, d]));
  const set = (next: string[]) => onChange({ ...query, ids: next });
  return (
    <div className="space-y-2">
      {ids.length > 0 && (
        <ol className="space-y-1" aria-label="Itens escolhidos">
          {ids.map((id, i) => (
            <li key={id} className="flex items-center gap-1 rounded border px-2 py-1 text-sm">
              <span className="flex-1 truncate">
                {byId.get(id) ? itemLabel(byId.get(id)!, locale) : <em className="text-muted-foreground">item apagado</em>}
                {byId.get(id)?.published === false && <span className="ml-1 text-xs text-warning">(rascunho)</span>}
              </span>
              <Button variant="ghost" size="icon-sm" aria-label="Subir" disabled={i === 0} onClick={() => set(moveItem(ids, i, i - 1))}>
                <ChevronUp />
              </Button>
              <Button variant="ghost" size="icon-sm" aria-label="Descer" disabled={i === ids.length - 1} onClick={() => set(moveItem(ids, i, i + 1))}>
                <ChevronDown />
              </Button>
              <Button variant="ghost" size="icon-sm" aria-label="Tirar da lista" onClick={() => set(ids.filter((x) => x !== id))}>
                <X />
              </Button>
            </li>
          ))}
        </ol>
      )}
      <NativeSelect
        aria-label="Acrescentar item"
        value=""
        onChange={(e) => e.target.value && set([...ids, e.target.value])}
      >
        <option value="">+ Acrescentar item…</option>
        {available
          .filter((d) => !ids.includes(d._id))
          .map((d) => (
            <option key={d._id} value={d._id}>
              {itemLabel(d, locale)}
              {d.published === false ? " (rascunho)" : ""}
            </option>
          ))}
      </NativeSelect>
      {available.length === 0 && <p className="text-xs text-muted-foreground">A coleção está vazia.</p>}
    </div>
  );
}

export function SourceEditor({ def, value, onChange, locale }: { def: BlockDefinition; value: CollectionQuery | undefined; onChange: (q: CollectionQuery) => void; locale: Locale }) {
  const id = useId();
  if (!def.source) return null;
  const query = value ?? def.source.default;
  const manual = query.ids !== undefined;
  const patch = (p: Partial<CollectionQuery>) => {
    const next = { ...query, ...p } as CollectionQuery & Record<string, unknown>;
    for (const k of Object.keys(next)) if (next[k] === undefined) delete next[k];
    onChange(next);
  };
  return (
    <fieldset className="space-y-3 rounded-md border bg-muted/40 p-3">
      <legend className="px-1 text-sm font-medium">Itens da coleção</legend>
      {def.source.collections.length > 1 && (
        <div className="space-y-1">
          <Label htmlFor={`${id}-c`}>Coleção</Label>
          <NativeSelect id={`${id}-c`} value={query.collection} onChange={(e) => onChange({ collection: e.target.value as CollectionName })}>
            {def.source.collections.map((c) => (
              <option key={c} value={c}>
                {COLLECTION_LABELS[c]}
              </option>
            ))}
          </NativeSelect>
        </div>
      )}
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={`${id}-m`}>Escolher os itens à mão</Label>
        <Switch id={`${id}-m`} checked={manual} onCheckedChange={(on) => patch({ ids: on ? [] : undefined })} />
      </div>
      {manual ? (
        <Boundary>
          <ManualItems query={query} locale={locale} onChange={onChange} />
        </Boundary>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-center justify-between gap-3 sm:col-span-2">
            <Label htmlFor={`${id}-f`}>Só os destaques</Label>
            <Switch id={`${id}-f`} checked={!!query.featured} onCheckedChange={(on) => patch({ featured: on || undefined })} />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`${id}-l`}>Quantidade</Label>
            <Input
              id={`${id}-l`}
              type="number"
              min={1}
              step={1}
              placeholder="Todos"
              value={query.limit ?? ""}
              onChange={(e) => patch({ limit: e.target.value ? Math.max(1, Math.floor(Number(e.target.value))) : undefined })}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor={`${id}-s`}>Ordem</Label>
            <NativeSelect id={`${id}-s`} value={query.sort ?? "order"} onChange={(e) => patch({ sort: e.target.value as "recent" | "order" })}>
              <option value="order">A definida no painel</option>
              <option value="recent">Mais novos primeiro</option>
            </NativeSelect>
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label htmlFor={`${id}-t`}>Etiquetas</Label>
            <Input
              id={`${id}-t`}
              placeholder="design, produto (vazio = todas)"
              defaultValue={(query.tags ?? []).join(", ")}
              onBlur={(e) => {
                const tags = e.target.value.split(",").map((t) => t.trim()).filter(Boolean);
                patch({ tags: tags.length ? tags : undefined });
              }}
            />
          </div>
        </div>
      )}
    </fieldset>
  );
}
