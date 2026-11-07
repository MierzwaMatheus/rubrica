import { AlertTriangle, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ImagePicker } from "@/components/admin/ImagePicker";
import { isValidSlug } from "@/lib/slug";

/** Limites a partir dos quais o Google costuma cortar o texto no resultado da busca. */
export const SEO_TITLE_MAX = 60;
export const SEO_DESCRIPTION_MAX = 160;

interface BlogSeoFieldsProps {
  slug: string;
  onSlugChange: (slug: string) => void;
  /** Post já publicado com slug diferente do salvo: o endereço antigo deixa de funcionar. */
  slugChangedOnPublished: boolean;
  seoTitle: string;
  onSeoTitleChange: (value: string) => void;
  seoDescription: string;
  onSeoDescriptionChange: (value: string) => void;
  /** Imagem de compartilhamento escolhida (URL para a prévia), ou null. */
  ogImagePreview: string | null;
  onOgImagePick: (id: string | string[]) => void;
  onOgImageClear: () => void;
  /** Usados quando os campos de SEO ficam vazios. */
  fallbackTitle: string;
  fallbackDescription: string;
  fallbackImage: string | null;
  siteUrl: string;
  siteTitle: string;
}

function Counter({ length, max }: { length: number; max: number }) {
  const over = length > max;
  return (
    <span className={`text-xs tabular-nums ${over ? "text-amber-400" : "text-foreground/50"}`}>
      {length}/{max}
    </span>
  );
}

/** Prévia aproximada de como o post aparece no resultado do Google. */
export function GoogleSnippetPreview({
  url,
  title,
  description,
}: {
  url: string;
  title: string;
  description: string;
}) {
  const crumbs = url.replace(/^https?:\/\//, "").replace(/\/+$/, "").split("/").join(" › ");
  const cut = (text: string, max: number) => (text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text);
  return (
    <div className="rounded-lg border border-foreground/10 bg-white p-4 font-sans" data-testid="google-preview">
      <p className="truncate text-xs text-[#4d5156]">{crumbs}</p>
      <p className="mt-1 text-lg leading-snug text-[#1a0dab]">{cut(title, SEO_TITLE_MAX + 10)}</p>
      <p className="mt-1 text-sm leading-normal text-[#4d5156]">
        {description ? cut(description, SEO_DESCRIPTION_MAX) : "Sem descrição: o Google escolhe um trecho do texto."}
      </p>
    </div>
  );
}

export function BlogSeoFields({
  slug,
  onSlugChange,
  slugChangedOnPublished,
  seoTitle,
  onSeoTitleChange,
  seoDescription,
  onSeoDescriptionChange,
  ogImagePreview,
  onOgImagePick,
  onOgImageClear,
  fallbackTitle,
  fallbackDescription,
  fallbackImage,
  siteUrl,
  siteTitle,
}: BlogSeoFieldsProps) {
  const base = siteUrl.replace(/\/+$/, "");
  const slugInvalid = slug.length > 0 && !isValidSlug(slug);
  const effectiveTitle = seoTitle.trim() || fallbackTitle;
  const fullTitle = !siteTitle || effectiveTitle.includes(siteTitle) ? effectiveTitle : `${effectiveTitle} | ${siteTitle}`;
  const effectiveDescription = seoDescription.trim() || fallbackDescription;
  const shareImage = ogImagePreview || fallbackImage;

  return (
    <section className="space-y-4 rounded-lg border border-foreground/10 p-4" aria-labelledby="seo-heading">
      <div>
        <h3 id="seo-heading" className="font-semibold text-foreground-strong">SEO e compartilhamento</h3>
        <p className="text-sm text-foreground/65">
          Tudo opcional. Em branco, o site usa o título, o subtítulo e a capa do post. O inglês é traduzido ao salvar.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug" className="text-foreground-strong">Endereço (slug)</Label>
        <div className="flex items-center gap-1 text-sm">
          <span className="shrink-0 text-foreground/50">/blog/</span>
          <Input
            id="slug"
            value={slug}
            onChange={(e) => onSlugChange(e.target.value)}
            aria-invalid={slugInvalid || slug.length === 0}
            className="bg-foreground/5 border-foreground/10 text-foreground-strong"
          />
        </div>
        {slugInvalid && (
          <p className="text-xs text-red-400">Use só letras minúsculas, números e hífen, começando por letra ou número.</p>
        )}
        {slugChangedOnPublished && (
          <p className="flex items-start gap-1.5 text-xs text-amber-400">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Este post já está publicado: mudar o endereço quebra links compartilhados e o que o Google já indexou.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="seoTitle" className="text-foreground-strong">Título para o Google</Label>
          <Counter length={seoTitle.length} max={SEO_TITLE_MAX} />
        </div>
        <Input
          id="seoTitle"
          value={seoTitle}
          onChange={(e) => onSeoTitleChange(e.target.value)}
          placeholder={fallbackTitle || "Usa o título do post"}
          className="bg-foreground/5 border-foreground/10 text-foreground-strong"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="seoDescription" className="text-foreground-strong">Descrição para o Google</Label>
          <Counter length={seoDescription.length} max={SEO_DESCRIPTION_MAX} />
        </div>
        <Textarea
          id="seoDescription"
          value={seoDescription}
          onChange={(e) => onSeoDescriptionChange(e.target.value)}
          placeholder={fallbackDescription || "Usa o subtítulo do post"}
          rows={3}
          className="bg-foreground/5 border-foreground/10 text-foreground-strong"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-foreground-strong">Imagem de compartilhamento</Label>
        <p className="text-xs text-foreground/50">Aparece no WhatsApp, LinkedIn e afins. Ideal: 1200×630. Em branco, usa a capa.</p>
        <div className="flex items-center gap-3">
          {shareImage ? (
            <img src={shareImage} alt="" className="h-16 w-[122px] rounded object-cover" />
          ) : (
            <div className="flex h-16 w-[122px] items-center justify-center rounded bg-foreground/5 text-xs text-foreground/50">
              Imagem do site
            </div>
          )}
          <ImagePicker onSelect={onOgImagePick} />
          {ogImagePreview && (
            <Button type="button" variant="ghost" size="sm" onClick={onOgImageClear} className="text-foreground/65">
              <X className="mr-1 h-4 w-4" /> Usar a capa
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-foreground-strong">Prévia no Google</Label>
        <GoogleSnippetPreview url={`${base}/blog/${slug}`} title={fullTitle} description={effectiveDescription} />
      </div>
    </section>
  );
}
