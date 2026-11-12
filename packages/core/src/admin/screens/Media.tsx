/**
 * Biblioteca de mídia: envio (com largura e altura lidas do arquivo), pastas, alt por
 * idioma, substituir o arquivo (atualiza o conteúdo que usa a imagem) e apagar
 * avisando onde ela é usada.
 */
import { useRef, useState } from "react";
import { Replace, Trash2, Upload } from "lucide-react";
import type { Localized } from "../../i18n";
import { api, type MediaDoc } from "../data/api";
import { useMutation, useQuery } from "../data/backend";
import { EditorLocaleProvider, LocaleTabs, LocalizedTextInput } from "../editor/fields";
import { folderLabel, MediaFolderNav } from "../editor/MediaFolders";
import { errorMessage } from "../editor/model";
import { PageHeader } from "../Layout";
import { Loading } from "../App";
import { contentLabel } from "../lib/labels";
import { toast } from "../lib/toast";
import { useUploadFile, useUploadImage } from "../lib/upload";
import { usePanel } from "../panel";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Alert, Input, Label, Spinner } from "../ui/form";

function formatSize(bytes?: number): string {
  if (!bytes) return "";
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

function MediaDialog({ media, onClose }: { media: MediaDoc; onClose: () => void }) {
  const update = useMutation(api.media.update);
  const remove = useMutation(api.media.remove);
  const replace = useMutation(api.panel.replaceMedia);
  const uploadFile = useUploadFile();
  const usage = useQuery(api.panel.mediaUsage, { id: media._id });
  const panel = usePanel();
  const fileInput = useRef<HTMLInputElement>(null);
  const [locale, setLocale] = useState(panel.locales.default);
  const [name, setName] = useState(media.name);
  const [folder, setFolder] = useState(media.folder);
  const [alt, setAlt] = useState<Localized<string> | undefined>(media.alt);
  const [busy, setBusy] = useState<string>();

  async function run(label: string, fn: () => Promise<unknown>, done: string) {
    setBusy(label);
    try {
      await fn();
      toast.success(done);
      return true;
    } catch (e) {
      toast.error(errorMessage(e));
      return false;
    } finally {
      setBusy(undefined);
    }
  }

  const used = usage?.reduce((n, u) => n + u.count, 0) ?? 0;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{media.name}</DialogTitle>
          <DialogDescription>
            {media.width && media.height ? `${media.width} × ${media.height}` : "Dimensões desconhecidas"} {media.size ? `· ${formatSize(media.size)}` : ""}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
          {media.url && <img src={media.url} alt="" className="w-full rounded-md border bg-muted object-contain" />}
          <EditorLocaleProvider value={{ locale, setLocale, locales: panel.locales.locales, defaultLocale: panel.locales.default, translation: false }}>
            <form
              className="space-y-3"
              onSubmit={async (e) => {
                e.preventDefault();
                if (await run("save", () => update({ id: media._id, name, folder, alt: alt ?? {} }), "Imagem atualizada.")) onClose();
              }}
            >
              <div className="space-y-1">
                <Label htmlFor="media-name">Nome</Label>
                <Input id="media-name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="media-folder">Pasta</Label>
                <Input id="media-folder" value={folder} onChange={(e) => setFolder(e.target.value)} placeholder="/blog/2026" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="media-alt">Texto alternativo padrão</Label>
                  <LocaleTabs value={alt} label="texto alternativo" />
                </div>
                <LocalizedTextInput id="media-alt" value={alt} onChange={setAlt} placeholder="Descreva a imagem" />
                <p className="text-xs text-muted-foreground">Vem preenchido quando a imagem é escolhida num bloco; cada uso pode ter o seu.</p>
              </div>
              <Button type="submit" disabled={!!busy}>
                {busy === "save" && <Spinner />} Salvar
              </Button>
            </form>
          </EditorLocaleProvider>
        </div>
        <div className="space-y-2 border-t pt-3 text-sm">
          <p className="font-medium">Onde é usada</p>
          {usage === undefined ? (
            <Spinner />
          ) : usage.length === 0 ? (
            <p className="text-muted-foreground">Em nenhum lugar do conteúdo.</p>
          ) : (
            <ul className="list-disc pl-5 text-muted-foreground">
              {usage.map((u) => (
                <li key={u.type + u.id}>
                  {u.label}
                  {u.type !== "siteSettings" && <span className="text-xs"> ({contentLabel(u.type)})</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
        <DialogFooter className="border-t pt-3">
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const ok = await run(
                "replace",
                async () => {
                  const up = await uploadFile(file);
                  const result = await replace({ id: media._id, ...up });
                  return result;
                },
                "Arquivo substituído em todo o conteúdo.",
              );
              if (ok) onClose();
            }}
          />
          <Button variant="outline" onClick={() => fileInput.current?.click()} disabled={!!busy}>
            {busy === "replace" ? <Spinner /> : <Replace />} Substituir arquivo
          </Button>
          <Button
            variant="destructive"
            disabled={!!busy}
            onClick={async () => {
              const warn = used ? `Esta imagem é usada em ${used} lugar(es); eles ficam sem imagem. ` : "";
              if (!window.confirm(`${warn}Apagar “${media.name}” de vez?`)) return;
              if (await run("remove", () => remove({ id: media._id }), "Imagem apagada.")) onClose();
            }}
          >
            <Trash2 /> Apagar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function Media() {
  const [folder, setFolder] = useState<string>();
  const media = useQuery(api.media.list, folder ? { folder } : {});
  const upload = useUploadImage();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<string>();
  const [open, setOpen] = useState<MediaDoc>();

  async function send(files: FileList | null) {
    if (!files?.length) return;
    let ok = 0;
    for (const file of Array.from(files)) {
      setBusy(`Enviando ${file.name}…`);
      try {
        await upload(file, folder ?? "/");
        ok++;
      } catch (e) {
        toast.error(errorMessage(e));
      }
    }
    setBusy(undefined);
    if (ok) toast.success(ok === 1 ? "Imagem enviada." : `${ok} imagens enviadas.`);
    if (input.current) input.current.value = "";
  }

  return (
    <>
      <PageHeader
        title="Mídia"
        description="Imagens do site. Largura e altura são lidas no envio (evitam o salto de layout); o texto alternativo é por idioma."
        actions={
          <>
            <input ref={input} type="file" accept="image/*" multiple className="hidden" onChange={(e) => send(e.target.files)} />
            <Button onClick={() => input.current?.click()} disabled={!!busy}>
              {busy ? <Spinner /> : <Upload />} Enviar imagens
            </Button>
          </>
        }
      />
      <div className="grid gap-6 p-6 md:grid-cols-[200px_1fr]">
        <MediaFolderNav value={folder} onChange={setFolder} />
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            void send(e.dataTransfer.files);
          }}
        >
          {busy && <Alert className="mb-3">{busy}</Alert>}
          {media === undefined ? (
            <Loading />
          ) : media.length === 0 ? (
            <p className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">Nenhuma imagem {folder ? "nesta pasta" : "ainda"}. Arraste arquivos para cá ou use “Enviar imagens”.</p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
              {media.map((m) => (
                <li key={m._id}>
                  <button type="button" onClick={() => setOpen(m)} className="block w-full cursor-pointer overflow-hidden rounded-lg border bg-card text-left hover:ring-2 hover:ring-primary">
                    {m.url ? <img src={m.url} alt={m.alt?.[Object.keys(m.alt)[0] ?? ""] ?? ""} loading="lazy" className="aspect-square w-full bg-muted object-cover" /> : <div className="aspect-square bg-muted" />}
                    <span className="block truncate px-2 pt-1.5 text-xs font-medium">{m.name}</span>
                    <span className="block px-2 pb-1.5 text-xs text-muted-foreground">
                      {m.width && m.height ? `${m.width}×${m.height}` : "—"} · {folderLabel(m.folder)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      {open && <MediaDialog key={open._id} media={open} onClose={() => setOpen(undefined)} />}
    </>
  );
}
