/**
 * Mensagens entre o painel e o iframe da prévia (`/admin/preview`). Mesma origem nos
 * dois lados: quem recebe confere `event.origin` e o `source`.
 */
import type { PageRecord, SiteSettings } from "../../content/types";
import type { SiteSnapshot } from "../../data/source";
import type { Locale } from "../../i18n";

export const PREVIEW_PATH = "/admin/preview";

export type ToPreview =
  /** Base publicada (muda pouco): manda uma vez e quando o backend atualiza. */
  | { type: "rubrica:preview:base"; snapshot: SiteSnapshot }
  /** Rascunho (muda a cada tecla). */
  | { type: "rubrica:preview:draft"; page: PageRecord; locale: Locale; settings?: SiteSettings; selected?: string; scrollToSelected?: boolean };

export type FromPreview =
  | { type: "rubrica:preview:ready" }
  /** A pessoa clicou num bloco na prévia. */
  | { type: "rubrica:preview:select"; blockId: string };

export function isPreviewMessage<T extends { type: string }>(data: unknown, types: readonly T["type"][]): data is T {
  return typeof data === "object" && data !== null && types.includes((data as { type?: string }).type as T["type"]);
}
