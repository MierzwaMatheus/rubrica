/** Peças dos formulários de coleção: etiquetas, endereço (slug), SEO com prévia do Google e preço. */
import { useId, useState, type ReactNode } from "react";
import { AlertTriangle, Link2, Pencil, X } from "lucide-react";
import type { SeoFields } from "../../content/types";
import { isValidSlug, SLUG_MAX_LENGTH } from "../../convex/lib/slug";
import type { Localized } from "../../i18n";
import { LocaleTabs, LocalizedTextInput, ImageControl, useEditorLocale } from "../editor/fields";
import { setLocalized } from "../editor/model";
import { centsToInput, countState, formatCents, googlePreview, parseMoney, plainText, SEO_DESCRIPTION_MAX, SEO_DESCRIPTION_RANGE, SEO_TITLE_MAX, SEO_TITLE_RANGE, textIn, toCents, type CountState } from "../lib/format";
import { cn } from "../lib/utils";
import { Button } from "../ui/button";
import { Alert, Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from "../ui/form";
import { Switch } from "../ui/tabs";

export function Section({ title, description, children }: { title: string; description?: ReactNode; children: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

// ── Etiquetas ───────────────────────────────────────────────────────────────

export function TagsInput({ value, onChange, suggestions = [] }: { value: string[]; onChange: (tags: string[]) => void; suggestions?: string[] }) {
  const id = useId();
  const [text, setText] = useState("");
  const add = (raw: string) => {
    const tag = raw.trim().replace(/\s+/g, " ").slice(0, 40);
    if (!tag || value.some((t) => t.toLowerCase() === tag.toLowerCase())) return setText("");
    onChange([...value, tag]);
    setText("");
  };
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Etiquetas</Label>
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label="Etiquetas do item">
          {value.map((tag) => (
            <li key={tag}>
              <Badge variant="secondary" className="gap-1 pr-1">
                {tag}
                <button type="button" aria-label={`Remover etiqueta ${tag}`} className="cursor-pointer rounded hover:bg-accent" onClick={() => onChange(value.filter((t) => t !== tag))}>
                  <X />
                </button>
              </Badge>
            </li>
          ))}
        </ul>
      )}
      <Input
        id={id}
        list={`${id}-list`}
        value={text}
        placeholder="Digite e tecle Enter"
        onChange={(e) => {
          const v = e.target.value;
          if (v.endsWith(",")) add(v.slice(0, -1));
          else setText(v);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add(text);
          } else if (e.key === "Backspace" && !text && value.length) onChange(value.slice(0, -1));
        }}
        onBlur={() => text && add(text)}
      />
      <datalist id={`${id}-list`}>
        {suggestions.filter((s) => !value.includes(s)).map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
      <p className="text-xs text-muted-foreground">Filtram a lista no site. Enter ou vírgula adiciona.</p>
    </div>
  );
}

// ── Endereço (slug) ─────────────────────────────────────────────────────────

export function SlugPanel({
  prefix,
  value,
  saved,
  suggested,
  published,
  onChange,
  error,
}: {
  /** Parte fixa do endereço (`/blog/`). */
  prefix: string;
  /** Endereço no formulário (vazio num item novo = gerado do título). */
  value: string;
  /** Endereço gravado (item existente). */
  saved?: string;
  suggested: string;
  published: boolean;
  onChange: (slug: string) => void;
  error?: string;
}) {
  const id = useId();
  const existing = saved !== undefined;
  const [editing, setEditing] = useState(!existing);
  const invalid = value !== "" && !isValidSlug(value);
  const changed = existing && value !== saved;
  return (
    <div className="space-y-2" data-field-path="slug">
      <Label htmlFor={id}>
        <Link2 className="size-4" /> Endereço
      </Label>
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm text-muted-foreground">{prefix}</span>
        <Input
          id={id}
          className="font-mono"
          value={value}
          disabled={!editing}
          placeholder={existing ? saved : suggested || "gerado do título"}
          maxLength={SLUG_MAX_LENGTH}
          aria-invalid={invalid || !!error || undefined}
          onChange={(e) => onChange(e.target.value)}
        />
        {existing && !editing && (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            <Pencil /> Editar
          </Button>
        )}
      </div>
      {!existing && <p className="text-xs text-muted-foreground">Vazio gera do título ({suggested ? <code>{suggested}</code> : "preencha o título"}). Depois de criado, o endereço não muda sozinho.</p>}
      {existing && !changed && <p className="text-xs text-muted-foreground">O endereço não muda quando você edita o título.</p>}
      {invalid && <p className="text-xs text-destructive" role="alert">Use letras minúsculas sem acento, números, hífen e sublinhado.</p>}
      {error && <p className="text-xs text-destructive" role="alert">{error}</p>}
      {changed && (
        <Alert variant="warning">
          <AlertTriangle />
          <p>
            Mudar o endereço quebra o link antigo (<code>{prefix}{saved}</code>)
            {published ? ": quem já tem o link, ou chega pelo Google, vai ver erro 404 até o site ser publicado de novo e o buscador atualizar." : "."}{" "}
            <button type="button" className="cursor-pointer underline" onClick={() => onChange(saved!)}>
              Voltar ao endereço atual
            </button>
          </p>
        </Alert>
      )}
    </div>
  );
}

// ── SEO ─────────────────────────────────────────────────────────────────────

const COUNT_STYLE: Record<CountState, string> = {
  empty: "text-muted-foreground",
  short: "text-warning",
  good: "text-success",
  long: "text-destructive",
};
const COUNT_NOTE: Record<CountState, string> = {
  empty: "vazio: usa o do item",
  short: "curto",
  good: "bom",
  long: "o Google corta",
};

function Counter({ length, max, range }: { length: number; max: number; range: { min: number; max: number } }) {
  const state = countState(length, range);
  return (
    <p className={cn("text-right text-xs", COUNT_STYLE[state])} aria-live="polite">
      {length}/{max} · {COUNT_NOTE[state]}
    </p>
  );
}

export function SeoPanel({
  seo,
  onChange,
  fallbackTitle,
  fallbackDescription,
  fallbackImage,
  url,
  siteName,
}: {
  seo: SeoFields | undefined;
  onChange: (seo: SeoFields | undefined) => void;
  fallbackTitle: Localized<string> | undefined;
  fallbackDescription: Localized<string> | undefined;
  fallbackImage?: string;
  /** Endereço completo no idioma em edição. */
  url: (locale: string) => string;
  siteName: string;
}) {
  const { locale, defaultLocale } = useEditorLocale();
  const titleId = useId();
  const descId = useId();
  const patch = (next: Partial<SeoFields>) => {
    const merged = { ...(seo ?? {}), ...next } as Record<string, unknown>;
    for (const k of Object.keys(merged)) if (merged[k] === undefined || merged[k] === false) delete merged[k];
    onChange(Object.keys(merged).length ? (merged as SeoFields) : undefined);
  };
  const title = seo?.title?.[locale] ?? "";
  const description = seo?.description?.[locale] ?? "";
  const shownTitle = title || textIn(fallbackTitle, locale, defaultLocale);
  const shownDescription = description || plainText(textIn(fallbackDescription, locale, defaultLocale));
  const g = googlePreview({ title: shownTitle || "(sem título)", description: shownDescription, url: url(locale), siteName });
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label htmlFor={titleId}>Título para buscadores</Label>
          <LocaleTabs value={seo?.title} label="título para buscadores" />
        </div>
        <LocalizedTextInput id={titleId} value={seo?.title} onChange={(v) => patch({ title: v })} placeholder={textIn(fallbackTitle, locale, defaultLocale)} />
        <Counter length={title.length} max={SEO_TITLE_MAX} range={SEO_TITLE_RANGE} />
      </div>
      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Label htmlFor={descId}>Descrição para buscadores</Label>
          <LocaleTabs value={seo?.description} label="descrição para buscadores" />
        </div>
        <LocalizedTextInput id={descId} multiline value={seo?.description} onChange={(v) => patch({ description: v })} placeholder={plainText(textIn(fallbackDescription, locale, defaultLocale))} />
        <Counter length={description.length} max={SEO_DESCRIPTION_MAX} range={SEO_DESCRIPTION_RANGE} />
      </div>
      <ImageControl
        def={{ kind: "image", label: "Imagem de compartilhamento", help: "Aparece quando o link é compartilhado (WhatsApp, LinkedIn…). Vazio usa a capa, depois a imagem padrão do site." }}
        value={seo?.image}
        onChange={(v) => patch({ image: v as SeoFields["image"] })}
        path="seo.image"
        errors={[]}
        missing={[]}
      />
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor={`${titleId}-noindex`}>Esconder dos buscadores (noindex)</Label>
        <Switch id={`${titleId}-noindex`} checked={!!seo?.noindex} onCheckedChange={(v) => patch({ noindex: v || undefined })} />
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium">Como aparece no Google ({locale})</p>
        <div className="space-y-0.5 rounded-lg border bg-white p-4 text-left font-sans text-[#202124]" data-testid="google-preview" aria-label="Prévia do resultado no Google">
          <div className="flex items-center gap-2 text-xs text-[#4d5156]">
            <span className="grid size-6 place-items-center rounded-full bg-[#f1f3f4] text-[10px] font-semibold">{g.site.slice(0, 1).toUpperCase()}</span>
            <span className="min-w-0">
              <span className="block truncate text-sm text-[#202124]">{g.site}</span>
              <span className="block truncate">{g.breadcrumb}</span>
            </span>
          </div>
          <p className="mt-1 text-xl leading-tight text-[#1a0dab]">{g.title}</p>
          <p className="text-sm text-[#4d5156]">{g.description || "Sem descrição: o Google escolhe um trecho da página."}</p>
        </div>
        {(seo?.image?.url || fallbackImage) && (
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <img src={seo?.image?.url ?? fallbackImage} alt="" className="h-16 w-28 rounded border bg-muted object-cover" />
            Imagem ao compartilhar{seo?.image?.url ? "" : " (a capa do item)"}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Preço do plano ──────────────────────────────────────────────────────────

/** Preço em reais com formatação: digita-se `1.500,00`, guarda-se em centavos. */
export function PriceField({ cents, currency, onChange }: { cents: number | undefined; currency: string | undefined; onChange: (cents: number | undefined) => void }) {
  const id = useId();
  const [text, setText] = useState(centsToInput(cents));
  const [focused, setFocused] = useState(false);
  const parsed = text.trim() ? parseMoney(text) : undefined;
  const invalid = text.trim() !== "" && parsed === undefined;
  return (
    <div className="space-y-1.5" data-field-path="priceCents">
      <Label htmlFor={id}>Preço (R$)</Label>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">R$</span>
        <Input
          id={id}
          inputMode="decimal"
          className="max-w-44"
          value={text}
          placeholder="0,00"
          aria-invalid={invalid || undefined}
          onFocus={() => setFocused(true)}
          onChange={(e) => {
            setText(e.target.value);
            const v = e.target.value.trim() ? parseMoney(e.target.value) : undefined;
            onChange(v === undefined ? undefined : toCents(v));
          }}
          onBlur={() => {
            setFocused(false);
            if (parsed !== undefined) setText(centsToInput(toCents(parsed)));
          }}
        />
        {!focused && cents !== undefined && <Badge variant="secondary">{formatCents(cents, currency || "BRL")}</Badge>}
      </div>
      {invalid ? <p className="text-xs text-destructive" role="alert">Digite um valor, como 1.500,00.</p> : <p className="text-xs text-muted-foreground">Vazio mostra o texto livre no lugar do preço.</p>}
    </div>
  );
}
