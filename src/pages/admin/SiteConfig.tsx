import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Upload } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import { AdminLayout } from "./Dashboard";
import { contrastRatio, wcagLevel } from "@/lib/colorContrast";
import { adminColors, schemeColors, COLOR_KEYS, PER_MODE_FLAG, type ColorMode, type ContractColor } from "@/lib/themeColors";

const FONT_SANS_OPTIONS = [
  { value: "Inter", label: "Inter" },
  { value: "Chakra Petch", label: "Chakra Petch" },
  { value: "Playfair Display", label: "Playfair Display" },
  { value: "Space Grotesk", label: "Space Grotesk" },
  { value: "DM Sans", label: "DM Sans" },
];

const FONT_MONO_OPTIONS = [
  { value: "JetBrains Mono", label: "JetBrains Mono" },
  { value: "Fira Code", label: "Fira Code" },
  { value: "Space Mono", label: "Space Mono" },
  { value: "IBM Plex Mono", label: "IBM Plex Mono" },
];

function isValidHex(hex: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(hex);
}

const COLOR_ROLES: { role: ContractColor; label: string; suffix: string }[] = [
  { role: "bg", label: "Fundo", suffix: "bg" },
  { role: "text", label: "Texto", suffix: "fg" },
  { role: "primary", label: "Primária", suffix: "primary" },
  { role: "accent", label: "Destaque", suffix: "accent" },
];

const MODES: { mode: ColorMode; title: string; prefix: string }[] = [
  { mode: "light", title: "Modo claro", prefix: "" },
  { mode: "dark", title: "Modo escuro", prefix: "dark-" },
];

/** Quando nem o esquema nem o admin têm a cor (ex.: CSS ainda carregando). */
const FALLBACK: Record<ColorMode, Record<ContractColor, string>> = {
  light: { bg: "#ffffff", text: "#111111", primary: "#6366f1", accent: "#f59e0b" },
  dark: { bg: "#09090b", text: "#fafafa", primary: "#6366f1", accent: "#f59e0b" },
};

type ModeColorState = Record<ColorMode, Record<ContractColor, string>>;

type ContrastBadgeProps = { hex: string; bg: string; testId: string };

function ContrastBadge({ hex, bg, testId }: ContrastBadgeProps) {
  if (!isValidHex(hex) || !isValidHex(bg)) return null;
  const ratio = contrastRatio(hex, bg);
  const level = wcagLevel(ratio);
  const colorMap = { AAA: "bg-green-600", AA: "bg-yellow-500", fail: "bg-red-500" } as const;
  const labelMap = { AAA: "✓ AAA", AA: "~ AA", fail: "✗ Falha" } as const;
  return (
    <span
      data-testid={testId}
      className={`text-foreground-strong text-xs px-2 py-0.5 rounded font-mono ${colorMap[level]}`}
    >
      {labelMap[level]} ({ratio.toFixed(1)}:1)
    </span>
  );
}

type ColorPickerProps = {
  label: string;
  testIdSuffix: string;
  value: string;
  hexInput: string;
  onNativeChange: (v: string) => void;
  onHexChange: (v: string) => void;
  bg?: string;
};

function ColorPickerField({ label, testIdSuffix, value, hexInput, onNativeChange, onHexChange, bg }: ColorPickerProps) {
  return (
    <div className="space-y-2 flex-1 min-w-0">
      <Label className="text-foreground-strong text-sm">{label}</Label>
      <div className="flex items-center gap-2 flex-wrap">
        <input
          type="color"
          data-testid={`color-picker-${testIdSuffix}-native`}
          value={value}
          onChange={(e) => onNativeChange(e.target.value)}
          className="w-9 h-9 rounded cursor-pointer border-0 bg-transparent shrink-0"
        />
        <Input
          data-testid={`color-picker-${testIdSuffix}-hex`}
          value={hexInput}
          onChange={(e) => onHexChange(e.target.value)}
          placeholder="#000000"
          className="bg-foreground/5 border-foreground/10 text-foreground-strong w-28"
          maxLength={7}
        />
        {bg && (
          <ContrastBadge
            hex={value}
            bg={bg}
            testId={`contrast-badge-${testIdSuffix}`}
          />
        )}
      </div>
      {!isValidHex(hexInput) && hexInput !== "" && (
        <span className="text-red-400 text-xs">Formato inválido. Use #rrggbb</span>
      )}
    </div>
  );
}

export default function AdminSiteConfig() {
  const rawConfig = useQuery(api.siteConfig.getPublic);
  // Cor válida usada no seletor e texto digitado no campo hex, por modo e papel.
  const [colors, setColors] = useState<ModeColorState>(FALLBACK);
  const [hexInputs, setHexInputs] = useState<ModeColorState>(FALLBACK);
  // As cores do esquema do projeto (index.css), para saber o que foi personalizado.
  const [scheme, setScheme] = useState<ModeColorState>(FALLBACK);
  const [fontSans, setFontSans] = useState("Inter");
  const [fontMono, setFontMono] = useState("JetBrains Mono");
  const [siteTitle, setSiteTitle] = useState("");
  const [siteDescription, setSiteDescription] = useState("");
  const [twitterHandle, setTwitterHandle] = useState("");
  const [seoHomeTitle, setSeoHomeTitle] = useState("");
  const [seoHomeDescription, setSeoHomeDescription] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [ogImageUrl, setOgImageUrl] = useState("");
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (rawConfig !== undefined && !initialized) {
      const cfg = Object.fromEntries(rawConfig.map((d) => [d.key, d.value]));
      // Sem cor salva, cada modo parte do esquema do projeto: salvar não pode trocar as outras cores.
      const fromCss = schemeColors();
      const saved = adminColors(new Map(Object.entries(cfg)), isValidHex);
      const base = {} as ModeColorState;
      const initial = {} as ModeColorState;
      for (const { mode } of MODES) {
        base[mode] = { ...FALLBACK[mode], ...fromCss[mode] };
        initial[mode] = { ...base[mode], ...saved[mode] };
      }
      setScheme(base);
      setColors(initial);
      setHexInputs(initial);
      setFontSans((cfg.theme_font_sans as string) || "Inter");
      setFontMono((cfg.theme_font_mono as string) || "JetBrains Mono");
      setSiteTitle((cfg.site_title as string) || "");
      setSiteDescription((cfg.site_description as string) || "");
      setTwitterHandle((cfg.twitter_handle as string) || "");
      setSeoHomeTitle((cfg.seo_home_title as string) || "");
      setSeoHomeDescription((cfg.seo_home_description as string) || "");
      setKeywords(Array.isArray(cfg.keywords) ? (cfg.keywords as string[]) : []);
      setOgImageUrl((cfg.og_image_url as string) || "");
      setInitialized(true);
    }
  }, [rawConfig, initialized]);

  const [isUploadingOg, setIsUploadingOg] = useState(false);
  const ogFileInputRef = useRef<HTMLInputElement>(null);
  const generateUploadUrl = useMutation(api.images.generateUploadUrl);
  const setOgImageMutation = useMutation(api.siteConfig.setOgImage);
  const setBatch = useMutation(api.siteConfig.setBatch);
  const [isSavingAparencia, setIsSavingAparencia] = useState(false);
  const [isSavingSeo, setIsSavingSeo] = useState(false);

  const handleSaveAparencia = async () => {
    setIsSavingAparencia(true);
    try {
      await setBatch({
        items: [
          // Igual ao esquema → vazio ("use a do esquema"); assim trocar de esquema pelo CLI continua valendo.
          ...MODES.flatMap(({ mode }) =>
            COLOR_ROLES.map(({ role }) => ({
              key: COLOR_KEYS[mode][role],
              value: colors[mode][role].toLowerCase() === scheme[mode][role].toLowerCase() ? "" : colors[mode][role],
            }))
          ),
          { key: PER_MODE_FLAG, value: true },
          { key: "theme_font_sans", value: fontSans },
          { key: "theme_font_mono", value: fontMono },
        ],
      });
      toast.success("Aparência salva com sucesso!");
    } catch {
      toast.error("Erro ao salvar aparência.");
    } finally {
      setIsSavingAparencia(false);
    }
  };

  const handleSaveSeo = async () => {
    setIsSavingSeo(true);
    try {
      await setBatch({
        items: [
          { key: "site_title", value: siteTitle },
          { key: "site_description", value: siteDescription },
          { key: "twitter_handle", value: twitterHandle },
          { key: "seo_home_title", value: seoHomeTitle },
          { key: "seo_home_description", value: seoHomeDescription },
          { key: "keywords", value: keywords },
        ],
      });
      toast.success("SEO & Identidade salvos com sucesso!");
    } catch {
      toast.error("Erro ao salvar SEO & Identidade.");
    } finally {
      setIsSavingSeo(false);
    }
  };

  function setColor(mode: ColorMode, role: ContractColor, value: string) {
    setHexInputs((prev) => ({ ...prev, [mode]: { ...prev[mode], [role]: value } }));
    if (isValidHex(value)) setColors((prev) => ({ ...prev, [mode]: { ...prev[mode], [role]: value } }));
  }

  function resetToScheme() {
    setColors(scheme);
    setHexInputs(scheme);
  }

  if (rawConfig === undefined) {
    return (
      <AdminLayout>
        <div className="p-6 text-foreground-strong/60">Carregando configurações...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
    <div className="p-6 space-y-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground-strong">Site & Aparência</h1>

      <Card className="bg-foreground/5 border-foreground/10">
        <CardHeader>
          <CardTitle className="text-foreground-strong">Aparência</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Cada modo tem as suas cores. Elas começam iguais às do esquema do projeto (escolhido no CLI) e só o que
            você mudar fica salvo aqui.
          </p>
          {MODES.map(({ mode, title, prefix }) => (
            <section key={mode} className="space-y-3" data-testid={`colors-${mode}`}>
              <h3 className="text-sm font-semibold text-foreground-strong">{title}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {COLOR_ROLES.map(({ role, label, suffix }) => (
                  <ColorPickerField
                    key={role}
                    label={label}
                    testIdSuffix={`${prefix}${suffix}`}
                    value={colors[mode][role]}
                    hexInput={hexInputs[mode][role]}
                    onNativeChange={(v) => setColor(mode, role, v)}
                    onHexChange={(v) => setColor(mode, role, v)}
                    bg={role === "bg" ? undefined : colors[mode].bg}
                  />
                ))}
              </div>
            </section>
          ))}
          <Button type="button" variant="outline" size="sm" data-testid="btn-reset-colors" onClick={resetToScheme}>
            Usar as cores do esquema
          </Button>

          <div className="space-y-2">
            <Label className="text-foreground-strong">Fonte principal</Label>
            <Select value={fontSans} onValueChange={setFontSans}>
              <SelectTrigger data-testid="select-font-sans" className="bg-foreground/5 border-foreground/10 text-foreground-strong">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_SANS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground-strong">Fonte mono</Label>
            <Select value={fontMono} onValueChange={setFontMono}>
              <SelectTrigger data-testid="select-font-mono" className="bg-foreground/5 border-foreground/10 text-foreground-strong">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_MONO_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            data-testid="btn-save-aparencia"
            onClick={handleSaveAparencia}
            disabled={isSavingAparencia}
            className="w-full"
          >
            {isSavingAparencia ? "Salvando..." : "Salvar Aparência"}
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-foreground/5 border-foreground/10">
        <CardHeader>
          <CardTitle className="text-foreground-strong">SEO & Identidade</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="text-foreground-strong">Imagem Open Graph</Label>
            {ogImageUrl && (
              <img src={ogImageUrl} alt="OG Image preview" className="w-40 h-24 object-cover rounded border border-foreground/10" />
            )}
            <div className="flex items-center gap-3">
              <Button
                type="button"
                data-testid="og-image-upload-button"
                variant="outline"
                size="sm"
                disabled={isUploadingOg}
                onClick={() => ogFileInputRef.current?.click()}
                className="border-foreground/20 text-foreground-strong/80"
              >
                <Upload className="w-4 h-4 mr-2" />
                {isUploadingOg ? "Enviando..." : "Fazer upload"}
              </Button>
              <input
                ref={ogFileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setIsUploadingOg(true);
                  try {
                    const uploadUrl = await generateUploadUrl({});
                    const result = await fetch(uploadUrl, {
                      method: "POST",
                      headers: { "Content-Type": file.type },
                      body: file,
                    });
                    const { storageId } = await result.json();
                    await setOgImageMutation({ storageId });
                    toast.success("OG Image atualizada com sucesso!");
                  } catch {
                    toast.error("Erro ao fazer upload da OG image.");
                  } finally {
                    setIsUploadingOg(false);
                    if (ogFileInputRef.current) ogFileInputRef.current.value = "";
                  }
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground-strong">Título padrão do site</Label>
            <Input
              data-testid="input-site-title"
              value={siteTitle}
              onChange={(e) => setSiteTitle(e.target.value)}
              className="bg-foreground/5 border-foreground/10 text-foreground-strong"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-foreground-strong">Descrição padrão</Label>
            <Textarea
              data-testid="textarea-site-description"
              value={siteDescription}
              onChange={(e) => setSiteDescription(e.target.value)}
              className="bg-foreground/5 border-foreground/10 text-foreground-strong"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-foreground-strong">Twitter/X handle (sem @)</Label>
            <Input
              data-testid="input-twitter-handle"
              value={twitterHandle}
              onChange={(e) => setTwitterHandle(e.target.value)}
              placeholder="usuario"
              className="bg-foreground/5 border-foreground/10 text-foreground-strong"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-foreground-strong">Keywords</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {keywords.map((kw) => (
                <Badge key={kw} variant="secondary" className="flex items-center gap-1">
                  {kw}
                  <button
                    type="button"
                    onClick={() => setKeywords(keywords.filter((k) => k !== kw))}
                    className="ml-1 hover:text-red-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <Input
              data-testid="keywords-input"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && keywordInput.trim()) {
                  e.preventDefault();
                  if (!keywords.includes(keywordInput.trim())) {
                    setKeywords([...keywords, keywordInput.trim()]);
                  }
                  setKeywordInput("");
                }
              }}
              placeholder="Digite e pressione Enter"
              className="bg-foreground/5 border-foreground/10 text-foreground-strong"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-foreground-strong">Título da página Home (SEO)</Label>
            <Input
              data-testid="input-seo-home-title"
              value={seoHomeTitle}
              onChange={(e) => setSeoHomeTitle(e.target.value)}
              className="bg-foreground/5 border-foreground/10 text-foreground-strong"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-foreground-strong">Descrição da página Home (SEO)</Label>
            <Textarea
              data-testid="textarea-seo-home-description"
              value={seoHomeDescription}
              onChange={(e) => setSeoHomeDescription(e.target.value)}
              className="bg-foreground/5 border-foreground/10 text-foreground-strong"
              rows={3}
            />
          </div>

          <Button
            data-testid="btn-save-seo"
            onClick={handleSaveSeo}
            disabled={isSavingSeo}
            className="w-full"
          >
            {isSavingSeo ? "Salvando..." : "Salvar SEO & Identidade"}
          </Button>
        </CardContent>
      </Card>
    </div>
    </AdminLayout>
  );
}
