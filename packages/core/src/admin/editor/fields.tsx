/**
 * Formulário gerado do schema de campos (`blocks/fields.ts`): um controle por tipo
 * (text, richText, number, boolean, select, image, link, list). Campos traduzíveis
 * mostram abas por idioma, com um ponto nos idiomas que faltam traduzir. Os erros
 * chegam por caminho (`items.0.label`) e cada controle mostra os seus.
 */
import { createContext, lazy, Suspense, useContext, useId, useState, type ReactNode } from "react";
import { ChevronDown, ChevronUp, ImagePlus, Languages, Plus, Trash2, X } from "lucide-react";
import type { FieldDef, FieldError, FieldMap, ImageField, LinkField, ListField, RawImage, RawLink, SelectField } from "../../blocks/fields";
import type { Locale, Localized } from "../../i18n";
import { api, isMissingFunction } from "../data/api";
import { useAction } from "../data/backend";
import { toast } from "../lib/toast";
import { cn } from "../lib/utils";
import { localeName } from "../lib/locale";
import { Button } from "../ui/button";
import { Input, Label, NativeSelect, Spinner, Textarea } from "../ui/form";
import { Switch } from "../ui/tabs";
import { errorsAt, hasErrorUnder, initialFields, isLocalizedField, moveItem, setField, setLocalized, type MissingTranslation, type Values } from "./model";
import { MediaPicker } from "./MediaPicker";

const RichTextEditor = lazy(() => import("./RichText"));

// ── Idioma em edição ────────────────────────────────────────────────────────

export interface EditorLocale {
  locale: Locale;
  setLocale(locale: Locale): void;
  locales: Locale[];
  defaultLocale: Locale;
  /** Plugin `translation` ligado: mostra o botão "traduzir". */
  translation: boolean;
}

const EditorLocaleContext = createContext<EditorLocale | null>(null);

export function EditorLocaleProvider({ value, children }: { value: EditorLocale; children: ReactNode }) {
  return <EditorLocaleContext.Provider value={value}>{children}</EditorLocaleContext.Provider>;
}

export function useEditorLocale(): EditorLocale {
  const ctx = useContext(EditorLocaleContext);
  if (!ctx) throw new Error("[rubrica] campo fora do EditorLocaleProvider");
  return ctx;
}

function filledIn(value: Localized<string> | undefined, locale: Locale): boolean {
  const v = value?.[locale];
  return typeof v === "string" && v.replace(/<[^>]*>/g, "").trim().length > 0;
}

/** Abas de idioma de um campo. O ponto marca o idioma sem tradução. */
export function LocaleTabs({ value, label }: { value: Localized<string> | undefined; label: string }) {
  const { locale, setLocale, locales } = useEditorLocale();
  if (locales.length < 2) return null;
  const anyFilled = locales.some((l) => filledIn(value, l));
  return (
    <div role="group" aria-label={`Idioma de ${label}`} className="flex flex-wrap gap-1">
      {locales.map((l) => {
        const missing = anyFilled && !filledIn(value, l);
        return (
          <button
            key={l}
            type="button"
            onClick={() => setLocale(l)}
            aria-pressed={l === locale}
            title={missing ? `${localeName(l)}: falta traduzir` : localeName(l)}
            className={cn(
              "inline-flex h-6 cursor-pointer items-center gap-1 rounded px-1.5 text-xs font-medium text-muted-foreground hover:bg-accent",
              l === locale && "bg-primary/10 text-primary",
            )}
          >
            {l}
            {missing && <span className="size-1.5 rounded-full bg-warning" aria-label="falta traduzir" />}
          </button>
        );
      })}
    </div>
  );
}

/** Botão "traduzir": só com o plugin `translation`; trata o backend sem a action. */
function TranslateButton({ value, onChange, html }: { value: Localized<string> | undefined; onChange: (v: Localized<string> | undefined) => void; html?: boolean }) {
  const { locale, locales, defaultLocale, translation } = useEditorLocale();
  const translate = useAction(api.translation.translate);
  const [busy, setBusy] = useState(false);
  if (!translation || filledIn(value, locale)) return null;
  const from = filledIn(value, defaultLocale) ? defaultLocale : locales.find((l) => filledIn(value, l));
  if (!from || from === locale) return null;
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          const text = await translate({ text: value![from]!, from, to: locale, html });
          onChange(setLocalized(value, locale, text));
        } catch (e) {
          toast.error(isMissingFunction(e) ? "A tradução automática ainda não está disponível neste backend." : "Não foi possível traduzir agora.");
        } finally {
          setBusy(false);
        }
      }}
    >
      {busy ? <Spinner /> : <Languages />} Traduzir de {from}
    </Button>
  );
}

// ── Peças comuns ────────────────────────────────────────────────────────────

function FieldShell({
  id,
  label,
  help,
  required,
  errors,
  tabs,
  children,
  aside,
}: {
  id: string;
  label: string;
  help?: string;
  required?: boolean;
  errors: FieldError[];
  tabs?: ReactNode;
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className="space-y-1.5" data-field-path={id}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Label htmlFor={id}>
          {label}
          {required && <span className="text-destructive" aria-hidden="true">*</span>}
        </Label>
        <div className="flex items-center gap-1">
          {aside}
          {tabs}
        </div>
      </div>
      {children}
      {help && <p className="text-xs text-muted-foreground">{help}</p>}
      {errors.map((e) => (
        <p key={e.path + e.message} className="text-xs text-destructive" role="alert">
          {e.message}
        </p>
      ))}
    </div>
  );
}

/** Texto por idioma: a entrada do idioma em edição. */
export function LocalizedTextInput({
  id,
  value,
  onChange,
  multiline,
  maxLength,
  invalid,
  placeholder,
}: {
  id: string;
  value: Localized<string> | undefined;
  onChange: (value: Localized<string> | undefined) => void;
  multiline?: boolean;
  maxLength?: number;
  invalid?: boolean;
  placeholder?: string;
}) {
  const { locale, defaultLocale } = useEditorLocale();
  const text = value?.[locale] ?? "";
  const hint = placeholder ?? (locale !== defaultLocale && value?.[defaultLocale] ? value[defaultLocale] : undefined);
  const props = {
    id,
    lang: locale,
    value: text,
    placeholder: hint,
    "aria-invalid": invalid || undefined,
    onChange: (e: { target: { value: string } }) => onChange(setLocalized(value, locale, e.target.value)),
  };
  return (
    <div className="space-y-1">
      {multiline ? <Textarea rows={3} {...props} /> : <Input {...props} />}
      {maxLength && text.length > maxLength * 0.8 && (
        <p className={cn("text-right text-xs", text.length > maxLength ? "text-destructive" : "text-muted-foreground")}>
          {text.length}/{maxLength}
        </p>
      )}
    </div>
  );
}

// ── Controles por tipo ──────────────────────────────────────────────────────

export interface ControlProps<F extends FieldDef = FieldDef> {
  def: F;
  value: unknown;
  onChange: (value: unknown) => void;
  /** Caminho a partir dos campos do bloco (para erros e traduções). */
  path: string;
  errors: readonly FieldError[];
  missing: readonly MissingTranslation[];
}

function useFieldId(path: string): string {
  return `${useId()}-${path.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
}

function TextControl({ def, value, onChange, path, errors }: ControlProps<Extract<FieldDef, { kind: "text" | "richText" }>>) {
  const id = useFieldId(path);
  const own = errorsAt(errors, path);
  const localized = isLocalizedField(def);
  const rich = def.kind === "richText";
  const multiline = def.kind === "text" && def.multiline;
  const maxLength = def.kind === "text" ? def.maxLength : undefined;
  const { locale } = useEditorLocale();

  if (!localized) {
    const text = typeof value === "string" ? value : "";
    return (
      <FieldShell id={id} label={def.label} help={def.help} required={def.required} errors={own}>
        {rich ? (
          <Suspense fallback={<Spinner />}>
            <RichTextEditor id={id} value={text} onChange={(html) => onChange(html === "<p></p>" ? undefined : html)} />
          </Suspense>
        ) : multiline ? (
          <Textarea id={id} rows={3} value={text} aria-invalid={own.length > 0 || undefined} onChange={(e) => onChange(e.target.value || undefined)} />
        ) : (
          <Input id={id} value={text} maxLength={maxLength} aria-invalid={own.length > 0 || undefined} onChange={(e) => onChange(e.target.value || undefined)} />
        )}
      </FieldShell>
    );
  }

  const map = (value ?? undefined) as Localized<string> | undefined;
  return (
    <FieldShell
      id={id}
      label={def.label}
      help={def.help}
      required={def.required}
      errors={own}
      tabs={<LocaleTabs value={map} label={def.label} />}
      aside={<TranslateButton value={map} onChange={onChange} html={rich} />}
    >
      {rich ? (
        <Suspense fallback={<Spinner />}>
          <RichTextEditor key={locale} id={id} lang={locale} value={map?.[locale] ?? ""} onChange={(html) => onChange(setLocalized(map, locale, html))} />
        </Suspense>
      ) : (
        <LocalizedTextInput id={id} value={map} onChange={onChange} multiline={multiline} maxLength={maxLength} invalid={own.length > 0} />
      )}
    </FieldShell>
  );
}

function NumberControl({ def, value, onChange, path, errors }: ControlProps<Extract<FieldDef, { kind: "number" }>>) {
  const id = useFieldId(path);
  const own = errorsAt(errors, path);
  return (
    <FieldShell id={id} label={def.label} help={def.help} required={def.required} errors={own}>
      <Input
        id={id}
        type="number"
        inputMode={def.integer ? "numeric" : "decimal"}
        min={def.min}
        max={def.max}
        step={def.integer ? 1 : "any"}
        value={typeof value === "number" ? value : ""}
        aria-invalid={own.length > 0 || undefined}
        onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
      />
    </FieldShell>
  );
}

function BooleanControl({ def, value, onChange, path, errors }: ControlProps<Extract<FieldDef, { kind: "boolean" }>>) {
  const id = useFieldId(path);
  const checked = typeof value === "boolean" ? value : (def.default ?? false);
  return (
    <div className="space-y-1" data-field-path={path}>
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={id}>{def.label}</Label>
        <Switch id={id} checked={checked} onCheckedChange={(v) => onChange(v)} />
      </div>
      {def.help && <p className="text-xs text-muted-foreground">{def.help}</p>}
      {errorsAt(errors, path).map((e) => (
        <p key={e.message} className="text-xs text-destructive" role="alert">
          {e.message}
        </p>
      ))}
    </div>
  );
}

function SelectControl({ def, value, onChange, path, errors }: ControlProps<SelectField>) {
  const id = useFieldId(path);
  const own = errorsAt(errors, path);
  const current = typeof value === "string" ? value : (def.default ?? "");
  return (
    <FieldShell id={id} label={def.label} help={def.help} required={def.required} errors={own}>
      <NativeSelect id={id} value={current} aria-invalid={own.length > 0 || undefined} onChange={(e) => onChange(e.target.value || undefined)}>
        {!def.default && !def.required && <option value="">—</option>}
        {def.options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </NativeSelect>
    </FieldShell>
  );
}

export function ImageControl({ def, value, onChange, path, errors }: ControlProps<ImageField>) {
  const id = useFieldId(path);
  const own = errorsAt(errors, path);
  const image = (value ?? undefined) as RawImage | undefined;
  const [picking, setPicking] = useState(false);
  return (
    <FieldShell id={id} label={def.label} help={def.help} required={def.required} errors={own}>
      {image?.url ? (
        <div className="space-y-2 rounded-md border p-2">
          <div className="flex items-start gap-3">
            <img src={image.url} alt="" className="size-16 shrink-0 rounded bg-muted object-cover" />
            <div className="min-w-0 flex-1 space-y-1 text-xs text-muted-foreground">
              <p className="truncate" title={image.url}>
                {image.url}
              </p>
              {image.width && image.height && (
                <p>
                  {image.width} × {image.height}
                </p>
              )}
              <div className="flex gap-1">
                <Button variant="outline" size="sm" onClick={() => setPicking(true)}>
                  Trocar
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onChange(undefined)} aria-label={`Remover ${def.label}`}>
                  <X /> Remover
                </Button>
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor={`${id}-alt`} className="text-xs">
                Texto alternativo
              </Label>
              <LocaleTabs value={image.alt} label="texto alternativo" />
            </div>
            <LocalizedTextInput id={`${id}-alt`} value={image.alt} onChange={(alt) => onChange(setField(image as unknown as Values, "alt", alt))} placeholder="Descreva a imagem para quem não a vê" />
          </div>
        </div>
      ) : (
        <Button id={id} aria-label={`Escolher ${def.label.toLowerCase()}`} variant="outline" className="w-full border-dashed" onClick={() => setPicking(true)}>
          <ImagePlus /> Escolher imagem
        </Button>
      )}
      {picking && (
        <MediaPicker
          onClose={() => setPicking(false)}
          onPick={(picked) => {
            const next: RawImage = { url: picked.url };
            if (picked.storageId) next.storageId = picked.storageId;
            const alt = image?.alt ?? picked.alt;
            if (alt && Object.keys(alt).length) next.alt = alt;
            if (picked.width) next.width = picked.width;
            if (picked.height) next.height = picked.height;
            onChange(next);
            setPicking(false);
          }}
        />
      )}
    </FieldShell>
  );
}

/** Caminhos das páginas do site, sugeridos no campo de link. */
export const LinkSuggestions = createContext<string[]>([]);

function LinkControl({ def, value, onChange, path, errors }: ControlProps<LinkField>) {
  const id = useFieldId(path);
  const own = errorsAt(errors, path);
  const link = (value ?? undefined) as RawLink | undefined;
  const suggestions = useContext(LinkSuggestions);
  const listId = `${id}-paths`;
  const update = (patch: Partial<RawLink>) => {
    const next = { label: link?.label ?? {}, href: link?.href ?? "", ...patch } as unknown as Values;
    const empty = !next.href && !Object.keys((next.label as object) ?? {}).length;
    onChange(empty ? undefined : next);
  };
  return (
    <FieldShell id={id} label={def.label} help={def.help} required={def.required} errors={own} tabs={<LocaleTabs value={link?.label} label={`rótulo de ${def.label}`} />}>
      <div className="grid gap-2 rounded-md border p-2 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor={id} className="text-xs">
            Texto do botão
          </Label>
          <LocalizedTextInput id={id} value={link?.label} onChange={(label) => update({ label: label ?? {} })} invalid={own.length > 0} />
        </div>
        <div className="space-y-1">
          <Label htmlFor={`${id}-href`} className="text-xs">
            Endereço
          </Label>
          <Input id={`${id}-href`} list={listId} value={link?.href ?? ""} placeholder="/contato, #secao ou https://…" onChange={(e) => update({ href: e.target.value })} />
          <datalist id={listId}>
            {suggestions.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
        </div>
      </div>
    </FieldShell>
  );
}

function ListControl({ def, value, onChange, path, errors, missing }: ControlProps<ListField>) {
  const id = useFieldId(path);
  const items = Array.isArray(value) ? (value as Values[]) : [];
  const [open, setOpen] = useState<number | null>(items.length === 1 ? 0 : null);
  const own = errorsAt(errors, path, "list");
  const set = (next: Values[]) => onChange(next);
  const itemLabel = def.itemLabel ?? "Item";
  const canAdd = def.max === undefined || items.length < def.max;
  const titleOf = (item: Values) => {
    for (const [k, d] of Object.entries(def.of)) {
      if (d.kind !== "text") continue;
      const v = item[k];
      const text = typeof v === "string" ? v : v && typeof v === "object" ? Object.values(v as object).find((s) => typeof s === "string" && s) : undefined;
      if (typeof text === "string" && text) return text;
    }
    return undefined;
  };
  return (
    <FieldShell id={id} label={def.label} help={def.help} required={def.required} errors={own}>
      <ol className="space-y-2">
        {items.map((item, i) => {
          const itemPath = `${path}.${i}`;
          const expanded = open === i || hasErrorUnder(errors, itemPath);
          return (
            <li key={i} className="rounded-md border">
              <div className="flex items-center gap-1 p-1 pl-2">
                <button type="button" className="min-h-8 flex-1 cursor-pointer truncate text-left text-sm" aria-expanded={expanded} onClick={() => setOpen(expanded ? null : i)}>
                  <span className="text-muted-foreground">
                    {itemLabel} {i + 1}
                  </span>
                  {titleOf(item) && <span className="ml-2">{titleOf(item)}</span>}
                </button>
                <Button variant="ghost" size="icon-sm" aria-label={`Subir ${itemLabel} ${i + 1}`} disabled={i === 0} onClick={() => set(moveItem(items, i, i - 1))}>
                  <ChevronUp />
                </Button>
                <Button variant="ghost" size="icon-sm" aria-label={`Descer ${itemLabel} ${i + 1}`} disabled={i === items.length - 1} onClick={() => set(moveItem(items, i, i + 1))}>
                  <ChevronDown />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remover ${itemLabel} ${i + 1}`}
                  disabled={def.min !== undefined && items.length <= def.min}
                  onClick={() => set(items.filter((_, j) => j !== i))}
                >
                  <Trash2 />
                </Button>
              </div>
              {expanded && (
                <div className="space-y-3 border-t p-3">
                  <FieldsForm fields={def.of} values={item} onChange={(next) => set(items.map((it, j) => (j === i ? next : it)))} prefix={itemPath} errors={errors} missing={missing} />
                </div>
              )}
            </li>
          );
        })}
      </ol>
      <Button
        variant="outline"
        size="sm"
        disabled={!canAdd}
        onClick={() => {
          set([...items, initialFields(def.of)]);
          setOpen(items.length);
        }}
      >
        <Plus /> Adicionar {itemLabel.toLowerCase()}
      </Button>
    </FieldShell>
  );
}

export function FieldControl(props: ControlProps) {
  switch (props.def.kind) {
    case "text":
    case "richText":
      return <TextControl {...(props as ControlProps<Extract<FieldDef, { kind: "text" | "richText" }>>)} />;
    case "number":
      return <NumberControl {...(props as ControlProps<Extract<FieldDef, { kind: "number" }>>)} />;
    case "boolean":
      return <BooleanControl {...(props as ControlProps<Extract<FieldDef, { kind: "boolean" }>>)} />;
    case "select":
      return <SelectControl {...(props as ControlProps<SelectField>)} />;
    case "image":
      return <ImageControl {...(props as ControlProps<ImageField>)} />;
    case "link":
      return <LinkControl {...(props as ControlProps<LinkField>)} />;
    case "list":
      return <ListControl {...(props as ControlProps<ListField>)} />;
  }
}

/** Formulário de um mapa de campos (bloco inteiro ou item de lista). */
export function FieldsForm({
  fields,
  values,
  onChange,
  prefix = "",
  errors = [],
  missing = [],
}: {
  fields: FieldMap;
  values: Values;
  onChange: (values: Values) => void;
  prefix?: string;
  errors?: readonly FieldError[];
  missing?: readonly MissingTranslation[];
}) {
  return (
    <>
      {Object.entries(fields).map(([key, def]) => (
        <FieldControl
          key={key}
          def={def}
          value={values[key]}
          path={prefix ? `${prefix}.${key}` : key}
          errors={errors}
          missing={missing}
          onChange={(v) => onChange(setField(values, key, v))}
        />
      ))}
    </>
  );
}
