/** Envio de imagem para a biblioteca: dimensões, upload e registro. */
import { api } from "../data/api";
import { useBackend, useMutation } from "../data/backend";
import type { Localized } from "../../i18n";

export async function imageSize(file: File): Promise<{ width?: number; height?: number }> {
  try {
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      return img.naturalWidth && img.naturalHeight ? { width: img.naturalWidth, height: img.naturalHeight } : {};
    } finally {
      URL.revokeObjectURL(url);
    }
  } catch {
    return {};
  }
}

export function useUploadImage() {
  const backend = useBackend();
  const generate = useMutation(api.media.generateUploadUrl);
  const save = useMutation(api.media.save);
  return async (file: File, folder = "/", alt?: Localized<string>) => {
    if (!file.type.startsWith("image/")) throw new Error(`${file.name}: envie uma imagem (PNG, JPG, WebP, AVIF, GIF ou SVG)`);
    const size = await imageSize(file);
    const url = await generate({});
    const storageId = await backend.upload(url, file);
    const saved = await save({ storageId, name: file.name, folder, ...(alt ? { alt } : {}), ...size });
    return { id: saved.id, url: saved.url ?? "", storageId, ...size };
  };
}

/** Só o arquivo, para substituir uma imagem (`panel.replaceMedia`). */
export function useUploadFile() {
  const backend = useBackend();
  const generate = useMutation(api.media.generateUploadUrl);
  return async (file: File) => {
    if (!file.type.startsWith("image/")) throw new Error(`${file.name}: envie uma imagem`);
    const size = await imageSize(file);
    const storageId = await backend.upload(await generate({}), file);
    return { storageId, ...size };
  };
}
