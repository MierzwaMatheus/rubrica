/**
 * "Cara do cliente" no editor de projeto: liga e desliga, cores do modo claro e (opcional)
 * do escuro, fonte de título. Mostra ao vivo uma amostra e os selos de contraste por modo
 * (texto/fundo ≥ 4,5:1, destaque/fundo ≥ 3:1); o problema aparece com a mensagem do núcleo.
 */
import { useId } from "react";
import { Check, TriangleAlert } from "lucide-react";
import type { CaseBrand, CaseBrandColors } from "../../content/types";
import { accentForeground, type BrandIssue, type BrandMode } from "../../theme/brand";
import { ColorInput } from "../editor/fields";
import { Button } from "../ui/button";
import { Badge, Input, Label } from "../ui/form";
import { Switch } from "../ui/tabs";
import { brandProblems, DEFAULT_DARK, defaultBrand, FONT_SUGGESTIONS, issuesAt, modeReport, type ModeReport } from "./brand";

const COLORS = [
  { key: "background", label: "Fundo" },
  { key: "foreground", label: "Texto" },
  { key: "accent", label: "Destaque" },
] as const;

const MODE_LABEL: Record<BrandMode, string> = { light: "Modo claro", dark: "Modo escuro" };

function Seal({ ok, label, ratio, min }: { ok: boolean; label: string; ratio: number | undefined; min: number }) {
  return (
    <Badge variant={ok ? "success" : "destructive"} title={`Mínimo ${min}:1`}>
      {ok ? <Check aria-hidden="true" /> : <TriangleAlert aria-hidden="true" />}
      {label} {ratio !== undefined ? `${ratio.toFixed(1)}:1` : "—"}
      <span className="sr-only">{ok ? ", contraste suficiente" : `, contraste insuficiente (mínimo ${min}:1)`}</span>
    </Badge>
  );
}

function Sample({ colors, title, font }: { colors: CaseBrandColors; title: string; font?: string }) {
  const valid = [colors.background, colors.foreground, colors.accent].every((c) => /^#[0-9a-f]{6}$/i.test(c));
  if (!valid) return null;
  return (
    <div className="rounded-md border p-4" style={{ background: colors.background, color: colors.foreground }} data-testid="brand-sample">
      <p className="text-lg font-semibold" style={font ? { fontFamily: `"${font}", system-ui, sans-serif` } : undefined}>
        {title}
      </p>
      <p className="mt-1 text-sm">Um parágrafo de exemplo sobre o fundo do cliente.</p>
      <span className="mt-3 inline-block rounded-md px-3 py-1.5 text-sm font-medium" style={{ background: colors.accent, color: accentForeground(colors.accent) }}>
        Botão de destaque
      </span>
    </div>
  );
}

function ModeEditor({
  mode,
  colors,
  onChange,
  issues,
  title,
  font,
}: {
  mode: BrandMode;
  colors: CaseBrandColors;
  onChange: (colors: CaseBrandColors) => void;
  issues: readonly BrandIssue[];
  title: string;
  font?: string;
}) {
  const uid = useId();
  const report: ModeReport = modeReport(mode, colors);
  return (
    <fieldset className="space-y-3 rounded-md border p-3">
      <legend className="px-1 text-sm font-medium">{MODE_LABEL[mode]}</legend>
      <div className="grid gap-3 sm:grid-cols-3">
        {COLORS.map(({ key, label }) => {
          const id = `${uid}-${mode}-${key}`;
          return (
            <div key={key} className="space-y-1.5">
              <Label htmlFor={id}>{label}</Label>
              <ColorInput id={id} label={`${label} (${MODE_LABEL[mode].toLowerCase()})`} value={colors[key]} invalid={issuesAt(issues, mode, key).length > 0} onChange={(v) => onChange({ ...colors, [key]: v ?? colors[key] })} />
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-2" aria-label={`Contraste, ${MODE_LABEL[mode].toLowerCase()}`}>
        <Seal ok={report.textOk} label="Texto" ratio={report.text} min={4.5} />
        <Seal ok={report.accentOk} label="Destaque" ratio={report.accent} min={3} />
      </div>
      {issues
        .filter((i) => i.mode === mode && i.path !== "fontDisplay")
        .map((i) => (
          <p key={i.path + i.message} className="text-xs text-destructive" role="alert">
            {i.message}
          </p>
        ))}
      <Sample colors={colors} title={title} font={font} />
    </fieldset>
  );
}

export function BrandPanel({ brand, onChange, title }: { brand: CaseBrand | undefined; onChange: (brand: CaseBrand | undefined) => void; title: string }) {
  const uid = useId();
  const on = !!brand && brand.enabled !== false;
  const issues = brandProblems(brand);
  const patch = (next: Partial<CaseBrand>) => onChange({ ...(brand ?? defaultBrand()), ...next });
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <label htmlFor={`${uid}-on`} className="text-sm font-medium">
            Usar a cara do cliente neste case
          </label>
          <p className="text-xs text-muted-foreground">Cores e fonte de título do cliente só dentro do case. O cabeçalho e o rodapé seguem o tema do site.</p>
        </div>
        <Switch id={`${uid}-on`} checked={on} onCheckedChange={(v) => (brand ? patch({ enabled: v }) : v && onChange(defaultBrand()))} />
      </div>
      {brand && (
        <>
          <ModeEditor mode="light" colors={brand.light} onChange={(light) => patch({ light })} issues={issues} title={title} font={brand.fontDisplay} />
          <div className="flex items-center justify-between gap-3">
            <div>
              <label htmlFor={`${uid}-dark`} className="text-sm font-medium">
                Cores próprias do modo escuro
              </label>
              <p className="text-xs text-muted-foreground">Sem elas, o modo escuro usa as mesmas cores do claro.</p>
            </div>
            <Switch
              id={`${uid}-dark`}
              checked={!!brand.dark}
              onCheckedChange={(v) => {
                if (v) patch({ dark: { ...DEFAULT_DARK } });
                else {
                  const { dark: _dark, ...rest } = brand;
                  void _dark;
                  onChange(rest);
                }
              }}
            />
          </div>
          {brand.dark && <ModeEditor mode="dark" colors={brand.dark} onChange={(dark) => patch({ dark })} issues={issues} title={title} font={brand.fontDisplay} />}
          <div className="space-y-1.5">
            <Label htmlFor={`${uid}-font`}>Fonte dos títulos</Label>
            <Input
              id={`${uid}-font`}
              list={`${uid}-fonts`}
              value={brand.fontDisplay ?? ""}
              placeholder="Ex.: Playfair Display"
              aria-invalid={issuesAt(issues, "light", "fontDisplay").length > 0 || undefined}
              onChange={(e) => {
                const { fontDisplay: _f, ...rest } = brand;
                void _f;
                onChange(e.target.value ? { ...rest, fontDisplay: e.target.value } : rest);
              }}
            />
            <datalist id={`${uid}-fonts`}>
              {FONT_SUGGESTIONS.map((f) => (
                <option key={f} value={f} />
              ))}
            </datalist>
            <p className="text-xs text-muted-foreground">O nome da família no Google Fonts. Vazio usa a fonte do tema.</p>
            {issuesAt(issues, "light", "fontDisplay").map((i) => (
              <p key={i.message} className="text-xs text-destructive" role="alert">
                {i.message}
              </p>
            ))}
          </div>
          <Button variant="ghost" size="sm" onClick={() => window.confirm("Tirar a cara do cliente deste case? As cores escolhidas se perdem.") && onChange(undefined)}>
            Tirar a cara do cliente
          </Button>
        </>
      )}
    </div>
  );
}
