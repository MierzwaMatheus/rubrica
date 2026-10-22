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
      className={`text-white text-xs px-2 py-0.5 rounded font-mono ${colorMap[level]}`}
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
      <Label className="text-white text-sm">{label}</Label>
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
          className="bg-white/5 border-white/10 text-white w-28"
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
  const [bgColor, setBgColor] = useState("#09090b");
  const [bgHex, setBgHex] = useState("#09090b");
  const [fgColor, setFgColor] = useState("#fafafa");
  const [fgHex, setFgHex] = useState("#fafafa");
  const [primaryColor, setPrimaryColor] = useState("#6366f1");
  const [primaryHex, setPrimaryHex] = useState("#6366f1");
  const [accentColor, setAccentColor] = useState("#f59e0b");
  const [accentHex, setAccentHex] = useState("#f59e0b");
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
      const bg = (cfg.theme_background as string) || "#09090b";
      setBgColor(bg); setBgHex(bg);
      const fg = (cfg.theme_foreground as string) || "#fafafa";
      setFgColor(fg); setFgHex(fg);
      const primary = (cfg.theme_primary as string) || "#6366f1";
      setPrimaryColor(primary); setPrimaryHex(primary);
      const accent = (cfg.theme_accent as string) || "#f59e0b";
      setAccentColor(accent); setAccentHex(accent);
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
          { key: "theme_background", value: bgColor },
          { key: "theme_foreground", value: fgColor },
          { key: "theme_primary", value: primaryColor },
          { key: "theme_accent", value: accentColor },
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

  function makeHexHandler(setter: (v: string) => void, colorSetter: (v: string) => void) {
    return (value: string) => {
      setter(value);
      if (isValidHex(value)) colorSetter(value);
    };
  }

  if (rawConfig === undefined) {
    return (
      <AdminLayout>
        <div className="p-6 text-white/60">Carregando configurações...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
    <div className="p-6 space-y-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-white">Site & Aparência</h1>

      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Aparência</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <ColorPickerField
              label="Fundo"
              testIdSuffix="bg"
              value={bgColor}
              hexInput={bgHex}
              onNativeChange={(v) => { setBgColor(v); setBgHex(v); }}
              onHexChange={makeHexHandler(setBgHex, setBgColor)}
            />
            <ColorPickerField
              label="Texto"
              testIdSuffix="fg"
              value={fgColor}
              hexInput={fgHex}
              onNativeChange={(v) => { setFgColor(v); setFgHex(v); }}
              onHexChange={makeHexHandler(setFgHex, setFgColor)}
              bg={bgColor}
            />
            <ColorPickerField
              label="Primária"
              testIdSuffix="primary"
              value={primaryColor}
              hexInput={primaryHex}
              onNativeChange={(v) => { setPrimaryColor(v); setPrimaryHex(v); }}
              onHexChange={makeHexHandler(setPrimaryHex, setPrimaryColor)}
              bg={bgColor}
            />
            <ColorPickerField
              label="Destaque"
              testIdSuffix="accent"
              value={accentColor}
              hexInput={accentHex}
              onNativeChange={(v) => { setAccentColor(v); setAccentHex(v); }}
              onHexChange={makeHexHandler(setAccentHex, setAccentColor)}
              bg={bgColor}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white">Fonte principal</Label>
            <Select value={fontSans} onValueChange={setFontSans}>
              <SelectTrigger data-testid="select-font-sans" className="bg-white/5 border-white/10 text-white">
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
            <Label className="text-white">Fonte mono</Label>
            <Select value={fontMono} onValueChange={setFontMono}>
              <SelectTrigger data-testid="select-font-mono" className="bg-white/5 border-white/10 text-white">
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

      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">SEO & Identidade</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="text-white">Imagem Open Graph</Label>
            {ogImageUrl && (
              <img src={ogImageUrl} alt="OG Image preview" className="w-40 h-24 object-cover rounded border border-white/10" />
            )}
            <div className="flex items-center gap-3">
              <Button
                type="button"
                data-testid="og-image-upload-button"
                variant="outline"
                size="sm"
                disabled={isUploadingOg}
                onClick={() => ogFileInputRef.current?.click()}
                className="border-white/20 text-white/80"
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
            <Label className="text-white">Título padrão do site</Label>
            <Input
              data-testid="input-site-title"
              value={siteTitle}
              onChange={(e) => setSiteTitle(e.target.value)}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white">Descrição padrão</Label>
            <Textarea
              data-testid="textarea-site-description"
              value={siteDescription}
              onChange={(e) => setSiteDescription(e.target.value)}
              className="bg-white/5 border-white/10 text-white"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white">Twitter/X handle (sem @)</Label>
            <Input
              data-testid="input-twitter-handle"
              value={twitterHandle}
              onChange={(e) => setTwitterHandle(e.target.value)}
              placeholder="usuario"
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white">Keywords</Label>
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
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white">Título da página Home (SEO)</Label>
            <Input
              data-testid="input-seo-home-title"
              value={seoHomeTitle}
              onChange={(e) => setSeoHomeTitle(e.target.value)}
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white">Descrição da página Home (SEO)</Label>
            <Textarea
              data-testid="textarea-seo-home-description"
              value={seoHomeDescription}
              onChange={(e) => setSeoHomeDescription(e.target.value)}
              className="bg-white/5 border-white/10 text-white"
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
