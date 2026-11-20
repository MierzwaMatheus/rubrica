/**
 * Ilha do bloco `imagens` na disposição "carrossel": o mesmo carrossel das telas do case
 * (botões, encaixe e a imagem grande numa janela), com as legendas e a imagem inteira
 * (sem recorte: marcas e GIFs aparecem completos). Sem JavaScript, o bloco é uma faixa
 * com rolagem lateral.
 */
import type { ResolvedImage } from "../blocks/fields";
import Carrossel from "./carrossel";

interface ImagensIslandProps {
  fields: { title?: string; items?: { image?: ResolvedImage; caption?: string }[] };
  texts: Record<string, string>;
}

export default function Imagens({ fields, texts }: ImagensIslandProps) {
  const items = (fields.items ?? []).filter((it): it is { image: ResolvedImage; caption?: string } => !!it?.image);
  return (
    <Carrossel
      images={items.map((it) => it.image)}
      captions={items.map((it) => it.caption)}
      title={fields.title ?? ""}
      label={fields.title}
      fit="contain"
      texts={texts}
    />
  );
}
