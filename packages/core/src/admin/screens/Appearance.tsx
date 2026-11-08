/**
 * Aparência: tema em uso, modo de cor, tokens do tema (cores, medidas) e fontes, com a
 * prévia da página inicial já com as mudanças não salvas. Esquemas de cor prontos
 * entram aqui quando o núcleo tiver `schemes`.
 */
import { useEffect, useMemo, useState } from "react";
import { RotateCcw, Save, Undo2 } from "lucide-react";
import type { Appearance as AppearanceValue, PageRecord, SiteSettings } from "../../content/types";
import type { TokenDef } from "../../theme/contract";
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
              <CardDescription>Nomes do Google Fonts. Ainda não chegam ao site: entram com o tratamento de fontes do build.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(["fontSans", "fontMono"] as const).map((key) => (
                <div key={key} className="space-y-1.5">
                  <Label htmlFor={key}>{key === "fontSans" ? "Texto" : "Monoespaçada"}</Label>
                  <Input
                    id={key}
                    value={draft[key] ?? ""}
                    placeholder={(key === "fontSans" ? panel.theme.fonts?.sans : panel.theme.fonts?.mono) ?? "padrão do tema"}
                    onChange={(e) => setDraft({ ...draft, [key]: e.target.value || undefined })}
                  />
                </div>
              ))}
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
