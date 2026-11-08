/** Lista de uma coleção: busca, filtros, ordem, publicar/despublicar, lixeira e restaurar. */
import { useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, Pencil, Plus, RotateCcw, Search, Star, Trash2 } from "lucide-react";
import { can } from "../../convex/lib/roles";
import { api, type CollectionDoc } from "../data/api";
import { useMutation, useQuery } from "../data/backend";
import { errorMessage } from "../editor/model";
import { PageHeader } from "../Layout";
import { Loading } from "../App";
import { Link } from "../lib/router";
import { toast } from "../lib/toast";
import { formatDate, plainText } from "../lib/format";
import { localeName, usePanel } from "../panel";
import { Button } from "../ui/button";
import { Badge, Input, NativeSelect } from "../ui/form";
import { itemImage, type CollectionConfig } from "./config";
import { allTags, filterItems, itemMissingLocales, moveId, type ListItem, type StatusFilter } from "./model";

const STATUS_LABELS: Record<StatusFilter, string> = { all: "Todos", published: "Publicados", draft: "Rascunhos", trash: "Lixeira" };

function sortItems(config: CollectionConfig, docs: CollectionDoc[]): CollectionDoc[] {
  if (config.reorderable) return docs;
  // Posts: mais novos primeiro (data de publicação; rascunhos pela criação).
  const when = (d: CollectionDoc) => (d.publishedAt as number | undefined) ?? (d.createdAt as number | undefined) ?? 0;
  return [...docs].sort((a, b) => when(b) - when(a));
}

function Row({
  config,
  doc,
  index,
  total,
  reorder,
  onMove,
  trash,
}: {
  config: CollectionConfig;
  doc: CollectionDoc;
  index: number;
  total: number;
  reorder: boolean;
  onMove: (delta: -1 | 1) => void;
  trash: boolean;
}) {
  const panel = usePanel();
  const col = api.collection(config.name);
  const publish = useMutation(col.publish);
  const unpublish = useMutation(col.unpublish);
  const remove = useMutation(col.remove);
  const restore = useMutation(col.restore);
  const purge = useMutation(col.removePermanently);
  const canPurge = can(panel.me.role, "purge");
  const { locale } = { locale: panel.locales.default };
  const label = config.label(doc, locale, panel.locales.default);
  const subtitle = config.subtitle?.(doc, locale, panel.locales.default);
  const missing = useMemo(() => itemMissingLocales(config.fields, config.toForm ? config.toForm(doc) : doc, panel.locales.locales), [config, doc, panel.locales.locales]);
  const image = itemImage(config, doc);
  const editHref = `${config.base}?id=${doc._id}`;
  const run = async (fn: () => Promise<unknown>, ok: string) => {
    try {
      await fn();
      toast.success(ok);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <li className="flex flex-wrap items-center gap-3 px-4 py-3" data-item-id={doc._id}>
      {reorder && (
        <div className="flex flex-col">
          <Button size="icon-sm" variant="ghost" aria-label={`Subir ${label}`} disabled={index === 0} onClick={() => onMove(-1)}>
            <ArrowUp />
          </Button>
          <Button size="icon-sm" variant="ghost" aria-label={`Descer ${label}`} disabled={index === total - 1} onClick={() => onMove(1)}>
            <ArrowDown />
          </Button>
        </div>
      )}
      {config.imageKey && (
        <div className="size-12 shrink-0 overflow-hidden rounded-md border bg-muted">{image ? <img src={image} alt="" className="size-full object-cover" loading="lazy" /> : null}</div>
      )}
      <div className="min-w-0 flex-1">
        {trash ? (
          <p className="font-medium">{label}</p>
        ) : (
          <Link to={editHref} className="font-medium hover:underline">
            {label}
          </Link>
        )}
        {subtitle && <p className="line-clamp-1 text-sm text-muted-foreground">{plainText(subtitle)}</p>}
        <p className="text-xs text-muted-foreground">
          {config.slug && typeof doc.slug === "string" && <span className="font-mono">{doc.slug}</span>}
          {config.name === "posts" && typeof doc.publishedAt === "number" && <span> · publicado em {formatDate(doc.publishedAt)}</span>}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {!trash && <Badge variant={doc.published ? "success" : "secondary"}>{doc.published ? "publicado" : "rascunho"}</Badge>}
        {trash && <Badge variant="destructive">na lixeira</Badge>}
        {doc.featured === true && (
          <Badge variant="outline" title="Em destaque">
            <Star /> destaque
          </Badge>
        )}
        {missing.length > 0 && (
          <Badge variant="warning" title={`Falta traduzir para: ${missing.map(localeName).join(", ")}`}>
            falta {missing.join(", ")}
          </Badge>
        )}
        {(doc.tags as string[] | undefined)?.slice(0, 3).map((t) => (
          <Badge key={t} variant="secondary">
            {t}
          </Badge>
        ))}
      </div>
      <div className="flex gap-1">
        {trash ? (
          canPurge ? (
            <>
              <Button size="sm" variant="outline" onClick={() => run(() => restore({ id: doc._id }), "Restaurado.")}>
                <RotateCcw /> Restaurar
              </Button>
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label={`Apagar ${label} de vez`}
                onClick={() => window.confirm(`Apagar “${label}” de vez? Não dá para desfazer.`) && run(() => purge({ id: doc._id }), "Apagado de vez.")}
              >
                <Trash2 />
              </Button>
            </>
          ) : (
            <span className="text-xs text-muted-foreground">Só a agência restaura.</span>
          )
        ) : (
          <>
            <Button asChild size="sm" variant="outline">
              <Link to={editHref}>
                <Pencil /> Editar
              </Link>
            </Button>
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label={doc.published ? `Despublicar ${label}` : `Publicar ${label}`}
              title={doc.published ? "Despublicar" : "Publicar"}
              onClick={() => run(() => (doc.published ? unpublish({ id: doc._id }) : publish({ id: doc._id })), doc.published ? "Despublicado." : "Publicado.")}
            >
              {doc.published ? <EyeOff /> : <Eye />}
            </Button>
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label={`Mandar ${label} para a lixeira`}
              onClick={() => window.confirm(`Mandar “${label}” para a lixeira? ${config.trashNote}`) && run(() => remove({ id: doc._id }), "Na lixeira.")}
            >
              <Trash2 />
            </Button>
          </>
        )}
      </div>
    </li>
  );
}

export function CollectionList({ config, extraActions, banner }: { config: CollectionConfig; extraActions?: ReactNode; banner?: ReactNode }) {
  const panel = usePanel();
  const col = api.collection(config.name);
  const docs = useQuery(col.list, { includeDeleted: true });
  const reorder = useMutation(col.reorder);
  const [filters, setFilters] = useState({ search: "", status: "all" as StatusFilter, tag: "" });
  const locale = panel.locales.default;
  const labelOf = (d: CollectionDoc) => config.label(d, locale, panel.locales.default);

  const live = useMemo(() => (docs ?? []).filter((d) => d.deletedAt === undefined), [docs]);
  const shown = useMemo(() => sortItems(config, filterItems((docs ?? []) as ListItem[] as CollectionDoc[], filters, labelOf)), [docs, filters, config]); // eslint-disable-line react-hooks/exhaustive-deps
  const tags = useMemo(() => allTags((docs ?? []) as ListItem[]), [docs]);
  const trashCount = (docs ?? []).length - live.length;
  const filtered = !!filters.search || !!filters.tag || filters.status !== "all";
  const canReorder = config.reorderable && !filtered;

  async function move(id: string, delta: -1 | 1) {
    const ids = moveId(live.map((d) => d._id), id, delta);
    try {
      await reorder({ ids });
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  return (
    <>
      <PageHeader
        title={config.title}
        description={config.description}
        actions={
          <>
            {extraActions}
            <Button asChild>
              <Link to={`${config.base}?novo=1`}>
                <Plus /> {config.feminine ? "Nova" : "Novo"} {config.singular}
              </Link>
            </Button>
          </>
        }
      />
      {banner}
      <div className="space-y-4 p-6">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-52 max-w-sm flex-1">
            <Search className="pointer-events-none absolute top-2.5 left-2.5 size-4 text-muted-foreground" aria-hidden="true" />
            <Input aria-label={`Buscar ${config.plural}`} placeholder={`Buscar ${config.plural}`} className="pl-8" value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
          </div>
          <NativeSelect aria-label="Filtrar por estado" className="w-40" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value as StatusFilter })}>
            {(Object.keys(STATUS_LABELS) as StatusFilter[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
                {s === "trash" && trashCount ? ` (${trashCount})` : ""}
              </option>
            ))}
          </NativeSelect>
          {config.tags && tags.length > 0 && (
            <NativeSelect aria-label="Filtrar por etiqueta" className="w-44" value={filters.tag} onChange={(e) => setFilters({ ...filters, tag: e.target.value })}>
              <option value="">Todas as etiquetas</option>
              {tags.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </NativeSelect>
          )}
          <p className="ml-auto text-sm text-muted-foreground">
            {shown.length} de {live.length} {live.length === 1 ? config.singular : config.plural}
          </p>
        </div>
        {docs === undefined ? (
          <Loading />
        ) : shown.length === 0 ? (
          <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            {filtered ? "Nada encontrado com esses filtros." : config.empty}
          </p>
        ) : (
          <ul className="divide-y rounded-lg border bg-card" aria-label={config.title}>
            {shown.map((doc, i) => (
              <Row key={doc._id} config={config} doc={doc} index={i} total={shown.length} reorder={canReorder && filters.status !== "trash"} trash={filters.status === "trash"} onMove={(d) => move(doc._id, d)} />
            ))}
          </ul>
        )}
        {config.reorderable && !canReorder && <p className="text-xs text-muted-foreground">Limpe a busca e os filtros para mudar a ordem.</p>}
      </div>
    </>
  );
}

