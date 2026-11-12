/**
 * Escolher imagem da biblioteca (navegando pelas pastas, como na tela de Mídia), enviar
 * uma nova para a pasta aberta ou usar um endereço externo.
 */
import { useRef, useState } from "react";
import { Upload } from "lucide-react";
import type { Localized } from "../../i18n";
import { api, type MediaDoc } from "../data/api";
import { useQuery } from "../data/backend";
import { errorMessage } from "./model";
import { MediaFolderNav } from "./MediaFolders";
import { toast } from "../lib/toast";
import { useUploadImage } from "../lib/upload";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input, Label, Spinner } from "../ui/form";

export interface PickedImage {
  url: string;
  storageId?: string;
  alt?: Localized<string>;
  width?: number;
  height?: number;
}

export function MediaPicker({ onPick, onClose }: { onPick: (image: PickedImage) => void; onClose: () => void }) {
  const [folder, setFolder] = useState<string>();
  const media = useQuery(api.media.list, folder ? { folder } : {});
  const upload = useUploadImage();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState("");
  const [filter, setFilter] = useState("");
  const pick = (m: MediaDoc) => m.url && onPick({ url: m.url, storageId: m.storageId, alt: m.alt, width: m.width, height: m.height });
  const shown = (media ?? []).filter((m) => !filter || `${m.name} ${m.folder}`.toLowerCase().includes(filter.toLowerCase()));

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Escolher imagem</DialogTitle>
          <DialogDescription>Da biblioteca de mídia, um envio novo (vai para a pasta aberta) ou um endereço externo.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Input placeholder="Buscar por nome ou pasta" value={filter} onChange={(e) => setFilter(e.target.value)} className="max-w-xs" aria-label="Buscar imagem" />
          <input
            ref={input}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setBusy(true);
              try {
                const saved = await upload(file, folder ?? "/");
                onPick({ url: saved.url, storageId: saved.storageId, width: saved.width, height: saved.height });
              } catch (err) {
                toast.error(errorMessage(err));
              } finally {
                setBusy(false);
              }
            }}
          />
          <Button variant="outline" onClick={() => input.current?.click()} disabled={busy}>
            {busy ? <Spinner /> : <Upload />} Enviar imagem
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
          <MediaFolderNav value={folder} onChange={setFolder} className="max-h-[50vh] overflow-y-auto" />
          <div>
            {media === undefined ? (
              <Spinner />
            ) : shown.length === 0 ? (
              <p className="text-sm text-muted-foreground">{filter ? "Nenhuma imagem com esse nome." : folder ? "Nenhuma imagem nesta pasta." : "Nenhuma imagem na biblioteca ainda."}</p>
            ) : (
              <ul className="grid max-h-[50vh] grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
                {shown.map((m) => (
                  <li key={m._id}>
                    <button type="button" onClick={() => pick(m)} className="group block w-full cursor-pointer overflow-hidden rounded-md border text-left hover:ring-2 hover:ring-primary">
                      {m.url && <img src={m.url} alt="" className="aspect-square w-full bg-muted object-cover" loading="lazy" />}
                      <span className="block truncate px-1.5 py-1 text-xs">{m.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <form
          className="flex items-end gap-2 border-t pt-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (/^(https?:\/\/|\/)/.test(url)) onPick({ url });
          }}
        >
          <div className="flex-1 space-y-1">
            <Label htmlFor="picker-url" className="text-xs">
              Ou um endereço externo
            </Label>
            <Input id="picker-url" placeholder="https://…" value={url} onChange={(e) => setUrl(e.target.value)} />
          </div>
          <Button type="submit" variant="secondary" disabled={!/^(https?:\/\/|\/)/.test(url)}>
            Usar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
