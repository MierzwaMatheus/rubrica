/**
 * Blocos do núcleo que o tema não redesenha (vídeo, incorporação, linha do tempo,
 * comparativo de planos): entram na conversa como os outros, com a pergunta de quem
 * visita e a resposta num balão largo. Dentro do balão vai o componente padrão do núcleo,
 * sem o título e o apoio (que viram a troca de mensagens). O bloco some quando o padrão
 * não teria o que mostrar, para não sobrar pergunta sem resposta.
 */
import type { BlockComponent, BlockProps } from "@rubrica/core";
import { parseEmbedUrl, parseVideoUrl } from "@rubrica/core";
import { ComparativoPlanosBlock, IncorporacaoBlock, LinhaDoTempoBlock, VideoBlock } from "@rubrica/core/components";
import { askFor, Bubble, ChatSection } from "./chat";

function inChat(type: string, Core: BlockComponent, hasContent: (props: BlockProps<any>) => boolean): BlockComponent {
  return function ChatCoreBlock(props: BlockProps<any>) {
    const { id, variant, fields, headingLevel, ctx } = props;
    if (!hasContent(props)) return null;
    return (
      <ChatSection id={id} anchor={fields.anchor} type={type} variant={variant} title={fields.title} level={headingLevel} ask={askFor(ctx, type)}>
        {fields.intro && <Bubble>{fields.intro}</Bubble>}
        <Bubble wide className="ct-core">
          <Core {...props} id={`${id}-c`} fields={{ ...fields, anchor: undefined, title: undefined, intro: undefined }} />
        </Bubble>
      </ChatSection>
    );
  };
}

const someTitled = (list: unknown) => Array.isArray(list) && list.some((x) => (x as { title?: string; label?: string }).title || (x as { label?: string }).label);

export const CHAT_CORE_BLOCKS: Record<string, BlockComponent> = {
  video: inChat("video", VideoBlock, (p) => !!parseVideoUrl(p.fields.url)),
  incorporacao: inChat("incorporacao", IncorporacaoBlock, (p) => !!parseEmbedUrl(p.fields.url)),
  "linha-do-tempo": inChat("linha-do-tempo", LinhaDoTempoBlock, (p) => someTitled(p.fields.items)),
  "comparativo-planos": inChat("comparativo-planos", ComparativoPlanosBlock, (p) => p.items.length > 0 && someTitled(p.fields.rows)),
};
