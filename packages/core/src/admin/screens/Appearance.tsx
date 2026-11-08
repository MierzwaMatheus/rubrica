/**
 * Aparência: tema em uso, modo de cor, esquema de cor (conjuntos prontos que funcionam
 * com qualquer tema), tokens do tema (cores, medidas) e fontes, com a prévia da página
 * inicial já com as mudanças não salvas.
 */
import { useEffect, useMemo, useState } from "react";
import { RotateCcw, Save, Undo2 } from "lucide-react";
import type { Appearance as AppearanceValue, PageRecord, SiteSettings } from "../../content/types";
import type { TokenDef } from "../../theme/contract";
import { isSafeFamily, KNOWN_FONTS } from "../../theme/fonts";
import { SCHEMES, getScheme, type ColorScheme } from "../../theme/schemes";
import { cn } from "../lib/utils";
import { api } from "../data/api";
import { useMutation, useQuery } from "../data/backend";
import { PreviewPane } from "../editor/PreviewPane";
import { errorMessage, sameDraft } from "../editor/model";
import { PageHeader } from "../Layout";
import { useRouter } from "../lib/router";
import { toast } from "../lib/toast";
import { usePanel } from "../panel";
import { Button } from "../ui/button";
import { Alert, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label, NativeSelect, Spinner } from "../ui/form";
import { Switch } from "../ui/tabs";

const SAFE_VALUE = /^[^;{}<>]*$/;

const SWATCH_ROLES = ["bg", "surface", "primary", "accent", "accent2"] as const;

function SchemeCard({ scheme, selected, onSelect }: { scheme: ColorScheme; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn("cursor-pointer space-y-2 rounded-lg border p-3 text-left transition hover:bg-accent", selected && "border-primary ring-2 ring-primary/30")}
    >
      <span className="block text-sm font-semibold">{scheme.label}</span>
      <span className="block text-xs text-muted-foreground">{scheme.hint}</span>
      {(["light", "dark"] as const).map((mode) => (
        <span key={mode} className="flex items-center gap-1.5" aria-label={mode === "light" ? "Amostra do modo claro" : "Amostra do modo escuro"}>
          <span className="w-9 text-[10px] text-muted-foreground uppercase">{mode === "light" ? "claro" : "escuro"}</span>
          <span className="flex overflow-hidden rounded border">
            {SWATCH_ROLES.map((role) => (
              <span key={role} className="block size-5" style={{ background: scheme[mode][role] }} />
            ))}
          </span>
        </span>
      ))}
    </button>
  );
}

function FontField({ id, label, value, placeholder, onChange, mono }: { id: string; label: string; value: string | undefined; placeholder: string; onChange: (v: string | undefined) => void; mono: boolean }) {
  const options = KNOWN_FONTS.filter((f) => /mono|code/i.test(f) === mono);
  const invalid = value !== undefined && !isSafeFamily(value);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        {value !== undefined && (
          <Button variant="ghost" size="sm" onClick={() => onChange(undefined)}>
            <RotateCcw /> Padrão
          </Button>
        )}
      </div>
      <Input id={id} list={`${id}-list`} value={value ?? ""} placeholder={placeholder} aria-invalid={invalid || undefined} onChange={(e) => onChange(e.target.value || undefined)} />
      <datalist id={`${id}-list`}>
        {options.map((f) => (
          <option key={f} value={f} />
        ))}
      </datalist>
      {invalid && <p className="text-xs text-destructive">Use só o nome da família (letras, números e espaço).</p>}
    </div>
  );
}

function TokenInput({ name, def, value, onChange }: { name: string; def: TokenDef; value: string | undefined; onChange: (v: string | undefined) => void }) {
  const id = `token-${name}`;
  const current = value ?? def.default;
  const invalid = value !== undefined && !SAFE_VALUE.test(value);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id}>{def.label}</Label>
        {value !== undefined && (
          <Button variant="ghost" size="sm" onClick={() => onChange(undefined)}>
            <RotateCcw /> Padrão
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        {def.kind === "color" && /^#[0-9a-f]{6}$/i.test(current) && (
          <input type="color" aria-label={`${def.label}: escolher cor`} value={current} onChange={(e) => onChange(e.target.value)} className="h-9 w-12 cursor-pointer rounded border bg-card" />
        )}
        <Input id={id} value={value ?? ""} placeholder={def.default} aria-invalid={invalid || undefined} onChange={(e) => onChange(e.target.value || undefined)} className="font-mono" />
      </div>
      <p className="font-mono text-xs text-muted-foreground">
        --{name}
        {def.light ? ` · claro: ${def.light}` : ""}
      </p>
      {invalid && <p className="text-xs text-destructive">Valor CSS inválido.</p>}
    </div>
  );
}

export default function Appearance() {
  const panel = usePanel();
  const { block } = useRouter();
  const update = useMutation(api.settings.update);
  const snapshot = useQuery(api.site.snapshot, {});
  const saved = panel.settings?.appearance;
  const [draft, setDraft] = useState<AppearanceValue | undefined>(() => (saved ? structuredClone(saved) : undefined));
  const [locale, setLocale] = useState(panel.locales.default);
  const [busy, setBusy] = useState(false);
  const dirty = !!draft && !!saved && !sameDraft(draft, saved);

  useEffect(() => (dirty ? block("Há mudanças de aparência não salvas. Sair mesmo assim?") : undefined), [dirty, block]);
  useEffect(() => {
    if (!dirty && saved) setDraft(structuredClone(saved));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saved]);

  const previewSettings = useMemo((): SiteSettings | undefined => (panel.settings && draft ? { ...panel.settings, appearance: draft } : undefined), [panel.settings, draft]);
  const home: PageRecord | undefined = snapshot?.pages.find((p) => p.path === "/") ?? snapshot?.pages[0];

  if (!draft || !panel.settings) {
    return (
      <>
        <PageHeader title="Aparência" />
        <Alert variant="warning" className="m-6">
          O site ainda não foi configurado (rode o setup).
        </Alert>
      </>
    );
  }

  const tokens = Object.entries(panel.theme.tokens);
  const setToken = (name: string, value: string | undefined) =>
    setDraft((d) => {
      const next = { ...(d!.tokens ?? {}) };
      if (value === undefined) delete next[name];
      else next[name] = value;
      return { ...d!, tokens: Object.keys(next).length ? next : undefined };
    });

  async function save() {
    if (!draft) return;
    if (Object.values(draft.tokens ?? {}).some((v) => !SAFE_VALUE.test(v))) return toast.error("Há um valor de token inválido.");
    setBusy(true);
    try {
      const clean = { ...draft } as AppearanceValue & Record<string, unknown>;
      for (const k of Object.keys(clean)) if (clean[k] === undefined) delete clean[k];
      await update({ patch: { appearance: clean } });
      toast.success("Aparência salva. O site no ar muda na próxima publicação.");
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-full min-w-0 flex-col">
      <PageHeader
        title="Aparência"
        description={`Tema ${panel.theme.label}${panel.theme.description ? `: ${panel.theme.description}` : ""}`}
        actions={
          <>
            {dirty && (
              <Button variant="ghost" onClick={() => setDraft(structuredClone(saved!))}>
                <Undo2 /> Descartar
              </Button>
            )}
            <Button onClick={save} disabled={!dirty || busy}>
              {busy ? <Spinner /> : <Save />} Salvar
            </Button>
          </>
        }
      />
      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(340px,420px)_minmax(0,1fr)]">
        <div className="min-h-0 space-y-4 overflow-y-auto border-r p-4">
          <Card>
            <CardHeader>
              <CardTitle>Modo de cor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="color-mode">Modo padrão</Label>
                <NativeSelect id="color-mode" value={draft.colorMode} onChange={(e) => setDraft({ ...draft, colorMode: e.target.value as AppearanceValue["colorMode"] })}>
                  <option value="dark">Escuro</option>
                  <option value="light">Claro</option>
                  <option value="system">O do aparelho de quem visita</option>
                </NativeSelect>
              </div>
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="color-toggle">Botão para alternar claro e escuro</Label>
                <Switch id="color-toggle" checked={draft.colorToggle} onCheckedChange={(v) => setDraft({ ...draft, colorToggle: v })} />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Esquema de cor</CardTitle>
              <CardDescription>
                Conjuntos de cores prontos, com modo claro e escuro, que funcionam com qualquer tema. Valem sobre as cores do tema e sob os ajustes abaixo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-2 sm:grid-cols-2" role="group" aria-label="Esquemas de cor">
                {SCHEMES.map((scheme) => (
                  <SchemeCard key={scheme.id} scheme={scheme} selected={draft.scheme === scheme.id} onSelect={() => setDraft({ ...draft, scheme: scheme.id })} />
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Button variant="outline" size="sm" disabled={draft.scheme === undefined} onClick={() => setDraft({ ...draft, scheme: undefined })}>
                  <RotateCcw /> Usar o padrão do tema
                </Button>
                <span className="text-muted-foreground">
                  {draft.scheme ? `Esquema escolhido: ${getScheme(draft.scheme)?.label ?? draft.scheme}.` : panel.theme.scheme ? `Padrão do tema: ${getScheme(panel.theme.scheme)?.label ?? panel.theme.scheme}.` : "O tema usa as próprias cores."}
                </span>
              </div>
              {draft.scheme && !getScheme(draft.scheme) && <p className="text-xs text-destructive">Esquema desconhecido: o site vai ignorá-lo.</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Cores e medidas do tema</CardTitle>
              <CardDescription>Vazio usa o padrão do tema. Confira o contraste na prévia.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {tokens.length === 0 && <p className="text-sm text-muted-foreground">Este tema não expõe tokens.</p>}
              {tokens.map(([name, def]) => (
                <TokenInput key={name} name={name} def={def} value={draft.tokens?.[name]} onChange={(v) => setToken(name, v)} />
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Fontes</CardTitle>
              <CardDescription>Famílias do Google Fonts. O site baixa as fontes na hora de gerar (o visitante não fala com o Google). A prévia já usa a família escolhida.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <FontField id="fontSans" label="Texto" mono={false} value={draft.fontSans} placeholder={panel.theme.fonts?.sans ?? "padrão do tema"} onChange={(v) => setDraft({ ...draft, fontSans: v })} />
              <FontField id="fontMono" label="Monoespaçada (código e detalhes)" mono value={draft.fontMono} placeholder={panel.theme.fonts?.mono ?? "padrão do tema"} onChange={(v) => setDraft({ ...draft, fontMono: v })} />
            </CardContent>
          </Card>
        </div>
        {home ? (
          <PreviewPane className="hidden min-h-0 min-w-0 lg:flex" snapshot={snapshot} page={home} locale={locale} locales={panel.locales.locales} onLocale={setLocale} settings={previewSettings} />
        ) : (
          <p className="hidden p-6 text-sm text-muted-foreground lg:block">Publique uma página para ver a prévia aqui.</p>
        )}
      </div>
    </div>
  );
}
