/**
 * Lista de blocos da página: adicionar do catálogo (filtrado por tipo de site e
 * plugins), reordenar arrastando ou pelo teclado (Alt+↑/↓ na alça), ocultar, duplicar,
 * remover. O bloco aberto mostra a variação, a fonte da coleção e o formulário gerado
 * do schema.
 */
import { useRef, useState, type DragEvent, type KeyboardEvent } from "react";
import { AlertTriangle, ChevronDown, ChevronUp, Copy, Eye, EyeOff, GripVertical, Plus, Trash2 } from "lucide-react";
import type { BlockDefinition } from "../../blocks/define";
import type { FieldError } from "../../blocks/fields";
import type { BlockInstance } from "../../content/types";
import { cn } from "../lib/utils";
import { usePanel } from "../panel";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Badge, Input, Label, NativeSelect } from "../ui/form";
import { FieldsForm, useEditorLocale } from "./fields";
import { availableBlocks, blockSummary, blockUnavailableReason, missingLocales, missingTranslations, moveItem, type BlockError } from "./model";
import { SourceEditor } from "./SourceEditor";

export function errorsForBlock(errors: readonly BlockError[], block: BlockInstance, index: number): FieldError[] {
  return errors.filter((e) => (e.blockId ? e.blockId === block.id : e.index === index)).map(({ path, message }) => ({ path, message }));
}

export function BlockCatalog({ onPick, onClose }: { onPick: (def: BlockDefinition) => void; onClose: () => void }) {
  const panel = usePanel();
  const [filter, setFilter] = useState("");
  const blocks = availableBlocks(panel.blocks, panel.kind, panel.enabled).filter((b) => !filter || `${b.label} ${b.description} ${b.type}`.toLowerCase().includes(filter.toLowerCase()));
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Adicionar bloco</DialogTitle>
          <DialogDescription>Os blocos que este site pode usar, pelo tipo ({panel.kind}) e pelos plugins ligados.</DialogDescription>
        </DialogHeader>
        <Input autoFocus placeholder="Buscar bloco" aria-label="Buscar bloco" value={filter} onChange={(e) => setFilter(e.target.value)} />
        <ul className="grid max-h-[60vh] gap-2 overflow-y-auto sm:grid-cols-2">
          {blocks.map((b) => (
            <li key={b.type}>
              <button type="button" onClick={() => onPick(b)} className="h-full w-full cursor-pointer rounded-md border p-3 text-left hover:border-primary hover:bg-accent">
                <span className="flex items-center gap-2 font-medium">
                  {b.label}
                  {b.category !== "comum" && <Badge variant="secondary">{b.category}</Badge>}
                  {b.source && <Badge variant="outline">coleção</Badge>}
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">{b.description}</span>
              </button>
            </li>
          ))}
          {blocks.length === 0 && <li className="text-sm text-muted-foreground">Nenhum bloco encontrado.</li>}
        </ul>
      </DialogContent>
    </Dialog>
  );
}

interface CardProps {
  block: BlockInstance;
  index: number;
  count: number;
  open: boolean;
  errors: FieldError[];
  onToggle(): void;
  onChange(block: BlockInstance): void;
  onMove(to: number): void;
  onDuplicate(): void;
  onRemove(): void;
  dragging: number | null;
  setDragging(i: number | null): void;
}

function BlockCard({ block, index, count, open, errors, onToggle, onChange, onMove, onDuplicate, onRemove, dragging, setDragging }: CardProps) {
  const panel = usePanel();
  const { locale, locales } = useEditorLocale();
  const def = panel.blocks.find((b) => b.type === block.type);
  const unavailable = blockUnavailableReason(def, panel.kind, panel.enabled);
  const missing = def ? missingTranslations(def.fields, block.fields, locales) : [];
  const missingIn = missingLocales(missing);
  const variants = panel.theme.variants?.[block.type] ?? [];
  const [over, setOver] = useState(false);
  const label = def?.label ?? block.type;
  const hasErrors = errors.length > 0;

  const onKeyDown = (e: KeyboardEvent) => {
    if (!e.altKey) return;
    if (e.key === "ArrowUp" && index > 0) {
      e.preventDefault();
      onMove(index - 1);
    } else if (e.key === "ArrowDown" && index < count - 1) {
      e.preventDefault();
      onMove(index + 1);
    }
  };

  return (
    <li
      data-block-id={block.id}
      onDragOver={(e: DragEvent) => {
        if (dragging === null) return;
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e: DragEvent) => {
        e.preventDefault();
        setOver(false);
        if (dragging !== null && dragging !== index) onMove(index);
        setDragging(null);
      }}
      className={cn(
        "rounded-lg border bg-card transition-shadow",
        open && "ring-2 ring-primary/40",
        over && "border-primary",
        dragging === index && "opacity-50",
        hasErrors && "border-destructive/60",
      )}
    >
      <div className="flex items-center gap-1 p-1.5">
        <button
          type="button"
          draggable
          onDragStart={(e) => {
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", block.id);
            setDragging(index);
          }}
          onDragEnd={() => setDragging(null)}
          onKeyDown={onKeyDown}
          aria-label={`Mover ${label} (posição ${index + 1} de ${count}). Alt+seta para cima ou para baixo.`}
          className="inline-flex size-8 cursor-grab items-center justify-center rounded text-muted-foreground hover:bg-accent active:cursor-grabbing"
        >
          <GripVertical className="size-4" />
        </button>
        <button type="button" onClick={onToggle} aria-expanded={open} className="min-w-0 flex-1 cursor-pointer py-1 text-left">
          <span className="flex flex-wrap items-center gap-1.5 text-sm font-medium">
            {label}
            {!block.visible && (
              <Badge variant="secondary">
                <EyeOff /> oculto
              </Badge>
            )}
            {hasErrors && (
              <Badge variant="destructive">
                <AlertTriangle /> {errors.length} {errors.length === 1 ? "erro" : "erros"}
              </Badge>
            )}
            {missingIn.length > 0 && (
              <Badge variant="warning" title={`Falta traduzir: ${missing.map((m) => m.label).join(", ")}`}>
                falta {missingIn.join(", ")}
              </Badge>
            )}
            {unavailable && <Badge variant="warning">fora do site</Badge>}
          </span>
          <span className="block truncate text-xs text-muted-foreground">{blockSummary(block, def, locale)}</span>
        </button>
        <Button variant="ghost" size="icon-sm" aria-label={`Subir ${label}`} disabled={index === 0} onClick={() => onMove(index - 1)}>
          <ChevronUp />
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label={`Descer ${label}`} disabled={index === count - 1} onClick={() => onMove(index + 1)}>
          <ChevronDown />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={block.visible ? `Ocultar ${label}` : `Mostrar ${label}`}
          aria-pressed={!block.visible}
          onClick={() => onChange({ ...block, visible: !block.visible })}
        >
          {block.visible ? <Eye /> : <EyeOff />}
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label={`Duplicar ${label}`} onClick={onDuplicate}>
          <Copy />
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label={`Remover ${label}`} onClick={onRemove}>
          <Trash2 />
        </Button>
      </div>
      {open && (
        <div className="space-y-4 border-t p-4">
          {unavailable && <p className="rounded-md bg-warning/10 p-2 text-xs text-warning">{unavailable}: o bloco fica salvo, mas não aparece no site.</p>}
          {def?.description && <p className="text-xs text-muted-foreground">{def.description}</p>}
          {variants.length > 0 && (
            <div className="space-y-1.5">
              <Label htmlFor={`variant-${block.id}`}>Variação</Label>
              <NativeSelect
                id={`variant-${block.id}`}
                value={variants.some((v) => v.value === block.variant) ? block.variant : variants[0]!.value}
                onChange={(e) => onChange({ ...block, variant: e.target.value === variants[0]!.value ? undefined : e.target.value })}
              >
                {variants.map((v, i) => (
                  <option key={v.value} value={v.value}>
                    {v.label}
                    {i === 0 ? " (padrão)" : ""}
                  </option>
                ))}
              </NativeSelect>
              {block.variant && !variants.some((v) => v.value === block.variant) && (
                <p className="text-xs text-muted-foreground">A variação “{block.variant}” não existe no tema {panel.theme.label}; vale a padrão.</p>
              )}
            </div>
          )}
          {def?.source && <SourceEditor def={def} value={block.source} locale={locale} onChange={(source) => onChange({ ...block, source })} />}
          {errors
            .filter((e) => e.path === "" || e.path === "type" || e.path === "id" || e.path.startsWith("source"))
            .map((e) => (
              <p key={e.path + e.message} className="text-xs text-destructive" role="alert">
                {e.message}
              </p>
            ))}
          {def && <FieldsForm fields={def.fields} values={block.fields} errors={errors} missing={missing} onChange={(fields) => onChange({ ...block, fields })} />}
        </div>
      )}
    </li>
  );
}

export function BlockList({
  blocks,
  onChange,
  selected,
  onSelect,
  errors,
  onAdd,
  onDuplicate,
}: {
  blocks: BlockInstance[];
  onChange(blocks: BlockInstance[]): void;
  selected?: string;
  onSelect(id: string | undefined): void;
  errors: readonly BlockError[];
  onAdd(): void;
  onDuplicate(index: number): void;
}) {
  const [dragging, setDragging] = useState<number | null>(null);
  const [announce, setAnnounce] = useState("");
  const listRef = useRef<HTMLOListElement>(null);
  const panel = usePanel();

  const move = (from: number, to: number) => {
    if (to < 0 || to >= blocks.length) return;
    const next = moveItem(blocks, from, to);
    onChange(next);
    const def = panel.blocks.find((b) => b.type === blocks[from]!.type);
    setAnnounce(`${def?.label ?? blocks[from]!.type} na posição ${to + 1} de ${blocks.length}`);
    // Mantém o foco na alça do bloco movido.
    const id = blocks[from]!.id;
    requestAnimationFrame(() => listRef.current?.querySelector<HTMLElement>(`[data-block-id="${id}"] [draggable]`)?.focus());
  };

  return (
    <div className="space-y-2">
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
      {blocks.length === 0 && <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">A página ainda não tem blocos.</p>}
      <ol ref={listRef} className="space-y-2" aria-label="Blocos da página">
        {blocks.map((block, index) => (
          <BlockCard
            key={block.id}
            block={block}
            index={index}
            count={blocks.length}
            open={selected === block.id}
            errors={errorsForBlock(errors, block, index)}
            onToggle={() => onSelect(selected === block.id ? undefined : block.id)}
            onChange={(b) => onChange(blocks.map((x, i) => (i === index ? b : x)))}
            onMove={(to) => move(index, to)}
            onDuplicate={() => onDuplicate(index)}
            onRemove={() => {
              const def = panel.blocks.find((b) => b.type === block.type);
              if (!window.confirm(`Remover o bloco “${def?.label ?? block.type}”? Para só tirar do site, use “ocultar”.`)) return;
              onChange(blocks.filter((_, i) => i !== index));
              if (selected === block.id) onSelect(undefined);
            }}
            dragging={dragging}
            setDragging={setDragging}
          />
        ))}
      </ol>
      <Button variant="outline" className="w-full border-dashed" onClick={onAdd}>
        <Plus /> Adicionar bloco
      </Button>
    </div>
  );
}
